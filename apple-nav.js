/**
 * Apple Global Navigation Controller
 * Handles mobile hamburger morphing, smooth slide-down tray, and accessible navigation.
 */
(function () {
  'use strict';

  function initAppleNav() {
    var toggleBtn = document.getElementById('apple-menu-toggle');
    var mobileTray = document.getElementById('apple-mobile-tray');
    if (!toggleBtn || !mobileTray) return;

    function openMenu() {
      document.body.classList.add('apple-menu-open');
      toggleBtn.setAttribute('aria-expanded', 'true');
    }

    function closeMenu() {
      document.body.classList.remove('apple-menu-open');
      toggleBtn.setAttribute('aria-expanded', 'false');
    }

    function toggleMenu(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      var isOpen = document.body.classList.contains('apple-menu-open');
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    }

    toggleBtn.addEventListener('click', toggleMenu);

    // Close mobile tray when any link inside it is clicked
    var mobileLinks = mobileTray.querySelectorAll('a');
    mobileLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        closeMenu();
      });
    });

    // Close on Escape key press
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('apple-menu-open')) {
        closeMenu();
      }
    });

    // Close on window resize above mobile breakpoint
    window.addEventListener('resize', function () {
      if (window.innerWidth > 833 && document.body.classList.contains('apple-menu-open')) {
        closeMenu();
      }
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAppleNav);
  } else {
    initAppleNav();
  }
})();


/* ===== IntelliHome Universal Conversion Tracker ===== */
(function() {
  // Universal CTA Event Listener (Google Analytics 4 / Google Tag Manager integration)
  document.addEventListener('click', function(e) {
    var ctaEl = e.target.closest('[data-cta]');
    if (ctaEl) {
      var ctaType = ctaEl.getAttribute('data-cta');
      var conversionType = ctaEl.getAttribute('data-conversion') || 'lead';
      var ctaText = ctaEl.innerText.trim();
      
      // Dispatch dataLayer event for GTM / GA4 if available
      if (typeof window.dataLayer !== 'undefined') {
        window.dataLayer.push({
          event: 'conversion_click',
          cta_type: ctaType,
          conversion_name: conversionType,
          cta_text: ctaText,
          page_path: window.location.pathname
        });
      }
      
      // Console telemetry
      console.log('[IntelliHome Conversion Tracked]:', ctaType, '|', conversionType, '|', ctaText);
    }
  });
})();
