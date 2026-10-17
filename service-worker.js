// Basic service worker for offline caching (very small prototype)
const CACHE_NAME = 'bibi-plans-v1';
const URLS = ['/', '/index.html', '/assets/styles.css', '/src/app.js'];
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(URLS))
  );
});
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});
