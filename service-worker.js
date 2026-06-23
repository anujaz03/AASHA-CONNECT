const CACHE_NAME = 'aasha-connect-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/root.css',
  '/sliders.js',
  '/config.js',
  '/favicon.ico',
  '/asha-bg.jpg',
  '/asha-bg.webp',
  '/asha1.webp',
  '/asha2.jpg',
  '/asha3.jpg',
  '/asha4.jpg',
  '/0nuja.webp',
  '/aadhar-mock.json',
  '/worker/login.html',
  '/worker/dashboard.html',
  '/worker/families.html',
  '/worker/add-family.html',
  '/worker/qr.html',
  '/worker/worker.css',
  '/worker/worker.js',
  '/worker/workerdash.png',
  '/worker/js/db.js',
  '/worker/js/sync.js',
  '/worker/js/families.js',
  '/worker/js/ocr-processor.js',
  '/worker/js/status-banner.js',
  '/admin/login.html',
  '/admin/dashboard.html',
  '/admin/families.html',
  '/admin/workers.html',
  '/admin/reports.html',
  '/admin/registration.html',
  '/admin/admin.css',
  '/admin/admin.js',
  '/admin/dashboard.js',
  '/admin/workers.js',
  '/admin/reports.js',
  '/admin/registration.js',
  '/admin/families.js',
  '/admin/auth.css',
  '/admin/admindash.avif',
  '/admin/status-banner.js',
  '/family/scan.html',
  '/family/details.html',
  '/family/family.css',
  '/family/family.js',
  'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// Install Event - Pre-cache Static Assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[Service Worker] Pre-caching static assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean Up Old Caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Serve Cache First for Static Assets, Network Only/First for API
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip caching for backend API requests to ensure real-time data
  if (url.origin === 'https://aasha-connect.onrender.com' || url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Stale-While-Revalidate or Cache-First for static assets
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // Fetch fresh version in the background to update the cache
        fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => { /* Ignore background fetch failure offline */ });

        return cachedResponse;
      }

      // If not in cache, fallback to network
      return fetch(event.request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      });
    })
  );
});
