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
