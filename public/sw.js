/* ORIVIO Service Worker for PWA Offline Caching & Performance */

const CACHE_NAME = "orivio-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.ico",
  "/logo192.png",
  "/logo512.png"
];

// Install: cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: cleanup old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: network first with cache fallback for HTML/navigation, stale-while-revalidate for assets
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Ignore non-GET requests or chrome-extension requests
  if (req.method !== "GET" || !req.url.startsWith("http")) return;

  // For API streaming or requests to backend, let network handle directly
  if (req.url.includes("/api/songs/") && req.url.includes("/stream")) {
    return;
  }

  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch background update for cache
        fetch(req).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(req, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(req).then((networkResponse) => {
        if (networkResponse.status === 200 && (req.url.endsWith(".css") || req.url.endsWith(".js") || req.url.endsWith(".png") || req.url.endsWith(".jpg"))) {
          const clonedRes = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clonedRes));
        }
        return networkResponse;
      }).catch(() => {
        // If offline and requesting page navigation, return cached root index.html
        if (req.mode === "navigate") {
          return caches.match("/index.html");
        }
      });
    })
  );
});
