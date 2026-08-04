const CACHE = 'career-vnext-world-time-2';
const CORE = ['./','./index.html','./styles.css','./src/main.js','./icon.svg'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys()
  .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
  .then(() => self.clients.claim())
  .then(() => self.clients.matchAll({type:'window',includeUncontrolled:true}))
  .then(clients => Promise.all(clients.map(client => client.navigate(client.url).catch(() => undefined))))));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, copy));
    }
    return response;
  }).catch(() => caches.match(event.request).then(hit => hit || caches.match('./index.html'))));
});
