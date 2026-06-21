---
date: 2026-06-19
summary: Wired the React app to real procyclingstats data (TDF 2025), trimmed to Tour de France only, and added an Upcoming notice for not-yet-started races
tags: [frontend, data-json, procyclingstats, upcoming, tdf-2025, vercel]
---

## Summary

Connected the placeholder React SPA to real PCS data. Built `scripts/generate_data.py`
to write a full `web/public/data/<raceId>.json` (a drop-in for `sampleData.js`) and switched
`useLeagueData` to fetch it with a `sampleData` fallback. Committed `tdf-2025.json` so the
app renders the real completed 2025 race (Aaron wins, 228:59:22) as the default. Removed
Giro + Vuelta (Tour de France only). Then replaced the fake placeholder shown for a
not-yet-started race with an honest **Upcoming** notice (status-driven, no fetch). Fixed two
real issues found in prod: PCS surname-first names (`Lipowitz Florian` → `Florian Lipowitz`)
and a stale Playwright walkthrough. Deployed to Vercel via `origin/main`.

## Changes

New Python: `nations.py` (ISO code→name), `pcs_parse.parse_stage_details` (stage header),
`scripts/generate_data.py` (`build_race_data` pure + `_format_date_range` + `_format_rider_name`).
New React: `web/src/screens/Upcoming.jsx`. Edits: `useLeagueData.js` (async fetch +
status-driven upcoming detection + `sampleData` fallback), `selectors.js` (de-hardcode "of N",
guard omitted `form`), `App.jsx` (default `tdf-2025` + upcoming render gate), `sampleData.js`
(races → TDF-only, tdf-2026 → Upcoming), `races_config.py` (drop Giro/Vuelta). Artifact:
`web/public/data/tdf-2025.json` (committed). Tests across all of the above; e2e
`flows.spec.js` rewritten against real data (validated with `playwright test`).
Docs: specs/plans under `docs/superpowers/{specs,plans}/2026-06-19-data-json-frontend-wire*`
and `*-upcoming-race-callout*`; updated `CLAUDE.md` + `web/README.md` (data.json wire is now
built, not "Phase 2 future"). Commits `b496c5e`..`67c820e`. Executed via subagent-driven
development (two plans), each with a whole-branch Opus review.

## Decisions

- **GC dict gives `nationality`/`age`/`prev_rank` for free** → `nat`/`age`/`d` are real with
  zero extra fetches; only `role` (stub "Rider") and `form` (omitted) aren't derivable.
- **Reuse the `procyclingstats` package parsers** by injecting cloudscraper HTML (proven).
- **Upcoming is status-driven** (from the bundled `races` manifest), not fetch-failure, so a
  real race that briefly fails to load never reads as "upcoming".
- **Default race = TDF 2025** (real data) so first load feels alive; flip to 2026 when it starts.
- **`useLeagueData` skips fetch in test mode** (`import.meta.env.MODE === 'test'`) to keep
  component tests synchronous; fetch logic is tested directly via `fetchRaceData`.
- **Reorder PCS names** (`Lastname Firstname` → `Firstname Lastname`, last token = given name).

## Notes

Found in prod and fixed this session: surname-first names broke the standings sub-line
(`surname()` took the given name); the e2e walkthrough was stale after the default-race change
(rewritten + validated by driving the live dev server with Playwright, since the data is
committed the dev server runs fully offline).

Still deferred (live 2026, when the race starts): latest-stage auto-detection, daily GC
snapshots for movement deltas (`move`/`d`/`movers` are ~0 for the completed race), a refresh
cron, and the DNF scoring rule. `meta.recap` hardcodes "Final standings — X wins" (correct for
2025, fix when the mid-race path lands). Run `generate_data.py` from a residential network
(Cloudflare).
