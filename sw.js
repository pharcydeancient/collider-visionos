// R6: Collider app-shell service worker.
// Network-first for every GET (online users always get the fresh deploy);
// the cache is only a fallback when the network fails. Video (range
// requests) is never cached.
'use strict';
const CACHE = 'collider-shell-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(
  caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim())));

const isMedia = (u) => /\.(mp4|webm)(\?|$)/.test(u);
function cacheable(req) {
  if (req.method !== 'GET' || req.headers.has('range')) return false;
  const u = new URL(req.url);
  if (isMedia(u.pathname) || u.searchParams.has('probe')) return false; // connectivity probe: always network
  return u.origin === self.location.origin || u.hostname.endsWith('gstatic.com');
}

self.addEventListener('message', (e) => {
  if (!e.data || e.data.type !== 'seed' || !Array.isArray(e.data.urls)) return;
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(
    e.data.urls
      .filter((u) => typeof u === 'string' && !isMedia(u))
      .filter((u) => { const h = new URL(u); return h.origin === self.location.origin || h.hostname.endsWith('gstatic.com'); })
      .map((u) => c.match(u).then((hit) => hit || fetch(u).then((r) => { if (r.ok) return c.put(u, r); }).catch(() => {}))))));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (!cacheable(req)) return;
  e.respondWith(
    fetch(req)
      .then((r) => {
        if (r.ok && (r.type === 'basic' || r.type === 'cors')) {
          const copy = r.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return r;
      })
      .catch(() => caches.match(req, { ignoreSearch: req.mode === 'navigate' })
        .then((hit) => hit || (req.mode === 'navigate' ? caches.match('./', { ignoreSearch: true }) : undefined))
        .then((hit) => hit || Response.error())));
});
