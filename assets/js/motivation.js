;(() => {
  const BTN_CLASS = 'gh-growth-impact-btn';
  const MODAL_ID = 'gh-motivation-modal';

  // ---------- i18n helper ----------
  const __t = (key, fallback = '') => {
    const dict = window.__GAMEHUB_DICT__ || {};
    const v = Object.prototype.hasOwnProperty.call(dict, key) ? dict[key] : undefined;
    return (v == null || v === '') ? fallback : String(v);
  };

  // ---------- Data (prefer window, fallback to fetch) ----------
  let _cache = null;
  let _fetchPromise = null;

  function extractSlugFromHref(href) {
    if (!href) return '';
    const m = String(href).match(/(?:^|\/|\.)games\/([^\/]+)\/index\.html(?:$|\?|\#)/i);
    return m ? m[1] : '';
  }

  function findGameBySlug(data, slug) {
    const games = data && Array.isArray(data.games) ? data.games : [];
    return games.find(g => String(g.slug) === String(slug)) || null;
  }

  async function loadData() {
    if (window.__GAMEHUB_DATA__ && Array.isArray(window.__GAMEHUB_DATA__.games)) {
      return window.__GAMEHUB_DATA__;
    }
    if (_cache) return _cache;
    if (_fetchPromise) return _fetchPromise;

    _fetchPromise = (async () => {
      const baseDir = location.href.replace(/[#?].*$/, '').replace(/[^/]*$/, '');
      const candidates = [
        new URL('gamehub.json', baseDir).toString(),
        '/joolix/games/gamehub.json',
        '/gamehub.json',
        '/gamehub/gamehub.json'
      ];

      let lastErr = null;
      for (const url of candidates) {
        try {
          const res = await fetch(url, { cache: 'no-store' });
          if (!res.ok) {
            lastErr = new Error(`Fetch failed (${res.status})`);
            continue;
          }
          const data = await res.json();
          _cache = data;
          return data;
        } catch (e) {
          lastErr = e;
        }
      }
      throw lastErr || new Error('Could not load gamehub.json');
    })();

    return _fetchPromise;
  }

  // ---------- Modal ----------
  function closeModal() {
    const root = document.getElementById(MODAL_ID);
    if (!root) return;
    root.classList.remove('is-open');
    root.setAttribute('aria-hidden', 'true');
    root.style.display = 'none';
    document.documentElement.classList.remove('gh-modal-open');
  }

  function ensureModal() {
    let root = document.getElementById(MODAL_ID);
    if (root) return root;

    root = document.createElement('div');
    root.id = MODAL_ID;
    root.className = 'gh-motivation-modal';
    root.setAttribute('aria-hidden', 'true');
    root.style.display = 'none';

    // ✅ Growth Impact removed from inside modal
    root.innerHTML = `
      <div class="gh-motivation-backdrop" data-gh-close="1"></div>
      <div class="gh-motivation-panel" role="dialog" aria-modal="true" aria-labelledby="gh-motivation-title">
        <button class="gh-motivation-close" type="button" aria-label="Close" data-gh-close="1">×</button>
        <div class="gh-motivation-header">
          <div class="gh-motivation-title text-center" id="gh-motivation-title"></div>
        </div>
        <div class="gh-motivation-body">
          <ul class="gh-motivation-list" id="gh-motivation-list"></ul>
        </div>
      </div>
    `;

    document.body.appendChild(root);

    // ✅ SUPER-ROBUST CLOSE: capture phase + pointerdown + click
    const closeIfNeeded = (e) => {
      const t = e && e.target;
      if (!t || !t.closest) return;
      const hit = t.closest('[data-gh-close="1"]');
      if (hit && root.contains(hit)) {
        e.preventDefault();
        e.stopPropagation();
        closeModal();
      }
    };

    // capture = true  => حتی اگر جاهای دیگر stopPropagation کنند، این می‌گیرد
    root.addEventListener('pointerdown', closeIfNeeded, true);
    root.addEventListener('click', closeIfNeeded, true);

    // Escape (once)
    if (!window.__GH_ESC_BOUND__) {
      window.__GH_ESC_BOUND__ = true;
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
      });
    }

    return root;
  }

  function openModalWithItems(titleText, items) {
    const root = ensureModal();
    const title = root.querySelector('#gh-motivation-title');
    const list = root.querySelector('#gh-motivation-list');

    if (title) title.textContent = titleText || '';

    if (list) {
      list.innerHTML = '';
      if (!items || !items.length) {
        const li = document.createElement('li');
        li.className = 'gh-motivation-empty';
        li.textContent = __t('ui_no_motivation_items', 'No motivation items found for this game.');
        list.appendChild(li);
      } else {
        items.forEach((t) => {
          const li = document.createElement('li');
          li.className = 'gh-motivation-item';
          li.textContent = String(t);
          list.appendChild(li);
        });
      }
    }

    root.style.display = 'block';
    root.classList.add('is-open');
    root.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('gh-modal-open');
  }

  // ---------- Inject button ----------
  function ensureCardFooter(card) {
    const existing = card.querySelector('.card-footer');
    if (existing) return existing;

    const footer = document.createElement('div');
    footer.className = 'card-footer';

    const body = card.querySelector('.card-body');
    if (body && body.parentNode === card) card.appendChild(footer);
    else card.appendChild(footer);

    return footer;
  }

  function injectButtons() {
    document.querySelectorAll('.game-card').forEach((card) => {
      if (card.querySelector(`.${BTN_CLASS}`)) return;

      const footer = ensureCardFooter(card);
      if (!footer) return;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = BTN_CLASS;
      btn.textContent = __t('ui_growth_impact', 'Growth Impact');

      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        try {
          const anchor = card.querySelector('.game-anchor-link');
          const href = anchor ? anchor.getAttribute('href') : '';
          const slug = extractSlugFromHref(href);

          const data = await loadData();
          const game = slug ? findGameBySlug(data, slug) : null;

          const titleText = (game && game.title)
            ? game.title
            : (card.querySelector('.card-title')?.textContent || '');

          const items = (game && Array.isArray(game.motivation)) ? game.motivation : [];
          openModalWithItems(titleText, items);
        } catch {
          const titleText = card.querySelector('.card-title')?.textContent || '';
          openModalWithItems(titleText, []);
        }
      });

      footer.appendChild(btn);
    });
  }

  function observeGrid() {
    const grid = document.getElementById('game-grid');
    if (!grid) return;

    injectButtons();
    const obs = new MutationObserver(() => injectButtons());
    obs.observe(grid, { childList: true, subtree: true });
  }

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(() => {
    const tick = () => {
      const grid = document.getElementById('game-grid');
      if (grid) observeGrid();
      else setTimeout(tick, 60);
    };
    tick();
  });
})();
