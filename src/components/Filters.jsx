import { RELATIONSHIP_TYPES } from '../config/graphTheme'

const MILLION = 1000000
const SLIDER_MAX_MILLIONS = 150000 // covers the largest entity (~$143B)

// Controlled component — filter state lives in App (single source of
// truth, enables programmatic reset) and flows down via `filters`.
const Filters = ({ filters, onFilterChange }) => {
  const { type, budgetThreshold, hiddenRelTypes } = filters

  const handleTypeChange = (e) => {
    onFilterChange({ type: e.target.value, budgetThreshold, hiddenRelTypes })
  }

  const toggleRelType = (relType) => {
    const next = new Set(hiddenRelTypes)
    if (next.has(relType)) {
      next.delete(relType)
    } else {
      next.add(relType)
    }
    onFilterChange({ type, budgetThreshold, hiddenRelTypes: next })
  }

  // Number input is denominated in $M — keep it consistent with the
  // slider and preset buttons (previously it set raw dollars).
  const handleBudgetChange = (e) => {
    const millions = parseFloat(e.target.value)
    const newThreshold = Number.isFinite(millions) ? Math.max(0, millions) * MILLION : 0
    onFilterChange({ type, budgetThreshold: newThreshold, hiddenRelTypes })
  }

  const handleSliderChange = (e) => {
    onFilterChange({ type, budgetThreshold: parseFloat(e.target.value) * MILLION, hiddenRelTypes })
  }

  const presetBudgets = [0, 100, 500, 1000, 5000, 10000]

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <label htmlFor="type-filter" className="text-sm font-medium text-white">
          Type:
        </label>
        <select
          id="type-filter"
          value={type}
          onChange={handleTypeChange}
          className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 text-sm"
        >
          <option value="all">All Types</option>
          <option value="Ministry">Ministry</option>
          <option value="Agency">Agency</option>
          <option value="CrownCorporation">Crown Corporation</option>
          <option value="Program">Program</option>
          <option value="Other">Other</option>
          <option value="ForeignCountry">Foreign Country</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="budget-filter" className="text-sm font-medium text-white">
          Min Budget ($M):
        </label>
        <input
          id="budget-filter"
          type="number"
          value={budgetThreshold / MILLION}
          onChange={handleBudgetChange}
          placeholder="0"
          min="0"
          className="w-20 px-3 py-1.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 text-sm"
        />
        <input
          type="range"
          aria-label="Minimum budget filter"
          min="0"
          max={SLIDER_MAX_MILLIONS}
          step="500"
          value={Math.min(budgetThreshold / MILLION, SLIDER_MAX_MILLIONS)}
          onChange={handleSliderChange}
          className="w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <div className="flex items-center gap-1">
        {presetBudgets.map((preset) => (
          <button
            key={preset}
            onClick={() => {
              onFilterChange({ type, budgetThreshold: preset * MILLION, hiddenRelTypes })
            }}
            className={`px-2 py-1 text-xs rounded ${
              budgetThreshold === preset * MILLION
                ? 'bg-white text-red-700 font-medium'
                : 'bg-red-600 text-white hover:bg-red-500'
            }`}
          >
            {preset === 0 ? 'All' : `$${preset}M`}
          </button>
        ))}
      </div>

      {/* Edge-type visibility: toggles types off without touching
          node filters — hidden types lose their graph edges only. */}
      <fieldset className="flex items-center gap-1">
        <legend className="sr-only">Relationship types shown</legend>
        {Object.entries(RELATIONSHIP_TYPES).map(([relType, info]) => {
          const hidden = hiddenRelTypes?.has(relType)
          return (
            <button
              key={relType}
              type="button"
              aria-pressed={!hidden}
              onClick={() => toggleRelType(relType)}
              title={`${hidden ? 'Show' : 'Hide'} ${info.label} edges`}
              className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${
                hidden
                  ? 'bg-red-800 text-red-200 opacity-60'
                  : 'bg-red-600 text-white hover:bg-red-500'
              }`}
            >
              <span
                aria-hidden="true"
                className="inline-block w-3 h-0.5"
                style={{ backgroundColor: info.color }}
              />
              {info.label}
            </button>
          )
        })}
      </fieldset>
    </div>
  )
}

export default Filters
