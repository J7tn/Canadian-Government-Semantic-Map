# Wiki — Home

An interactive semantic map of the Canadian federal government, fiscal year 2024-25. Deployed as a static site on GitHub Pages at <https://j7tn.github.io/Canadian-Government-Semantic-Map/>.

## What It Is

- **138 entities** — ministries, agencies, Crown corporations, programs, and foreign aid recipients — rendered as nodes.
- **428 relationships** — reporting lines, oversight, funding flows, and international aid — rendered as typed, directed edges.
- **Budget figures** sourced from official publications (Main Estimates, Departmental Plans), with a verified/unverified flag per entity.
- **Spending breakdowns** by standard object (personnel, transfer payments, public debt, etc.) for entities where the data was extractable.

## The Three Layers

```
data/*.json            ← the knowledge graph itself (hand-curated + script-assisted)
pipeline/*.py          ← extraction + validation tooling (run manually / in CI)
src/                   ← the React + Cytoscape viewer
```

The app is deliberately simple: **no backend, no auth, no database**. The JSON files in `data/` are the entire persistence layer — they're served as static assets and fetched at runtime, so a data edit plus a push is a deployment.

## Reading Order

1. [Architecture](Architecture.md) — how the modules connect.
2. [Graph System](Graph-System.md) — the non-obvious parts of `GraphView` (position persistence, rebuild semantics).
3. [Data Schema](Data-Schema.md) — required reading before touching `data/`.
4. [Data Pipeline](Data-Pipeline.md) — how extraction scripts feed the data files.
5. [Deployment](Deployment.md) — what happens on `git push`.

## Conventions That Matter

- **The theme registry is canonical.** `src/config/graphTheme.js` owns every type color, badge class, label, and description. Never hardcode a type color in a component.
- **Edge IDs are opaque.** They are `JSON.stringify([from, to, type])` — do not parse or pattern-match them.
- **Money is unified.** `entityMoney()` treats `budget` and `received_aid` as the same axis. Foreign countries have aid, not budgets.
- **Validation is a gate.** `pipeline/validate_data.py` runs in CI and blocks deploys on errors. Run `npm run validate-data` before pushing data changes.
