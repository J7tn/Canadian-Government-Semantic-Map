# Architecture Documentation

## System Overview

The Canadian Government Semantic Map is a single-page React application that visualizes the federal government structure as an interactive graph. The application uses a static data model with JSON files, making it easy to maintain and update.

## Technology Stack

### Frontend
- **React 18**: UI framework
- **Vite**: Build tool and development server
- **Cytoscape.js**: Graph visualization library
- **TailwindCSS**: Utility-first CSS framework

### Data Storage
- **JSON Files**: Static data storage in `/data` directory
  - `entities.json`: Government entities (nodes)
  - `relationships.json`: Entity relationships (edges)

## Project Structure

```
canadian-government-semantic-map/
├── data/
│   ├── entities.json          # Government entities
│   └── relationships.json     # Entity relationships
├── docs/
│   └── architecture.md        # This file
├── public/
│   └── canada-leaf.svg        # Favicon
├── src/
│   ├── components/
│   │   ├── GraphView.jsx      # Graph visualization component
│   │   ├── Sidebar.jsx        # Entity details panel
│   │   ├── SearchBar.jsx      # Search functionality
│   │   └── Filters.jsx        # Filter controls
│   ├── App.jsx                # Main application component
│   ├── main.jsx               # React entry point
│   └── index.css              # Global styles
├── index.html                 # HTML template
├── package.json               # Dependencies
├── vite.config.js             # Vite configuration
├── tailwind.config.js         # TailwindCSS configuration
├── postcss.config.js          # PostCSS configuration
├── README.md                  # Project documentation
├── CONTRIBUTING.md            # Contribution guidelines
└── LICENSE                    # MIT License
```

## Component Architecture

### App Component
The main application component that:
- Manages global state (selected entity, search query, filters)
- Coordinates between child components
- Handles data flow

### GraphView Component
Renders the interactive graph using Cytoscape.js:
- Filters entities and relationships based on search and filter state
- Configures node styling based on entity type and budget
- Handles node click events
- Implements zoom and pan functionality

### Sidebar Component
Displays detailed information about selected entities:
- Entity name and type badge
- Description
- Budget (formatted as CAD)
- Parent entity
- Source link
- Last updated date

### SearchBar Component
Provides search functionality:
- Real-time search suggestions
- Filters entities by name
- Communicates search state to parent

### Filters Component
Provides filtering options:
- Entity type filter (dropdown)
- Budget threshold filter (number input)
- Communicates filter state to parent

## Data Model

### Entity Schema
```typescript
{
  id: string;              // Unique identifier (kebab-case)
  name: string;            // Official name
  type: EntityType;        // Ministry | Agency | CrownCorporation | Program | Other
  parent: string | null;   // Parent entity ID
  budget: number | null;    // Annual budget in CAD
  description: string;     // Brief description
  source: string;          // Official source URL
  lastUpdated: string;     // YYYY-MM-DD format
}
```

### Relationship Schema
```typescript
{
  from: string;            // Source entity ID
  to: string;              // Target entity ID
  type: RelationshipType;  // reports_to | funds | regulates | owns | oversees
}
```

## Graph Visualization

### Node Styling
- **Size**: Scaled logarithmically by budget (30-80px)
- **Color**: By entity type
  - Ministry: Red (#dc2626)
  - Agency: Blue (#2563eb)
  - Crown Corporation: Green (#16a34a)
  - Program: Purple (#9333ea)
  - Other: Gray (#6b7280)
- **Border**: White with 2px width
- **Label**: Entity name centered on node

### Edge Styling
- **Width**: 2px
- **Color**: Gray (#94a3b8)
- **Arrow**: Triangle at target
- **Curve**: Bezier

### Layout Algorithm
Uses Cytoscape.js's COSE (Compound Spring Embedder) layout:
- Node repulsion: 100,000
- Ideal edge length: 100
- Gravity: 80
- 1000 iterations for convergence

## State Management

The application uses React's built-in state management:
- Local component state for UI interactions
- Props for data flow between components
- No external state management library (sufficient for current scope)

## Performance Considerations

- Graph rendering is optimized with COSE layout (animate: false)
- Filtering happens before graph rendering to reduce node count
- Search suggestions limited to 5 results
- Component memoization could be added if performance issues arise

## Security Considerations

- No authentication required
- No user data collection
- All data is public government information
- Source links open in new tabs with `rel="noopener noreferrer"`

## Deployment

The application can be deployed to any static hosting service:
- GitHub Pages
- Netlify
- Vercel
- AWS S3 + CloudFront

Build command: `npm run build`
Output directory: `dist/`

## Future Extensibility

### API Mode (Mode B)
The architecture supports future migration to an API-based data source:
- Replace JSON imports with API calls
- Add caching layer (e.g., Redis)
- Implement data validation
- Add error handling for network requests

### Additional Features
- Historical data visualization (time-based filtering)
- Provincial/municipal layers
- Sankey diagrams for budget flows
- Export functionality (PNG, SVG)
- Bookmarking/sharing specific views
