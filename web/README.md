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

## Data
All screens read data through `src/data/useLeagueData.js`. It fetches
`/data/<raceId>.json` per race, falling back to the bundled `src/data/sampleData.js`
on error. **`public/data/tdf-2025.json` is committed** (real, completed race) and the
app defaults to it. A race whose `status` is `Upcoming` in the bundled `races` manifest
(e.g. TDF 2026) renders the `Upcoming` notice instead of fetching.

**Regenerate / add a race:** run `python scripts/generate_data.py <raceId>` from the repo
root — it calls `generator.generate_standings` (the `pcs_fetch`→`pcs_parse`→`scoring`
pipeline, rosters from `roster_store`/`data/rosters.json`) and writes the full data file.
**Run it from a residential network — procyclingstats is behind a Cloudflare challenge; only
the `pcs_fetch` seam (cloudscraper) gets through (never `api_client.py`'s fetch).** Specs:
`docs/superpowers/specs/2026-06-19-data-json-frontend-wire-design.md` and the backend layer
`2026-06-19-roster-management-and-pcs-fetch-design.md`.

**Still deferred (live 2026):** latest-stage detection, daily GC snapshots for movement
deltas (`move`/`d`), and a refresh cron during the race.

## Deploy
Static host. On Vercel: set **Root Directory** = `web`, framework **Vite**,
build `npm run build`, output `dist`. Push to deploy. During a live race, regenerate the
race's `public/data/<raceId>.json` and commit (a GitHub Action cron can automate this once
the live-2026 path lands).
