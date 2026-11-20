// Kill switch for the service worker that the earlier PWA build registered.
// The web-only app no longer registers a service worker. Browsers that still
// have the old one fetch this file on their next update check; it clears the
// PWA caches, unregisters itself and reloads open tabs so they get the
// current version from the network. Safe to delete once old installs are gone.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith('ngsw:')).map((k) => caches.delete(k)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((client) => client.navigate(client.url));
    })(),
  );
});
