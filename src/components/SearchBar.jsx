import React, { useState, useEffect } from 'react'

const SearchBar = ({ onSearch, entities }) => {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    if (query.length > 0) {
      const filtered = entities.filter(entity => {
        const nameMatch = entity.name.toLowerCase().includes(query.toLowerCase())
        const aliasMatch = entity.aliases && entity.aliases.some(alias =>
          alias.toLowerCase().includes(query.toLowerCase())
        )
        return nameMatch || aliasMatch
      }).slice(0, 5)
      setSuggestions(filtered)
      setShowSuggestions(true)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [query, entities])

  const handleInputChange = (e) => {
    const value = e.target.value
    setQuery(value)
    onSearch(value)
  }

  const handleSuggestionClick = (entityName) => {
    setQuery(entityName)
    onSearch(entityName)
    setShowSuggestions(false)
  }

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search entities..."
          className="w-64 px-4 py-2 pl-10 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
        />
        <svg
          className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((entity) => (
            <div
              key={entity.id}
              onClick={() => handleSuggestionClick(entity.name)}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-900 text-sm"
            >
              {entity.name}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SearchBar
