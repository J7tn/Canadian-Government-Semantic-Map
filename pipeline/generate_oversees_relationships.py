"""Regenerate 'oversees' relationships from entity `parent` fields.

Direction convention:  parent --oversees--> child
(the arrowhead points at the entity being overseen, matching the legend:
"which entities oversee others"). Edges authored by earlier versions of
this script used the reverse direction.

Existing curated oversees edges are kept; generated edges are
synchronized with the current parent fields: missing ones added, stale
wrong-direction duplicates removed.

Run from anywhere:  python pipeline/generate_oversees_relationships.py
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

    # Desired generated edges: parent -> child for every entity with a parent.
    desired = {
        (e["parent"], e["id"])
        for e in entities
        if e.get("parent") and e["parent"] != e["id"]
    }

    current_oversees = {(r["from"], r["to"]) for r in relationships
                        if r["type"] == "oversees"}

    added = 0
    for frm, to in sorted(desired - current_oversees):
        relationships.append({"from": frm, "to": to, "type": "oversees"})
        added += 1

    # Drop wrong-direction edges whose correct parent->child edge exists.
    rel_keys = {(r["from"], r["to"], r["type"]) for r in relationships}
    removed = 0
    kept = []
    for r in relationships:
        if r["type"] == "oversees" \
                and (r["to"], r["from"]) in desired \
                and (r["to"], r["from"], "oversees") in rel_keys:
            removed += 1
            continue
        kept.append(r)

    with open(DATA / "relationships.json", "w", encoding="utf-8") as f:
        json.dump(kept, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"added {added}, removed {removed} stale/duplicate")
    print(f"total oversees: "
          f"{len([r for r in kept if r['type'] == 'oversees'])}")


if __name__ == "__main__":
    main()

