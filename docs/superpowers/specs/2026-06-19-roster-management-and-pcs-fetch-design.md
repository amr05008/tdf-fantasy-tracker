---
date: 2026-06-19
topic: Roster management + PCS fetch unblock for the 2026 draft
status: approved
supersedes: none
related:
  - docs/superpowers/specs/2026-06-18-sunshine-fantasy-tdf2026-redesign-design.md
---

# Roster Management + PCS Fetch Unblock

## Goal

After the offline (text-message) draft for the 2026 Grand Tours, let the league
owner populate participants and their riders effortlessly, support mid-race
injury swaps with historically-accurate scoring, and **trust that the data
pipeline actually reaches procyclingstats (PCS)**.

Three concrete outcomes:

1. **Easy roster entry** — type a rider's name, get the correct PCS slug, no hand-editing of slugs.
2. **Mid-race swaps that keep history honest** — Option B (effective-dated stints).
3. **A working PCS data path** — proven end-to-end against complete TDF 2025 data.

## Background / why this spec exists

- The go-forward UI is the React + Vite SPA in `web/`, currently **placeholder-first**
  (`src/data/sampleData.js`). Real data arrives in a later "backend" session that
  generates `web/public/data.json`. **That React wiring is out of scope here** (see
  Non-Goals).
- Rosters today live in `races_config.py` → `TEAM_ROSTERS[race_id][participant] = [slug, ...]`.
  The TDF 2026 entry is empty placeholders. `api_client.py` still imports the legacy
  single-race roster from `team_config.py` (TDF 2025).
- **Critical finding (2026-06-19):** procyclingstats.com is now behind a Cloudflare
  "managed challenge" (`cf-mitigated: challenge`, the "Just a moment… enable JavaScript"
  interstitial). The `procyclingstats` Python package does plain-HTTP fetches that
  cannot solve a JS challenge, so every call currently returns parse errors
  (`NoneType … css/text`). **`cloudscraper` defeats the challenge** — verified returning
  the real Pogačar rider page, the full TDF 2025 GC (672 result rows), and the TDF 2026
  startlist page. The package's *parsers* are fine; only its *fetch* is broken.
- The **TDF 2026 startlist is not yet populated** (page exists, 0 rider rows as of
  2026-06-19), so rider validation must lean on per-rider pages, not the startlist.
- Last year's roster sheet shows real-world messiness this design must absorb: typos
  ("Florian Lipowitzzz", "Ben O'Conner" vs "Ben Oconnor"), swaps jammed into one cell
  ("Matteo Jorgenson Ben O'Conner"), and **history preserved across swaps** — old riders'
  pre-swap stage times stayed in their cells while the new rider took over from the swap
  stage onward. That preserved-history behavior is exactly Option B.

## Decisions (locked during brainstorming)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Swap model | **Option B** — effective-dated stints | Matches last year's actual sheet behavior; keeps stage-by-stage charts truthful through swaps. Standings are identical to Option A. |
| Roster storage | **`data/rosters.json`** (out of `races_config.py`) | Data separated from code; cleanly editable by CLI and skill; diff-friendly in git. |
| Input UX | **Guided CLI + a `/draft` skill layered on top** | CLI is the deterministic engine (resolve/validate slugs); the skill is a thin natural-language mouth over the same modules. |
| PCS fetch | **`cloudscraper` behind a single seam** | Defeats the Cloudflare challenge today; one swappable module if it ever stops. |
| Rider validation | **Slug-derive + validate per-rider page** (startlist as later enhancement) | The 2026 startlist is empty now; the per-rider page works today. |
| Pipeline proof | **End-to-end against TDF 2025** | Complete, known-good data; proves parsing + scoring math produce real, app-ready standings. |

## Components

### 1. PCS fetch layer — `pcs_fetch.py` (new)

The single seam through which **all** PCS HTTP traffic flows.

- `get_html(path: str) -> str` — fetch `https://www.procyclingstats.com/<path>` via a
  reused `cloudscraper` session, with a polite inter-request delay, a small retry on
  transient failure, and a clear, typed error when the response is still a Cloudflare
  challenge (so callers can say "PCS unreachable" rather than "bad data").
- Detects a challenge page explicitly (e.g. `<title>Just a moment</title>` /
  `_cf_chl_opt`) and raises `PCSBlockedError` rather than returning challenge HTML.
- Parsing: feed the returned HTML into the existing `procyclingstats` parsers where they
  accept injected HTML; otherwise a thin local parser. (Implementation choice deferred to
  the plan; the seam's contract — "give me a path, get back trustworthy HTML or a typed
  error" — is what callers depend on.)

**Dependency:** add `cloudscraper` to `requirements.txt`.

**Why a seam:** Cloudflare challenges evolve. If cloudscraper stops working, we replace
exactly one module (Playwright, a scraping service, cached HTML) without touching any
caller.

### 2. Roster store — `data/rosters.json` + `roster_store.py` (new)

**File shape** (Option B — a participant is a list of rider *stints*):

```json
{
  "tdf-2026": {
    "Aaron": [
      {"slug": "rider/tadej-pogacar", "name": "Tadej Pogačar", "team": "UAE Team Emirates", "from_stage": 1},
      {"slug": "rider/matteo-jorgenson", "name": "Matteo Jorgenson", "team": "Visma–Lease a Bike", "from_stage": 1, "to_stage": 11},
      {"slug": "rider/ben-oconnor", "name": "Ben O'Connor", "team": "Jayco AlUla", "from_stage": 12}
    ]
  }
}
```

- **Active riders at stage N** = stints where `from_stage ≤ N ≤ (to_stage or ∞)`.
- A stint with no `to_stage` is current/open.
- `slug` is authoritative; `name`/`team` are cached at resolution time for display.

**`roster_store.py`** — pure, testable operations, no I/O mixed with logic:

- `load(race_id)` / `save(race_id, roster)`
- `active_riders(roster, stage)` → list of slugs active at a stage
- `add_rider(roster, participant, stint)`
- `swap_rider(roster, participant, out_slug, in_stint, effective_stage)` — closes the
  outgoing stint at `effective_stage - 1`, opens the incoming stint at `effective_stage`
- `remove_participant` / `add_participant`
- `validate(roster, total_stages)` → asserts the invariant: **exactly 3 active riders per
  participant at every stage**, no overlapping duplicate slugs, stage numbers in range.

`races_config.py` keeps race *metadata* (dates, jersey colors, total_stages, status).
`team_config.py` stays as a deprecated shim. `api_client.py` is updated to read the active
roster for a given race + stage from the store (closing the current single-race gap).

### 3. Rider resolver — `resolve_rider()` (new, used by CLI + skill)

`resolve_rider(query: str) -> ResolvedRider | list[Candidate]`

1. Normalize `query` → candidate slug (lowercase, strip accents, spaces→hyphens, drop punctuation).
2. Validate by fetching the rider page via `pcs_fetch.get_html("rider/<slug>")`; a real
   page yields canonical `{slug, name, team}`.
3. On miss/ambiguity, return candidates for the caller to disambiguate (CLI prints a
   numbered list; the skill asks conversationally).
4. **Later enhancement (not required now):** once the 2026 startlist populates, fuzzy-match
   `query` against it for better suggestions. Gated on startlist availability; the
   slug-derive path is the day-one mechanism.

This is what converts "vingegard" → `rider/jonas-vingegaard` and stops "Lipowitzzz" / "O'Conner"
from ever entering the store.

### 4. Guided CLI — `draft.py` (new)

Deterministic; runnable without Claude. Modes:

- **draft** (default): pick race; for each participant, enter a name, then add riders by
  typing names — each is resolved and confirmed before it's stored.
- **swap**: pick participant → outgoing rider → type replacement → prompt effective stage →
  `swap_rider` → re-validate.
- **show**: print current rosters (with active stints highlighted).
- **verify**: re-resolve every slug in the store (delegates to Component 6).

Writes through `roster_store.save`; never edits JSON by hand.

### 5. The `/draft` skill — `.claude/skills/draft/SKILL.md` (new)

A thin natural-language layer over `roster_store.py` + `resolve_rider()`. Teaches the agent to:

- Read the current store and show it.
- Interpret "Nate drafted Pogačar, Vingegaard, Roglič" → resolve each, confirm, save.
- Interpret "Aaron swapped Matteo for Ben O'Connor effective stage 12" → `swap_rider` with
  the right `to_stage`/`from_stage`, validate, show a before/after diff.
- Always run `validate` after a change and surface violations (e.g. "Nate now has 4 active
  riders at stage 12").

Correctness lives in the Python modules; the skill only translates intent and confirms.

### 6. PCS verification / pre-race test — `verify.py` (new)

Three checks, clearly separated so a failure points at the right cause:

1. **Connectivity preflight** — one `pcs_fetch` call; on `PCSBlockedError`, print an
   actionable message ("PCS is challenging this network; run from another network or update
   the fetch layer") and stop.
2. **Roster slug validation** — re-resolve every slug in `tdf-2026` (and any race);
   report any that no longer resolve.
3. **End-to-end pipeline test against TDF 2025** — fetch real GC, compute team standings
   via the scoring path, and print the resulting standings. TDF 2025 is complete and its
   rosters already exist, so this proves parsing + scoring produce **real, app-ready
   output** — the dataset shape a later session will write into `web/public/data.json`.

The 2025 run is the load-bearing proof that "it works with the PCS API."

## Non-Goals (explicitly out of scope)

- Generating `web/public/data.json` and switching `web/src/data/useLeagueData.js` from
  `sampleData` to `fetch` — the planned "backend" session. This spec defines the roster
  store + fetch layer those will consume and stops there.
- Daily GC snapshotting for movement arrows (`move`/`d`).
- Any change to the Streamlit `app.py` UI beyond what's needed to read the new roster store.
- A web/admin UI for roster entry (CLI + skill cover it).

## Data flow

```
text draft  ──►  draft.py / /draft skill  ──►  resolve_rider() ──► pcs_fetch (rider page)
                          │                                              │
                          ▼                                              ▼
                   roster_store.py  ◄── validate ──┐              canonical {slug,name,team}
                          │                         │
                          ▼                         │
                   data/rosters.json               │
                          │                         │
   verify.py ──► pcs_fetch (GC) ──► scoring ──► standings (proves 2025 end-to-end)
```

## Testing strategy

- **Unit (no network):** `roster_store` ops + `validate` (stint math, the 3-active
  invariant, swap edge cases at stage 1 and final stage); resolver slug-normalization
  (accents, punctuation, multi-word names).
- **Integration (network, may hit Cloudflare):** `pcs_fetch.get_html` returns real content
  for a known rider and the 2025 GC; `resolve_rider` resolves a known name; the `verify.py`
  2025 end-to-end produces non-empty standings. Marked so they can be skipped where PCS is
  unreachable.
- Fixture HTML (a saved rider page + GC page) backs parser tests so they don't depend on
  live PCS.

## Risks & mitigations

| Risk | Mitigation |
|------|-----------|
| Cloudflare tightens and cloudscraper stops working | All fetching behind `pcs_fetch`; swap to Playwright/service/cached HTML in one place. Verify's preflight makes the failure obvious. |
| TDF 2026 startlist still empty at draft time | Resolver uses per-rider-page validation, which works today; startlist matching is an optional enhancement. |
| `procyclingstats` parsers reject injected HTML | Fall back to a thin local parser for the GC table; isolated to the parse step. |
| Roster edited to an invalid state (≠3 active) | `validate` runs after every CLI/skill mutation and blocks save. |
| Hand-entered slug typos | Resolver validates against the live rider page before storing. |
