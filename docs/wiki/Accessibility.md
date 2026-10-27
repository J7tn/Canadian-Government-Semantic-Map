# Accessibility

Current state and honest gaps. A graph-visualization tool is inherently
canvas-first — the mitigations below make the *content* reachable without
the canvas.

## What's Implemented

- **Directory** — a `role="dialog"` modal listing all 138 entities grouped
  by type, fully keyboard-navigable (Tab through entries, Enter selects,
  Esc closes). This is the screen-reader path into the data.
- **SearchBar combobox** — `role="combobox"`, `aria-expanded`,
  `aria-autocomplete="list"`, `aria-activedescendant`; ArrowUp/Down cycles
  suggestions, Enter selects, Esc dismisses. Suggestion list is a real
  `listbox`/`option` structure.
- **Sources + Directory modals** — `aria-modal`, focus moved into the
  dialog on open, Esc and overlay-click close.
- **Icon buttons** — all close buttons carry `aria-label`.
- **Legend** — every row is `tabIndex=0`; descriptions appear on focus
  as well as hover, so keyboard users get the same explanatory text.
- **Color + text** — entity types are never color-only: the sidebar shows
  a text badge, the directory shows names, the legend labels every swatch.

## Known Gaps

- **The canvas itself** — Cytoscape renders to `<canvas>`; node position,
  edge geometry, and zoom state are invisible to assistive tech. The
  Directory is the compensation path.
- **Focus trap** — modals focus on open but don't trap Tab (focus can
  leave the dialog into the page behind it).
- **Announcements** — selection changes and graph rebuilds aren't pushed
  to a live region (`aria-live`); a screen reader won't know the canvas
  changed. Sidebar content is the readable equivalent.
- **Reduced motion** — `cy.animate` calls don't check
  `prefers-reduced-motion`.
- **Narrow viewports** — functional but not designed for mobile; the
  384px sidebar plus header controls assume a desktop-ish width.

## Guidelines for New UI

- Every interactive element reachable by keyboard — `button`, `tabIndex`,
  or a real input; never a bare `<div onClick>`.
- Prefer native elements — they give semantics for free.
- Any state that *changes content* should eventually surface through
  text somewhere (sidebar, directory, status line) — canvas alone isn't
  enough.
