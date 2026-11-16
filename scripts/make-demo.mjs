// Génère des marques et articles fictifs pour tester l'interface
// en attendant les vraies données (export Instagram).

import { writeFile } from 'node:fs/promises';
import { categorize } from './categorize.mjs';

const BRANDS = [
  ['atelier-nord', 'Atelier Nord'], ['maison-ocre', 'Maison Ocre'], ['lune-denim', 'Lune Denim'],
  ['sillage', 'Sillage'], ['basalte', 'Basalte'], ['clairiere', 'Clairière'],
  ['studio-ferro', 'Studio Ferro'], ['rive-knit', 'Rive Knit Co.'], ['pavot', 'Pavot'],
  ['marelle', 'Marelle Paris'],
];

const ITEMS = [
  ['Jean droit brut', 89, 140], ['Jean baggy délavé', 95, 150], ['Jean slim noir', 79, 120],
  ['Pantalon chino coton', 69, 110], ['Pantalon cargo ripstop', 85, 130], ['Pantalon à pinces laine', 110, 180],
  ['T-shirt épais col rond', 29, 55], ['T-shirt logo brodé', 35, 60], ['Polo maille piquée', 55, 90],
  ['Chemise oxford', 69, 110], ['Chemise en lin', 75, 120], ['Chemise flanelle à carreaux', 79, 120],
  ['Pull col roulé mérinos', 95, 160], ['Pull maille torsadée', 110, 180], ['Cardigan laine d\'agneau', 120, 190],
  ['Sweat à capuche molleton', 75, 120], ['Sweat col rond brodé', 69, 110], ['Sweat half-zip', 85, 130],
  ['Veste workwear canvas', 140, 220], ['Manteau en laine', 220, 380], ['Doudoune légère', 160, 260],
  ['Surchemise velours', 99, 150], ['Short en lin', 49, 80], ['Short de bain', 45, 75],
  ['Sneakers cuir blanc', 120, 190], ['Bottines Chelsea', 160, 240],
  ['Casquette 6 panels', 35, 55], ['Bonnet côtelé', 29, 45], ['Sac tote toile', 39, 70],
  ['Ceinture cuir', 49, 85], ['Chaussettes coton (lot de 3)', 19, 30], ['Écharpe laine', 59, 95],
  ['Boxer coton bio', 25, 35],
];

let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];

const brands = BRANDS.map(([id, name]) => ({
  id, name, instagram: id.replace(/-/g, '.'), site: null, logo: null,
}));

const products = [];
for (const b of brands) {
  const count = 10 + Math.floor(rand() * 12);
  const used = new Set();
  for (let i = 0; i < count; i++) {
    const [title, min, max] = pick(ITEMS);
    if (used.has(title)) continue;
    used.add(title);
    const price = Math.round(min + rand() * (max - min));
    const onSale = rand() < 0.2;
    products.push({
      id: `${b.id}-${products.length}`,
      brandId: b.id,
      title,
      price: onSale ? Math.round(price * 0.7) : price,
      compareAt: onSale ? price : null,
      currency: 'EUR',
      image: null,
      url: null,
      category: categorize({ title }),
      available: true,
      createdAt: new Date(Date.now() - Math.floor(rand() * 60) * 86400000).toISOString(),
    });
  }
}

const now = new Date().toISOString();
const dir = new URL('../public/data/', import.meta.url);
await writeFile(new URL('brands.json', dir), JSON.stringify({ demo: true, updatedAt: now, brands }, null, 2));
await writeFile(new URL('products.json', dir), JSON.stringify({ updatedAt: now, products }));
console.log(`Démo : ${brands.length} marques, ${products.length} articles.`);
