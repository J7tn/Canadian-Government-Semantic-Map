"""Validate data/*.json for referential integrity and schema sanity.

Run from anywhere:  python pipeline/validate_data.py
Exits 1 on any error so CI can gate deployment on data health.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"

KNOWN_ENTITY_TYPES = {
    "Ministry", "Agency", "CrownCorporation", "Program", "Other", "ForeignCountry"
}
KNOWN_REL_TYPES = {
    "reports_to", "oversees", "funds", "international_aid"
}
KNOWN_SPENDING_KEYS = {
    "personnel", "transportation", "information", "professional_services",
    "rentals", "maintenance", "utilities", "capital", "transfer_payments",
    "public_debt", "other_subsidies"
}

errors = []
warnings = []


def load(name):
    path = DATA / name
    if not path.exists():
        errors.append(f"{name}: file not found")
        return []
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        errors.append(f"{name}: invalid JSON — {e}")
        return []


def main():
    entities = load("entities.json")
    relationships = load("relationships.json")
    layout = load("layout.json")
    load("sources.json")  # parseability check only

    if not isinstance(entities, list):
        errors.append("entities.json: root must be a list")
        entities = []
    if not isinstance(relationships, list):
        errors.append("relationships.json: root must be a list")
        relationships = []

    ids = set()
    seen = set()
    seen_names = {}
    for i, entity in enumerate(entities):
        eid = entity.get("id")
        loc = f"entities[{i}] ({eid or 'no id'})"

        if not eid:
            errors.append(f"{loc}: missing 'id'")
            continue
        if eid in seen:
            errors.append(f"{loc}: duplicate id '{eid}'")
        seen.add(eid)
        ids.add(eid)

        # Two records claiming the same real-world org split its edges
        # and double-count its budget — a sync artifact, not a structure.
        name = entity.get("name")
        if name:
            if name in seen_names:
                errors.append(
                    f"{loc}: duplicate name '{name}' "
                    f"(also entities[{seen_names[name]}])"
                )
            else:
                seen_names[name] = i

        if not entity.get("name"):
            errors.append(f"{loc}: missing 'name'")
        if entity.get("type") not in KNOWN_ENTITY_TYPES:
            errors.append(f"{loc}: unknown type '{entity.get('type')}'")
        if entity.get("budget") is not None and (
            not isinstance(entity["budget"], (int, float)) or entity["budget"] < 0
        ):
            errors.append(f"{loc}: budget must be a non-negative number or null")

        breakdown = entity.get("spendingBreakdown")
        if breakdown is not None:
            if not isinstance(breakdown, dict):
                errors.append(f"{loc}: spendingBreakdown must be an object")
            else:
                for key, value in breakdown.items():
                    if key not in KNOWN_SPENDING_KEYS:
                        warnings.append(f"{loc}: unknown spendingBreakdown key '{key}'")
                    if not isinstance(value, (int, float)) or not 0 <= value <= 1:
                        errors.append(
                            f"{loc}: spendingBreakdown.{key} must be a fraction in [0,1]"
                        )
                total = sum(v for v in breakdown.values() if isinstance(v, (int, float)))
                if not 0.9 <= total <= 1.1:
                    warnings.append(
                        f"{loc}: spendingBreakdown sums to {total:.3f} (expected ~1.0)"
                    )

    for i, entity in enumerate(entities):
        parent = entity.get("parent")
        if parent is not None and parent not in ids:
            errors.append(f"entities[{i}] ({entity.get('id')}): parent '{parent}' not in entities")

    by_id = {e.get("id"): e for e in entities}
    seen_edges = set()
    for i, rel in enumerate(relationships):
        loc = f"relationships[{i}]"
        frm, to, rtype = rel.get("from"), rel.get("to"), rel.get("type")
        if frm not in ids:
            errors.append(f"{loc}: 'from' id '{frm}' not in entities")
        if to not in ids:
            errors.append(f"{loc}: 'to' id '{to}' not in entities")
        if rtype not in KNOWN_REL_TYPES:
            errors.append(f"{loc}: unknown relationship type '{rtype}'")
        if rtype == "funds" and by_id.get(to, {}).get("type") == "ForeignCountry":
            errors.append(
                f"{loc}: 'funds' edge targets ForeignCountry '{to}' — "
                "aid flows use 'international_aid'"
            )
        if rtype != "funds" and rel.get("amount") is not None:
            warnings.append(f"{loc}: 'amount' on a non-funds edge")
        key = (frm, to, rtype)
        if key in seen_edges:
            warnings.append(f"{loc}: duplicate edge {key}")
        seen_edges.add(key)

    # Coverage: every appropriated org should have an incoming funds edge
    # (replaces the old find_missing_funds.py).
    funded = {r.get("to") for r in relationships if r.get("type") == "funds"}
    for entity in entities:
        if entity.get("type") == "ForeignCountry":
            continue  # aid uses international_aid edges, not funds
        if entity.get("id") == "parliament":
            continue  # Parliament appropriates; it does not fund itself
        if entity.get("status") in ("defunct", "fictional"):
            continue  # no current funding by design
        if entity.get("id") not in funded:
            warnings.append(
                f"{entity.get('id')}: no incoming 'funds' edge"
            )

    # 'amount' semantics: the recipient's appropriation — carried on the
    # PRIMARY funding edge only (the sole incoming funds edge, or the
    # parliament edge when several channels exist). Secondary channels
    # (e.g. TBS central votes, portfolio routing) have unknown draws and
    # keep amount null — copying the full budget onto them double-counts.
    incoming = {}
    for rel in relationships:
        if rel.get("type") == "funds":
            incoming.setdefault(rel.get("to"), []).append(rel)
    for i, rel in enumerate(relationships):
        if rel.get("type") != "funds":
            continue
        target = by_id.get(rel.get("to"))
        edges = incoming.get(rel.get("to"), [])
        primary = len(edges) == 1 or rel.get("from") == "parliament"
        if (
            primary
            and target
            and target.get("budget") is not None
            and rel.get("amount") is None
        ):
            warnings.append(
                f"relationships[{i}]: primary funds edge "
                f"{rel.get('from')} -> {rel.get('to')} missing 'amount'"
            )

    # Hierarchy cross-check: parent fields drive generated 'oversees'
    # edges; 'reports_to' is curated. Flag pairs where the three don't
    # agree — curating a divergence deliberately means marking the
    # oversees edge 'curated: true'.
    parent_of = {e.get("id"): e.get("parent") for e in entities}
    oversees_pairs = {(r.get("from"), r.get("to")) for r in relationships
                      if r.get("type") == "oversees"}
    for i, rel in enumerate(relationships):
        if rel.get("type") == "oversees":
            if parent_of.get(rel.get("to")) != rel.get("from") \
                    and not rel.get("curated"):
                warnings.append(
                    f"relationships[{i}]: oversees "
                    f"{rel.get('from')} -> {rel.get('to')} not backed by "
                    "a parent field (mark 'curated': true if intentional)"
                )
        elif rel.get("type") == "reports_to":
            frm, to = rel.get("from"), rel.get("to")
            if parent_of.get(frm) != to and (to, frm) not in oversees_pairs:
                warnings.append(
                    f"relationships[{i}]: reports_to "
                    f"{frm} -> {to} matches no parent field or oversees edge"
                )

    if isinstance(layout, dict):
        for key in layout:
            if key not in ids:
                warnings.append(f"layout.json: position for unknown id '{key}'")
    elif layout:
        errors.append("layout.json: root must be an object")

    print(f"Checked {len(entities)} entities, {len(relationships)} relationships.")
    for w in warnings:
        print(f"  WARN  {w}")
    for e in errors:
        print(f"  ERROR {e}")
    print(f"\n{len(errors)} error(s), {len(warnings)} warning(s)")
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
