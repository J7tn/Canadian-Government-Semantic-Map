# API — Components

All components live in `src/components/` and are plain function
components (no TypeScript — props documented here are the contract).

## `GraphView`

```jsx
<GraphView
  entities={Entity[]}            // raw entity objects from entities.json
  relationships={Relationship[]} // raw relationships.json
  layout={{ [id]: {x, y} } | null}
  selectedEntityId={string | null}
  onNodeClick={(id: string) => void}
  searchQuery={string}           // already debounced by the caller
  filters={{ type: string, budgetThreshold: number }}  // dollars
  onGraphReady={(cy | null) => void}  // receives live cytoscape instance
/>
```

- The cy instance is created once per mount. `onGraphReady(null)` fires
  on unmount.
- `searchQuery`/`filters`/`entities`/`relationships` trigger element
  rebuilds; positions persist via the internal registry.
- `selectedEntityId` only updates the amber selection ring — no rebuild.

## `Sidebar`

```jsx
<Sidebar entity={Entity | null} onClose={() => void} />
```

- Returns `null` when `entity` is falsy — parent may render it
  unconditionally, though `App` gates it anyway.
- `entity.spendingBreakdown` is optional; see
  [Data Schema](../wiki/Data-Schema.md) for the key set.

## `SearchBar`

```jsx
<SearchBar
  onSearch={(query: string) => void}  // fires per keystroke
  entities={Entity[]}                 // used for suggestions only
/>
```

Suggestion matching covers `name` + `aliases`, case-insensitive, top 5.

## `Filters`

```jsx
<Filters
  onFilterChange={({ type, budgetThreshold }) => void}
/>
```

- Owns its control state and pushes the whole filter object up on every
  change. `budgetThreshold` is **dollars** (UI is $M-denominated).
- `type` values: `'all'` or an `ENTITY_TYPES` key.

## `Legend`

```jsx
<Legend onHover={(description: string | null) => void} />
```

Raises the row's `description` on hover/focus, `null` on leave/blur.
App renders the floating description card.

## `Directory`

```jsx
<Directory
  entities={Entity[]}
  onSelect={(id: string) => void}
  onClose={() => void}
/>
```

Modal; groups entities by `type`, sorted by type name. `onSelect` in
`App` also animates the camera to the chosen node.

## `Sources`

```jsx
<Sources />
```

Self-contained modal. Lazy-fetches `sources.json` on first open;
internal loading/error states.
