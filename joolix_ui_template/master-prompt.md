**[STRICT ENFORCEMENT MODE: ON]**
**Role:** Senior UI Engineer & Visual Identity Guardian for "Emerald Elite" Systems.
**Framework:** Tailwind CSS (CDN), Lucide Icons, AOS Animation, Chart.js.

**Mandatory Visual Identity (Zero Deviations Allowed):**
1. **Atmosphere:** High-tech hardware terminal, Dark, Metallic, Quantum-Luxury.
2. **Global Background:** MUST use `radial-gradient(circle at top right, #064e3b 0%, #01110d 100%)` fixed. Never use plain black or standard grays.
3. **Materials (Glassmorphism):** All containers must use `background: rgba(2, 44, 34, 0.7)`, `backdrop-blur-xl`, and `border: 1px solid rgba(16, 185, 129, 0.15)`. 
4. **The Accent Color:** Emerald Green (#10b981). Use it for glow effects, high-end borders, and active status indicators.
5. **Interactive Elements:**
   - **Buttons:** MUST have the `shiny-metal` class: `linear-gradient(135deg, #064e3b 0%, #10b981 50%, #064e3b 100%)`. Hover effect: `background-position: right`.
   - **Inputs:** Dark background `bg-black/50`, emerald focus borders, and zero default browser styling.
6. **Typography:** - Headers: `Cinzel` (Serif, Bold, Letter-spacing: 4px).
   - Body/Data: `Montserrat` (Sans, Tracking-tight).
7. **Responsiveness & Toast Safety:** - Toasts MUST be centered at the bottom on mobile (width: 90vw) and top-right on desktop.
   - Layout must use a 12-column grid with `gap-6`.

**Forbidden Actions:**
- NO use of standard Tailwind colors like `bg-gray-800`, `bg-blue-600`, or `text-slate-200`.
- NO sharp corners (all border-radius must be at least `2xl` or `3rem`).
- NO standard box-shadows (only use emerald/cyan glows).

**Final Check:** If the UI looks like a typical SaaS dashboard or a standard web app, you have failed the protocol. It must feel like an elite, proprietary encryption terminal.

**Task:** Now, develop the following feature strictly inside this design jail:

...

# JOOLIX Gamehub

A lightweight hub that aggregates games from `gamehub.json` and renders them in the web UI.

## Directory Structure Pattern

Use the following structure when adding new games and shared assets:

```text
joolix-gamehub/
├── index.html
├── gamehub.json
├── README.md
└── games/
    └── <game-slug>/
        ├── index.html                # Game entry file
        ├── assets/
        │   ├── images/
        │   │   ├── cover.png         # Main card/lightbox image
        │   │   └── screenshot-*.png  # Optional additional shots
        │   ├── audio/                # Optional music/sfx
        │   └── data/                 # Optional local game data
        ├── src/                      # Optional source files
        └── docs/                     # Optional design/dev notes
```

### Naming Conventions

- Use `kebab-case` for directory names and slugs (example: `neon-runner`).
- Keep media paths relative to repo root in `gamehub.json` (example: `./games/neon-runner/assets/images/cover.png`).
- Keep one game per folder under `games/`.

### Asset Addressing Convention (Per Game)

- Document root is `/gamehub`.
- Each game's `index.html` should reference local assets relative to that game folder.
- Keep CSS, JS, and image references inside the game with `./assets/...` paths.

Example for `games/neon-runner/index.html`:

```html
<!-- CSS -->
<link rel="stylesheet" href="./assets/css/style.css" />

<!-- JS / scripts -->
<script src="./assets/scripts/game.js"></script>

<!-- Images -->
<img src="./assets/images/joolix_runner_npc.webp" alt="Runner NPC" />
```

Recommended per-game asset layout:

```text
games/<game-slug>/
├── index.html
└── assets/
    ├── css/
    │   └── style.css
    ├── scripts/
    │   └── game.js
    └── images/
        └── <image-files>
```

## `gamehub.json` Structure Pattern

`gamehub.json` is the single source of truth for game metadata.

### Root Object

```json
{
  "title": "JOOLIX Gamehub",
  "games": []
}
```

### Game Object Schema

```json
{
  "id": "<uuid>",
  "title": "<display-title>",
  "slug": "<kebab-case-slug>",
  "descriptions": "<short game description>",
  "motivation": "<marketing hook / one-liner>",
  "image": "<relative-path-or-url>",
  "order": 1,
  "tags": ["<tag-1>", "<tag-2>"],
  "created_at": 1771657299000,
  "updated_at": 1771657299000
}
```

### Field Rules

- `id`: UUID string, unique per game.
- `title`: Human-readable game title.
- `slug`: Unique `kebab-case` key that should match folder name in `games/<slug>/`.
- `descriptions`: Short paragraph used in listing/detail views.
- `motivation`: Secondary long Markdown format text used for showing what this games pros for MindMap of players .
- `image`: Prefer local relative path (`./games/...`) for versioned assets; external URL is allowed.
- `order`: Integer used to sort display order (ascending).
- `tags`: Array of category labels.
- `created_at` / `updated_at`: Unix timestamp in milliseconds.

## Add a New Game (Suggested Workflow)

1. Create a new folder: `games/<new-slug>/assets/images/`.
2. Add at least one cover image.
3. Add a new game object to `gamehub.json` with a new UUID and unique `order`.
4. Keep `slug` and folder name identical.
5. Update `updated_at` when editing existing entries.
