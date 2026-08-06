const CACHE = `green-pitch-v20.0.0-${'__BUILD_ID__'}`;
const CORE = ['./','./index.html','./styles.css','./src/app.js','./icon.svg','./src/systems/attention/attentionManager.js','./src/systems/facility/facilityExperienceSystem.js','./src/systems/training/trainingEventSystem.js','./src/systems/world/worldExplorerSystem.js','./src/styles/v20-product.css'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => { self.skipWaiting(); self.SKIP_WAITING = true; })));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(fetch(new Request(event.request, { cache: 'no-store' })).then(response => {
    if (response.ok && new URL(event.request.url).origin === self.location.origin) caches.open(CACHE).then(cache => cache.put(event.request, response.clone()));
    return response;
  }).catch(() => caches.match(event.request).then(hit => hit || (event.request.mode === 'navigate' ? caches.match('./index.html') : undefined))));
});
