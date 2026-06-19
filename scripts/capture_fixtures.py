"""One-off: capture real PCS HTML into tests/fixtures for offline parser tests."""
import pathlib
import pcs_fetch

OUT = pathlib.Path(__file__).parent.parent / "tests" / "fixtures"
TARGETS = {
    "stage-21-gc.html": "race/tour-de-france/2025/stage-21",
    "rider-pogacar.html": "rider/tadej-pogacar",
}
OUT.mkdir(parents=True, exist_ok=True)
for name, path in TARGETS.items():
    html = pcs_fetch.get_html(path, force=True)
    (OUT / name).write_text(html, encoding="utf-8")
    print(f"wrote {name} ({len(html)} bytes)")
