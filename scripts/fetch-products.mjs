// Récupère le catalogue public des marques sous Shopify (/products.json)
// et écrit public/data/products.json + met à jour public/data/brands.json.
//
// Usage : node scripts/fetch-products.mjs [--brand=id] [--max-pages=4]
//
// Le script reste poli : une requête à la fois, une pause entre chaque,
// et il respecte les réponses 429 (trop de requêtes) au lieu d'insister.

import { readFile, writeFile } from 'node:fs/promises';
import { categorize, isClothing, isWomenOnly, normalize } from './categorize.mjs';

const DATA = new URL('../public/data/', import.meta.url);
const USER_AGENT = 'StayPlugBot/1.0 (agrégateur personnel de marques)';
const DELAY_MS = 1500;
const PAGE_SIZE = 250;

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => a.replace(/^--/, '').split('='))
);
const MAX_PAGES = Number(args['max-pages'] || 4);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    });
    if (res.status === 429) {
      const wait = Number(res.headers.get('retry-after')) * 1000 || 10000 * (i + 1);
      console.log(`    429, pause ${wait / 1000}s`);
      await sleep(wait);
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const type = res.headers.get('content-type') || '';
    if (!type.includes('json')) throw new Error('pas un catalogue Shopify');
    return res.json();
  }
  throw new Error('trop de requêtes (429), réessaie plus tard');
}

// Lit la page d'accueil : logo et devise de la boutique.
async function shopInfo(site) {
  const info = { logo: null, currency: null };
  try {
    const res = await fetch(site, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(15000),
    });
    const html = await res.text();
    info.currency = html.match(/Shopify\.currency\s*=\s*\{"active":"([A-Z]{3})"/)?.[1] || null;
    const m =
      html.match(/<link[^>]+rel=["']apple-touch-icon[^"']*["'][^>]*href=["']([^"']+)["']/i) ||
      html.match(/<link[^>]+href=["']([^"']+)["'][^>]*rel=["']apple-touch-icon[^"']*["']/i) ||
      html.match(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i);
    if (m) info.logo = new URL(m[1], site).href;
  } catch {}
  return info;
}

function toProduct(p, brand, origin) {
  const variants = p.variants || [];
  const prices = variants.map((v) => Number(v.price)).filter((n) => n > 0);
  const price = prices.length ? Math.min(...prices) : null;
  const cheapest = variants.find((v) => Number(v.price) === price);
  const compareAt = cheapest && Number(cheapest.compare_at_price) > price ? Number(cheapest.compare_at_price) : null;
  return {
    id: `${brand.id}-${p.id}`,
    brandId: brand.id,
    title: p.title,
    type: p.product_type || undefined,
    price,
    compareAt,
    currency: brand.currency || 'EUR',
    image: p.images?.[0]?.src || null,
    url: `${origin}/products/${p.handle}`,
    category: categorize({ productType: p.product_type, title: p.title, tags: p.tags }),
    available: variants.some((v) => v.available !== false),
    createdAt: p.published_at || p.created_at,
  };
}

// "exclude" dans brands.json : mots qui retirent des articles précis d'une marque.
const excluded = (brand, title) =>
  (brand.exclude || []).some((w) => normalize(title).includes(normalize(w)));

async function fetchBrand(brand) {
  const origin = new URL(brand.site).origin;
  // Marque mixte : "collection" dans brands.json limite au rayon homme.
  const base = brand.collection ? `${origin}/collections/${brand.collection}` : origin;
  const out = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const data = await getJson(`${base}/products.json?limit=${PAGE_SIZE}&page=${page}`);
    const items = data.products || [];
    // Vêtements homme / unisexe seulement : pas d'articles femme, ni d'objets (pins, tapis, mugs…).
    const forMen = items.filter((p) => {
      const info = { productType: p.product_type, title: p.title, tags: p.tags };
      return !isWomenOnly(info) && isClothing(info) && !excluded(brand, p.title);
    });
    out.push(...forMen.map((p) => toProduct(p, brand, origin)));
    if (items.length < PAGE_SIZE) break;
    await sleep(DELAY_MS);
  }
  return out.filter((p) => p.price !== null && p.available);
}

const brandsFile = JSON.parse(await readFile(new URL('brands.json', DATA), 'utf8'));
let previous = { products: [] };
try {
  previous = JSON.parse(await readFile(new URL('products.json', DATA), 'utf8'));
} catch {}
if (brandsFile.demo) previous = { products: [] };

const targets = brandsFile.brands.filter((b) => b.site && (!args.brand || b.id === args.brand));
const byBrand = new Map();
for (const p of previous.products) {
  if (!byBrand.has(p.brandId)) byBrand.set(p.brandId, []);
  byBrand.get(p.brandId).push(p);
}

for (const brand of targets) {
  process.stdout.write(`• ${brand.name} … `);
  const info = await shopInfo(brand.site);
  if (info.currency) brand.currency = info.currency;
  if (!brand.logo) brand.logo = info.logo;
  try {
    const products = await fetchBrand(brand);
    byBrand.set(brand.id, products);
    brand.shopify = true;
    console.log(`${products.length} articles`);
  } catch (e) {
    // On garde les articles déjà connus si la marque ne répond pas aujourd'hui.
    brand.shopify = brand.shopify && byBrand.has(brand.id);
    console.log(`ignorée (${e.message})`);
  }
  await sleep(DELAY_MS);
}

const known = new Set(brandsFile.brands.map((b) => b.id));
const products = [...byBrand.entries()]
  .filter(([id]) => known.has(id))
  .flatMap(([, list]) => list);

const now = new Date().toISOString();
delete brandsFile.demo;
brandsFile.updatedAt = now;
await writeFile(new URL('brands.json', DATA), JSON.stringify(brandsFile, null, 2));
await writeFile(new URL('products.json', DATA), JSON.stringify({ updatedAt: now, products }));
console.log(`\n${products.length} articles au total, ${brandsFile.brands.length} marques.`);
