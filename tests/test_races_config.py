from races_config import RACES, TEAM_ROSTERS


def test_only_tour_de_france_races():
    assert set(RACES) == {"tdf-2025", "tdf-2026"}
    assert set(TEAM_ROSTERS) == {"tdf-2025", "tdf-2026"}
