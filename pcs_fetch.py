"""The single seam for all procyclingstats HTTP.

Tiers: fresh cache -> cloudscraper -> (Playwright, added later) -> PCSBlockedError.
Every successful fetch is cached as raw HTML keyed by the PCS path.
"""
import pathlib
import time

BASE_URL = "https://www.procyclingstats.com/"
CACHE_DIR = pathlib.Path(__file__).parent / ".pcs_cache"
_RATE_LIMIT_SECONDS = 2.0
_last_fetch_at = 0.0
_scraper = None


class PCSBlockedError(Exception):
    """Raised when PCS returns a Cloudflare challenge (or is otherwise unreachable)."""


def is_challenge(html: str) -> bool:
    """True if the HTML is a Cloudflare interstitial rather than real content."""
    if not html or len(html) < 200:
        return True
    markers = ("Just a moment", "_cf_chl_opt", "Enable JavaScript and cookies")
    return any(m in html for m in markers)


def cache_path(path: str) -> pathlib.Path:
    slug = path.strip("/").replace("/", "__").replace("?", "_").replace("&", "_")
    return CACHE_DIR / f"{slug}.html"


def _fetch_cloudscraper(path: str) -> str:
    """Fetch one page via cloudscraper with polite rate limiting."""
    global _scraper, _last_fetch_at
    import cloudscraper
    if _scraper is None:
        _scraper = cloudscraper.create_scraper()
    wait = _RATE_LIMIT_SECONDS - (time.monotonic() - _last_fetch_at)
    if wait > 0:
        time.sleep(wait)
    resp = _scraper.get(BASE_URL + path.strip("/"), timeout=30)
    _last_fetch_at = time.monotonic()
    return resp.text


def _fetch_playwright(path: str) -> str:
    """Headless-browser fetch that solves the Cloudflare challenge. Lazy import."""
    try:
        from playwright.sync_api import sync_playwright
    except ImportError as e:
        raise PCSBlockedError("Playwright not installed; run `pip install playwright && playwright install chromium`") from e
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        try:
            page = browser.new_page()
            page.goto(BASE_URL + path.strip("/"), wait_until="networkidle", timeout=60000)
            html = page.content()
        finally:
            browser.close()
    return html


def get_html(path: str, *, max_age_seconds: int = 21600, force: bool = False) -> str:
    """Return trustworthy HTML for a PCS path, or raise PCSBlockedError.

    max_age_seconds: serve cache younger than this (default 6h). force re-fetches.
    """
    cp = cache_path(path)
    if not force and cp.exists():
        age = time.time() - cp.stat().st_mtime
        if age < max_age_seconds:
            return cp.read_text(encoding="utf-8")

    html = _fetch_cloudscraper(path)
    if is_challenge(html):
        html = _fetch_playwright(path)
    if is_challenge(html):
        raise PCSBlockedError(
            f"Cloudflare challenge for '{path}'. Tried: cloudscraper, Playwright. "
            "Run from a residential network."
        )

    CACHE_DIR.mkdir(exist_ok=True)
    cp.write_text(html, encoding="utf-8")
    return html
