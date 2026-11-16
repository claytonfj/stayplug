// Tailles disponibles d'un article Shopify, ramenées à un format commun :
//   lettres  : XS, S, M, L, XL, XXL, XXXL
//   nombres  : pointure EU (chaussures) ou tour de taille (bas), ex. "42", "32"
//   "TU"     : taille unique
// Les tailles en rupture de stock sont ignorées. Les tailles non reconnues
// (enfant, tailles maison "1/2/3"…) sont écartées.

const SIZE_OPTION = /\b(size|sizes|taille|tailles|pointure|grosse|größe|talla|taglia|maat|waist|shoe)\b/i;
const ONE_SIZE = /^(os|o\/s|osfa|osfm|f|u|tu|t\.u\.?|one ?size( fits (all|most))?|onesize|taille unique|unique|default title|free ?size|adjustable|ajustable)$/i;
const LETTER_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
// Pointures US / UK homme → EU (arrondi à l'entier inférieur).
const US_TO_EU = { 6: 39, 6.5: 39, 7: 40, 7.5: 40, 8: 41, 8.5: 42, 9: 42, 9.5: 43, 10: 44, 10.5: 44, 11: 45, 11.5: 45, 12: 46, 12.5: 46, 13: 47, 14: 48 };
const UK_TO_EU = { 5: 38, 5.5: 39, 6: 39, 6.5: 40, 7: 41, 7.5: 41, 8: 42, 8.5: 42, 9: 43, 9.5: 44, 10: 44, 10.5: 45, 11: 46, 11.5: 46, 12: 47, 13: 48 };

function letter(v) {
  const s = v.toLowerCase()
    .replace(/extra[- ]?/g, 'x')
    .replace(/\b(\d)x/g, (_, n) => 'x'.repeat(Number(n)))
    .replace(/\bx-/g, 'x')
    .replace(/xx-/g, 'xx')
    .replace(/small/, 's').replace(/medium/, 'm').replace(/large/, 'l')
    .replace(/[\s.\-]/g, '');
  const m = s.match(/^(x{0,6})(s|m|l)$/);
  if (!m) return null;
  if (m[2] === 'm') return m[1] ? null : 'M';
  if (m[2] === 's') return m[1] ? 'XS' : 'S';
  // XXXXL, 5XL… : rangés avec XXXL.
  return ['L', 'XL', 'XXL', 'XXXL'][Math.min(m[1].length, 3)];
}

// Une valeur d'option → liste de tailles ("S/M" → S et M).
export function parseSize(raw, shoe = false) {
  const v = String(raw || '')
    .replace(/\((on-?hand|pre-?order|precommande)\)/gi, ' ')
    .replace(/["”″]/g, '')
    .replace(/^\[(.*)\]$/, '$1')
    .replace(/^(men'?s?|homme|unisex)\s+/i, '')
    .trim();
  if (!v) return [];
  // "L (34)", "XS (W28)", "S (30\"-32\")" : la taille lettre suffit.
  const paren = v.match(/^(.+?)\s*\(.*\)$/);
  if (paren) return parseSize(paren[1], shoe);
  if (ONE_SIZE.test(v)) return ['TU'];
  if (/\b(kids?|enfants?|youth|junior|baby|bebe|toddler|\d+ ?(y|yrs|ans|mois|months?))\b/i.test(v)) return [];
  // "S/M", "L-XL", "S / M"
  const parts = v.split(/\s*[/|]\s*|\s+-\s+|(?<=[a-z])-(?=x?[sml]\b)/i);
  if (parts.length > 1 && parts.every((p) => letter(p))) return parts.map(letter);
  // "32/L", "30/M" : tour de taille + lettre, on garde les deux.
  const combo = v.match(/^(\d{2})\s*\/\s*([a-z]+)$/i);
  if (combo && letter(combo[2])) return [letter(combo[2]), combo[1]];
  const l = letter(v);
  if (l) return [l];
  // Pointures US / UK : "US 9", "9 US", "UK 8"
  const us = v.match(/\bus\s*(\d{1,2}(?:[.,]5)?)\b|\b(\d{1,2}(?:[.,]5)?)\s*us\b/i);
  if (us) { const eu = US_TO_EU[Number((us[1] || us[2]).replace(',', '.'))]; return eu ? [String(eu)] : []; }
  const uk = v.match(/\buk\s*(\d{1,2}(?:[.,]5)?)\b|\b(\d{1,2}(?:[.,]5)?)\s*uk\b/i);
  if (uk) { const eu = UK_TO_EU[Number((uk[1] || uk[2]).replace(',', '.'))]; return eu ? [String(eu)] : []; }
  // Chaussures : un nombre seul entre 4 et 14 est une pointure US.
  if (shoe && /^\d{1,2}(?:[.,]5)?$/.test(v) && Number(v.replace(',', '.')) <= 14) {
    const eu = US_TO_EU[Number(v.replace(',', '.'))];
    return eu ? [String(eu)] : [];
  }
  // "EU 42", "42", "42.5", "42 1/2", "W32", "W32 L34", "32/34"
  const n = v.match(/^(?:eu\s*|fr\s*|w\s*)?(\d{2})(?:[.,]5| 1\/2| ½)?(?:\s*eu)?(?:\s*(?:[x/]|l)\s*\d{2})?$/i);
  if (n) { const x = Number(n[1]); return x >= 24 && x <= 50 ? [String(x)] : []; }
  return [];
}

// Valeurs non reconnues (pour améliorer parseSize) : écrites si SIZES_DEBUG=fichier.
export const UNPARSED = new Map();

export function sizesOf(p, shoe = false) {
  const variants = (p.variants || []).filter((v) => v.available !== false);
  if (!variants.length) return [];
  const opts = p.options || [];
  let idx = opts.findIndex((o) => SIZE_OPTION.test(o.name || ''));
  // Pas d'option "taille" nommée : on essaie l'option unique si ses valeurs ressemblent à des tailles.
  if (idx < 0 && opts.length === 1) {
    const vals = opts[0].values || [];
    if (vals.length && vals.every((x) => parseSize(x, shoe).length)) idx = 0;
  }
  if (idx < 0) {
    // Une seule variante sans option de taille : taille unique.
    if (variants.length === 1 && /default title/i.test(variants[0].title || '')) return ['TU'];
    const k = `[option] ${opts.map((o) => o.name).join(' + ')}`;
    UNPARSED.set(k, (UNPARSED.get(k) || 0) + 1);
    return [];
  }
  const key = `option${idx + 1}`;
  const set = new Set(variants.flatMap((v) => {
    const out = parseSize(v[key], shoe);
    if (!out.length && v[key]) UNPARSED.set(v[key], (UNPARSED.get(v[key]) || 0) + 1);
    return out;
  }));
  return sortSizes([...set]);
}

export function sortSizes(list) {
  const rank = (s) => (s === 'TU' ? 1000 : LETTER_ORDER.includes(s) ? LETTER_ORDER.indexOf(s) : 100 + Number(s));
  return list.sort((a, b) => rank(a) - rank(b));
}
