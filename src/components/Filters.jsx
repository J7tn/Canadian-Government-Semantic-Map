import React, { useState } from 'react'

const Filters = ({ onFilterChange }) => {
  const [type, setType] = useState('all')
  const [budgetThreshold, setBudgetThreshold] = useState(0)

  const handleTypeChange = (e) => {
    const newType = e.target.value
    setType(newType)
    onFilterChange({ type: newType, budgetThreshold })
  }

  const handleBudgetChange = (e) => {
    const newThreshold = parseInt(e.target.value) || 0
    setBudgetThreshold(newThreshold)
    onFilterChange({ type, budgetThreshold: newThreshold })
  }

  const handleSliderChange = (e) => {
    const newThreshold = parseInt(e.target.value) * 1000000
    setBudgetThreshold(newThreshold)
    onFilterChange({ type, budgetThreshold: newThreshold })
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
          value={budgetThreshold / 1000000}
          onChange={handleBudgetChange}
          placeholder="0"
          min="0"
          className="w-20 px-3 py-1.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 text-sm"
        />
        <input
          type="range"
          min="0"
          max="35000"
          step="100"
          value={budgetThreshold / 1000000}
          onChange={handleSliderChange}
          className="w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <div className="flex items-center gap-1">
        {presetBudgets.map((preset) => (
          <button
            key={preset}
            onClick={() => {
              const newThreshold = preset * 1000000
              setBudgetThreshold(newThreshold)
              onFilterChange({ type, budgetThreshold: newThreshold })
            }}
            className={`px-2 py-1 text-xs rounded ${
              budgetThreshold === preset * 1000000
                ? 'bg-white text-red-700 font-medium'
                : 'bg-red-600 text-white hover:bg-red-500'
            }`}
          >
            {preset === 0 ? 'All' : `$${preset}M`}
          </button>
        ))}
      </div>
    </div>
  )
}

export default Filters
