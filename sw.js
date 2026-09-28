/* Service worker — offline cache + share-target handler (M9).
 * Bump CACHE_VERSION whenever any cached file changes. */

const CACHE_VERSION = 4;
const CACHE_NAME = 'docsorter-v' + CACHE_VERSION;

const PRECACHE_URLS = [
  './',
  './index.html',
  './core.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable.png',
  './vendor/exifr/exifr.umd.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  /* Share target: intercept POST from Android share sheet — full handling in M9. */
  if (event.request.method === 'POST' && new URL(event.request.url).searchParams.has('shared')) {
    event.respondWith(Response.redirect('./'));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
