/**
 * Modern Performance Module
 * ==========================
 * Advanced performance optimizations:
 * - Intelligent image lazy loading with priority hints
 * - Prefetch/prerender for likely navigation targets
 * - Resource loading scheduler
 * - Web Vitals monitoring
 * - Memory-aware feature degradation
 */

(function() {
  'use strict';

  /* ========================================================================
     1. Intelligent Lazy Loading
     ======================================================================== */
  var LazyLoader = {
    observer: null,
    loaded: 0,

    init: function() {
      if (!('IntersectionObserver' in window)) return;

      this.observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;

          if (el.tagName === 'IMG') {
            LazyLoader.loadImage(el);
          } else if (el.dataset.bgSrc) {
            el.style.backgroundImage = 'url(' + el.dataset.bgSrc + ')';
            el.classList.add('is-loaded');
          }

          LazyLoader.observer.unobserve(el);
          LazyLoader.loaded++;
        });
      }, {
        rootMargin: '300px 0px',
        threshold: 0.01
      });

      this.observeAll();
    },

    loadImage: function(img) {
      if (img.dataset.srcset) {
        img.srcset = img.dataset.srcset;
        delete img.dataset.srcset;
      }
      if (img.dataset.src) {
        img.src = img.dataset.src;
        delete img.dataset.src;
      }
      if (img.dataset.sizes) {
        img.sizes = img.dataset.sizes;
        delete img.dataset.sizes;
      }
      img.classList.add('is-loaded');
    },

    observeAll: function() {
      if (!this.observer) return;
      document.querySelectorAll('img[data-src], [data-bg-src]').forEach(function(el) {
        LazyLoader.observer.observe(el);
      });
    },

    /* Immediately load images in viewport (for LCP) */
    prioritize: function(selector) {
      document.querySelectorAll(selector).forEach(function(img) {
        if (img.dataset.src) {
          LazyLoader.loadImage(img);
        }
      });
    }
  };

  /* ========================================================================
     2. Link Prefetching
     ======================================================================== */
  var Prefetcher = {
    prefetched: new Set(),
    observer: null,

    init: function() {
      /* Don't prefetch on slow connections or save-data */
      if (window.ModernPerf && window.ModernPerf.isSlowConnection()) return;
      if (!('IntersectionObserver' in window)) return;

      /* Prefetch links in viewport */
      this.observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            var href = entry.target.href;
            if (href) Prefetcher.prefetch(href);
            Prefetcher.observer.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px' });

      /* Observe product links and navigation links */
      document.querySelectorAll('a[href^="/products/"], a[href^="/collections/"]').forEach(function(link) {
        Prefetcher.observer.observe(link);
      });

      /* Also prefetch on hover with a small delay */
      document.addEventListener('mouseover', function(e) {
        var link = e.target.closest('a[href]');
        if (!link) return;
        var href = link.href;
        if (!href || href.includes('#') || href.startsWith('javascript')) return;
        if (!href.includes(window.location.host)) return;

        /* Slight delay to avoid prefetching on quick mouse movements */
        link._prefetchTimer = setTimeout(function() {
          Prefetcher.prefetch(href);
        }, 65);
      });

      document.addEventListener('mouseout', function(e) {
        var link = e.target.closest('a[href]');
        if (link && link._prefetchTimer) {
          clearTimeout(link._prefetchTimer);
        }
      });
    },

    prefetch: function(url) {
      if (this.prefetched.has(url)) return;
      if (this.prefetched.size > 10) return; /* Limit prefetch count */
      this.prefetched.add(url);

      var link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      link.as = 'document';
      document.head.appendChild(link);
    }
  };

  /* ========================================================================
     3. Resource Loading Scheduler
     ======================================================================== */
  var ResourceScheduler = {
    queue: [],
    running: false,

    /* Schedule a resource to load during idle time */
    schedule: function(callback, priority) {
      this.queue.push({ fn: callback, priority: priority || 0 });
      this.queue.sort(function(a, b) { return b.priority - a.priority; });
      this.process();
    },

    process: function() {
      if (this.running || !this.queue.length) return;
      this.running = true;

      var self = this;
      var task = this.queue.shift();

      if ('requestIdleCallback' in window) {
        requestIdleCallback(function(deadline) {
          task.fn();
          self.running = false;
          if (self.queue.length) self.process();
        }, { timeout: 2000 });
      } else {
        setTimeout(function() {
          task.fn();
          self.running = false;
          if (self.queue.length) self.process();
        }, 100);
      }
    },

    /* Load a script asynchronously */
    loadScript: function(src, callback) {
      var script = document.createElement('script');
      script.src = src;
      script.async = true;
      if (callback) script.onload = callback;
      document.body.appendChild(script);
    }
  };

  /* ========================================================================
     4. Web Vitals Monitoring
     ======================================================================== */
  var VitalsMonitor = {
    metrics: {},

    init: function() {
      /* Largest Contentful Paint */
      if ('PerformanceObserver' in window) {
        try {
          var lcpObserver = new PerformanceObserver(function(list) {
            var entries = list.getEntries();
            var last = entries[entries.length - 1];
            VitalsMonitor.metrics.lcp = Math.round(last.startTime);
          });
          lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
        } catch (e) { /* not supported */ }

        /* First Input Delay */
        try {
          var fidObserver = new PerformanceObserver(function(list) {
            var entry = list.getEntries()[0];
            VitalsMonitor.metrics.fid = Math.round(entry.processingStart - entry.startTime);
          });
          fidObserver.observe({ type: 'first-input', buffered: true });
        } catch (e) { /* not supported */ }

        /* Cumulative Layout Shift */
        try {
          var clsValue = 0;
          var clsObserver = new PerformanceObserver(function(list) {
            list.getEntries().forEach(function(entry) {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
                VitalsMonitor.metrics.cls = Math.round(clsValue * 1000) / 1000;
              }
            });
          });
          clsObserver.observe({ type: 'layout-shift', buffered: true });
        } catch (e) { /* not supported */ }
      }

      /* Navigation timing */
      window.addEventListener('load', function() {
        setTimeout(function() {
          var nav = performance.getEntriesByType('navigation')[0];
          if (nav) {
            VitalsMonitor.metrics.ttfb = Math.round(nav.responseStart);
            VitalsMonitor.metrics.domReady = Math.round(nav.domContentLoadedEventEnd);
            VitalsMonitor.metrics.load = Math.round(nav.loadEventEnd);
          }
        }, 0);
      });
    },

    /* Get all collected metrics */
    getMetrics: function() {
      return Object.assign({}, this.metrics);
    },

    /* Log metrics to console (debug mode) */
    log: function() {
      console.table(this.metrics);
    }
  };

  /* ========================================================================
     5. Memory-Aware Feature Degradation
     ======================================================================== */
  var MemoryManager = {
    init: function() {
      if (!navigator.deviceMemory && !navigator.hardwareConcurrency) return;

      var memory = navigator.deviceMemory || 4; /* GB */
      var cores = navigator.hardwareConcurrency || 4;

      /* Low-end device detection */
      if (memory <= 2 || cores <= 2) {
        document.documentElement.classList.add('modern-low-end');
        /* Reduce animation complexity */
        document.documentElement.style.setProperty('--modern-animation-budget', '2');
      }

      /* Medium device */
      if (memory <= 4 || cores <= 4) {
        document.documentElement.style.setProperty('--modern-animation-budget', '5');
      }
    }
  };

  /* ========================================================================
     6. Scroll Performance
     ======================================================================== */
  var ScrollOptimizer = {
    ticking: false,
    callbacks: [],

    init: function() {
      var self = this;
      window.addEventListener('scroll', function() {
        if (!self.ticking) {
          requestAnimationFrame(function() {
            self.callbacks.forEach(function(cb) { cb(); });
            self.ticking = false;
          });
          self.ticking = true;
        }
      }, { passive: true });
    },

    onScroll: function(callback) {
      this.callbacks.push(callback);
    }
  };

  /* ========================================================================
     Initialize All Modules
     ======================================================================== */
  function init() {
    LazyLoader.init();
    LazyLoader.prioritize('.modern-hero img, .modern-header img');
    Prefetcher.init();
    VitalsMonitor.init();
    MemoryManager.init();
    ScrollOptimizer.init();

    /* Mark theme ready */
    if (window.ModernPerf) {
      window.ModernPerf.mark('theme-ready');
    }
  }

  /* Expose API */
  window.ModernPerformance = {
    LazyLoader: LazyLoader,
    Prefetcher: Prefetcher,
    ResourceScheduler: ResourceScheduler,
    VitalsMonitor: VitalsMonitor,
    ScrollOptimizer: ScrollOptimizer
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* Re-observe on Shopify section load */
  document.addEventListener('shopify:section:load', function() {
    LazyLoader.observeAll();
  });
})();
