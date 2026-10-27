"""Idempotent data maintenance for data/*.json.

Applies structural fixes and backfills that should hold for the dataset:

1. Ensures entities that exist in the Main Estimates CSV are present
   (currently: Leaders' Debates Commission, Office of the Governor
   General's Secretary). Matching is by NAME — a record whose name
   already exists under a different id upgrades that record in place,
   keeping the established id, rather than appending a duplicate.
2. Ensures Global Affairs carries the DFATD alias used by the CSV.
3. Normalizes 'oversees' edge direction to parent -> child (arrow points
   at the entity being overseen, matching the legend).
4. Backfills 'funds' edge 'amount' with the recipient's annual budget on
   primary edges only — the sole incoming funds edge, or the parliament
   edge when several funding channels exist. Secondary channels (TBS
   central votes, portfolio routing) carry null: the draw is real but
   unknown, and copying the full budget double-counts the money.
5. Creates missing reports_to / oversees / funds edges + a layout
   position for each ensured entity.

Safe to re-run: every step checks before mutating.

Run from anywhere:  python pipeline/sync_data.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
SRC = (
    "https://www.canada.ca/content/dam/tbs-sct/documents/planned-"
    "government-spending/main-estimates/2024-25/"
    "budgetary-expenditures-standard-object.csv"
)

# Entities present in the Main Estimates CSV that the dataset was missing.
MISSING_ENTITIES = [
    {
        "id": "leaders-debates-commission",
        "name": "Leaders' Debates Commission",
        "type": "Agency",
        "parent": "parliament",
        "budget": 3513078,
        "budgetVerified": True,
        "description": (
            "Independent body responsible for organizing the federal "
            "leaders' debates during general elections."
        ),
        "source": SRC,
        "sourceParsedDate": "2026-06-07",
        "lastUpdated": "2026-10-26",
        "aliases": ["Leaders Debates Commission", "Debates Commission"],
    },
    {
        "id": "office-governor-generals-secretary",
        "name": "Office of the Governor General's Secretary",
        "type": "Agency",
        "parent": "parliament",
        "budget": 25570788,
        "budgetVerified": True,
        "description": (
            "Supports the Governor General in carrying out constitutional, "
            "ceremonial, and community duties; administers the Canadian "
            "honours system."
        ),
        "source": SRC,
        "sourceParsedDate": "2026-06-07",
        "lastUpdated": "2026-10-26",
        "aliases": ["OGGS", "Governor General's Office", "Rideau Hall"],
    },
]


# Budgets verified against primary disclosures for entities that do not
# appear in the Main Estimates CSV (self-funded or statutory payments).
VERIFIED_BUDGETS = {
    # 2024-25 statutory payments under s.23 Canada Infrastructure Bank Act
    # (Finance Canada Main Estimates scenario notes).
    "cib": {
        "budget": 3619719000,
        "budgetVerified": True,
        "source": "https://www.canada.ca/en/department-finance/corporate/transparency/2025/cow-cp-scenario-notes-eng.html",
        "sourceParsedDate": "2026-10-26",
    },
    # 2023-24 services revenue, DCC Annual Report 2023-24 (self-funded via
    # billed services to DND/CSE/SSC — no direct appropriation).
    "defence-construction": {
        "budget": 179952000,
        "budgetVerified": True,
        "source": "https://www.dcc-cdc.gc.ca/documents/reports/Annual_Report_2023-24_Accessible2.pdf",
        "sourceParsedDate": "2026-10-26",
    },
    # ~$226.3M operating expenditures, CIPO financial statistics 2024-25
    # (revolving fund — fee-funded, no parliamentary appropriation).
    "patent-office": {
        "budget": 226277065,
        "budgetVerified": True,
        "source": "https://ised-isde.canada.ca/site/canadian-intellectual-property-office/en/canadian-intellectual-property-statistics/financial-information-statistics-2024-2025",
        "sourceParsedDate": "2026-10-26",
    },
}

# Entities that no longer exist as independent federal organizations.
# Kept in the graph with a `status` flag rather than deleted, since
# they carry historical relationships; `status` is surfaced in the
# entity description.
ENTITY_STATUS = {
    "ridley": {
        "status": "defunct",
        "note": (
            "Sold December 2019: 90% divested to Riverstone/AMCI for $350M, "
            "10% to a Lax Kw'alaams-Metlakatla First Nations partnership "
            "(CDEV). No longer a Crown corporation."
        ),
        "source": "https://cdev.gc.ca/divestment-of-ridley-terminals-inc-closes/",
    },
    "old-port": {
        "status": "defunct",
        "note": (
            "Amalgamated into Canada Lands Company CLC Ltd., November 2012; "
            "continues only as an operating division."
        ),
        "source": "https://www.canada.ca/en/news/archive/2012/11/harper-government-takes-action-enhance-accountability-consolidating-canada-lands-subsidiaries.html",
    },
    "parc-downsview": {
        "status": "defunct",
        "note": (
            "Amalgamated into Canada Lands Company CLC Ltd., November 2012; "
            "continues only as an operating division."
        ),
        "source": "https://www.canada.ca/en/news/archive/2012/11/harper-government-takes-action-enhance-accountability-consolidating-canada-lands-subsidiaries.html",
    },
    "clcc": {
        "status": "fictional",
        "note": (
            "Does not appear in any federal registry or official publication. "
            "Likely a placeholder or fabricated entry — flagged for removal."
        ),
        "source": None,
    },
}

# Curated 'why this number' explanations, rendered in the Sidebar via
# src/utils/budgetInsight.js. Only for entities where the raw figure
# is misleading without context; everything else gets an auto-derived
# explanation from spendingBreakdown composition.
BUDGET_CONTEXT = {
    "cib": (
        "Statutory investment capital, not operating expense — the Bank "
        "makes repayable loans and equity investments in infrastructure. "
        "Parliament authorized up to $35B in payments; the maximum cost "
        "to taxpayers is capped at $15B."
    ),
    "esdc": (
        "Mostly passthrough benefits — Old Age Security, EI, and other "
        "transfers to individuals. The department's own operations are a "
        "small fraction of this total."
    ),
    "finance": (
        "Dominated by statutory transfers and public debt charges that "
        "flow through Finance — health/social transfers, equalization, "
        "and interest on the debt — rather than departmental spending."
    ),
    "treasury-board": (
        "Holds central appropriations on behalf of all departments — "
        "contingencies, employee benefit plan contributions, and "
        "government-wide funds — so this is not TBS's own operating cost."
    ),
    "national-defence": (
        "Canada's largest departmental budget — military personnel pay, "
        "equipment procurement, and operations across the CAF."
    ),
    "patent-office": (
        "Fee-funded revolving fund — CIPO pays its operating costs from "
        "patent, trademark, and industrial-design application fees and "
        "does not draw a parliamentary appropriation."
    ),
    "defence-construction": (
        "Services revenue, not an appropriation — DCC bills DND, CSE, and "
        "Shared Services for contract management; roughly $1.3B in "
        "contract payments pass through to construction contractors."
    ),
    "ukraine": (
        "Cumulative Canadian military, humanitarian, and financial "
        "assistance since Russia's 2022 full-scale invasion — an aid "
        "total, not a departmental budget."
    ),
    "global-affairs": (
        "Includes Canada's international assistance programming — a large "
        "share is transferred to partner countries and organizations "
        "rather than spent on department operations."
    ),
}


# Wrong-data corrections.
PARENT_FIXES = {
    # StatCan reports to Parliament through the Minister of Innovation
    # (ISED) — the flat parent=parliament was a stale input. Its
    # reports_to/oversees edges already say ISED.
    "statistics-canada": "ISED",
}

# Entities flagged defunct/fictional have no current hierarchy or
# funding — their parent fields are cleared so the generators don't
# recreate edges, and every relationship touching them is removed.
CLEAR_PARENT = set(ENTITY_STATUS) | {"ukraine"}

# Specific non-flagged edges that are semantically wrong: a foreign
# country is not overseen by, and does not report to, Global Affairs —
# the real relationship is international_aid (+funds).
DROP_EDGES = {
    ("global-affairs", "ukraine", "oversees"),
    ("ukraine", "global-affairs", "reports_to"),
}


# 'funds' edge 'from' corrections: funder -> recipient pairs whose
# appropriator was wrong.
FUNDS_REPARENT = {
    # CIB statutory payments flow through Finance Canada's Main Estimates
    # vote, not ISED's.
    "cib": "finance",
}


def load(name):
    with open(DATA / name, encoding="utf-8") as f:
        return json.load(f)


def save(name, data):
    with open(DATA / name, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")


def main():
    entities = load("entities.json")
    rels = load("relationships.json")
    layout = load("layout.json")
    by_id = {e["id"]: e for e in entities}
    existing = {(r["from"], r["to"], r["type"]) for r in rels}

    # 1. Missing entities — matched by NAME, not id. A record whose
    # name already exists upgrades in place (keeping the established
    # id that edges/layout reference); only a genuinely new name is
    # appended. Matching by id alone would silently create a second
    # record for the same organization.
    by_name = {e["name"]: e for e in entities}
    added = 0
    resolved_ids = []
    for ne in MISSING_ENTITIES:
        existing_entity = by_name.get(ne["name"])
        if existing_entity is not None:
            for key, value in ne.items():
                if key == "id":
                    continue  # keep the established id
                if key == "aliases":
                    merged = existing_entity.setdefault("aliases", [])
                    for alias in value:
                        if alias not in merged:
                            merged.append(alias)
                else:
                    existing_entity[key] = value
            resolved_ids.append(existing_entity["id"])
        elif ne["id"] not in by_id:
            entities.append(ne)
            by_id[ne["id"]] = ne
            by_name[ne["name"]] = ne
            resolved_ids.append(ne["id"])
            added += 1

    # 1b. Verified budgets for non-appropriated entities
    verified = 0
    for eid, patch in VERIFIED_BUDGETS.items():
        e = by_id.get(eid)
        if e is None:
            continue
        for key, value in patch.items():
            if e.get(key) != value:
                e[key] = value
                verified += 1

    # 1c. Defunct/fictional status flags + updated descriptions
    flagged = 0
    for eid, info in ENTITY_STATUS.items():
        e = by_id.get(eid)
        if e is None:
            continue
        if e.get("status") != info["status"]:
            e["status"] = info["status"]
            flagged += 1
        if info["source"] and e.get("source") != info["source"]:
            e["source"] = info["source"]
        if info["note"] not in e.get("description", ""):
            e["description"] = (
                e.get("description", "").rstrip() + " [" + info["note"] + "]"
            ).strip()

    # 1d. Curated budget context ('why this number')
    contexted = 0
    for eid, context in BUDGET_CONTEXT.items():
        e = by_id.get(eid)
        if e is not None and e.get("budgetContext") != context:
            e["budgetContext"] = context
            contexted += 1

    # 2. DFATD alias on Global Affairs
    ga = by_id.get("global-affairs")
    if ga is not None:
        aliases = ga.setdefault("aliases", [])
        if "Department of Foreign Affairs, Trade and Development" not in aliases:
            aliases.append("Department of Foreign Affairs, Trade and Development")

    # 2b. Wrong-data corrections: parent fixes, cleared parents,
    #     edge removal.
    parents_fixed = 0
    for eid, parent in PARENT_FIXES.items():
        e = by_id.get(eid)
        if e is not None and e.get("parent") != parent:
            e["parent"] = parent
            parents_fixed += 1
    for eid in CLEAR_PARENT:
        e = by_id.get(eid)
        if e is not None and e.get("parent") is not None:
            e["parent"] = None
            parents_fixed += 1

    dead = set(ENTITY_STATUS)
    before = len(rels)
    rels[:] = [
        r for r in rels
        if r["from"] not in dead
        and r["to"] not in dead
        and (r["from"], r["to"], r["type"]) not in DROP_EDGES
    ]
    edges_dropped = before - len(rels)

    # 3. oversees direction -> parent to child.
    #    Legacy edges were emitted child -> parent; detect by checking
    #    whether 'to' is actually the parent of 'from'.
    flipped = 0
    for rel in rels:
        if rel["type"] != "oversees":
            continue
        frm = by_id.get(rel["from"])
        to = by_id.get(rel["to"])
        if frm is None or to is None:
            continue
        # If 'to' is the parent of 'from', the edge points the wrong way.
        if frm.get("parent") == rel["to"]:
            rel["from"], rel["to"] = rel["to"], rel["from"]
            flipped += 1

    existing = {(r["from"], r["to"], r["type"]) for r in rels}

    # 3b. funds edge re-pointing to the correct appropriator
    repointed = 0
    for rel in rels:
        if rel["type"] == "funds" and rel["to"] in FUNDS_REPARENT:
            wanted = FUNDS_REPARENT[rel["to"]]
            if rel["from"] != wanted:
                rel["from"] = wanted
                repointed += 1

    # 4. funds amount backfill
    def add_rel(frm, to, rtype, **extra):
        key = (frm, to, rtype)
        if key not in existing:
            rels.append({"from": frm, "to": to, "type": rtype, **extra})
            existing.add(key)

    incoming = {}
    for rel in rels:
        if rel["type"] == "funds":
            incoming.setdefault(rel["to"], []).append(rel)

    amounted = 0
    for rel in rels:
        if rel["type"] != "funds":
            continue
        edges = incoming.get(rel["to"], [])
        primary = len(edges) == 1 or rel["from"] == "parliament"
        target = by_id.get(rel["to"])
        amount = (target.get("budget") if target else None) if primary else None
        if rel.get("amount") != amount:
            rel["amount"] = amount
        if amount is not None:
            amounted += 1

    # 5. Edges + layout for ensured entities — resolved ids, so a
    # name-matched record repairs its own edges instead of minting
    # edges for a phantom id.
    px = layout.get("parliament", {}).get("x", 0)
    py = layout.get("parliament", {}).get("y", 0)
    for i, eid in enumerate(resolved_ids):
        e = by_id[eid]
        add_rel(eid, "parliament", "reports_to")
        add_rel("parliament", eid, "oversees")
        add_rel("parliament", eid, "funds", amount=e.get("budget"))
        offset = -220 + i * 440
        layout.setdefault(eid, {"x": px + offset, "y": py - 180})

    save("entities.json", entities)
    save("relationships.json", rels)
    save("layout.json", layout)

    print(f"entities added: {added}")
    print(f"verified budget fields written: {verified}")
    print(f"status flags applied: {flagged}")
    print(f"budget contexts written: {contexted}")
    print(f"parents fixed/cleared: {parents_fixed}")
    print(f"wrong edges dropped: {edges_dropped}")
    print(f"funds edges repointed: {repointed}")
    print(f"oversees edges flipped: {flipped}")
    print(f"funds edges with amount: {amounted}")
    print(f"totals: {len(entities)} entities, {len(rels)} relationships, "
          f"{len(layout)} positions")


if __name__ == "__main__":
    main()
