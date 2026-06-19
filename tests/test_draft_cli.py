import draft


def test_add_rider_interactive_appends_on_confirm(monkeypatch):
    monkeypatch.setattr(draft.rider_resolver, "resolve_rider",
                        lambda q: {"slug": "rider/tadej-pogacar", "name": "Tadej Pogačar", "team": "UAE"})
    roster = {}
    added = draft.add_rider_interactive(roster, "Aaron", "pogacar", confirm=lambda r: True)
    assert added is True
    assert roster["Aaron"][0]["slug"] == "rider/tadej-pogacar"
    assert roster["Aaron"][0]["from_stage"] == 1


def test_add_rider_interactive_skips_on_reject(monkeypatch):
    monkeypatch.setattr(draft.rider_resolver, "resolve_rider",
                        lambda q: {"slug": "rider/x", "name": "X", "team": "T"})
    roster = {}
    added = draft.add_rider_interactive(roster, "Aaron", "x", confirm=lambda r: False)
    assert added is False and roster == {}


def test_add_rider_interactive_handles_unresolved(monkeypatch):
    monkeypatch.setattr(draft.rider_resolver, "resolve_rider", lambda q: None)
    roster = {}
    assert draft.add_rider_interactive(roster, "Aaron", "zzz", confirm=lambda r: True) is False
