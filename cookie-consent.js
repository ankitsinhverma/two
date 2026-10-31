/**
 * IntelliHome Cookie & Privacy Consent Controller
 * Modern, Apple-style consent management system adhering to DPDP Act & GDPR principles.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'intellihome_cookie_consent';
  var CONSENT_VERSION = 1;

  var defaultConsent = {
    necessary: true,
    analytics: false,
    functional: false,
    timestamp: null,
    version: CONSENT_VERSION
  };

  function getSavedConsent() {
    try {
      var item = localStorage.getItem(STORAGE_KEY);
      if (!item) return null;
      var parsed = JSON.parse(item);
      if (parsed && parsed.version === CONSENT_VERSION) {
        return parsed;
      }
    } catch (e) {
      console.warn('Unable to access localStorage for cookie consent:', e);
    }
    return null;
  }

  function saveConsent(consent) {
    try {
      consent.necessary = true; // Always required
      consent.timestamp = new Date().toISOString();
      consent.version = CONSENT_VERSION;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
      
      // Dispatch custom event for telemetry/scripts
      window.dispatchEvent(new CustomEvent('intellihome-consent-updated', { detail: consent }));
    } catch (e) {
      console.warn('Unable to save cookie consent to localStorage:', e);
    }
  }

  function injectBannerHTML() {
    if (document.getElementById('ih-cookie-banner')) return;

    var container = document.createElement('div');
    container.innerHTML = 
      '<!-- IntelliHome Cookie Consent Floating Banner -->' +
      '<div class="ih-cookie-banner" id="ih-cookie-banner" role="region" aria-label="Cookie Consent Banner">' +
        '<div class="ih-cookie-header">' +
          '<svg class="ih-cookie-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"></path>' +
            '<path d="M8.5 8.5v.01"></path>' +
            '<path d="M16 15.5v.01"></path>' +
            '<path d="M12 12v.01"></path>' +
            '<path d="M11 17v.01"></path>' +
            '<path d="M7 13v.01"></path>' +
          '</svg>' +
          '<h3 class="ih-cookie-title">Privacy &amp; Cookie Preferences</h3>' +
        '</div>' +
        '<p class="ih-cookie-desc">' +
          'We use essential cookies to run our site and optional analytics to enhance your experience. Review our ' +
          '<a href="privacy.html" target="_blank">Privacy Policy</a> and <a href="cookie-policy.html" target="_blank">Cookie Policy</a>.' +
        '</p>' +
        '<div class="ih-cookie-actions">' +
          '<div class="ih-cookie-btn-row">' +
            '<button type="button" class="ih-cookie-btn ih-cookie-btn-primary" id="ih-cookie-accept-all">Accept All</button>' +
            '<button type="button" class="ih-cookie-btn ih-cookie-btn-secondary" id="ih-cookie-reject-optional">Reject Optional</button>' +
          '</div>' +
          '<button type="button" class="ih-cookie-btn-text" id="ih-cookie-open-modal">Customize Preferences</button>' +
        '</div>' +
      '</div>' +

      '<!-- IntelliHome Preferences Modal -->' +
      '<div class="ih-cookie-modal-overlay" id="ih-cookie-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="ih-modal-title">' +
        '<div class="ih-cookie-modal">' +
          '<div class="ih-cookie-modal-header">' +
            '<div>' +
              '<h3 class="ih-cookie-modal-title" id="ih-modal-title">Cookie &amp; Tracking Settings</h3>' +
              '<p class="ih-cookie-modal-subtitle">Choose which categories of cookies you allow us to use.</p>' +
            '</div>' +
            '<button type="button" class="ih-cookie-close-btn" id="ih-cookie-close-modal" aria-label="Close dialog">' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
                '<line x1="18" y1="6" x2="6" y2="18"></line>' +
                '<line x1="6" y1="6" x2="18" y2="18"></line>' +
              '</svg>' +
            '</button>' +
          '</div>' +
          '<div class="ih-cookie-modal-body">' +
            '<!-- Category 1: Essential -->' +
            '<div class="ih-cookie-pref-item">' +
              '<div class="ih-cookie-pref-row">' +
                '<h4 class="ih-cookie-pref-label">Strictly Necessary Cookies</h4>' +
                '<span class="ih-cookie-pref-badge">Always Active</span>' +
              '</div>' +
              '<p class="ih-cookie-pref-desc">Required for system security, network stability, theme preservation, and form functionality. These cannot be disabled.</p>' +
            '</div>' +

            '<!-- Category 2: Analytics -->' +
            '<div class="ih-cookie-pref-item">' +
              '<div class="ih-cookie-pref-row">' +
                '<label class="ih-cookie-pref-label" for="ih-toggle-analytics">Analytics &amp; Performance</label>' +
                '<label class="ih-switch">' +
                  '<input type="checkbox" id="ih-toggle-analytics">' +
                  '<span class="ih-slider"></span>' +
                '</label>' +
              '</div>' +
              '<p class="ih-cookie-pref-desc">Help us understand how visitors interact with blueprints, product catalogs, and consultation requests so we can refine performance.</p>' +
            '</div>' +

            '<!-- Category 3: Functional -->' +
            '<div class="ih-cookie-pref-item">' +
              '<div class="ih-cookie-pref-row">' +
                '<label class="ih-cookie-pref-label" for="ih-toggle-functional">Functional Experience</label>' +
                '<label class="ih-switch">' +
                  '<input type="checkbox" id="ih-toggle-functional">' +
                  '<span class="ih-slider"></span>' +
                '</label>' +
              '</div>' +
              '<p class="ih-cookie-pref-desc">Enables enhanced interactive features, smooth UI transitions, and personalized automation recommendations.</p>' +
            '</div>' +
          '</div>' +
          '<div class="ih-cookie-modal-footer">' +
            '<button type="button" class="ih-cookie-btn ih-cookie-btn-secondary" id="ih-modal-save">Save My Preferences</button>' +
            '<button type="button" class="ih-cookie-btn ih-cookie-btn-primary" id="ih-modal-accept-all">Accept All</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(container);
  }

  function initCookieConsent() {
    injectBannerHTML();

    var banner = document.getElementById('ih-cookie-banner');
    var overlay = document.getElementById('ih-cookie-modal-overlay');
    var acceptAllBtn = document.getElementById('ih-cookie-accept-all');
    var rejectOptionalBtn = document.getElementById('ih-cookie-reject-optional');
    var openModalBtn = document.getElementById('ih-cookie-open-modal');
    var closeModalBtn = document.getElementById('ih-cookie-close-modal');
    var modalSaveBtn = document.getElementById('ih-modal-save');
    var modalAcceptAllBtn = document.getElementById('ih-modal-accept-all');

    var toggleAnalytics = document.getElementById('ih-toggle-analytics');
    var toggleFunctional = document.getElementById('ih-toggle-functional');

    var saved = getSavedConsent();

    function showBanner() {
      if (banner) banner.classList.add('ih-show');
    }

    function hideBanner() {
      if (banner) banner.classList.remove('ih-show');
    }

    function openModal() {
      var current = getSavedConsent() || defaultConsent;
      if (toggleAnalytics) toggleAnalytics.checked = !!current.analytics;
      if (toggleFunctional) toggleFunctional.checked = !!current.functional;
      if (overlay) overlay.classList.add('ih-show');
    }

    function closeModal() {
      if (overlay) overlay.classList.remove('ih-show');
    }

    // Handlers
    if (acceptAllBtn) {
      acceptAllBtn.addEventListener('click', function () {
        saveConsent({ necessary: true, analytics: true, functional: true });
        hideBanner();
      });
    }

    if (rejectOptionalBtn) {
      rejectOptionalBtn.addEventListener('click', function () {
        saveConsent({ necessary: true, analytics: false, functional: false });
        hideBanner();
      });
    }

    if (openModalBtn) {
      openModalBtn.addEventListener('click', function (e) {
        e.preventDefault();
        openModal();
      });
    }

    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', function () {
        closeModal();
      });
    }

    if (overlay) {
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) {
          closeModal();
        }
      });
    }

    if (modalSaveBtn) {
      modalSaveBtn.addEventListener('click', function () {
        saveConsent({
          necessary: true,
          analytics: toggleAnalytics ? toggleAnalytics.checked : false,
          functional: toggleFunctional ? toggleFunctional.checked : false
        });
        closeModal();
        hideBanner();
      });
    }

    if (modalAcceptAllBtn) {
      modalAcceptAllBtn.addEventListener('click', function () {
        saveConsent({ necessary: true, analytics: true, functional: true });
        closeModal();
        hideBanner();
      });
    }

    // Attach listener for any element with cookie-preference trigger
    document.addEventListener('click', function (e) {
      var target = e.target.closest('#open-cookie-preferences, .open-cookie-preferences, [data-open-cookie-preferences], a[href="#cookie-preferences"]');
      if (target) {
        e.preventDefault();
        openModal();
      }
    });

    // Check if initial banner should show
    if (!saved) {
      setTimeout(function () {
        showBanner();
      }, 700);
    }

    // Public API
    window.IntelliHomeConsent = {
      getConsent: getSavedConsent,
      openPreferences: openModal,
      acceptAll: function () {
        saveConsent({ necessary: true, analytics: true, functional: true });
        hideBanner();
      },
      rejectOptional: function () {
        saveConsent({ necessary: true, analytics: false, functional: false });
        hideBanner();
      }
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCookieConsent);
  } else {
    initCookieConsent();
  }
})();
