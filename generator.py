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
