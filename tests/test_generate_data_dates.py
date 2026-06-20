from scripts.generate_data import _format_date_range, build_races_list


def test_format_same_month():
    assert _format_date_range("2026-07-04", "2026-07-26") == "Jul 4 – 26, 2026"
    assert _format_date_range("2025-07-05", "2025-07-27") == "Jul 5 – 27, 2025"


def test_format_cross_month():
    assert _format_date_range("2026-08-22", "2026-09-13") == "Aug 22 – Sep 13, 2026"


def test_build_races_list_uses_formatted_dates():
    races = {r["id"]: r for r in build_races_list()}
    assert races["tdf-2025"]["dates"] == "Jul 5 – 27, 2025"
    assert races["tdf-2026"]["dates"] == "Jul 4 – 26, 2026"
    assert races["tdf-2026"]["status"] == "Upcoming"
