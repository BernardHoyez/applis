
const CACHE_NAME = 'virtual-tour-cache-v1756829972303';
const urlsToCache = [
  "/",
  "/index.html",
  "/style.css",
  "/viewer.js",
  "/manifest.json",
  "/assets/IMG_3134.JPG",
  "/assets/hall_thumb.jpg",
  "/assets/Diapo41_Milankovitch_2024_10_11_13_10_18_1.mp3",
  "/assets/IMG_20201022_102613_bis.jpg",
  "/assets/expo_thumb.jpg",
  "/assets/Diapo41a_Milankovitch_2024_10_11_13_10_18_1.mp3",
  "/assets/Diapo10bis_Talus6500_2024_10_08_17_58_49_1.mp3",
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
