const CACHE = 'career-__BUILD_ID__';
const CORE = ['./','./index.html','./styles.css','./src/main.js','./icon.svg'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE))));
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', event => event.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)));
  await self.clients.claim();
})()));

async function cacheResponse(request, response) {
  if (response.ok) await (await caches.open(CACHE)).put(request, response.clone());
  return response;
}

async function networkFirst(request, fallback) {
  try {
    return await cacheResponse(request, await fetch(request));
  } catch {
    return await caches.match(request) || (fallback && await caches.match(fallback)) || Response.error();
  }
}

async function cacheFirst(request) {
  return await caches.match(request) || cacheResponse(request, await fetch(request));
}

async function networkOnly(request) {
  try { return await fetch(request); }
  catch { return Response.error(); }
}

function isHashedAsset(url) {
  return /[.-][a-f0-9]{8,}\./i.test(url.pathname);
}

function isApiRequest(url) {
  return /^\/(?:api|functions|server)(?:\/|$)/i.test(url.pathname);
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || isApiRequest(url)) {
    event.respondWith(networkOnly(event.request));
    return;
  }
  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request, './index.html'));
    return;
  }
  if (isHashedAsset(url)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }
  event.respondWith(networkFirst(event.request));
});
