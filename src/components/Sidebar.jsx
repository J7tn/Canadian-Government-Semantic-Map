import React from 'react'

const Sidebar = ({ entity, onClose }) => {
  if (!entity) return null

  const formatBudget = (budget) => {
    if (!budget) return 'N/A'
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(budget)
  }

  const typeColors = {
    Ministry: 'bg-red-100 text-red-800',
    Agency: 'bg-blue-100 text-blue-800',
    CrownCorporation: 'bg-green-100 text-green-800',
    Program: 'bg-purple-100 text-purple-800',
    Other: 'bg-gray-100 text-gray-800',
    ForeignCountry: 'bg-blue-100 text-blue-800'
  }

  return (
    <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto shadow-lg">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">{entity.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${typeColors[entity.type] || typeColors.Other}`}>
              {entity.type}
            </span>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Description
            </h3>
            <p className="text-gray-700 text-sm leading-relaxed">{entity.description}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
              {entity.type === 'ForeignCountry' ? 'Received Aid' : 'Budget'}
            </h3>
            <p className="text-gray-900 font-semibold text-lg">
              {entity.type === 'ForeignCountry' ? formatBudget(entity.received_aid) : formatBudget(entity.budget)}
            </p>
          </div>

          {entity.parent && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Parent Entity
              </h3>
              <p className="text-gray-700 text-sm">{entity.parent}</p>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Source
            </h3>
            <a
              href={entity.source}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              {entity.source}
            </a>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Last Updated
            </h3>
            <p className="text-gray-700 text-sm">{entity.lastUpdated}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
