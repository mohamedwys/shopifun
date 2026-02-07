/**
 * Modern AI-Powered Features (Client-Side)
 * ==========================================
 * Fuzzy search, auto-suggest, reading time estimation,
 * price drop alerts, size recommendations, content analysis.
 */

(function() {
  'use strict';

  window.ModernAI = {

    /* ========================================================================
       1. Fuzzy Search (Levenshtein-based)
       ======================================================================== */
    fuzzyMatch: function(query, target, threshold) {
      threshold = threshold || 0.6;
      query = query.toLowerCase();
      target = target.toLowerCase();

      /* Exact substring match */
      if (target.includes(query)) return 1;

      /* Word-level matching */
      var queryWords = query.split(/\s+/);
      var targetWords = target.split(/\s+/);
      var wordMatches = 0;
      queryWords.forEach(function(qw) {
        targetWords.forEach(function(tw) {
          if (tw.startsWith(qw) || qw.startsWith(tw)) wordMatches++;
        });
      });
      if (wordMatches > 0) return 0.5 + (wordMatches / queryWords.length) * 0.5;

      /* Levenshtein distance for typo tolerance */
      var len1 = query.length;
      var len2 = target.length;
      if (Math.abs(len1 - len2) > 5) return 0;

      var matrix = [];
      for (var i = 0; i <= len1; i++) {
        matrix[i] = [i];
        for (var j = 1; j <= len2; j++) {
          if (i === 0) { matrix[i][j] = j; continue; }
          var cost = query[i-1] === target[j-1] ? 0 : 1;
          matrix[i][j] = Math.min(
            matrix[i-1][j] + 1,
            matrix[i][j-1] + 1,
            matrix[i-1][j-1] + cost
          );
        }
      }

      var distance = matrix[len1][len2];
      var maxLen = Math.max(len1, len2);
      var similarity = 1 - (distance / maxLen);
      return similarity >= threshold ? similarity : 0;
    },

    /* Search products with fuzzy matching */
    fuzzySearch: function(query, products, fields) {
      fields = fields || ['title', 'vendor', 'product_type'];
      var self = this;

      return products.map(function(product) {
        var bestScore = 0;
        fields.forEach(function(field) {
          var val = product[field] || '';
          var score = self.fuzzyMatch(query, val);
          if (score > bestScore) bestScore = score;
        });
        return { product: product, score: bestScore };
      }).filter(function(item) {
        return item.score > 0;
      }).sort(function(a, b) {
        return b.score - a.score;
      }).map(function(item) {
        return item.product;
      });
    },

    /* ========================================================================
       2. Auto-Suggest / Autocomplete
       ======================================================================== */
    autoSuggest: {
      cache: {},

      getSuggestions: function(query, callback) {
        if (!query || query.length < 2) { callback([]); return; }

        var cacheKey = query.toLowerCase();
        if (this.cache[cacheKey]) {
          callback(this.cache[cacheKey]);
          return;
        }

        var self = this;
        fetch('/search/suggest.json?q=' + encodeURIComponent(query) + '&resources[type]=product,query&resources[limit]=5')
          .then(function(r) { return r.json(); })
          .then(function(data) {
            var suggestions = [];
            /* Query suggestions */
            if (data.resources && data.resources.results && data.resources.results.queries) {
              data.resources.results.queries.forEach(function(q) {
                suggestions.push({ type: 'query', text: q.text, url: '/search?q=' + encodeURIComponent(q.text) });
              });
            }
            /* Product suggestions */
            if (data.resources && data.resources.results && data.resources.results.products) {
              data.resources.results.products.forEach(function(p) {
                suggestions.push({
                  type: 'product',
                  text: p.title,
                  url: p.url,
                  image: p.image,
                  price: p.price
                });
              });
            }
            self.cache[cacheKey] = suggestions;
            callback(suggestions);
          })
          .catch(function() { callback([]); });
      }
    },

    /* ========================================================================
       3. Reading Time Estimation
       ======================================================================== */
    estimateReadTime: function(text, wpm) {
      wpm = wpm || 200;
      if (!text) return 0;
      var words = text.trim().split(/\s+/).length;
      var images = (text.match(/<img/gi) || []).length;
      var minutes = Math.ceil((words / wpm) + (images * 0.2));
      return Math.max(1, minutes);
    },

    /* Auto-apply to elements with data-read-time */
    initReadTime: function() {
      document.querySelectorAll('[data-read-time]').forEach(function(el) {
        var source = document.querySelector(el.dataset.readTime);
        if (source) {
          var time = window.ModernAI.estimateReadTime(source.textContent);
          el.textContent = time + ' min read';
        }
      });
    },

    /* ========================================================================
       4. Price Drop Alerts
       ======================================================================== */
    priceAlerts: {
      KEY: 'modern_price_watch',

      /* Track a product's price */
      track: function(productId, price, title) {
        try {
          var watched = JSON.parse(localStorage.getItem(this.KEY) || '{}');
          if (!watched[productId]) {
            watched[productId] = { price: price, title: title, date: Date.now() };
          } else if (price < watched[productId].price) {
            /* Price dropped! */
            var drop = watched[productId].price - price;
            var pct = Math.round(drop / watched[productId].price * 100);
            watched[productId].previousPrice = watched[productId].price;
            watched[productId].price = price;
            watched[productId].dropped = true;

            if (window.ModernToast) {
              window.ModernToast.success(
                'Price drop! ' + title + ' is now ' + pct + '% off.',
                { duration: 8000, action: { label: 'View', callback: function() {} } }
              );
            }
          } else {
            watched[productId].price = price;
          }
          localStorage.setItem(this.KEY, JSON.stringify(watched));
        } catch (e) { /* storage full */ }
      },

      /* Check for any drops on page load */
      checkDrops: function() {
        try {
          var watched = JSON.parse(localStorage.getItem(this.KEY) || '{}');
          var drops = [];
          Object.keys(watched).forEach(function(id) {
            if (watched[id].dropped) {
              drops.push(watched[id]);
              watched[id].dropped = false;
            }
          });
          localStorage.setItem(this.KEY, JSON.stringify(watched));
          return drops;
        } catch (e) { return []; }
      }
    },

    /* ========================================================================
       5. Smart Size Recommendation
       ======================================================================== */
    sizeRecommendation: {
      KEY: 'modern_size_prefs',

      /* Save user's size choice */
      saveChoice: function(category, size) {
        try {
          var prefs = JSON.parse(localStorage.getItem(this.KEY) || '{}');
          if (!prefs[category]) prefs[category] = {};
          prefs[category][size] = (prefs[category][size] || 0) + 1;
          localStorage.setItem(this.KEY, JSON.stringify(prefs));
        } catch (e) { /* ignore */ }
      },

      /* Get recommended size for a category */
      getRecommended: function(category) {
        try {
          var prefs = JSON.parse(localStorage.getItem(this.KEY) || '{}');
          if (!prefs[category]) return null;
          var sizes = prefs[category];
          var best = null;
          var bestCount = 0;
          Object.keys(sizes).forEach(function(size) {
            if (sizes[size] > bestCount) {
              bestCount = sizes[size];
              best = size;
            }
          });
          return best;
        } catch (e) { return null; }
      },

      /* Show recommendation badge on size selector */
      showBadge: function(category) {
        var recommended = this.getRecommended(category);
        if (!recommended) return;

        document.querySelectorAll('.modern-variant-selector__option').forEach(function(option) {
          if (option.textContent.trim().toLowerCase() === recommended.toLowerCase()) {
            var badge = document.createElement('span');
            badge.style.cssText = 'position:absolute;top:-6px;right:-6px;font-size:9px;background:var(--color-button,#667eea);color:#fff;padding:1px 5px;border-radius:8px;font-weight:700;';
            badge.textContent = 'Your size';
            option.style.position = 'relative';
            option.appendChild(badge);
          }
        });
      }
    },

    /* ========================================================================
       6. Content Summarization (basic)
       ======================================================================== */
    summarize: function(text, maxSentences) {
      maxSentences = maxSentences || 2;
      if (!text) return '';
      /* Split into sentences */
      var sentences = text.replace(/<[^>]+>/g, '').match(/[^.!?]+[.!?]+/g) || [];
      if (sentences.length <= maxSentences) return sentences.join(' ');
      /* Score by position and length (first sentences tend to be summaries) */
      return sentences.slice(0, maxSentences).join(' ').trim();
    }
  };

  /* Auto-init on page load */
  function init() {
    window.ModernAI.initReadTime();
    window.ModernAI.priceAlerts.checkDrops();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
