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
