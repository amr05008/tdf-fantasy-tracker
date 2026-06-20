# Wire React App to Real PCS Data (TDF 2025) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the deployed React app render real procyclingstats standings for completed TDF 2025 (and trim the app to Tour de France only), by generating a committed `web/public/data/tdf-2025.json` and switching `useLeagueData` to fetch it.

**Architecture:** A Python script `scripts/generate_data.py` builds a per-race `data.json` (a drop-in for `sampleData.js`) from the existing `pcs_fetch`→`pcs_parse`→`scoring` pipeline; `nat`/`age`/`d` come free from the GC dict, `gapGC` is computed, the stage header comes from the stage page, `role` is stubbed and `form` omitted. The React `useLeagueData` hook fetches `/data/<raceId>.json` with a `sampleData` fallback; `selectors.js` is de-hardcoded; Giro + Vuelta are removed.

**Tech Stack:** Python 3.11 (dev venv `.venv`, `pytest`), reuses `pcs_fetch`/`pcs_parse`/`scoring`/`roster_store`; React + Vite + Vitest (`web/`).

## Global Constraints

- No Streamlit imports in any new/edited Python module; all PCS HTTP goes through `pcs_fetch` (via `pcs_parse`).
- The generated JSON is a **drop-in for `sampleData.js`** — same top-level keys: `meta`, `teams`, `draftPool`, `races`, `stage`, `movers`, `yourToday`.
- Rider objects emit `{name, gc, time, d, proTeam, gapGC, role, nat, age}` — **no `form` key**; `role` is the literal stub `"Rider"`.
- `gapGC` is `"GC leader"` for the overall GC #1 rider, else `"+H:MM:SS"` of (rider time − GC-leader time).
- `d = prev_rank − rank` (positive = moved up); `0` when prev data is absent.
- Races shown are **Tour de France only** (`tdf-2025`, `tdf-2026`); `giro-2026` and `vuelta-2026` are removed from config and `sampleData`.
- Python tests: `. .venv/bin/activate && pytest <file> -v`. React tests: `cd web && npx vitest run <file>`.
- `nat` is the full country name via `nations.code_to_name` (e.g. `SI`→`Slovenia`), falling back to the raw code.
- Leave `web/src/theme.js` untouched (its inert giro/vuelta accent entries keep `theme.test.js` green).

---

### Task 1: Country-code → name map (`nations.py`)

**Files:**
- Create: `nations.py`
- Test: `tests/test_nations.py`

**Interfaces:**
- Produces: `code_to_name(code: str) -> str`

- [ ] **Step 1: Write the failing test**

`tests/test_nations.py`:
```python
from nations import code_to_name


def test_known_codes():
    assert code_to_name("SI") == "Slovenia"
    assert code_to_name("GB") == "Britain"
    assert code_to_name("AU") == "Australia"
    assert code_to_name("US") == "United States"


def test_case_insensitive():
    assert code_to_name("si") == "Slovenia"


def test_unknown_falls_back_to_code():
    assert code_to_name("ZZ") == "ZZ"
    assert code_to_name("") == ""
```

- [ ] **Step 2: Run test to verify it fails**

Run: `. .venv/bin/activate && pytest tests/test_nations.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'nations'`

- [ ] **Step 3: Create `nations.py`**

```python
"""ISO-3166 alpha-2 country code -> display name, for cycling nations.

Falls back to the raw code when unmapped. Names match the style used in the
app (e.g. 'Britain', 'United States').
"""

_NAMES = {
    "AD": "Andorra", "AR": "Argentina", "AT": "Austria", "AU": "Australia",
    "BE": "Belgium", "BR": "Brazil", "CA": "Canada", "CH": "Switzerland",
    "CO": "Colombia", "CZ": "Czechia", "DE": "Germany", "DK": "Denmark",
    "EC": "Ecuador", "EE": "Estonia", "ER": "Eritrea", "ES": "Spain",
    "FR": "France", "GB": "Britain", "IE": "Ireland", "IT": "Italy",
    "JP": "Japan", "KZ": "Kazakhstan", "LU": "Luxembourg", "LV": "Latvia",
    "MX": "Mexico", "NL": "Netherlands", "NO": "Norway", "NZ": "New Zealand",
    "PL": "Poland", "PT": "Portugal", "RU": "Russia", "RW": "Rwanda",
    "SI": "Slovenia", "SK": "Slovakia", "SE": "Sweden", "UA": "Ukraine",
    "US": "United States", "ZA": "South Africa",
}


def code_to_name(code: str) -> str:
    if not code:
        return code
    return _NAMES.get(code.upper(), code)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `. .venv/bin/activate && pytest tests/test_nations.py -v`
Expected: PASS (3 passed)

- [ ] **Step 5: Commit**

```bash
git add nations.py tests/test_nations.py
git commit -m "feat: nations.code_to_name — ISO code to country name for rider nationality

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Stage-header parse (`pcs_parse.parse_stage_details`)

**Files:**
- Modify: `pcs_parse.py` (add two functions)
- Test: `tests/test_pcs_parse_stage_details.py`

**Interfaces:**
- Consumes: `pcs_fetch.get_html`, `procyclingstats.Stage`
- Produces:
  - `parse_stage_details(html: str) -> dict` — `{date, departure, arrival, distance, stage_type, profile_icon, winner_name, winner_team, winner_time}`
  - `fetch_stage_details(race_url: str, stage_number: int) -> dict`

- [ ] **Step 1: Write the failing test**

`tests/test_pcs_parse_stage_details.py`:
```python
import pathlib
import pcs_parse

FIX = pathlib.Path(__file__).parent / "fixtures"


def test_parse_stage_details_from_fixture():
    html = (FIX / "stage-21-gc.html").read_text()
    d = pcs_parse.parse_stage_details(html)
    assert d["departure"] == "Mantes-la-Ville"
    assert "Paris" in d["arrival"]
    assert d["distance"] == 132.3
    assert d["winner_name"] == "van Aert Wout"
    assert d["winner_team"].startswith("Team Visma")
    assert ":" in d["winner_time"]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `. .venv/bin/activate && pytest tests/test_pcs_parse_stage_details.py -v`
Expected: FAIL — `AttributeError: module 'pcs_parse' has no attribute 'parse_stage_details'`

- [ ] **Step 3: Add the functions to `pcs_parse.py`**

Add to `pcs_parse.py` (the module already imports `Stage` and `pcs_fetch`):
```python
def parse_stage_details(html: str) -> dict:
    """Return the stage header (route, distance, type, winner) from a stage page."""
    data = Stage("race/_/stage-1", html=html, update_html=False).parse()
    results = data.get("results") or []
    winner = results[0] if results else {}
    return {
        "date": data.get("date", ""),
        "departure": data.get("departure", ""),
        "arrival": data.get("arrival", ""),
        "distance": data.get("distance"),
        "stage_type": data.get("stage_type", ""),
        "profile_icon": data.get("profile_icon", ""),
        "winner_name": winner.get("rider_name", ""),
        "winner_team": winner.get("team_name", ""),
        "winner_time": winner.get("time", ""),
    }


def fetch_stage_details(race_url: str, stage_number: int) -> dict:
    """Fetch + parse the stage header for a stage."""
    html = pcs_fetch.get_html(f"{race_url}/stage-{stage_number}")
    return parse_stage_details(html)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `. .venv/bin/activate && pytest tests/test_pcs_parse_stage_details.py -v`
Expected: PASS (1 passed)

- [ ] **Step 5: Commit**

```bash
git add pcs_parse.py tests/test_pcs_parse_stage_details.py
git commit -m "feat: pcs_parse.parse_stage_details — stage header (route, distance, winner)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Data generator (`scripts/generate_data.py`)

Pure `build_race_data` (fixture-testable) + a `main()` CLI that fetches and writes the file.

**Files:**
- Create: `scripts/generate_data.py`
- Create: `scripts/__init__.py` (empty, so tests can import)
- Test: `tests/test_generate_data.py`

**Interfaces:**
- Consumes: `scoring.compute_standings`, `pcs_time.{time_str_to_seconds,seconds_to_time_str}`, `nations.code_to_name`, `pcs_parse.{fetch_stage_gc,fetch_stage_details}`, `roster_store`, `races_config.{get_race_config,RACES,TEAM_ROSTERS}`
- Produces:
  - `build_race_data(*, race_id, race_name, total_stages, stage_num, gc, prev_gc, stage_details, active_by_participant, races_list, updated, you="Aaron") -> dict`
  - `STAGE_TYPE_LABELS: dict`, `label_stage_type(stage_details) -> str`
  - `resolve_active(race_id, stage) -> dict`, `build_races_list() -> list`, `main(argv) -> int`

- [ ] **Step 1: Write the failing test**

`scripts/__init__.py`: empty file.

`tests/test_generate_data.py`:
```python
import pathlib
import pcs_parse
from races_config import TEAM_ROSTERS
from scripts.generate_data import build_race_data

FIX = pathlib.Path(__file__).parent / "fixtures"


def _inputs():
    html = (FIX / "stage-21-gc.html").read_text()
    gc = pcs_parse.parse_stage_gc(html)
    details = pcs_parse.parse_stage_details(html)
    return gc, details


def test_build_race_data_shape_and_enrichment():
    gc, details = _inputs()
    races_list = [{"id": "tdf-2025", "name": "Tour de France 2025", "dates": "Jul 5 – 27, 2025",
                   "stages": 21, "status": "Complete", "dot": "#F2C200", "note": "Won by Aaron"}]
    data = build_race_data(
        race_id="tdf-2025", race_name="Tour de France 2025", total_stages=21, stage_num=21,
        gc=gc, prev_gc=gc, stage_details=details,
        active_by_participant=TEAM_ROSTERS["tdf-2025"], races_list=races_list,
        updated="just now",
    )
    # top-level shape matches sampleData
    assert set(data) == {"meta", "teams", "draftPool", "races", "stage", "movers", "yourToday"}
    # 5-team 2025 league, Aaron leads
    assert len(data["teams"]) == 5
    assert data["teams"][0]["name"] == "Aaron" and data["teams"][0]["leader"] is True
    # rider enrichment on a drafted rider (Onley is Aaron's; Britain; trails GC leader).
    # NB: no fantasy rider is the overall GC #1 (Pogačar/Vingegaard weren't drafted).
    onley = next(r for t in data["teams"] for r in t["riders"] if "Onley" in r["name"])
    assert onley["nat"] == "Britain" and isinstance(onley["age"], int)
    assert "form" not in onley and onley["role"] == "Rider"
    assert onley["gapGC"].startswith("+")
    # stage header + meta
    assert data["stage"]["winner"] == "van Aert Wout"
    assert "Paris" in data["stage"]["route"]
    assert data["meta"]["progressPct"] == "100%" and data["meta"]["raceId"] == "tdf-2025"
    # prev_gc == gc -> no movement
    assert all(t["move"] == 0 for t in data["teams"]) and data["movers"] == []
    # yourToday is Aaron's riders
    assert len(data["yourToday"]) == 3
    assert data["races"] == races_list


def test_gapgc_for_non_leader_is_positive_gap():
    gc, details = _inputs()
    data = build_race_data(
        race_id="tdf-2025", race_name="x", total_stages=21, stage_num=21,
        gc=gc, prev_gc=gc, stage_details=details,
        active_by_participant={"Solo": ["rider/oscar-onley"]}, races_list=[], updated="now",
    )
    onley = data["teams"][0]["riders"][0]
    assert onley["gapGC"].startswith("+")  # Onley trails the GC leader


def test_gapgc_for_gc_leader_is_label():
    gc, details = _inputs()
    data = build_race_data(
        race_id="tdf-2025", race_name="x", total_stages=21, stage_num=21,
        gc=gc, prev_gc=gc, stage_details=details,
        active_by_participant={"Solo": ["rider/tadej-pogacar"]}, races_list=[], updated="now",
    )
    # Pogačar is the overall GC #1 in this fixture.
    assert data["teams"][0]["riders"][0]["gapGC"] == "GC leader"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `. .venv/bin/activate && pytest tests/test_generate_data.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'scripts.generate_data'`

- [ ] **Step 3: Create `scripts/generate_data.py`**

```python
"""Generate web/public/data/<raceId>.json from real PCS data.

Usage: python scripts/generate_data.py <raceId> [--stage N]
build_race_data is pure (no I/O) for offline testing; main() does the fetching.
"""
import json
import pathlib
import sys

import pcs_parse
import roster_store
import scoring
from pcs_time import time_str_to_seconds, seconds_to_time_str
from nations import code_to_name
from races_config import get_race_config, RACES, TEAM_ROSTERS

OUT_DIR = pathlib.Path(__file__).parent.parent / "web" / "public" / "data"

STAGE_TYPE_LABELS = {
    "p1": "Flat", "p2": "Hilly", "p3": "Hilly", "p4": "Mountain", "p5": "Mountain",
}


def label_stage_type(stage_details: dict) -> str:
    return STAGE_TYPE_LABELS.get(stage_details.get("profile_icon", ""), "Road")


def _gc_leader_seconds(gc: dict) -> int:
    for e in gc.values():
        if e.get("rank") == 1:
            return time_str_to_seconds(e.get("time", "0:00:00"))
    times = [time_str_to_seconds(e.get("time", "0:00:00")) for e in gc.values()]
    times = [t for t in times if t > 0]
    return min(times) if times else 0


def _your_note(d: int) -> str:
    if d > 0:
        return f"Up {d} on GC"
    if d < 0:
        return f"Lost {-d} on GC"
    return "Holds GC position"


def build_race_data(*, race_id, race_name, total_stages, stage_num, gc, prev_gc,
                    stage_details, active_by_participant, races_list, updated, you="Aaron"):
    standings = scoring.compute_standings(active_by_participant, gc)
    prev = scoring.compute_standings(active_by_participant, prev_gc)
    prev_rank = {r["name"]: r["position"] for r in prev}
    leader_secs = _gc_leader_seconds(gc)
    n = len(standings)

    teams = []
    for row in standings:
        riders = []
        for r in row["riders"]:
            entry = gc.get(r["slug"], {})
            counted = r["counted"]
            if not counted:
                gap_gc = "—"
            elif entry.get("rank") == 1:
                gap_gc = "GC leader"
            else:
                gap_gc = "+" + seconds_to_time_str(time_str_to_seconds(r["time"]) - leader_secs)
            pr, rk = entry.get("prev_rank"), entry.get("rank")
            d = (pr - rk) if (isinstance(pr, int) and isinstance(rk, int)) else 0
            riders.append({
                "name": r["name"], "gc": r["gc"], "time": r["time"], "d": d,
                "proTeam": r["proTeam"], "gapGC": gap_gc, "role": "Rider",
                "nat": code_to_name(entry.get("nationality", "")), "age": entry.get("age"),
            })
        move = prev_rank.get(row["name"], row["position"]) - row["position"]
        teams.append({
            "name": row["name"], "rank": row["position"], "total": row["total_time"],
            "gap": row["gap"], "move": move,
            "leader": row["position"] == 1, "last": row["position"] == n, "riders": riders,
        })

    movers = []
    for t in sorted(teams, key=lambda t: -abs(t["move"])):
        if t["move"] != 0:
            note = f"Up {t['move']} overall" if t["move"] > 0 else f"Down {-t['move']} overall"
            movers.append({"name": t["name"], "move": t["move"], "note": note})

    your_team = next((t for t in teams if t["name"] == you), teams[0] if teams else None)
    your_today = []
    if your_team:
        for r in your_team["riders"]:
            your_today.append({"name": r["name"], "place": "#" + str(r["gc"]),
                               "gap": r["gapGC"], "note": _your_note(r["d"])})

    draft_pool, seen = [], set()
    for t in teams:
        for r in t["riders"]:
            if r["name"] not in seen:
                seen.add(r["name"])
                draft_pool.append({"name": r["name"], "team": r["proTeam"], "role": r["role"]})

    leader_name = teams[0]["name"] if teams else ""
    stage = {
        "stageNum": stage_num, "date": stage_details.get("date", ""),
        "route": f"{stage_details.get('departure', '')} → {stage_details.get('arrival', '')}",
        "type": label_stage_type(stage_details),
        "km": (f"{stage_details['distance']} km" if stage_details.get("distance") else ""),
        "winner": stage_details.get("winner_name", ""),
        "winnerTeam": stage_details.get("winner_team", ""),
        "winnerTime": stage_details.get("winner_time", ""),
    }
    meta = {
        "raceId": race_id, "name": race_name, "stageNum": stage_num,
        "totalStages": total_stages, "progressPct": f"{round(100 * stage_num / total_stages)}%",
        "updated": updated, "recap": f"Final standings — {leader_name} wins the {race_name}.",
    }
    return {"meta": meta, "teams": teams, "draftPool": draft_pool,
            "races": races_list, "stage": stage, "movers": movers, "yourToday": your_today}


def resolve_active(race_id: str, stage: int) -> dict:
    roster = roster_store.load(race_id)
    if roster:
        return roster_store.active_riders(roster, stage)
    return TEAM_ROSTERS.get(race_id, {})


def build_races_list() -> list:
    out = []
    for rid, rc in RACES.items():
        status = "Complete" if rc.get("is_complete") else "Upcoming"
        note = ("Won by " + rc["winner"]) if rc.get("winner") else "Upcoming"
        start, end = rc["start_date"], rc["end_date"]
        out.append({"id": rid, "name": rc["name"], "dates": f"{start} – {end}",
                    "stages": rc["total_stages"], "status": status,
                    "dot": rc["leader_color"], "note": note})
    return out


def main(argv) -> int:
    race_id = argv[0]
    stage = None
    if "--stage" in argv:
        stage = int(argv[argv.index("--stage") + 1])
    race = get_race_config(race_id)
    total = race["total_stages"]
    if stage is None:
        stage = total  # completed-race default: final stage
    active = resolve_active(race_id, stage)
    gc = pcs_parse.fetch_stage_gc(race["race_url"], stage)
    prev_gc = pcs_parse.fetch_stage_gc(race["race_url"], stage - 1) if stage > 1 else {}
    details = pcs_parse.fetch_stage_details(race["race_url"], stage)
    from datetime import datetime, timezone
    updated = datetime.now(timezone.utc).strftime("%b %d, %Y")
    data = build_race_data(
        race_id=race_id, race_name=race["name"], total_stages=total, stage_num=stage,
        gc=gc, prev_gc=prev_gc, stage_details=details,
        active_by_participant=active, races_list=build_races_list(), updated=updated,
    )
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_file = OUT_DIR / f"{race_id}.json"
    out_file.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"wrote {out_file} — {len(data['teams'])} teams, stage {stage}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
```

- [ ] **Step 4: Run test to verify it passes**

Run: `. .venv/bin/activate && pytest tests/test_generate_data.py -v`
Expected: PASS (3 passed)

- [ ] **Step 5: Run the full Python suite (no regressions)**

Run: `. .venv/bin/activate && pytest -q`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add scripts/__init__.py scripts/generate_data.py tests/test_generate_data.py
git commit -m "feat: generate_data.build_race_data — full data.json from PCS pipeline

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: `useLeagueData` fetches real data (async + fallback)

**Files:**
- Modify: `web/src/data/useLeagueData.js` (rewrite)
- Modify: `web/src/data/useLeagueData.test.js` (rewrite — fetch behavior, not race counts)

**Interfaces:**
- Produces: `fetchRaceData(raceId: string) -> Promise<object>`; default export `useLeagueData(raceId) -> object`

- [ ] **Step 1: Rewrite the test**

`web/src/data/useLeagueData.test.js`:
```js
import { renderHook } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import useLeagueData, { fetchRaceData } from './useLeagueData.js'
import sampleData from './sampleData.js'

afterEach(() => { vi.unstubAllGlobals() })

test('fetchRaceData returns parsed JSON on a 200', async () => {
  const payload = { meta: { raceId: 'tdf-2025' }, teams: [] }
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => payload })))
  expect(await fetchRaceData('tdf-2025')).toEqual(payload)
})

test('fetchRaceData falls back to sampleData on a non-OK response', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false })))
  expect(await fetchRaceData('tdf-2099')).toBe(sampleData)
})

test('fetchRaceData falls back to sampleData when fetch throws', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline') }))
  expect(await fetchRaceData('tdf-2025')).toBe(sampleData)
})

test('hook returns sampleData synchronously (no fetch in test mode)', () => {
  const { result } = renderHook(() => useLeagueData('tdf-2025'))
  expect(result.current).toBe(sampleData)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npx vitest run src/data/useLeagueData.test.js`
Expected: FAIL — `fetchRaceData` is not exported / hook still returns the old shape.

- [ ] **Step 3: Rewrite `web/src/data/useLeagueData.js`**

```js
import { useEffect, useState } from 'react'
import sampleData from './sampleData.js'

// Fetch the committed per-race dataset; fall back to the bundled placeholder
// (e.g. a race whose data.json hasn't been generated yet).
export async function fetchRaceData(raceId) {
  try {
    const res = await fetch(`/data/${raceId}.json`)
    if (!res.ok) return sampleData
    return await res.json()
  } catch {
    return sampleData
  }
}

export default function useLeagueData(raceId) {
  const [data, setData] = useState(sampleData)
  useEffect(() => {
    // Tests assert the synchronous sampleData bootstrap; fetch logic is covered
    // directly via fetchRaceData. Skipping the effect keeps component tests free
    // of async act() noise.
    if (import.meta.env.MODE === 'test') return
    let alive = true
    fetchRaceData(raceId).then(d => { if (alive) setData(d) })
    return () => { alive = false }
  }, [raceId])
  return data
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npx vitest run src/data/useLeagueData.test.js`
Expected: PASS (4 passed)

- [ ] **Step 5: Run the full web suite (no regressions)**

Run: `cd web && npx vitest run`
Expected: all pass (App/Races tests still use the synchronous sampleData bootstrap).

- [ ] **Step 6: Commit**

```bash
git add web/src/data/useLeagueData.js web/src/data/useLeagueData.test.js
git commit -m "feat(web): useLeagueData fetches /data/<raceId>.json with sampleData fallback

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: De-hardcode `selectors.js` (team count + omitted form)

**Files:**
- Modify: `web/src/lib/selectors.js` (`buildTeamView`, `buildRiderProfile`)
- Modify: `web/src/lib/selectors.test.js` (add two tests)

**Interfaces:**
- Consumes: `teams` array; rider objects that may lack `form` and have `role: "Rider"`
- Produces: unchanged function signatures; `standingLine` uses `teams.length`; `buildRiderProfile` tolerates a missing `form`

- [ ] **Step 1: Add the failing tests**

Append to `web/src/lib/selectors.test.js`:
```js
test('buildTeamView standingLine uses the actual team count', () => {
  const five = teams.slice(0, 5)
  const view = buildTeamView(five, five[2].name)
  expect(view.standingLine).toBe(ordinalOf(five, five[2].name) + ' of 5 overall · 3 riders')
})

test('buildRiderProfile tolerates a rider with no form field', () => {
  const t = [{ name: 'Solo', rank: 1, total: '1:00', gap: 'Leader', leader: true, last: true,
    riders: [{ name: 'No Form', gc: 4, time: '5:00:00', proTeam: 'T', gapGC: '+1:00',
      role: 'Rider', nat: 'Slovenia', age: 25 }] }]
  const rp = buildRiderProfile(t, 'No Form', 21)
  expect(rp.form).toEqual([])
  expect(rp.role).toBe('Rider')
})
```
And add this helper near the top of the test file (after the `const { teams, ... }` line):
```js
const ordinalOf = (list, name) => {
  const i = list.findIndex(t => t.name === name)
  return ['1st', '2nd', '3rd', '4th', '5th', '6th'][i]
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npx vitest run src/lib/selectors.test.js`
Expected: FAIL — `standingLine` still says "of 6"; `buildRiderProfile` throws on `r.form.map` (undefined).

- [ ] **Step 3: Edit `web/src/lib/selectors.js`**

In `buildTeamView`, change the `standingLine`:
```js
    standingLine: ordinal(sel.rank) + ' of ' + teams.length + ' overall · ' + sel.riders.length + ' riders',
```

In `buildRiderProfile`, change the `form` mapping to guard a missing field:
```js
    form: (r.form || []).map((p, i) => ({ label: 'St ' + (stageNum - 2 + i), place: ordinal(p) })),
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npx vitest run src/lib/selectors.test.js`
Expected: PASS (existing + 2 new). The existing "1st of 6 overall" test still passes because `sampleData` has 6 teams.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/selectors.js web/src/lib/selectors.test.js
git commit -m "fix(web): selectors use real team count and tolerate omitted rider form

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Remove Giro + Vuelta (Tour de France only)

**Files:**
- Modify: `races_config.py` (remove `giro-2026`, `vuelta-2026` from `RACES` and `TEAM_ROSTERS`)
- Modify: `web/src/data/sampleData.js` (`races` array → TDF only)
- Modify: `web/src/screens/Races.test.jsx` (drop giro click; fix counts)
- Modify: `web/src/App.test.jsx` (replace the giro accent test)
- Test: `tests/test_races_config.py`

- [ ] **Step 1: Write the failing Python test**

`tests/test_races_config.py`:
```python
from races_config import RACES, TEAM_ROSTERS


def test_only_tour_de_france_races():
    assert set(RACES) == {"tdf-2025", "tdf-2026"}
    assert set(TEAM_ROSTERS) == {"tdf-2025", "tdf-2026"}
```

- [ ] **Step 2: Run it to verify it fails**

Run: `. .venv/bin/activate && pytest tests/test_races_config.py -v`
Expected: FAIL — `giro-2026`/`vuelta-2026` still present.

- [ ] **Step 3: Edit `races_config.py`**

Delete the `"giro-2026": { ... }` and `"vuelta-2026": { ... }` entries from the `RACES` dict, and the `"giro-2026": { ... }` and `"vuelta-2026": { ... }` entries from the `TEAM_ROSTERS` dict. Keep `tdf-2025` and `tdf-2026` exactly as they are. (If `DEFAULT_RACE` references a removed id, leave it — it is `tdf-2025`.)

- [ ] **Step 4: Run it to verify it passes**

Run: `. .venv/bin/activate && pytest tests/test_races_config.py -v`
Expected: PASS. Also run `pytest -q` — all pass.

- [ ] **Step 5: Edit `web/src/data/sampleData.js` `races` array**

Replace the `races: [ ... ]` array with TDF-only (drop the giro and vuelta objects):
```js
  races: [
    { id: 'tdf-2025', name: 'Tour de France 2025', dates: 'Jul 5 – 27, 2025', stages: 21, status: 'Complete', dot: '#F2C200', note: 'Won by Aaron' },
    { id: 'tdf-2026', name: 'Tour de France 2026', dates: 'Jul 4 – 26, 2026', stages: 21, status: 'Live', dot: '#F2C200', note: 'Stage 11 / 21' },
  ],
```

- [ ] **Step 6: Fix `web/src/screens/Races.test.jsx`**

Replace its contents:
```jsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import Races from './Races.jsx'
import sampleData from '../data/sampleData.js'

test('renders the Tour de France races with the active one marked Viewing', () => {
  render(<Races data={sampleData} race="tdf-2026" setRace={() => {}} />)
  expect(screen.getByText('Choose competition')).toBeInTheDocument()
  expect(screen.getByText('Viewing')).toBeInTheDocument()
  expect(screen.getByText('Won by Aaron')).toBeInTheDocument()
})

test('clicking a race selects it', async () => {
  const setRace = vi.fn()
  render(<Races data={sampleData} race="tdf-2026" setRace={setRace} />)
  await userEvent.click(screen.getByText('Tour de France 2025'))
  expect(setRace).toHaveBeenCalledWith('tdf-2025')
})
```

- [ ] **Step 7: Fix `web/src/App.test.jsx` (replace the giro accent test)**

Replace the third test (the "accent follows the displayed dataset" test, lines 19–28) with:
```jsx
test('selecting a race does not crash and keeps the Tour Yellow accent', async () => {
  const { container } = render(<App />)
  const root = container.firstChild
  expect(root.style.getPropertyValue('--accent')).toBe('#F2C200')
  await userEvent.click(screen.getByText('Races'))
  await userEvent.click(screen.getByText('Tour de France 2025'))
  expect(root.style.getPropertyValue('--accent')).toBe('#F2C200')
})
```

- [ ] **Step 8: Run the full web suite**

Run: `cd web && npx vitest run`
Expected: all pass.

- [ ] **Step 9: Commit**

```bash
git add races_config.py tests/test_races_config.py web/src/data/sampleData.js web/src/screens/Races.test.jsx web/src/App.test.jsx
git commit -m "feat: Tour de France only — remove Giro + Vuelta from config and UI

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Generate & commit `tdf-2025.json`, then verify end-to-end

This task runs the live generator (network) and verifies the app renders real data. The generation step is **controller-run** (the implementer's sandbox cannot reach Cloudflare-guarded PCS).

**Files:**
- Create: `web/public/data/tdf-2025.json` (generated artifact, committed)

- [ ] **Step 1: Generate the dataset (residential network, sandbox off)**

Run: `. .venv/bin/activate && python scripts/generate_data.py tdf-2025`
Expected: `wrote .../web/public/data/tdf-2025.json — 5 teams, stage 21`.

- [ ] **Step 2: Sanity-check the artifact**

Run:
```bash
python -c "import json; d=json.load(open('web/public/data/tdf-2025.json')); print(d['teams'][0]['name'], d['teams'][0]['total']); print(d['stage']['winner']); print(len(d['teams']), 'teams')"
```
Expected: `Aaron 228:59:22`, a real stage-21 winner, `5 teams`.

- [ ] **Step 3: Confirm the React build still passes**

Run: `cd web && npx vitest run`
Expected: all pass.

- [ ] **Step 4: Manual end-to-end (dev server)**

Run: `cd web && npm run dev`, open the app, select **Tour de France 2025**. Confirm the Standings show Aaron leading with real times, the Stage screen shows the real stage-21 header (Paris, van Aert), and selecting **Tour de France 2026** falls back to placeholder. Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add web/public/data/tdf-2025.json
git commit -m "feat: commit generated tdf-2025.json — app renders real 2025 standings

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review notes (spec coverage)

- Per-race `data.json` + drop-in shape → Tasks 3, 7. `useLeagueData` fetch+fallback → Task 4.
- Field mapping (gapGC/nat/age/d real; role stub; form omit; stage header; meta; movers; yourToday; draftPool) → Task 3 (`build_race_data`), verified against the real fixture.
- `nat` via code→name → Task 1. Stage header parse → Task 2.
- De-hardcode selectors (team count, omitted form) → Task 5.
- Remove Giro + Vuelta (config + sampleData + affected tests) → Task 6; `theme.js` intentionally left (per Global Constraints).
- Scope boundary (completed 2025 only; live-2026 deferred) honored — `main` defaults stage to `total_stages`; no daily-snapshot/cron work.
- All PCS HTTP via `pcs_fetch`/`pcs_parse`; no Streamlit imports; pure `build_race_data` is fixture-tested offline.
