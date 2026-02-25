;(() => {
  const FAV_KEY = 'joolix_favorites_v1';
  let favSet = new Set();

  function t(key, fallback = '') {
    const dict = window.__GAMEHUB_DICT__ || {};
    const v = Object.prototype.hasOwnProperty.call(dict, key)
        ? dict[key]
        : undefined;
    return v == null || v === '' ? fallback : String(v);
  }

  function loadFav() {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      favSet = new Set(
          Array.isArray(arr) ? arr.filter(Boolean).map(String) : []
      );
    } catch {
      favSet = new Set();
    }
  }

  function saveFav() {
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify([...favSet]));
    } catch {}
  }

  function isFav(slug) {
    return favSet.has(String(slug));
  }

  function toggleFav(slug) {
    slug = String(slug);
    if (!slug) return;

    if (favSet.has(slug)) favSet.delete(slug);
    else favSet.add(slug);

    saveFav();
    renderFavorites();
    refreshAllStars();
  }

  function getGames() {
    return (window.__GAMEHUB_DATA__ && window.__GAMEHUB_DATA__.games) || [];
  }

  function getFavGames() {
    const map = new Map(getGames().map(g => [String(g.slug), g]));
    return [...favSet].map(s => map.get(String(s))).filter(Boolean);
  }

  function createStar(slug) {
    const btn = document.createElement('button');
    btn.className = 'gh-fav-star';
    btn.dataset.slug = slug;

    updateStar(btn, slug);

    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      toggleFav(slug);
    });

    return btn;
  }

  function updateStar(btn, slug) {
    const fav = isFav(slug);
    btn.classList.toggle('is-fav', fav);
    btn.innerHTML = fav ? '★' : '☆';
    btn.setAttribute(
        'aria-label',
        fav
            ? t('ui_remove_favorite', 'Remove from favorites')
            : t('ui_add_favorite', 'Add to favorites')
    );
  }

  function refreshAllStars() {
    document.querySelectorAll('.gh-fav-star').forEach(btn => {
      const slug = btn.dataset.slug;
      if (slug) updateStar(btn, slug);
    });
  }

  function injectStars() {
    const grid = document.getElementById('game-grid');
    if (!grid) return;

    grid.querySelectorAll('.game-card').forEach(card => {
      if (card.querySelector('.gh-fav-star')) return;

      const href =
          card.querySelector('.game-anchor-link')?.getAttribute('href') || '';

      const slugMatch = href.match(/games\/([^/]+)/);
      if (!slugMatch) return;

      const slug = slugMatch[1];
      const wrap = card.querySelector('.card-thumb-wrap');
      if (!wrap) return;

      wrap.appendChild(createStar(slug));
    });
  }

  function ensureStrip() {
    if (document.getElementById('gh-fav-strip')) return;

    const bar = document.querySelector('.filter-bar');
    if (!bar) return;

    const strip = document.createElement('section');
    strip.id = 'gh-fav-strip';
    strip.className = 'gh-fav-strip glass';
    strip.innerHTML = `
      <div class="gh-fav-head">
        <div class="gh-fav-title"></div>
        <div class="gh-fav-hint"></div>
      </div>
      <div class="gh-fav-list" id="gh-fav-list"></div>
    `;

    bar.parentNode.insertBefore(strip, bar);
  }

  function renderFavorites() {
    ensureStrip();

    const strip = document.getElementById('gh-fav-strip');
    if (strip) {
      const titleEl = strip.querySelector('.gh-fav-title');
      if (titleEl) titleEl.textContent = t('ui_favorites', 'Favorites');

      const hintEl = strip.querySelector('.gh-fav-hint');
      if (hintEl)
        hintEl.textContent = t(
            'ui_fav_hint',
            'Tap ★ on a game to save it here'
        );
    }

    const list = document.getElementById('gh-fav-list');
    if (!list) return;

    const favGames = getFavGames();
    list.innerHTML = '';

    if (!favGames.length) {
      list.innerHTML = `<div class="gh-fav-empty">${t(
          'ui_no_favorites',
          'No favorites yet'
      )}</div>`;
      return;
    }

    favGames.forEach(game => {
      const card = document.createElement('div');
      card.className = 'gh-fav-card';

      card.innerHTML = `
        <a href="./games/${game.slug}/index.html">
          <img class="gh-fav-thumb" src="${game.image}" alt="${game.title || ''}">
          <div class="gh-fav-name">${game.title || ''}</div>
        </a>
        <button class="gh-fav-remove" type="button" data-slug="${game.slug}"
          aria-label="${t(
          'ui_remove_favorite',
          'Remove from favorites'
      )}">×</button>
      `;

      card.querySelector('.gh-fav-remove')?.addEventListener(
          'click',
          e => {
            e.preventDefault();
            e.stopPropagation();
            toggleFav(game.slug);
          }
      );

      list.appendChild(card);
    });
  }

  function observeGrid() {
    const grid = document.getElementById('game-grid');
    if (!grid) return;

    injectStars();

    let scheduled = false;

    const observer = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;

      requestAnimationFrame(() => {
        injectStars();
        refreshAllStars();
        scheduled = false;
      });
    });

    // Only observe direct child changes (prevents infinite loop)
    observer.observe(grid, { childList: true });
  }

  function syncFavoritesUiFromData() {
    renderFavorites();
    injectStars();
    refreshAllStars();
  }

  window.addEventListener('gamehub:data-ready', () => {
    syncFavoritesUiFromData();
  });

  document.addEventListener('DOMContentLoaded', () => {
    loadFav();
    observeGrid();
    syncFavoritesUiFromData();
  });
})();