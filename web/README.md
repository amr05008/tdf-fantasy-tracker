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

**Phase 2 (live procyclingstats):** add `scripts/generate_data.py` that calls the
repo-root `generator.generate_standings(race_id, stage)` (the `pcs_fetch`→`pcs_parse`→`scoring`
pipeline, reading rosters from `roster_store`/`data/rosters.json`) to write
`web/public/data.json`, then change `useLeagueData` to `fetch('/data.json')`. **Do not
use `api_client.py`'s fetch — procyclingstats is behind a Cloudflare challenge; only the
`pcs_fetch` seam (cloudscraper) gets through, so run the generator from a residential
network.** The JSON shape is documented in `docs/superpowers/specs/2026-06-18-sunshine-fantasy-tdf2026-redesign-design.md`
(§7); the backend layer is in `docs/superpowers/specs/2026-06-19-roster-management-and-pcs-fetch-design.md`.
Movement deltas (`move`/`d`) require persisting a daily GC snapshot to diff.

## Deploy (when ready)
Static host. On Vercel: set **Root Directory** = `web`, framework **Vite**,
build `npm run build`, output `dist`. Push to deploy. Schedule the phase-2 data
refresh via a GitHub Action cron during the race.
