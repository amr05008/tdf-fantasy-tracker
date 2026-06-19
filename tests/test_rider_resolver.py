import rider_resolver as rr


def test_slugify_handles_accents_and_punctuation():
    assert rr.slugify_name("Tadej Pogačar") == "tadej-pogacar"
    # Apostrophes follow PCS convention: O'Connor -> o-connor (separator, not deleted)
    assert rr.slugify_name("Ben O'Connor") == "ben-o-connor"
    assert rr.slugify_name("  Jonas   Vingegaard ") == "jonas-vingegaard"


def test_resolve_accepts_existing_slug(monkeypatch):
    def fake_fetch_rider(slug):
        return {"slug": slug, "name": "Tadej Pogačar", "team": "UAE Team Emirates"}
    monkeypatch.setattr(rr.pcs_parse, "fetch_rider", fake_fetch_rider)
    out = rr.resolve_rider("rider/tadej-pogacar")
    assert out["slug"] == "rider/tadej-pogacar" and out["name"] == "Tadej Pogačar"


def test_resolve_returns_none_when_page_missing(monkeypatch):
    def boom(slug):
        raise ValueError("Given HTML is invalid.")
    monkeypatch.setattr(rr.pcs_parse, "fetch_rider", boom)
    assert rr.resolve_rider("rider/not-a-real-person") is None
