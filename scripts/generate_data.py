"""Generate web/public/data/<raceId>.json from real PCS data.

Usage: python scripts/generate_data.py <raceId> [--stage N]
build_race_data is pure (no I/O) for offline testing; main() does the fetching.
"""
import json
import pathlib
import sys

import pcs_parse
import roster_store
import scoring
from pcs_time import time_str_to_seconds, seconds_to_time_str
from nations import code_to_name
from races_config import get_race_config, RACES, TEAM_ROSTERS

OUT_DIR = pathlib.Path(__file__).parent.parent / "web" / "public" / "data"

STAGE_TYPE_LABELS = {
    "p1": "Flat", "p2": "Hilly", "p3": "Hilly", "p4": "Mountain", "p5": "Mountain",
}


def label_stage_type(stage_details: dict) -> str:
    return STAGE_TYPE_LABELS.get(stage_details.get("profile_icon", ""), "Road")


def _gc_leader_seconds(gc: dict) -> int:
    for e in gc.values():
        if e.get("rank") == 1:
            return time_str_to_seconds(e.get("time", "0:00:00"))
    times = [time_str_to_seconds(e.get("time", "0:00:00")) for e in gc.values()]
    times = [t for t in times if t > 0]
    return min(times) if times else 0


def _your_note(d: int) -> str:
    if d > 0:
        return f"Up {d} on GC"
    if d < 0:
        return f"Lost {-d} on GC"
    return "Holds GC position"


def build_race_data(*, race_id, race_name, total_stages, stage_num, gc, prev_gc,
                    stage_details, active_by_participant, races_list, updated, you="Aaron"):
    standings = scoring.compute_standings(active_by_participant, gc)
    prev = scoring.compute_standings(active_by_participant, prev_gc)
    prev_rank = {r["name"]: r["position"] for r in prev}
    leader_secs = _gc_leader_seconds(gc)
    n = len(standings)

    teams = []
    for row in standings:
        riders = []
        for r in row["riders"]:
            entry = gc.get(r["slug"], {})
            counted = r["counted"]
            if not counted:
                gap_gc = "—"
            elif entry.get("rank") == 1:
                gap_gc = "GC leader"
            else:
                gap_gc = "+" + seconds_to_time_str(time_str_to_seconds(r["time"]) - leader_secs)
            pr, rk = entry.get("prev_rank"), entry.get("rank")
            d = (pr - rk) if (isinstance(pr, int) and isinstance(rk, int)) else 0
            riders.append({
                "name": r["name"], "gc": r["gc"], "time": r["time"], "d": d,
                "proTeam": r["proTeam"], "gapGC": gap_gc, "role": "Rider",
                "nat": code_to_name(entry.get("nationality", "")), "age": entry.get("age"),
            })
        move = prev_rank.get(row["name"], row["position"]) - row["position"]
        teams.append({
            "name": row["name"], "rank": row["position"], "total": row["total_time"],
            "gap": row["gap"], "move": move,
            "leader": row["position"] == 1, "last": row["position"] == n, "riders": riders,
        })

    movers = []
    for t in sorted(teams, key=lambda t: -abs(t["move"])):
        if t["move"] != 0:
            note = f"Up {t['move']} overall" if t["move"] > 0 else f"Down {-t['move']} overall"
            movers.append({"name": t["name"], "move": t["move"], "note": note})

    your_team = next((t for t in teams if t["name"] == you), teams[0] if teams else None)
    your_today = []
    if your_team:
        for r in your_team["riders"]:
            your_today.append({"name": r["name"], "place": "#" + str(r["gc"]),
                               "gap": r["gapGC"], "note": _your_note(r["d"])})

    draft_pool, seen = [], set()
    for t in teams:
        for r in t["riders"]:
            if r["name"] not in seen:
                seen.add(r["name"])
                draft_pool.append({"name": r["name"], "team": r["proTeam"], "role": r["role"]})

    leader_name = teams[0]["name"] if teams else ""
    stage = {
        "stageNum": stage_num, "date": stage_details.get("date", ""),
        "route": f"{stage_details.get('departure', '')} → {stage_details.get('arrival', '')}",
        "type": label_stage_type(stage_details),
        "km": (f"{stage_details['distance']} km" if stage_details.get("distance") else ""),
        "winner": stage_details.get("winner_name", ""),
        "winnerTeam": stage_details.get("winner_team", ""),
        "winnerTime": stage_details.get("winner_time", ""),
    }
    meta = {
        "raceId": race_id, "name": race_name, "stageNum": stage_num,
        "totalStages": total_stages, "progressPct": f"{round(100 * stage_num / total_stages)}%",
        "updated": updated, "recap": f"Final standings — {leader_name} wins the {race_name}.",
    }
    return {"meta": meta, "teams": teams, "draftPool": draft_pool,
            "races": races_list, "stage": stage, "movers": movers, "yourToday": your_today}


def resolve_active(race_id: str, stage: int) -> dict:
    roster = roster_store.load(race_id)
    if roster:
        return roster_store.active_riders(roster, stage)
    return TEAM_ROSTERS.get(race_id, {})


def build_races_list() -> list:
    out = []
    for rid, rc in RACES.items():
        status = "Complete" if rc.get("is_complete") else "Upcoming"
        note = ("Won by " + rc["winner"]) if rc.get("winner") else "Upcoming"
        start, end = rc["start_date"], rc["end_date"]
        out.append({"id": rid, "name": rc["name"], "dates": f"{start} – {end}",
                    "stages": rc["total_stages"], "status": status,
                    "dot": rc["leader_color"], "note": note})
    return out


def main(argv) -> int:
    race_id = argv[0]
    stage = None
    if "--stage" in argv:
        stage = int(argv[argv.index("--stage") + 1])
    race = get_race_config(race_id)
    total = race["total_stages"]
    if stage is None:
        stage = total  # completed-race default: final stage
    active = resolve_active(race_id, stage)
    gc = pcs_parse.fetch_stage_gc(race["race_url"], stage)
    prev_gc = pcs_parse.fetch_stage_gc(race["race_url"], stage - 1) if stage > 1 else {}
    details = pcs_parse.fetch_stage_details(race["race_url"], stage)
    from datetime import datetime, timezone
    updated = datetime.now(timezone.utc).strftime("%b %d, %Y")
    data = build_race_data(
        race_id=race_id, race_name=race["name"], total_stages=total, stage_num=stage,
        gc=gc, prev_gc=prev_gc, stage_details=details,
        active_by_participant=active, races_list=build_races_list(), updated=updated,
    )
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_file = OUT_DIR / f"{race_id}.json"
    out_file.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"wrote {out_file} — {len(data['teams'])} teams, stage {stage}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
