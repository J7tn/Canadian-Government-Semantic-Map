# UI Components

Seven components under `src/components/`. Props/contracts live in
[API → Components](../api/components.md); this page covers *who owns
what* and how they interact.

## App — Composition Root

Owns all top-level state and every cross-component wire:

- `selectedEntity` — single source of truth for selection (graph click,
  directory pick, sidebar close all route through it).
- `searchInput` → debounced → `searchQuery` → `GraphView` rebuild.
- `filters` — owned by `Filters` internally, pushed up on change.
- `cyRef` — the live Cytoscape instance, handed up by `GraphView` via
  `onGraphReady`. Used only for Fit View and Download Layout.
- Load states — spinner overlay while `loading`, error panel with
  Retry on `error`.

## GraphView — the canvas

See [Graph System](Graph-System.md). Notable props beyond the obvious:
`selectedEntityId` keeps the amber ring synced without rebuilds;
`onGraphReady` is the only escape hatch for the cy instance.

## Sidebar — entity detail

Conditional render: `App` mounts it only when `selectedEntity` exists.
Renders the type badge (registry-driven), description, budget/aid with
verified flag handling, parent, source link (**https-only**, enforced),
last-updated, and the spending-breakdown bars — including a computed
"Uncategorized" remainder when fractions don't sum to 1.

## SearchBar — combobox

Calls `onSearch` on every keystroke (App debounces downstream); manages
its own suggestion list capped at 5, matching `name` + `aliases`.
Full ARIA combobox semantics with arrow-key navigation — see
[Accessibility](Accessibility.md).

## Filters — type + threshold

Two-way control: `<select>` for type, and number input / slider / preset
buttons for the budget threshold — all three write the same
`budgetThreshold` in **dollars** (the number input is denominated in $M).
Slider max is $150B so it covers Finance ($143B).

Semantics live in `passesFilters()`: a positive threshold requires a
monetary figure — entities with neither `budget` nor `received_aid` are
hidden (previously they always passed, which was misleading).

## Legend — registry-driven reference

Renders `ENTITY_TYPES` + `RELATIONSHIP_TYPES` straight from
`graphTheme.js`. Hovering *or keyboard-focusing* a row raises
`onHover(description)` → App shows the floating description card.
Adding a type to the registry automatically adds a legend row.

## Directory — accessible alternative

Modal listing every entity grouped by type, with color dot and budget.
Selecting an entity opens its sidebar *and* animates the camera to the
node — the primary non-canvas path through the data.

## Sources — lazy modal

Fetches `sources.json` on first open only (previously an eager fetch on
every page load). Esc / overlay-click / focus-on-open are handled.

## Layout Notes

- Header controls wrap (`flex-wrap`) — the old fixed single row broke on
  narrow windows.
- The hover-description card is positioned at `left-[22rem]` to clear
  the legend; on viewports narrower than ~1400px it can overlap the
  legend — known cosmetic limitation.
