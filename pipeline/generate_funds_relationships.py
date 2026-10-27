"""Generate 'funds' relationships for data/relationships.json.

Semantics: ``from`` appropriates funding for ``to``; ``amount`` is the
recipient's annual budget in CAD (null when the recipient's budget is
unknown — e.g. self-funded Crown corporations or foreign aid targets).

What it does:

1. Ensures every non-ForeignCountry entity has at least one incoming
   'funds' edge. Entities without a curated funder get a default
   ``parliament -> entity`` edge (appropriation through the Estimates).
2. Backfills ``amount`` on every 'funds' edge from the recipient's budget.
3. Leaves curated non-parliament funding edges untouched.

Idempotent — safe to re-run after editing entities or curated edges.

Run from anywhere:  python pipeline/generate_funds_relationships.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"


def main():
    with open(DATA / "entities.json", encoding="utf-8") as f:
        entities = json.load(f)
    with open(DATA / "relationships.json", encoding="utf-8") as f:
        relationships = json.load(f)

    by_id = {e["id"]: e for e in entities}
    existing = {(r["from"], r["to"], r["type"]) for r in relationships}

    funded = {r["to"] for r in relationships if r["type"] == "funds"}

    added = 0
    for e in entities:
        if e["type"] == "ForeignCountry":
            continue  # aid flows are international_aid edges, not funds
        if e["id"] in funded or not by_id.get(e["id"]):
            continue
        if e["id"] == "parliament":
            continue  # Parliament appropriates; it does not fund itself
        key = ("parliament", e["id"], "funds")
        if key in existing:
            continue
        relationships.append({
            "from": "parliament",
            "to": e["id"],
            "type": "funds",
            "amount": e.get("budget"),
        })
        existing.add(key)
        funded.add(e["id"])
        added += 1

    # Backfill amount = recipient budget on every funds edge.
    with_amount = 0
    for rel in relationships:
        if rel["type"] != "funds":
            continue
        target = by_id.get(rel["to"])
        amount = target.get("budget") if target else None
        if rel.get("amount") != amount:
            rel["amount"] = amount
        if amount is not None:
            with_amount += 1

    with open(DATA / "relationships.json", "w", encoding="utf-8") as f:
        json.dump(relationships, f, indent=2, ensure_ascii=False)
        f.write("\n")

    total_funds = len([r for r in relationships if r["type"] == "funds"])
    print(f"added {added} parliament appropriation edges")
    print(f"funds edges: {total_funds} ({with_amount} with amount)")


if __name__ == "__main__":
    main()
