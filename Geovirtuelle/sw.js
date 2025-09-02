
const CACHE_NAME = 'virtual-tour-cache-v1756828327780';
const urlsToCache = [
  "/",
  "/index.html",
  "/style.css",
  "/viewer.js",
  "/manifest.json",
  "/assets/IMG_20250405_085521.jpg",
  "/assets/Diapo01_Muraille_2024_10_07_22_41_41_1.mp3",
  "/assets/Orival_YvesDSCN0520_4937bis.jpg",
  "/assets/hall_thumb.jpg",
  "/assets/Diapo02_éboulement du 15 juillet_2024_10_07_22_55_43_1.mp3",
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
