# Documentation

Everything about how this project works, organized by audience.

## Start Here

- **[Wiki Home](wiki/Home.md)** — what this project is and how the pieces fit together.

## Wiki — System Documentation

| Page | Covers |
|------|--------|
| [Architecture](wiki/Architecture.md) | Module map, component tree, data flow |
| [Graph System](wiki/Graph-System.md) | Cytoscape lifecycle, layout persistence, filtering |
| [Data Schema](wiki/Data-Schema.md) | Field-by-field reference for `data/*.json` |
| [Data Pipeline](wiki/Data-Pipeline.md) | Where the numbers come from, extraction scripts, validation |
| [UI Components](wiki/UI-Components.md) | Component responsibilities and interaction model |
| [Deployment](wiki/Deployment.md) | GitHub Pages pipeline, base path, build output |
| [Accessibility](wiki/Accessibility.md) | Keyboard support, screen-reader paths, remaining gaps |

## API — Module Reference

| Page | Covers |
|------|--------|
| [Components](api/components.md) | Props and contracts for every component |
| [Hooks](api/hooks.md) | `useGraphData`, `useDebouncedValue` |
| [Utilities](api/utils.md) | `graphFilter.js`, `format.js` |
| [Theme Registry](api/theme.md) | `graphTheme.js` — the single source of truth for colors/labels |

## Updates

- [Update Log](updates/2026-10-26-hardening-and-docs.md) — dated summaries of significant changes.
