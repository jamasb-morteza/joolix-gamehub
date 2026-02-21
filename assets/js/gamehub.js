(async () => {
    const TAG_COLORS = ['ctag-0', 'ctag-1', 'ctag-2', 'ctag-3'];
    let allGames = [];
    let activeTag = 'all';
    let tagColorMap = {};
    let tagColorIndex = 0;

    function getTagColor(tag) {
        if (!tagColorMap[tag]) {
            tagColorMap[tag] = TAG_COLORS[tagColorIndex % TAG_COLORS.length];
            tagColorIndex++;
        }
        return tagColorMap[tag];
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

            const tags = (game.tags || []).map(tag =>
                `<span class="ctag ${getTagColor(tag)}" data-tag="${tag}">${tag}</span>`
            ).join('');

            const imgSrc = game.image || `https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80`;

            card.innerHTML = `
          <div class="card-thumb-wrap">
            <img class="card-thumb" src="${imgSrc}" alt="${game.title}" loading="lazy"
              onerror="this.src='https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80'" />
            <a href="./games/${slug}">
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