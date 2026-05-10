# Codex Pet Run

Mario-style side-scrolling game for Codex pets created with `$hatch-pet`.

## Run

```bash
python3 -m http.server 4173
```

Open `http://127.0.0.1:4173/`.

## GitHub Pages

This is a static app. Publish the repository with GitHub Pages using the `main` branch and `/ (root)` source.

After publishing, open the Pages URL and play directly in the browser.

## Features

- Play as generated Codex pets from `assets/pets/*/spritesheet.webp`.
- Import local Codex pets by selecting `~/.codex/pets` in the browser. Imported pets are stored in IndexedDB for that browser.
- Built-in community stages with author names.
- Stage editor with paint tools for ground, blocks, spikes, coins, start, and goal.
- Export and import stage codes for sharing user-created stages.
- Per-stage local leaderboard with clear time and selected pet.

Browsers cannot read `~/.codex/pets` automatically from GitHub Pages. Use the `Import ~/.codex/pets` button and choose the folder manually.

## Controls

- `A` / `D` or arrow keys: move
- `W` / `Space`: jump
- `R`: restart
- On phones and tablets, use the on-screen left, right, jump, and restart buttons.
- In editor mode, `A` / `D` or arrow keys scroll the canvas horizontally.
- In editor mode on touch devices, use the on-screen left and right buttons to scroll the canvas horizontally, and paint directly on the canvas.
