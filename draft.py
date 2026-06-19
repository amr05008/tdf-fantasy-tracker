"""Guided CLI for entering and editing fantasy rosters.

Usage:
  python draft.py draft   [--race tdf-2026]   # enter teams
  python draft.py swap    [--race tdf-2026]   # swap an injured rider
  python draft.py show    [--race tdf-2026]
  python draft.py verify                      # delegates to verify.py
"""
import argparse
import roster_store
import rider_resolver
from races_config import get_race_config


def add_rider_interactive(roster: dict, participant: str, query: str, confirm) -> bool:
    resolved = rider_resolver.resolve_rider(query)
    if resolved is None:
        print(f"   ✗ Could not resolve '{query}' — try a different spelling or paste the rider/<slug>.")
        return False
    if not confirm(resolved):
        return False
    roster_store.add_rider(roster, participant, {
        "slug": resolved["slug"], "name": resolved["name"],
        "team": resolved["team"], "from_stage": 1,
    })
    return True


def _confirm(resolved: dict) -> bool:
    ans = input(f"   → {resolved['name']} ({resolved['team']}) [{resolved['slug']}]  add? [Y/n] ")
    return ans.strip().lower() in ("", "y", "yes")


def cmd_show(race_id: str) -> str:
    roster = roster_store.load(race_id)
    if not roster:
        return f"(no roster yet for {race_id})"
    lines = [f"Roster — {race_id}"]
    for participant, stints in roster.items():
        lines.append(f"  {participant}:")
        for s in stints:
            span = f"stage {s['from_stage']}" + (f"–{s['to_stage']}" if s.get("to_stage") else "+")
            lines.append(f"    {s['name']:<24s} {s['slug']:<28s} {span}")
    return "\n".join(lines)


def cmd_draft(race_id: str) -> None:
    roster = roster_store.load(race_id)
    print(f"Drafting {race_id}. Enter a blank participant name to finish.")
    while True:
        participant = input("\nParticipant name: ").strip()
        if not participant:
            break
        while len(roster_store.active_riders(roster, 1).get(participant, [])) < 3:
            q = input("  Add rider (name or rider/slug): ").strip()
            if not q:
                break
            add_rider_interactive(roster, participant, q, _confirm)
    roster_store.save(race_id, roster)
    print("\nSaved.\n" + cmd_show(race_id))


def cmd_swap(race_id: str) -> None:
    roster = roster_store.load(race_id)
    print(cmd_show(race_id))
    participant = input("\nParticipant: ").strip()
    out_slug = input("Outgoing rider slug (rider/...): ").strip()
    q = input("Replacement (name or rider/slug): ").strip()
    stage = int(input("Effective from stage #: ").strip())
    resolved = rider_resolver.resolve_rider(q)
    if not resolved:
        print("✗ Replacement did not resolve; aborting.")
        return
    roster_store.swap_rider(roster, participant, out_slug, {
        "slug": resolved["slug"], "name": resolved["name"], "team": resolved["team"],
    }, effective_stage=stage)
    total = get_race_config(race_id)["total_stages"]
    violations = roster_store.validate(roster, total)
    if violations:
        print("✗ Swap would break the roster:")
        for v in violations:
            print(f"   {v}")
        return
    roster_store.save(race_id, roster)
    print("Saved.\n" + cmd_show(race_id))


def main(argv=None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=["draft", "swap", "show", "verify"])
    parser.add_argument("--race", default="tdf-2026")
    args = parser.parse_args(argv)
    if args.command == "show":
        print(cmd_show(args.race))
    elif args.command == "draft":
        cmd_draft(args.race)
    elif args.command == "swap":
        cmd_swap(args.race)
    elif args.command == "verify":
        import verify
        return verify.main()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
