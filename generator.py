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
    # Surface teams with an unscored rider. A rider missing from the GC (DNF/DNS or
    # a bad slug) is dropped from the team total, which LOWERS it and inflates the
    # team's rank — so a silent miss reads as "winning". Callers (and the eventual
    # data.json/UI) must show this, not just the standings.
    warnings = [
        f"{r['name']}: only {r['riders_counted']}/{r['total_riders']} riders scored"
        f" — missing rider(s) lower the team total and inflate its rank"
        for r in standings if r["riders_counted"] < r["total_riders"]
    ]
    return {
        "race_id": race_id,
        "stage": stage,
        "standings": standings,
        "teams": scoring.format_for_app(standings),
        "warnings": warnings,
    }
