/* eslint-disable no-undef,no-restricted-globals */
console.log('service worker succeed for app Farmers Market');

const cacheName = 'dynamic-v1-250788600504456';

try {
  importScripts('https://cdn01.jotfor.ms/s/umd/696d8953db1/for-push-notification.js');
  self['for-push-notification'].initialize({
    resourceId: '250788600504456',
    resourceType: 'portal'
  });
} catch(err) {
  console.error('Can not initialize push notification service worker handlers', err);
}

const corsPreferences = new Map();

const excludePatterns = [
  /\/agent\/[a-zA-Z0-9]+\/avatar-icon/,
];

self.addEventListener('fetch', (event) => {
  if (event.request.destination !== 'image' || event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);
  
  for (const pattern of excludePatterns) {
    if (url.pathname.match(pattern)) {
      return;
    }
  }

  event.respondWith(caches.open(cacheName).then((cache) => {
    return cache.match(event.request).then(async (cachedResponse) => {
      if (cachedResponse) {
        if (cachedResponse.type === 'opaque') {
          fetch(event.request, { mode: "no-cors" }).then(response => {
            cache.put(event.request, response.clone());
          });
        }
        return cachedResponse;
      }

      const domain = new URL(event.request.url).origin;
      const preferredMode = corsPreferences.get(domain) || "cors";

      try {
        const networkResponse = await fetch(event.request, { mode: preferredMode, credentials: "same-origin" });
        if (preferredMode === "no-cors" || (preferredMode === "cors" && networkResponse.ok)) {
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      } catch (err) {
        if (preferredMode === "cors") {
          corsPreferences.set(domain, "no-cors");
          const response = await fetch(event.request, { mode: "no-cors" });
          cache.put(event.request, response.clone());
          return response;
        }
      }
    });
  }));
});

self.addEventListener('activate', event => {
  self.skipWaiting();
  event.waitUntil(self.clients.claim());
});

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(cacheName));
});

/* eslint-enable no-restricted-globals */
