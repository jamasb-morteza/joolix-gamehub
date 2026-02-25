(async () => {
  const TAG_COLORS = ['#00f5d4', '#b08dff', '#ff2d6b', '#f5c518'];
  const NEON_CORE_OVERRIDES = { '#b08dff': '#7b2fff' };

  let allGames = [];
  let activeTag = 'all';
  let tagColorMap = {};
  let tagColorStyles = {};
  let tagColorIndex = 0;
  let tagsConfigMap = {};

  const $ = (sel, root = document) => root.querySelector(sel);
  const byId = (id) => document.getElementById(id);

  const safeText = (id, value) => {
    const el = byId(id);
    if (el) el.textContent = value;
  };

  const safeShow = (id, display = 'block') => {
    const el = byId(id);
    if (el) el.style.display = display;
  };

  const safeHide = (id) => {
    const el = byId(id);
    if (el) el.style.display = 'none';
  };

  function normalizeHex(hex) {
    if (!hex || typeof hex !== 'string') return null;
    const value = hex.trim();
    const m = value.match(/^#([\da-f]{3}|[\da-f]{6})$/i);
    if (!m) return null;
    const raw = m[1];
    if (raw.length === 3) return `#${raw.split('').map(ch => ch + ch).join('').toLowerCase()}`;
    return `#${raw.toLowerCase()}`;
  }

  function hexToRgb(hex) {
    const normalized = normalizeHex(hex);
    if (!normalized) return null;
    return {
      r: parseInt(normalized.slice(1, 3), 16),
      g: parseInt(normalized.slice(3, 5), 16),
      b: parseInt(normalized.slice(5, 7), 16)
    };
  }

  function neonizeColor(baseColor) {
    const normalized = normalizeHex(baseColor);
    if (!normalized) {
      return { color: '#00f5d4', borderColor: 'rgba(0,245,212,0.35)', background: 'rgba(0,245,212,0.07)' };
    }
    const neonCore = NEON_CORE_OVERRIDES[normalized] || normalized;
    const rgb = hexToRgb(neonCore);
    return {
      color: normalized,
      borderColor: `rgba(${rgb.r},${rgb.g},${rgb.b},0.35)`,
      background: `rgba(${rgb.r},${rgb.g},${rgb.b},0.07)`
    };
  }

  function getTagColor(tag) {
    if (!tagColorMap[tag]) {
      const configColor = tagsConfigMap[tag];
      const fallbackColor = TAG_COLORS[tagColorIndex % TAG_COLORS.length];
      tagColorMap[tag] = configColor || fallbackColor;
      tagColorIndex++;
    }
    return tagColorMap[tag];
  }

  function getTagColorStyle(tag) {
    if (!tagColorStyles[tag]) tagColorStyles[tag] = neonizeColor(getTagColor(tag));
    return tagColorStyles[tag];
  }

  async function loadData() {
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
          lastErr = new Error(`Fetch failed (${res.status}) → ${url}`);
          continue;
        }
        return await res.json();
      } catch (e) {
        lastErr = new Error(`Fetch error → ${url}`);
      }
    }

    throw lastErr || new Error('Could not load JSON');
  }

  function buildTagFilters(games) {
    const bar = $('.filter-bar');
    if (!bar) return;

    const tags = [...new Set((games || []).flatMap(g => g.tags || []))].sort();

    tags.forEach(tag => {
      getTagColor(tag);

      const btn = document.createElement('button');
      btn.className = 'tag-btn';
      btn.dataset.tag = tag;
      btn.textContent = tag;

      const neon = getTagColorStyle(tag);
      btn.style.borderColor = neon.borderColor;
      btn.style.color = neon.color;
      btn.style.background = neon.background;

      bar.appendChild(btn);
    });
  }

  function renderCards(games) {
    const grid = byId('game-grid');
    if (!grid) return;

    grid.innerHTML = '';

    if (!games || games.length === 0) {
      grid.innerHTML = `<div class="empty">
        <div class="empty-icon">🎮</div>
        <div class="empty-text">No games found for this tag</div>
      </div>`;
      return;
    }

    games.forEach((game, i) => {
      const card = document.createElement('div');
      const slug = game && game.slug ? String(game.slug) : '';

      card.className = 'game-card';
      card.style.animationDelay = `${i * 60}ms`;

      const tags = (game.tags || []).map(tag => {
        const neon = getTagColorStyle(tag);
        const style = `color:${neon.color};border-color:${neon.borderColor};background:${neon.background};`;
        return `<span class="ctag" style="${style}" data-tag="${tag}">${tag}</span>`;
      }).join('');

      const imgSrc = game.image || `https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80`;
      const href = slug ? `./games/${slug}/index.html` : '#';

      card.innerHTML = `
        <div class="card-thumb-wrap">
          <img class="card-thumb" src="${imgSrc}" alt="${game.title || ''}" loading="lazy"
            onerror="this.src='https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80'" />
          <a href="${href}" class="game-anchor-link">
            <div class="card-play">
              <div class="play-icon">
                <svg viewBox="0 0 24 24" fill="#01110d" aria-hidden="true">
                  <polygon points="6,4 20,12 6,20"></polygon>
                </svg>
              </div>
            </div>
          </a>
        </div>
        <div class="card-body">
          <div class="card-title">${game.title || ''}</div>
          <div class="card-desc">${game.descriptions || ''}</div>
          <div class="card-tags">${tags}</div>
        </div>
      `;

      card.querySelectorAll('.ctag').forEach(t => {
        t.addEventListener('click', e => {
          e.stopPropagation();
          setActiveTag(t.dataset.tag);
        });
      });

      grid.appendChild(card);
    });
  }

  function setActiveTag(tag) {
    activeTag = tag;

    document.querySelectorAll('.tag-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tag === tag);
    });

    const filtered = tag === 'all' ? allGames : allGames.filter(g => g.tags && g.tags.includes(tag));
    renderCards(filtered);

    const bar = $('.filter-bar');
    if (bar) window.scrollTo({ top: bar.offsetTop - 20, behavior: 'smooth' });
  }

  function reveal() {
    const loading = byId('loading');
    if (loading) {
      loading.style.opacity = '0';
      setTimeout(() => { loading.style.display = 'none'; }, 500);
    }

    safeShow('header', 'block');
    safeShow('main-content', 'block');
    safeShow('footer', 'block');
  }

  try {
    const data = await loadData();
window.__GAMEHUB_DATA__ = data;
    allGames = data.games || [];
    tagsConfigMap = (data.tags || []).reduce((acc, tag) => {
      const title = ((tag && tag.title) || '').trim();
      const color = normalizeHex(tag && tag.color);
      if (title) acc[title] = color;
      return acc;
    }, {});

    if (data.title) {
      safeText('hub-title', data.title);
      safeText('hub-badge', data.title);
      safeText('footer-text', data.title.toUpperCase() + ' ◆ GALLERY');
      document.title = data.title;
    }

    buildTagFilters(allGames);
    renderCards(allGames);

    const bar = $('.filter-bar');
    if (bar) {
      bar.addEventListener('click', e => {
        const btn = e.target.closest('.tag-btn');
        if (btn) setActiveTag(btn.dataset.tag);
      });
    }

    reveal();
  } catch (err) {
    safeHide('loading');
    safeShow('error-msg', 'flex');

    const errBox = byId('error-msg');
    if (errBox) {
      const sub = errBox.querySelector('.err-sub');
      if (sub) sub.textContent = err && err.message ? err.message : 'Could not load gamehub.json';
    }
  }
})();