import React, { useState, useCallback, useEffect } from 'react'
import GraphView from './components/GraphView'
import Sidebar from './components/Sidebar'
import SearchBar from './components/SearchBar'
import Filters from './components/Filters'
import Legend from './components/Legend'
import Sources from './components/Sources'

function App() {
  const [selectedEntity, setSelectedEntity] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    type: 'all',
    budgetThreshold: 0
  })
  const [entities, setEntities] = useState([])
  const [relationships, setRelationships] = useState([])
  const [hoverDescription, setHoverDescription] = useState(null)

  useEffect(() => {
    fetch('/entities.json')
      .then(res => res.json())
      .then(data => setEntities(data))
      .catch(err => console.error('Error loading entities:', err))
  }, [])

  useEffect(() => {
    fetch('/relationships.json')
      .then(res => res.json())
      .then(data => setRelationships(data))
      .catch(err => console.error('Error loading relationships:', err))
  }, [])

  const handleNodeClick = useCallback((nodeId) => {
    const entity = entities.find(e => e.id === nodeId)
    setSelectedEntity(entity)
  }, [entities])

  const handleSearch = useCallback((query) => {
    setSearchQuery(query)
  }, [])

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters)
  }, [])

  const handleCloseSidebar = useCallback(() => {
    setSelectedEntity(null)
  }, [])

  const handleResetLayout = useCallback(() => {
    fetch('/layout.json')
      .then(res => res.json())
      .then(positions => {
        // Clear the layout.json file by setting it to empty
        // This requires a backend, so for now just reload
        window.location.reload()
      })
      .catch(() => window.location.reload())
  }, [])

  const handleDownloadLayout = useCallback(() => {
    // Try to get positions from localStorage first (for recovery)
    const localStoragePositions = JSON.parse(localStorage.getItem('graphPositions') || '{}')
    
    if (Object.keys(localStoragePositions).length > 0) {
      // Use localStorage positions if available
      const blob = new Blob([JSON.stringify(localStoragePositions, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'layout.json'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } else if (window.cyInstance) {
      // Otherwise use current graph positions
      const positions = {}
      window.cyInstance.nodes().forEach(node => {
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
    }
  }, [])

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-red-700 text-white p-4 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Canadian Government Semantic Map</h1>
            <p className="text-sm text-red-200 mt-1">Fiscal Year 2024-25</p>
          </div>
          <div className="flex items-center gap-4">
            <SearchBar onSearch={handleSearch} entities={entities} />
            <Filters onFilterChange={handleFilterChange} />
            <Sources />
            <button
              onClick={handleDownloadLayout}
              className="bg-white text-gray-700 px-4 py-2 rounded-lg shadow-md hover:bg-gray-50 text-sm font-medium"
            >
              Download Layout
            </button>
            <button
              onClick={handleResetLayout}
              className="bg-white text-gray-700 px-4 py-2 rounded-lg shadow-md hover:bg-gray-50 text-sm font-medium"
            >
              Reset Layout
            </button>
          </div>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative min-w-0">
          <GraphView
            entities={entities}
            relationships={relationships}
            onNodeClick={handleNodeClick}
            searchQuery={searchQuery}
            filters={filters}
          />
          <Legend onHover={setHoverDescription} />
          {hoverDescription && (
            <div className="absolute bottom-4 left-[22rem] max-w-sm bg-white rounded-lg shadow-lg p-4 z-20">
              <p className="text-sm text-gray-700">{hoverDescription}</p>
            </div>
          )}
        </div>
        {selectedEntity && (
          <Sidebar
            entity={selectedEntity}
            onClose={handleCloseSidebar}
          />
        )}
      </div>
    </div>
  )
}

export default App
