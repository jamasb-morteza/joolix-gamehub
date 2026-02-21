(async () => {
    const TAG_COLORS = ['#00f5d4', '#b08dff', '#ff2d6b', '#f5c518'];
    const NEON_CORE_OVERRIDES = {
        '#b08dff': '#7b2fff'
    };
    let allGames = [];
    let activeTag = 'all';
    let tagColorMap = {};
    let tagColorStyles = {};
    let tagColorIndex = 0;
    let tagsConfigMap = {};

    function normalizeHex(hex) {
        if (!hex || typeof hex !== 'string') return null;
        const value = hex.trim();
        const m = value.match(/^#([\da-f]{3}|[\da-f]{6})$/i);
        if (!m) return null;
        const raw = m[1];
        if (raw.length === 3) {
            return `#${raw.split('').map(ch => ch + ch).join('').toLowerCase()}`;
        }
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
                background: 'rgba(0,245,212,0.07)'
            };
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
        if (!tagColorStyles[tag]) {
            tagColorStyles[tag] = neonizeColor(getTagColor(tag));
        }
        return tagColorStyles[tag];
    }

    async function loadData() {
        try {
            const res = await fetch('/gamehub/gamehub.json');
            if (!res.ok) throw new Error('not found');
            const data = await res.json();
            return data;
        } catch (e) {
            throw e;
        }
    }

    function buildTagFilters(games) {
        const tags = [...new Set(games.flatMap(g => g.tags || []))].sort();
        const bar = document.querySelector('.filter-bar');
        tags.forEach(tag => {
            getTagColor(tag); // pre-assign color
            const btn = document.createElement('button');
            btn.className = 'tag-btn';
            btn.dataset.tag = tag;
            btn.textContent = tag;
            bar.appendChild(btn);
        });
    }

    function renderCards(games) {
        const grid = document.getElementById('game-grid');
        grid.innerHTML = '';
        document.getElementById('count').textContent = games.length;

        if (games.length === 0) {
            grid.innerHTML = `<div class="empty">
          <div class="empty-icon">🎮</div>
          <div class="empty-text">No games found for this tag</div>
        </div>`;
            return;
        }

        games.forEach((game, i) => {
            const card = document.createElement('div');
            const slug = typeof game.slug !=='undefined'?game.slug:null;
            card.className = 'game-card';
            card.style.animationDelay = `${i * 60}ms`;

            const tags = (game.tags || []).map(tag => {
                const neon = getTagColorStyle(tag);
                const style = `color:${neon.color};border-color:${neon.borderColor};background:${neon.background};`;
                return `<span class="ctag" style="${style}" data-tag="${tag}">${tag}</span>`;
            }).join('');

            const imgSrc = game.image || `https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80`;

            card.innerHTML = `
          <div class="card-thumb-wrap">
            <img class="card-thumb" src="${imgSrc}" alt="${game.title}" loading="lazy"
              onerror="this.src='https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80'" />
            <a href="./games/${slug}" class="game-anchor-link">
                <div class="card-play">
                  <div class="play-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#080b12">
                      <polygon points="5,3 19,12 5,21"/>
                    </svg>
                  </div>
                </div>
            </a>
          </div>
          <div class="card-body">
            <div class="card-title">${game.title}</div>
            <div class="card-desc">${game.descriptions || ''}</div>
            <div class="card-tags">${tags}</div>
          </div>
        `;

            // click on card tag → filter
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
        // update buttons
        document.querySelectorAll('.tag-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tag === tag);
        });
        const filtered = tag === 'all' ? allGames : allGames.filter(g => g.tags && g.tags.includes(tag));
        renderCards(filtered);
        window.scrollTo({top: document.querySelector('.filter-bar').offsetTop - 20, behavior: 'smooth'});
    }

    function reveal() {
        const loading = document.getElementById('loading');
        loading.style.opacity = '0';
        setTimeout(() => {
            loading.style.display = 'none';
        }, 500);
        document.getElementById('header').style.display = 'block';
        document.getElementById('main-content').style.display = 'block';
        document.getElementById('footer').style.display = 'block';
    }

    // Boot
    try {
        const data = await loadData();
        allGames = data.games || [];
        tagsConfigMap = (data.tags || []).reduce((acc, tag) => {
            const title = (tag && tag.title || '').trim();
            const color = normalizeHex(tag && tag.color);
            if (title) {
                acc[title] = color;
            }
            return acc;
        }, {});

        // Set title
        if (data.title) {
            document.getElementById('hub-title').textContent = data.title;
            document.getElementById('hub-badge').textContent = data.title;
            document.getElementById('footer-text').textContent = data.title.toUpperCase() + ' ◆ GALLERY';
            document.title = data.title;
        }

        buildTagFilters(allGames);
        renderCards(allGames);

        // Filter click
        document.querySelector('.filter-bar').addEventListener('click', e => {
            const btn = e.target.closest('.tag-btn');
            if (btn) setActiveTag(btn.dataset.tag);
        });

        reveal();
    } catch (err) {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error-msg').style.display = 'flex';
    }
})();
