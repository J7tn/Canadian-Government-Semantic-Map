# Data Pipeline

`pipeline/` holds the raw government source files and the scripts that
maintain `data/*.json`. `sync_data.py` is the main entry point — every
script is idempotent and safe to re-run.

## Prerequisites

```bash
pip install -r requirements.txt   # pdfplumber — kept for optional PDF source scouting; no current script needs it
```

All scripts resolve repo paths from their own location — run them from anywhere.

## Scripts

### `validate_data.py` — the gate

Checks referential integrity and schema sanity for `data/*.json`:

- **errors** — duplicate entity ids *and* duplicate names, dangling
  `parent`/`from`/`to` refs, unknown entity or relationship types,
  `funds` edges targeting a `ForeignCountry` entity, an `amount` on a
  non-primary `funds` edge (secondary channels stay `null`)
- **warnings** — `spendingBreakdown` fractions outside `[0,1]` or not
  summing to ~1, `parent`/`oversees`/`reports_to` inconsistencies

Prints `ERROR`/`WARN` lines; exits 1 on any error.
**Runs in CI before every deploy** — treat warnings as worth fixing.

```bash
npm run validate-data        # or: python pipeline/validate_data.py
```

### `sync_data.py` — the maintainer

One idempotent pass over `data/`:

- upgrades entries in `MISSING_ENTITIES` in place — matches by name
  (merging aliases) and preserves established ids
- applies `status` flags, `budgetContext` notes, and verified budgets
- sets `inMainEstimates: true` when the entity's name or an alias
  matches an organization row in the Main Estimates CSV — the flag
  powers the Budget Math ledger
- drops stale edges, repoints `funds` edges, and creates missing
  `reports_to` / `oversees` / `funds` edges + layout positions for
  ensured entities
- backfills `amount` on *primary* funds edges only — the sole incoming
  funds edge or the `parliament` edge; secondary channels (e.g. TBS
  central votes) keep `null` since their per-department draw isn't
  published

```bash
python pipeline/sync_data.py
```

### `apply_main_estimates.py` — spending breakdowns

Reads `budgetary-expenditures-standard-object.csv` (Main Estimates by
standard object) and writes `spendingBreakdown` — each category as a
fraction of gross spend — for every CSV org that maps to an entity by
name or alias. Audits `budget` against the CSV `Total` column but never
overwrites it; mismatches and unmatched orgs are printed for review.

Key detail: the CSV `Total` is **already net of "Less: Revenues"**, so
fractions divide by the gross category sum, not `Total`.

### `generate_oversees_relationships.py` — derive `oversees` edges

Rebuilds `entity.parent → oversees` edges in `relationships.json` from
scratch: stale generated edges are removed and edges marked
`"curated": true` are preserved (e.g. `parliament → statistics-canada`).
Idempotent — safe to re-run after adding entities.

### `generate_funds_relationships.py` — derive `funds` edges

Adds `parliament → entity` appropriation edges where missing (skips
`defunct` and `fictional` entities) and applies the primary-edge
`amount` rule described under `sync_data.py`.

## Source Files

- `budgetary-expenditures-standard-object.csv` — TBS Main Estimates
  2024-25, expenditures by standard object. cp1252 encoded; preamble
  rows precede the real `Organization` header and a trailing `Total`
  row is excluded — `sync_data.py::estimates_org_names` is the
  canonical parser.

## Workflow for a New Entity

1. Add the entity to `data/entities.json` (see [Data Schema](Data-Schema.md));
   take `budget` from the CSV `Total` when the org appears there.
2. `python pipeline/sync_data.py` — applies flags/contexts, adds the
   `inMainEstimates` flag, and creates missing edges + a layout slot.
3. Run `generate_oversees_relationships.py` and
   `generate_funds_relationships.py` if its `parent`/funding changed.
4. `npm run validate-data` — must be clean before commit.
5. Commit + push → CI revalidates, rebuilds, deploys.
