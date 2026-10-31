/* =========================================================================
   Apple Homepage Interactive Scripts
   ========================================================================= */

(function () {
  'use strict';

  // 1. Apple Showcase Carousel Slider
  var trackWrap = document.getElementById('apple-carousel-wrap');
  var dots = document.querySelectorAll('.apple-carousel-dot');
  var cards = document.querySelectorAll('.apple-carousel-card');

  if (trackWrap && dots.length > 0 && cards.length > 0) {
    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        if (cards[index]) {
          cards[index].scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
          });
          updateActiveDot(index);
        }
      });
    });

    function updateActiveDot(activeIndex) {
      dots.forEach(function (d, i) {
        if (i === activeIndex) {
          d.classList.add('active');
        } else {
          d.classList.remove('active');
        }
      });
    }

    // Auto update dot on scroll
    var scrollTimer = null;
    trackWrap.addEventListener('scroll', function () {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(function () {
        var wrapRect = trackWrap.getBoundingClientRect();
        var wrapCenter = wrapRect.left + wrapRect.width / 2;
        var closestIdx = 0;
        var minDiff = Infinity;

        cards.forEach(function (card, idx) {
          var rect = card.getBoundingClientRect();
          var cardCenter = rect.left + rect.width / 2;
          var diff = Math.abs(cardCenter - wrapCenter);
          if (diff < minDiff) {
            minDiff = diff;
            closestIdx = idx;
          }
        });
        updateActiveDot(closestIdx);
      }, 80);
    }, { passive: true });
  }

  // 3. Mobile Footer Directory Accordion
  var directoryHeaders = document.querySelectorAll('.apple-directory-col h3');
  directoryHeaders.forEach(function (h3) {
    h3.addEventListener('click', function () {
      if (window.innerWidth <= 834) {
        var col = this.parentElement;
        col.classList.toggle('active');
      }
    });
  });

  // 4. Progressive Video Background & Viewport Stream Controller
  (function initVideoControllers() {
    // 4A. Hero 1 Cinematic Background Video (smarthome.mp4)
    var heroBgVideo = document.querySelector('.apple-hero-bg-video');
    if (heroBgVideo) {
      try {
        heroBgVideo.disablePictureInPicture = true;
      } catch (e) {}

      var tryPlayBgVideo = function () {
        var p = heroBgVideo.play();
        if (p !== undefined) {
          p.catch(function () {
            var resumeOnGesture = function () {
              heroBgVideo.play();
              window.removeEventListener('touchstart', resumeOnGesture);
              window.removeEventListener('scroll', resumeOnGesture);
              window.removeEventListener('click', resumeOnGesture);
            };
            window.addEventListener('touchstart', resumeOnGesture, { passive: true, once: true });
            window.addEventListener('scroll', resumeOnGesture, { passive: true, once: true });
            window.addEventListener('click', resumeOnGesture, { passive: true, once: true });
          });
        }
      };

      tryPlayBgVideo();
    }

    // 4B. Hero 3 Whole-Home KNX Video (Viewport-Triggered Stream)
    var knxVideo = document.querySelector('.apple-knx-video');
    if (knxVideo) {
      try {
        knxVideo.disablePictureInPicture = true;
      } catch (e) {}

      var knxSource = knxVideo.querySelector('source[data-src]');
      if (knxSource && 'IntersectionObserver' in window) {
        var knxObserver = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              if (!knxVideo.dataset.streaming) {
                knxVideo.dataset.streaming = 'true';
                knxSource.src = knxSource.getAttribute('data-src');
                var knxDirect = knxVideo.getAttribute('data-src');
                if (knxDirect) knxVideo.src = knxDirect;
                knxVideo.load();
              }
              knxVideo.play().catch(function () {});
            } else {
              if (knxVideo.dataset.streaming) {
                knxVideo.pause();
              }
            }
          });
        }, { rootMargin: '300px 0px 300px 0px' });
        knxObserver.observe(knxVideo);
      } else {
        // Fallback for older browsers
        var playPromise = knxVideo.play();
        if (playPromise !== undefined) playPromise.catch(function () {});
      }
    }

    // 4C. General media Picture-in-Picture suppression
    var genericVideos = document.querySelectorAll('.apple-lighting-video, .apple-frame-video, .apple-hero-video');
    genericVideos.forEach(function (v) {
      try {
        v.disablePictureInPicture = true;
      } catch (e) {}
    });
  })();

  // 5. Apple Mac Scroll & Entrance Fade-In Controller (apple.com/in/mac)
  function initAppleMacScrollMotion() {
    var docEl = document.documentElement;
    var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Enable CSS motion styles
    docEl.classList.add('apple-motion-ready');

    var targets = document.querySelectorAll(
      '.apple-ribbon, ' +
      '.apple-hero-center-content, ' +
      '.apple-device-left, ' +
      '.apple-device-right, ' +
      '.apple-hero-header, ' +
      '.apple-hero-media, ' +
      '.apple-promo-card, ' +
      '.apple-carousel-title-row, ' +
      '.apple-carousel-card, ' +
      '.apple-footnotes, ' +
      '.apple-breadcrumbs, ' +
      '.apple-directory-col, ' +
      '.apple-fade-in, ' +
      '.apple-reveal-element, ' +
      '.apple-reveal-group, ' +
      '.catalog-top-announcement, ' +
      '.catalog-header, ' +
      '.catalog-product-item, ' +
      '.catalog-cta-banner, ' +
      '.catalog-bottom-bar'
    );

    if (!targets.length) return;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      targets.forEach(function (el) {
        el.classList.add('is-revealed');
      });
      return;
    }

    var observerOptions = {
      root: null,
      rootMargin: '0px 0px -30px 0px',
      threshold: 0.08
    };

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    targets.forEach(function (el) {
      observer.observe(el);
    });

    // Opening entrance trigger: Reveal all elements currently in or near initial viewport
    function triggerInitialReveal() {
      requestAnimationFrame(function () {
        var viewportHeight = window.innerHeight || docEl.clientHeight;
        targets.forEach(function (el) {
          var rect = el.getBoundingClientRect();
          if (rect.top < viewportHeight - 20 && rect.bottom > 0) {
            el.classList.add('is-revealed');
            observer.unobserve(el);
          }
        });
      });
    }

    // Run opening trigger right after paint for ultra smooth glide
    setTimeout(triggerInitialReveal, 60);

    // Safety fallback: ensure all content is revealed after 3s under any circumstances
    setTimeout(function () {
      targets.forEach(function (el) {
        if (!el.classList.contains('is-revealed')) {
          el.classList.add('is-revealed');
        }
      });
    }, 3000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAppleMacScrollMotion);
  } else {
    initAppleMacScrollMotion();
  }
})();
