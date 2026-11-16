// Classe un article dans une sous-catégorie (jeans, casquettes…) à partir de son
// type, son titre et ses tags. Chaque sous-catégorie appartient à une famille
// (Bas, Accessoires…) : le site affiche les familles, puis leurs sous-catégories.
//
// L'ordre des règles compte : "veste en jean" doit tomber dans Vestes, pas Jeans,
// et "short cargo" dans Shorts, pas Cargos.
//
// Garde FAMILIES identique à celle de public/app.js.

export const FAMILIES = [
  { id: 'hauts', label: 'Hauts', subs: [
    ['tshirts', 'T-shirts'], ['manches-longues', 'Manches longues'], ['debardeurs', 'Débardeurs'],
    ['maillots', 'Maillots'], ['chemises', 'Chemises'], ['hoodies', 'Hoodies'], ['sweats', 'Sweats'], ['pulls', 'Pulls'],
  ] },
  { id: 'bas', label: 'Bas', subs: [
    ['jeans', 'Jeans'], ['pantalons', 'Pantalons'], ['cargos', 'Cargos'], ['joggings', 'Joggings'], ['shorts', 'Shorts'],
  ] },
  { id: 'vestes', label: 'Vestes', subs: [
    ['vestes', 'Vestes'], ['doudounes', 'Doudounes'], ['manteaux', 'Manteaux'], ['gilets', 'Sans manches'],
  ] },
  { id: 'ensembles', label: 'Ensembles', subs: [['ensembles', 'Ensembles']] },
  { id: 'chaussures', label: 'Chaussures', subs: [
    ['sneakers', 'Sneakers'], ['boots', 'Boots'], ['claquettes', 'Claquettes'], ['chaussures', 'Autres chaussures'],
  ] },
  { id: 'accessoires', label: 'Accessoires', subs: [
    ['casquettes', 'Casquettes'], ['bonnets', 'Bonnets'], ['chapeaux', 'Bobs & chapeaux'], ['sacs', 'Sacs'],
    ['ceintures', 'Ceintures'], ['bijoux', 'Bijoux'], ['lunettes', 'Lunettes'], ['echarpes', 'Écharpes & gants'],
    ['accessoires', 'Autres accessoires'],
  ] },
  { id: 'sous-vetements', label: 'Sous-vêtements', subs: [['calecons', 'Caleçons'], ['chaussettes', 'Chaussettes']] },
  { id: 'autres', label: 'Autres', subs: [['autres', 'Autres']] },
];

// Ancien découpage (une seule catégorie par famille) → sous-catégorie par défaut.
export const LEGACY = {
  tshirts: 'tshirts', chemises: 'chemises', pulls: 'pulls', sweats: 'sweats', vestes: 'vestes',
  jeans: 'jeans', pantalons: 'pantalons', shorts: 'shorts', chaussures: 'chaussures',
  accessoires: 'accessoires', 'sous-vetements': 'calecons', autres: 'autres',
};

// Une pièce seule d'un survêtement ("Tracksuit Jacket"), sauf si le titre cite
// le haut ET le bas ("Hoodie & Sweatpants Tracksuit").
const BOTTOM_OR_TOP = /^(?!.*( & | and | \+ )).*\b(pants?|pantalons?|jackets?|vestes?|tops?|bottoms?|joggers?|joggings?|hoodies?|shorts?|sweatpants?|trousers?)\b/;

const RULES = [
  ['chaussettes', /\b(chaussettes?|socks?)\b/],
  ['calecons', /\b(sous-vetements?|boxers?|calecons?|slips?|briefs?|underwear|trunks?|jockstraps?)\b/],
  ['claquettes', /\b(claquettes?|slides?|sandales?|sandals?|tongs?|flip-?flops?|clogs?|crocs|slippers?)\b/],
  ['boots', /\b(boots?|bottines?|rangers|superboots?)\b/],
  ['sneakers', /\b(sneakers?|baskets?|trainers?|runners?|samba|gazelle|spezial|bape sta|(shark|sk8|flip|cross|bape) sta|sta (#|icon|os)|f50|adizero|hyperboost|climacool|megaride)\b/],
  ['chaussures', /\b(chaussures?|mocassins?|derbys?|shoes?|loafers?|espadrilles?|water moc)\b/],
  ['ensembles', /\b(ensembles?|sets?)\b/],
  ['ensembles', /\b(survetements?|tracksuits?|track ?suits?)\b/, BOTTOM_OR_TOP],
  ['casquettes', /\b(casquettes?|caps?|snapbacks?|truckers?|6 ?panels?|five ?panels?|new era|high crown|fitted)\b/],
  ['bonnets', /\b(bonnets?|beanies?|cagoules?|balaclavas?|skullies?|skully|skullcaps?|chapkas?|ski ?masks?)\b/],
  ['chapeaux', /\b(chapeaux?|hats?|bobs?|bucket|buckethats?|berets?)\b/],
  ['sacs', /\b(sacs?|bags?|totes?|totebags?|backpacks?|sacoches?|banane|crossbody|duffle|handbags?|besaces?|pouch(es)?)\b/],
  ['ceintures', /\b(ceintures?|belts?)\b/],
  ['bijoux', /\b(bijoux?|bagues?|rings?|earrings?|boucles? d.oreilles?|colliers?|necklaces?|bracelets?|pendentifs?|pendants?|chaines?|chains?|jewel(le)?ry|grillz|chevalieres?|brooch(es)?|broches?)\b/],
  ['lunettes', /\b(lunettes?|sunglasses|glasses|shades)\b/],
  ['echarpes', /\b(echarpes?|e?scarf|scarves|neck ?warmers?|face ?warmers?|foulards?|gants?|e?gloves?|snoods?|tour de cou|mitaines?)\b/],
  ['accessoires', /\b(portefeuilles?|wallets?|montres?|watch(es)?|keychains?|porte-cles?|cardholders?|porte-cartes?|accessoires?|accessor(y|ies)|card ?holders?|cravates?|ties?|lanyards?|bandanas?|headbands?|bandeaux?|dog tags?|keyrings?|wristbands?|money clips?|porte-monnaies?)\b/],
  ['doudounes', /\b(doudounes?|puffers?|down jackets?|puffer jackets?)\b/],
  ['manteaux', /\b(manteaux?|manteau|coats?|parkas?|trench(coats?)?|overcoats?|dusters?)\b/],
  ['gilets', /\b(gilets?|vests?|sans manches|bodywarmers?)\b/],
  ['vestes', /\b(vestes?|jackets?|rain ?jackets?|track ?jackets?|bombardiers?|blousons?|bombers?|overshirts?|surchemises?|blazers?|anoraks?|windbreakers?|coupe-vent|varsity|outerwear|ma-1|shells?)\b/],
  ['shorts', /\b(shorts?|sweatshorts?|boardshorts?|bermudas?|maillots? de bain|swim ?shorts?|swimwear|jorts?)\b/],
  ['joggings', /\b(joggers?|joggings?|sweatpants?|sweat pants?|track ?pants?|trackpants?)\b/],
  ['pulls', /\b(pulls?|pullovers?|sweaters?|knit(wear)?|mailles?|cardigans?|jumpers?|tricots?|col roule|turtlenecks?|mohair)\b/],
  ['hoodies', /\b(hoodies?|hoody|hooded|hoods?|capuche|zip-?hood)\b/],
  ['sweats', /\b(sweats?|sweatshirts?|crewnecks?|crew necks?|zip-?ups?|quarter-?zip|half-?zip|neck zip|full-?zip|zips?|zippers?|zip collar|crews?|fleece|polar)\b/],
  ['manches-longues', /\b(longsleeves?|long-?sleeves?|long sleeves?|manches longues|l\/s|thermals?|waffles?|henleys?|rugby)\b/],
  ['maillots', /\b(maillots?|jerseys?)\b/],
  ['debardeurs', /\b(debardeurs?|tanks?|tank tops?|sleeveless|singlets?)\b/],
  ['tshirts', /\b(t-?shirts?|undershirts?|tees?|polos?|tops?)\b/],
  ['chemises', /\b(chemises?|(?<!t-|tee-|tee )shirts?|blouses?|wovens?)\b/],
  ['jeans', /\b(jeans?|denim)\b/],
  ['cargos', /\b(cargos?|parachute)\b/],
  ['pantalons', /\b(pantalons?|pants?|trousers?|chinos?|leggings?|bottoms?|overpants?|double knee)\b/],
];

// Objets qui ne sont pas des vêtements (pins, tapis, mugs…). Vérifié seulement
// pour les articles rangés en accessoires / ensembles, pour ne pas écarter une
// "Deck Jacket" ou un "Sticker T-shirt".
const OFF_TOPIC = /\b(pins?|pin'?s|pin packs?|badges?|rugs?|tapis|carpets?|posters?|affiches?|stickers?|autocollants?|mugs?|tasses?|tumblers?|flasks?|bottles?|gourdes?|ashtrays?|cendriers?|lighters?|briquets?|candles?|bougies?|incense|encens|towels?|serviettes?|blankets?|couvertures?|pillows?|coussins?|cushions?|vases?|coasters?|trays?|plateaux?|gift ?cards?|e-?gift|cartes?-? ?cadeaux?|iphone|phone ?cases?|coques?|toys?|jouets?|plush|peluches?|dolls?|figurines?|skateboards?|decks?|puzzles?|books?|livres?|carnets?|magazines?|cds?|vinyls?|records?|crates?|lamps?|lampes?|frames?|air fresheners?|senteurs?|raffles?|samples?|set of \d+|beakers?|bongs?|pipes?|grinders?|rolling|toothpicks?|pots?|kits?|ashtray|hangers?|playing cards|pens?)\b/;
// Jouets, quelle que soit la catégorie trouvée ("Polar Bear Plush Doll").
const TOYS = /\b(plush (dolls?|toys?)|dolls?|figurines?|peluches?|art toys?)\b/;

// Vrai si l'article a sa place sur le site : un vêtement ou un accessoire porté.
// Les articles non reconnus ("autres") sont écartés.
const SOFT = new Set(['accessoires', 'ensembles', 'sacs']);
export function isClothing(p, cat = categorize(p)) {
  if (cat === 'autres') return false;
  if (TOYS.test(normalize(p.title)) && !/\b(tee|t-shirt|hoodie|shirt)\b/.test(normalize(p.title))) return false;
  if (SOFT.has(cat) && OFF_TOPIC.test(normalize(`${p.productType || ''} ${p.title || ''}`))) return false;
  // Rangé "accessoire" seulement à cause du type Shopify, sans que le titre
  // nomme un accessoire porté : souvent un objet (verre, pot…), on écarte.
  if (cat === 'accessoires' && categorize({ title: p.title }) === 'autres') return false;
  return true;
}

export function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

// Quand un titre cite plusieurs pièces ("Cap Kid Graphic Tee", "Denim Shorts",
// "Hoodie Zip"), on garde la plus importante :
// 1. caleçons, chaussettes, ensembles ;
// 2. les pièces principales (tee, hoodie, veste, short, pantalon…) ;
// 3. les mots qui décrivent plutôt la matière ou la coupe (denim, zip, knit…) ;
// 4. les chaussures, puis les accessoires (souvent cités dans un imprimé).
const FAMILY_OF = new Map(FAMILIES.flatMap((f) => f.subs.map(([id]) => [id, f.id])));
const WEAK = new Set(['jeans', 'sweats', 'pulls']);
function tier(cat) {
  if (['chaussettes', 'calecons', 'ensembles'].includes(cat)) return 0;
  const fam = FAMILY_OF.get(cat);
  if (fam === 'accessoires') return 4;
  if (fam === 'chaussures') return 3;
  return WEAK.has(cat) ? 2 : 1;
}
// Mot générique → mots plus précis qui l'emportent quand les deux sont cités
// ("Tank Top", "Cargo Pants", "Jogger Pants").
const MORE_PRECISE = {
  tshirts: ['manches-longues', 'debardeurs'],
  pantalons: ['cargos', 'joggings'],
};
// Titre en français : le nom vient en premier ("Le pull en maille rayé").
const FRENCH = /^(le|la|les|l'|un|une)\s|\b(en|avec|a capuche)\b/;

// Nettoie un titre : enlève ce qui décrit l'imprimé ou la coupe.
function clean(text) {
  return normalize(text)
    .replace(/&amp;/g, '&')
    .replace(/\b(high|low|mid)[- ]?tops?\b/g, ' sneakers ')
    .replace(/\b(non|anti)[- ]?slip\b/g, ' ')
    // "Puffer Sandals", "Knit Beanie", "Denim Cap", "Woven Belt" : la matière
    // décrit l'accessoire ou la chaussure nommé ensuite, pas un vêtement.
    .replace(/\b(puffer|padded|quilted|woven|knit|knitted|waffle|fleece|nylon|fur|denim|jersey|mohair|thermal|crew|runner|varsity|sta|zip)\b(?=[^,]*\b(sandals?|slides?|boots?|shoes?|mules?|slippers?|clogs?|sneakers?|beanies?|skull ?caps?|skully|caps?|hats?|bucket|scarf|scarves|gloves?|mittens?|belts?|bags?|totes?|pouch|backpacks?)\b)/g, ' ')
    .replace(/\bswim[- ]?(pants|shorts?|trunks?)\b/g, ' shorts ')
    .replace(/\b(tee[- ]?|t )shirts?\b/g, ' t-shirt ')
    .replace(/\bshort[- ]?sleeved?\b/g, ' ss ')
    .replace(/\bmanches courtes\b/g, ' ss ')
    .replace(/\blong[- ]?sleeved? (t-?shirts?|tees?|shirts?)\b/g, ' longsleeve ')
    .replace(/\b(baggy|oversized?|boxy|relaxed|slim|regular|loose|heavyweight)( fit)?\b/g, ' ');
}

// Toutes les sous-catégories trouvées dans un texte, avec leur position.
function matches(text) {
  const out = [];
  for (const [cat, re, unless] of RULES) {
    if (unless && unless.test(text)) continue;
    const g = new RegExp(re.source, 'g');
    let m, first = -1, last = -1;
    while ((m = g.exec(text))) { if (first < 0) first = m.index; last = m.index + m[0].length; if (!m[0]) g.lastIndex++; }
    if (first >= 0) out.push({ cat, first, last });
  }
  return out;
}

// Choisit le vrai type d'article parmi les mots trouvés dans le titre.
function pick(found, text, hint) {
  if (!found.length) return null;
  // Le type Shopify (ex. "T-Shirts") départage quand le titre cite d'autres pièces.
  if (hint) {
    const same = found.filter((x) => FAMILY_OF.get(x.cat) === FAMILY_OF.get(hint));
    if (same.length) found = same;
  }
  const best = Math.min(...found.map((x) => tier(x.cat)));
  found = found.filter((x) => tier(x.cat) === best);
  for (const [generic, precise] of Object.entries(MORE_PRECISE)) {
    if (found.some((x) => x.cat === generic) && found.some((x) => precise.includes(x.cat))) {
      found = found.filter((x) => x.cat !== generic);
    }
  }
  return FRENCH.test(text)
    ? found.sort((a, b) => a.first - b.first)[0].cat
    : found.sort((a, b) => b.last - a.last)[0].cat;
}

function fromText(text, hint) {
  const t = clean(text);
  if (!t.trim()) return null;
  // "Jeans with Tie Belt" : ce qui suit "with" décrit un détail, sauf si
  // le début du titre ne nomme aucune pièce.
  const before = t.replace(/\bwith\b.*$/, ' ');
  return pick(matches(before), before, hint) || pick(matches(t), t, hint);
}

export function categorize({ productType = '', title = '', tags = [] } = {}) {
  const tagText = Array.isArray(tags) ? tags.join(' ') : String(tags);
  const fromType = fromText(productType);
  return fromText(title, fromType) || fromType || fromText(tagText) || 'autres';
}

// Vêtements femme / fille : exclus du site. Un article marqué aussi homme
// ou unisexe est gardé.
const WOMEN = /\b(femmes?|women'?s?|woman|womens|wmns|filles?|girls?|lad(y|ies)|her|robes?|dress(es)?|jupes?|skirts?|jupons?|soutiens?-gorge|bras?|bralettes?|brassieres?|culottes?|lingerie|nuisettes?|bodys?|tops? courts?|crop ?tops?|maternite|grossesse)\b/;
// Pièces toujours féminines : exclues même si l'article est marqué "unisexe" / "mens".
const FEMININE = /\b(capris?|strings?|g-?strings?|thongs?|tangas?|bikinis?|bikini bottoms?|swimsuits?|maillots? une piece|hot ?pants?|micro ?shorts?|bodysuits?|corsets?|bustiers?|bralettes?|soutiens?-gorge|bras?|culottes?|lingerie|lace sets?|lace \w+ sets?|baby tees?|porte-jarretelles|garters?|nuisettes?|babydolls?|negligees?|crop ?tops?|tube ?tops?|camisoles?|robes?|dress(es)?|jupes?|skirts?|leggings?|tights|collants?|fishnets?|stilettos?|escarpins?|off the shoulder|off-shoulder|epaules denudees|halter ?neck|halters?|cami|cami tops?|crop (zip )?hoodies?|cropped zip hoodies?|sculpt stretch|bootcut sweatpants?|tops? dos nu|ballerines?|wedges?|flat sandals?|compensees?|platform sandals?|over the knee|cuissardes?|booties?|kitten heels?|(sandals?|mules?|boots?|bootie|sabot|ballerina|pumps?|slingbacks?) \d{2,3}|slingbacks?)\b/;
const MEN = /\b(hommes?|men'?s?|man|mens|garcons?|boys?|unisexe?|mixte|gender-?neutral)\b/;

export function isWomenOnly({ productType = '', title = '', tags = [] } = {}) {
  const t = normalize([productType, title, Array.isArray(tags) ? tags.join(' ') : tags].join(' '));
  // "Ballerina" en fin de titre = chaussure ("Bad Bunny Ballerina"), pas un imprimé.
  return FEMININE.test(t) || /\bballerinas?\s*$/.test(normalize(title)) || (WOMEN.test(t) && !MEN.test(t));
}
