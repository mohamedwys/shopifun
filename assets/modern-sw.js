/**
 * Modern Theme Service Worker
 * ============================
 * Provides offline support, caching strategies, and performance improvements.
 *
 * Cache strategies:
 * - Cache-first for static assets (CSS, JS, images, fonts)
 * - Network-first for HTML pages
 * - Stale-while-revalidate for API calls
 */

var CACHE_VERSION = 'modern-theme-v1';
var STATIC_CACHE = CACHE_VERSION + '-static';
var DYNAMIC_CACHE = CACHE_VERSION + '-dynamic';
var IMAGE_CACHE = CACHE_VERSION + '-images';

var MAX_DYNAMIC_CACHE = 50;
var MAX_IMAGE_CACHE = 100;

/* Assets to precache */
var PRECACHE_ASSETS = [
  '/offline'
];

/* Install: precache essential assets */
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(function(cache) {
      return cache.addAll(PRECACHE_ASSETS).catch(function() {
        /* Silently fail if offline page doesn't exist */
      });
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

/* Activate: clean old caches */
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) {
          return key.startsWith('modern-theme-') && key !== STATIC_CACHE && key !== DYNAMIC_CACHE && key !== IMAGE_CACHE;
        }).map(function(key) {
          return caches.delete(key);
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

/* Fetch: apply caching strategies */
self.addEventListener('fetch', function(event) {
  var request = event.request;
  var url = new URL(request.url);

  /* Skip non-GET requests */
  if (request.method !== 'GET') return;

  /* Skip admin, checkout, and cart API */
  if (url.pathname.startsWith('/admin') ||
      url.pathname.startsWith('/checkout') ||
      url.pathname.includes('/cart/') ||
      url.pathname.includes('.json')) {
    return;
  }

  /* Strategy: Cache-first for static assets */
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  /* Strategy: Cache-first for images */
  if (isImage(url)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE, MAX_IMAGE_CACHE));
    return;
  }

  /* Strategy: Network-first for pages */
  if (request.headers.get('accept') && request.headers.get('accept').includes('text/html')) {
    event.respondWith(networkFirst(request));
    return;
  }

  /* Default: stale-while-revalidate */
  event.respondWith(staleWhileRevalidate(request));
});

/* ========================================================================
   Caching Strategies
   ======================================================================== */

function cacheFirst(request, cacheName, maxEntries) {
  return caches.open(cacheName).then(function(cache) {
    return cache.match(request).then(function(cached) {
      if (cached) return cached;

      return fetch(request).then(function(response) {
        if (response.ok) {
          var clone = response.clone();
          if (maxEntries) {
            trimCache(cacheName, maxEntries).then(function() {
              cache.put(request, clone);
            });
          } else {
            cache.put(request, clone);
          }
        }
        return response;
      });
    });
  }).catch(function() {
    return fetch(request);
  });
}

function networkFirst(request) {
  return fetch(request).then(function(response) {
    if (response.ok) {
      var clone = response.clone();
      caches.open(DYNAMIC_CACHE).then(function(cache) {
        cache.put(request, clone);
      });
    }
    return response;
  }).catch(function() {
    return caches.match(request).then(function(cached) {
      if (cached) return cached;
      /* Return offline page for navigation requests */
      if (request.headers.get('accept') && request.headers.get('accept').includes('text/html')) {
        return caches.match('/offline');
      }
      return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
    });
  });
}

function staleWhileRevalidate(request) {
  return caches.open(DYNAMIC_CACHE).then(function(cache) {
    return cache.match(request).then(function(cached) {
      var fetchPromise = fetch(request).then(function(response) {
        if (response.ok) {
          cache.put(request, response.clone());
        }
        return response;
      }).catch(function() {
        return cached;
      });

      return cached || fetchPromise;
    });
  });
}

/* ========================================================================
   Helpers
   ======================================================================== */

function isStaticAsset(url) {
  return /\.(css|js|woff2?|ttf|eot)(\?.*)?$/.test(url.pathname) ||
         url.hostname === 'cdn.shopify.com' && /\.(css|js)/.test(url.pathname);
}

function isImage(url) {
  return /\.(jpe?g|png|gif|svg|webp|avif|ico)(\?.*)?$/.test(url.pathname);
}

function trimCache(cacheName, maxEntries) {
  return caches.open(cacheName).then(function(cache) {
    return cache.keys().then(function(keys) {
      if (keys.length <= maxEntries) return;
      /* Remove oldest entries */
      var toDelete = keys.slice(0, keys.length - maxEntries);
      return Promise.all(toDelete.map(function(key) {
        return cache.delete(key);
      }));
    });
  });
}
