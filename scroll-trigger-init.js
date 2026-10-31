/**
 * IntelliHome - Universal GSAP ScrollTrigger Engine
 * Synchronizes Lenis smooth scroll with GSAP ScrollTrigger and provides
 * buttery-smooth 60/120fps entrance and scroll-linked animations across all pages.
 */
(function() {
  'use strict';

  // Check reduced motion preference
  var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      console.warn('[ScrollTrigger] GSAP or ScrollTrigger not loaded. Gracefully revealing elements.');
      document.querySelectorAll('.reveal-item, .fade-up-reveal, .words-pull-up').forEach(function(el) {
        el.classList.add('revealed', 'is-visible', 'words-visible');
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // 1. Synchronize Lenis Smooth Scroll with GSAP Ticker
    var lenisInstance = window.lenis || window.detailLenis;
    if (lenisInstance) {
      window.__lenisDrivenByGsap = true;
      lenisInstance.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function(time) {
        lenisInstance.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    }

    if (prefersReducedMotion) {
      document.querySelectorAll('.reveal-item, .fade-up-reveal, .words-pull-up').forEach(function(el) {
        el.classList.add('revealed', 'is-visible', 'words-visible');
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      return;
    }

    // 2. Cyber Ronin Hero Section (Home Page) Scroll Parallax (Desktop Only)
    var heroSection = document.getElementById('hero');
    if (heroSection && heroSection.classList.contains('hero') && window.innerWidth > 991) {
      var heroBaseImg = heroSection.querySelector('.hero-base-img');
      var heroRevealImg = heroSection.querySelector('.hero-reveal-img');
      var heroLeft = heroSection.querySelector('.hero-side-left');
      var heroRight = heroSection.querySelector('.hero-side-right');
      var heroMobile = heroSection.querySelector('.hero-mobile-header');
      var heroCenter = heroSection.querySelector('.hero-center-container');
      var heroContent = heroSection.querySelector('.hero-content');

      // Scroll parallax timeline for hero images & centered/flanking titles
      var heroTL = gsap.timeline({
        scrollTrigger: {
          trigger: heroSection,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.15,
          invalidateOnRefresh: true
        }
      });

      // Base and reveal images remain full-bleed and sharp for normal document scroll

      if (heroCenter) {
        heroTL.to(heroCenter, {
          y: -45,
          scale: 0.96,
          opacity: 0,
          ease: 'none'
        }, 0);
      }

      if (heroContent) {
        heroTL.to(heroContent, {
          y: -45,
          opacity: 0,
          ease: 'none'
        }, 0);
      }

      if (heroLeft) {
        heroTL.to(heroLeft, {
          x: -80,
          y: -30,
          opacity: 0,
          ease: 'none'
        }, 0);
      }

      if (heroRight) {
        heroTL.to(heroRight, {
          x: 80,
          y: -30,
          opacity: 0,
          ease: 'none'
        }, 0);
      }

      if (heroMobile) {
        heroTL.to(heroMobile, {
          y: -50,
          opacity: 0,
          ease: 'none'
        }, 0);
      }
    }

    // Apple Mac Signature Deceleration Easing (apple.com/in/mac)
    var appleEase = "cubic-bezier(0.16, 1, 0.3, 1)";

    // 3. Inner Page Heroes (.page-hero, .about-hero, .hero-section-wrap, .contact-header, .style-upgrade-header)
    var innerHeroes = document.querySelectorAll('.page-hero, .about-hero, .hero-section-wrap, .contact-header, .style-upgrade-header');
    innerHeroes.forEach(function(hero) {
      var title = hero.querySelector('h1, .hero-title, .about-title, .contact-title, .style-upgrade-title');
      var subtitle = hero.querySelector('p, .hero-desc, .about-desc, .contact-desc, .style-upgrade-desc');
      var badge = hero.querySelector('.hero-eyebrow, .about-eyebrow, .contact-eyebrow, .style-upgrade-eyebrow, .hero-badge, .pill-badge, .kicker');
      var actions = hero.querySelector('.hero-cta-row, .cta-group, .filter-pills-container');

      var elementsToAnimate = [badge, title, subtitle, actions].filter(Boolean);
      if (elementsToAnimate.length > 0) {
        gsap.from(elementsToAnimate, {
          opacity: 0,
          y: 44,
          duration: 1.55,
          stagger: 0.16,
          ease: appleEase,
          delay: 0.1,
          clearProps: 'transform,opacity'
        });
      }

      // Gentle parallax on scroll
      var heroContent = hero.querySelector('.page-hero-content, .about-hero-content, .hero-center-deck, .hero-content');
      if (heroContent) {
        gsap.to(heroContent, {
          y: 70,
          opacity: 0.25,
          ease: 'none',
          scrollTrigger: {
            trigger: hero,
            start: 'top top',
            end: 'bottom top',
            scrub: true
          }
        });
      }
    });

    // 4. Universal Reveal Groups & Staggered Reveal Items (Slow & Smooth)
    var revealGroups = document.querySelectorAll('.reveal-group');
    revealGroups.forEach(function(group) {
      var items = group.querySelectorAll('.reveal-item');
      if (items.length > 0) {
        // Set initial state
        gsap.set(items, { opacity: 0, y: 44 });

        ScrollTrigger.create({
          trigger: group,
          start: 'top 88%',
          once: true,
          onEnter: function() {
            items.forEach(function(item) {
              item.classList.add('revealed');
            });
            gsap.to(items, {
              opacity: 1,
              y: 0,
              duration: 1.5,
              stagger: 0.16,
              ease: appleEase,
              clearProps: 'transform,opacity'
            });
          }
        });
      }
    });

    // 5. Standalone Cards & Feature Grids (Apple Card Depth: translateY + subtle scale)
    var cardSelectors = [
      '.quality-card',
      '.product-card-wrapper',
      '.product-card',
      '.founders-premium-card',
      '.profile-card',
      '.form-glass-card',
      '.info-glass-card',
      '.roots-box',
      '.cta-card',
      '.about-cta-row',
      '.step-card',
      '.feature-card',
      '.contact-banner-box',
      '.apple-carousel-card'
    ];

    cardSelectors.forEach(function(selector) {
      var cards = document.querySelectorAll(selector);
      if (cards.length === 0) return;

      var parents = new Set();
      cards.forEach(function(c) {
        if (c.parentElement) parents.add(c.parentElement);
      });

      parents.forEach(function(parent) {
        var siblingCards = parent.querySelectorAll(selector);
        if (siblingCards.length === 0) return;

        if (parent.closest('.reveal-group')) return;

        gsap.set(siblingCards, { opacity: 0, y: 48, scale: 0.965 });

        ScrollTrigger.create({
          trigger: parent,
          start: 'top 88%',
          once: true,
          onEnter: function() {
            siblingCards.forEach(function(c) {
              c.classList.add('revealed');
            });
            gsap.to(siblingCards, {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 1.55,
              stagger: 0.16,
              ease: appleEase,
              clearProps: 'transform,opacity'
            });
          }
        });
      });
    });

    // 6. FAQ Section Items Staggered Reveal (Slow & Smooth)
    var faqSections = document.querySelectorAll('.faq-section, #faq');
    faqSections.forEach(function(faq) {
      var faqItems = faq.querySelectorAll('.faq-item');
      if (faqItems.length === 0) return;

      gsap.set(faqItems, { opacity: 0, y: 32 });

      ScrollTrigger.create({
        trigger: faq,
        start: 'top 88%',
        once: true,
        onEnter: function() {
          gsap.to(faqItems, {
            opacity: 1,
            y: 0,
            duration: 1.35,
            stagger: 0.12,
            ease: appleEase,
            clearProps: 'transform,opacity'
          });
        }
      });
    });

    // 7. Section Headers & Titles (Slow & Smooth)
    var sectionHeaders = document.querySelectorAll(
      '.section-header, .lifestyle-header, .ambient-header, .camera-header, ' +
      '.quality-header, .nagpur-header, .about-section-header, .founders-profiles-section, ' +
      '.form-header, .apple-carousel-title-row'
    );
    sectionHeaders.forEach(function(header) {
      if (header.closest('.reveal-group')) return;

      var headerChildren = header.children;
      if (!headerChildren || headerChildren.length === 0) return;

      gsap.set(headerChildren, { opacity: 0, y: 40 });

      ScrollTrigger.create({
        trigger: header,
        start: 'top 88%',
        once: true,
        onEnter: function() {
          gsap.to(headerChildren, {
            opacity: 1,
            y: 0,
            duration: 1.45,
            stagger: 0.14,
            ease: appleEase,
            clearProps: 'transform,opacity'
          });
        }
      });
    });

    // 8. Apple Global Footer Staggered Reveal
    var footers = document.querySelectorAll('.apple-footer');
    footers.forEach(function(footer) {
      var items = footer.querySelectorAll('.apple-footnotes, .apple-breadcrumbs, .apple-directory-col');
      if (items.length === 0) return;

      gsap.set(items, { opacity: 0, y: 32 });

      ScrollTrigger.create({
        trigger: footer,
        start: 'top 90%',
        once: true,
        onEnter: function() {
          gsap.to(items, {
            opacity: 1,
            y: 0,
            duration: 1.4,
            stagger: 0.10,
            ease: appleEase,
            clearProps: 'transform,opacity'
          });
        }
      });
    });

    // Refresh ScrollTrigger calculations after full page assets load
    window.addEventListener('load', function() {
      setTimeout(function() {
        ScrollTrigger.refresh();
      }, 200);
      setTimeout(function() {
        ScrollTrigger.refresh();
      }, 1000);
    });

    window.addEventListener('resize', function() {
      ScrollTrigger.refresh();
    });
  }

  // Hook into DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnimations);
  } else {
    initAnimations();
  }

  // Expose helper to bind Lenis externally if initialized after DOMContentLoaded
  window.initScrollTriggerWithLenis = function(lenis) {
    window.lenis = lenis;
    window.__lenisDrivenByGsap = true;
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' && lenis) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function(time) {
        lenis.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
      ScrollTrigger.refresh();
    }
  };
})();
