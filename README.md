# Canadian Government Semantic Map

An interactive web application that visualizes the structure of the Canadian federal government as a semantic graph. This open-source tool makes relationships between ministries, agencies, Crown corporations, programs, and budget flows transparent and navigable.

## Features

- **Interactive Graph Visualization**: Explore the federal government structure through an interactive node-based graph
- **Entity Information**: Click on any node to view detailed information including budget, description, and source links
- **Search Functionality**: Quickly find specific government entities
- **Filtering**: Filter by entity type (Ministry, Agency, Crown Corporation, etc.) and budget threshold
- **Responsive Design**: Clean, modern UI built with React and TailwindCSS
- **Data Verification System**: Distinguishes between verified and unverified budget figures
- **Source Tracking**: Tracks when sources were parsed and last updated

## Tech Stack

- **Frontend**: React 18 with Vite
- **Graph Visualization**: Cytoscape.js
- **Styling**: TailwindCSS
- **Data**: JSON files (loaded dynamically at runtime)

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

The built files will be in the `dist` directory.

## Project Structure

```
canadian-government-semantic-map/
├── data/
│   ├── entities.json          # Government entity data
│   ├── relationships.json      # Entity relationships
│   └── sources.json           # Data source information
├── src/
│   ├── components/
│   │   ├── GraphView.jsx      # Cytoscape graph visualization
│   │   ├── Sidebar.jsx        # Entity details panel
│   │   ├── SearchBar.jsx      # Search functionality
│   │   ├── Filters.jsx        # Filter controls
│   │   ├── Legend.jsx         # Graph legend
│   │   └── Sources.jsx        # Sources modal
│   ├── App.jsx                # Main application component
│   └── main.jsx               # Application entry point
├── index.html                 # HTML template
├── vite.config.js             # Vite configuration
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
  "aliases": ["string"]
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

### Relationships (`data/relationships.json`)

Each relationship represents a connection between entities:

```json
{
  "from": "string",
  "to": "string",
  "type": "reports_to|funds|regulates|owns|oversees|international_aid"
}
```

**Relationship Types:**
- `reports_to`: Organizational reporting structure
- `funds`: Budget allocation/flow
- `regulates`: Regulatory oversight
- `owns`: Ownership (e.g., Crown corporations)
- `oversees`: General oversight
- `international_aid`: Foreign aid distribution

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

The application loads JSON data dynamically at runtime using `fetch()`:

```javascript
// In App.jsx
useEffect(() => {
  fetch('/data/entities.json')
    .then(res => res.json())
    .then(data => setEntities(data))
}, [])
```

This approach ensures that data changes are reflected immediately without requiring a rebuild.

### Graph Visualization

The graph is rendered using Cytoscape.js with the following features:

- **Node size**: Proportional to budget (logarithmic scale)
- **Node color**: Based on entity type
- **Edge types**: Different colors and styles for different relationship types
- **Layout**: Force-directed layout (COSE algorithm)

### User Interaction

1. **Click on a node**: Opens the sidebar with entity details
2. **Search**: Filters nodes by name
3. **Filter**: Filter by entity type and budget threshold
4. **Zoom/Pan**: Use mouse wheel to zoom, drag to pan

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
