# Graph System

`src/components/GraphView.jsx` wraps Cytoscape.js. This page documents the
non-obvious mechanics — read it before editing that file.

## Effect Structure

The component deliberately splits Cytoscape lifecycle into three scoped
effects:

| Effect | Deps | Responsibility |
|--------|------|----------------|
| Mount | `[onGraphReady]` | Create `cy`, bind handlers, destroy on unmount |
| Layout merge | `[layout]` | Merge `layout.json` into `positionsRef`, fit once |
| Rebuild | `[entities, relationships, filters, searchQuery]` | Incrementally diff elements, re-apply positions |
| Selection | `[selectedEntityId]` | Sync `cy` selection without a rebuild |

**Do not merge these back into one effect.** The mount effect must never
re-run mid-session (it destroys the instance); the rebuild effect must
never recreate the instance.

## Position Persistence (`positionsRef`)

Positions are tracked in a ref keyed by node id, fed by two sources:

1. `data/layout.json` — the committed, published arrangement.
2. `dragfree` events — every user drag updates the registry live.

The registry ref is owned by `App` and passed to `GraphView` as the
`positionsRegistry` prop — that shared ownership is what lets
**Download Layout** export every entity's position, including nodes
currently filtered out of the canvas. Never derive an export from
`cy.nodes()` alone; it only contains visible elements.

On every rebuild (search keystroke, filter change) `diffGraphElements`
removes only the elements that left the view and adds only the ones that
entered — surviving elements are untouched, so hover state and in-flight
drags survive. Re-added nodes carry their registry position in the
descriptor, so they never flash at the origin. **User-arranged layouts
survive filtering** — this is the core interaction guarantee.

Nodes missing from the registry (newly added entities) are placed on a
ring around the centroid of positioned nodes — never stacked at (0,0).

If `layout.json` fails to load, the graph falls back to a one-shot `cose`
force-directed layout and *captures its output* into `positionsRef`, so
even the auto-layout survives rebuilds.

## Viewport Fit

`fittedRef` gates the initial `cy.fit(undefined, 50)` — it runs exactly
once, after the first successful position application. Without this the
canvas opens on an arbitrary viewport (the old bug: nodes scattered across
±6000px with the camera parked at origin).

Manual fit: double-right-click on the canvas, or the **Fit View** button
in the header.

## Stylesheet

`buildStylesheet()` generates Cytoscape style rules from
`graphTheme.js`:

- `node` — color from `ENTITY_TYPES[type].color`, size logarithmic on
  `entityMoney` (clamped 30–80px, guarded against `NaN`/non-positive).
- `edge` — a base rule for *any* edge, so unknown future relationship
  types still render (gray, thin, bezier).
- `edge[type="x"]` — per-type overrides from `RELATIONSHIP_TYPES`
  (color, width, dash, bezier step).
- `node:selected`, `node:hover` — amber border emphasis.

## Element Construction

`buildGraphElements()` (in `utils/graphFilter.js`) returns Cytoscape
element descriptors:

- Node `data.money` = `entityMoney(entity)` — `budget ?? received_aid`.
  Sizing and filtering share this axis.
- Edge `data.id` = `JSON.stringify([from, to, type])`. Treat ids as
  opaque — never parse them.
- Edges to filtered-out or nonexistent endpoints are dropped silently
  (validator catches the latter in CI).

## Interaction Handlers

Bound once at mount; they read through `onNodeClickRef` / `selectedRef`
(both `useLatest` refs — written in an effect, never during render)
so the latest prop is always used without rebinding:

- `tap` on node → `onNodeClick(nodeId)` → App selects → Sidebar opens.
- `dblclick` on node → animated center + zoom 2.
- `cxttap` ×2 within 500ms → `cy.fit`.
- `dragfree` on node → update `positionsRef`.

## Gotchas

- **Layout export**: `App.handleDownloadLayout` merges the registry with
  live node positions — complete even mid-filter. See above; exporting
  visible nodes only is the old data-loss bug.
- **`cy.destroyed()`**: handlers attached via `layoutRun.on('layoutstop')`
  check `positionsRef` is still empty before adopting cose output — a
  saved layout arriving mid-layout must win.
- **StrictMode** double-mounts in dev: two cy create/destroy cycles and
  duplicate `layout.json` fetches are expected dev-only noise.
- **`wheelSensitivity: 0.3`** is deliberately below the library default —
  trackpads were over-zooming.
- Rebuilds keep edges' `data.type` for styling; the selected node is
  re-selected after rebuild via `selectedRef`.
