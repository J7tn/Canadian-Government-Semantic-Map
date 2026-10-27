# Update Log

Running log of significant changes — newest first. One entry per working
session; keep summaries plain.

---

## 2026-10-26 — Documentation

- Created `docs/` as a real documentation tree: `wiki/` (system docs),
  `api/` (module reference), `updates/` (this log).
- Build output moved from `docs/` to `dist/` to free the name; the Pages
  workflow now uploads `./dist`. `docs/` is committed source again.

## 2026-10-26 — Hardening pass (code review follow-through)

- **GraphView rewritten.** Cytoscape is created once and reused;
  filter/search changes rebuild elements without destroying the instance.
  Dragged node positions now survive searches and filters via a live
  position registry. Initial viewport is fitted automatically. Stale-event
  and edge-id-collision bugs fixed.
- **Load failure is visible.** All data fetches check HTTP status and the
  app shows a spinner, then an error panel with Retry — no more silent
  blank canvas.
- **Data correctness.** Spending breakdowns now divide by the gross
  category sum (the CSV `Total` already nets out revenues) and include
  public-debt and other-subsidies rows — Finance's $46.5B debt charge was
  invisible before. ESDC's >100% bar is gone.
- **Validation gate.** New `pipeline/validate_data.py` checks ids, edge
  endpoints, types, and breakdown fractions in CI before every deploy.
  It caught a duplicate `privy-council → parliament` edge; removed.
- **Theme registry.** All type/relationship colors, badges, and labels
  live in `src/config/graphTheme.js`. Fixed the ForeignCountry badge
  (was blue, now matches the orange node).
- **Accessibility.** New Directory modal (keyboard-friendly entity list),
  combobox ARIA on search, Esc/focus handling on modals, `aria-label`s,
  and a visible "Fit View" button replacing the hidden right-click trick.
- **Tooling.** Vitest (17 tests), ESLint flat config, Node 20 CI,
  `requirements.txt` for the Python pipeline, dead deps removed,
  `pipeline/` folder created for scripts + source files.

## Earlier — initial build

- React + Vite + Cytoscape graph of federal entities with search,
  type/budget filters, sidebar details, legend, and sources modal.
- Data files (`entities`, `relationships`, `layout`, `sources`) hand-built
  from Main Estimates 2024-25 and departmental plans; GitHub Pages deploy.
