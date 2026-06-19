import generator


def test_generate_standings_uses_active_roster(monkeypatch):
    roster = {"Aaron": [
        {"slug": "rider/a", "from_stage": 1, "to_stage": 5},
        {"slug": "rider/b", "from_stage": 6},
        {"slug": "rider/c", "from_stage": 1},
        {"slug": "rider/d", "from_stage": 1},
    ]}
    gc = {
        "rider/a": {"rider_name": "A", "team_name": "T", "rank": 1, "time": "10:00:00"},
        "rider/b": {"rider_name": "B", "team_name": "T", "rank": 2, "time": "10:01:00"},
        "rider/c": {"rider_name": "C", "team_name": "T", "rank": 3, "time": "10:02:00"},
        "rider/d": {"rider_name": "D", "team_name": "T", "rank": 4, "time": "10:03:00"},
    }
    monkeypatch.setattr(generator.roster_store, "load", lambda race_id: roster)
    monkeypatch.setattr(generator.pcs_parse, "fetch_stage_gc", lambda race_url, stage: gc)
    monkeypatch.setattr(generator, "_race_url", lambda race_id: "race/x/2026")

    out = generator.generate_standings("tdf-2026", stage=8)
    # At stage 8, active = b, c, d (a was swapped out at stage 5)
    slugs = [r["slug"] for r in out["standings"][0]["riders"]]
    assert "rider/a" not in slugs and "rider/b" in slugs
    assert out["stage"] == 8 and out["teams"]
