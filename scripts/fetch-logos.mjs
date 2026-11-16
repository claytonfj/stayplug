// Télécharge une image de profil pour chaque marque depuis son site officiel
// et l'enregistre dans public/logos/<id>.png (256 px max).
//
// Usage : node scripts/fetch-logos.mjs [--brand=id] [--force] [--skip-og]
//
// Ordre de préférence : icône d'appli (apple-touch-icon, carrée et nette),
// grand favicon, favicon Shopify demandé en 256 px, logo de l'en-tête,
// image de partage (og:image). Une image trop petite (< 96 px) est ignorée.
// Le redimensionnement utilise `sips` (macOS) ; sans lui, l'image est gardée telle quelle.

import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA = new URL('../public/data/', import.meta.url);
const LOGOS = fileURLToPath(new URL('../public/logos/', import.meta.url));
const USER_AGENT = 'Mozilla/5.0 (compatible; StayPlugBot/1.0; agregateur personnel de marques)';
const MIN = 96;

const args = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, v = true] = a.replace(/^--/, '').split('='); return [k, v]; }));
const hasSips = (() => { try { execFileSync('sips', ['--help'], { stdio: 'ignore' }); return true; } catch { return false; } })();

async function get(url, type = 'text') {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, redirect: 'follow', signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return type === 'text' ? res.text() : { buf: Buffer.from(await res.arrayBuffer()), type: res.headers.get('content-type') || '' };
}

const attr = (tag, name) => tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, 'i'))?.[1];
const decode = (s) => s.replace(/&amp;/g, '&');

// Favicon Shopify : on redemande la même image en 256 px.
function bigShopify(url) {
  if (!/\/cdn\/shop\/|cdn\.shopify\.com/.test(url)) return url;
  const u = new URL(url);
  u.searchParams.delete('crop');
  u.searchParams.set('width', '256');
  u.searchParams.set('height', '256');
  return u.href;
}

function candidates(html, site) {
  const out = [];
  const abs = (h) => { try { return new URL(decode(h), site).href; } catch { return null; } };
  const links = html.match(/<link\b[^>]*>/gi) || [];
  const icons = links
    .map((t) => ({ rel: (attr(t, 'rel') || '').toLowerCase(), href: attr(t, 'href'), size: Number((attr(t, 'sizes') || '').split('x')[0]) || 0 }))
    .filter((l) => l.href && /icon/.test(l.rel));
  for (const l of icons.filter((l) => l.rel.includes('apple-touch')).sort((a, b) => b.size - a.size)) out.push(abs(l.href));
  for (const l of icons.filter((l) => !l.rel.includes('apple-touch')).sort((a, b) => b.size - a.size)) out.push(abs(bigShopify(abs(l.href) || '')));
  // Logo de l'en-tête (thèmes Shopify et la plupart des sites).
  for (const img of html.match(/<img\b[^>]*>/gi) || []) {
    const cls = `${attr(img, 'class') || ''} ${attr(img, 'alt') || ''} ${attr(img, 'src') || ''}`.toLowerCase();
    if (!/logo/.test(cls)) continue;
    const src = attr(img, 'src') || attr(img, 'data-src');
    if (src && !src.startsWith('data:')) { out.push(abs(bigShopify(abs(src) || ''))); break; }
  }
  // og:image est souvent une photo produit : seulement en dernier recours.
  const og = (html.match(/<meta\b[^>]*(property|name)=["']og:image["'][^>]*>/i) || [])[0];
  if (og && attr(og, 'content') && !args['skip-og']) out.push(abs(attr(og, 'content')));
  return [...new Set(out.filter(Boolean))];
}

function size(file) {
  if (!hasSips) return MIN;
  try {
    const o = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', file], { encoding: 'utf8' });
    return Math.min(Number(o.match(/pixelWidth: (\d+)/)?.[1]), Number(o.match(/pixelHeight: (\d+)/)?.[1])) || 0;
  } catch { return 0; }
}

// Télécharge, vérifie la taille, enregistre en PNG 256 px max.
export async function saveImage(url, id) {
  const { buf, type } = await get(url, 'buf');
  if (!/image|octet-stream/.test(type) || buf.length < 200) throw new Error('pas une image');
  if (/svg/.test(type) || /\.svg(\?|$)/.test(url)) throw new Error('svg');
  const tmp = join(tmpdir(), `stayplug-logo-${id}`);
  await writeFile(tmp, buf);
  try {
    if (size(tmp) < MIN) throw new Error('trop petite');
    const dest = join(LOGOS, `${id}.png`);
    if (hasSips) execFileSync('sips', ['-s', 'format', 'png', '-Z', '256', tmp, '--out', dest], { stdio: 'ignore' });
    else await writeFile(dest, buf);
    return `logos/${id}.png`;
  } finally {
    await rm(tmp, { force: true });
  }
}

async function logoFor(brand) {
  const html = await get(brand.site);
  const list = candidates(html, brand.site);
  if (brand.logo && /^https?:/.test(brand.logo)) list.push(bigShopify(brand.logo));
  for (const url of list) {
    try { return await saveImage(url, brand.id); } catch {}
  }
  throw new Error(`aucune image utilisable (${list.length} essayées)`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await mkdir(LOGOS, { recursive: true });
  const file = JSON.parse(await readFile(new URL('brands.json', DATA), 'utf8'));
  const targets = file.brands.filter((b) =>
    b.site && (!args.brand || b.id === args.brand) && (args.force || !b.logo || /^https?:/.test(b.logo) || !existsSync(join(LOGOS, `${b.id}.png`))));
  let ok = 0;
  for (const brand of targets) {
    process.stdout.write(`• ${brand.name} … `);
    try { brand.logo = await logoFor(brand); ok++; console.log('ok'); }
    catch (e) { console.log(e.message); }
  }
  // Images ajoutées à la main dans public/logos/<id>.png (ex. photo de profil Instagram).
  let manual = 0;
  for (const brand of file.brands) {
    if (!brand.logo && existsSync(join(LOGOS, `${brand.id}.png`))) { brand.logo = `logos/${brand.id}.png`; manual++; }
  }
  await writeFile(new URL('brands.json', DATA), JSON.stringify(file, null, 2));
  console.log(`\n${ok}/${targets.length} logos enregistrés${manual ? `, ${manual} ajoutés à la main` : ''}.`);
}
