/* Service worker : appli utilisable hors ligne + cache des affiches */
const VERSION = 'animes-v2.1.0';
const SHELL = ['./', 'index.html', 'styles.css', 'app.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
const IMG_CACHE = 'animes-img-v1';
const IMG_HOSTS = ['s4.anilist.co', 'cdn.myanimelist.net', 'media.kitsu.app', 'media.kitsu.io', 'fonts.googleapis.com', 'fonts.gstatic.com'];

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

async function trimImages(max = 400) {
  const c = await caches.open(IMG_CACHE);
  const keys = await c.keys();
  for (let i = 0; i < keys.length - max; i++) await c.delete(keys[i]);
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Affiches, bannières et polices : cache d'abord, réseau sinon
  if (IMG_HOSTS.includes(url.hostname)) {
    e.respondWith(
      caches.open(IMG_CACHE).then(async (c) => {
        const hit = await c.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok || res.type === 'opaque') { c.put(req, res.clone()); trimImages(); }
        return res;
      }).catch(() => fetch(req))
    );
    return;
  }

  // Fichiers de l'appli : réseau d'abord (pour récupérer les mises à jour), cache si hors ligne
  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); return res; })
        .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('index.html')))
    );
  }
  // APIs (AniList, Jikan, Kitsu) : jamais mises en cache ici
});
