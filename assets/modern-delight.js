/**
 * Modern Delight - Easter Eggs & Surprises
 * ==========================================
 * Konami code, holiday themes, scroll celebrations,
 * 404 mini-game, visitor recognition, confetti effects.
 */

(function() {
  'use strict';

  /* ========================================================================
     1. Confetti Engine (reusable)
     ======================================================================== */
  var Confetti = {
    canvas: null,
    ctx: null,
    particles: [],
    animating: false,

    init: function() {
      if (this.canvas) return;
      this.canvas = document.createElement('canvas');
      this.canvas.style.cssText = 'position:fixed;inset:0;z-index:100002;pointer-events:none;';
      document.body.appendChild(this.canvas);
      this.ctx = this.canvas.getContext('2d');
      this.resize();
      window.addEventListener('resize', this.resize.bind(this));
    },

    resize: function() {
      if (!this.canvas) return;
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    },

    burst: function(opts) {
      this.init();
      opts = opts || {};
      var count = opts.count || 80;
      var colors = opts.colors || ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#fa709a'];
      var x = opts.x || this.canvas.width / 2;
      var y = opts.y || this.canvas.height / 3;

      for (var i = 0; i < count; i++) {
        this.particles.push({
          x: x,
          y: y,
          vx: (Math.random() - 0.5) * 12,
          vy: (Math.random() - 0.8) * 12,
          size: Math.random() * 8 + 3,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          rotSpeed: (Math.random() - 0.5) * 10,
          gravity: 0.15 + Math.random() * 0.1,
          opacity: 1,
          shape: Math.random() > 0.5 ? 'rect' : 'circle'
        });
      }

      if (!this.animating) this.animate();
    },

    animate: function() {
      var self = this;
      self.animating = true;

      function frame() {
        self.ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);

        self.particles = self.particles.filter(function(p) {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += p.gravity;
          p.vx *= 0.99;
          p.rotation += p.rotSpeed;
          p.opacity -= 0.008;

          if (p.opacity <= 0) return false;

          self.ctx.save();
          self.ctx.translate(p.x, p.y);
          self.ctx.rotate(p.rotation * Math.PI / 180);
          self.ctx.globalAlpha = p.opacity;
          self.ctx.fillStyle = p.color;

          if (p.shape === 'rect') {
            self.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          } else {
            self.ctx.beginPath();
            self.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            self.ctx.fill();
          }

          self.ctx.restore();
          return true;
        });

        if (self.particles.length > 0) {
          requestAnimationFrame(frame);
        } else {
          self.animating = false;
          self.ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
        }
      }

      requestAnimationFrame(frame);
    }
  };

  /* ========================================================================
     2. Konami Code (up up down down left right left right b a)
     ======================================================================== */
  (function() {
    var code = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
    var index = 0;

    document.addEventListener('keydown', function(e) {
      if (e.keyCode === code[index]) {
        index++;
        if (index === code.length) {
          index = 0;
          /* Easter egg: confetti burst + toast */
          Confetti.burst({ count: 150 });
          if (window.ModernToast) {
            window.ModernToast.success('You found the secret code! Enjoy 10% off with code KONAMI10', { duration: 8000 });
          }
          /* Temporary rainbow border on all product cards */
          var style = document.createElement('style');
          style.textContent = '.modern-product-card{animation:modernRainbow 2s linear infinite!important;border:2px solid transparent!important;background-clip:padding-box!important}@keyframes modernRainbow{0%{border-color:#667eea}25%{border-color:#f093fb}50%{border-color:#43e97b}75%{border-color:#fa709a}100%{border-color:#667eea}}';
          document.head.appendChild(style);
          setTimeout(function() { style.remove(); }, 10000);
        }
      } else {
        index = e.keyCode === code[0] ? 1 : 0;
      }
    });
  })();

  /* ========================================================================
     3. Holiday Themes (auto-detect)
     ======================================================================== */
  var HolidayEffects = {
    init: function() {
      var now = new Date();
      var month = now.getMonth() + 1;
      var day = now.getDate();

      /* Christmas: Dec 15-26 */
      if (month === 12 && day >= 15 && day <= 26) {
        this.snowfall();
      }
      /* Halloween: Oct 28-31 */
      else if (month === 10 && day >= 28) {
        this.halloween();
      }
      /* Valentine's: Feb 12-15 */
      else if (month === 2 && day >= 12 && day <= 15) {
        this.valentines();
      }
      /* New Year: Dec 31 - Jan 2 */
      else if ((month === 12 && day === 31) || (month === 1 && day <= 2)) {
        this.newYear();
      }
    },

    snowfall: function() {
      var style = document.createElement('style');
      style.textContent = '.modern-snow{position:fixed;top:-10px;z-index:99999;pointer-events:none;color:#fff;font-size:16px;animation:modernSnowFall linear infinite;opacity:0.8}@keyframes modernSnowFall{0%{transform:translateY(0) rotate(0deg);opacity:0.8}100%{transform:translateY(calc(100vh + 20px)) rotate(360deg);opacity:0.2}}';
      document.head.appendChild(style);

      for (var i = 0; i < 20; i++) {
        var snow = document.createElement('div');
        snow.className = 'modern-snow';
        snow.textContent = ['*', '\u2744', '\u2022'][Math.floor(Math.random() * 3)];
        snow.style.left = Math.random() * 100 + 'vw';
        snow.style.animationDuration = (5 + Math.random() * 10) + 's';
        snow.style.animationDelay = Math.random() * 10 + 's';
        snow.style.fontSize = (10 + Math.random() * 16) + 'px';
        document.body.appendChild(snow);
      }
    },

    halloween: function() {
      document.documentElement.style.setProperty('--color-accent', '#ff6600');
      document.documentElement.style.setProperty('--gradient-primary', 'linear-gradient(135deg, #ff6600, #8b0000)');
    },

    valentines: function() {
      document.documentElement.style.setProperty('--color-accent', '#e91e63');
      document.documentElement.style.setProperty('--gradient-primary', 'linear-gradient(135deg, #e91e63, #ff6090)');
    },

    newYear: function() {
      /* Trigger confetti after 2 second delay */
      setTimeout(function() {
        Confetti.burst({ count: 120, colors: ['#ffd700', '#c0c0c0', '#ff6b6b', '#4ecdc4', '#45b7d1'] });
        if (window.ModernToast) {
          window.ModernToast.info('Happy New Year! \ud83c\udf89', { duration: 6000 });
        }
      }, 2000);
    }
  };

  /* ========================================================================
     4. Scroll Milestone Celebrations
     ======================================================================== */
  var ScrollCelebrations = {
    milestones: {},

    init: function() {
      var self = this;
      var ticking = false;

      window.addEventListener('scroll', function() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function() {
          self.check();
          ticking = false;
        });
      }, { passive: true });
    },

    check: function() {
      var scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) return;
      var pct = Math.round(window.scrollY / scrollHeight * 100);

      /* 50% milestone */
      if (pct >= 50 && !this.milestones['50']) {
        this.milestones['50'] = true;
        if (window.ModernToast) {
          window.ModernToast.info("You're halfway through! Keep exploring.", { duration: 3000 });
        }
      }

      /* Bottom milestone */
      if (pct >= 95 && !this.milestones['100']) {
        this.milestones['100'] = true;
        if (window.ModernToast) {
          window.ModernToast.info("You've seen it all! Anything catch your eye?", {
            duration: 5000,
            action: { label: 'Browse Products', callback: function() { window.location.href = '/collections/all'; } }
          });
        }
      }
    }
  };

  /* ========================================================================
     5. 404 Mini-Game
     ======================================================================== */
  var MiniGame404 = {
    init: function() {
      var number = document.querySelector('.modern-404__number');
      if (!number) return;

      var clicks = 0;
      number.style.cursor = 'pointer';
      number.title = 'Click me!';

      number.addEventListener('click', function() {
        clicks++;

        /* Scale bounce */
        number.style.transition = 'transform 0.15s ease';
        number.style.transform = 'scale(1.1)';
        setTimeout(function() { number.style.transform = ''; }, 150);

        if (clicks === 5) {
          Confetti.burst({ x: number.getBoundingClientRect().left + number.offsetWidth / 2, y: number.getBoundingClientRect().top });
          number.textContent = '200';
          number.style.background = 'linear-gradient(135deg, #10b981, #43e97b)';
          number.style.webkitBackgroundClip = 'text';
          if (window.ModernToast) {
            window.ModernToast.success('You fixed it! Just kidding, but here\'s a discount: ERROR5', { duration: 8000 });
          }
          setTimeout(function() { number.textContent = '404'; number.style.background = ''; }, 5000);
          clicks = 0;
        } else if (clicks === 3) {
          number.textContent = '40' + (Math.random() > 0.5 ? '3' : '5');
          setTimeout(function() { number.textContent = '404'; }, 1000);
        }
      });
    }
  };

  /* ========================================================================
     6. Returning Visitor Recognition
     ======================================================================== */
  var VisitorRecognition = {
    init: function() {
      try {
        var key = 'modern_visitor';
        var data = JSON.parse(localStorage.getItem(key) || '{}');
        var now = Date.now();

        if (!data.firstVisit) {
          data.firstVisit = now;
          data.visitCount = 1;
        } else {
          /* Only count if last visit was more than 1 hour ago */
          if (!data.lastVisit || now - data.lastVisit > 3600000) {
            data.visitCount = (data.visitCount || 0) + 1;
          }
        }
        data.lastVisit = now;
        localStorage.setItem(key, JSON.stringify(data));

        /* Time-based greeting */
        var hour = new Date().getHours();
        var greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

        /* Returning visitor message (after 3+ visits, show once per day) */
        if (data.visitCount >= 3) {
          var lastGreeting = data.lastGreeting || 0;
          if (now - lastGreeting > 86400000) {
            data.lastGreeting = now;
            localStorage.setItem(key, JSON.stringify(data));

            setTimeout(function() {
              if (window.ModernToast) {
                window.ModernToast.info(greeting + '! Welcome back for visit #' + data.visitCount + '.', {
                  duration: 4000
                });
              }
            }, 3000);
          }
        }
      } catch (e) { /* localStorage unavailable */ }
    }
  };

  /* ========================================================================
     7. Time-Based Greeting
     ======================================================================== */
  var TimeGreeting = {
    init: function() {
      var els = document.querySelectorAll('[data-time-greeting]');
      if (!els.length) return;
      var hour = new Date().getHours();
      var greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
      els.forEach(function(el) { el.textContent = greeting; });
    }
  };

  /* ========================================================================
     Initialize
     ======================================================================== */
  function init() {
    /* Only enable holiday effects if not in performance mode */
    if (!document.documentElement.classList.contains('modern-perf-lite')) {
      HolidayEffects.init();
    }

    ScrollCelebrations.init();
    MiniGame404.init();
    VisitorRecognition.init();
    TimeGreeting.init();
  }

  /* Expose confetti globally */
  window.ModernConfetti = Confetti;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
