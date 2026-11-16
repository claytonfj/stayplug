// Lit l'export Instagram (following.json) et prépare la liste des comptes suivis.
//
// Usage : node scripts/import-instagram.mjs chemin/vers/following.json
//
// Écrit data/instagram-following.json : tous les comptes suivis, à trier
// ensuite (marques de vêtements ou non) et à compléter avec le site officiel.

import { readFile, writeFile, mkdir } from 'node:fs/promises';

const file = process.argv[2];
if (!file) {
  console.error('Usage : node scripts/import-instagram.mjs chemin/vers/following.json');
  process.exit(1);
}

const raw = JSON.parse(await readFile(file, 'utf8'));
// Selon la version de l'export, la liste est à la racine ou sous relationships_following,
// et le pseudo est dans string_list_data[].value ou dans title.
const entries = Array.isArray(raw) ? raw : raw.relationships_following || [];

const accounts = entries
  .map((e) => {
    const d = e.string_list_data?.[0] || {};
    const handle = d.value || e.title || d.href?.split('instagram.com/')[1]?.replace(/\/.*$/, '');
    return handle && {
      handle: handle.replace(/^_u\//, ''),
      url: `https://www.instagram.com/${handle}`,
      followedAt: d.timestamp ? new Date(d.timestamp * 1000).toISOString().slice(0, 10) : null,
    };
  })
  .filter(Boolean);

await mkdir(new URL('../data/', import.meta.url), { recursive: true });
const out = new URL('../data/instagram-following.json', import.meta.url);
await writeFile(out, JSON.stringify(accounts, null, 2));
console.log(`${accounts.length} comptes suivis → data/instagram-following.json`);
