// Récupère la photo de profil Instagram de chaque marque (balise og:image de la
// page publique du compte, sans connexion) et l'enregistre dans public/logos/<id>.png.
//
// Usage : node scripts/fetch-insta-avatars.mjs [--brand=id] [--missing] [--delay=2500]
//   --missing : seulement les marques sans logo local
//   --only    : liste d'ids séparés par des virgules
//   --delay   : pause entre deux comptes (ms), pour ne pas se faire bloquer
//
// Si Instagram limite (logo générique 3 fois de suite), le script s'arrête :
// relance plus tard avec --missing ou --only.

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { saveImage } from './fetch-logos.mjs';

const DATA = new URL('../public/data/', import.meta.url);
const LOGOS = fileURLToPath(new URL('../public/logos/', import.meta.url));
const USER_AGENT = 'Mozilla/5.0 (compatible; StayPlugBot/1.0; agregateur personnel de marques)';

const args = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, v = true] = a.replace(/^--/, '').split('='); return [k, v]; }));
const delay = Number(args.delay) || 2500;
const only = args.only ? String(args.only).split(',') : null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function avatarUrl(handle) {
  const res = await fetch(`https://www.instagram.com/${encodeURIComponent(handle)}/`, {
    headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'fr-FR,fr;q=0.9' },
    signal: AbortSignal.timeout(15000),
  });
  if (res.status === 429) throw Object.assign(new Error('limite Instagram (429)'), { stop: true });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const m = html.match(/<meta property="og:image" content="([^"]+)"/);
  if (!m) throw new Error('pas de photo (compte introuvable ou page de connexion)');
  const url = m[1].replace(/&amp;/g, '&');
  // Les vraies photos de profil sont sous /t51.xxxx-19/. Sinon Instagram renvoie
  // son logo générique : c'est qu'il limite les requêtes.
  if (!/\/t51\.[\d]+-19\//.test(url)) throw Object.assign(new Error('logo Instagram générique (limite)'), { limited: true });
  return url;
}

const file = JSON.parse(await readFile(new URL('brands.json', DATA), 'utf8'));
const targets = file.brands.filter((b) =>
  b.instagram && (!args.brand || b.id === args.brand) && (!only || only.includes(b.id)) &&
  (!args.missing || !b.logo || /^https?:/.test(b.logo) || !existsSync(join(LOGOS, `${b.id}.png`))));

let ok = 0;
let limited = 0;
const failed = [];
for (const [i, brand] of targets.entries()) {
  process.stdout.write(`[${i + 1}/${targets.length}] ${brand.name} (@${brand.instagram}) … `);
  try {
    brand.logo = await saveImage(await avatarUrl(brand.instagram), brand.id);
    ok++;
    limited = 0;
    console.log('ok');
  } catch (e) {
    console.log(e.message);
    failed.push(brand.id);
    if (e.limited) limited++;
    if (e.stop || limited >= 3) { console.log('Instagram limite les requêtes : arrêt. Relance plus tard.'); break; }
  }
  // Sauvegarde au fil de l'eau : une interruption ne perd rien.
  await writeFile(new URL('brands.json', DATA), JSON.stringify(file, null, 2));
  if (i < targets.length - 1) await sleep(delay);
}

console.log(`\n${ok}/${targets.length} photos Instagram enregistrées.`);
if (failed.length) console.log(`Échecs : ${failed.join(', ')}`);
