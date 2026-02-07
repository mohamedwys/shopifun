/**
 * Modern Mobile Enhancements
 * ============================
 * Touch gestures, swipe navigation, mobile menu improvements,
 * pull-to-refresh, and mobile-specific UX optimizations.
 */

(function() {
  'use strict';

  /* ========================================================================
     1. Touch Gesture Handler
     ======================================================================== */
  var GestureHandler = {
    init: function() {
      this.initSwipeBack();
      this.initPullToRefresh();
      this.initDoubleTapZoom();
    },

    /* Swipe from left edge to go back */
    initSwipeBack: function() {
      if (!('ontouchstart' in window)) return;

      var startX = 0, startY = 0, tracking = false;
      var indicator = null;

      document.addEventListener('touchstart', function(e) {
        var touch = e.touches[0];
        if (touch.clientX < 20) {
          startX = touch.clientX;
          startY = touch.clientY;
          tracking = true;
        }
      }, { passive: true });

      document.addEventListener('touchmove', function(e) {
        if (!tracking) return;
        var dx = e.touches[0].clientX - startX;
        var dy = Math.abs(e.touches[0].clientY - startY);

        if (dy > 30) { tracking = false; return; }

        if (dx > 20) {
          if (!indicator) {
            indicator = document.createElement('div');
            indicator.style.cssText = 'position:fixed;left:0;top:50%;transform:translateY(-50%);width:4px;height:60px;background:var(--color-button,#667eea);border-radius:0 4px 4px 0;z-index:10000;transition:width 0.15s ease,opacity 0.15s ease;opacity:0.8;';
            document.body.appendChild(indicator);
          }
          var progress = Math.min(dx / 100, 1);
          indicator.style.width = (4 + progress * 20) + 'px';
          indicator.style.opacity = Math.min(0.3 + progress * 0.7, 1);
        }
      }, { passive: true });

      document.addEventListener('touchend', function(e) {
        if (!tracking) return;
        tracking = false;

        var endX = e.changedTouches[0].clientX;
        if (endX - startX > 80) {
          window.history.back();
        }

        if (indicator) {
          indicator.style.opacity = '0';
          setTimeout(function() {
            if (indicator && indicator.parentNode) {
              indicator.parentNode.removeChild(indicator);
            }
            indicator = null;
          }, 200);
        }
      }, { passive: true });
    },

    /* Pull to refresh (custom implementation) */
    initPullToRefresh: function() {
      if (!('ontouchstart' in window)) return;
      if (window.matchMedia('(min-width: 750px)').matches) return;

      var startY = 0, pulling = false, threshold = 80;
      var refreshEl = null;

      document.addEventListener('touchstart', function(e) {
        if (window.scrollY === 0 && !pulling) {
          startY = e.touches[0].clientY;
        }
      }, { passive: true });

      document.addEventListener('touchmove', function(e) {
        if (window.scrollY > 0 || startY === 0) return;
        var dy = e.touches[0].clientY - startY;

        if (dy > 10 && !pulling) {
          pulling = true;
          if (!refreshEl) {
            refreshEl = document.createElement('div');
            refreshEl.style.cssText = 'position:fixed;top:0;left:50%;transform:translateX(-50%);z-index:10000;padding:12px;transition:transform 0.2s ease;';
            refreshEl.innerHTML = '<div style="width:24px;height:24px;border:2px solid rgba(128,128,128,0.2);border-top-color:var(--color-button,#667eea);border-radius:50%;animation:modernSpinBtn 0.6s linear infinite;"></div>';
            document.body.appendChild(refreshEl);
          }
        }

        if (pulling && refreshEl) {
          var progress = Math.min(dy / threshold, 1);
          refreshEl.style.transform = 'translateX(-50%) translateY(' + Math.min(dy * 0.5, 60) + 'px)';
          refreshEl.style.opacity = progress;
        }
      }, { passive: true });

      document.addEventListener('touchend', function() {
        if (!pulling) { startY = 0; return; }
        pulling = false;
        startY = 0;

        if (refreshEl) {
          var dy = parseFloat(refreshEl.style.transform.match(/translateY\((\d+)/)?.[1] || 0);
          if (dy >= 50) {
            window.location.reload();
          } else {
            refreshEl.style.opacity = '0';
            setTimeout(function() {
              if (refreshEl && refreshEl.parentNode) refreshEl.parentNode.removeChild(refreshEl);
              refreshEl = null;
            }, 200);
          }
        }
      }, { passive: true });
    },

    /* Prevent accidental double-tap zoom on buttons */
    initDoubleTapZoom: function() {
      if (!('ontouchstart' in window)) return;
      var lastTap = 0;
      document.addEventListener('touchend', function(e) {
        var target = e.target.closest('button, a, [role="button"], .modern-btn');
        if (!target) return;
        var now = Date.now();
        if (now - lastTap < 300) {
          e.preventDefault();
        }
        lastTap = now;
      }, { passive: false });
    }
  };

  /* ========================================================================
     2. Mobile Menu Enhancements
     ======================================================================== */
  var MobileMenu = {
    init: function() {
      if (window.matchMedia('(min-width: 750px)').matches) return;

      /* Add swipe to close for any mobile drawer */
      document.querySelectorAll('[data-mobile-drawer]').forEach(function(drawer) {
        var startX = 0;
        drawer.addEventListener('touchstart', function(e) {
          startX = e.touches[0].clientX;
        }, { passive: true });

        drawer.addEventListener('touchend', function(e) {
          var dx = startX - e.changedTouches[0].clientX;
          if (dx > 50) {
            var closeBtn = drawer.querySelector('[data-drawer-close], .drawer__close');
            if (closeBtn) closeBtn.click();
          }
        }, { passive: true });
      });
    }
  };

  /* ========================================================================
     3. Bottom Navigation Bar (Mobile)
     ======================================================================== */
  var BottomNav = {
    init: function() {
      var nav = document.querySelector('.modern-bottom-nav');
      if (!nav) return;

      /* Hide on scroll down, show on scroll up */
      var lastScroll = 0;
      var ticking = false;

      window.addEventListener('scroll', function() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function() {
          var currentScroll = window.scrollY;
          if (currentScroll > lastScroll && currentScroll > 100) {
            nav.style.transform = 'translateY(100%)';
          } else {
            nav.style.transform = 'translateY(0)';
          }
          lastScroll = currentScroll;
          ticking = false;
        });
      }, { passive: true });
    }
  };

  /* ========================================================================
     4. Viewport Height Fix (iOS address bar)
     ======================================================================== */
  var ViewportFix = {
    init: function() {
      function setVH() {
        var vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', vh + 'px');
      }
      setVH();
      window.addEventListener('resize', setVH);
    }
  };

  /* ========================================================================
     5. Haptic Feedback (if supported)
     ======================================================================== */
  window.ModernHaptic = {
    light: function() {
      if (navigator.vibrate) navigator.vibrate(10);
    },
    medium: function() {
      if (navigator.vibrate) navigator.vibrate(20);
    },
    heavy: function() {
      if (navigator.vibrate) navigator.vibrate([30, 10, 30]);
    }
  };

  /* ========================================================================
     Initialize
     ======================================================================== */
  function init() {
    ViewportFix.init();

    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      GestureHandler.init();
      MobileMenu.init();
      BottomNav.init();

      /* Add haptic to add-to-cart buttons */
      document.addEventListener('click', function(e) {
        if (e.target.closest('[data-add-to-cart], .modern-product-card__quick-add')) {
          window.ModernHaptic.light();
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
