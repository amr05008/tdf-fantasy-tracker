import json
import roster_store as rs


def _team():
    return {
        "Aaron": [
            {"slug": "rider/tadej-pogacar", "name": "Tadej Pogačar", "team": "UAE", "from_stage": 1},
            {"slug": "rider/matteo-jorgenson", "name": "Matteo Jorgenson", "team": "Visma", "from_stage": 1},
            {"slug": "rider/ben-oconnor", "name": "Ben O'Connor", "team": "Jayco", "from_stage": 1},
        ]
    }


def test_active_riders_before_swap():
    active = rs.active_riders(_team(), 5)
    assert sorted(active["Aaron"]) == sorted(
        ["rider/tadej-pogacar", "rider/matteo-jorgenson", "rider/ben-oconnor"]
    )


def test_swap_closes_old_opens_new_and_keeps_history():
    roster = _team()
    rs.swap_rider(roster, "Aaron", "rider/matteo-jorgenson",
                  {"slug": "rider/joao-almeida", "name": "João Almeida", "team": "UAE"},
                  effective_stage=12)
    # Stage 11: old rider still active; stage 12: new rider active
    assert "rider/matteo-jorgenson" in rs.active_riders(roster, 11)["Aaron"]
    assert "rider/matteo-jorgenson" not in rs.active_riders(roster, 12)["Aaron"]
    assert "rider/joao-almeida" in rs.active_riders(roster, 12)["Aaron"]
    assert len(rs.active_riders(roster, 12)["Aaron"]) == 3


def test_validate_flags_wrong_active_count():
    roster = {"Aaron": _team()["Aaron"][:2]}  # only 2 active
    violations = rs.validate(roster, total_stages=21)
    assert any("Aaron" in v and "stage 1" in v for v in violations)


def test_validate_passes_clean_team():
    assert rs.validate(_team(), total_stages=21) == []


def test_save_and_load_roundtrip(tmp_path):
    p = tmp_path / "r.json"
    rs.save("tdf-2026", _team(), path=str(p))
    loaded = rs.load("tdf-2026", path=str(p))
    assert loaded["Aaron"][0]["slug"] == "rider/tadej-pogacar"
    assert json.loads(p.read_text())["tdf-2026"]["Aaron"]
