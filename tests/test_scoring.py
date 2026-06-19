import scoring


GC = {
    "rider/a": {"rider_name": "Rider A", "team_name": "Team X", "rank": 1, "time": "10:00:00"},
    "rider/b": {"rider_name": "Rider B", "team_name": "Team Y", "rank": 2, "time": "10:05:00"},
    "rider/c": {"rider_name": "Rider C", "team_name": "Team Z", "rank": 3, "time": "10:10:00"},
}


def test_compute_standings_sorts_and_gaps():
    active = {"Nate": ["rider/a", "rider/b"], "Leo": ["rider/b", "rider/c"]}
    s = scoring.compute_standings(active, GC)
    assert [t["name"] for t in s] == ["Nate", "Leo"]      # Nate lower total -> rank 1
    assert s[0]["position"] == 1 and s[0]["gap"] == "Leader"
    assert s[1]["gap"].startswith("+")
    assert s[0]["riders_counted"] == 2


def test_missing_rider_marked_not_counted():
    active = {"Solo": ["rider/a", "rider/missing"]}
    s = scoring.compute_standings(active, GC)
    team = s[0]
    assert team["riders_counted"] == 1 and team["total_riders"] == 2
    missing = [r for r in team["riders"] if not r["counted"]][0]
    assert missing["time"] == "DNF"


def test_format_for_app_shape_matches_sampledata():
    active = {"Nate": ["rider/a"], "Leo": ["rider/b"]}
    teams = scoring.format_for_app(scoring.compute_standings(active, GC))
    t0 = teams[0]
    assert set(["name", "rank", "total", "gap", "leader", "last", "riders"]).issubset(t0)
    assert t0["leader"] is True and teams[-1]["last"] is True
    r0 = t0["riders"][0]
    assert set(["name", "gc", "time", "proTeam"]).issubset(r0)
