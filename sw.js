// Galactic Arcade VR is now Nebula Arcade (https://optimusgrok.github.io/nebula-arcade-vr-test/). This is the OLD link's self-destructing service worker.
// install: skipWaiting. activate: delete ONLY this link's own galactic-arcade_vrtest-* caches, unregister itself, then send every open window of this
// old link to the same page on the new link (query + hash kept). fetch: no handler logic, everything goes straight to the network.
const FAM = 'galactic-arcade_vrtest-';
const NEW = new URL('../nebula-arcade-vr-test/', self.registration.scope).href;
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    try { const ks = await caches.keys(); await Promise.all(ks.filter(k => k.startsWith(FAM)).map(k => caches.delete(k))); } catch (err) {}
    let wins = [];
    try { await self.clients.claim(); wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true }); } catch (err) {}
    try { await self.registration.unregister(); } catch (err) {}
    const scope = self.registration.scope;
    await Promise.all(wins.map(c => {
      try { const rest = c.url.startsWith(scope) ? c.url.slice(scope.length) : ''; return c.navigate(NEW + rest).catch(() => {}); } catch (err) { return null; }
    }));
  })());
});
self.addEventListener('fetch', () => {});   // network only (no respondWith)
