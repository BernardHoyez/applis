
const CACHE_NAME = 'virtual-tour-cache-v1756889545927';
const urlsToCache = [
  "./",
  "./index.html",
  "./style.css",
  "./viewer.js",
  "./assets/IMG_20241212_120908.jpg",
  "./assets/thumb_IMG_20241212_120908.jpg",
  "./assets/DSCN4202_14jan_2015_interprétation_6déc_2020.jpg",
  "./assets/thumb_DSCN4202_14jan_2015_interprétation_6déc_2020.jpg",
  "./assets/Diapo43c_Dessin des falaises_2024_10_11_15_41_40_1.mp3",
  "./assets/VID_20241212_160922_Fagesia sur HG Antifer 3c.mp4",
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
