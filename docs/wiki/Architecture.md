# Architecture

## Module Map

```
src/
├── main.jsx                    Entry point. StrictMode + createRoot only.
├── App.jsx                     Composition root. Owns all top-level state.
├── hooks/
│   ├── useGraphData.js         All data fetching: entities, relationships, layout.
│   └── useDebouncedValue.js    Delays fast-moving values (search keystrokes).
├── utils/
│   ├── graphFilter.js          Pure functions: entityMoney, passesFilters,
│   │                           buildGraphElements. Unit-tested, no React.
│   └── format.js               formatBudget, formatPercent. Unit-tested.
├── config/
│   └── graphTheme.js           ENTITY_TYPES, RELATIONSHIP_TYPES,
│                               SPENDING_CATEGORIES registries.
└── components/
    ├── GraphView.jsx           Cytoscape wrapper. Three scoped effects.
    ├── Sidebar.jsx             Entity detail panel.
    ├── SearchBar.jsx           Combobox with suggestions.
    ├── Filters.jsx             Type + budget-threshold controls.
    ├── Legend.jsx              Reads theme registry; hover/focus descriptions.
    ├── Directory.jsx           Accessible entity list (canvas alternative).
    └── Sources.jsx             Lazy-fetched sources modal.
```

## Data Flow

```
data/*.json ──fetch──▶ useGraphData ──▶ App state ──▶ props ──▶ components
                                        │
                                        ├── selectedEntity
                                        ├── searchInput ──(debounce 150ms)──▶ searchQuery
                                        ├── filters {type, budgetThreshold}
                                        └── cyRef (via GraphView onGraphReady)
```

Everything flows down through props; nothing is global. There is no
context, no store library, and no `window` plumbing — GraphView hands its
Cytoscape instance to `App` through the `onGraphReady` callback and `App`
keeps it in `cyRef` for Fit View / Download Layout.

## Responsibility Boundaries

| Concern | Owner | Rule |
|---------|-------|------|
| Fetching + load state | `useGraphData` | Only place `fetch` for graph data is allowed |
| Filter/search semantics | `graphFilter.js` | Pure — no component reimplements it |
| Colors, labels, badges | `graphTheme.js` | Never hardcode a type color elsewhere |
| Cytoscape instance | `GraphView` | Components outside never touch `cy` directly |
| Selection | `App` | `selectedEntity` is the single source of truth |
| Positions | `GraphView.positionsRef` | Saved layout + live drags, survives rebuilds |

## Design Decisions

- **Runtime `fetch` over bundling JSON.** Data files live in `publicDir`
  (`data/`) and are served verbatim. A data-only change still rebuilds
  through CI, but the architecture doesn't *require* a bundle to display
  data — the site degrades to a clean error state with retry if a file is
  missing or malformed.
- **Pure-function core.** Filtering and element construction live in
  `utils/graphFilter.js`, which means the semantics ("does a $10B
  threshold include foreign aid?") are testable without rendering.
- **Registry-driven UI.** Adding a new entity type means adding one entry
  to `ENTITY_TYPES` — GraphView, Sidebar, Legend, and Directory all pick
  it up automatically. Same for `RELATIONSHIP_TYPES` and edge styles.
