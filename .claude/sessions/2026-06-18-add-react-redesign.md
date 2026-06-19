---
date: 2026-06-18
summary: Rebuilt the fantasy app as a React + Vite SPA from the TdF 2026 design handoff; placeholder-first, deployed on Vercel
tags: [react, vite, redesign, frontend, vercel, tdd]
---

## Summary
Recreated the fantasy-cycling app as a standalone **React + Vite single-page app** in `web/`, matching the `design_handoff_tdf2026/` prototype at high fidelity (six screens + two sub-screens). Built via brainstorm → spec → plan → 14 TDD tasks (subagent-driven, reviewed per task + a final whole-branch review), then a `/grill` pass, then merged to `main` and deployed to Vercel. The existing Streamlit app was left untouched. Project renamed to `tdf-fantasy-tracker`.

## Changes
- **`web/`** — new Vite+React app: scaffold, `theme.js`, `lib/format.js`, `lib/selectors.js`, `data/sampleData.js` + `data/useLeagueData.js` (the data seam), shared components, `App.jsx` shell, and 6 screens (Standings, Stage, Team, Races, Draft, RiderProfile). 37 unit tests (Vitest) + 1 Playwright e2e. `web/README.md` documents dev/build/deploy + phase-2 data swap.
- **`docs/superpowers/specs|plans/2026-06-18-...`** — design spec + implementation plan.
- **`CLAUDE.md` / `README.md`** — added pointers to the new `web/` app + phase-2 data plan.
- **Rename** — npm package + GitHub repo → `tdf-fantasy-tracker`; gitignore tidy (untracked `.DS_Store`, added `.vercel`/`.playwright-mcp`/OS cruft); committed `design_handoff_tdf2026/`.
- Commit range: `b9e91b3..84a85f8` (24 commits) on `main` (PR #3 merged at `a8898a3`).

## Decisions
- **React + Vite over staying in Streamlit** — the design is an interactive multi-screen SPA; Streamlit fights it. Keeps the Python procyclingstats layer as a future JSON generator.
- **Placeholder-first** — TdF 2026 hasn't started (no live data, no real picks until ~Jul 4), so build/verify UI on the prototype's sample data behind a single `useLeagueData()` seam; wire real data later.
- **Hosting** — moves off Streamlit Cloud to Vercel (static SPA, root dir `web`). Domain pinned (Cloudflare) until post-testing.
- **Ephemeral draft** (no persistence), `showMovement` fixed-on, div click targets — all matched to the prototype intent for phase 1.

## Notes
- `/grill` caught + fixed: `ordinal()` rendered "41th/33th" (now full English rule); race selection half-swapped the accent theme over Tour data (accent now derives from `data.meta.raceId`); missing OG/social meta (added, absolute URLs for the Vercel domain).
- **Phase 2 (next session):** Python `data.json` generator reusing `api_client.py`, refresh cron during the race, daily GC snapshot for movement arrows, real 2026 rosters. See spec §7 + `web/README.md`.

## Release
- Tagged **`v0.1.0`** (annotated, repo's first tag) at `696763b` and published a GitHub Release from this log: https://github.com/amr05008/tdf-fantasy-tracker/releases/tag/v0.1.0 — "first testable build (React+Vite redesign, placeholder data), deployed on Vercel".
