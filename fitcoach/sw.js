// Cache only the app shell. Camera frames and MediaPipe CDN/model requests are never cached.
const CACHE = 'fitcoach-selfhosted-v3';
const SHELL = ['./','./index.html','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('fitcoach-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  if (u.origin !== self.location.origin || !u.pathname.includes('/fitcoach/')) return;
  // Let large AI models and WASM use the browser's HTTP cache, not Cache Storage.
  if (u.pathname.includes('/fitcoach/vendor/')) return;
  e.respondWith(fetch(e.request).then(response => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(e.request,copy)).catch(()=>{});
    }
    return response;
  }).catch(()=>caches.match(e.request)));
});