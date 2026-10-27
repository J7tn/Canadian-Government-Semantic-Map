# API — Utilities

Pure functions in `src/utils/` — no React, unit-tested (`*.test.js`).

## `graphFilter.js`

### `entityMoney(entity) → number | null`

The monetary magnitude of an entity: `budget` if a number, else
`received_aid`, else `null`. This is the shared axis for node sizing and
the budget filter — ForeignCountry entities carry aid, not budgets.

### `passesFilters(entity, filters, searchQuery) → boolean`

```js
passesFilters(entity, { type: 'all', budgetThreshold: 0 }, '')
```

- `type !== 'all'` → `entity.type` must equal it.
- `budgetThreshold > 0` → `entityMoney()` must exist and be ≥ threshold.
  Unknown-budget entities fail a positive threshold.
- `searchQuery` → case-insensitive substring on `entity.name`.

### `buildGraphElements(entities, relationships, filters, searchQuery) → Element[]`

Returns Cytoscape element descriptors: visible nodes (data: `id`,
`label`, `type`, `money`, `description`) then edges whose endpoints both
survive filtering (data: `id`, `source`, `target`, `type`). Edge ids are
`JSON.stringify([from, to, type])` — opaque; hyphenated ids cannot
collide.

## `format.js`

### `formatBudget(budget) → string`

`en-CA` CAD currency, no decimals. `null`/`undefined` → `'N/A'`; `0`
formats as `$0` (zero is a real figure, not missing data).

### `formatPercent(fraction) → string`

Adaptive decimals: `<1%` → 2dp, `<10%` → 1dp, `≥10%` → 0dp.
Input is a fraction (`0.035` → `'3.5'`).
