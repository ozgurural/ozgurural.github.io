/* Optional analytics: no Google tag request until explicit opt-in.
   See https://developers.google.com/tag-platform/security/guides/privacy */
(function () {
  'use strict';
  var panel = document.getElementById('analytics-consent');
  if (!panel) return;
  var id = panel.getAttribute('data-measurement-id');
  if (!/^G-[A-Z0-9]+$/.test(id || '')) return;
  var key = 'analytics-consent-v1';
  var preferences = document.getElementById('analytics-preferences');
  var loaded = false;
  var choice = null;
  var returnFocus = null;
  window['ga-disable-' + id] = true;

  function readChoice() {
    try {
      var saved = JSON.parse(localStorage.getItem(key));
      if (saved && saved.expires > Date.now() && /^(accepted|declined)$/.test(saved.choice)) return saved.choice;
    } catch (error) { /* Storage can be disabled. Default to no tracking. */ }
    return null;
  }

  function clearAnalyticsCookies() {
    ['_ga', '_ga_' + id.slice(2)].forEach(function (name) {
      ['', '; domain=' + location.hostname, '; domain=.' + location.hostname].forEach(function (domain) {
        document.cookie = name + '=; max-age=0; path=/' + domain + '; SameSite=Lax';
      });
    });
  }

  function applyChoice() {
    var accepted = choice === 'accepted';
    window['ga-disable-' + id] = !accepted;
    if (!accepted) { clearAnalyticsCookies(); return; }
    if (loaded || document.prerendering) return;
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', id, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_domain: location.hostname,
      page_location: location.origin + location.pathname
    });
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    document.head.appendChild(script);
  }

  function selectChoice(value) {
    choice = value;
    try {
      localStorage.setItem(key, JSON.stringify({choice: value, expires: Date.now() + 180 * 86400000}));
    } catch (error) { /* Apply for this page even when persistence is blocked. */ }
    applyChoice();
    panel.hidden = true;
    if (returnFocus) { returnFocus.focus(); returnFocus = null; }
    else if (preferences) preferences.focus({preventScroll: true});
  }

  panel.querySelectorAll('[data-consent]').forEach(function (button) {
    button.addEventListener('click', function () { selectChoice(button.getAttribute('data-consent')); });
  });
  if (preferences) preferences.addEventListener('click', function () {
    returnFocus = preferences;
    panel.hidden = false;
    panel.querySelector('button').focus();
  });
  document.addEventListener('prerenderingchange', applyChoice);
  window.addEventListener('storage', function (event) {
    if (event.key === key || event.key === null) {
      choice = readChoice();
      applyChoice();
      panel.hidden = choice !== null;
    }
  });
  choice = readChoice();
  panel.hidden = choice !== null;
  applyChoice();
})();
