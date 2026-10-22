// Service worker : le jeu fonctionne hors ligne une fois ouvert une première fois.
// Changer VERSION à chaque mise en ligne pour que les téléphones récupèrent la nouvelle version.
const VERSION = 'graal-v1';
const FILES = [
  './', 'index.html', 'style.css', 'manifest.webmanifest', 'data/levels.json',
  'js/app.js', 'js/engine.js', 'js/levels.js', 'js/data.js', 'js/art.js', 'js/audio.js', 'js/board.js', 'js/save.js',
  'icons/icon.svg', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// Réponse immédiate depuis le cache, mise à jour en arrière-plan quand le réseau est là.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(VERSION).then(async cache => {
    const hit = await cache.match(req, { ignoreSearch: true });
    const net = fetch(req).then(res => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  }));
});
