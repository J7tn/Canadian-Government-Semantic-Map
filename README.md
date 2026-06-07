# Canadian Government Semantic Map

An interactive web application that visualizes the structure of the Canadian federal government as a semantic graph. This open-source tool makes relationships between ministries, agencies, Crown corporations, programs, and budget flows transparent and navigable.

## Features

- **Interactive Graph Visualization**: Explore the federal government structure through an interactive node-based graph
- **Entity Information**: Click on any node to view detailed information including budget, description, and source links
- **Search Functionality**: Quickly find specific government entities
- **Filtering**: Filter by entity type (Ministry, Agency, Crown Corporation, etc.) and budget threshold
- **Responsive Design**: Clean, modern UI built with React and TailwindCSS
- **Static Data**: Data stored in JSON files for easy manual updates

## Tech Stack

- **Frontend**: React 18 with Vite
- **Graph Visualization**: Cytoscape.js
- **Styling**: TailwindCSS
- **Data**: JSON files (Mode A - Static Data)

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

## Data Structure

### Entities (`data/entities.json`)

Each entity represents a government organization:

```json
{
  "id": "string",
  "name": "string",
  "type": "Ministry|Agency|CrownCorporation|Program|Other",
  "parent": "string|null",
  "budget": "number|null",
  "description": "string",
  "source": "string",
  "lastUpdated": "string"
}
```

### Relationships (`data/relationships.json`)

Each relationship represents a connection between entities:

```json
{
  "from": "string",
  "to": "string",
  "type": "reports_to|funds|regulates|owns|oversees"
}
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

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

## Future Enhancements

Potential future features (not currently implemented):

- Automatic data ingestion from government APIs
- Provincial and municipal government layers
- Budget flow Sankey diagrams
- Historical data visualization
- Public API for third-party use

## Disclaimer

This is a data visualization and knowledge graph project, not a political tool. It aims to make government structure transparent and accessible to the public.
