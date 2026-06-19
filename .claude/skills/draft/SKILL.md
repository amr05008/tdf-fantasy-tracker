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
4. Append a stint with `from_stage: 1` via `roster_store.add_rider`, then `roster_store.save`.

Drive multi-rider entry with a short Python snippet that loops the resolved riders into
`roster_store`, then `save`, then re-run `show`.

## Swapping an injured rider (Option B)
Ask for: participant, outgoing rider, replacement, and the **effective stage**.
Call `roster_store.swap_rider(roster, participant, out_slug, in_stint, effective_stage)`
— it closes the old stint at `effective_stage-1` and opens the new at `effective_stage`,
preserving history.

## ALWAYS validate before declaring done
After any change, run `roster_store.validate(roster, total_stages)` (total_stages from
`races_config.get_race_config(race_id)`). If it returns violations (e.g. "Nate: 4 active
riders at stage 12"), do NOT save — surface them and fix.

## Always show a before/after
After saving, run `python draft.py show` again and present the diff so the owner can eyeball it.

## When unsure
If a name is ambiguous or won't resolve, ask the owner — do not guess a slug into the store.
