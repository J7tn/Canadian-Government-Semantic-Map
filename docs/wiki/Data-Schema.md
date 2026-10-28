# Data Schema

Reference for everything under `data/`. These files are the persistence
layer — they are served statically and fetched at runtime. CI validates
them via `pipeline/validate_data.py` on every push.

## `entities.json` — `Entity[]`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string | ✔ | Unique. Kebab-case convention. Referenced by relationships and `layout.json`. |
| `name` | string | ✔ | Display name. |
| `type` | string | ✔ | One of `Ministry`, `Agency`, `CrownCorporation`, `Program`, `Other`, `ForeignCountry`. Must exist in `ENTITY_TYPES`. |
| `parent` | string \| null | ✔ | Entity id of the parent. `null` for top-level. Must reference an existing id. |
| `budget` | number \| null | | Annual budget in CAD dollars. `null` = unknown. Must be ≥ 0. |
| `budgetVerified` | boolean | | `false` → sidebar shows "Unverified" instead of the figure. |
| `received_aid` | number \| null | | ForeignCountry only. Feeds `entityMoney()` when `budget` is absent. |
| `aidVerified` | boolean | | Same semantics as `budgetVerified`. |
| `description` | string | | Short, factual, non-partisan. |
| `source` | string | | URL. Sidebar only renders `https:` links. |
| `sourceParsedDate` | string | | `YYYY-MM-DD` — when the source was last parsed. |
| `lastUpdated` | string | | `YYYY-MM-DD` or `"unknown"`. |
| `aliases` | string[] | | Searchable alternative names. |
| `spendingBreakdown` | object | | Fraction map — see below. |

### `spendingBreakdown`

`{ category: fraction }` where each fraction is in `[0, 1]` and the map
sums to ~1.0 (validator warns outside `[0.9, 1.1]`). The denominator is
the **gross category sum**, not the CSV `Total` — `Total` is already net
of "Less: Revenues".

Allowed keys (render order/labels/colors from `SPENDING_CATEGORIES`):

`personnel` · `transportation` · `information` · `professional_services` ·
`rentals` · `maintenance` · `utilities` · `capital` (= land+machinery) ·
`transfer_payments` · `public_debt` · `other_subsidies`

## `relationships.json` — `Relationship[]`

```json
{ "from": "entity-id", "to": "entity-id", "type": "reports_to" }
```

- `from`/`to` must reference existing entity ids (validated; dangling
  edges are silently dropped by the renderer, so the validator is the
  only thing that will catch them).
- `type` must be in `RELATIONSHIP_TYPES`: `reports_to`, `oversees`,
  `funds`, `international_aid`. Unknown types render via the base edge
  style and produce a validation **warning**, not an error.
- Duplicate `(from, to, type)` tuples are flagged as warnings.

## `layout.json` — `{ [entityId]: { x, y } }`

Saved node positions. Optional — missing nodes get ring placement, a
missing file falls back to a captured `cose` layout. Unknown keys warn.

Update it by arranging nodes in the app → **Download Layout** → replace
`data/layout.json` → commit.

## `sources.json` — `Source[]`

```json
{ "name": "...", "url": "https://...", "description": "...", "lastAccessed": "YYYY-MM-DD" }
```

Rendered in the Sources modal; fetched lazily on first open.

## Data Lifecycle

```
source docs (CSV) ──▶ pipeline/sync_data.py + apply_main_estimates.py ──▶ data/*.json
                                                      │
                            pipeline/validate_data.py ◀┘  (CI gate)
                                                      │
                                                   vite build ──▶ deployed
```
