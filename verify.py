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
