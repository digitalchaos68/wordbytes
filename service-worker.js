const CACHE_NAME = 'wordbytes-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/icon-192.png',
  '/icon-512.png'
  // Add other critical assets if needed
];

// === INSTALL EVENT ===
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache)
          .catch(err => {
            console.error('Failed to cache during install:', err);
            // Continue even if some files fail
          });
      })
    // Ensure service worker activates even if cache fails
    .then(() => self.skipWaiting())
  );
});

// === ACTIVATE EVENT ===
self.addEventListener('activate', (event) => {
  // Claim clients immediately
  event.waitUntil(self.clients.claim());
});

// === FETCH EVENT ===
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests (e.g., POST, etc.)
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached response if found
        if (response) {
          return response;
        }

        // Otherwise, fetch from network
        return fetch(event.request)
          .then((networkResponse) => {
            // Optionally cache new responses (advanced)
            return networkResponse;
          })
          .catch(() => {
            // Network failed — try fallback
            if (event.request.mode === 'navigate') {
              // Return app shell for navigation
              return caches.match('/index.html');
            }
            // For other assets (images, CSS), return nothing
            return new Response(null, { status: 404 });
          });
      })
  );
});