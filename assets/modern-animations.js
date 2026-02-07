/**
 * Modern Animations Engine
 * ========================
 * High-performance animation system using Intersection Observer,
 * requestAnimationFrame, and GPU-accelerated transforms.
 *
 * Features:
 * - Scroll-triggered reveal animations with stagger
 * - Parallax scrolling effects
 * - Smooth scroll progress tracking
 * - Lazy image loading with fade-in
 * - Page transition effects
 * - Magnetic cursor effects for buttons
 * - Tilt effects for cards
 * - Scroll-based header show/hide
 */

(function () {
  'use strict';

  /* ========================================================================
     UTILITY FUNCTIONS
     ======================================================================== */

  /** Throttle function execution to once per animation frame */
  function rafThrottle(fn) {
    let ticking = false;
    return function (...args) {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          fn.apply(this, args);
          ticking = false;
        });
      }
    };
  }

  /** Debounce function execution */
  function debounce(fn, delay = 100) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  /** Check if user prefers reduced motion */
  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /** Clamp a number between min and max */
  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  /** Linear interpolation */
  function lerp(start, end, factor) {
    return start + (end - start) * factor;
  }

  /* ========================================================================
     1. SCROLL REVEAL ANIMATIONS
     ======================================================================== */

  class ScrollReveal {
    constructor() {
      if (prefersReducedMotion()) {
        this.revealAll();
        return;
      }

      this.observer = new IntersectionObserver(
        this.onIntersect.bind(this),
        {
          rootMargin: '0px 0px -60px 0px',
          threshold: 0.1,
        }
      );

      this.init();
    }

    init() {
      const elements = document.querySelectorAll('.modern-animate');
      elements.forEach((el) => this.observer.observe(el));
    }

    onIntersect(entries) {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          this.observer.unobserve(entry.target);
        }
      });
    }

    revealAll() {
      document.querySelectorAll('.modern-animate').forEach((el) => {
        el.classList.add('is-visible');
      });
    }

    /** Observe new elements dynamically added to the DOM */
    observe(container = document) {
      if (prefersReducedMotion()) {
        container.querySelectorAll('.modern-animate').forEach((el) => {
          el.classList.add('is-visible');
        });
        return;
      }
      container.querySelectorAll('.modern-animate:not(.is-visible)').forEach((el) => {
        this.observer.observe(el);
      });
    }

    destroy() {
      if (this.observer) {
        this.observer.disconnect();
      }
    }
  }

  /* ========================================================================
     2. PARALLAX SCROLL EFFECTS
     ======================================================================== */

  class ParallaxEngine {
    constructor() {
      if (prefersReducedMotion()) return;

      this.elements = [];
      this.scrollY = window.scrollY;
      this.viewportHeight = window.innerHeight;
      this.ticking = false;

      this.init();
    }

    init() {
      document.querySelectorAll('[data-parallax]').forEach((el) => {
        const speed = parseFloat(el.dataset.parallax) || 0.3;
        const direction = el.dataset.parallaxDirection || 'vertical';
        this.elements.push({ el, speed, direction });
      });

      if (this.elements.length === 0) return;

      this.onScroll = rafThrottle(this.update.bind(this));
      this.onResize = debounce(this.resize.bind(this));

      window.addEventListener('scroll', this.onScroll, { passive: true });
      window.addEventListener('resize', this.onResize, { passive: true });

      this.update();
    }

    update() {
      this.scrollY = window.scrollY;

      this.elements.forEach(({ el, speed, direction }) => {
        const rect = el.getBoundingClientRect();
        const elementCenter = rect.top + rect.height / 2;
        const distanceFromCenter = elementCenter - this.viewportHeight / 2;
        const offset = distanceFromCenter * speed * -1;

        if (direction === 'horizontal') {
          el.style.transform = `translate3d(${offset}px, 0, 0)`;
        } else {
          el.style.transform = `translate3d(0, ${offset}px, 0)`;
        }
      });
    }

    resize() {
      this.viewportHeight = window.innerHeight;
      this.update();
    }

    destroy() {
      window.removeEventListener('scroll', this.onScroll);
      window.removeEventListener('resize', this.onResize);
    }
  }

  /* ========================================================================
     3. SCROLL PROGRESS INDICATOR
     ======================================================================== */

  class ScrollProgress {
    constructor() {
      this.bar = document.querySelector('.scroll-progress');
      if (!this.bar) return;

      this.onScroll = rafThrottle(this.update.bind(this));
      window.addEventListener('scroll', this.onScroll, { passive: true });
      this.update();
    }

    update() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      this.bar.style.width = `${progress}%`;
    }

    destroy() {
      window.removeEventListener('scroll', this.onScroll);
    }
  }

  /* ========================================================================
     4. SMART STICKY HEADER
     ======================================================================== */

  class StickyHeader {
    constructor() {
      this.header = document.querySelector('.modern-header-wrapper');
      if (!this.header) return;

      this.lastScrollY = 0;
      this.scrollThreshold = 80;
      this.hideThreshold = 200;
      this.delta = 5;

      this.onScroll = rafThrottle(this.update.bind(this));
      window.addEventListener('scroll', this.onScroll, { passive: true });
      this.update();
    }

    update() {
      const currentScrollY = window.scrollY;
      const diff = currentScrollY - this.lastScrollY;

      if (currentScrollY > this.scrollThreshold) {
        this.header.classList.add('is-scrolled');
      } else {
        this.header.classList.remove('is-scrolled');
      }

      if (Math.abs(diff) < this.delta) return;

      if (diff > 0 && currentScrollY > this.hideThreshold) {
        // Scrolling down
        this.header.classList.add('is-hidden');
        this.header.classList.remove('is-visible');
      } else {
        // Scrolling up
        this.header.classList.remove('is-hidden');
        this.header.classList.add('is-visible');
      }

      this.lastScrollY = currentScrollY;
    }

    destroy() {
      window.removeEventListener('scroll', this.onScroll);
    }
  }

  /* ========================================================================
     5. LAZY IMAGE LOADER
     ======================================================================== */

  class LazyImages {
    constructor() {
      this.observer = new IntersectionObserver(
        this.onIntersect.bind(this),
        {
          rootMargin: '200px 0px',
          threshold: 0,
        }
      );

      this.init();
    }

    init() {
      document.querySelectorAll('.modern-img[data-src]').forEach((img) => {
        this.observer.observe(img);
      });
    }

    onIntersect(entries) {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.loadImage(entry.target);
          this.observer.unobserve(entry.target);
        }
      });
    }

    loadImage(img) {
      const src = img.dataset.src;
      const srcset = img.dataset.srcset;

      if (srcset) img.srcset = srcset;
      if (src) img.src = src;

      img.addEventListener('load', () => {
        img.classList.add('is-loaded');
        img.removeAttribute('data-src');
        img.removeAttribute('data-srcset');
      }, { once: true });
    }

    observe(container = document) {
      container.querySelectorAll('.modern-img[data-src]').forEach((img) => {
        this.observer.observe(img);
      });
    }

    destroy() {
      this.observer.disconnect();
    }
  }

  /* ========================================================================
     6. MAGNETIC BUTTON EFFECT
     ======================================================================== */

  class MagneticButtons {
    constructor() {
      if (prefersReducedMotion()) return;
      this.buttons = document.querySelectorAll('.modern-btn--magnetic');
      if (!this.buttons.length) return;
      this.init();
    }

    init() {
      this.buttons.forEach((btn) => {
        btn.addEventListener('mousemove', (e) => this.onMouseMove(e, btn));
        btn.addEventListener('mouseleave', (e) => this.onMouseLeave(e, btn));
      });
    }

    onMouseMove(e, btn) {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const strength = 0.3;

      btn.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
    }

    onMouseLeave(e, btn) {
      btn.style.transform = '';
    }
  }

  /* ========================================================================
     7. CARD TILT EFFECT
     ======================================================================== */

  class TiltCards {
    constructor() {
      if (prefersReducedMotion()) return;
      this.cards = document.querySelectorAll('.modern-card--tilt');
      if (!this.cards.length) return;
      this.init();
    }

    init() {
      this.cards.forEach((card) => {
        card.addEventListener('mousemove', (e) => this.onMouseMove(e, card));
        card.addEventListener('mouseleave', (e) => this.onMouseLeave(e, card));
      });
    }

    onMouseMove(e, card) {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      const tiltX = (y - 0.5) * -12;
      const tiltY = (x - 0.5) * 12;

      card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`;
    }

    onMouseLeave(e, card) {
      card.style.transform = '';
    }
  }

  /* ========================================================================
     8. BUTTON RIPPLE EFFECT
     ======================================================================== */

  class RippleEffect {
    constructor() {
      document.addEventListener('click', (e) => {
        const btn = e.target.closest('.modern-btn');
        if (!btn) return;
        this.createRipple(e, btn);
      });
    }

    createRipple(e, btn) {
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;

      btn.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
    }
  }

  /* ========================================================================
     9. DARK MODE TOGGLE
     ======================================================================== */

  class DarkMode {
    constructor() {
      this.toggleBtns = document.querySelectorAll('.dark-mode-toggle');
      if (!this.toggleBtns.length) return;

      this.init();
    }

    init() {
      // Restore from localStorage
      const saved = localStorage.getItem('theme-dark-mode');
      if (saved === 'true') {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else if (saved === null && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        // Respect system preference if no explicit choice
        document.documentElement.setAttribute('data-theme', 'dark');
      }

      this.toggleBtns.forEach((btn) => {
        btn.addEventListener('click', () => this.toggle());
      });

      // Listen for system theme changes
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (localStorage.getItem('theme-dark-mode') === null) {
          document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        }
      });
    }

    toggle() {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const newTheme = isDark ? 'light' : 'dark';

      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme-dark-mode', newTheme === 'dark');
    }

    isDark() {
      return document.documentElement.getAttribute('data-theme') === 'dark';
    }
  }

  /* ========================================================================
     10. SMOOTH SCROLL LINKS
     ======================================================================== */

  class SmoothScroll {
    constructor() {
      document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href^="#"]');
        if (!link) return;

        const targetId = link.getAttribute('href');
        if (targetId === '#') return;

        const target = document.querySelector(targetId);
        if (!target) return;

        e.preventDefault();
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top + window.scrollY;
        const offsetPosition = elementPosition - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        });
      });
    }
  }

  /* ========================================================================
     11. PAGE TRANSITION EFFECT
     ======================================================================== */

  class PageTransitions {
    constructor() {
      if (prefersReducedMotion()) return;

      this.overlay = document.querySelector('.page-transition-overlay');
      if (!this.overlay) return;

      // Fade in on page load
      this.overlay.classList.remove('is-active');

      // Fade out on navigation
      document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href]');
        if (!link) return;
        if (link.hostname !== window.location.hostname) return;
        if (link.getAttribute('href').startsWith('#')) return;
        if (link.hasAttribute('target')) return;

        e.preventDefault();
        this.overlay.classList.add('is-active');
        setTimeout(() => {
          window.location.href = link.href;
        }, 300);
      });
    }
  }

  /* ========================================================================
     12. TOAST NOTIFICATION SYSTEM
     ======================================================================== */

  class ToastNotification {
    static show(message, type = 'default', duration = 3000) {
      const existing = document.querySelector('.modern-toast');
      if (existing) existing.remove();

      const toast = document.createElement('div');
      toast.className = `modern-toast ${type !== 'default' ? `modern-toast--${type}` : ''}`;
      toast.textContent = message;

      document.body.appendChild(toast);

      // Trigger animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          toast.classList.add('is-visible');
        });
      });

      setTimeout(() => {
        toast.classList.remove('is-visible');
        setTimeout(() => toast.remove(), 400);
      }, duration);
    }
  }

  /* ========================================================================
     13. QUICK VIEW CONTROLLER
     ======================================================================== */

  class QuickView {
    constructor() {
      this.overlay = document.querySelector('.quick-view-overlay');
      this.modal = document.querySelector('.quick-view-modal');
      if (!this.overlay || !this.modal) return;

      this.init();
    }

    init() {
      // Open quick view triggers
      document.addEventListener('click', (e) => {
        const trigger = e.target.closest('[data-quick-view]');
        if (trigger) {
          e.preventDefault();
          const productUrl = trigger.dataset.quickView;
          this.open(productUrl);
        }
      });

      // Close on overlay click
      this.overlay.addEventListener('click', () => this.close());

      // Close button
      const closeBtn = this.modal.querySelector('.quick-view__close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.close());
      }

      // Close on Escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen()) this.close();
      });
    }

    async open(productUrl) {
      if (!productUrl) return;

      this.overlay.classList.add('is-active');
      this.modal.classList.add('is-active');
      document.body.style.overflow = 'hidden';

      try {
        const response = await fetch(`${productUrl}?section_id=modern-quick-view`);
        const html = await response.text();
        const body = this.modal.querySelector('.quick-view__body');
        if (body) body.innerHTML = html;
      } catch (err) {
        console.error('Quick view load error:', err);
        this.close();
      }
    }

    close() {
      this.overlay.classList.remove('is-active');
      this.modal.classList.remove('is-active');
      document.body.style.overflow = '';
    }

    isOpen() {
      return this.modal.classList.contains('is-active');
    }
  }

  /* ========================================================================
     14. COUNTER ANIMATION (for stats/numbers)
     ======================================================================== */

  class CounterAnimation {
    constructor() {
      this.observer = new IntersectionObserver(
        this.onIntersect.bind(this),
        { threshold: 0.5 }
      );

      document.querySelectorAll('[data-counter]').forEach((el) => {
        this.observer.observe(el);
      });
    }

    onIntersect(entries) {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.animate(entry.target);
          this.observer.unobserve(entry.target);
        }
      });
    }

    animate(el) {
      const target = parseInt(el.dataset.counter, 10);
      const duration = parseInt(el.dataset.counterDuration, 10) || 2000;
      const start = 0;
      const startTime = performance.now();

      const update = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (target - start) * eased);

        el.textContent = current.toLocaleString();

        if (progress < 1) {
          requestAnimationFrame(update);
        }
      };

      requestAnimationFrame(update);
    }
  }

  /* ========================================================================
     INITIALIZATION
     ======================================================================== */

  // Store instances globally for access
  window.ModernTheme = window.ModernTheme || {};

  function initAll() {
    window.ModernTheme.scrollReveal = new ScrollReveal();
    window.ModernTheme.parallax = new ParallaxEngine();
    window.ModernTheme.scrollProgress = new ScrollProgress();
    window.ModernTheme.stickyHeader = new StickyHeader();
    window.ModernTheme.lazyImages = new LazyImages();
    window.ModernTheme.magneticButtons = new MagneticButtons();
    window.ModernTheme.tiltCards = new TiltCards();
    window.ModernTheme.ripple = new RippleEffect();
    window.ModernTheme.darkMode = new DarkMode();
    window.ModernTheme.smoothScroll = new SmoothScroll();
    window.ModernTheme.counters = new CounterAnimation();
    window.ModernTheme.quickView = new QuickView();

    // Toast is static, expose globally
    window.ModernTheme.toast = ToastNotification;
  }

  // Init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  // Support Shopify theme editor
  if (typeof Shopify !== 'undefined' && Shopify.designMode) {
    document.addEventListener('shopify:section:load', (event) => {
      if (window.ModernTheme.scrollReveal) {
        window.ModernTheme.scrollReveal.observe(event.target);
      }
      if (window.ModernTheme.lazyImages) {
        window.ModernTheme.lazyImages.observe(event.target);
      }
    });
  }
})();
