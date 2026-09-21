/*
  Offline shell for the library.

  Everything the app needs is static, so caching the shell makes it usable
  with no connection. Navigations go to the network first so a new build is
  picked up immediately, with the cached page as the fallback. Build assets
  carry content hashes in their names, so they are safe to serve from cache.
*/
const CACHE = 'cairn-v2';
const OFFLINE_URL = 'index.html';

/* The Latin faces are precached so a first offline launch looks right.
   Latin Extended is left to the runtime cache: it only downloads when a
   character actually needs it. */
const PRECACHE = [
  OFFLINE_URL,
  'manifest.webmanifest',
  'icon.svg',
  'fonts/newsreader-latin-400-600.woff2',
  'fonts/mulish-latin-400-700.woff2',
  'fonts/dm-mono-latin-400.woff2',
  'fonts/dm-mono-latin-500.woff2',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)),
  );
  /* No skipWaiting here on purpose. A new worker that activates immediately
     swaps assets under a page that is already running, which can leave a
     half-updated app. It waits until the page asks, which happens when the
     user accepts the update prompt. */
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(OFFLINE_URL, copy));
          return response;
        })
        .catch(() => caches.match(OFFLINE_URL).then((hit) => hit ?? Response.error())),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ??
        fetch(request).then((response) => {
          if (response.ok && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        }),
    ),
  );
});
