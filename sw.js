// Service Worker for Football Career Simulator V12.0
const CACHE_NAME = 'football-career-v12-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './css/style.css',
  './js/config.js',
  './js/app.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
