/**
 * Modern Theme Advanced Modules
 * ==============================
 * Additional JS modules: FilterSystem, ProductQuickShop, CartDrawer,
 * ImageZoom, Carousel, WishlistManager
 */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =========================================================================
     1. CAROUSEL — Universal carousel with touch, autoplay, dots, arrows
     ========================================================================= */
  class Carousel {
    constructor(el, options = {}) {
      this.el = el;
      this.track = el.querySelector('[data-carousel-track]');
      if (!this.track) return;

      this.slides = Array.from(this.track.children);
      this.opts = {
        autoplay: el.dataset.autoplay === 'true',
        interval: parseInt(el.dataset.interval) || 5000,
        loop: el.dataset.loop !== 'false',
        perView: parseInt(el.dataset.perView) || 1,
        gap: parseInt(el.dataset.gap) || 16,
        ...options,
      };

      this.current = 0;
      this.autoplayTimer = null;
      this.touchStartX = 0;
      this.touchDiffX = 0;

      this.init();
    }

    init() {
      this.updateLayout();
      this.bindEvents();
      this.buildDots();
      if (this.opts.autoplay && !prefersReducedMotion) this.startAutoplay();
      this.goTo(0);
    }

    updateLayout() {
      const gap = this.opts.gap;
      const perView = this.getPerView();
      const slideWidth = (this.el.offsetWidth - gap * (perView - 1)) / perView;

      this.slides.forEach((slide) => {
        slide.style.flex = `0 0 ${slideWidth}px`;
        slide.style.marginRight = `${gap}px`;
      });

      this.track.style.display = 'flex';
      this.track.style.transition = prefersReducedMotion
        ? 'none'
        : 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';

      this.maxIndex = Math.max(0, this.slides.length - perView);
    }

    getPerView() {
      const width = window.innerWidth;
      if (width < 750) return Math.min(this.opts.perView, 2);
      if (width < 990) return Math.min(this.opts.perView, 3);
      return this.opts.perView;
    }

    goTo(index) {
      if (index < 0) index = this.opts.loop ? this.maxIndex : 0;
      if (index > this.maxIndex) index = this.opts.loop ? 0 : this.maxIndex;
      this.current = index;

      const slide = this.slides[index];
      if (!slide) return;

      const offset = slide.offsetLeft - this.track.parentElement.offsetLeft;
      this.track.style.transform = `translateX(-${offset}px)`;

      this.updateDots();
      this.updateArrows();
    }

    next() {
      this.goTo(this.current + 1);
    }

    prev() {
      this.goTo(this.current - 1);
    }

    buildDots() {
      const dotsContainer = this.el.querySelector('[data-carousel-dots]');
      if (!dotsContainer) return;

      dotsContainer.innerHTML = '';
      const count = this.maxIndex + 1;
      for (let i = 0; i < count; i++) {
        const dot = document.createElement('button');
        dot.className = 'modern-carousel__dot';
        dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
        dot.addEventListener('click', () => this.goTo(i));
        dotsContainer.appendChild(dot);
      }
    }

    updateDots() {
      const dots = this.el.querySelectorAll('.modern-carousel__dot');
      dots.forEach((dot, i) => {
        dot.classList.toggle('is-active', i === this.current);
      });
    }

    updateArrows() {
      const prevBtn = this.el.querySelector('[data-carousel-prev]');
      const nextBtn = this.el.querySelector('[data-carousel-next]');
      if (!this.opts.loop) {
        if (prevBtn) prevBtn.disabled = this.current === 0;
        if (nextBtn) nextBtn.disabled = this.current >= this.maxIndex;
      }
    }

    startAutoplay() {
      this.stopAutoplay();
      this.autoplayTimer = setInterval(() => this.next(), this.opts.interval);
    }

    stopAutoplay() {
      if (this.autoplayTimer) {
        clearInterval(this.autoplayTimer);
        this.autoplayTimer = null;
      }
    }

    bindEvents() {
      // Touch/swipe
      this.track.addEventListener('touchstart', (e) => {
        this.touchStartX = e.touches[0].clientX;
        this.stopAutoplay();
      }, { passive: true });

      this.track.addEventListener('touchmove', (e) => {
        this.touchDiffX = e.touches[0].clientX - this.touchStartX;
      }, { passive: true });

      this.track.addEventListener('touchend', () => {
        if (Math.abs(this.touchDiffX) > 50) {
          this.touchDiffX < 0 ? this.next() : this.prev();
        }
        this.touchDiffX = 0;
        if (this.opts.autoplay) this.startAutoplay();
      });

      // Arrow buttons
      const prevBtn = this.el.querySelector('[data-carousel-prev]');
      const nextBtn = this.el.querySelector('[data-carousel-next]');
      if (prevBtn) prevBtn.addEventListener('click', () => this.prev());
      if (nextBtn) nextBtn.addEventListener('click', () => this.next());

      // Pause on hover
      this.el.addEventListener('mouseenter', () => this.stopAutoplay());
      this.el.addEventListener('mouseleave', () => {
        if (this.opts.autoplay) this.startAutoplay();
      });

      // Resize
      let resizeTimer;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          this.updateLayout();
          this.buildDots();
          this.goTo(this.current);
        }, 200);
      });
    }
  }

  /* =========================================================================
     2. CART DRAWER — Slide-in cart with AJAX updates
     ========================================================================= */
  class CartDrawer {
    constructor() {
      this.drawer = document.getElementById('ModernCartDrawer');
      this.overlay = document.getElementById('ModernCartOverlay');
      this.itemsContainer = null;
      this.subtotalEl = null;
      this.countEl = null;
      this.isOpen = false;

      if (this.drawer) {
        this.itemsContainer = this.drawer.querySelector('[data-cart-items]');
        this.subtotalEl = this.drawer.querySelector('[data-cart-subtotal]');
        this.countEl = this.drawer.querySelector('[data-cart-count]');
        this.bindEvents();
      }
    }

    open() {
      if (!this.drawer) return;
      this.drawer.classList.add('is-open');
      if (this.overlay) this.overlay.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      this.isOpen = true;
      this.refresh();
    }

    close() {
      if (!this.drawer) return;
      this.drawer.classList.remove('is-open');
      if (this.overlay) this.overlay.classList.remove('is-open');
      document.body.style.overflow = '';
      this.isOpen = false;
    }

    async addItem(variantId, quantity = 1) {
      try {
        const response = await fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: variantId, quantity }),
        });

        if (!response.ok) throw new Error('Failed to add item');

        const item = await response.json();
        this.open();
        this.updateCartBubble();

        if (window.ModernTheme && window.ModernTheme.toast) {
          window.ModernTheme.toast.show('Added to cart!', 'success');
        }

        return item;
      } catch (error) {
        console.error('Cart add error:', error);
        if (window.ModernTheme && window.ModernTheme.toast) {
          window.ModernTheme.toast.show('Could not add item to cart', 'error');
        }
      }
    }

    async updateQuantity(key, quantity) {
      try {
        const response = await fetch('/cart/change.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: key, quantity }),
        });

        if (!response.ok) throw new Error('Failed to update');

        await this.refresh();
        this.updateCartBubble();
      } catch (error) {
        console.error('Cart update error:', error);
      }
    }

    async removeItem(key) {
      await this.updateQuantity(key, 0);
    }

    async refresh() {
      try {
        const response = await fetch('/cart.js');
        const cart = await response.json();

        if (this.subtotalEl) {
          this.subtotalEl.textContent = this.formatMoney(cart.total_price);
        }
        if (this.countEl) {
          this.countEl.textContent = cart.item_count;
        }

        if (this.itemsContainer && cart.items) {
          this.renderItems(cart.items);
        }

        this.updateCartBubble(cart.item_count);
      } catch (error) {
        console.error('Cart refresh error:', error);
      }
    }

    renderItems(items) {
      if (!this.itemsContainer) return;

      if (items.length === 0) {
        this.itemsContainer.innerHTML = `
          <div style="text-align:center;padding:var(--space-3xl);opacity:0.5">
            <p>Your cart is empty</p>
          </div>`;
        return;
      }

      this.itemsContainer.innerHTML = items.map((item) => `
        <div class="modern-cart-drawer-item" data-key="${item.key}">
          <a href="${item.url}">
            <img src="${item.image ? item.image.replace(/(\.[^.]+)$/, '_200x$1') : ''}" alt="${item.title}" width="80" height="80" loading="lazy" style="border-radius:var(--radius-md);object-fit:cover">
          </a>
          <div style="flex:1;min-width:0">
            <p style="font-weight:600;font-size:var(--text-sm);margin:0"><a href="${item.url}" style="color:inherit;text-decoration:none">${item.product_title}</a></p>
            ${item.variant_title && item.variant_title !== 'Default Title' ? `<p style="font-size:var(--text-xs);opacity:0.5;margin:var(--space-2xs) 0 0">${item.variant_title}</p>` : ''}
            <p style="font-size:var(--text-sm);font-weight:600;margin:var(--space-xs) 0 0">${this.formatMoney(item.final_line_price)}</p>
            <div style="display:flex;align-items:center;gap:var(--space-sm);margin-top:var(--space-sm)">
              <button onclick="window.ModernCartDrawer.updateQuantity('${item.key}',${item.quantity - 1})" style="width:28px;height:28px;border:1px solid rgba(128,128,128,0.2);border-radius:var(--radius-sm);background:transparent;cursor:pointer;color:inherit;font-size:14px">&minus;</button>
              <span style="font-size:var(--text-sm);font-weight:600;min-width:20px;text-align:center">${item.quantity}</span>
              <button onclick="window.ModernCartDrawer.updateQuantity('${item.key}',${item.quantity + 1})" style="width:28px;height:28px;border:1px solid rgba(128,128,128,0.2);border-radius:var(--radius-sm);background:transparent;cursor:pointer;color:inherit;font-size:14px">&plus;</button>
              <button onclick="window.ModernCartDrawer.removeItem('${item.key}')" style="margin-left:auto;background:none;border:none;cursor:pointer;opacity:0.4;font-size:var(--text-xs);text-decoration:underline;color:inherit;font-family:inherit">Remove</button>
            </div>
          </div>
        </div>
      `).join('');
    }

    formatMoney(cents) {
      return '$' + (cents / 100).toFixed(2);
    }

    updateCartBubble(count) {
      const bubbles = document.querySelectorAll('[data-cart-bubble]');
      bubbles.forEach((b) => {
        if (count !== undefined) {
          b.textContent = count;
          b.style.display = count > 0 ? '' : 'none';
        }
      });
    }

    bindEvents() {
      if (this.overlay) {
        this.overlay.addEventListener('click', () => this.close());
      }

      const closeBtn = this.drawer.querySelector('[data-cart-close]');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.close());
      }

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) this.close();
      });

      // Intercept add-to-cart forms
      document.addEventListener('submit', async (e) => {
        const form = e.target;
        if (form.action && form.action.includes('/cart/add')) {
          e.preventDefault();
          const formData = new FormData(form);
          const id = formData.get('id');
          const qty = parseInt(formData.get('quantity')) || 1;
          if (id) await this.addItem(parseInt(id), qty);
        }
      });
    }
  }

  /* =========================================================================
     3. PRODUCT QUICK SHOP — Modal quick add
     ========================================================================= */
  class ProductQuickShop {
    constructor() {
      this.modal = null;
      this.isOpen = false;
      this.createModal();
      this.bindEvents();
    }

    createModal() {
      const modal = document.createElement('div');
      modal.className = 'modern-quickshop-modal';
      modal.id = 'ModernQuickShop';
      modal.innerHTML = `
        <div class="modern-quickshop-overlay" onclick="window.ModernQuickShop.close()"></div>
        <div class="modern-quickshop-content">
          <button class="modern-quickshop-close" onclick="window.ModernQuickShop.close()" aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
          <div class="modern-quickshop-body" id="QuickShopBody">
            <div class="modern-quickshop-loading">
              <div class="modern-quickshop-spinner"></div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      this.modal = modal;
    }

    async open(productUrl) {
      if (!this.modal) return;
      const body = document.getElementById('QuickShopBody');
      body.innerHTML = '<div class="modern-quickshop-loading"><div class="modern-quickshop-spinner"></div></div>';

      this.modal.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      this.isOpen = true;

      try {
        const response = await fetch(productUrl + '?sections=modern-quick-view');
        const data = await response.json();
        const html = data['modern-quick-view'] || '';
        body.innerHTML = html || '<p style="padding:var(--space-2xl);text-align:center;opacity:0.5">Product not found</p>';
      } catch (error) {
        body.innerHTML = '<p style="padding:var(--space-2xl);text-align:center;opacity:0.5">Error loading product</p>';
      }
    }

    close() {
      if (!this.modal) return;
      this.modal.classList.remove('is-open');
      document.body.style.overflow = '';
      this.isOpen = false;
    }

    bindEvents() {
      document.addEventListener('click', (e) => {
        const trigger = e.target.closest('[data-quick-view]');
        if (trigger) {
          e.preventDefault();
          this.open(trigger.dataset.quickView || trigger.href);
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) this.close();
      });
    }
  }

  /* =========================================================================
     4. WISHLIST MANAGER — LocalStorage wishlist with heart animation
     ========================================================================= */
  class WishlistManager {
    constructor() {
      this.storageKey = 'modern_wishlist';
      this.items = this.load();
      this.init();
    }

    load() {
      try {
        return JSON.parse(localStorage.getItem(this.storageKey)) || [];
      } catch {
        return [];
      }
    }

    save() {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(this.items));
      } catch (e) {
        console.warn('Wishlist save failed:', e);
      }
    }

    toggle(productId) {
      productId = String(productId);
      const index = this.items.indexOf(productId);
      if (index > -1) {
        this.items.splice(index, 1);
      } else {
        this.items.push(productId);
      }
      this.save();
      this.updateUI();
      this.updateBadge();
      return this.has(productId);
    }

    has(productId) {
      return this.items.includes(String(productId));
    }

    getCount() {
      return this.items.length;
    }

    getItems() {
      return [...this.items];
    }

    init() {
      this.updateUI();
      this.updateBadge();
      this.bindEvents();
    }

    updateUI() {
      document.querySelectorAll('[data-wishlist-toggle]').forEach((btn) => {
        const id = btn.dataset.wishlistToggle || btn.closest('[data-product-id]')?.dataset.productId;
        if (id) {
          btn.classList.toggle('is-wishlisted', this.has(id));
          btn.setAttribute('aria-pressed', this.has(id));
        }
      });
    }

    updateBadge() {
      document.querySelectorAll('[data-wishlist-count]').forEach((el) => {
        el.textContent = this.getCount();
        el.style.display = this.getCount() > 0 ? '' : 'none';
      });
    }

    bindEvents() {
      document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-wishlist-toggle]');
        if (!btn) return;
        e.preventDefault();
        const id = btn.dataset.wishlistToggle || btn.closest('[data-product-id]')?.dataset.productId;
        if (!id) return;

        const isWished = this.toggle(id);

        // Animate heart
        if (!prefersReducedMotion) {
          btn.style.transform = 'scale(1.3)';
          setTimeout(() => {
            btn.style.transform = '';
          }, 200);
        }

        if (window.ModernTheme && window.ModernTheme.toast) {
          window.ModernTheme.toast.show(
            isWished ? 'Added to wishlist' : 'Removed from wishlist',
            'success'
          );
        }
      });
    }
  }

  /* =========================================================================
     5. IMAGE ZOOM — Product image magnifier
     ========================================================================= */
  class ImageZoom {
    constructor(container, options = {}) {
      this.container = container;
      this.img = container.querySelector('img');
      if (!this.img) return;

      this.opts = {
        scale: parseFloat(container.dataset.zoomScale) || 2,
        ...options,
      };

      this.init();
    }

    init() {
      this.container.style.overflow = 'hidden';
      this.container.style.cursor = 'crosshair';

      this.container.addEventListener('mousemove', (e) => {
        const rect = this.container.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        this.img.style.transformOrigin = `${x}% ${y}%`;
        this.img.style.transform = `scale(${this.opts.scale})`;
      });

      this.container.addEventListener('mouseleave', () => {
        this.img.style.transform = '';
      });

      // Touch support
      this.container.addEventListener('touchmove', (e) => {
        if (e.touches.length !== 1) return;
        const touch = e.touches[0];
        const rect = this.container.getBoundingClientRect();
        const x = ((touch.clientX - rect.left) / rect.width) * 100;
        const y = ((touch.clientY - rect.top) / rect.height) * 100;

        this.img.style.transformOrigin = `${x}% ${y}%`;
        this.img.style.transform = `scale(${this.opts.scale})`;
      }, { passive: true });

      this.container.addEventListener('touchend', () => {
        this.img.style.transform = '';
      });
    }
  }

  /* =========================================================================
     6. FILTER SYSTEM — AJAX product filtering with URL management
     ========================================================================= */
  class FilterSystem {
    constructor(container) {
      this.container = container;
      if (!container) return;

      this.form = container.querySelector('form[data-filter-form]');
      this.grid = container.querySelector('[data-product-grid]');
      this.activeFiltersEl = container.querySelector('[data-active-filters]');
      this.countEl = container.querySelector('[data-results-count]');
      this.isLoading = false;

      if (this.form) this.bindEvents();
    }

    bindEvents() {
      this.form.addEventListener('change', () => {
        this.applyFilters();
      });

      // Handle active filter removal
      if (this.activeFiltersEl) {
        this.activeFiltersEl.addEventListener('click', (e) => {
          const removeBtn = e.target.closest('[data-filter-remove]');
          if (removeBtn) {
            e.preventDefault();
            const url = removeBtn.dataset.filterRemove;
            if (url) this.fetchAndUpdate(url);
          }
        });
      }
    }

    applyFilters() {
      if (this.isLoading) return;
      const formData = new FormData(this.form);
      const params = new URLSearchParams(formData).toString();
      const url = window.location.pathname + '?' + params;
      this.fetchAndUpdate(url);
    }

    async fetchAndUpdate(url) {
      this.isLoading = true;
      this.container.classList.add('is-loading');

      try {
        const response = await fetch(url);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Update grid
        const newGrid = doc.querySelector('[data-product-grid]');
        if (newGrid && this.grid) {
          this.grid.innerHTML = newGrid.innerHTML;
        }

        // Update active filters
        const newActiveFilters = doc.querySelector('[data-active-filters]');
        if (newActiveFilters && this.activeFiltersEl) {
          this.activeFiltersEl.innerHTML = newActiveFilters.innerHTML;
        }

        // Update count
        const newCount = doc.querySelector('[data-results-count]');
        if (newCount && this.countEl) {
          this.countEl.textContent = newCount.textContent;
        }

        // Update URL
        history.pushState({}, '', url);

        // Re-observe new elements for animations
        if (window.ModernTheme && window.ModernTheme.scrollReveal) {
          window.ModernTheme.scrollReveal.observe(this.grid);
        }
      } catch (error) {
        console.error('Filter update failed:', error);
      } finally {
        this.isLoading = false;
        this.container.classList.remove('is-loading');
      }
    }
  }

  /* =========================================================================
     INITIALIZATION
     ========================================================================= */
  function initModules() {
    // Carousels
    document.querySelectorAll('[data-carousel]').forEach((el) => {
      new Carousel(el);
    });

    // Image Zoom
    document.querySelectorAll('[data-image-zoom]').forEach((el) => {
      new ImageZoom(el);
    });

    // Filter System
    document.querySelectorAll('[data-filter-container]').forEach((el) => {
      new FilterSystem(el);
    });

    // Cart Drawer
    window.ModernCartDrawer = new CartDrawer();

    // Quick Shop
    window.ModernQuickShop = new ProductQuickShop();

    // Wishlist
    window.ModernWishlist = new WishlistManager();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initModules);
  } else {
    initModules();
  }

  // Shopify theme editor support
  document.addEventListener('shopify:section:load', () => {
    document.querySelectorAll('[data-carousel]').forEach((el) => {
      new Carousel(el);
    });
    document.querySelectorAll('[data-image-zoom]').forEach((el) => {
      new ImageZoom(el);
    });
    if (window.ModernWishlist) window.ModernWishlist.updateUI();
  });

  // Export classes for external use
  window.ModernModules = {
    Carousel,
    CartDrawer,
    ProductQuickShop,
    WishlistManager,
    ImageZoom,
    FilterSystem,
  };
})();
