# Roster Management + PCS Fetch Unblock — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the league owner populate participants + riders effortlessly after an offline draft, support historically-accurate mid-race injury swaps, and fetch/parse procyclingstats data reliably despite Cloudflare — proven end-to-end against complete TDF 2025 data.

**Architecture:** A set of small, pure Python modules at the repo root, decoupled from Streamlit. All PCS HTTP goes through one seam (`pcs_fetch`) that defeats Cloudflare with cloudscraper, caches raw HTML, and raises a typed error on a challenge. Fetched HTML is injected into the existing `procyclingstats` package parsers (proven pattern: `Stage(path, html=html, update_html=False)`), scored by a pure `scoring` module, and exposed to roster entry through a guided CLI (`draft.py`) and a `/draft` skill. Rosters live in `data/rosters.json` as effective-dated stints (Option B).

**Tech Stack:** Python 3.11 (pinned via `.python-version`; dev venv `.venv`), `cloudscraper`, `procyclingstats` (parsers only), `pytest` (dev), optional `playwright` (fallback fetch tier).

## Global Constraints

- **No Streamlit imports in new modules.** `pcs_fetch`, `pcs_parse`, `scoring`, `roster_store`, `rider_resolver`, `generator`, `verify` must import cleanly without `streamlit` so they run in the CLI, tests, and the future data generator.
- **All PCS HTTP goes through `pcs_fetch.get_html(path)`.** No module calls `cloudscraper`, `requests`, the `procyclingstats` network fetch, or Playwright directly except `pcs_fetch`.
- **Inject HTML into package parsers** with `Scraper(url, html=html, update_html=False)` — never let the package make its own request (it gets Cloudflare-challenged).
- **Rider slug is authoritative**; `name`/`team` are cached for display only.
- **Roster invariant:** exactly 3 active riders per participant at every stage `1..total_stages`.
- **PCS base URL:** `https://www.procyclingstats.com/` — paths are relative (e.g. `race/tour-de-france/2025/stage-21`, `rider/tadej-pogacar`).
- **Be polite to PCS:** cache-first, rate-limited; PCS is a free community site.
- Run tests with the dev venv: `. .venv/bin/activate && pytest`.

---

### Task 1: Test scaffolding + pure time helpers (`pcs_time.py`)

Establishes the pytest setup and extracts the two time-conversion helpers out of the Streamlit-coupled `api_client.py` into a pure module both the old app and the new pipeline can share (DRY).

**Files:**
- Create: `pcs_time.py`
- Create: `requirements-dev.txt`
- Create: `tests/__init__.py` (empty)
- Create: `tests/test_pcs_time.py`
- Modify: `api_client.py` (lines 14–60: replace the two function bodies with an import)

**Interfaces:**
- Produces: `time_str_to_seconds(time_str: str) -> int`, `seconds_to_time_str(seconds: int) -> str`

- [ ] **Step 1: Create the dev requirements file**

`requirements-dev.txt`:
```
pytest>=8.0.0
cloudscraper>=1.2.71
```

- [ ] **Step 2: Install dev deps into the venv**

Run:
```bash
python3 -m venv .venv 2>/dev/null; . .venv/bin/activate && pip install -q -r requirements.txt -r requirements-dev.txt
```
Expected: installs succeed (procyclingstats, cloudscraper, pytest present).

- [ ] **Step 3: Write the failing test**

`tests/__init__.py`: empty file.

`tests/test_pcs_time.py`:
```python
from pcs_time import time_str_to_seconds, seconds_to_time_str


def test_hms_to_seconds():
    assert time_str_to_seconds("1:02:03") == 3723
    assert time_str_to_seconds("76:00:32") == 273632


def test_zero_and_garbage():
    assert time_str_to_seconds("0:00:00") == 0
    assert time_str_to_seconds("") == 0
    assert time_str_to_seconds("not a time") == 0


def test_seconds_to_str_roundtrip():
    assert seconds_to_time_str(3723) == "1:02:03"
    assert seconds_to_time_str(0) == "0:00:00"
    assert time_str_to_seconds(seconds_to_time_str(273632)) == 273632
```

- [ ] **Step 4: Run test to verify it fails**

Run: `. .venv/bin/activate && pytest tests/test_pcs_time.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'pcs_time'`

- [ ] **Step 5: Create `pcs_time.py`**

```python
"""Pure time-conversion helpers shared by the app and the data pipeline.

No Streamlit / network imports — safe to use anywhere.
"""


def time_str_to_seconds(time_str: str) -> int:
    """Convert 'H:MM:SS' / 'HH:MM:SS' to integer seconds (0 on bad input)."""
    try:
        if not time_str or time_str == "0:00:00":
            return 0
        parts = time_str.split(":")
        if len(parts) != 3:
            return 0
        hours, minutes, seconds = (int(parts[0]), int(parts[1]), int(parts[2]))
        return hours * 3600 + minutes * 60 + seconds
    except Exception:
        return 0


def seconds_to_time_str(seconds: int) -> str:
    """Convert integer seconds to 'H:MM:SS'."""
    if seconds == 0:
        return "0:00:00"
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    secs = seconds % 60
    return f"{hours}:{minutes:02d}:{secs:02d}"
```

- [ ] **Step 6: Run test to verify it passes**

Run: `. .venv/bin/activate && pytest tests/test_pcs_time.py -v`
Expected: PASS (3 passed)

- [ ] **Step 7: Point `api_client.py` at the shared helpers (DRY)**

In `api_client.py`, delete the two function definitions `def time_str_to_seconds(...)` and `def seconds_to_time_str(...)` (lines 14–60) and add this import near the other imports at the top of the file (after line 11):
```python
from pcs_time import time_str_to_seconds, seconds_to_time_str
```

- [ ] **Step 8: Verify the Streamlit app still imports**

Run: `. .venv/bin/activate && python -c "import pcs_time; print('ok')"`
Expected: `ok` (we only assert the pure module imports; `api_client` imports Streamlit, which is fine — its import is unchanged in behavior).

- [ ] **Step 9: Commit**

```bash
git add pcs_time.py requirements-dev.txt tests/__init__.py tests/test_pcs_time.py api_client.py
git commit -m "feat: extract pure time helpers into pcs_time; add pytest scaffolding

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: PCS fetch seam (`pcs_fetch.py`)

The single seam for all PCS HTTP. Tier 1 = fresh cache, Tier 2 = cloudscraper, raise `PCSBlockedError` if a Cloudflare challenge comes back. (The Playwright tier is added in Task 11.)

**Files:**
- Create: `pcs_fetch.py`
- Create: `tests/test_pcs_fetch.py`
- Create: `tests/fixtures/challenge.html`
- Modify: `.gitignore` (add cache dir)
- Modify: `requirements.txt` (add cloudscraper)

**Interfaces:**
- Produces:
  - `PCSBlockedError(Exception)`
  - `is_challenge(html: str) -> bool`
  - `cache_path(path: str) -> pathlib.Path`
  - `get_html(path: str, *, max_age_seconds: int = 21600, force: bool = False) -> str`

- [ ] **Step 1: Add the cache dir to `.gitignore`**

Append to `.gitignore`:
```
# PCS raw-HTML cache
.pcs_cache/
```

- [ ] **Step 2: Add cloudscraper to prod requirements**

In `requirements.txt`, add a line:
```
cloudscraper>=1.2.71
```

- [ ] **Step 3: Create a Cloudflare challenge fixture**

`tests/fixtures/challenge.html` (a trimmed real challenge page — the markers are what matter):
```html
<!DOCTYPE html><html lang="en-US"><head><title>Just a moment...</title>
<meta http-equiv="refresh" content="360"></head><body>
<script>window._cf_chl_opt={cFPWv:'g'};</script>
<noscript>Enable JavaScript and cookies to continue</noscript>
</body></html>
```

- [ ] **Step 4: Write the failing test**

`tests/test_pcs_fetch.py`:
```python
import pathlib
import pcs_fetch


FIX = pathlib.Path(__file__).parent / "fixtures"


def test_is_challenge_detects_cloudflare():
    html = (FIX / "challenge.html").read_text()
    assert pcs_fetch.is_challenge(html) is True


def test_is_challenge_passes_real_page():
    assert pcs_fetch.is_challenge("<html><title>Tadej Pogačar</title><table>...</table></html>") is False


def test_cache_path_is_slugified_under_cache_dir():
    p = pcs_fetch.cache_path("race/tour-de-france/2025/stage-21")
    assert p.suffix == ".html"
    assert ".pcs_cache" in str(p)
    # no path separators from the PCS path leak into a directory tree
    assert p.parent.name == ".pcs_cache"


def test_get_html_returns_fresh_cache_without_network(tmp_path, monkeypatch):
    # Point the cache at a temp dir and pre-seed a cache file.
    monkeypatch.setattr(pcs_fetch, "CACHE_DIR", tmp_path)

    def boom(path):  # network must NOT be called when cache is fresh
        raise AssertionError("network called despite fresh cache")

    monkeypatch.setattr(pcs_fetch, "_fetch_cloudscraper", boom)
    path = "rider/tadej-pogacar"
    pcs_fetch.cache_path(path).write_text("<html>cached</html>")
    assert pcs_fetch.get_html(path) == "<html>cached</html>"
```

- [ ] **Step 5: Run test to verify it fails**

Run: `. .venv/bin/activate && pytest tests/test_pcs_fetch.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'pcs_fetch'`

- [ ] **Step 6: Create `pcs_fetch.py`**

```python
"""The single seam for all procyclingstats HTTP.

Tiers: fresh cache -> cloudscraper -> (Playwright, added later) -> PCSBlockedError.
Every successful fetch is cached as raw HTML keyed by the PCS path.
"""
import pathlib
import time

BASE_URL = "https://www.procyclingstats.com/"
CACHE_DIR = pathlib.Path(__file__).parent / ".pcs_cache"
_RATE_LIMIT_SECONDS = 2.0
_last_fetch_at = 0.0
_scraper = None


class PCSBlockedError(Exception):
    """Raised when PCS returns a Cloudflare challenge (or is otherwise unreachable)."""


def is_challenge(html: str) -> bool:
    """True if the HTML is a Cloudflare interstitial rather than real content."""
    if not html or len(html) < 200:
        return True
    markers = ("Just a moment", "_cf_chl_opt", "Enable JavaScript and cookies")
    return any(m in html for m in markers)


def cache_path(path: str) -> pathlib.Path:
    slug = path.strip("/").replace("/", "__").replace("?", "_").replace("&", "_")
    return CACHE_DIR / f"{slug}.html"


def _fetch_cloudscraper(path: str) -> str:
    """Fetch one page via cloudscraper with polite rate limiting."""
    global _scraper, _last_fetch_at
    import cloudscraper
    if _scraper is None:
        _scraper = cloudscraper.create_scraper()
    wait = _RATE_LIMIT_SECONDS - (time.monotonic() - _last_fetch_at)
    if wait > 0:
        time.sleep(wait)
    resp = _scraper.get(BASE_URL + path.strip("/"), timeout=30)
    _last_fetch_at = time.monotonic()
    return resp.text


def get_html(path: str, *, max_age_seconds: int = 21600, force: bool = False) -> str:
    """Return trustworthy HTML for a PCS path, or raise PCSBlockedError.

    max_age_seconds: serve cache younger than this (default 6h). force re-fetches.
    """
    cp = cache_path(path)
    if not force and cp.exists():
        age = time.time() - cp.stat().st_mtime
        if age < max_age_seconds:
            return cp.read_text(encoding="utf-8")

    html = _fetch_cloudscraper(path)
    if is_challenge(html):
        raise PCSBlockedError(
            f"Cloudflare challenge for '{path}'. Tried: cloudscraper. "
            "Run from a residential network, or enable the Playwright fallback tier."
        )

    CACHE_DIR.mkdir(exist_ok=True)
    cp.write_text(html, encoding="utf-8")
    return html
```

- [ ] **Step 7: Run test to verify it passes**

Run: `. .venv/bin/activate && pytest tests/test_pcs_fetch.py -v`
Expected: PASS (4 passed)

- [ ] **Step 8: Commit**

```bash
git add pcs_fetch.py tests/test_pcs_fetch.py tests/fixtures/challenge.html .gitignore requirements.txt
git commit -m "feat: pcs_fetch seam — cloudscraper + raw-HTML cache + challenge detection

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: PCS parsing via package reuse (`pcs_parse.py`)

Inject `pcs_fetch` HTML into the `procyclingstats` parsers. Two functions: stage GC (keyed by rider_url, mirrors the app's existing shape) and rider profile (for the resolver). Tests run offline against committed fixtures captured from the live site.

**Files:**
- Create: `pcs_parse.py`
- Create: `tests/test_pcs_parse.py`
- Create: `tests/fixtures/stage-21-gc.html` (captured)
- Create: `tests/fixtures/rider-pogacar.html` (captured)
- Create: `scripts/capture_fixtures.py` (one-off helper)

**Interfaces:**
- Consumes: `pcs_fetch.get_html`
- Produces:
  - `parse_stage_gc(html: str) -> dict[str, dict]` — keyed by `rider_url`; each value has at least `rider_url`, `rider_name`, `team_name`, `rank`, `time`
  - `parse_rider(slug: str, html: str) -> dict` — `{"slug", "name", "team"}`
  - `fetch_stage_gc(race_url: str, stage_number: int) -> dict[str, dict]` (composes fetch + parse)
  - `fetch_rider(slug: str) -> dict` (composes fetch + parse)

- [ ] **Step 1: Capture fixtures from the live site (network; run once)**

`scripts/capture_fixtures.py`:
```python
"""One-off: capture real PCS HTML into tests/fixtures for offline parser tests."""
import pathlib
import pcs_fetch

OUT = pathlib.Path(__file__).parent.parent / "tests" / "fixtures"
TARGETS = {
    "stage-21-gc.html": "race/tour-de-france/2025/stage-21",
    "rider-pogacar.html": "rider/tadej-pogacar",
}
OUT.mkdir(parents=True, exist_ok=True)
for name, path in TARGETS.items():
    html = pcs_fetch.get_html(path, force=True)
    (OUT / name).write_text(html, encoding="utf-8")
    print(f"wrote {name} ({len(html)} bytes)")
```

Run (sandbox/network must be available; expect a residential network):
```bash
. .venv/bin/activate && python scripts/capture_fixtures.py
```
Expected: `wrote stage-21-gc.html (~650000 bytes)` and `wrote rider-pogacar.html (~45000 bytes)`. If this raises `PCSBlockedError`, run it from a residential network — the committed fixtures then make all parser tests reproducible offline.

- [ ] **Step 2: Write the failing test**

`tests/test_pcs_parse.py`:
```python
import pathlib
import pcs_parse

FIX = pathlib.Path(__file__).parent / "fixtures"


def test_parse_stage_gc_keys_by_rider_url_with_leader():
    html = (FIX / "stage-21-gc.html").read_text()
    gc = pcs_parse.parse_stage_gc(html)
    assert "rider/tadej-pogacar" in gc
    leader = gc["rider/tadej-pogacar"]
    assert leader["rank"] == 1
    assert leader["rider_name"]  # non-empty
    assert ":" in leader["time"]  # H:MM:SS-ish


def test_parse_rider_returns_slug_name_team():
    html = (FIX / "rider-pogacar.html").read_text()
    r = pcs_parse.parse_rider("rider/tadej-pogacar", html)
    assert r["slug"] == "rider/tadej-pogacar"
    assert "Poga" in r["name"]
    assert r["team"]  # non-empty current team
```

- [ ] **Step 3: Run test to verify it fails**

Run: `. .venv/bin/activate && pytest tests/test_pcs_parse.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'pcs_parse'`

- [ ] **Step 4: Create `pcs_parse.py`**

```python
"""Parse PCS pages by injecting pcs_fetch HTML into procyclingstats parsers.

The package's own fetch is Cloudflare-blocked; we hand it HTML instead via
Scraper(url, html=html, update_html=False), which reuses all its table logic.
"""
from procyclingstats import Stage, Rider
import pcs_fetch


def parse_stage_gc(html: str) -> dict:
    """Return GC keyed by rider_url. Empty dict if the page has no GC table."""
    stage = Stage("race/_/stage-1", html=html, update_html=False)
    data = stage.parse()
    gc_dict = {}
    for entry in (data.get("gc") or []):
        rider_url = entry.get("rider_url")
        if rider_url:
            gc_dict[rider_url] = entry
    return gc_dict


def parse_rider(slug: str, html: str) -> dict:
    """Return {slug, name, team} from a rider page.

    The procyclingstats Rider class has no current-team method; the current
    team is the most recent season in teams_history().
    """
    rider = Rider(slug, html=html, update_html=False)
    history = rider.teams_history() or []
    team = max(history, key=lambda t: t["season"])["team_name"] if history else ""
    return {"slug": slug, "name": rider.name(), "team": team}


def fetch_stage_gc(race_url: str, stage_number: int) -> dict:
    """Fetch + parse a stage GC. race_url e.g. 'race/tour-de-france/2025'."""
    html = pcs_fetch.get_html(f"{race_url}/stage-{stage_number}")
    return parse_stage_gc(html)


def fetch_rider(slug: str) -> dict:
    """Fetch + parse a rider page."""
    html = pcs_fetch.get_html(slug)
    return parse_rider(slug, html)
```

- [ ] **Step 5: Run test to verify it passes**

Run: `. .venv/bin/activate && pytest tests/test_pcs_parse.py -v`
Expected: PASS (2 passed). `parse_rider` reads the current team from the most recent `teams_history()` season; for Pogačar this is "UAE Team Emirates - XRG".

- [ ] **Step 6: Commit (fixtures included so tests are reproducible offline)**

```bash
git add pcs_parse.py tests/test_pcs_parse.py tests/fixtures/stage-21-gc.html tests/fixtures/rider-pogacar.html scripts/capture_fixtures.py
git commit -m "feat: pcs_parse — inject cloudscraper HTML into procyclingstats parsers

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Pure scoring (`scoring.py`)

Compute team standings from active riders + a GC dict, and format the result into the shape the React app's `sampleData.js` `teams` array uses (the contract for the future generator).

**Files:**
- Create: `scoring.py`
- Create: `tests/test_scoring.py`

**Interfaces:**
- Consumes: `pcs_time.time_str_to_seconds`, `pcs_time.seconds_to_time_str`
- Produces:
  - `compute_standings(active_by_participant: dict[str, list[str]], gc_dict: dict) -> list[dict]` — sorted ascending by total time; each dict has `name, position, total_time_seconds, total_time, gap, riders_counted, total_riders, riders` where `riders` is a list of `{name, gc, time, proTeam, slug, counted}`.
  - `format_for_app(standings: list[dict]) -> list[dict]` — `teams` array: each `{name, rank, total, gap, leader, last, riders:[{name, gc, time, proTeam}]}`.

- [ ] **Step 1: Write the failing test**

`tests/test_scoring.py`:
```python
import scoring


GC = {
    "rider/a": {"rider_name": "Rider A", "team_name": "Team X", "rank": 1, "time": "10:00:00"},
    "rider/b": {"rider_name": "Rider B", "team_name": "Team Y", "rank": 2, "time": "10:05:00"},
    "rider/c": {"rider_name": "Rider C", "team_name": "Team Z", "rank": 3, "time": "10:10:00"},
}


def test_compute_standings_sorts_and_gaps():
    active = {"Nate": ["rider/a", "rider/b"], "Leo": ["rider/b", "rider/c"]}
    s = scoring.compute_standings(active, GC)
    assert [t["name"] for t in s] == ["Nate", "Leo"]      # Nate lower total -> rank 1
    assert s[0]["position"] == 1 and s[0]["gap"] == "Leader"
    assert s[1]["gap"].startswith("+")
    assert s[0]["riders_counted"] == 2


def test_missing_rider_marked_not_counted():
    active = {"Solo": ["rider/a", "rider/missing"]}
    s = scoring.compute_standings(active, GC)
    team = s[0]
    assert team["riders_counted"] == 1 and team["total_riders"] == 2
    missing = [r for r in team["riders"] if not r["counted"]][0]
    assert missing["time"] == "DNF"


def test_format_for_app_shape_matches_sampledata():
    active = {"Nate": ["rider/a"], "Leo": ["rider/b"]}
    teams = scoring.format_for_app(scoring.compute_standings(active, GC))
    t0 = teams[0]
    assert set(["name", "rank", "total", "gap", "leader", "last", "riders"]).issubset(t0)
    assert t0["leader"] is True and teams[-1]["last"] is True
    r0 = t0["riders"][0]
    assert set(["name", "gc", "time", "proTeam"]).issubset(r0)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `. .venv/bin/activate && pytest tests/test_scoring.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'scoring'`

- [ ] **Step 3: Create `scoring.py`**

```python
"""Pure fantasy scoring: active riders + GC dict -> ranked standings.

Lower summed cumulative GC time wins (real cycling). No Streamlit / network.
"""
from pcs_time import time_str_to_seconds, seconds_to_time_str


def compute_standings(active_by_participant: dict, gc_dict: dict) -> list:
    rows = []
    for participant, slugs in active_by_participant.items():
        total = 0
        counted = 0
        riders = []
        for slug in slugs:
            entry = gc_dict.get(slug)
            secs = time_str_to_seconds(entry["time"]) if entry else 0
            if entry and secs > 0:
                total += secs
                counted += 1
                riders.append({
                    "name": entry.get("rider_name", "Unknown"),
                    "gc": entry.get("rank", "-"),
                    "time": entry.get("time", "0:00:00"),
                    "proTeam": entry.get("team_name", "Unknown"),
                    "slug": slug,
                    "counted": True,
                })
            else:
                riders.append({
                    "name": slug.split("/")[-1].replace("-", " ").title(),
                    "gc": "-", "time": "DNF", "proTeam": "Unknown",
                    "slug": slug, "counted": False,
                })
        rows.append({
            "name": participant,
            "total_time_seconds": total,
            "total_time": seconds_to_time_str(total),
            "riders_counted": counted,
            "total_riders": len(slugs),
            "riders": riders,
        })

    rows.sort(key=lambda r: r["total_time_seconds"])
    leader = rows[0]["total_time_seconds"] if rows else 0
    for i, row in enumerate(rows):
        row["position"] = i + 1
        gap = row["total_time_seconds"] - leader
        row["gap"] = "Leader" if gap == 0 else f"+{seconds_to_time_str(gap)}"
    return rows


def format_for_app(standings: list) -> list:
    """Map standings to the React sampleData `teams` shape (derivable fields only).

    UI-enrichment fields (move, d, role, nat, age, form, gapGC) require daily
    snapshots / rider pages and are the next session's job.
    """
    n = len(standings)
    teams = []
    for row in standings:
        teams.append({
            "name": row["name"],
            "rank": row["position"],
            "total": row["total_time"],
            "gap": row["gap"],
            "leader": row["position"] == 1,
            "last": row["position"] == n,
            "riders": [
                {"name": r["name"], "gc": r["gc"], "time": r["time"], "proTeam": r["proTeam"]}
                for r in row["riders"]
            ],
        })
    return teams
```

- [ ] **Step 4: Run test to verify it passes**

Run: `. .venv/bin/activate && pytest tests/test_scoring.py -v`
Expected: PASS (3 passed)

- [ ] **Step 5: Commit**

```bash
git add scoring.py tests/test_scoring.py
git commit -m "feat: pure scoring + format_for_app contract matching sampleData teams shape

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: TDF 2025 end-to-end de-risk milestone (`verify.py`)

The load-bearing proof: real fetch → parse → score on **complete TDF 2025 data**, using the rosters already in `races_config.py`. Surfaces real slug mismatches (e.g. `rider/ben-o-connor` vs PCS `rider/ben-oconnor`) by reporting `riders_counted` per team. Also asserts the app-contract shape.

**Files:**
- Create: `verify.py`
- Create: `tests/test_verify_contract.py`

**Interfaces:**
- Consumes: `pcs_parse.fetch_stage_gc`, `scoring.compute_standings`, `scoring.format_for_app`, `pcs_fetch.PCSBlockedError`, `races_config.TEAM_ROSTERS` (static dict — not the Sheets-coupled `get_team_rosters`)
- Produces:
  - `preflight() -> bool` (True if PCS reachable; prints actionable message and returns False on `PCSBlockedError`)
  - `run_2025_end_to_end() -> dict` — `{"standings": [...], "teams": [...], "warnings": [list of "Team: counted X/Y"]}`
  - `main()` CLI entry

- [ ] **Step 1: Write the failing contract test**

`tests/test_verify_contract.py`:
```python
import scoring


def test_app_teams_contract_is_stable():
    # Frozen contract: the keys the future data.json generator must emit.
    gc = {"rider/x": {"rider_name": "X", "team_name": "T", "rank": 1, "time": "5:00:00"}}
    teams = scoring.format_for_app(scoring.compute_standings({"P": ["rider/x"]}, gc))
    assert teams and set(teams[0]) == {"name", "rank", "total", "gap", "leader", "last", "riders"}
    assert set(teams[0]["riders"][0]) == {"name", "gc", "time", "proTeam"}
```

- [ ] **Step 2: Run test to verify it fails, then passes**

Run: `. .venv/bin/activate && pytest tests/test_verify_contract.py -v`
Expected: this passes immediately if Task 4 is done correctly (it pins the contract). If it FAILS, fix `format_for_app` keys to match exactly. (This is a guard test; no new impl needed.)

- [ ] **Step 3: Create `verify.py`**

```python
"""Pre-race verification + the TDF 2025 end-to-end proof.

Run: python verify.py
"""
import sys
import pcs_fetch
import pcs_parse
import scoring
from races_config import TEAM_ROSTERS, get_race_config


def preflight() -> bool:
    try:
        pcs_fetch.get_html("rider/tadej-pogacar")
        print("✓ PCS reachable")
        return True
    except pcs_fetch.PCSBlockedError as e:
        print(f"✗ PCS unreachable: {e}")
        return False


def run_2025_end_to_end() -> dict:
    race = get_race_config("tdf-2025")
    # Static committed rosters — NOT get_team_rosters(), which routes through the
    # Streamlit-/Google-Sheets-coupled loader and pollutes this pure pipeline.
    rosters = TEAM_ROSTERS["tdf-2025"]  # {participant: [slug,...]}
    stage = race["total_stages"]
    gc = pcs_parse.fetch_stage_gc(race["race_url"], stage)
    standings = scoring.compute_standings(rosters, gc)
    teams = scoring.format_for_app(standings)
    warnings = [
        f"{r['name']}: counted {r['riders_counted']}/{r['total_riders']}"
        for r in standings if r["riders_counted"] < r["total_riders"]
    ]
    return {"standings": standings, "teams": teams, "warnings": warnings}


def main() -> int:
    if not preflight():
        return 1
    print("\nTDF 2025 final standings (end-to-end):")
    result = run_2025_end_to_end()
    for r in result["standings"]:
        print(f"  {r['position']}. {r['name']:10s} {r['total_time']:>11s}  {r['gap']}")
    if result["warnings"]:
        print("\n⚠ Roster slug mismatches (rider not found in GC):")
        for w in result["warnings"]:
            print(f"   {w}")
    else:
        print("\n✓ All rosters fully resolved against the GC")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 4: Run the milestone manually (network)**

Run: `. .venv/bin/activate && python verify.py`
Expected: prints `✓ PCS reachable`, then a ranked 2025 standings table with real times, then either all-resolved or a list of slug mismatches. This is the proof the data path works end-to-end. If it raises `PCSBlockedError`, re-run from a residential network.

- [ ] **Step 5: Commit**

```bash
git add verify.py tests/test_verify_contract.py
git commit -m "feat: verify.py — TDF 2025 end-to-end proof + frozen app-teams contract

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Effective-dated roster store (`roster_store.py`)

Option B storage + the 3-active invariant. Pure and fully offline-testable.

**Files:**
- Create: `roster_store.py`
- Create: `data/rosters.json` (seed with empty `tdf-2026`)
- Create: `tests/test_roster_store.py`

**Interfaces:**
- Produces:
  - `load(race_id: str, path: str = "data/rosters.json") -> dict` — `{participant: [stint,...]}`; stint = `{"slug","name","team","from_stage", optional "to_stage"}`
  - `save(race_id: str, roster: dict, path: str = "data/rosters.json") -> None`
  - `active_riders(roster: dict, stage: int) -> dict[str, list[str]]` — participant -> active slugs at that stage
  - `add_rider(roster, participant, stint) -> None`
  - `swap_rider(roster, participant, out_slug, in_stint, effective_stage) -> None`
  - `validate(roster, total_stages) -> list[str]` — list of human-readable violations ([] = valid)

- [ ] **Step 1: Seed the data file**

`data/rosters.json`:
```json
{
  "tdf-2026": {}
}
```

- [ ] **Step 2: Write the failing test**

`tests/test_roster_store.py`:
```python
import json
import roster_store as rs


def _team():
    return {
        "Aaron": [
            {"slug": "rider/tadej-pogacar", "name": "Tadej Pogačar", "team": "UAE", "from_stage": 1},
            {"slug": "rider/matteo-jorgenson", "name": "Matteo Jorgenson", "team": "Visma", "from_stage": 1},
            {"slug": "rider/ben-oconnor", "name": "Ben O'Connor", "team": "Jayco", "from_stage": 1},
        ]
    }


def test_active_riders_before_swap():
    active = rs.active_riders(_team(), 5)
    assert sorted(active["Aaron"]) == sorted(
        ["rider/tadej-pogacar", "rider/matteo-jorgenson", "rider/ben-oconnor"]
    )


def test_swap_closes_old_opens_new_and_keeps_history():
    roster = _team()
    rs.swap_rider(roster, "Aaron", "rider/matteo-jorgenson",
                  {"slug": "rider/joao-almeida", "name": "João Almeida", "team": "UAE"},
                  effective_stage=12)
    # Stage 11: old rider still active; stage 12: new rider active
    assert "rider/matteo-jorgenson" in rs.active_riders(roster, 11)["Aaron"]
    assert "rider/matteo-jorgenson" not in rs.active_riders(roster, 12)["Aaron"]
    assert "rider/joao-almeida" in rs.active_riders(roster, 12)["Aaron"]
    assert len(rs.active_riders(roster, 12)["Aaron"]) == 3


def test_validate_flags_wrong_active_count():
    roster = {"Aaron": _team()["Aaron"][:2]}  # only 2 active
    violations = rs.validate(roster, total_stages=21)
    assert any("Aaron" in v and "stage 1" in v for v in violations)


def test_validate_passes_clean_team():
    assert rs.validate(_team(), total_stages=21) == []


def test_save_and_load_roundtrip(tmp_path):
    p = tmp_path / "r.json"
    rs.save("tdf-2026", _team(), path=str(p))
    loaded = rs.load("tdf-2026", path=str(p))
    assert loaded["Aaron"][0]["slug"] == "rider/tadej-pogacar"
    assert json.loads(p.read_text())["tdf-2026"]["Aaron"]
```

- [ ] **Step 3: Run test to verify it fails**

Run: `. .venv/bin/activate && pytest tests/test_roster_store.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'roster_store'`

- [ ] **Step 4: Create `roster_store.py`**

```python
"""Effective-dated roster storage (Option B).

A participant maps to a list of rider *stints*. A stint is active at stage N when
from_stage <= N <= (to_stage or +inf). Invariant: exactly 3 active per stage.
"""
import json
import pathlib

DEFAULT_PATH = "data/rosters.json"


def load(race_id: str, path: str = DEFAULT_PATH) -> dict:
    data = json.loads(pathlib.Path(path).read_text(encoding="utf-8"))
    return data.get(race_id, {})


def save(race_id: str, roster: dict, path: str = DEFAULT_PATH) -> None:
    p = pathlib.Path(path)
    data = json.loads(p.read_text(encoding="utf-8")) if p.exists() else {}
    data[race_id] = roster
    p.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def _active(stint: dict, stage: int) -> bool:
    if stage < stint["from_stage"]:
        return False
    to = stint.get("to_stage")
    return to is None or stage <= to


def active_riders(roster: dict, stage: int) -> dict:
    return {
        participant: [s["slug"] for s in stints if _active(s, stage)]
        for participant, stints in roster.items()
    }


def add_rider(roster: dict, participant: str, stint: dict) -> None:
    roster.setdefault(participant, []).append(stint)


def swap_rider(roster: dict, participant: str, out_slug: str,
               in_stint: dict, effective_stage: int) -> None:
    """Close the outgoing rider at effective_stage-1, open the incoming at effective_stage."""
    stints = roster[participant]
    for s in stints:
        if s["slug"] == out_slug and s.get("to_stage") is None:
            s["to_stage"] = effective_stage - 1
            break
    else:
        raise ValueError(f"No open stint for {out_slug} on {participant}")
    new = dict(in_stint)
    new["from_stage"] = effective_stage
    stints.append(new)


def validate(roster: dict, total_stages: int) -> list:
    violations = []
    for participant, stints in roster.items():
        for stint in stints:
            frm = stint["from_stage"]
            to = stint.get("to_stage", total_stages)
            if not (1 <= frm <= total_stages) or not (1 <= to <= total_stages) or to < frm:
                violations.append(f"{participant}: bad stage range on {stint['slug']}")
        for stage in range(1, total_stages + 1):
            active = [s["slug"] for s in stints if _active(s, stage)]
            if len(active) != 3:
                violations.append(
                    f"{participant}: {len(active)} active riders at stage {stage} (need 3)"
                )
            if len(set(active)) != len(active):
                violations.append(f"{participant}: duplicate active rider at stage {stage}")
    return violations
```

- [ ] **Step 5: Run test to verify it passes**

Run: `. .venv/bin/activate && pytest tests/test_roster_store.py -v`
Expected: PASS (5 passed)

- [ ] **Step 6: Commit**

```bash
git add roster_store.py data/rosters.json tests/test_roster_store.py
git commit -m "feat: effective-dated roster store (Option B) with 3-active invariant

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Rider resolver (`rider_resolver.py`)

Turn a typed name into a validated `{slug, name, team}` by deriving a candidate slug and confirming it against the live rider page. Normalization is pure/offline-tested; resolution is an integration test (skippable).

**Files:**
- Create: `rider_resolver.py`
- Create: `tests/test_rider_resolver.py`

**Interfaces:**
- Consumes: `pcs_parse.fetch_rider`, `pcs_fetch.PCSBlockedError`
- Produces:
  - `slugify_name(query: str) -> str` — e.g. `"Tadej Pogačar"` -> `"tadej-pogacar"`
  - `resolve_rider(query: str) -> dict | None` — `{"slug","name","team"}` if a rider page resolves; `None` if not found. Accepts an already-formed slug (`rider/...` or bare slug).

- [ ] **Step 1: Write the failing test**

`tests/test_rider_resolver.py`:
```python
import rider_resolver as rr


def test_slugify_handles_accents_and_punctuation():
    assert rr.slugify_name("Tadej Pogačar") == "tadej-pogacar"
    # Apostrophes follow PCS convention: O'Connor -> o-connor (separator, not deleted)
    assert rr.slugify_name("Ben O'Connor") == "ben-o-connor"
    assert rr.slugify_name("  Jonas   Vingegaard ") == "jonas-vingegaard"


def test_resolve_accepts_existing_slug(monkeypatch):
    def fake_fetch_rider(slug):
        return {"slug": slug, "name": "Tadej Pogačar", "team": "UAE Team Emirates"}
    monkeypatch.setattr(rr.pcs_parse, "fetch_rider", fake_fetch_rider)
    out = rr.resolve_rider("rider/tadej-pogacar")
    assert out["slug"] == "rider/tadej-pogacar" and out["name"] == "Tadej Pogačar"


def test_resolve_returns_none_when_page_missing(monkeypatch):
    def boom(slug):
        raise ValueError("Given HTML is invalid.")
    monkeypatch.setattr(rr.pcs_parse, "fetch_rider", boom)
    assert rr.resolve_rider("rider/not-a-real-person") is None
```

- [ ] **Step 2: Run test to verify it fails**

Run: `. .venv/bin/activate && pytest tests/test_rider_resolver.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'rider_resolver'`

- [ ] **Step 3: Create `rider_resolver.py`**

```python
"""Resolve a typed rider name to a validated {slug, name, team} via the PCS rider page."""
import re
import unicodedata
import pcs_parse
import pcs_fetch


def slugify_name(query: str) -> str:
    # Strip accents (Pogačar -> pogacar), then turn every run of non-alphanumeric
    # characters — spaces, apostrophes, periods — into a single hyphen, matching
    # PCS slug convention (O'Connor -> o-connor). Letters like ø/ł that NFKD does
    # not decompose won't map; the caller falls back to pasting the rider/<slug>.
    norm = unicodedata.normalize("NFKD", query)
    norm = "".join(c for c in norm if not unicodedata.combining(c))
    norm = re.sub(r"[^a-z0-9]+", "-", norm.lower()).strip("-")
    return norm


def resolve_rider(query: str) -> dict | None:
    """Return {slug, name, team} or None if no rider page resolves."""
    q = query.strip()
    if q.startswith("rider/"):
        slug = q
    elif "/" not in q and "-" in q and " " not in q:
        slug = f"rider/{q}"           # already a bare slug like 'tadej-pogacar'
    else:
        slug = f"rider/{slugify_name(q)}"
    try:
        return pcs_parse.fetch_rider(slug)
    except (ValueError, pcs_fetch.PCSBlockedError):
        return None
```

- [ ] **Step 4: Run test to verify it passes**

Run: `. .venv/bin/activate && pytest tests/test_rider_resolver.py -v`
Expected: PASS (3 passed)

- [ ] **Step 5: Manual integration sanity check (network)**

Run:
```bash
. .venv/bin/activate && python -c "import rider_resolver as rr; print(rr.resolve_rider('vingegaard')); print(rr.resolve_rider('Pogacar'))"
```
Expected: both print a dict with the correct `rider/...` slug and name. (Skippable if PCS is blocked.)

- [ ] **Step 6: Commit**

```bash
git add rider_resolver.py tests/test_rider_resolver.py
git commit -m "feat: rider_resolver — typed name -> validated PCS slug

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Race-aware generator + verify roster-slug mode (`generator.py`)

Composes the store + fetch + parse + scoring into one race-aware call (the path the future `data.json` session consumes), and adds slug validation of the stored roster to `verify.py`.

**Files:**
- Create: `generator.py`
- Modify: `verify.py` (add `validate_roster_slugs` + wire into `main`)
- Create: `tests/test_generator.py`

**Interfaces:**
- Consumes: `roster_store.load`, `roster_store.active_riders`, `pcs_parse.fetch_stage_gc`, `scoring.compute_standings`, `scoring.format_for_app`, `races_config.get_race_config`
- Produces:
  - `generate_standings(race_id: str, stage: int) -> dict` — `{"standings", "teams", "stage", "race_id"}`
  - (verify) `validate_roster_slugs(race_id: str) -> list[str]` — slugs that don't resolve

- [ ] **Step 1: Write the failing test**

`tests/test_generator.py`:
```python
import generator


def test_generate_standings_uses_active_roster(monkeypatch):
    roster = {"Aaron": [
        {"slug": "rider/a", "from_stage": 1, "to_stage": 5},
        {"slug": "rider/b", "from_stage": 6},
        {"slug": "rider/c", "from_stage": 1},
        {"slug": "rider/d", "from_stage": 1},
    ]}
    gc = {
        "rider/a": {"rider_name": "A", "team_name": "T", "rank": 1, "time": "10:00:00"},
        "rider/b": {"rider_name": "B", "team_name": "T", "rank": 2, "time": "10:01:00"},
        "rider/c": {"rider_name": "C", "team_name": "T", "rank": 3, "time": "10:02:00"},
        "rider/d": {"rider_name": "D", "team_name": "T", "rank": 4, "time": "10:03:00"},
    }
    monkeypatch.setattr(generator.roster_store, "load", lambda race_id: roster)
    monkeypatch.setattr(generator.pcs_parse, "fetch_stage_gc", lambda race_url, stage: gc)
    monkeypatch.setattr(generator, "_race_url", lambda race_id: "race/x/2026")

    out = generator.generate_standings("tdf-2026", stage=8)
    # At stage 8, active = b, c, d (a was swapped out at stage 5)
    slugs = [r["slug"] for r in out["standings"][0]["riders"]]
    assert "rider/a" not in slugs and "rider/b" in slugs
    assert out["stage"] == 8 and out["teams"]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `. .venv/bin/activate && pytest tests/test_generator.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'generator'`

- [ ] **Step 3: Create `generator.py`**

```python
"""Race-aware standings generator: the composition the data.json session consumes."""
import roster_store
import pcs_parse
import scoring
from races_config import get_race_config


def _race_url(race_id: str) -> str:
    return get_race_config(race_id)["race_url"]


def generate_standings(race_id: str, stage: int) -> dict:
    roster = roster_store.load(race_id)
    active = roster_store.active_riders(roster, stage)
    gc = pcs_parse.fetch_stage_gc(_race_url(race_id), stage)
    standings = scoring.compute_standings(active, gc)
    return {
        "race_id": race_id,
        "stage": stage,
        "standings": standings,
        "teams": scoring.format_for_app(standings),
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `. .venv/bin/activate && pytest tests/test_generator.py -v`
Expected: PASS (1 passed)

- [ ] **Step 5: Add slug validation to `verify.py`**

In `verify.py`, add this function and call it from `main()` before returning:
```python
import roster_store
import rider_resolver


def validate_roster_slugs(race_id: str) -> list:
    roster = roster_store.load(race_id)
    bad = []
    seen = set()
    for participant, stints in roster.items():
        for stint in stints:
            slug = stint["slug"]
            if slug in seen:
                continue
            seen.add(slug)
            if rider_resolver.resolve_rider(slug) is None:
                bad.append(f"{participant}: {slug} does not resolve")
    return bad
```

In `main()`, after the 2025 block and before `return 0`, add:
```python
    print("\nValidating tdf-2026 roster slugs...")
    bad = validate_roster_slugs("tdf-2026")
    if bad:
        print("⚠ Unresolvable slugs:")
        for b in bad:
            print(f"   {b}")
    else:
        print("✓ All tdf-2026 roster slugs resolve (or roster is empty)")
```

- [ ] **Step 6: Run the full verify (network)**

Run: `. .venv/bin/activate && python verify.py`
Expected: 2025 standings table + the tdf-2026 slug-validation section. (Empty roster prints the ✓ line.)

- [ ] **Step 7: Commit**

```bash
git add generator.py verify.py tests/test_generator.py
git commit -m "feat: race-aware generate_standings + verify roster-slug validation

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Guided CLI (`draft.py`)

Interactive deterministic entry. Modes: `draft`, `swap`, `show`, `verify`. Core logic lives in `roster_store` + `rider_resolver` + `verify`; the CLI is thin I/O. Logic is unit-tested; the interactive loop is exercised manually.

**Files:**
- Create: `draft.py`
- Create: `tests/test_draft_cli.py`

**Interfaces:**
- Consumes: `roster_store`, `rider_resolver`, `verify.validate_roster_slugs`, `races_config.get_race_config`
- Produces:
  - `cmd_show(race_id: str) -> str` — rendered roster text
  - `add_rider_interactive(roster, participant, query, confirm) -> bool` — resolves `query`, calls `confirm(resolved)`, appends a `from_stage=1` stint on yes; returns whether added
  - `main(argv: list[str]) -> int`

- [ ] **Step 1: Write the failing test**

`tests/test_draft_cli.py`:
```python
import draft


def test_add_rider_interactive_appends_on_confirm(monkeypatch):
    monkeypatch.setattr(draft.rider_resolver, "resolve_rider",
                        lambda q: {"slug": "rider/tadej-pogacar", "name": "Tadej Pogačar", "team": "UAE"})
    roster = {}
    added = draft.add_rider_interactive(roster, "Aaron", "pogacar", confirm=lambda r: True)
    assert added is True
    assert roster["Aaron"][0]["slug"] == "rider/tadej-pogacar"
    assert roster["Aaron"][0]["from_stage"] == 1


def test_add_rider_interactive_skips_on_reject(monkeypatch):
    monkeypatch.setattr(draft.rider_resolver, "resolve_rider",
                        lambda q: {"slug": "rider/x", "name": "X", "team": "T"})
    roster = {}
    added = draft.add_rider_interactive(roster, "Aaron", "x", confirm=lambda r: False)
    assert added is False and roster == {}


def test_add_rider_interactive_handles_unresolved(monkeypatch):
    monkeypatch.setattr(draft.rider_resolver, "resolve_rider", lambda q: None)
    roster = {}
    assert draft.add_rider_interactive(roster, "Aaron", "zzz", confirm=lambda r: True) is False
```

- [ ] **Step 2: Run test to verify it fails**

Run: `. .venv/bin/activate && pytest tests/test_draft_cli.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'draft'`

- [ ] **Step 3: Create `draft.py`**

```python
"""Guided CLI for entering and editing fantasy rosters.

Usage:
  python draft.py draft   [--race tdf-2026]   # enter teams
  python draft.py swap    [--race tdf-2026]   # swap an injured rider
  python draft.py show    [--race tdf-2026]
  python draft.py verify                      # delegates to verify.py
"""
import argparse
import roster_store
import rider_resolver
from races_config import get_race_config


def add_rider_interactive(roster: dict, participant: str, query: str, confirm) -> bool:
    resolved = rider_resolver.resolve_rider(query)
    if resolved is None:
        print(f"   ✗ Could not resolve '{query}' — try a different spelling or paste the rider/<slug>.")
        return False
    if not confirm(resolved):
        return False
    roster_store.add_rider(roster, participant, {
        "slug": resolved["slug"], "name": resolved["name"],
        "team": resolved["team"], "from_stage": 1,
    })
    return True


def _confirm(resolved: dict) -> bool:
    ans = input(f"   → {resolved['name']} ({resolved['team']}) [{resolved['slug']}]  add? [Y/n] ")
    return ans.strip().lower() in ("", "y", "yes")


def cmd_show(race_id: str) -> str:
    roster = roster_store.load(race_id)
    if not roster:
        return f"(no roster yet for {race_id})"
    lines = [f"Roster — {race_id}"]
    for participant, stints in roster.items():
        lines.append(f"  {participant}:")
        for s in stints:
            span = f"stage {s['from_stage']}" + (f"–{s['to_stage']}" if s.get("to_stage") else "+")
            lines.append(f"    {s['name']:<24s} {s['slug']:<28s} {span}")
    return "\n".join(lines)


def cmd_draft(race_id: str) -> None:
    roster = roster_store.load(race_id)
    print(f"Drafting {race_id}. Enter a blank participant name to finish.")
    while True:
        participant = input("\nParticipant name: ").strip()
        if not participant:
            break
        while len(roster_store.active_riders(roster, 1).get(participant, [])) < 3:
            q = input("  Add rider (name or rider/slug): ").strip()
            if not q:
                break
            add_rider_interactive(roster, participant, q, _confirm)
    roster_store.save(race_id, roster)
    print("\nSaved.\n" + cmd_show(race_id))


def cmd_swap(race_id: str) -> None:
    roster = roster_store.load(race_id)
    print(cmd_show(race_id))
    participant = input("\nParticipant: ").strip()
    out_slug = input("Outgoing rider slug (rider/...): ").strip()
    q = input("Replacement (name or rider/slug): ").strip()
    stage = int(input("Effective from stage #: ").strip())
    resolved = rider_resolver.resolve_rider(q)
    if not resolved:
        print("✗ Replacement did not resolve; aborting.")
        return
    roster_store.swap_rider(roster, participant, out_slug, {
        "slug": resolved["slug"], "name": resolved["name"], "team": resolved["team"],
    }, effective_stage=stage)
    total = get_race_config(race_id)["total_stages"]
    violations = roster_store.validate(roster, total)
    if violations:
        print("✗ Swap would break the roster:")
        for v in violations:
            print(f"   {v}")
        return
    roster_store.save(race_id, roster)
    print("Saved.\n" + cmd_show(race_id))


def main(argv=None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=["draft", "swap", "show", "verify"])
    parser.add_argument("--race", default="tdf-2026")
    args = parser.parse_args(argv)
    if args.command == "show":
        print(cmd_show(args.race))
    elif args.command == "draft":
        cmd_draft(args.race)
    elif args.command == "swap":
        cmd_swap(args.race)
    elif args.command == "verify":
        import verify
        return verify.main()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

- [ ] **Step 4: Run test to verify it passes**

Run: `. .venv/bin/activate && pytest tests/test_draft_cli.py -v`
Expected: PASS (3 passed)

- [ ] **Step 5: Manual smoke of `show`**

Run: `. .venv/bin/activate && python draft.py show --race tdf-2026`
Expected: `(no roster yet for tdf-2026)` (or the seeded roster).

- [ ] **Step 6: Commit**

```bash
git add draft.py tests/test_draft_cli.py
git commit -m "feat: guided draft.py CLI (draft/swap/show/verify)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: The `/draft` skill (`.claude/skills/draft/SKILL.md`)

A thin natural-language layer so the owner can say "Nate drafted Pogačar, Vingegaard, Roglič" or "Aaron swapped Matteo for Ben O'Connor effective stage 12" and the agent drives the same Python modules, always validating and showing a diff.

**Files:**
- Create: `.claude/skills/draft/SKILL.md`

**Interfaces:**
- Consumes (as documented commands the agent runs): `python draft.py show`, `rider_resolver.resolve_rider`, `roster_store` ops, `roster_store.validate`

- [ ] **Step 1: Create the skill file**

`.claude/skills/draft/SKILL.md`:
```markdown
---
name: draft
description: Use when the league owner wants to enter or edit fantasy Tour rosters in natural language — "Nate drafted Pogačar, Vingegaard, Roglič", "Aaron swapped Matteo for Ben O'Connor effective stage 12", "show me Leo's team". Drives the Python roster tooling (roster_store + rider_resolver) and always validates before saving.
---

# Draft — natural-language roster entry

This skill is a thin mouth over the deterministic Python tooling. **Correctness lives in
`roster_store.py` and `rider_resolver.py`** — never hand-edit `data/rosters.json`.

## Setup
Always work inside the dev venv: `. .venv/bin/activate`. Default race is `tdf-2026`.

## Reading the current state
Run `python draft.py show --race <race_id>` and relay it.

## Adding riders (initial draft)
For each rider the owner names:
1. Resolve it: `python -c "import rider_resolver as rr; print(rr.resolve_rider('<query>'))"`.
2. If `None`, tell the owner it didn't resolve and ask for another spelling or the `rider/<slug>`. **Never invent a slug.**
3. Show the resolved `{name, team, slug}` and confirm with the owner before saving.
4. Append a stint with `from_stage: 1` via `roster_store.add_rider(roster, participant, stint)`, then persist with `roster_store.save(race_id, roster)` (the `race_id` argument is required).

Drive multi-rider entry with a short Python snippet that `roster_store.load(race_id)`s the
roster, loops the resolved riders into it via `add_rider`, calls
`roster_store.save(race_id, roster)`, then re-run `show`.

## Swapping an injured rider (Option B)
Ask for: participant, outgoing rider, replacement, and the **effective stage**.
Call `roster_store.swap_rider(roster, participant, out_slug, in_stint, effective_stage)`
— it closes the old stint at `effective_stage-1` and opens the new at `effective_stage`,
preserving history.

## ALWAYS validate before declaring done
After any change, run `roster_store.validate(roster, total_stages)` where
`total_stages = races_config.get_race_config(race_id)["total_stages"]` (the config is a dict;
extract the field). If it returns violations (e.g. "Nate: 4 active riders at stage 12"), do
NOT save — surface them and fix.

## Always show a before/after
After saving, run `python draft.py show` again and present the diff so the owner can eyeball it.

## When unsure
If a name is ambiguous or won't resolve, ask the owner — do not guess a slug into the store.
```

- [ ] **Step 2: Verify the skill is discoverable**

Run: `ls .claude/skills/draft/SKILL.md`
Expected: the path prints. (The skill loads on next session; no runtime test needed.)

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/draft/SKILL.md
git commit -m "feat: /draft skill — natural-language roster entry over the Python tooling

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 11 (enhancement, optional): Playwright fallback tier in `pcs_fetch`

Adds the headless-browser tier so a hard Cloudflare day (e.g. running from a datacenter IP) still succeeds. Optional — only needed if cloudscraper starts returning challenges where the generator runs.

**Files:**
- Modify: `pcs_fetch.py` (insert a Playwright tier between cloudscraper and the raise)
- Create: `tests/test_pcs_fetch_fallback.py`
- Modify: `requirements-dev.txt` (add `playwright`)

**Interfaces:**
- Produces: `_fetch_playwright(path: str) -> str` (lazy-imports playwright; raises `PCSBlockedError` if unavailable)

- [ ] **Step 1: Write the failing test (escalation order, mocked)**

`tests/test_pcs_fetch_fallback.py`:
```python
import pcs_fetch


def test_get_html_escalates_to_playwright(tmp_path, monkeypatch):
    monkeypatch.setattr(pcs_fetch, "CACHE_DIR", tmp_path)
    monkeypatch.setattr(pcs_fetch, "_fetch_cloudscraper",
                        lambda path: "<html><title>Just a moment...</title></html>")
    monkeypatch.setattr(pcs_fetch, "_fetch_playwright",
                        lambda path: "<html><title>Tadej Pogačar</title><table>real</table></html>")
    html = pcs_fetch.get_html("rider/tadej-pogacar", force=True)
    assert "Pogačar" in html
```

- [ ] **Step 2: Run test to verify it fails**

Run: `. .venv/bin/activate && pytest tests/test_pcs_fetch_fallback.py -v`
Expected: FAIL — `_fetch_playwright` does not exist yet, and `get_html` does not escalate.

- [ ] **Step 3: Add the Playwright tier to `pcs_fetch.py`**

Add this function:
```python
def _fetch_playwright(path: str) -> str:
    """Headless-browser fetch that solves the Cloudflare challenge. Lazy import."""
    try:
        from playwright.sync_api import sync_playwright
    except ImportError as e:
        raise PCSBlockedError("Playwright not installed; run `pip install playwright && playwright install chromium`") from e
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(BASE_URL + path.strip("/"), wait_until="networkidle", timeout=60000)
        html = page.content()
        browser.close()
    return html
```

Then, in `get_html`, replace the block that raises after the cloudscraper challenge with an escalation:
```python
    html = _fetch_cloudscraper(path)
    if is_challenge(html):
        html = _fetch_playwright(path)
    if is_challenge(html):
        raise PCSBlockedError(
            f"Cloudflare challenge for '{path}'. Tried: cloudscraper, Playwright. "
            "Run from a residential network."
        )
```

- [ ] **Step 4: Run test to verify it passes**

Run: `. .venv/bin/activate && pytest tests/test_pcs_fetch_fallback.py tests/test_pcs_fetch.py -v`
Expected: PASS (all). The pre-existing fresh-cache test still passes (no network).

- [ ] **Step 5: Add the optional dependency**

Append to `requirements-dev.txt`:
```
playwright>=1.44.0
```

- [ ] **Step 6: Commit**

```bash
git add pcs_fetch.py tests/test_pcs_fetch_fallback.py requirements-dev.txt
git commit -m "feat: Playwright fallback tier in pcs_fetch for hard Cloudflare days

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Final verification

- [ ] **Run the full offline test suite**

Run: `. .venv/bin/activate && pytest -v`
Expected: all tests pass (pcs_time, pcs_fetch, pcs_parse, scoring, verify_contract, roster_store, rider_resolver, generator, draft_cli, and — if Task 11 done — pcs_fetch_fallback).

- [ ] **Run the end-to-end PCS proof (network, residential)**

Run: `. .venv/bin/activate && python verify.py`
Expected: `✓ PCS reachable`, a real TDF 2025 standings table, and the tdf-2026 slug-validation section.

- [ ] **Enter the real 2026 draft** once it happens, via `python draft.py draft` or the `/draft` skill, then re-run `python verify.py` to confirm every drafted slug resolves.

## Self-review notes (spec coverage)

- Spec §Components 1–7 → Tasks 2,3,6,7,9,10,5 respectively; the parse "spike" is resolved (package HTML injection proven) and encoded in Task 3.
- §Fallback chain → Task 2 (cloudscraper + cache) + Task 11 (Playwright tier).
- §Raw-HTML cache → Task 2; reused as offline fixtures in Task 3.
- §Vertical-slice ordering → Tasks 1–5 build and prove the 2025 data path before any roster UX (Tasks 6–10).
- §Golden contract test → Task 4 (`format_for_app`) + Task 5 (`test_verify_contract`).
- §Race-aware gap close → Task 8 (`generate_standings` via `roster_store.active_riders`).
- §Enhancements (dated snapshot, startlist-gated validation) → intentionally deferred; not tasked.
