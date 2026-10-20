// Self-purging service worker: cleans up all old caches and unregisters itself
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
      .then(() => {
        return self.registration.unregister();
      })
  );
});

// Always pass network requests directly to server — zero local caching
self.addEventListener('fetch', (event) => {
  // Let the browser handle the request normally without cache interception
  return;
});
