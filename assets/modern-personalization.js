/**
 * Modern Personalization Engine
 * ===============================
 * Client-side personalization: preferences, search history,
 * favorite categories, time-based greetings, and adaptive UI.
 */

(function() {
  'use strict';

  var PREFS_KEY = 'modern_user_prefs';

  function getPrefs() {
    try { return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}'); } catch(e) { return {}; }
  }
  function savePrefs(prefs) {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch(e) {}
  }

  window.ModernPersonalization = {

    /* ========================================================================
       1. User Preferences
       ======================================================================== */
    preferences: {
      get: function(key, defaultVal) {
        var prefs = getPrefs();
        return prefs[key] !== undefined ? prefs[key] : defaultVal;
      },

      set: function(key, value) {
        var prefs = getPrefs();
        prefs[key] = value;
        savePrefs(prefs);
        /* Dispatch event for reactive components */
        document.dispatchEvent(new CustomEvent('modern:preference-change', {
          detail: { key: key, value: value }
        }));
      },

      /* Common preferences */
      getGridView: function() { return this.get('grid_view', 'grid'); },
      setGridView: function(view) { this.set('grid_view', view); },
      getSortOrder: function() { return this.get('sort_order', 'best-selling'); },
      setSortOrder: function(order) { this.set('sort_order', order); },
      getColorScheme: function() { return this.get('color_scheme', 'auto'); },
      setColorScheme: function(scheme) { this.set('color_scheme', scheme); }
    },

    /* ========================================================================
       2. Search History
       ======================================================================== */
    searchHistory: {
      KEY: 'modern_search_history',
      MAX: 10,

      add: function(query) {
        if (!query || query.length < 2) return;
        try {
          var history = JSON.parse(localStorage.getItem(this.KEY) || '[]');
          history = history.filter(function(q) { return q.toLowerCase() !== query.toLowerCase(); });
          history.unshift(query);
          history = history.slice(0, this.MAX);
          localStorage.setItem(this.KEY, JSON.stringify(history));
        } catch(e) {}
      },

      get: function(limit) {
        try {
          var history = JSON.parse(localStorage.getItem(this.KEY) || '[]');
          return history.slice(0, limit || this.MAX);
        } catch(e) { return []; }
      },

      clear: function() {
        try { localStorage.removeItem(this.KEY); } catch(e) {}
      },

      /* Render as pills */
      render: function(container) {
        var items = this.get(5);
        if (!items.length) { container.style.display = 'none'; return; }
        container.style.display = '';
        var html = '<p style="font-size:var(--text-xs);font-weight:600;text-transform:uppercase;letter-spacing:0.08em;opacity:0.4;margin:0 0 8px;">Recent searches</p>';
        html += '<div style="display:flex;gap:6px;flex-wrap:wrap;">';
        items.forEach(function(q) {
          html += '<a href="/search?q=' + encodeURIComponent(q) + '" style="padding:4px 14px;background:rgba(128,128,128,0.06);border-radius:999px;font-size:var(--text-xs);color:inherit;text-decoration:none;font-weight:500;">' + q + '</a>';
        });
        html += '</div>';
        container.innerHTML = html;
      }
    },

    /* ========================================================================
       3. Favorite Categories Tracking
       ======================================================================== */
    categories: {
      KEY: 'modern_fav_categories',

      track: function(category) {
        if (!category) return;
        try {
          var cats = JSON.parse(localStorage.getItem(this.KEY) || '{}');
          cats[category] = (cats[category] || 0) + 1;
          localStorage.setItem(this.KEY, JSON.stringify(cats));
        } catch(e) {}
      },

      getTop: function(limit) {
        try {
          var cats = JSON.parse(localStorage.getItem(this.KEY) || '{}');
          return Object.keys(cats)
            .sort(function(a, b) { return cats[b] - cats[a]; })
            .slice(0, limit || 5);
        } catch(e) { return []; }
      }
    },

    /* ========================================================================
       4. Time-Based Greetings
       ======================================================================== */
    getGreeting: function() {
      var hour = new Date().getHours();
      if (hour < 5) return 'Good night';
      if (hour < 12) return 'Good morning';
      if (hour < 17) return 'Good afternoon';
      if (hour < 21) return 'Good evening';
      return 'Good night';
    },

    /* ========================================================================
       5. Adaptive UI
       ======================================================================== */
    adaptUI: function() {
      /* Restore grid/list preference */
      var view = this.preferences.getGridView();
      var gridToggles = document.querySelectorAll('[data-view-toggle]');
      gridToggles.forEach(function(toggle) {
        toggle.classList.toggle('is-active', toggle.dataset.viewToggle === view);
      });

      /* Restore sort order */
      var sort = this.preferences.getSortOrder();
      var sortSelects = document.querySelectorAll('[data-sort-select]');
      sortSelects.forEach(function(select) {
        select.value = sort;
      });

      /* Apply time greeting */
      var greetingEls = document.querySelectorAll('[data-greeting]');
      var greeting = this.getGreeting();
      greetingEls.forEach(function(el) {
        el.textContent = greeting;
      });

      /* Show favorite categories if available */
      var favContainer = document.querySelector('[data-favorite-categories]');
      if (favContainer) {
        var topCats = this.categories.getTop(4);
        if (topCats.length > 0) {
          var html = topCats.map(function(cat) {
            return '<a href="/collections/' + cat.toLowerCase().replace(/\s+/g, '-') + '" style="padding:6px 16px;background:rgba(128,128,128,0.06);border-radius:999px;font-size:var(--text-sm);color:inherit;text-decoration:none;font-weight:500;">' + cat + '</a>';
          }).join('');
          favContainer.innerHTML = html;
        }
      }
    },

    /* ========================================================================
       6. View Toggle Handler
       ======================================================================== */
    initViewToggle: function() {
      var self = this;
      document.addEventListener('click', function(e) {
        var toggle = e.target.closest('[data-view-toggle]');
        if (!toggle) return;
        var view = toggle.dataset.viewToggle;
        self.preferences.setGridView(view);

        /* Update active states */
        toggle.closest('.modern-view-toggles').querySelectorAll('[data-view-toggle]').forEach(function(t) {
          t.classList.toggle('is-active', t.dataset.viewToggle === view);
        });

        /* Update grid class */
        var grid = document.querySelector('[data-product-grid]');
        if (grid) {
          grid.classList.remove('modern-grid--grid', 'modern-grid--list');
          grid.classList.add('modern-grid--' + view);
        }
      });
    },

    /* ========================================================================
       7. Sort Handler
       ======================================================================== */
    initSortHandler: function() {
      var self = this;
      document.addEventListener('change', function(e) {
        var select = e.target.closest('[data-sort-select]');
        if (!select) return;
        self.preferences.setSortOrder(select.value);
      });
    },

    /* ========================================================================
       8. Auto-Track Page Categories
       ======================================================================== */
    autoTrack: function() {
      /* Track collection visits */
      if (window.location.pathname.startsWith('/collections/')) {
        var collName = document.querySelector('.collection-hero__title, h1')?.textContent?.trim();
        if (collName) this.categories.track(collName);
      }

      /* Track search queries */
      var params = new URLSearchParams(window.location.search);
      var query = params.get('q');
      if (query) this.searchHistory.add(query);
    }
  };

  /* ========================================================================
     Initialize
     ======================================================================== */
  function init() {
    var P = window.ModernPersonalization;
    P.autoTrack();
    P.adaptUI();
    P.initViewToggle();
    P.initSortHandler();

    /* Render search history in search drawer */
    var searchHistoryContainer = document.querySelector('[data-search-history]');
    if (searchHistoryContainer) {
      P.searchHistory.render(searchHistoryContainer);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* Re-adapt on section load */
  document.addEventListener('shopify:section:load', function() {
    window.ModernPersonalization.adaptUI();
  });
})();
