"""Apply the Main Estimates standard-object CSV to data/entities.json.

For every CSV organization that maps to an entity (by name or alias):

1. Writes `spendingBreakdown` — each spending category as a fraction of
   net expenditure (Total minus revenue reductions), matching the keys
   in src/config/graphTheme.js::SPENDING_CATEGORIES.
2. Audits `budget` against the CSV Total column — mismatches are
   reported but NOT overwritten (the entity may intentionally use a
   different fiscal figure; a human decides).

Orgs that match no entity are printed for manual review.

Run from anywhere:  python pipeline/apply_main_estimates.py
"""
import csv
import io
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
CSV_PATH = ROOT / "pipeline" / "budgetary-expenditures-standard-object.csv"
SRC = (
    "https://www.canada.ca/content/dam/tbs-sct/documents/planned-"
    "government-spending/main-estimates/2024-25/"
    "budgetary-expenditures-standard-object.csv"
)

# CSV column order (0-indexed) — header row is line 9 in the file:
# Organization, Personnel, Transportation and communications, Information,
# Professional and special services, Rentals, Purchased repair and
# maintenance, Utilities materials and supplies, Acquisition of land
# buildings and works, Acquisition of machinery and equipment,
# Transfer payments, Public debt charges, Other subsidies and payments,
# Less: Revenues and other reductions, Total
CATEGORY_COLUMNS = {
    "personnel": 1,
    "transportation": 2,
    "information": 3,
    "professional_services": 4,
    "rentals": 5,
    "maintenance": 6,
    "utilities": 7,
    # 'capital' = land/buildings (8) + machinery/equipment (9), merged below
    "transfer_payments": 10,
    "public_debt": 11,
    "other_subsidies": 12,
}
REVENUES_COL = 13
TOTAL_COL = 14


def parse_currency(value):
    if not value:
        return 0.0
    try:
        return float(value.replace(",", "").replace("$", "").strip())
    except ValueError:
        return 0.0


def read_csv_rows():
    """Return (org_name, fields) rows, skipping the preamble."""
    text = None
    for enc in ("utf-8", "latin-1", "cp1252", "iso-8859-1"):
        try:
            text = CSV_PATH.read_text(encoding=enc)
            break
        except UnicodeDecodeError:
            continue
    if text is None:
        raise RuntimeError("Could not decode CSV")

    lines = text.splitlines()
    header_idx = next(
        i for i, line in enumerate(lines) if "Organization" in line
    )
    reader = csv.reader(io.StringIO("\n".join(lines[header_idx + 2:])))
    for fields in reader:
        if fields and fields[0].strip() and fields[0].strip() != "Total":
            yield fields[0].strip().strip('"'), fields


def norm(name):
    """Normalize a name for matching: lowercase, collapse punctuation."""
    out = []
    for ch in name.lower():
        out.append(ch if ch.isalnum() or ch.isspace() else " ")
    return " ".join("".join(out).split())


def main():
    entities = json.loads((DATA / "entities.json").read_text(encoding="utf-8"))

    # name/alias -> entity lookup
    lookup = {}
    for e in entities:
        lookup[norm(e["name"])] = e
        for alias in e.get("aliases", []):
            lookup[norm(alias)] = e

    updated = 0
    unmatched = []
    mismatches = []

    for org, fields in read_csv_rows():
        entity = lookup.get(norm(org))
        if entity is None:
            unmatched.append(org)
            continue

        values = {
            key: parse_currency(fields[idx]) if len(fields) > idx else 0.0
            for key, idx in CATEGORY_COLUMNS.items()
        }
        values["capital"] = (
            (parse_currency(fields[8]) if len(fields) > 8 else 0.0)
            + (parse_currency(fields[9]) if len(fields) > 9 else 0.0)
        )
        total = parse_currency(fields[TOTAL_COL]) if len(fields) > TOTAL_COL else 0.0
        # Denominator is the GROSS category sum, not the CSV Total: Total
        # is net of 'Less: Revenues and other reductions', so normalizing
        # by it breaks cost-recovering orgs (e.g. PSPC fractions > 1).
        # Gross share keeps the breakdown a composition that sums to ~1.
        gross = sum(values.values())

        if gross > 0:
            entity["spendingBreakdown"] = {
                key: round(v / gross, 9) for key, v in values.items() if v > 0
            }
            updated += 1

        if entity.get("budget") is not None and total > 0:
            if abs(entity["budget"] - total) > 1:
                mismatches.append((entity["id"], entity["budget"], total))
        elif entity.get("budget") is None and total > 0:
            mismatches.append((entity["id"], None, total))

    (DATA / "entities.json").write_text(
        json.dumps(entities, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    print(f"spendingBreakdown written for {updated} entities")
    print(f"unmatched CSV orgs ({len(unmatched)}):")
    for org in unmatched:
        print(f"  {org}")
    print(f"budget mismatches ({len(mismatches)}):")
    for eid, ours, theirs in mismatches:
        ours_s = f"${ours:,.0f}" if ours is not None else "null"
        print(f"  {eid}: entities.json={ours_s}  csv=${theirs:,.0f}")


if __name__ == "__main__":
    main()
