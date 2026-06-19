"""Resolve a typed rider name to a validated {slug, name, team} via the PCS rider page."""
import re
import unicodedata
import pcs_parse
import pcs_fetch


def slugify_name(query: str) -> str:
    # Strip accents (Pogačar -> pogacar), then turn every run of non-alphanumeric
    # characters — spaces, apostrophes, periods — into a single hyphen, matching
    # PCS slug convention (O'Connor -> o-connor). Letters like ø/ł that NFKD does
    # not decompose won't map; the caller falls back to pasting the rider/<slug>.
    norm = unicodedata.normalize("NFKD", query)
    norm = "".join(c for c in norm if not unicodedata.combining(c))
    norm = re.sub(r"[^a-z0-9]+", "-", norm.lower()).strip("-")
    return norm


def resolve_rider(query: str) -> dict | None:
    """Return {slug, name, team} or None if no rider page resolves."""
    q = query.strip()
    if q.startswith("rider/"):
        slug = q
    elif "/" not in q and "-" in q and " " not in q:
        slug = f"rider/{q}"           # already a bare slug like 'tadej-pogacar'
    else:
        slug = f"rider/{slugify_name(q)}"
    try:
        return pcs_parse.fetch_rider(slug)
    except (ValueError, pcs_fetch.PCSBlockedError):
        return None
