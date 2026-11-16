// Cache hors-ligne : l'interface en priorité depuis le cache, les données
// depuis le réseau (avec repli sur le cache), les images en cache.
const VERSION = 'stayplug-v18';
const SHELL = ['./', 'index.html', 'app.css', 'app.js', 'logo.png', 'manifest.webmanifest', 'icons/favicon-32.png', 'icons/favicon-96.png', 'icons/icon-180.png', 'icons/icon-192.png'];
const IMG_CACHE = 'stayplug-img';
const IMG_MAX = 300;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== IMG_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(req) {
  const cache = await caches.open(VERSION);
  try {
    // no-cache : le téléphone revérifie auprès du serveur au lieu de garder
    // les données 10 min (GitHub Pages envoie max-age=600).
    const res = await fetch(req, { cache: 'no-cache' });
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return (await cache.match(req)) || Response.error();
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(VERSION);
  const hit = await cache.match(req);
  const net = fetch(req).then((res) => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(() => hit);
  return hit || net;
}

async function imageCache(req) {
  const cache = await caches.open(IMG_CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === 'opaque') {
    cache.put(req, res.clone());
    cache.keys().then((keys) => keys.length > IMG_MAX && Promise.all(keys.slice(0, keys.length - IMG_MAX).map((k) => cache.delete(k))));
  }
  return res;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    e.respondWith(url.pathname.includes('/data/') ? networkFirst(req) : staleWhileRevalidate(req));
  } else if (req.destination === 'image') {
    e.respondWith(imageCache(req));
  }
});
