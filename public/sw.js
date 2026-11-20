// TamTask PWA Service Worker
const CACHE_NAME = "tamtask-pwa-v1";
const STATIC_ASSETS = [
  "/",
  "/favicon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  "/manifest.json",
];

// Install: Cache core shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("[SW] Cache addAll warning:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: Clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch: Network First for API/Pages, Cache Fallback for offline resilience
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome-extension schemes
  if (request.method !== "GET" || url.protocol.startsWith("chrome-extension")) {
    return;
  }

  // Static assets (images, fonts, scripts): Stale-While-Revalidate
  if (
    request.destination === "image" ||
    request.destination === "font" ||
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".png")
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // HTML navigation & API: Network First with cache fallback
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        // Clone into cache if successful HTML response
        if (
          networkResponse.ok &&
          request.mode === "navigate"
        ) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        // Fallback to home page cache for navigation when offline
        if (request.mode === "navigate") {
          const rootCached = await caches.match("/");
          if (rootCached) return rootCached;
        }
        return new Response("Bạn đang ở chế độ ngoại tuyến (Offline).", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      })
  );
});

// Push notification listener (ready for Web Push)
self.addEventListener("push", (event) => {
  if (!event.data) return;
  try {
    const payload = event.data.json();
    const title = payload.title || "TamTask Thông Báo";
    const options = {
      body: payload.body || "Bạn có cập nhật mới trong công việc.",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: payload.url || "/" },
      vibrate: [100, 50, 100],
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    console.error("[SW] Push event error:", e);
  }
});

// Notification click: Open or focus app window
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
