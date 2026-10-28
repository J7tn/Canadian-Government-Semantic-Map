# Canadian Government Semantic Map

[![Deploy](https://github.com/j7tn/Canadian-Government-Semantic-Map/actions/workflows/static.yml/badge.svg)](https://github.com/j7tn/Canadian-Government-Semantic-Map/actions/workflows/static.yml)
[![Live site](https://img.shields.io/badge/live-j7tn.github.io-red)](https://j7tn.github.io/Canadian-Government-Semantic-Map/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

An interactive web application that visualizes the structure of the Canadian federal government as a semantic graph — **138 entities** and **413 typed relationships** covering ministries, agencies, Crown corporations, programs, and international aid flows. This open-source tool makes government structure and budget flows transparent and navigable.

**[Live site →](https://j7tn.github.io/Canadian-Government-Semantic-Map/)** · **[Documentation →](docs/README.md)**

## Features

- **Interactive Graph Visualization**: Explore the federal government structure through an interactive node-based graph
- **Entity Information**: Click on any node to view detailed information including budget, description, and source links
- **Search Functionality**: Quickly find specific government entities
- **Filtering**: Filter by entity type (Ministry, Agency, Crown Corporation, etc.), budget threshold, and relationship type
- **Responsive Design**: Clean, modern UI built with React and TailwindCSS
- **Data Verification System**: Distinguishes between verified and unverified budget figures
- **Source Tracking**: Tracks when sources were parsed and last updated

## Tech Stack

- **Frontend**: React 18 with Vite
- **Graph Visualization**: Cytoscape.js
- **Styling**: TailwindCSS
- **Data**: JSON files (loaded dynamically at runtime)
- **Quality gates**: Vitest unit tests, ESLint, and a Python data validator — all enforced in CI before deploy

## Documentation

| Where | What |
|-------|------|
| [docs/wiki/](docs/wiki/Home.md) | System documentation — architecture, graph internals, data pipeline, deployment, accessibility |
| [docs/api/](docs/api/components.md) | Module reference — component props, hooks, utilities, theme registry |
| [docs/updates/](docs/updates/2026-10-26-hardening-and-docs.md) | Update log — dated summaries of significant changes |

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/canadian-government-semantic-map.git
cd canadian-government-semantic-map
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory (gitignored — GitHub Actions uploads it as the Pages artifact). `docs/` is the hand-written documentation folder.

### Deployment

This project uses GitHub Actions for automatic deployment to GitHub Pages. When you push changes to the `main` branch, the workflow automatically:

1. Installs dependencies
2. Builds the project
3. Deploys to GitHub Pages

**Development Workflow:**

For day-to-day development with immediate feedback:
```bash
npm run dev
```
- Opens at `http://localhost:3000`
- Changes appear instantly when you save files
- Hot reloads automatically

**Deployment Workflow:**

To share changes with others:
```bash
git add .
git commit -m "your message"
git push
```
- GitHub Actions automatically builds and deploys
- Changes appear at `https://j7tn.github.io/Canadian-Government-Semantic-Map/` after 1-2 minutes

**Live Site:**
https://j7tn.github.io/Canadian-Government-Semantic-Map/

## Project Structure

```
canadian-government-semantic-map/
├── data/
│   ├── entities.json          # Government entity data
│   ├── relationships.json      # Entity relationships
│   ├── layout.json            # Saved node positions
│   └── sources.json           # Data source information
├── pipeline/
│   ├── validate_data.py          # Data integrity checks (runs in CI)
│   ├── sync_data.py              # Entity upgrades, status/budget flags, edge repair
│   ├── apply_main_estimates.py   # spendingBreakdown from Main Estimates CSV
│   ├── generate_*.py             # oversees/funds edge generators
│   └── *.csv                     # Raw government source files
├── src/
│   ├── components/
│   │   ├── GraphView.jsx      # Cytoscape graph visualization
│   │   ├── Sidebar.jsx        # Entity details panel
│   │   ├── SearchBar.jsx      # Search functionality
│   │   ├── Filters.jsx        # Filter controls
│   │   ├── Legend.jsx         # Graph legend
│   │   ├── Directory.jsx      # Accessible entity list
│   │   ├── DataGaps.jsx       # Missing-data report
│   │   ├── StructuralInsights.jsx # Derived structural observations
│   │   ├── BudgetMath.jsx     # Main Estimates reconciliation ledger
│   │   └── Sources.jsx        # Sources modal
│   ├── config/graphTheme.js   # Shared type/color/label registry
│   ├── hooks/                 # useGraphData, useDebouncedValue
│   ├── utils/                 # format, graphFilter, dataGaps, graphData,
│   │                          # budgetMath, structuralInsights (+ tests)
│   ├── App.jsx                # Main application component
│   └── main.jsx               # Application entry point
├── index.html                 # HTML template
├── vite.config.js             # Vite configuration
├── eslint.config.js           # Lint configuration
├── requirements.txt           # Python deps (pdfplumber)
└── package.json               # Dependencies and scripts
```

## Data Structure

### Entities (`data/entities.json`)

Each entity represents a government organization:

```json
{
  "id": "string",
  "name": "string",
  "type": "Ministry|Agency|CrownCorporation|Program|Other|ForeignCountry",
  "parent": "string|null",
  "budget": "number|null",
  "budgetVerified": "boolean",
  "received_aid": "number|null",
  "aidVerified": "boolean",
  "description": "string",
  "source": "string",
  "sourceParsedDate": "string",
  "lastUpdated": "string",
  "aliases": ["string"],
  "spendingBreakdown": {
    "personnel": 0.12,
    "transfer_payments": 0.61,
    "public_debt": 0.0,
    "other_subsidies": 0.19
  }
}
```

**Field Descriptions:**
- `id`: Unique identifier for the entity (used in relationships)
- `name`: Display name of the entity
- `type`: Entity type (determines color in graph)
- `parent`: ID of parent entity (null for top-level entities)
- `budget`: Annual budget in CAD (null if unknown)
- `budgetVerified`: `true` if budget figure is from official source, `false` otherwise
- `received_aid`: Amount of international aid received (for ForeignCountry entities)
- `aidVerified`: `true` if aid figure is from official source, `false` otherwise
- `description`: Brief description of the entity
- `source`: URL to official source document
- `sourceParsedDate`: Date when the source was parsed (YYYY-MM-DD format)
- `lastUpdated`: Date when the entity data was last verified (YYYY-MM-DD format, or "unknown")
- `aliases`: Alternative names for the entity
- `spendingBreakdown`: Optional map of spending category → fraction of gross expenditure (values in [0,1], summing to ~1.0). Keys: `personnel`, `transportation`, `information`, `professional_services`, `rentals`, `maintenance`, `utilities`, `capital`, `transfer_payments`, `public_debt`, `other_subsidies`
- `budgetContext`: Optional plain-language explanation of the figure — rendered in the sidebar's "Why this number" panel (e.g., CIB's figure is repayable investment capital, not expense). Entities without one get an auto-derived explanation from `spendingBreakdown` composition
- `summary`: Optional plain-language one-liner rendered in the sidebar's "What it does" block — overrides the auto-derived summary built from entity type + first description sentence
- `status`: Optional — `defunct` (dissolved/privatized/merged) or `fictional` (no existence in federal registries). Flagged entities surface their status in the Data Gaps table instead of per-field gaps
- `inMainEstimates`: Optional — `true` when the entity's name or an alias matches an organization row in the Main Estimates CSV (set by `pipeline/sync_data.py`). The "Money Math" ledger uses it to separate parliamentary appropriations from self-funded or statutory money shown on the map

### Relationships (`data/relationships.json`)

Each relationship represents a connection between entities:

```json
{
  "from": "string",
  "to": "string",
  "type": "reports_to|funds|oversees|international_aid",
  "amount": "number|null"
}
```

Direction convention: the arrow points from the actor to the target —
`X --reports_to--> Y` reads "X reports to Y", `X --oversees--> Y` reads
"X oversees Y" (parent -> child), `X --funds--> Y` reads "X funds Y".

**Relationship Types:**
- `reports_to`: Organizational reporting structure (child -> parent)
- `funds`: Budget allocation/flow (funder -> recipient)
- `oversees`: Portfolio oversight (parent -> child, generated from the `parent` field)
- `international_aid`: Foreign aid distribution

**Fields:**
- `amount`: For `funds` edges — the recipient's annual budget in CAD
  (the appropriated amount). `null` when the recipient's budget is
  unknown (e.g. self-funded Crown corporations, foreign aid targets).

### Sources (`data/sources.json`)

Lists primary data sources with access dates:

```json
{
  "name": "string",
  "url": "string",
  "description": "string",
  "lastAccessed": "string"
}
```

## How to Add or Update Data

### Adding a New Entity

1. Open `data/entities.json`
2. Add a new entity object with all required fields
3. Set `budgetVerified: false` if the budget is not from an official source
4. Set `sourceParsedDate` to today's date (YYYY-MM-DD)
5. Set `lastUpdated` to "unknown" if unverified, or today's date if verified
6. Add relationships in `data/relationships.json` if the entity connects to others

### Verifying Budget Data

To mark budget data as verified:

1. Find the official budget figure from government sources (Main Estimates, Departmental Plans, etc.)
2. Update the `budget` field with the exact figure
3. Update the `source` field with the official document URL
4. Set `budgetVerified: true`
5. Set `lastUpdated` to today's date (YYYY-MM-DD)
6. Update `sourceParsedDate` to today's date

### Updating Source Information

When you parse or verify data from a source:

1. Update `sourceParsedDate` to today's date for all affected entities
2. For verified entities, update `lastUpdated` to today's date
3. For unverified entities, keep `lastUpdated` as "unknown"
4. Update `data/sources.json` with the new `lastAccessed` date

## Data Verification System

The application distinguishes between verified and unverified data:

- **Verified**: Budget figures from official government documents (Main Estimates, Departmental Plans)
- **Unverified**: Budget figures from unofficial sources or estimates

In the UI, verified entities show the actual budget amount, while unverified entities show "Unverified" with a note that the data requires specific source citation.

## How It Works

### Data Loading

The application loads JSON data dynamically at runtime using `fetch()`. `data/` is served verbatim as the Vite `publicDir`:

```javascript
// In src/hooks/useGraphData.js — paths are relative to the Vite base
const res = await fetch(`${import.meta.env.BASE_URL}entities.json`)
if (!res.ok) throw new Error(`Failed to load entities.json (HTTP ${res.status})`)
const entities = await res.json()
```

The hook surfaces `loading`/`error` states with a retry UI. The published layout in `data/layout.json` is loaded too, so manually arranged node positions persist across sessions once committed.

### Data Validation

Before deploying, CI runs `pipeline/validate_data.py`, which checks entity/relationship referential integrity, ID uniqueness, known types, and `spendingBreakdown` fraction ranges. Run it locally with:

```bash
npm run validate-data
```

### Graph Visualization

The graph is rendered using Cytoscape.js with the following features:

- **Node size**: Proportional to budget (logarithmic scale)
- **Node color**: Based on entity type
- **Edge types**: Different colors and styles for different relationship types
- **Layout**: Force-directed layout (COSE algorithm)

### User Interaction

1. **Click on a node**: Opens the sidebar with entity details
2. **Search**: Filters nodes by name (debounced; arrow keys navigate suggestions)
3. **Filter**: Filter by entity type and budget threshold
4. **Zoom/Pan**: Use mouse wheel to zoom, drag to pan
5. **Fit View / double right-click**: Frames the whole graph
6. **Directory**: Accessible, keyboard-navigable list of all entities
7. **Drag a node**: Reposition it; **Download Layout** exports positions as `layout.json`, which can be committed to `data/` to publish the arrangement
8. **Reset Layout**: Restores the published `layout.json` positions in place (falls back to a reload when no layout is available)

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Areas for Contribution

- **Data Updates**: Add new entities, verify budget figures, update sources
- **Bug Fixes**: Improve the UI, fix graph layout issues
- **Features**: Add new visualization types, improve search/filter
- **Documentation**: Improve guides, add examples

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Privacy & Anonymity

- No user accounts or authentication
- No analytics or tracking
- No IP logging
- All data sourced from public government sources
- Maintainers use pseudonyms

## Data Sources

All data is sourced from official Canadian government websites and public documents. Each entity includes a source link to the official reference.

Primary sources include:
- Government of Canada Main Estimates
- Departmental Plans
- Treasury Board Secretariat publications
- Official department websites

## Future Enhancements

Potential future features (not currently implemented):

- Automatic data ingestion from government APIs
- Provincial and municipal government layers
- Budget flow Sankey diagrams
- Historical data visualization
- Public API for third-party use
- Real-time data updates

## Disclaimer

This is a data visualization and knowledge graph project, not a political tool. It aims to make government structure transparent and accessible to the public.
