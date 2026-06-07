import React, { useState, useCallback } from 'react'
import GraphView from './components/GraphView'
import Sidebar from './components/Sidebar'
import SearchBar from './components/SearchBar'
import Filters from './components/Filters'
import TimeFilter from './components/TimeFilter'
import Legend from './components/Legend'
import Sources from './components/Sources'
import entities from '../data/entities.json'
import relationships from '../data/relationships.json'

function App() {
  const [selectedEntity, setSelectedEntity] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    type: 'all',
    budgetThreshold: 0
  })
  const [yearRange, setYearRange] = useState({ start: 2024, end: 2024 })

  const handleNodeClick = useCallback((nodeId) => {
    const entity = entities.find(e => e.id === nodeId)
    setSelectedEntity(entity)
  }, [])

  const handleSearch = useCallback((query) => {
    setSearchQuery(query)
  }, [])

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters)
  }, [])

  const handleYearRangeChange = useCallback((newYearRange) => {
    setYearRange(newYearRange)
  }, [])

  const handleCloseSidebar = useCallback(() => {
    setSelectedEntity(null)
  }, [])

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-red-700 text-white p-4 shadow-md">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Canadian Government Semantic Map</h1>
          <div className="flex items-center gap-4">
            <SearchBar onSearch={handleSearch} entities={entities} />
            <Filters onFilterChange={handleFilterChange} />
            <TimeFilter yearRange={yearRange} onYearRangeChange={handleYearRangeChange} />
            <Sources />
          </div>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative">
          <GraphView
            entities={entities}
            relationships={relationships}
            onNodeClick={handleNodeClick}
            searchQuery={searchQuery}
            filters={filters}
            yearRange={yearRange}
          />
          <Legend />
        </div>
        {selectedEntity && (
          <Sidebar
            entity={selectedEntity}
            onClose={handleCloseSidebar}
            yearRange={yearRange}
          />
        )}
      </div>
    </div>
  )
}

export default App
