"""Regenerate 'oversees' relationships from entity `parent` fields.

Direction convention:  parent --oversees--> child
(the arrowhead points at the entity being overseen, matching the legend:
"which entities oversee others").

Regeneration is wholesale: every oversees edge without an explicit
``"curated": true`` flag is rebuilt from the current parent fields, so
stale edges disappear automatically when a parent changes or is removed.
Curated edges (e.g. parliament -> statistics-canada, which oversees but
is not StatCan's portfolio parent) survive untouched.

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

    desired = {
        (e["parent"], e["id"])
        for e in entities
        if e.get("parent") and e["parent"] != e["id"]
    }

    curated = [r for r in relationships
               if r["type"] == "oversees" and r.get("curated")]
    curated_pairs = {(r["from"], r["to"]) for r in curated}

    others = [r for r in relationships if r["type"] != "oversees"]
    generated = [
        {"from": frm, "to": to, "type": "oversees"}
        for frm, to in sorted(desired - curated_pairs)
    ]

    kept = others + generated + curated
    removed = (
        len([r for r in relationships if r["type"] == "oversees"])
        - len(curated)
        - len(desired & (current_pairs := {
            (r["from"], r["to"]) for r in relationships
            if r["type"] == "oversees"}))
    )

    with open(DATA / "relationships.json", "w", encoding="utf-8") as f:
        json.dump(kept, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"regenerated {len(generated)} from parent fields, "
          f"kept {len(curated)} curated, removed {max(removed, 0)} stale")
    print(f"total oversees: "
          f"{len([r for r in kept if r['type'] == 'oversees'])}")


if __name__ == "__main__":
    main()

