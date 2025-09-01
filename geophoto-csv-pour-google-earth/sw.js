const CACHE_NAME = 'geophoto-csv-cache-v1';
// Liste des fichiers essentiels de l'application à mettre en cache.
const urlsToCache = [
  '/',
  '/index.html',
  // Ajoutez ici les chemins vers vos fichiers JS/CSS si vous utilisez un bundler.
  // Pour la configuration actuelle avec des CDN, le service worker interceptera les requêtes.
];

// Événement d'installation : on ouvre le cache et on y ajoute nos fichiers.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache ouvert');
        return cache.addAll(urlsToCache);
      })
  );
});

// Événement fetch : on intercepte les requêtes réseau.
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si la ressource est dans le cache, on la retourne.
        if (response) {
          return response;
        }
        // Sinon, on effectue la requête réseau.
        return fetch(event.request);
      })
  );
});