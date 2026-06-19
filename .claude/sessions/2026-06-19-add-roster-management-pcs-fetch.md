---
date: 2026-06-19
summary: Built the Streamlit-free roster-management + PCS data pipeline; unblocked procyclingstats' new Cloudflare challenge with cloudscraper
tags: [backend, procyclingstats, cloudflare, roster, draft, scoring, tdf-2026]
---

## Summary

Built the go-forward backend for the 2026 draft: easy roster entry (CLI + `/draft` skill),
historically-accurate mid-race injury swaps (effective-dated stints, Option B), and a
resilient PCS fetch/parse/score pipeline. Discovered procyclingstats is now behind a
**Cloudflare managed challenge** that breaks the `procyclingstats` package's plain-HTTP
fetch, and unblocked it with `cloudscraper` behind a single seam. Proven end-to-end against
complete TDF 2025 data (reproduces the real result — Aaron wins, 228:59:22). Merged to `main`
and pushed. React `data.json` wiring is intentionally next-session.

## Changes

New repo-root modules (all pure, no Streamlit): `pcs_time.py`, `pcs_fetch.py` (cache →
cloudscraper → Playwright → `PCSBlockedError`), `pcs_parse.py` (injects HTML into package
parsers), `scoring.py` (`compute_standings` + frozen `format_for_app` contract), `roster_store.py`
(effective-dated stints in `data/rosters.json`), `rider_resolver.py`, `generator.py`, `verify.py`,
`draft.py` CLI. Plus `.claude/skills/draft/SKILL.md`, `tests/` (29 passing, offline via committed
`tests/fixtures/*.html`), `requirements-dev.txt`, `cloudscraper` in `requirements.txt`.
Docs: spec/plan under `docs/superpowers/{specs,plans}/2026-06-19-roster-management-and-pcs-fetch*`;
updated `CLAUDE.md` (new data-layer section + Cloudflare warning) and `web/README.md` (Phase 2
points at `generator.generate_standings`, not `api_client.py`).

Commits: `fe7c1e4`..`cee2dc6` (20 impl commits + spec/plan). Executed via subagent-driven
development (implementer + reviewer per task, whole-branch review, grill pass).

## Decisions

- **Option B (effective-dated swaps)** over "current roster only" — matches how the league's
  actual 2025 sheet behaved (pre-swap stage times preserved); keeps stage-by-stage charts truthful.
- **cloudscraper behind a single `pcs_fetch` seam**, not a hosted API. Tested alternatives: no PCS
  JSON endpoints exist, FirstCycling is also Cloudflare-blocked, community APIs too fragile, ASO a
  separate integration. Playwright is the (untested) fallback tier; the seam means one swap point.
- **Reuse the `procyclingstats` package parsers** by injecting cloudscraper HTML
  (`Stage(url, html=..., update_html=False)`) — proven, avoids owning a parser.
- **Rosters in `data/rosters.json`**, not `races_config.py` — data separate from code, editable by
  CLI/skill. `verify.py` reads static `TEAM_ROSTERS` (not `get_team_rosters`, which is Sheets/Streamlit-coupled).

## Notes

Bugs caught live during the build: Streamlit/Sheets coupling leaking into the pipeline via
`get_team_rosters`; `slugify` deleting apostrophes (broke `ben-o-connor`); `parse_rider` using a
non-existent `team_name()`.

Open items (none block merge): **DNF scoring** drops a missing rider from the team total → lowers
it → inflates rank; `generate_standings` now returns a `warnings` list but the league's DNF-penalty
rule is undecided. No "latest completed stage" auto-detection. Resolver can't derive ø/å/ł names
(paste `rider/<slug>`). Playwright tier never run live. 6h cache TTL can show stale GC mid-race.

Aaron is testing in prod next; the live Vercel site is unchanged (still placeholder) until the
`data.json` wiring session. Run the backend from a residential network — Vercel/CI IPs get
Cloudflare-challenged.
