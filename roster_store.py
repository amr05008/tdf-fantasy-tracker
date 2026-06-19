"""Effective-dated roster storage (Option B).

A participant maps to a list of rider *stints*. A stint is active at stage N when
from_stage <= N <= (to_stage or +inf). Invariant: exactly 3 active per stage.
"""
import json
import pathlib

DEFAULT_PATH = "data/rosters.json"


def load(race_id: str, path: str = DEFAULT_PATH) -> dict:
    p = pathlib.Path(path)
    if not p.exists():
        return {}
    data = json.loads(p.read_text(encoding="utf-8"))
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
