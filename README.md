# Fantasy Tour Tracker

A mobile-first **React + Vite** web app for tracking a fantasy Tour de France league, with standings scored from real procyclingstats.com data.

🌐 **Live:** [tdf-fantasy-tracker.vercel.app](https://tdf-fantasy-tracker.vercel.app) (deployed on Vercel)

The app defaults to the completed **Tour de France 2025** standings (generated from procyclingstats) and shows an **"Upcoming"** notice for a race that hasn't started yet (e.g. **TDF 2026**). It is **Tour de France only**.

> **Legacy:** the original Streamlit app (`app.py` and friends at the repo root) is unchanged and still deployable, but the React SPA in [`web/`](web/) is the go-forward UI. See [Legacy Streamlit app](#legacy-streamlit-app) below.

## How it works

- The draft happens **offline** (over text) — each participant picks 3 professional riders. The app only *tracks* results.
- **Team score = the sum of each team's riders' cumulative GC times.** Lower total time = better, just like real cycling. DNF/DNS riders are flagged.
- Roster + race data are fetched from **procyclingstats.com** through a Python pipeline and published as static JSON the React app reads.

## Features

- **Tour de France focus** — 2025 complete, 2026 upcoming
- **Real standings** — scored from procyclingstats GC data
- **Yellow Jersey styling** for the leader
- **Six screens** — Standings, Stage, Team, Races, plus Draft & Rider Profile sub-screens
- **Shareable URLs** — direct links to a race (e.g. `?race=tdf-2025`)
- **Per-stage analysis** and team roster cards
- **Mobile-optimized**, responsive layout
- **Upcoming-race notice** instead of placeholder data before a race starts

## Local Development

### React app (`web/`) — the go-forward UI

Prerequisites: Node.js + npm.

```bash
cd web
npm install
npm run dev      # http://localhost:5173
```

```bash
npm test         # unit + component (Vitest)
npm run e2e      # end-to-end walkthrough (Playwright)
npm run build    # static output in web/dist/
```

All screens read data through `web/src/data/useLeagueData.js`, which fetches `web/public/data/<raceId>.json` (the committed `tdf-2025.json` is real data) and falls back to the bundled `sampleData.js`. See [web/README.md](web/README.md) for the data flow.

### Python backend (roster + PCS data layer)

A Streamlit-free pipeline that enters the draft and fetches/scores procyclingstats data, then generates the `data.json` the React app consumes.

```bash
python -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
pytest                    # 29 tests, offline via committed HTML fixtures
python verify.py          # live end-to-end proof (run from a residential network)
```

> **Cloudflare:** procyclingstats.com is behind a managed challenge. All PCS fetches go through the `pcs_fetch` seam (cloudscraper) — **not** `api_client.py`'s plain fetch — and must run from a **residential network** (datacenter IPs are challenged hardest).

See [CLAUDE.md](CLAUDE.md) (the "Roster Management + PCS Data Layer" section) for full backend details.

## Supported Races

Tour de France only:
- **Tour de France 2025** ✅ Complete — Winner: Aaron
- **Tour de France 2026** — Upcoming (starts Jul 4, 2026)

Participants: Aaron, Jeremy, Leo, Charles, Nate.

## Managing Your League

The draft happens offline (over text message); the app only *tracks* results. To enter or edit them:

- **Enter / edit rosters** — `python draft.py draft` (add participants + their 3 riders), `python draft.py swap` (mid-race injury swap; history-preserving), `python draft.py show`. Each rider name is resolved to the correct procyclingstats rider and validated before saving. You can also describe changes in natural language to Claude Code via the **`/draft` skill** — e.g. *"Nate swapped Roglič for Almeida effective stage 12"*, *"add a new team for Sarah: Pogačar, Vingegaard, Evenepoel"*, or *"remove Dave's team"*. Rosters live in `data/rosters.json` (don't hand-edit — go through the tooling, which enforces exactly 3 active riders per team per stage).
- **Publish to the live app** — `python scripts/generate_data.py <race-id>` writes `web/public/data/<race-id>.json` from real procyclingstats data; commit and push to deploy (Vercel redeploys). Run it **from a residential network** — procyclingstats is behind a Cloudflare challenge that datacenter IPs hit hardest.

## Technology Stack

- **Frontend**: React + Vite (SPA), plain JSX with inline styles + CSS custom properties for per-race theming
- **Tests**: Vitest (unit/component) + Playwright (e2e)
- **Backend / data**: Python pipeline (`pcs_fetch` → `pcs_parse` → `scoring` → `generate_data.py`) over the `procyclingstats` package, cloudscraper for Cloudflare
- **Data Source**: procyclingstats.com, published as static JSON
- **Hosting**: Vercel (Root Directory = `web`)

## Deployment

The React app is deployed on **Vercel** with automatic deploys from GitHub (`amr05008/tdf-fantasy-tracker`):

1. Vercel project's **Root Directory** is set to `web` (framework: Vite, build: `npm run build`, output: `dist`)
2. Push to `main`
3. Vercel redeploys in ~1–2 minutes

To update standings during a live race, regenerate the race's `web/public/data/<raceId>.json` (see "Managing Your League") and commit — Vercel redeploys with the new data. A refresh cron for the live-2026 path is still deferred.

## Legacy Streamlit app

The original Streamlit app remains at the repo root and is still runnable:

```bash
pip install -r requirements.txt
streamlit run app.py --server.port 5000   # http://localhost:5000
```

Race metadata lives in `races_config.py`; `app.py` is the UI and `api_client.py` the data layer. New work targets the React app, not this one.

## Project Documentation

- [CLAUDE.md](CLAUDE.md) — project overview and architecture (React app, backend, and roster/PCS data layer)
- [web/README.md](web/README.md) — React app and the live data flow
- [races_config.py](races_config.py) — race configuration

## License

MIT License
