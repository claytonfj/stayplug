// Reclasse les articles déjà téléchargés avec les règles actuelles de
// categorize.mjs, sans retélécharger les catalogues.
//
// Usage : node scripts/recategorize.mjs
//
// products.json garde le titre (et le type Shopify pour les articles
// téléchargés récemment).

import { readFile, writeFile } from 'node:fs/promises';
import { categorize, isClothing, isWomenOnly, LEGACY, normalize } from './categorize.mjs';

const FILE = new URL('../public/data/products.json', import.meta.url);

const data = JSON.parse(await readFile(FILE, 'utf8'));
const brands = JSON.parse(await readFile(new URL('../public/data/brands.json', import.meta.url), 'utf8')).brands;
const exclude = new Map(brands.map((b) => [b.id, (b.exclude || []).map(normalize)]));
const excluded = (p) => (exclude.get(p.brandId) || []).some((w) => normalize(p.title).includes(w));
const counts = {};
const kept = [];
let dropped = 0;
for (const p of data.products) {
  const old = p.category;
  const fresh = categorize({ title: p.title, productType: p.type });
  // Le titre décide quand il nomme la pièce ; sinon on garde l'ancienne
  // catégorie (venue du type produit Shopify au téléchargement).
  const next = fresh !== 'autres' ? fresh : LEGACY[old] ?? old;
  // Objets hors vêtements et articles non reconnus : retirés du site.
  if (!isClothing({ title: p.title }, next) || isWomenOnly({ title: p.title }) || excluded(p)) { dropped++; continue; }
  p.category = next;
  counts[next] = (counts[next] || 0) + 1;
  kept.push(p);
}
data.products = kept;
await writeFile(FILE, JSON.stringify(data));
console.log(counts);
console.log(`${kept.length} articles gardés, ${dropped} retirés.`);
