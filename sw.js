const CACHE = `green-pitch-reference-ui-${'__BUILD_ID__'}`;
const CORE = [
  './','./index.html','./styles.css','./icon.svg','./manifest.webmanifest',
  './src/main.js','./src/components/appShell.js','./src/components/icons.js','./src/components/sheet.js','./src/components/toast.js',
  './src/pages/saveSelectPage.js','./src/pages/onboardingPage.js','./src/pages/careerPage.js','./src/pages/matchPage.js','./src/pages/trainingPage.js','./src/pages/transferPage.js','./src/pages/morePage.js','./src/pages/worldPage.js','./src/pages/profilePage.js','./src/pages/rankingsPage.js',
  './src/styles/reference-tokens.css'
];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => { self.skipWaiting(); self.SKIP_WAITING = true; })));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(fetch(new Request(event.request, { cache: 'no-store' })).then(response => {
    if (response.ok && new URL(event.request.url).origin === self.location.origin) caches.open(CACHE).then(cache => cache.put(event.request, response.clone()));
    return response;
  }).catch(() => caches.match(event.request).then(hit => hit || (event.request.mode === 'navigate' ? caches.match('./index.html') : undefined))));
});
