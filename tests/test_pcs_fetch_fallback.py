import pcs_fetch


def test_get_html_escalates_to_playwright(tmp_path, monkeypatch):
    monkeypatch.setattr(pcs_fetch, "CACHE_DIR", tmp_path)
    monkeypatch.setattr(pcs_fetch, "_fetch_cloudscraper",
                        lambda path: "<html><title>Just a moment...</title></html>")
    monkeypatch.setattr(pcs_fetch, "_fetch_playwright",
                        lambda path: "<html><title>Tadej Pogačar</title><body><table><tr><td>Real page content goes here with plenty of text to make sure it's longer than 200 characters so it doesn't fail the short-page check and can properly test the escalation logic for real pages from the playwright fallback</td></tr></table></body></html>")
    html = pcs_fetch.get_html("rider/tadej-pogacar", force=True)
    assert "Pogačar" in html
