const VERSION = 'green-pitch-v20.0.0-20260805';
const CACHE = `${VERSION}-static`;
const CORE = [
  './',
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './icon.svg',
  './src/main.js',
  './src/core/playerDevelopmentEngine.js',
  './src/services/storage/migrations.js',
  './src/services/storage/saveManager.js',
  './src/systems/attention/attentionManager.js',
  './src/systems/facility/facilityExperienceSystem.js',
  './src/systems/training/trainingEventSystem.js',
  './src/systems/world/worldExplorerSystem.js',
  './src/styles/theme.css',
  './src/styles/base.css',
  './src/styles/components.css',
  './src/styles/pages.css',
  './src/styles/mobile-foundation.css',
  './src/styles/animations.css',
  './src/styles/v20-product.css'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const request = event.request;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;

  event.respondWith((async () => {
    try {
      const response = await fetch(request, {cache: 'no-cache'});
      if (response.ok) {
        const cache = await caches.open(CACHE);
        await cache.put(request, response.clone());
      }
      return response;
    } catch {
      const cached = await caches.match(request, {ignoreSearch: true});
      return cached || caches.match('./index.html');
    }
  })());
});
