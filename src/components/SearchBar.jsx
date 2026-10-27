import { useState, useEffect } from 'react'
import { matchesQuery } from '../utils/graphFilter'

const LISTBOX_ID = 'entity-search-suggestions'

const SearchBar = ({ value, onSearch, onSelectEntity, entities }) => {
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  useEffect(() => {
    if (value.length > 0) {
      // Same predicate the graph filter uses — a suggestion is never
      // offered for an entity the graph is hiding.
      setSuggestions(entities.filter(entity => matchesQuery(entity, value)).slice(0, 5))
      setShowSuggestions(true)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
    setActiveIndex(-1)
  }, [value, entities])

  const selectEntity = (entity) => {
    // Selecting a suggestion is navigation, not just filtering: open the
    // entity's details and center its node on the canvas.
    onSearch(entity.name)
    onSelectEntity?.(entity)
    setShowSuggestions(false)
    setActiveIndex(-1)
  }

  const handleInputChange = (e) => {
    onSearch(e.target.value)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown' && suggestions.length > 0) {
      e.preventDefault()
      setShowSuggestions(true)
      setActiveIndex(i => (i + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp' && suggestions.length > 0) {
      e.preventDefault()
      setActiveIndex(i => (i <= 0 ? suggestions.length - 1 : i - 1))
    } else if (e.key === 'Enter' && activeIndex >= 0 && suggestions[activeIndex]) {
      e.preventDefault()
      selectEntity(suggestions[activeIndex])
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setActiveIndex(-1)
    }
  }

  const listOpen = showSuggestions && suggestions.length > 0

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          role="combobox"
          aria-expanded={listOpen}
          aria-controls={LISTBOX_ID}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `suggestion-${suggestions[activeIndex]?.id}` : undefined}
          aria-label="Search entities"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Search entities..."
          className="w-64 px-4 py-2 pl-10 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
        />
        <svg
          className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {listOpen && (
        <ul
          id={LISTBOX_ID}
          role="listbox"
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((entity, index) => (
            <li
              key={entity.id}
              id={`suggestion-${entity.id}`}
              role="option"
              aria-selected={index === activeIndex}
              onClick={() => selectEntity(entity)}
              onMouseEnter={() => setActiveIndex(index)}
              className={`px-4 py-2 cursor-pointer text-sm ${
                index === activeIndex ? 'bg-gray-100' : ''
              } text-gray-900`}
            >
              {entity.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default SearchBar
