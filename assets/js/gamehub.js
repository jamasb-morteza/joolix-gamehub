(async () => {
    const TAG_COLORS = ['#00f5d4', '#b08dff', '#ff2d6b', '#f5c518'];
    const NEON_CORE_OVERRIDES = {'#b08dff': '#7b2fff'};

    let allGames = [];
    let activeTag = 'all';
    let tagColorMap = {};
    let tagColorStyles = {};
    let tagColorIndex = 0;
    let tagsConfigMap = {};
    let __DICT__ = {};

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

    // ---------- i18n ----------
    function t(key, fallback = '') {
        const v = __DICT__ && Object.prototype.hasOwnProperty.call(__DICT__, key)
            ? __DICT__[key]
            : undefined;
        return (v == null || v === '') ? fallback : String(v);
    }

    function getBaseDir() {
        const href = location.href.split('#')[0].split('?')[0];
        if (href.endsWith('/')) return href;

        const last = href.substring(href.lastIndexOf('/') + 1);
        if (!last.includes('.')) return href + '/';
        return href.replace(/[^/]*$/, '');
    }

    async function fetchJson(url) {
        const res = await fetch(url, {cache: 'no-store'});
        if (!res.ok) throw new Error(`Fetch failed (${res.status}) → ${url}`);
        return await res.json();
    }

    async function tryFetchJsonCandidates(candidates) {
        let lastErr = null;
        for (const url of candidates) {
            try {
                return await fetchJson(url);
            } catch (e) {
                lastErr = e;
            }
        }
        throw lastErr || new Error('All candidates failed');
    }

    async function loadData() {
        const baseDir = getBaseDir();
        const v = Date.now();
        const candidates = [
            new URL(`gamehub.json?v=${v}`, baseDir).toString(),
            `/joolix/games/gamehub.json?v=${v}`,
            `/gamehub.json?v=${v}`,
            `/gamehub/gamehub.json?v=${v}`
        ];
        return await tryFetchJsonCandidates(candidates);
    }

    async function loadDictionary() {
        const STORAGE_KEY = 'joolix_lang';

        const lang = (window.lang === 'fa') ? 'fa' : 'en';

        // language + direction + css hooks
        document.documentElement.setAttribute('data-lang', lang);
        document.documentElement.setAttribute('lang', lang);
        document.documentElement.setAttribute('dir', lang === 'fa' ? 'rtl' : 'ltr');

        const v = Date.now();
        const baseDir = getBaseDir();
        const candidates = [
            new URL(`assets/i18n/${lang}.json?v=${v}`, baseDir).toString(),
            `/assets/i18n/${lang}.json?v=${v}`,
            `/gamehub/assets/i18n/${lang}.json?v=${v}`,
            `/joolix/games/assets/i18n/${lang}.json?v=${v}`
        ];

        try {
            return await tryFetchJsonCandidates(candidates);
        } catch {
            return {};
        }
    }

    function resolvePlaceholders(obj, dict) {
        if (typeof obj === 'string') {
            const m = obj.match(/^_\{(.+)\}$/);
            if (m) return (dict[m[1]] != null) ? dict[m[1]] : obj;
            return obj;
        }
        if (Array.isArray(obj)) return obj.map(v => resolvePlaceholders(v, dict));
        if (obj && typeof obj === 'object') {
            const out = {};
            for (const k in obj) out[k] = resolvePlaceholders(obj[k], dict);
            return out;
        }
        return obj;
    }

    // ---------- end i18n ----------

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
            return {
                color: '#00f5d4',
                borderColor: 'rgba(0,245,212,0.35)',
                activeBorderColor: 'rgba(0,245,212,0.90)',
                background: 'rgba(0,245,212,0.07)',
                activeBackground: 'rgba(0,245,212,0.20)'
            };
        }
        const neonCore = NEON_CORE_OVERRIDES[normalized] || normalized;
        const rgb = hexToRgb(neonCore);
        return {
            color: normalized,
            borderColor: `rgba(${rgb.r},${rgb.g},${rgb.b},0.35)`,
            activeBorderColor: `rgba(${rgb.r},${rgb.g},${rgb.b},0.95)`,
            background: `rgba(${rgb.r},${rgb.g},${rgb.b},0.07)`,
            activeBackground: `rgba(${rgb.r},${rgb.g},${rgb.b},0.30)`,
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

    function applyUiI18n() {
        const loadingText = document.querySelector('#loading .loading-text');
        if (loadingText) loadingText.textContent = t('ui_loading', 'Initializing JOOLIX GameHub…');

        const errTitle = document.querySelector('#error-msg .err-title');
        if (errTitle) errTitle.textContent = t('ui_error_title', '⚠ SIGNAL LOST');

        const errSub = document.querySelector('#error-msg .err-sub');
        if (errSub) errSub.textContent = t('ui_error_sub', 'Could not load gamehub.json');

        const hubTitle = document.querySelector('.joolix-hub-title');
        if (hubTitle) hubTitle.textContent = t('ui_hub_title', 'GameHub');

        const hubSubtitle = document.querySelector('.joolix-hub-subtitle');
        if (hubSubtitle) hubSubtitle.textContent = t('ui_hub_subtitle', 'Discover your next micro-break');

        const allBtn = document.querySelector('.all-btn');
        if (allBtn) allBtn.textContent = t('ui_all_games', 'All Games');

        const overlayTitle = byId('overlay-title');
        if (overlayTitle) overlayTitle.textContent = t('ui_overlay_title', 'Game');

        const overlayBack = byId('overlay-back');
        if (overlayBack) overlayBack.textContent = t('ui_back', 'Back');
    }

    function buildTagFilters(games) {
        const bar = $('.filter-bar');
        if (!bar) return;

        // remove previous dynamic tags (keep .all-btn)
        bar.querySelectorAll('.tag-btn:not(.all-btn)').forEach(n => n.remove());

        const tags = [...new Set((games || []).flatMap(g => g.tags || []))].sort();

        tags.forEach(tag => {
            getTagColor(tag);

            const btn = document.createElement('button');
            btn.className = 'tag-btn';
            btn.dataset.tag = tag;
            btn.textContent = t(`tag_${tag}`, tag);

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
            const emptyText = t('ui_no_games_for_tag', 'No games found for this tag');
            grid.innerHTML = `<div class="empty">
        <div class="empty-icon">🎮</div>
        <div class="empty-text">${emptyText}</div>
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
                const neon_string = JSON.stringify(neon);
                const style = `color:${neon.color};border-color:${neon.borderColor};background:${neon.background};`;
                return `<span class="ctag" data-neon="${neon_string}" style="${style}" data-tag="${tag}">${t(`tag_${tag}`, tag)}</span>`;
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

            // tag click => filter
            card.querySelectorAll('.ctag').forEach(tEl => {
                tEl.addEventListener('click', e => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveTag(tEl.dataset.tag);
                });
            });

            grid.appendChild(card);
        });
    }

    function setActiveTag(tag, opts = {scroll: true}) {
        activeTag = tag;
        document.querySelectorAll('.tag-btn').forEach(btn => {
            const btnTag = btn.dataset.tag;
            const btnNeon = getTagColorStyle(btnTag);
            const isActive = btnTag === tag;

            if (isActive) {
                if (typeof btnNeon.activeBorderColor !== 'undefined') {
                    btn.style.borderColor = btnNeon.activeBorderColor;
                }
                if (typeof btnNeon.activeBackground !== 'undefined') {
                    btn.style.background = btnNeon.activeBackground;
                }
            } else {
                btn.style.borderColor = btnNeon.borderColor;
                btn.style.background = btnNeon.background;
            }

            btn.classList.toggle('active', isActive);
        });

        const filtered = tag === 'all'
            ? allGames
            : allGames.filter(g => g.tags && g.tags.includes(tag));

        renderCards(filtered);

        if (opts && opts.scroll) {
            const bar = $('.filter-bar');
            if (bar) window.scrollTo({top: bar.offsetTop - 20, behavior: 'smooth'});
        }
    }

    function reveal() {
        const loading = byId('loading');
        if (loading) {
            loading.style.opacity = '0';
            setTimeout(() => {
                loading.style.display = 'none';
            }, 500);
        }

        safeShow('main-content', 'block');
        safeShow('footer', 'block');
    }

    try {
        const data = await loadData();
        const dict = await loadDictionary();
        __DICT__ = dict || {};

        applyUiI18n();

        const resolvedData = resolvePlaceholders(data, __DICT__);

        // expose resolved data + dict for other modules (motivation.js / favorites.js)
        window.__GAMEHUB_DATA__ = resolvedData;
        window.__GAMEHUB_DICT__ = __DICT__;
        window.dispatchEvent(new CustomEvent('gamehub:data-ready'));

        allGames = resolvedData.games || [];

        tagsConfigMap = (resolvedData.tags || []).reduce((acc, tag) => {
            const title = ((tag && tag.title) || '').trim();
            const color = normalizeHex(tag && tag.color);
            if (title) acc[title] = color;
            return acc;
        }, {});

        if (resolvedData.title) {
            const footerSuffix = t('ui_footer_suffix', 'GALLERY');
            safeText('footer-text', String(resolvedData.title).toUpperCase() + ' ◆ ' + footerSuffix);
            document.title = resolvedData.title;
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
    }
})();
