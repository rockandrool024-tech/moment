// App-shell-only service worker (Sprint 2 PWA infra). Deliberately does NOT
// cache API responses or attempt offline data sync — this schema has no
// conflict-resolution story for writes made while offline, so the only
// offline behavior is "show a friendly page," never stale/wrong app data.
const CACHE_NAME = "moment-shell-v1";
const SHELL_ASSETS = ["/manifest.json", "/offline.html", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // never touch the API origin

  // Navigations: network-first (always want fresh app data/routes), fall
  // back to the offline shell page only when the network is actually down.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/offline.html")));
    return;
  }

  // Static shell assets: cache-first, since these are versioned by CACHE_NAME.
  if (SHELL_ASSETS.includes(url.pathname)) {
    event.respondWith(caches.match(request).then((cached) => cached ?? fetch(request)));
  }
});
