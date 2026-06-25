const CACHE_NAME = 'quran-search-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/quran.json',
  '/surahs.json',
  '/icon-512.jpg',
  '/manifest.json'
];

// Install Event - Caching Assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching all assets for offline capability...');
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Cleaning old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Cache First, Fallback to Network
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request).then((response) => {
        // Return response if it's not valid
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // Cache new static requests on the fly (excluding APIs or tracking if any)
        const responseToCache = response.clone();
        const url = new URL(e.request.url);
        if (url.origin === self.location.origin) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        
        return response;
      });
    })
  );
});
