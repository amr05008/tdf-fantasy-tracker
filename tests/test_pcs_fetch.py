import pathlib
import pcs_fetch


FIX = pathlib.Path(__file__).parent / "fixtures"


def test_is_challenge_detects_cloudflare():
    html = (FIX / "challenge.html").read_text()
    assert pcs_fetch.is_challenge(html) is True


def test_is_challenge_passes_real_page():
    html = "<html><head><title>Tadej Pogačar</title></head><body><table><tr><td>Real page content goes here with plenty of text to make sure it's longer than 200 characters so it doesn't fail the short-page check and can properly test the marker detection logic for real pages</td></tr></table></body></html>"
    assert pcs_fetch.is_challenge(html) is False


def test_cache_path_is_slugified_under_cache_dir():
    p = pcs_fetch.cache_path("race/tour-de-france/2025/stage-21")
    assert p.suffix == ".html"
    assert ".pcs_cache" in str(p)
    # no path separators from the PCS path leak into a directory tree
    assert p.parent.name == ".pcs_cache"


def test_get_html_returns_fresh_cache_without_network(tmp_path, monkeypatch):
    # Point the cache at a temp dir and pre-seed a cache file.
    monkeypatch.setattr(pcs_fetch, "CACHE_DIR", tmp_path)

    def boom(path):  # network must NOT be called when cache is fresh
        raise AssertionError("network called despite fresh cache")

    monkeypatch.setattr(pcs_fetch, "_fetch_cloudscraper", boom)
    path = "rider/tadej-pogacar"
    pcs_fetch.cache_path(path).write_text("<html>cached</html>")
    assert pcs_fetch.get_html(path) == "<html>cached</html>"
