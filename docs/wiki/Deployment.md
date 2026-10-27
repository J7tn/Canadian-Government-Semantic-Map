# Deployment

Static site → GitHub Pages, built and deployed by
`.github/workflows/static.yml` on every push to `main` (or manual
dispatch).

## Pipeline

```
push to main
   │
   ▼
checkout → setup Node 20
   │
   ▼
python3 pipeline/validate_data.py   ← data gate: errors block deploy
   │
   ▼
npm ci
   │
   ▼
npm test                          ← vitest run
   │
   ▼
npm run build                     → dist/
   │
   ▼
upload-pages-artifact ./dist ──▶ deploy-pages
```

Pages source must be **GitHub Actions** (repo Settings → Pages), not
"Deploy from a branch" — nothing is committed to a pages branch.

## Base Path

`vite.config.js` sets `base: '/Canadian-Government-Semantic-Map/'` —
required because the site lives at `j7tn.github.io/Canadian-Government-Semantic-Map/`.

All data fetches use `import.meta.env.BASE_URL`, so a fork only needs to
change that one `base` string — no code edits.

## Build Output

`outDir: 'dist'` (ignored by git; the artifact carries it to Pages).
`publicDir: 'data'` copies `data/*.json` verbatim into `dist/` — that is
how the runtime fetches resolve.

## Local Commands

| Command | Does |
|---------|------|
| `npm run dev` | Vite dev server on :3000 |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Serve `dist/` locally |
| `npm test` | Vitest unit tests |
| `npm run lint` | ESLint |
| `npm run validate-data` | Data integrity gate |

## Failure Modes

- **Validate fails** → deploy blocked; fix the data and re-push.
- **Tests fail** → deploy blocked.
- **`docs/` confusion** — `docs/` is *documentation* now, not build
  output. If an old local `docs/` build directory exists it is stale;
  delete it.
- **Stale site after push** — check the Actions run; the `pages`
  concurrency group serializes deploys (`cancel-in-progress: false`).
