# Upcoming-Race Call-Out Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fake placeholder standings shown for a not-yet-started race (TDF 2026) with an honest "Upcoming" notice, default the app to completed TDF 2025, and tidy the race-selector dates.

**Architecture:** `useLeagueData` detects an upcoming race from the bundled `sampleData.races` manifest (status-driven) and returns a lightweight `{upcoming:true}` object without fetching; `App.jsx` renders a new `Upcoming` screen for the Standings/Stage/Team tabs when that flag is set (Races still shows the selector). The Python generator's `build_races_list` formats ISO dates into a friendly range.

**Tech Stack:** React + Vite + Vitest (`web/`); Python 3.11 (`.venv`, `pytest`).

## Global Constraints

- Upcoming detection is **status-driven**: a race is upcoming when `sampleData.races.find(id).status === 'Upcoming'` — never inferred from a fetch failure.
- The upcoming object is exactly `{ upcoming: true, meta: { raceId, name }, races: sampleData.races }`.
- Default race is `tdf-2025`; a `?race=` URL param still overrides.
- Keep `BrandBar` + tab nav for an upcoming race; only the Standings/Stage/Team **content** becomes the notice. The Races tab still renders the selector.
- No real 2026 data generation (out of scope).
- Date ranges render like `Jul 5 – 27, 2025` (en-dash `–`, no leading-zero days).
- React tests: `cd web && npx vitest run <file>`. Python tests: `. .venv/bin/activate && pytest <file> -v`.

---

### Task 1: Friendly date ranges in `build_races_list`

**Files:**
- Modify: `scripts/generate_data.py` (add `_format_date_range`; use it in `build_races_list`)
- Test: `tests/test_generate_data_dates.py`

**Interfaces:**
- Produces: `_format_date_range(start: str, end: str) -> str` (inputs `"YYYY-MM-DD"`)

- [ ] **Step 1: Write the failing test**

`tests/test_generate_data_dates.py`:
```python
from scripts.generate_data import _format_date_range, build_races_list


def test_format_same_month():
    assert _format_date_range("2026-07-04", "2026-07-26") == "Jul 4 – 26, 2026"
    assert _format_date_range("2025-07-05", "2025-07-27") == "Jul 5 – 27, 2025"


def test_format_cross_month():
    assert _format_date_range("2026-08-22", "2026-09-13") == "Aug 22 – Sep 13, 2026"


def test_build_races_list_uses_formatted_dates():
    races = {r["id"]: r for r in build_races_list()}
    assert races["tdf-2025"]["dates"] == "Jul 5 – 27, 2025"
    assert races["tdf-2026"]["dates"] == "Jul 4 – 26, 2026"
    assert races["tdf-2026"]["status"] == "Upcoming"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `. .venv/bin/activate && pytest tests/test_generate_data_dates.py -v`
Expected: FAIL — `ImportError: cannot import name '_format_date_range'`

- [ ] **Step 3: Add `_format_date_range` and use it**

In `scripts/generate_data.py`, add this function above `build_races_list`:
```python
def _format_date_range(start: str, end: str) -> str:
    """'2026-07-04','2026-07-26' -> 'Jul 4 – 26, 2026' (en-dash, no leading-zero days)."""
    from datetime import datetime
    s = datetime.strptime(start, "%Y-%m-%d")
    e = datetime.strptime(end, "%Y-%m-%d")
    if s.year == e.year and s.month == e.month:
        return f"{s.strftime('%b')} {s.day} – {e.day}, {e.year}"
    if s.year == e.year:
        return f"{s.strftime('%b')} {s.day} – {e.strftime('%b')} {e.day}, {e.year}"
    return f"{s.strftime('%b')} {s.day}, {s.year} – {e.strftime('%b')} {e.day}, {e.year}"
```
Then in `build_races_list`, change the `dates` value from `f"{start} – {end}"` to `_format_date_range(start, end)`:
```python
        out.append({"id": rid, "name": rc["name"], "dates": _format_date_range(start, end),
                    "stages": rc["total_stages"], "status": status,
                    "dot": rc["leader_color"], "note": note})
```

- [ ] **Step 4: Run test to verify it passes**

Run: `. .venv/bin/activate && pytest tests/test_generate_data_dates.py -v`
Expected: PASS (3 passed). Then `pytest -q` — all pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/generate_data.py tests/test_generate_data_dates.py
git commit -m "feat: format race-selector date ranges (Jul 5 – 27, 2025) in build_races_list

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: `Upcoming` screen component

**Files:**
- Create: `web/src/screens/Upcoming.jsx`
- Test: `web/src/screens/Upcoming.test.jsx`

**Interfaces:**
- Produces: `Upcoming({ race })` — `race` is a `sampleData.races`-shaped object (`{name, dates, ...}`); tolerates `race` being undefined.

- [ ] **Step 1: Write the failing test**

`web/src/screens/Upcoming.test.jsx`:
```jsx
import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import Upcoming from './Upcoming.jsx'

test('renders the race name and upcoming copy', () => {
  render(<Upcoming race={{ name: 'Tour de France 2026', dates: 'Jul 4 – 26, 2026' }} />)
  expect(screen.getByText('Upcoming')).toBeInTheDocument()
  expect(screen.getByText('Tour de France 2026')).toBeInTheDocument()
  expect(screen.getByText('Jul 4 – 26, 2026')).toBeInTheDocument()
  expect(screen.getByText(/Standings will appear once the race begins/i)).toBeInTheDocument()
})

test('does not crash when race is undefined', () => {
  render(<Upcoming race={undefined} />)
  expect(screen.getByText('Upcoming')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npx vitest run src/screens/Upcoming.test.jsx`
Expected: FAIL — cannot resolve `./Upcoming.jsx`.

- [ ] **Step 3: Create `web/src/screens/Upcoming.jsx`**

```jsx
export default function Upcoming({ race }) {
  const name = (race && race.name) || 'This race'
  return (
    <div style={{ padding: '44px 22px 52px', textAlign: 'center' }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--accent-ink)' }}>
        Upcoming
      </div>
      <div style={{ fontSize: 23, fontWeight: 700, color: '#1A1813', marginTop: 10, letterSpacing: '-.015em' }}>
        {name}
      </div>
      {race && race.dates && (
        <div style={{ fontSize: 13, color: '#6E6A62', marginTop: 8 }}>{race.dates}</div>
      )}
      <div style={{ fontSize: 13.5, color: '#8C8881', marginTop: 20, lineHeight: 1.5 }}>
        Standings will appear once the race begins.
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npx vitest run src/screens/Upcoming.test.jsx`
Expected: PASS (2 passed)

- [ ] **Step 5: Commit**

```bash
git add web/src/screens/Upcoming.jsx web/src/screens/Upcoming.test.jsx
git commit -m "feat(web): Upcoming screen — call-out for a not-yet-started race

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Wire upcoming detection + rendering (one cohesive change)

These edits are interdependent (the `sampleData` status flip is what triggers the `useLeagueData` upcoming path, which `App.jsx` must gate) — they land together so the suite is never broken.

**Files:**
- Modify: `web/src/data/useLeagueData.js` (rewrite — add upcoming logic)
- Modify: `web/src/data/sampleData.js` (`tdf-2026` race → `Upcoming`)
- Modify: `web/src/App.jsx` (default race + upcoming gate)
- Modify: `web/src/data/useLeagueData.test.js` (add an upcoming-path test)
- Modify: `web/src/App.test.jsx` (add a select-2026 test)

**Interfaces:**
- Consumes: `Upcoming` (Task 2), `sampleData.races`
- Produces: `useLeagueData(raceId)` returns the real data, the `sampleData` bootstrap, or `{ upcoming:true, meta:{raceId,name}, races }`

- [ ] **Step 1: Flip `tdf-2026` to Upcoming in `web/src/data/sampleData.js`**

Replace the `tdf-2026` entry in the `races` array:
```js
    { id: 'tdf-2026', name: 'Tour de France 2026', dates: 'Jul 4 – 26, 2026', stages: 21, status: 'Upcoming', dot: '#F2C200', note: 'Starts Jul 4' },
```

- [ ] **Step 2: Add the failing tests**

In `web/src/data/useLeagueData.test.js`, add (keep the existing tests and the `afterEach(() => vi.unstubAllGlobals())`):
```js
test('an upcoming race returns the upcoming view without fetching', () => {
  const fetchSpy = vi.fn()
  vi.stubGlobal('fetch', fetchSpy)
  const { result } = renderHook(() => useLeagueData('tdf-2026'))
  expect(result.current.upcoming).toBe(true)
  expect(result.current.meta.raceId).toBe('tdf-2026')
  expect(result.current.races).toBe(sampleData.races)
  expect(fetchSpy).not.toHaveBeenCalled()
})
```

In `web/src/App.test.jsx`, add:
```jsx
test('selecting the upcoming Tour 2026 shows the upcoming notice', async () => {
  render(<App />)
  await userEvent.click(screen.getByText('Races'))
  await userEvent.click(screen.getByText('Tour de France 2026'))
  await userEvent.click(screen.getByText('Standings'))
  expect(screen.getByText('Upcoming')).toBeVisible()
  expect(screen.getByText(/Standings will appear once the race begins/i)).toBeVisible()
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd web && npx vitest run src/data/useLeagueData.test.js src/App.test.jsx`
Expected: FAIL — `result.current.upcoming` is undefined (hook has no upcoming logic); App has no notice.

- [ ] **Step 4: Rewrite `web/src/data/useLeagueData.js`**

```js
import { useEffect, useState } from 'react'
import sampleData from './sampleData.js'

// Fetch the committed per-race dataset; fall back to the bundled placeholder
// (used as a safety net for a real race whose file fails to load).
export async function fetchRaceData(raceId) {
  try {
    const res = await fetch(`/data/${raceId}.json`)
    if (!res.ok) return sampleData
    return await res.json()
  } catch {
    return sampleData
  }
}

function isUpcoming(raceId) {
  const race = sampleData.races.find(r => r.id === raceId)
  return Boolean(race && race.status === 'Upcoming')
}

// Lightweight view for a not-yet-started race: enough for the selector (races)
// and theme/notice (meta.raceId + name), with no fake standings.
function upcomingData(raceId) {
  const race = sampleData.races.find(r => r.id === raceId)
  return {
    upcoming: true,
    meta: { raceId, name: race ? race.name : raceId },
    races: sampleData.races,
  }
}

function viewFor(raceId) {
  return isUpcoming(raceId) ? upcomingData(raceId) : sampleData
}

export default function useLeagueData(raceId) {
  const [data, setData] = useState(() => viewFor(raceId))
  useEffect(() => {
    setData(viewFor(raceId)) // keep state in sync when raceId changes
    // Upcoming races never fetch; in test mode component tests stay synchronous.
    if (isUpcoming(raceId) || import.meta.env.MODE === 'test') return
    let alive = true
    fetchRaceData(raceId).then(d => { if (alive) setData(d) })
    return () => { alive = false }
  }, [raceId])
  return data
}
```

- [ ] **Step 5: Edit `web/src/App.jsx`**

(a) Change the default in `initialRace()`:
```js
function initialRace() {
  if (typeof window === 'undefined') return 'tdf-2025'
  const q = new URLSearchParams(window.location.search).get('race')
  return q || 'tdf-2025'
}
```

(b) Add the import near the other screen imports:
```js
import Upcoming from './screens/Upcoming.jsx'
```

(c) Replace the body of `renderMain` so an upcoming race renders the notice on the non-Races tabs:
```js
function renderMain(ctx) {
  const { screen, setScreen, data } = ctx
  const upcomingRace = data.upcoming
    ? data.races.find(r => r.id === data.meta.raceId)
    : null
  return (
    <div>
      <BrandBar />
      <TabNav tabs={TABS} active={screen} onSelect={setScreen} />
      {screen === 'races'
        ? <Races data={data} race={ctx.race} setRace={ctx.setRace} />
        : data.upcoming
          ? <Upcoming race={upcomingRace} />
          : <>
              {screen === 'standings' && <Standings data={ctx.data} expanded={ctx.expanded} toggle={ctx.toggle} showMovement={ctx.showMovement} />}
              {screen === 'stage' && <Stage data={ctx.data} openRider={ctx.openRider} />}
              {screen === 'team' && <Team data={ctx.data} team={ctx.team} setTeam={ctx.setTeam} showMovement={ctx.showMovement} openRider={ctx.openRider} openDraft={ctx.openDraft} />}
            </>}
    </div>
  )
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd web && npx vitest run src/data/useLeagueData.test.js src/App.test.jsx`
Expected: PASS. Then the full web suite: `cd web && npx vitest run` — all green.

- [ ] **Step 7: Commit**

```bash
git add web/src/data/useLeagueData.js web/src/data/sampleData.js web/src/App.jsx web/src/data/useLeagueData.test.js web/src/App.test.jsx
git commit -m "feat(web): show Upcoming notice for not-yet-started races; default to TDF 2025

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Regenerate `tdf-2025.json` with formatted dates

Controller-run (the sandbox cannot reach Cloudflare-guarded PCS). Regenerates the committed dataset so its `races` list carries the friendly dates from Task 1 and `tdf-2026: Upcoming`.

**Files:**
- Modify: `web/public/data/tdf-2025.json` (regenerated artifact)

- [ ] **Step 1: Regenerate (residential network, sandbox off)**

Run: `. .venv/bin/activate && python scripts/generate_data.py tdf-2025`
Expected: `wrote .../web/public/data/tdf-2025.json — 5 teams, stage 21`.

- [ ] **Step 2: Verify the races list dates + status**

Run:
```bash
python -c "import json; r={x['id']:x for x in json.load(open('web/public/data/tdf-2025.json'))['races']}; print(r['tdf-2025']['dates']); print(r['tdf-2026']['dates'], r['tdf-2026']['status'])"
```
Expected: `Jul 5 – 27, 2025` then `Jul 4 – 26, 2026 Upcoming`.

- [ ] **Step 3: Confirm both suites green**

Run: `cd web && npx vitest run` (all pass) and `. .venv/bin/activate && pytest -q` (all pass).

- [ ] **Step 4: Manual end-to-end (dev server)**

`cd web && npm run dev`: first load shows real TDF 2025 standings (Aaron leading). Go to **Races** → the selector shows friendly dates → select **Tour de France 2026** → switch to **Standings**: the "Upcoming · Tour de France 2026 · Starts Jul 4" notice shows (no fake standings). Switch back to 2025 → real data returns. Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add web/public/data/tdf-2025.json
git commit -m "chore: regenerate tdf-2025.json with formatted selector dates

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review notes (spec coverage)

- Status-driven detection + upcoming object → Task 3 (`isUpcoming`/`upcomingData`/`viewFor`).
- `Upcoming.jsx` notice, keep BrandBar + tabs, Races still selectable → Tasks 2 + 3 (`renderMain` gate).
- Default race `tdf-2025` → Task 3 (`initialRace`).
- `sampleData.races` `tdf-2026` → `Upcoming`/`Starts Jul 4` → Task 3.
- Friendly selector dates + regenerate → Tasks 1 + 4.
- No live-2026 data machinery; the real-race fetch path + `sampleData` safety fallback are unchanged.
