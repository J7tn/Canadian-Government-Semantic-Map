# Data Pipeline

`pipeline/` holds the raw government source files and the one-off scripts
that turn them into `data/*.json`. Everything is manual — run a script,
inspect the output, hand-merge into the data files.

## Prerequisites

```bash
pip install -r requirements.txt   # pdfplumber — only needed for PDF scripts
```

Scripts that touch `data/` use `../data/` paths — run them from inside
`pipeline/`. `validate_data.py` resolves the repo root from its own
location and works from anywhere.

## Scripts

### `validate_data.py` — the gate

Checks referential integrity and schema sanity for `data/*.json`:
unique entity ids, dangling `parent`/`from`/`to` refs, unknown types,
`spendingBreakdown` fractions in `[0,1]` summing to ~1, layout keys that
reference real ids. Prints `ERROR`/`WARN` lines; exits 1 on any error.
**Runs in CI before every deploy** — treat warnings as worth fixing.

```bash
npm run validate-data        # or: python pipeline/validate_data.py
```

### `extract_actual_spending.py` — spending breakdowns

Reads `budgetary-expenditures-standard-object.csv` (Main Estimates by
standard object) and produces per-entity category percentages for the
orgs listed in `org_mapping` (currently: DND, Health, TBS, Finance, ESDC).

Key detail: the CSV `Total` column is **already net of "Less:
Revenues"**, so percentages divide by the *gross category sum* and
include `public_debt` and `other_subsidies`. Output →
`actual_spending_breakdown.json`; copy the `percentages` block into the
entity's `spendingBreakdown` field.

To cover a new org: add its CSV organization name → entity id to
`org_mapping`.

### `extract_spending_breakdown.py` — all-org breakdown (legacy)

DictReader-based variant that emits raw dollar categories for *every*
org, keyed by org name (not entity id). Output file is not consumed by
the app — useful as a lookup table when curating new entities.

### `extract_main_estimates_budgets.py` — org totals

Prints each org's `Total` summed across rows. Use it to fill `budget`
for a new entity, then set `budgetVerified: true` with the CSV as source.

### `extract_pdf_spending.py` — exploratory

Dumps spending-related pages/tables from a Departmental Plan PDF for
inspection. It prints, it doesn't write — a scouting tool, not a
transformer.

### `generate_oversees_relationships.py` — derive `oversees` edges

Generates `entity.parent → oversees` edges in `relationships.json`
(dedup-aware). Idempotent — safe to re-run after adding entities.

### `calculate_budget.py` — sanity check

Compares the sum of all entity budgets against the Main Estimates total
($449.2B) so you can see how much of the government the map covers.

## Source Files

- `budgetary-expenditures-standard-object.csv` — TBS Main Estimates
  2024-25, expenditures by standard object. Latin-1 encoded; the scripts
  try several encodings automatically.
- `dnd-departmental-plan-2024-25.pdf` — DND Departmental Plan, input for
  the PDF scout script.

## Workflow for a New Entity

1. `python extract_main_estimates_budgets.py` → get the `budget` figure.
2. Add the entity to `data/entities.json` (see [Data Schema](Data-Schema.md)).
3. Add relationships; optionally run `generate_oversees_relationships.py`.
4. `npm run validate-data` — must be clean before commit.
5. Commit + push → CI revalidates, rebuilds, deploys.
