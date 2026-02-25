(() => {
  const STORAGE_KEY = 'joolix_lang'; // 'fa' | 'en'
  const DEFAULT_LANG = 'en';

  function getSavedLang() {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      return (v === 'fa' || v === 'en') ? v : DEFAULT_LANG;
    } catch (e) {
      return DEFAULT_LANG;
    }
  }

  function applyLang(lang) {
    const normalized = (lang === 'fa' || lang === 'en') ? lang : DEFAULT_LANG;

    const root = document.documentElement;
    root.setAttribute('lang', normalized);
    root.setAttribute('dir', normalized === 'fa' ? 'rtl' : 'ltr');

    root.classList.toggle('is-rtl', normalized === 'fa');
    root.classList.toggle('is-ltr', normalized === 'en');

    const faBtn = document.getElementById('lang-fa');
    const enBtn = document.getElementById('lang-en');
    if (faBtn) faBtn.classList.toggle('active', normalized === 'fa');
    if (enBtn) enBtn.classList.toggle('active', normalized === 'en');
  }

  function hardReload() {
    // safer than location.reload() in some setups
    const url = window.location.href.split('#')[0];
    window.location.assign(url);
  }

  function setLang(lang) {
    const normalized = (lang === 'fa' || lang === 'en') ? lang : DEFAULT_LANG;

    try { localStorage.setItem(STORAGE_KEY, normalized); } catch (e) {}

    // Apply immediately for direction/layout
    applyLang(normalized);

    // ✅ reload on next tick (more reliable)
    setTimeout(hardReload, 30);
  }

  function init() {
    applyLang(getSavedLang());

    const faBtn = document.getElementById('lang-fa');
    const enBtn = document.getElementById('lang-en');

    if (faBtn) faBtn.addEventListener('click', () => setLang('fa'));
    if (enBtn) enBtn.addEventListener('click', () => setLang('en'));
  }

  window.__JOOLIX_LANG__ = { get: getSavedLang, set: setLang };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();