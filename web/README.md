# Sunshine Fantasy (web)

React + Vite recreation of the `design_handoff_tdf2026` prototype.

## Develop
```bash
cd web
npm install
npm run dev      # http://localhost:5173
```

## Test
```bash
npm test         # unit + component (Vitest)
npm run e2e      # end-to-end flow (Playwright)
```

## Build
```bash
npm run build    # outputs web/dist/
npm run preview
```

## Data (phase 1 vs phase 2)
All screens read data through `src/data/useLeagueData.js`. Today it returns
the placeholder `src/data/sampleData.js`.

**Phase 2 (live procyclingstats):** add `scripts/generate_data.py` (reusing the
repo's `api_client.py` + `races_config.py`) to write `web/public/data.json` for
the active race, then change `useLeagueData` to `fetch('/data.json')`. The JSON
shape is documented in `docs/superpowers/specs/2026-06-18-sunshine-fantasy-tdf2026-redesign-design.md`
(§7). Movement deltas (`move`/`d`) require persisting a daily GC snapshot to diff.

## Deploy (when ready)
Static host. On Vercel: set **Root Directory** = `web`, framework **Vite**,
build `npm run build`, output `dist`. Push to deploy. Schedule the phase-2 data
refresh via a GitHub Action cron during the race.
