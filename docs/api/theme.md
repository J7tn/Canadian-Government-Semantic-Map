# API — Theme Registry

`src/config/graphTheme.js` — the single source of truth for every
type's color, label, badge, and description. Components must read from
here; nothing else may hardcode a type color.

## `ENTITY_TYPES`

`{ [type]: { color, badge, label, description } }`

| Key | `color` | `badge` (Tailwind) | Used by |
|-----|---------|--------------------|---------|
| `Ministry` | `#dc2626` | `bg-red-100 text-red-800` | GraphView, Sidebar, Legend, Directory |
| `Agency` | `#2563eb` | `bg-blue-100 text-blue-800` | 〃 |
| `CrownCorporation` | `#16a34a` | `bg-green-100 text-green-800` | 〃 |
| `Program` | `#9333ea` | `bg-purple-100 text-purple-800` | 〃 |
| `Other` | `#6b7280` | `bg-gray-100 text-gray-800` | 〃 |
| `ForeignCountry` | `#f97316` | `bg-orange-100 text-orange-800` | 〃 |

Fallbacks: `DEFAULT_ENTITY_COLOR`, `DEFAULT_ENTITY_BADGE`.

## `RELATIONSHIP_TYPES`

`{ [type]: { color, width, stepSize, dashed, label, description } }`

Keys: `reports_to`, `oversees`, `funds`, `international_aid`.
`width`/`stepSize`/`dashed` drive the generated Cytoscape edge rules.
Unknown edge types fall back to `DEFAULT_EDGE_COLOR` via the base `edge`
selector — they render rather than disappearing.

## `SPENDING_CATEGORIES`

`{ [key]: { label, color } }` — keys mirror `spendingBreakdown` in
`data/entities.json` (`personnel` … `other_subsidies`). Sidebar renders
bars in data order using these labels/colors.

## Adding a Type

1. Add the entry here (pick an unused Tailwind badge pair).
2. Add the value to `KNOWN_ENTITY_TYPES` / `KNOWN_REL_TYPES` in
   `pipeline/validate_data.py`.
3. Update the type `<option>` list in `Filters.jsx`.
4. Data, legend, colors, badges follow automatically.
