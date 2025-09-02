
const CACHE_NAME = 'virtual-tour-cache-v1756820930926';
const urlsToCache = [
  "/",
  "/index.html",
  "/style.css",
  "/viewer.js",
  "/manifest.json",
  "/assets/P1250190.JPG",
  "/assets/station 2.mp3",
  "/assets/hall.jpg",
  "/assets/hall_thumb.jpg",
  "/assets/expo.jpg",
  "/assets/expo_thumb.jpg",
  "/tour.json"
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
