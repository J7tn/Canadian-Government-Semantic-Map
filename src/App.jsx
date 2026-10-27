import { useState, useCallback, useRef } from 'react'
import GraphView from './components/GraphView'
import Sidebar from './components/Sidebar'
import SearchBar from './components/SearchBar'
import Filters from './components/Filters'
import Legend from './components/Legend'
import Sources from './components/Sources'
import Directory from './components/Directory'
import DataGaps from './components/DataGaps'
import StructuralInsights from './components/StructuralInsights'
import { useGraphData } from './hooks/useGraphData'
import { useDebouncedValue } from './hooks/useDebouncedValue'

function App() {
  const { entities, relationships, layout, status, error, retry } = useGraphData()
  const [selectedEntity, setSelectedEntity] = useState(null)
  const [searchInput, setSearchInput] = useState('')
  const searchQuery = useDebouncedValue(searchInput, 150)
  const [filters, setFilters] = useState({
    type: 'all',
    budgetThreshold: 0,
    // Set of relationship types hidden on the canvas (edge types only —
    // node visibility is governed by type/budget/search).
    hiddenRelTypes: new Set()
  })
  const [hoverDescription, setHoverDescription] = useState(null)
  const [directoryOpen, setDirectoryOpen] = useState(false)
  const cyRef = useRef(null)
  // Canonical position registry — shared with GraphView so layout export
  // covers every entity, including ones currently filtered out.
  const positionsRegistry = useRef({})

  const handleGraphReady = useCallback((cy) => {
    cyRef.current = cy
  }, [])

  const handleNodeClick = useCallback((nodeId) => {
    setSelectedEntity(entities.find(e => e.id === nodeId) || null)
  }, [entities])

  const handleSearch = useCallback((query) => {
    setSearchInput(query)
  }, [])

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters)
  }, [])

  const handleCloseSidebar = useCallback(() => {
    setSelectedEntity(null)
  }, [])

  const handleFitGraph = useCallback(() => {
    cyRef.current?.fit(undefined, 50)
  }, [])

  // One selection path for graph taps, the directory, and search
  // suggestions: open details and center the node when it's visible.
  const selectEntityById = useCallback((entityId) => {
    setSelectedEntity(entities.find(e => e.id === entityId) || null)
    const cy = cyRef.current
    const node = cy?.getElementById(entityId)
    if (cy && node && node.length > 0) {
      cy.animate({ center: { eles: node }, zoom: 1.5, duration: 400 })
    }
  }, [entities])

  const handleDirectorySelect = useCallback((entityId) => {
    setDirectoryOpen(false)
    selectEntityById(entityId)
  }, [selectEntityById])

  const openDirectory = useCallback(() => setDirectoryOpen(true), [])
  const closeDirectory = useCallback(() => setDirectoryOpen(false), [])

  // Restore the saved layout: drop in-session drags, re-seed the position
  // registry from layout.json, snap visible nodes back, and refit. When no
  // saved layout exists the auto-layout result is the baseline — reloading
  // is the only way to regenerate it, so we keep that fallback.
  const handleResetLayout = useCallback(() => {
    const cy = cyRef.current
    if (!layout || !cy) {
      window.location.reload()
      return
    }
    for (const key of Object.keys(positionsRegistry.current)) {
      delete positionsRegistry.current[key]
    }
    Object.assign(positionsRegistry.current, layout)
    cy.nodes().forEach(node => {
      const p = layout[node.id()]
      if (p) node.position(p)
    })
    cy.fit(undefined, 50)
  }, [layout])

  // Export the full position registry, then overlay live positions for
  // visible nodes. Exporting only cy.nodes() would silently drop
  // filtered-out entities from the saved layout.
  const handleDownloadLayout = useCallback(() => {
    const positions = { ...positionsRegistry.current }
    cyRef.current?.nodes().forEach(node => {
      const pos = node.position()
      positions[node.id()] = { x: pos.x, y: pos.y }
    })
    const blob = new Blob([JSON.stringify(positions, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'layout.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [])

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-red-700 text-white p-4 shadow-md">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold">Canadian Government Semantic Map</h1>
            <p className="text-sm text-red-200 mt-1">Fiscal Year 2024-25</p>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <SearchBar
              value={searchInput}
              onSearch={handleSearch}
              onSelectEntity={(entity) => selectEntityById(entity.id)}
              entities={entities}
            />
            <Filters filters={filters} onFilterChange={handleFilterChange} />
            <button
              onClick={openDirectory}
              className="bg-white text-gray-700 px-4 py-2 rounded-lg shadow-md hover:bg-gray-50 text-sm font-medium"
            >
              Directory
            </button>
            <Sources />
            <button
              onClick={handleFitGraph}
              className="bg-white text-gray-700 px-4 py-2 rounded-lg shadow-md hover:bg-gray-50 text-sm font-medium"
              title="Frame the whole graph in view"
            >
              Fit View
            </button>
            <button
              onClick={handleDownloadLayout}
              className="bg-white text-gray-700 px-4 py-2 rounded-lg shadow-md hover:bg-gray-50 text-sm font-medium"
              title="Export current node positions as layout.json"
            >
              Download Layout
            </button>
            <button
              onClick={handleResetLayout}
              className="bg-white text-gray-700 px-4 py-2 rounded-lg shadow-md hover:bg-gray-50 text-sm font-medium"
              title="Reload and restore the saved layout"
            >
              Reset Layout
            </button>
          </div>
        </div>
      </header>
      {/* Map viewport: fixed height so the page can scroll to the table below */}
      <div className="flex h-[calc(100vh-5.5rem)] overflow-hidden">
        <div className="flex-1 relative min-w-0">
          <GraphView
            entities={entities}
            relationships={relationships}
            layout={layout}
            selectedEntityId={selectedEntity?.id || null}
            onNodeClick={handleNodeClick}
            searchQuery={searchQuery}
            filters={filters}
            onGraphReady={handleGraphReady}
            positionsRegistry={positionsRegistry}
          />
          {status === 'loading' && (
            <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-30">
              <div className="text-center">
                <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-600">Loading graph data…</p>
              </div>
            </div>
          )}
          {status === 'error' && (
            <div className="absolute inset-0 bg-white flex items-center justify-center z-30">
              <div className="text-center max-w-md p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-2">Failed to load graph data</h2>
                <p className="text-sm text-gray-600 mb-4">{error}</p>
                <button
                  onClick={retry}
                  className="bg-red-700 text-white px-4 py-2 rounded-lg shadow-md hover:bg-red-600 text-sm font-medium"
                >
                  Retry
                </button>
              </div>
            </div>
          )}
          {/* Legend hidden on small screens — it would crowd the canvas;
              the Directory covers entity discovery there. */}
          <div className="hidden md:block">
            <Legend onHover={setHoverDescription} />
          </div>
          {hoverDescription && (
            <div
              aria-live="polite"
              className="absolute bottom-4 left-4 right-4 md:left-[22rem] md:right-auto md:max-w-sm bg-white rounded-lg shadow-lg p-4 z-20"
            >
              <p className="text-sm text-gray-700">{hoverDescription}</p>
            </div>
          )}
        </div>
        {selectedEntity && (
          <Sidebar
            entity={selectedEntity}
            entities={entities}
            relationships={relationships}
            onClose={handleCloseSidebar}
          />
        )}
      </div>
      {directoryOpen && (
        <Directory
          entities={entities}
          onSelect={handleDirectorySelect}
          onClose={closeDirectory}
        />
      )}
      {/* Screen-reader-only announcements for selection changes — canvas
          interactions are otherwise invisible to assistive tech. */}
      <div aria-live="polite" className="sr-only">
        {selectedEntity ? `Selected: ${selectedEntity.name}` : ''}
      </div>

      <DataGaps
        entities={entities}
        relationships={relationships}
        onSelect={handleDirectorySelect}
      />
      <StructuralInsights entities={entities} relationships={relationships} />
    </div>
  )
}

export default App
