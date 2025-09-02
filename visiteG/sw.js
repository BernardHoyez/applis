
const CACHE_NAME = 'virtual-tour-cache-v1756840388105';
const urlsToCache = [
  "./",
  "./index.html",
  "./style.css",
  "./viewer.js",
  "./assets/IMG_2055.JPG",
  "./assets/hall_thumb.jpg",
  "./assets/VID_20241212_154432.mp4",
  "./assets/IMG_2057.JPG",
  "./assets/expo_thumb.jpg",
  "./assets/Diapo01_Muraille_2024_10_07_22_41_41_1.mp3",
  "./tour.json",
  "./icons/icon-192.svg",
  "./icons/icon-512.svg",
  "./manifest.json"
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Opened cache and caching files:', urlsToCache);
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
