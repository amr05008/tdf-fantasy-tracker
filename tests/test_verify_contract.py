import scoring


def test_app_teams_contract_is_stable():
    # Frozen contract: the keys the future data.json generator must emit.
    gc = {"rider/x": {"rider_name": "X", "team_name": "T", "rank": 1, "time": "5:00:00"}}
    teams = scoring.format_for_app(scoring.compute_standings({"P": ["rider/x"]}, gc))
    assert teams and set(teams[0]) == {"name", "rank", "total", "gap", "leader", "last", "riders"}
    assert set(teams[0]["riders"][0]) == {"name", "gc", "time", "proTeam"}
