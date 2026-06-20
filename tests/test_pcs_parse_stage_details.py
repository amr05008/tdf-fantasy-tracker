import pathlib
import pcs_parse

FIX = pathlib.Path(__file__).parent / "fixtures"


def test_parse_stage_details_from_fixture():
    html = (FIX / "stage-21-gc.html").read_text()
    d = pcs_parse.parse_stage_details(html)
    assert d["departure"] == "Mantes-la-Ville"
    assert "Paris" in d["arrival"]
    assert d["distance"] == 132.3
    assert d["winner_name"] == "van Aert Wout"
    assert d["winner_team"].startswith("Team Visma")
    assert ":" in d["winner_time"]
