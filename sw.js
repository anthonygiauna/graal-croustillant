// Service worker : le jeu fonctionne hors ligne une fois ouvert une première fois.
// Avec du réseau, on prend toujours la dernière version publiée (et on la garde pour le hors-ligne) ;
// sans réseau, ou si le réseau met plus de 3 secondes, on sert la copie gardée.
const VERSION = 'graal-v5';
const FILES = [
  './', 'index.html', 'style.css', 'manifest.webmanifest', 'data/levels.json',
  'js/app.js', 'js/courtyard.js', 'js/engine.js', 'js/levels.js', 'js/data.js', 'js/art.js', 'js/audio.js', 'js/board.js', 'js/save.js',
  'icons/icon.svg', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// Réseau d'abord, copie gardée en secours.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(VERSION).then(async cache => {
    const hit = await cache.match(req, { ignoreSearch: true });
    const net = fetch(req, { cache: 'no-cache' }).then(res => { if (res.ok) cache.put(req, res.clone()); return res; });
    if (!hit) return net;
    const slow = new Promise(resolve => setTimeout(() => resolve(hit), 3000));
    return Promise.race([net.catch(() => hit), slow]);
  }));
});
