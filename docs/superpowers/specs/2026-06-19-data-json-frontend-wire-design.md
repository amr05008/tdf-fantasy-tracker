---
date: 2026-06-19
topic: Wire the React app to real procyclingstats data (data.json), starting with completed TDF 2025
status: approved
related:
  - docs/superpowers/specs/2026-06-19-roster-management-and-pcs-fetch-design.md
  - docs/superpowers/specs/2026-06-18-sunshine-fantasy-tdf2026-redesign-design.md
---

# Wire the React App to Real PCS Data (TDF 2025 first)

## Goal

Make the deployed React app render **real procyclingstats standings** when a race is
selected — starting with **completed TDF 2025**, which today shows placeholder data because
`useLeagueData` ignores the selected race and always returns `sampleData.js`. Also trim the
app to **Tour de France only** (remove Giro + Vuelta).

Success: selecting "Tour de France 2025" in the deployed app shows the real final standings
(Aaron wins, 228:59:22), real rider GC positions/times, and the real final-stage header.

## Background

- The React SPA (`web/`) reads all data through `web/src/data/useLeagueData.js`, which is
  hardcoded: `return sampleData` (ignores `raceId`). `App.jsx` documents this as Phase 1.
- The PCS data pipeline (`pcs_fetch` → `pcs_parse` → `scoring` → `generator`) exists and is
  live-proven (`verify.py`: TDF 2025 → Aaron 228:59:22) but is **not connected to the frontend**.
- `scoring.format_for_app` produces the `teams` array; the React app needs the rest of the
  `sampleData` shape too (`meta`, `stage`, `movers`, `yourToday`, `draftPool`, `races`).
- **Key discovery:** the GC dict from `Stage.parse()` already includes `nationality`, `age`,
  and `prev_rank` per rider — so `nat`, `age`, and today's GC movement `d` are free; only
  `role` and `form` are not derivable.
- `selectors.js` hardcodes assumptions that break on real data: `"of 6 overall"` (the 2025
  league has 5 players) and `r.form.map(...)` (crashes if `form` is omitted).
- TDF 2025 is **complete**, which removes the hardest live machinery (daily GC snapshots for
  ongoing deltas, latest-stage detection). "Today's" movement for a completed race is the
  final stage's movement, derivable from `prev_rank` and a single prior-stage standings diff.

## Decisions (locked in brainstorming)

| Decision | Choice |
|----------|--------|
| Data delivery | **One committed `web/public/data/<raceId>.json` per race**, a drop-in for `sampleData`. |
| `useLeagueData` | Async `fetch('/data/${raceId}.json')`, fall back to bundled `sampleData` on 404/error. |
| Rider detail depth | Primary screens fully real. `nat`/`age`/`d` real (free from GC); `role` stubbed, `form` omitted. |
| Races shown | **TDF only** — remove `giro-2026` and `vuelta-2026` from config, selector, and generated `races`. |
| Draft screen | **Vestigial** — drafting is offline (text); `draftPool` gets the race's drafted riders, no real draft logic. |
| Scope | **Completed-race path (2025) only.** Live 2026 path (latest-stage detection, daily snapshots, refresh cron) deferred until the race starts. |

## Field mapping (TDF 2025)

| `sampleData` field | Source | Status |
|---|---|---|
| `teams[].{name,rank,total,gap,leader,last}` | `scoring.compute_standings` | real |
| `teams[].move` + `movers` | extra prev-stage (st20) GC fetch → diff team ranks | real |
| `riders[].{name,gc,time,proTeam}` | GC dict via `format_for_app` | real |
| `riders[].gapGC` | computed: rider time − leader time | real |
| `riders[].nat` | GC `nationality` code → `nations.py` map (fallback to code) | real |
| `riders[].age` | GC `age` | real |
| `riders[].d` | GC `prev_rank − rank` (positive = moved up) | real |
| `riders[].role` | not in GC | **stub** (e.g. `"Rider"`) |
| `riders[].form` | not in GC (needs per-rider stage history) | **omit** |
| `stage.{stageNum,date,route,type,km,winner,winnerTeam,winnerTime}` | stage page `Stage.parse()` (departure/arrival/distance/results) | real |
| `meta.{raceId,name,totalStages}` | `races_config` | real |
| `meta.stageNum` | target stage (21 for completed 2025) | real |
| `meta.progressPct` | `stageNum/totalStages` → `"100%"` | real |
| `meta.updated` | generation timestamp (passed in, not `Date.now()` in pipeline) | real |
| `meta.recap` | generated one-liner (e.g. `"Final standings — <leader> wins"`) | derived |
| `yourToday` | Aaron's riders from GC: `place=#gc`, `gap=gapGC`, `note` from `d` | real-ish |
| `draftPool` | the race's drafted riders (names/teams), for the vestigial Draft screen | minimal |
| `races` | TDF-only list from `races_config` with status/dot/note | real |

## Components

### `scripts/generate_data.py` (new)
CLI: `python scripts/generate_data.py <raceId> [--stage N]`. Orchestrates:
1. Resolve roster: `roster_store.load(raceId)` if present (effective-dated → `active_riders` at stage); else static `races_config.TEAM_ROSTERS[raceId]` (flat). 2025 uses the static path.
2. Stage = `--stage` or, for a completed race, `total_stages`.
3. Fetch target-stage GC + prev-stage GC (for `move`/`movers`) via `pcs_parse.fetch_stage_gc`.
4. `scoring.compute_standings` for both stages; `format_for_app`; diff team ranks for `move`.
5. Enrich each rider: `gapGC` (computed), `nat` (mapped), `age`, `d` (`prev_rank−rank`), `role` stub.
6. Stage header via a stage-details parse.
7. Assemble `meta`, `movers`, `yourToday`, `draftPool`, `races` (TDF-only).
8. Write `web/public/data/<raceId>.json` (pretty-printed, `ensure_ascii=False`).

Reuses the `pcs_fetch` seam — no direct network. Streamlit-free.

### `nations.py` (new)
`code_to_name(code: str) -> str` — small ISO-3166-alpha-2 → country-name map covering cycling
nations; returns the code unchanged if unmapped.

### `pcs_parse.py` (extend)
Add `parse_stage_details(html) -> dict` returning `{date, departure, arrival, distance, winner_name, winner_team, winner_time}` for the stage header (from `Stage.parse()` top-level fields + `results[0]`). Existing functions unchanged.

### `web/src/data/useLeagueData.js` (rewrite)
Async: bootstrap with `sampleData`, `useEffect` fetch `/data/${raceId}.json` on `raceId` change, `setData` on success, fall back to `sampleData` on non-OK/throw. Returns the current data object (always a valid shape, never null).

### `web/src/lib/selectors.js` (edit)
- `buildTeamView`: `"of 6 overall"` → `"of " + teams.length + " overall"`; `"· 3 riders"` → derive from `sel.riders.length`.
- `buildRiderProfile`: guard `form` — `(r.form || []).map(...)`; tolerate a stubbed/short `role`.
- Leave the Draft screen's hardcoded lock note (vestigial).

### `races_config.py` (edit)
Remove `giro-2026` and `vuelta-2026` from `RACES` and `TEAM_ROSTERS`. Keep `tdf-2025`, `tdf-2026`. (The Streamlit app and selector lists follow automatically.)

### `web/public/data/tdf-2025.json` (new, committed)
The generated artifact, committed so Vercel serves it statically.

## Data flow
```
generate_data.py tdf-2025 ─► pcs_fetch (seam) ─► pcs_parse ─► scoring ─► enrich
                                                                           │
                                          web/public/data/tdf-2025.json ◄──┘  (committed)
                                                     │
              Vercel static host ─► useLeagueData fetch ─► selectors ─► screens (real data)
```

## Testing

- **Python (offline, fixtures):** `generate_data.py` produces the full shape against the
  committed `tests/fixtures/*.html` — assert real teams, stage header, `nat`/`age`/`d`/`gapGC`
  populated, `move` from the prev-stage diff, TDF-only `races`. `nations.code_to_name` mapping
  + fallback. `parse_stage_details` against the stage-21 fixture.
- **React (Vitest):** `useLeagueData` returns fetched data on success and `sampleData` on
  fetch failure (mock `fetch`); `selectors` use `teams.length` (not 6) and don't crash on a
  rider with no `form`. Update the existing suite.
- **End-to-end (manual, live):** run the generator for 2025, `npm run dev`, select TDF 2025,
  confirm real standings + stage header render; confirm 2026 still shows placeholder.

## Non-Goals
- Live-race generation for 2026 (latest-stage detection, daily snapshots, refresh cron) — deferred until 2026 starts; the generator is structured so 2026 plugs in.
- Real in-app drafting (offline over text).
- `role`/`form` real values.
- Streamlit `app.py` UI changes beyond what removing two races from config implies.

## Risks & mitigations
| Risk | Mitigation |
|---|---|
| PCS unreachable when generating (Cloudflare) | Generation is one-off via the `pcs_fetch` seam; run from a residential network. The artifact is committed, so the app never fetches PCS at runtime. |
| `useLeagueData` async flash (old race shown briefly) | Acceptable for a friends' app; `sampleData` bootstrap keeps a valid shape, no crash. |
| `prev_rank` semantics off (movement sign/base) | Verify against the stage-21 fixture; `d = prev_rank − rank`, positive = up. |
| Stage-details fields vary by stage type | `parse_stage_details` tolerates missing fields (defaults), tested on the real fixture. |
| Removing races breaks Streamlit `app.py` | `races_config` helpers already iterate `RACES`; fewer entries is safe. |
