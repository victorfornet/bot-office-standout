# Standout - Bot office

A live 3D office dashboard showing your bots' status in real time, reading directly from [ntfy.sh](https://ntfy.sh).

## Quick start

Open the page with your ntfy topic in the URL hash:

```
https://victorfornet.github.io/bot-office-standout/office/#YOUR_TOPIC
```

Replace `YOUR_TOPIC` with the ntfy.sh topic your bots post to.

To use a self-hosted ntfy server instead:

```
https://victorfornet.github.io/bot-office-standout/office/#YOUR_TOPIC@your-ntfy-server.com
```

## GitHub Pages setup

1. Go to **Settings > Pages** in this repository.
2. Under **Source**, select **Deploy from a branch**.
3. Set the branch to **main** and the folder to **/ (root)**.
4. Save.

The site will be live at `https://victorfornet.github.io/bot-office-standout/`.
The office itself is at `https://victorfornet.github.io/bot-office-standout/office/#<topic>`.

## Feed format

The page reads JSON lines from ntfy.sh. Each message is one JSON object:

| Line | Purpose |
|------|---------|
| `{"bot":"…","status":"working\|idle\|waiting_user\|error\|done","step":"…"}` | Bot status change |
| `{"roster":["Bot A","Bot B"]}` | Declare all bots (appear idle until they post) |
| `{"looks":{"Bot A":{"shape":"sphere","color":"#RRGGBB","accessory":"none"}}}` | Bot avatar appearance |
| `{"groups":{"Bot A":"Content"}}` | Assign bots to teams (one floor each) |
| `{"chat":{"Bot A":"https://…"}}` | Link each bot's chat for "Open chat" |
| `{"routines":{"bot":"Bot A","items":[{"name":"…","schedule":"…","next_run":"ISO"}]}}` | Bot routines |
| `{"type":"usage","total_used_pct":37,"resets_at":"…","bots":{"Bot A":4.1}}` | Usage meter |

## Design customisation guide

### 1. Colors (easiest)

- **Floor accent palette** (Standout forest/mint/coral/violet): the `ACCENTS` array at the top of `office/scene/floorstyle.js`.
- **Status colors** (working green, waiting amber, error red, etc.): edit the CSS custom properties in `office/styles.css` around line 49 (`--working`, `--waiting`, `--error`, `--stuck`, `--done`, `--idle`).
- **Page background**: the gradient in `office/styles.css` under `body` and `#scene` (the `--bg-0`, `--bg-1`, `--bg-2` variables, around line 64).
- **Card/panel theme**: the graphite surface base colour in `office/ui/ui.css` line 66 (`--base: #232327`). Each status also tints the card — those overrides follow immediately.
- **Sofa/chair colours** (placeholder): in `office/scene/office.js`, the `M` materials object (`sofa`, `armchair`, `salmon`).

### 2. Bot shapes and avatars

- The set of blob shapes is defined in `office/scene/looks.js` (`SHAPES` array) and `office/scene/blobgen.js` (the procedural geometry for each shape).
- Avatar thumbnails live in `assets/blobs/thumbs/` (one PNG per bot id) and `assets/blobs/lib/` (shape+color combos).
- To add a custom avatar for a bot, drop a `<bot-id>.png` into `assets/blobs/thumbs/`.

### 3. Floor layout, building, and Standout decor

- The 3D office model is `assets/office/office.glb`.
- Floor stacking, desk placement and camera framing are in `office/scene/building.js`.
- The floor decoration is in `office/scene/floorstyle.js`: zebra-print rugs, disco balls, ghost chairs in the meeting corner, Standout accent palette.
- Disco ball positions/sizes: in `floorstyle.js` (`addDiscoBalls`) and `office.js` (`discoBalls` array).
- The neon "STANDOUT" wall sign: in `office/scene/office.js`, search for `neonTex`.

### 4. Page title and branding

- HTML title: `office/index.html`, the `<title>` tag.
- The brand pill text in the top-left: `office/ui/ui.js`, search for `bhq-word`.
- The share image caption: `office/share/share.js`, the `caption()` function.
- The logo: Standout orb/mark SVGs in `assets/brand/standout/`. The header and favicon use `orb.svg`.

### 5. Fonts

- The page loads **Inter** (body) and **Nunito** (headings/cards) from Google Fonts.
- To change them, edit the `<link>` tags in `office/index.html` and the `--font` / `--bhq-round` CSS properties in `office/styles.css` and `office/ui/ui.css`.

## External requests

The final page makes requests only to:

| Domain | What | Why |
|--------|------|-----|
| `ntfy.sh` | SSE stream + JSON poll | Bot status feed (or your custom server) |
| `fonts.googleapis.com` / `fonts.gstatic.com` | Font CSS + WOFF2 files | Inter and Nunito typefaces |
| `cdn.jsdelivr.net` | Three.js 0.170.0 | 3D rendering engine |

No analytics, telemetry, visit counters, or other third-party calls.
