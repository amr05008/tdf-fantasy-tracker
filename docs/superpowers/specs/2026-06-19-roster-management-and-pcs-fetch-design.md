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
pipeline actually reaches procyclingstats (PCS)** — reliably enough to run
unattended through a three-week race.

Three concrete outcomes:

1. **Easy roster entry** — type a rider's name, get the correct PCS slug, no hand-editing of slugs.
2. **Mid-race swaps that keep history honest** — Option B (effective-dated stints).
3. **A resilient PCS data path** — proven end-to-end against complete TDF 2025 data, with
   a fallback chain so a single Cloudflare hiccup never means "no data."

## Background / why this spec exists

- The go-forward UI is the React + Vite SPA in `web/`, currently **placeholder-first**
  (`src/data/sampleData.js`). Real data arrives in a later "backend" session that
  generates `web/public/data.json`. **That React wiring is out of scope here** (see
  Non-Goals), but this spec is deliberately shaped so that session is a drop-in.
- Rosters today live in `races_config.py` → `TEAM_ROSTERS[race_id][participant] = [slug, ...]`.
  The TDF 2026 entry is empty placeholders. `api_client.py` still imports the legacy
  single-race roster from `team_config.py` (TDF 2025).
- **Critical finding (2026-06-19):** procyclingstats.com is now behind a Cloudflare
  "managed challenge" (`cf-mitigated: challenge`, the "Just a moment… enable JavaScript"
  interstitial). The `procyclingstats` Python package does plain-HTTP fetches that cannot
  solve a JS challenge, so every call currently returns parse errors (`NoneType … css/text`).
- The **TDF 2026 startlist is not yet populated** (page exists, 0 rider rows as of
  2026-06-19), so rider validation must lean on per-rider pages, not the startlist.
- Last year's roster sheet shows the real-world mess this design must absorb: typos
  ("Florian Lipowitzzz", "Ben O'Conner" vs "Ben Oconnor"), swaps jammed into one cell
  ("Matteo Jorgenson Ben O'Conner"), and **history preserved across swaps** — old riders'
  pre-swap stage times stayed in their cells while the new rider took over from the swap
  stage onward. That preserved-history behavior is exactly Option B.

### Data-access options actually tested (2026-06-19)

| Path | Verified result | Verdict |
|------|-----------------|---------|
| **cloudscraper + PCS HTML parsers** | ✅ Defeats the challenge on every endpoint we need: rider pages, full-race GC, per-stage GC (`stage-10-gc`, ~659 KB of real data) | **Primary fetch** |
| **PCS JSON/XHR endpoints** | ❌ None — grepped a stage page: `/api`:0, `.json`:0, `fetch(`:0. PCS is pure server-rendered HTML | No lighter path; HTML scraping it is |
| **Playwright / headless browser** (available locally) | Real browser executes the challenge JS and obtains the clearance cookie — most robust | **Fallback fetch** in the chain |
| **FirstCycling.com** | ❌ Also behind Cloudflare (403 + challenge markers) | No easier than PCS |
| **Official ASO `letour.fr`** | Reachable (302, no CF) but different data model, current-race-only, no 2025 history | Separate integration; not worth it |
| **Community REST APIs** (BD4vid777/Cycling_API, Will-Nollert, …) | Free, but they scrape PCS themselves (inherit the CF problem), uptime unknown, likely abandoned | Too fragile to depend on |
| **Apify / FlareSolverr** | Purpose-built anti-bot, paid/infra | Overkill for a 5-person league |

**Conclusion:** the answer is not a different tool — cloudscraper is the right primary and
Playwright the right fallback — it is a more resilient *architecture* around them.

### Reliability reframe

Stages finish **once a day**; GC is needed ~1–3× a day during the race. We therefore do not
need a bulletproof always-on scraper — only one that succeeds *eventually*. Three cheap
choices turn the central risk from scary to boring: a fetch **fallback chain**, a **raw-HTML
cache**, and **committed `data.json` snapshots** (so a failed fetch means "a few hours stale,"
never "site down"). Cloudflare is **IP-reputation based**: datacenter IPs (Vercel, GitHub
Actions, CI sandboxes) are challenged hardest; a residential IP (the owner's Mac on home wifi)
least. The generator should therefore run from a residential context; CI would likely require
the Playwright fallback.

## Decisions (locked during brainstorming)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Swap model | **Option B** — effective-dated stints | Matches last year's sheet; keeps stage-by-stage charts truthful through swaps. Standings identical to Option A. |
| Roster storage | **`data/rosters.json`** (out of `races_config.py`) | Data separated from code; cleanly editable by CLI and skill; diff-friendly. |
| Input UX | **Guided CLI + a `/draft` skill** layered on top | CLI is the deterministic engine; the skill is a thin natural-language mouth over the same modules. |
| PCS fetch | **Fallback chain behind one seam:** cache → cloudscraper → Playwright → typed error | cloudscraper works today; the chain means a single failure never blocks data; the seam means a future swap touches one module. |
| Raw-HTML cache | **Cache every fetched page** by `(race, stage)` | Politeness/rate-limit, offline parser tests against real fixtures, audit trail, survives mid-race HTML changes. |
| Parsing | **Spike first: own parsers vs. reuse package** | The package's *fetch* is the broken part; we only want its parsers. Decide via spike, not assumption. |
| Rider validation | **Slug-derive + validate per-rider page** (startlist as later enhancement) | The 2026 startlist is empty now; the per-rider page works today. |
| Pipeline proof | **End-to-end against TDF 2025, built first** | Complete, known-good data; de-risks the riskiest part before any UX is built on it. |
| Output contract | **Golden test vs. `sampleData.js` shape** | Makes the future React wiring a drop-in, not a reshape. |

## Components

### 1. PCS fetch layer — `pcs_fetch.py` (new)

The single seam through which **all** PCS HTTP traffic flows. `get_html(path)` runs a
**fallback chain**:

1. **Fresh cache** — if a cached copy of this path is younger than a configurable TTL, return it.
2. **cloudscraper** — reused session, polite inter-request delay, small retry on transient failure.
3. **Playwright** — headless browser that executes the challenge JS and obtains the clearance
   cookie; used only when cloudscraper returns a challenge page.
4. **Typed `PCSBlockedError`** — if all of the above fail, raise so callers can say "PCS
   unreachable" rather than silently returning challenge HTML.

- **Challenge detection** is explicit (`<title>Just a moment</title>` / `_cf_chl_opt`); a
  challenge page is never treated as data.
- **Raw-HTML cache:** every successful fetch is written to a cache dir keyed by path (and,
  for stage data, by `(race, stage)`), so re-runs and parser tests don't re-hit PCS.
- **Politeness:** rate-limited, identifiable, cache-first — PCS is a free community site.

**Dependencies:** add `cloudscraper` to `requirements.txt`; Playwright is an optional/fallback
dependency (document install). The seam's contract — "give me a path, get back trustworthy
HTML or a typed error" — is all any caller depends on.

### 2. Parsing — `pcs_parse.py` (new) — preceded by a spike

The package's parsers are coupled to its (broken) fetch. **Spike first:** can we cleanly feed
cloudscraper HTML into `procyclingstats` parsers? If yes, thin wrappers reuse them. If not,
own a small `selectolax`/BeautifulSoup parser — the GC table is simple (rank / rider slug /
time), and owning ~50 lines is more robust and fully testable than fighting the package.
Either way, parsing consumes HTML from `pcs_fetch` and never fetches directly.

### 3. Roster store — `data/rosters.json` + `roster_store.py` (new)

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
- A stint with no `to_stage` is current/open. `slug` is authoritative; `name`/`team` cached for display.

**`roster_store.py`** — pure, testable operations, no I/O mixed with logic:
`load` / `save`, `active_riders(roster, stage)`, `add_rider`, `swap_rider(out_slug, in_stint,
effective_stage)` (closes outgoing at `effective_stage-1`, opens incoming at `effective_stage`),
`add_participant` / `remove_participant`, and `validate(roster, total_stages)` — asserts the
invariant **exactly 3 active riders per participant at every stage**, no overlapping duplicate
slugs, stage numbers in range.

`races_config.py` keeps race *metadata*; `team_config.py` stays a deprecated shim;
`api_client.py` is updated to read the active roster for a given race + stage from the store
(closing the current single-race gap).

### 4. Rider resolver — `resolve_rider()` (new, used by CLI + skill)

`resolve_rider(query) -> ResolvedRider | list[Candidate]`:

1. Normalize `query` → candidate slug (lowercase, strip accents, spaces→hyphens, drop punctuation).
2. Validate by fetching the rider page via `pcs_fetch`; a real page yields canonical `{slug, name, team}`.
3. On miss/ambiguity, return candidates for the caller to disambiguate (CLI prints a numbered
   list; the skill asks conversationally). Support an explicit slug override.
4. **Later enhancement:** once the 2026 startlist populates, fuzzy-match against it and flag
   any drafted rider not actually starting.

This converts "vingegard" → `rider/jonas-vingegaard` and stops "Lipowitzzz" / "O'Conner" from
ever entering the store.

### 5. Guided CLI — `draft.py` (new)

Deterministic; runnable without Claude. Modes: **draft** (per participant, add riders by name
with live resolve+confirm), **swap** (participant → outgoing rider → replacement → effective
stage → re-validate), **show**, **verify** (delegates to Component 7). Writes through
`roster_store.save`; never edits JSON by hand.

### 6. The `/draft` skill — `.claude/skills/draft/SKILL.md` (new)

A thin natural-language layer over `roster_store.py` + `resolve_rider()`: interpret "Nate
drafted Pogačar, Vingegaard, Roglič" (resolve each, confirm, save) and "Aaron swapped Matteo
for Ben O'Connor effective stage 12" (`swap_rider`, validate, show a before/after diff). Always
runs `validate` after a change and surfaces violations. Correctness lives in the Python; the
skill only translates intent and confirms.

### 7. PCS verification / pre-race test — `verify.py` (new) — **built first**

Three checks, clearly separated so a failure points at the right cause:

1. **Connectivity preflight** — one `pcs_fetch` call; on `PCSBlockedError`, print an actionable
   message (which fetch tiers were tried, suggest residential network / Playwright) and stop.
2. **Roster slug validation** — re-resolve every slug in the store; report any that no longer resolve.
3. **End-to-end pipeline test against TDF 2025** — fetch real GC, compute standings via the
   scoring path, print them. Complete, known-good data; proves fetch + parse + scoring produce
   **real, app-ready output**.

A **golden contract test** asserts the standings object matches the shape `web/src/data/sampleData.js`
consumes, so the future `data.json` generator is a drop-in.

## Implementation ordering (vertical slice, de-risk first)

1. **Data path first:** `pcs_fetch` (cloudscraper tier + cache + challenge detection) →
   parsing spike + `pcs_parse` → scoring → `verify.py` end-to-end on TDF 2025. *Nothing else is
   built until real 2025 standings come out the far end.*
2. **Playwright fallback tier** added to `pcs_fetch` behind the same interface.
3. **Roster store** + `validate` (pure, unit-tested offline).
4. **Resolver** (uses the proven `pcs_fetch`).
5. **CLI `draft.py`**.
6. **`/draft` skill**.
7. **Golden contract test** vs. `sampleData.js` shape.

## Non-Goals (explicitly out of scope)

- Generating `web/public/data.json` and switching `useLeagueData.js` from `sampleData` to
  `fetch` — the planned "backend" session. This spec defines the fetch/parse/roster layers and
  the output contract it will consume, and stops there.
- Any change to the Streamlit `app.py` UI beyond reading the new roster store.
- A web/admin UI for roster entry (CLI + skill cover it).

## Enhancements (noted, not core)

- **Dated GC snapshot per run** — we already fetch GC; persisting a dated snapshot is the exact
  input movement arrows (`move`/`d`) need later (per the redesign spec). Near-free to capture now.
- **Startlist-gated draft validation** — once the 2026 startlist publishes, flag drafted riders
  who are not actually starting.

## Data flow

```
text draft ─► draft.py / /draft skill ─► resolve_rider() ─► pcs_fetch (chain) ─► pcs_parse
                    │                                              │  ▲
                    ▼                                              ▼  └─ raw-HTML cache
             roster_store.py ◄── validate ──┐            canonical {slug,name,team}
                    │                         │
                    ▼                         │
            data/rosters.json                 │
                    │                         │
   verify.py ─► pcs_fetch (GC) ─► pcs_parse ─► scoring ─► standings ─► golden contract test
                                                          (proves 2025 end-to-end)
```

## Testing strategy

- **Unit (no network):** `roster_store` ops + `validate` (stint math, 3-active invariant, swaps
  at stage 1 and final stage); resolver slug-normalization (accents, punctuation, multi-word);
  parser tests against **cached fixture HTML** (a saved rider page + GC page).
- **Integration (network, may hit Cloudflare):** `pcs_fetch` returns real content for a known
  rider and the 2025 GC; the fallback chain escalates correctly when the cloudscraper tier is
  forced to fail; `verify.py` 2025 end-to-end yields non-empty standings. Marked skippable where
  PCS is unreachable.
- **Contract:** golden test that generated standings match the `sampleData.js` shape.

## Risks & mitigations

| Risk | Mitigation |
|------|-----------|
| Cloudflare tightens and cloudscraper stops working | Fallback chain escalates to Playwright; all fetching behind `pcs_fetch`; verify's preflight makes the failure obvious. |
| Generator runs on a hard-challenged datacenter IP (CI/Vercel) | Document: run from a residential context (owner's Mac); CI uses the Playwright tier. |
| A failed fetch leaves the app with no data | Raw-HTML cache + committed `data.json` snapshots → worst case is "a few hours stale." |
| TDF 2026 startlist still empty at draft time | Resolver uses per-rider-page validation, which works today. |
| `procyclingstats` parsers reject injected HTML | Spike decides; fall back to owned `pcs_parse`. |
| PCS HTML structure changes mid-race | Cached HTML preserves already-fetched data; fixture-based parser tests catch breakage early. |
| Roster edited to an invalid state (≠3 active) | `validate` runs after every CLI/skill mutation and blocks save. |
| Hand-entered slug typos | Resolver validates against the live rider page before storing. |
