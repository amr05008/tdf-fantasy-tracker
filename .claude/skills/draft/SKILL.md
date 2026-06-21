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

## Adding a new participant (a new person joins the league)
A team is created simply by using a new participant name — `add_rider(roster, "Sarah", stint)`
auto-creates "Sarah". Add their three riders the same way as the initial draft (each with
`from_stage: 1`), then save. **Constraint:** `validate` requires exactly 3 active riders at
*every* stage, so a new participant must be added **before the race starts** (or with all
three riders' `from_stage: 1`). Someone joining *mid-race* (partway in) would fail validation
for the earlier stages — flag that to the owner rather than forcing it.

## Removing a participant (someone leaves the league)
Call `roster_store.remove_participant(roster, participant)` then `save`. It raises if the name
isn't found, so confirm the exact name first via `show` (don't guess a misspelling).

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

## Publishing changes to the live app
Editing the roster only updates `data/rosters.json`. The deployed app reads
`web/public/data/<raceId>.json`, so to make roster changes visible you must regenerate and
deploy: `python scripts/generate_data.py <race_id>` (run from a residential network —
procyclingstats is behind Cloudflare), then commit `web/public/data/<race_id>.json` and push
(Vercel redeploys). Note this only produces standings once the race has GC data; for a
not-yet-started race the app shows the Upcoming notice regardless. Remind the owner of this
step after a roster edit.

## When unsure
If a name is ambiguous or won't resolve, ask the owner — do not guess a slug into the store.
