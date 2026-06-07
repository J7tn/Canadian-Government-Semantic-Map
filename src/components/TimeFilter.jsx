import React from 'react'

const TimeFilter = ({ yearRange, onYearRangeChange }) => {
  const years = [2022, 2023, 2024]
  
  const handleStartYearChange = (e) => {
    const startYear = parseInt(e.target.value)
    onYearRangeChange({ start: startYear, end: yearRange.end })
  }

  const handleEndYearChange = (e) => {
    const endYear = parseInt(e.target.value)
    onYearRangeChange({ start: yearRange.start, end: endYear })
  }

  const handlePresetClick = (preset) => {
    onYearRangeChange(preset)
  }

  return (
    <div className="flex items-center gap-3">
      <label htmlFor="time-filter" className="text-sm font-medium text-white">
        Time Period:
      </label>
      <div className="flex items-center gap-2">
        <select
          id="start-year"
          value={yearRange.start}
          onChange={handleStartYearChange}
          className="px-2 py-1 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 text-sm"
        >
          {years.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
        <span className="text-white">to</span>
        <select
          id="end-year"
          value={yearRange.end}
          onChange={handleEndYearChange}
          className="px-2 py-1 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 text-sm"
        >
          {years.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-1">
        <button
          onClick={() => handlePresetClick({ start: 2022, end: 2022 })}
          className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded transition-colors"
        >
          2022
        </button>
        <button
          onClick={() => handlePresetClick({ start: 2023, end: 2023 })}
          className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded transition-colors"
        >
          2023
        </button>
        <button
          onClick={() => handlePresetClick({ start: 2024, end: 2024 })}
          className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded transition-colors"
        >
          2024
        </button>
        <button
          onClick={() => handlePresetClick({ start: 2022, end: 2024 })}
          className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded transition-colors"
        >
          All
        </button>
      </div>
    </div>
  )
}

export default TimeFilter
