import pathlib
import pcs_parse
from races_config import TEAM_ROSTERS
from scripts.generate_data import build_race_data

FIX = pathlib.Path(__file__).parent / "fixtures"


def _inputs():
    html = (FIX / "stage-21-gc.html").read_text()
    gc = pcs_parse.parse_stage_gc(html)
    details = pcs_parse.parse_stage_details(html)
    return gc, details


def test_build_race_data_shape_and_enrichment():
    gc, details = _inputs()
    races_list = [{"id": "tdf-2025", "name": "Tour de France 2025", "dates": "Jul 5 – 27, 2025",
                   "stages": 21, "status": "Complete", "dot": "#F2C200", "note": "Won by Aaron"}]
    data = build_race_data(
        race_id="tdf-2025", race_name="Tour de France 2025", total_stages=21, stage_num=21,
        gc=gc, prev_gc=gc, stage_details=details,
        active_by_participant=TEAM_ROSTERS["tdf-2025"], races_list=races_list,
        updated="just now",
    )
    # top-level shape matches sampleData
    assert set(data) == {"meta", "teams", "draftPool", "races", "stage", "movers", "yourToday"}
    # 5-team 2025 league, Aaron leads
    assert len(data["teams"]) == 5
    assert data["teams"][0]["name"] == "Aaron" and data["teams"][0]["leader"] is True
    # rider enrichment on a drafted rider (Onley is Aaron's; Britain; trails GC leader).
    # NB: no fantasy rider is the overall GC #1 (Pogačar/Vingegaard weren't drafted).
    onley = next(r for t in data["teams"] for r in t["riders"] if "Onley" in r["name"])
    assert onley["nat"] == "Britain" and isinstance(onley["age"], int)
    assert "form" not in onley and onley["role"] == "Rider"
    assert onley["gapGC"].startswith("+")
    # stage header + meta
    assert data["stage"]["winner"] == "Wout van Aert"  # reordered from PCS 'van Aert Wout'
    assert "Paris" in data["stage"]["route"]
    assert data["meta"]["progressPct"] == "100%" and data["meta"]["raceId"] == "tdf-2025"
    # prev_gc == gc -> no movement
    assert all(t["move"] == 0 for t in data["teams"]) and data["movers"] == []
    # yourToday is Aaron's riders
    assert len(data["yourToday"]) == 3
    assert data["races"] == races_list


def test_gapgc_for_non_leader_is_positive_gap():
    gc, details = _inputs()
    data = build_race_data(
        race_id="tdf-2025", race_name="x", total_stages=21, stage_num=21,
        gc=gc, prev_gc=gc, stage_details=details,
        active_by_participant={"Solo": ["rider/oscar-onley"]}, races_list=[], updated="now",
    )
    onley = data["teams"][0]["riders"][0]
    assert onley["gapGC"].startswith("+")  # Onley trails the GC leader


def test_gapgc_for_gc_leader_is_label():
    gc, details = _inputs()
    data = build_race_data(
        race_id="tdf-2025", race_name="x", total_stages=21, stage_num=21,
        gc=gc, prev_gc=gc, stage_details=details,
        active_by_participant={"Solo": ["rider/tadej-pogacar"]}, races_list=[], updated="now",
    )
    # Pogačar is the overall GC #1 in this fixture.
    assert data["teams"][0]["riders"][0]["gapGC"] == "GC leader"
