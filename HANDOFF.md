# Ajna Projects – Handoff

## Repo location
- `/media/lenovo-v3/support/ajna-projects`
- Remote: `git@github.com:t0683323-dot/ajna-projects.git`

## Current state
- Commit pushed: `Add OGame-style strategy dashboard` (hash `621018f`).
- UI: OGame-like single-canvas dashboard with resources, build queue, advisor, and Strategy Track panel.
- Strategy Track now uses generalized KPI tracks (Growth, Product, Ops, Revenue) and `T` cycles.
- Playwright test last run via file:// with screenshots/state in `/media/lenovo-v3/support/ajna-playwright-output`.

## Key files
- `index.html`, `styles.css`, `game.js`
- `README.md` (run instructions)
- `progress.md` (history)
- `ajna_actions.json` (Playwright actions)

## Testing (Playwright)
- Browsers installed in: `/media/lenovo-v3/support/ajna-playwright-browsers`
- Temp dir: `/media/lenovo-v3/support/tmp`
- Run:
  ```bash
  cd /media/lenovo-v3/support/ajna-projects
  TMPDIR=/media/lenovo-v3/support/tmp \
  PLAYWRIGHT_BROWSERS_PATH=/media/lenovo-v3/support/ajna-playwright-browsers \
  node web_game_playwright_client.mjs \
    --url file:///media/lenovo-v3/support/ajna-projects/index.html \
    --actions-file /media/lenovo-v3/support/ajna-projects/ajna_actions.json \
    --click-selector "#game" \
    --iterations 1 \
    --pause-ms 200 \
    --screenshot-dir /media/lenovo-v3/support/ajna-playwright-output
  ```

## Cloudflare deploy (blocked)
- Wrangler v4 requires Node 20+, so we used `npx wrangler@3`.
- OAuth login failed due to localhost callback (remote user).
- Token-based deploy failed with Cloudflare API code 10001 (auth/memberships).
- Need a new `CLOUDFLARE_API_TOKEN` with:
  - Account → Memberships → Read
  - Account → Pages → Edit
  - Account → Account Settings → Read
- Once you have the token:
  ```bash
  CLOUDFLARE_API_TOKEN=... npx wrangler@3 pages deploy . --project-name ajna-command-grid
  ```

## Git status
- Working tree clean after commit.
- `.gitignore` present (node_modules excluded).

## Notes
- Do not commit `node_modules/`.
- `render_game_to_text` and `advanceTime` hooks are present.
