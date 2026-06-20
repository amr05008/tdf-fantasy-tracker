---
date: 2026-06-19
topic: Replace fake placeholder data for not-yet-started races with an "Upcoming" call-out
status: approved
related:
  - docs/superpowers/specs/2026-06-19-data-json-frontend-wire-design.md
---

# Upcoming-Race Call-Out

## Goal

When a not-yet-started race (today: TDF 2026) is selected, show an honest **"Upcoming"**
notice instead of the fake placeholder standings the app currently falls back to. Make the
completed **TDF 2025** the default race on first load, so the app opens on real data.

## Background

- `useLeagueData(raceId)` fetches `/data/<raceId>.json` and, on a 404, falls back to the
  bundled `sampleData` — which is fake 2026 standings. Selecting TDF 2026 therefore shows
  invented numbers.
- `App.jsx` renders Standings/Stage/Team/Races off whatever `useLeagueData` returns; it has
  no notion of an "upcoming" race.
- `initialRace()` defaults to `tdf-2026`, which has no real data yet.
- `BrandBar` is static (no data deps). The race name + stage progress live in `Standings.jsx`
  via `meta.*`, so they are simply not rendered for an upcoming race.
- `sampleData.races` marks `tdf-2026` as `Live` / `"Stage 11 / 21"` (stale — the race hasn't
  started).
- The committed `tdf-2025.json` `races` list shows ISO dates (`2026-07-04 – 2026-07-26`) in the
  selector because `generate_data.build_races_list` does not format them.

## Decisions (locked in brainstorming)

| Decision | Choice |
|----------|--------|
| Upcoming detection | **Status-driven** — from the bundled `sampleData.races` manifest (`status === 'Upcoming'`), not fetch-failure. A real race that fails to load never reads as "upcoming." |
| Default race | **`tdf-2025`** (real, completed data) on first load; `?race=` still overrides. |
| Upcoming layout | Keep `BrandBar` + tab nav. Standings/Stage/Team tabs render the notice; the **Races** tab still shows the selector. |
| Scope | No live-2026 data machinery. Just the upcoming state + the default + two small fixes below. |

## Components

### `web/src/data/useLeagueData.js` (edit)
- Add `upcomingData(raceId)` → `{ upcoming: true, meta: { raceId, name }, races: sampleData.races }`,
  where `name` is looked up from `sampleData.races` (fallback to the id).
- Add a helper to read a race's status from the bundled manifest:
  `isUpcoming(raceId)` → `true` when `sampleData.races.find(id).status === 'Upcoming'`.
- `viewFor(raceId)` → `upcomingData(raceId)` if `isUpcoming`, else `sampleData` (bootstrap).
- Hook: `useState(() => viewFor(raceId))`; effect on `[raceId]` sets `viewFor(raceId)`, then:
  if upcoming → return (no fetch); if `import.meta.env.MODE === 'test'` → return; else
  `fetchRaceData(raceId).then(setData)` guarded by an `alive` flag.
- `fetchRaceData` unchanged (real-race fetch with `sampleData` safety fallback on error).

### `web/src/screens/Upcoming.jsx` (new)
Presentational. Props: `race` (a `sampleData.races`-shaped object: `{name, dates, note, ...}`).
Renders the race name, an "Upcoming" badge, the start info (`note`/`dates`), and a line:
"Standings will appear once the race begins." Styled consistent with the app card.

### `web/src/App.jsx` (edit)
- `initialRace()` default → `'tdf-2025'`.
- Import `Upcoming`. In `renderMain`: when `data.upcoming` and `screen !== 'races'`, render
  `<Upcoming race={data.races.find(r => r.id === data.meta.raceId)} />`; the `races` tab still
  renders `<Races/>`; otherwise the existing screen switch. Accent still derives from
  `data.meta.raceId` (present on the upcoming object).

### `web/src/data/sampleData.js` (edit)
`races` → `tdf-2026`: `status: 'Upcoming'`, `note: 'Starts Jul 4'` (this status now drives detection).

### `scripts/generate_data.py` (edit) + regenerate `web/public/data/tdf-2025.json`
`build_races_list` formats `start_date`/`end_date` (ISO `YYYY-MM-DD`) into a friendly range
(`Jul 5 – 27, 2025`, `Jul 4 – 26, 2026`) via a small `_format_date_range(start, end)` helper.
Regenerate the committed `tdf-2025.json`.

## Data flow
```
select race ─► useLeagueData
                 │ isUpcoming(raceId)?
                 ├─ yes ─► upcomingData (no fetch) ─► App renders <Upcoming/>
                 └─ no  ─► fetch /data/<id>.json ─► real screens (or sampleData on error)
```

## Testing
- `useLeagueData`: selecting an `Upcoming`-status race returns `{upcoming: true}` and does NOT
  call `fetch` (mock `fetch`, assert not called); a non-upcoming race still calls `fetchRaceData`.
- `App`: render `<App/>`, go to Races, click "Tour de France 2026" → the upcoming notice text is
  visible; the Stage/Team tabs also show it; clicking back to "Tour de France 2025" leaves the
  notice. (Works in test mode because upcoming is resolved before the test-mode fetch skip.)
- `Upcoming.jsx`: renders the race name + "Upcoming" + the start info.
- Python: `_format_date_range("2026-07-04", "2026-07-26") == "Jul 4 – 26, 2026"` and the
  cross-month / cross-year cases.

## Non-Goals
- Generating real 2026 data (deferred until the race starts).
- Any per-screen empty-state beyond the single upcoming notice.
- Changing the `sampleData` placeholder used as the real-race fetch bootstrap/safety fallback.

## Risks & mitigations
| Risk | Mitigation |
|------|-----------|
| Real race briefly flagged upcoming on a transient fetch error | Detection is status-driven, independent of fetch; only genuinely `Upcoming`-status races show the notice. |
| Default-race change breaks `App.test` brand assertion | In test mode the hook still returns `sampleData` for a real race, so existing assertions hold; new test covers the upcoming path. |
| `data.meta.raceId` missing on the upcoming object | `upcomingData` always sets `meta.raceId`, so accent + the `races.find` lookup stay valid. |
