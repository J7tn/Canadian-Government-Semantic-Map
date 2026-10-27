# API — Hooks

## `useGraphData()`

`src/hooks/useGraphData.js`

```js
const { entities, relationships, layout, status, error, retry } = useGraphData()
```

| Return | Type | Notes |
|--------|------|-------|
| `entities` | `Entity[]` | `[]` until loaded |
| `relationships` | `Relationship[]` | `[]` until loaded |
| `layout` | `{[id]: {x,y}} \| null` | `null` when `layout.json` fails — non-fatal |
| `status` | `'loading' \| 'ready' \| 'error'` | drives App's overlay |
| `error` | `string \| null` | human-readable, shown in the error panel |
| `retry` | `() => void` | re-runs the whole load; stale attempts are ignored |

- Fetches `${import.meta.env.BASE_URL}{entities,relationships,layout}.json`
  — entities + relationships in parallel, then layout.
- `entities`/`relationships` failures are **fatal** (status `error`);
  `layout` failure is **non-fatal** (`null`, auto-layout fallback).
- `res.ok` is checked — a 404 HTML page can no longer masquerade as JSON.
- A stale `retry()` result can't clobber a newer attempt (attempt counter).

## `useDebouncedValue(value, delay = 150)`

`src/hooks/useDebouncedValue.js`

```js
const searchQuery = useDebouncedValue(searchInput, 150)
```

Returns `value` after it stops changing for `delay` ms. Used in `App` to
keep per-keystroke graph rebuilds cheap. Generic — no coupling to search.
