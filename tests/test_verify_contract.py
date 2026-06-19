import scoring
import verify


def test_app_teams_contract_is_stable():
    # Frozen contract: the keys the future data.json generator must emit.
    gc = {"rider/x": {"rider_name": "X", "team_name": "T", "rank": 1, "time": "5:00:00"}}
    teams = scoring.format_for_app(scoring.compute_standings({"P": ["rider/x"]}, gc))
    assert teams and set(teams[0]) == {"name", "rank", "total", "gap", "leader", "last", "riders"}
    assert set(teams[0]["riders"][0]) == {"name", "gc", "time", "proTeam"}


def test_preflight_forces_fresh_fetch(monkeypatch):
    # The connectivity check must bypass the cache (force=True), or it can report
    # "reachable" off a stale 6h cache while PCS is actually blocked.
    seen = {}

    def fake_get_html(path, **kwargs):
        seen["path"] = path
        seen["kwargs"] = kwargs
        return "<html>ok</html>"

    monkeypatch.setattr(verify.pcs_fetch, "get_html", fake_get_html)
    assert verify.preflight() is True
    assert seen["kwargs"].get("force") is True
