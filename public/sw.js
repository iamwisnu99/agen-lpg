self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// A fetch handler is required by Chromium to trigger the PWA install prompt.
self.addEventListener('fetch', (event) => {
  // We can just let the browser do its default thing for now.
});
