// Familles (1re ligne de filtres) et leurs sous-catégories (2e ligne).
// Garder identique à FAMILIES dans scripts/categorize.mjs.
const FAMILIES = [
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
];
// Les articles "autres" (non reconnus) ne sont pas affichés.
const FAMILY_OF = new Map(FAMILIES.flatMap((f) => f.subs.map(([id]) => [id, f.id])));
const CAT_LABEL = Object.fromEntries(FAMILIES.flatMap((f) => f.subs));
// Anciennes catégories (avant les sous-catégories) encore présentes dans products.json.
const LEGACY = { 'sous-vetements': 'calecons' };
// Silhouette de repli par sous-catégorie, pour celles qui n'ont pas la leur.
const ICON_OF = {
  'manches-longues': 'tshirts', debardeurs: 'tshirts', maillots: 'tshirts', hoodies: 'sweats', ensembles: 'sweats',
  cargos: 'pantalons', joggings: 'pantalons', doudounes: 'vestes', manteaux: 'vestes', gilets: 'vestes',
  sneakers: 'chaussures', boots: 'chaussures', claquettes: 'chaussures', calecons: 'sous-vetements', chaussettes: 'sous-vetements',
};

// Silhouettes pour les articles sans photo (données de démo).
const ICONS = {
  tshirts: 'M22 10 10 16l4 10 6-3v29h24V23l6 3 4-10-12-6c-2 4-6 6-10 6s-8-2-10-6z',
  chemises: 'M22 10 10 16l4 10 6-3v29h24V23l6 3 4-10-12-6M26 10l6 8 6-8M32 18v34',
  pulls: 'M22 10 10 16 6 50h7l3-24v28h32V26l3 24h7l-4-34-12-6c-2 4-6 6-10 6s-8-2-10-6z',
  sweats: 'M22 10 10 16 6 50h7l3-24v28h32V26l3 24h7l-4-34-12-6c0 5-4 9-10 9s-10-4-10-9zM26 54V44h12v10',
  vestes: 'M22 10 10 16 6 50h7l3-24v28h32V26l3 24h7l-4-34-12-6-10 9zM32 19v35M26 36h-4',
  jeans: 'M18 8h28l4 48H39L32 24l-7 32H14zM18 14h28',
  pantalons: 'M18 8h28l4 48H39L32 24l-7 32H14z',
  shorts: 'M16 14h32l4 26H37l-5-12-5 12H12zM16 20h32',
  chaussures: 'M6 42c0-6 2-12 4-16h10c2 4 8 6 14 7l18 5c4 1 6 4 6 8v4H6zM6 46h52',
  accessoires: 'M14 24h36l-3 30H17zM24 24v-6a8 8 0 0 1 16 0v6',
  'sous-vetements': 'M12 20h40l-4 12c-6 2-10 8-12 16h-8c-2-8-6-14-12-16z',
  autres: 'M32 14a5 5 0 1 1 5 5c-3 1-5 2-5 5L8 42h48L32 24',
};
const svg = (d, vb = 64) => `<svg viewBox="0 0 ${vb} ${vb}" aria-hidden="true"><path d="${d}"/></svg>`;
const HEART = svg('M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z', 24);
const X = svg('M6 6l12 12M18 6 6 18', 24);
const EXT = svg('M14 5h5v5M19 5l-8 8M17 14v5H5V7h5', 24);
const PAGE = 24;

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const hue = (s) => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
const money = (n, cur = 'EUR') =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: cur, maximumFractionDigits: n % 1 ? 2 : 0 }).format(n);

const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

const state = {
  view: ['articles', 'marques', 'favoris'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'marques',
  cat: 'all',
  sub: 'all',
  q: '',
  brands: new Set(),
  pmin: null,
  pmax: null,
  sale: false,
  sort: 'new',
  shown: PAGE,
};
// Profils de la bande. Chaque profil a ses propres favoris, enregistrés sur l'appareil.
const PROFILES = [
  { id: 'clayton', name: 'Clayton', hue: 18, img: 'avatars/clayton.jpg' },
  { id: 'maxence', name: 'Maxence', hue: 205, img: 'avatars/maxence.jpg?v=2' },
  { id: 'killian', name: 'Killian', hue: 145, img: 'avatars/killian.jpg?v=2' },
  { id: 'ewen', name: 'Ewen', hue: 275, img: 'avatars/ewen.jpg?v=2' },
];
let profile = PROFILES.find((p) => p.id === store.get('profile', null)) || null;
const fav = { products: new Set(), brands: new Set() };

function loadFavs() {
  fav.products = new Set(profile ? store.get(`fav-products:${profile.id}`, []) : []);
  fav.brands = new Set(profile ? store.get(`fav-brands:${profile.id}`, []) : []);
}
loadFavs();

let BRANDS = [];
let PRODUCTS = [];
let brandById = new Map();

/* ---------- Données ---------- */

async function load() {
  const [b, p] = await Promise.all([
    fetch('data/brands.json').then((r) => r.json()),
    fetch('data/products.json').then((r) => r.json()),
  ]);
  BRANDS = b.brands.slice().sort((x, y) => x.name.localeCompare(y.name, 'fr'));
  brandById = new Map(BRANDS.map((x) => [x.id, x]));
  for (const x of p.products) x.category = LEGACY[x.category] || x.category;
  PRODUCTS = p.products.filter((x) => brandById.has(x.brandId) && CAT_LABEL[x.category]);
  for (const x of PRODUCTS) {
    x._f = FAMILY_OF.get(x.category);
    x._t = norm(`${x.title} ${brandById.get(x.brandId).name} ${CAT_LABEL[x.category] || ''}`);
    x._d = Date.parse(x.createdAt) || 0;
  }
  $('#demo').hidden = !b.demo;
  if (b.updatedAt) {
    const d = new Date(b.updatedAt);
    $('#updated').textContent = `Mis à jour le ${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`;
  }
}

function filtered({ ignoreCat = false } = {}) {
  const q = norm(state.q).trim().split(/\s+/).filter(Boolean);
  return PRODUCTS.filter((p) =>
    (ignoreCat || state.cat === 'all' || p._f === state.cat) &&
    (ignoreCat || state.sub === 'all' || p.category === state.sub) &&
    (!state.brands.size || state.brands.has(p.brandId)) &&
    (state.pmin == null || p.price >= state.pmin) &&
    (state.pmax == null || p.price <= state.pmax) &&
    (!state.sale || p.compareAt) &&
    q.every((w) => p._t.includes(w))
  );
}

// Tirage aléatoire fixé pour la visite : l'ordre ne bouge pas quand on
// change de filtre ou qu'on fait défiler, mais change à chaque ouverture du site.
const SEED = (Math.random() * 2 ** 32) >>> 0;
function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32;
  };
}

// Mélange les marques : deux articles qui se suivent viennent de marques
// différentes (tant qu'il en reste plusieurs). Chaque marque garde ses
// nouveautés en premier, et les grosses marques sont réparties sur toute la liste.
function mixBrands(list) {
  const groups = new Map();
  for (const p of list.sort((a, b) => b._d - a._d)) {
    if (!groups.has(p.brandId)) groups.set(p.brandId, []);
    groups.get(p.brandId).push(p);
  }
  const left = [...groups.values()].map((items) => ({ items, i: 0 }));
  const rand = rng(SEED);
  const out = [];
  let prev = null;
  let remaining = list.length;
  while (remaining) {
    const pool = left.filter((g) => g.i < g.items.length && g !== prev);
    const choices = pool.length ? pool : [prev];
    // Plus une marque a d'articles restants, plus elle a de chances de sortir.
    let r = rand() * choices.reduce((n, g) => n + g.items.length - g.i, 0);
    let g = choices[choices.length - 1];
    for (const c of choices) { r -= c.items.length - c.i; if (r < 0) { g = c; break; } }
    out.push(g.items[g.i++]);
    prev = g;
    remaining--;
  }
  return out;
}

function sorted(list) {
  const s = state.sort;
  if (s === 'price-asc') return list.sort((a, b) => a.price - b.price);
  if (s === 'price-desc') return list.sort((a, b) => b.price - a.price);
  return mixBrands(list);
}

/* ---------- Rendu ---------- */

function imgUrl(src, w) {
  if (!src) return null;
  if (!/cdn\.shopify\.com|\/cdn\/shop\//.test(src)) return src;
  const u = new URL(src, location.href);
  u.searchParams.set('width', w);
  return u.href;
}

function productCard(p) {
  const b = brandById.get(p.brandId);
  const on = fav.products.has(p.id);
  const off = p.compareAt ? Math.round((1 - p.price / p.compareAt) * 100) : 0;
  const media = p.image
    ? `<img src="${esc(imgUrl(p.image, 500))}" srcset="${esc(imgUrl(p.image, 360))} 360w, ${esc(imgUrl(p.image, 600))} 600w, ${esc(imgUrl(p.image, 900))} 900w"
         sizes="(min-width:960px) 25vw, (min-width:640px) 33vw, 50vw" alt="${esc(p.title)}" loading="lazy" decoding="async">`
    : `<div class="ph" style="--h:${hue(b.id)}">${svg(ICONS[p.category] || ICONS[ICON_OF[p.category]] || ICONS.autres)}</div>`;
  const tag = p.url ? 'a' : 'div';
  const href = p.url ? ` href="${esc(p.url)}" target="_blank" rel="noopener"` : '';
  return `<${tag} class="card"${href}>
    <div class="media">${media}
      ${off >= 5 ? `<span class="sale-pill">−${off} %</span>` : ''}
      <button class="heart${on ? ' on' : ''}" data-fav-product="${esc(p.id)}" aria-label="${on ? 'Retirer des' : 'Ajouter aux'} favoris" aria-pressed="${on}">${HEART}</button>
    </div>
    <div class="info">
      <div class="brand-name">${esc(b.name)}</div>
      <div class="title">${esc(p.title)}</div>
      <div class="price"><span class="now${p.compareAt ? ' discount' : ''}">${money(p.price, p.currency)}</span>${p.compareAt ? `<s>${money(p.compareAt, p.currency)}</s>` : ''}</div>
    </div>
  </${tag}>`;
}

function logoHtml(b) {
  const initials = b.name.replace(/[^\p{L}\p{N} ]/gu, '').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return `<span class="brand-logo" style="--h:${hue(b.id)}">${
    b.logo ? `<img src="${esc(b.logo)}" alt="" loading="lazy" data-initials="${esc(initials)}">` : esc(initials)
  }</span>`;
}

function brandCard(b, counts) {
  const on = fav.brands.has(b.id);
  const n = counts.get(b.id) || 0;
  return `<article class="brand">
    <button class="heart${on ? ' on' : ''}" data-fav-brand="${esc(b.id)}" aria-label="${on ? 'Retirer des' : 'Ajouter aux'} favoris" aria-pressed="${on}">${HEART}</button>
    <button class="brand-open" data-brand="${esc(b.id)}" aria-label="Voir les articles ${esc(b.name)}">
      ${logoHtml(b)}
      <h3>${esc(b.name)}</h3>
      <span class="meta">${n ? `${n} article${n > 1 ? 's' : ''}` : b.instagram ? `@${esc(b.instagram)}` : '&nbsp;'}</span>
    </button>
    <a class="site${b.site ? '' : ' off'}" ${b.site ? `href="${esc(b.site)}" target="_blank" rel="noopener"` : 'aria-disabled="true"'}>Site officiel ${EXT}</a>
    ${b.instagram ? `<a class="insta" href="https://www.instagram.com/${encodeURIComponent(b.instagram)}/" target="_blank" rel="noopener">Instagram ${EXT}</a>` : ''}
  </article>`;
}

function renderChips() {
  const base = filtered({ ignoreCat: true });
  const fams = new Map();
  const subs = new Map();
  for (const p of base) {
    fams.set(p._f, (fams.get(p._f) || 0) + 1);
    subs.set(p.category, (subs.get(p.category) || 0) + 1);
  }
  const chip = (attr, id, label, n, on) =>
    `<button class="chip${on ? ' active' : ''}" data-${attr}="${id}" aria-pressed="${on}">${esc(label)}${n != null ? ` <small>${n}</small>` : ''}</button>`;
  $('#chips').innerHTML =
    chip('cat', 'all', 'Tout', base.length, state.cat === 'all') +
    FAMILIES.filter((f) => fams.get(f.id) || state.cat === f.id)
      .map((f) => chip('cat', f.id, f.label, fams.get(f.id) || 0, state.cat === f.id)).join('');

  // 2e ligne : sous-catégories de la famille choisie (si elle en a plusieurs).
  const fam = FAMILIES.find((f) => f.id === state.cat);
  const list = fam ? fam.subs.filter(([id]) => subs.get(id) || state.sub === id) : [];
  const row = $('#subchips');
  row.hidden = list.length < 2;
  row.innerHTML = row.hidden ? '' :
    chip('sub', 'all', `Tout ${fam.label.toLowerCase()}`, fams.get(fam.id) || 0, state.sub === 'all') +
    list.map(([id, l]) => chip('sub', id, l, subs.get(id) || 0, state.sub === id)).join('');
}

function renderActiveFilters() {
  const tags = [];
  for (const id of state.brands) tags.push([`brand:${id}`, brandById.get(id)?.name]);
  if (state.pmin != null) tags.push(['pmin', `≥ ${money(state.pmin)}`]);
  if (state.pmax != null) tags.push(['pmax', `≤ ${money(state.pmax)}`]);
  if (state.sale) tags.push(['sale', 'En promo']);
  $('#activeFilters').innerHTML = tags.map(([k, l]) => `<button class="tag" data-remove="${esc(k)}">${esc(l)} ${X}</button>`).join('');
  const n = state.brands.size + (state.pmin != null) + (state.pmax != null) + state.sale;
  $('#filterBadge').hidden = !n;
  $('#filterBadge').textContent = n;
}

let currentList = [];
function renderArticles() {
  renderChips();
  renderActiveFilters();
  currentList = sorted(filtered());
  const n = currentList.length;
  $('#count').textContent = `${n} article${n > 1 ? 's' : ''}`;
  $('#grid').innerHTML = currentList.slice(0, state.shown).map(productCard).join('');
  $('#empty').hidden = n > 0;
}

function renderMore() {
  const from = $('#grid').children.length;
  if (from >= currentList.length) return;
  state.shown = from + PAGE;
  $('#grid').insertAdjacentHTML('beforeend', currentList.slice(from, state.shown).map(productCard).join(''));
}

function brandCounts() {
  const m = new Map();
  for (const p of PRODUCTS) m.set(p.brandId, (m.get(p.brandId) || 0) + 1);
  return m;
}

function renderBrands() {
  const q = norm(state.q).trim();
  const list = BRANDS.filter((b) => !q || norm(`${b.name} ${b.instagram}`).includes(q));
  const counts = brandCounts();
  $('#brandCount').textContent = `${list.length} marque${list.length > 1 ? 's' : ''}`;
  $('#brandGrid').innerHTML = list.map((b) => brandCard(b, counts)).join('');
}

function renderFavs() {
  $('#favTitle').textContent = profile ? `Favoris de ${profile.name}` : 'Favoris';
  const counts = brandCounts();
  const bs = BRANDS.filter((b) => fav.brands.has(b.id));
  const ps = mixBrands(PRODUCTS.filter((p) => fav.products.has(p.id)));
  $('#favBrands').innerHTML = bs.map((b) => brandCard(b, counts)).join('');
  $('#favGrid').innerHTML = ps.map(productCard).join('');
  $('#favBrands').previousElementSibling.hidden = !bs.length;
  $('#favGrid').previousElementSibling.hidden = !ps.length;
  $('#favEmpty').hidden = bs.length || ps.length;
}

function render() {
  for (const v of ['articles', 'marques', 'favoris']) $(`#view-${v}`).hidden = state.view !== v;
  document.querySelectorAll('.tabbar button').forEach((b) => b.classList.toggle('active', b.dataset.view === state.view));
  $('#chips').hidden = state.view !== 'articles';
  if (state.view !== 'articles') $('#subchips').hidden = true;
  $('#q').placeholder = state.view === 'marques' ? 'Rechercher une marque…' : 'Rechercher un article, une marque…';
  if (state.view === 'articles') renderArticles();
  else if (state.view === 'marques') renderBrands();
  else renderFavs();
}

function update(changes = {}) {
  Object.assign(state, changes, { shown: PAGE });
  render();
}

/* ---------- Filtres ---------- */

function openSheet() {
  const counts = brandCounts();
  $('#brandChecks').innerHTML = BRANDS.map((b) => `<label class="check">
      ${logoHtml(b)}<span class="name">${esc(b.name)}</span><span class="n">${counts.get(b.id) || 0}</span>
      <input type="checkbox" value="${esc(b.id)}" ${state.brands.has(b.id) ? 'checked' : ''}>
    </label>`).join('');
  document.querySelectorAll('#sortPills button').forEach((b) => b.classList.toggle('active', b.dataset.sort === state.sort));
  $('#pmin').value = state.pmin ?? '';
  $('#pmax').value = state.pmax ?? '';
  $('#sale').checked = state.sale;
  $('#sheet').hidden = $('#backdrop').hidden = false;
  document.body.classList.add('no-scroll');
  previewCount();
}

function closeSheet() {
  $('#sheet').hidden = $('#backdrop').hidden = true;
  document.body.classList.remove('no-scroll');
}

function readSheet() {
  const num = (v) => (v === '' ? null : Math.max(0, Number(v)));
  return {
    sort: $('#sortPills .active')?.dataset.sort || 'new',
    pmin: num($('#pmin').value),
    pmax: num($('#pmax').value),
    sale: $('#sale').checked,
    brands: new Set([...document.querySelectorAll('#brandChecks input:checked')].map((i) => i.value)),
  };
}

function previewCount() {
  const saved = { ...state };
  Object.assign(state, readSheet());
  const n = filtered().length;
  Object.assign(state, saved);
  $('#applyFilters').textContent = n ? `Voir ${n} article${n > 1 ? 's' : ''}` : 'Aucun article';
}

/* ---------- Événements ---------- */

function toggleFav(kind, id) {
  if (!profile) return showProfiles();
  const set = fav[`${kind}s`];
  set.has(id) ? set.delete(id) : set.add(id);
  store.set(`fav-${kind}s:${profile.id}`, [...set]);
  const on = set.has(id);
  document.querySelectorAll(`[data-fav-${kind}="${CSS.escape(id)}"]`).forEach((b) => {
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', on);
    b.setAttribute('aria-label', `${on ? 'Retirer des' : 'Ajouter aux'} favoris`);
  });
  if (state.view === 'favoris') renderFavs();
  navigator.vibrate?.(8);
}

document.addEventListener('click', (e) => {
  const t = e.target.closest('button, a');
  if (!t) return;
  if (t.dataset.favProduct) { e.preventDefault(); return toggleFav('product', t.dataset.favProduct); }
  if (t.dataset.favBrand) { e.preventDefault(); return toggleFav('brand', t.dataset.favBrand); }
  if (t.dataset.profile) return pickProfile(t.dataset.profile);
  if (t.dataset.cat) {
    update({ cat: t.dataset.cat, sub: 'all' });
    $('#chips .active')?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    $('#subchips').scrollLeft = 0;
    return window.scrollTo({ top: 0 });
  }
  if (t.dataset.sub) {
    update({ sub: t.dataset.sub });
    $('#subchips .active')?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    return window.scrollTo({ top: 0 });
  }
  if (t.dataset.brand) {
    store.set('view', 'articles');
    update({ view: 'articles', brands: new Set([t.dataset.brand]), cat: 'all', sub: 'all', q: '' });
    $('#q').value = '';
    $('#clearQ').hidden = true;
    return window.scrollTo({ top: 0 });
  }
  if (t.dataset.remove) {
    const k = t.dataset.remove;
    if (k.startsWith('brand:')) state.brands.delete(k.slice(6));
    else if (k === 'sale') state.sale = false;
    else state[k] = null;
    return update();
  }
  if (t.dataset.view) {
    store.set('view', t.dataset.view);
    history.replaceState(null, '', `#${t.dataset.view}`);
    update({ view: t.dataset.view });
    return window.scrollTo({ top: 0 });
  }
  if (t.dataset.sort) {
    document.querySelectorAll('#sortPills button').forEach((b) => b.classList.toggle('active', b === t));
    return previewCount();
  }
});

let qTimer;
$('#q').addEventListener('input', (e) => {
  $('#clearQ').hidden = !e.target.value;
  clearTimeout(qTimer);
  qTimer = setTimeout(() => update({ q: e.target.value }), 120);
});
$('#q').addEventListener('keydown', (e) => e.key === 'Enter' && e.target.blur());
$('#clearQ').addEventListener('click', () => {
  $('#q').value = '';
  $('#clearQ').hidden = true;
  update({ q: '' });
  $('#q').focus();
});

$('#openFilters').addEventListener('click', openSheet);
$('#closeFilters').addEventListener('click', closeSheet);
$('#backdrop').addEventListener('click', closeSheet);
$('#sheet').addEventListener('input', previewCount);
$('#applyFilters').addEventListener('click', () => { update(readSheet()); closeSheet(); window.scrollTo({ top: 0 }); });
$('#resetFilters').addEventListener('click', () => {
  document.querySelectorAll('#brandChecks input').forEach((i) => (i.checked = false));
  document.querySelectorAll('#sortPills button').forEach((b) => b.classList.toggle('active', b.dataset.sort === 'new'));
  $('#pmin').value = $('#pmax').value = '';
  $('#sale').checked = false;
  previewCount();
});
$('#resetAll').addEventListener('click', () => {
  $('#q').value = '';
  $('#clearQ').hidden = true;
  update({ cat: 'all', sub: 'all', q: '', brands: new Set(), pmin: null, pmax: null, sale: false });
});
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!$('#sheet').hidden) closeSheet();
  else if (!$('#profiles').hidden && profile) hideProfiles();
});

// Logo cassé → initiales.
document.addEventListener('error', (e) => {
  const img = e.target;
  if (img.tagName === 'IMG' && img.dataset.initials != null) img.replaceWith(img.dataset.initials);
}, true);

new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting && state.view === 'articles') renderMore();
}, { rootMargin: '800px' }).observe($('#sentinel'));

/* ---------- Profils ---------- */

const avatar = (p) => `<span class="avatar" style="--h:${p.hue}">${
  p.img ? `<img src="${esc(p.img)}" alt="">` : esc(p.name[0])
}</span>`;

function renderMe() {
  $('#me').innerHTML = profile ? avatar(profile) : '';
  $('#me').hidden = !profile;
  $('#favAvatar').outerHTML = profile ? avatar(profile).replace('class="avatar"', 'class="avatar" id="favAvatar"') : '<span id="favAvatar"></span>';
}

function showProfiles() {
  $('#profileGrid').innerHTML = PROFILES.map((p) => `<button class="profile${profile?.id === p.id ? ' current' : ''}" data-profile="${p.id}">
      ${avatar(p)}<span class="profile-name">${esc(p.name)}</span>
    </button>`).join('');
  $('#closeProfiles').hidden = !profile;
  $('#profiles').hidden = false;
  document.body.classList.add('no-scroll');
}

function hideProfiles() {
  $('#profiles').hidden = true;
  document.body.classList.remove('no-scroll');
}

function pickProfile(id) {
  profile = PROFILES.find((p) => p.id === id);
  store.set('profile', id);
  // Favoris enregistrés avant l'arrivée des profils : on les donne au premier profil choisi.
  for (const kind of ['products', 'brands']) {
    const old = store.get(`fav-${kind}`, null);
    if (old && !store.get(`fav-${kind}:${id}`, null)) store.set(`fav-${kind}:${id}`, old);
    try { localStorage.removeItem(`fav-${kind}`); } catch {}
  }
  loadFavs();
  renderMe();
  hideProfiles();
  render();
  navigator.vibrate?.(8);
}

$('#me').addEventListener('click', showProfiles);
$('#switchProfile').addEventListener('click', showProfiles);
$('#closeProfiles').addEventListener('click', hideProfiles);

/* ---------- Installation (PWA) ---------- */

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
if (isIOS && !standalone && !store.get('install-dismissed', false)) {
  setTimeout(() => ($('#install').hidden = false), 2500);
}
$('#closeInstall').addEventListener('click', () => {
  $('#install').hidden = true;
  store.set('install-dismissed', true);
});

/* ---------- Démarrage ---------- */

renderMe();
// On arrive toujours sur « Qui es-tu ? » à l'ouverture du site.
showProfiles();
load().then(render).catch((err) => {
  console.error(err);
  $('#grid').innerHTML = '';
  $('#empty').hidden = false;
  $('#empty').querySelector('p').textContent = 'Impossible de charger les données.';
});
