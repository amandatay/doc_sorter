/* Service worker — offline cache + share-target handler (M9).
 * Bump CACHE_VERSION whenever any cached file changes. */

const CACHE_VERSION = 12;
const CACHE_NAME = 'docsorter-v' + CACHE_VERSION;
const SHARE_QUEUE = 'docsorter-share-queue';

const PRECACHE_URLS = [
  './',
  './index.html',
  './core.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable.png',
  './vendor/exifr/exifr.umd.js',
  './vendor/jspdf/jspdf.umd.min.js',
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
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== SHARE_QUEUE)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  /* M9 Share target: intercept POST from Android share sheet.
   * Read the shared files from FormData, stash each as a Response in the
   * share-queue cache (keyed by a unique URL), then redirect to the app.
   * The app reads and clears the queue on startup when ?shared=1 is present. */
  if (event.request.method === 'POST' && new URL(event.request.url).searchParams.has('shared')) {
    event.respondWith(
      event.request.formData().then(async (formData) => {
        const files = formData.getAll('files');
        if (files.length) {
          const cache = await caches.open(SHARE_QUEUE);
          await Promise.all(files.map((file, i) => {
            const key = `share-item-${Date.now()}-${i}`;
            return cache.put(
              new Request(key),
              new Response(file, {
                headers: {
                  'Content-Type': file.type || 'image/jpeg',
                  'X-File-Name': file.name || 'shared.jpg',
                },
              })
            );
          }));
        }
        return Response.redirect('./');
      }).catch(() => Response.redirect('./'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
