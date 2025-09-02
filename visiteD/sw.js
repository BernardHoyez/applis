
const CACHE_NAME = 'virtual-tour-cache-v1756837739706';
const urlsToCache = [
  "/",
  "/index.html",
  "/style.css",
  "/viewer.js",
  "/manifest.json",
  "/assets/IMG_2056.JPG",
  "/assets/hall_thumb.jpg",
  "/assets/IMG_2032.JPG",
  "/assets/expo_thumb.jpg",
  "/assets/IMG_2054.JPG",
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
