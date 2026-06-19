import pathlib
import pcs_parse

FIX = pathlib.Path(__file__).parent / "fixtures"


def test_parse_stage_gc_keys_by_rider_url_with_leader():
    html = (FIX / "stage-21-gc.html").read_text()
    gc = pcs_parse.parse_stage_gc(html)
    assert "rider/tadej-pogacar" in gc
    leader = gc["rider/tadej-pogacar"]
    assert leader["rank"] == 1
    assert leader["rider_name"]  # non-empty
    assert ":" in leader["time"]  # H:MM:SS-ish


def test_parse_rider_returns_slug_name_team():
    html = (FIX / "rider-pogacar.html").read_text()
    r = pcs_parse.parse_rider("rider/tadej-pogacar", html)
    assert r["slug"] == "rider/tadej-pogacar"
    assert "Poga" in r["name"]
    assert r["team"]  # non-empty current team
