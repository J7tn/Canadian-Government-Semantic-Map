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
    <div className="w-96 flex-shrink-0 bg-white border-l border-gray-200 overflow-y-auto shadow-lg">
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
            {entity.type === 'ForeignCountry' ? (
              entity.aidVerified === false ? (
                <>
                  <p className="text-gray-900 font-semibold text-lg">
                    Unverified
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Aid data requires specific source citation
                  </p>
                </>
              ) : (
                <p className="text-gray-900 font-semibold text-lg">
                  {formatBudget(entity.received_aid)}
                </p>
              )
            ) : (
              entity.budgetVerified === false ? (
                <>
                  <p className="text-gray-900 font-semibold text-lg">
                    Unverified
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Budget data requires specific source citation
                  </p>
                </>
              ) : (
                <p className="text-gray-900 font-semibold text-lg">
                  {formatBudget(entity.budget)}
                </p>
              )
            )}
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
            {entity.sourceParsedDate && (
              <p className="text-xs text-gray-500 mt-1">
                Parsed: {entity.sourceParsedDate}
              </p>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Last Updated
            </h3>
            <p className="text-gray-700 text-sm">{entity.lastUpdated}</p>
          </div>

          {entity.spendingBreakdown && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Spending Breakdown
              </h3>
              <div className="space-y-2">
                {Object.entries(entity.spendingBreakdown).map(([category, percentage]) => {
                  const categoryLabels = {
                    personnel: 'Personnel',
                    professional_services: 'Professional Services',
                    transportation: 'Transportation',
                    information: 'Information Technology',
                    rentals: 'Rentals',
                    maintenance: 'Maintenance',
                    utilities: 'Utilities',
                    capital: 'Capital & Equipment',
                    transfer_payments: 'Transfer Payments'
                  }
                  const categoryColors = {
                    personnel: 'bg-blue-500',
                    professional_services: 'bg-purple-500',
                    transportation: 'bg-yellow-500',
                    information: 'bg-cyan-500',
                    rentals: 'bg-pink-500',
                    maintenance: 'bg-orange-500',
                    utilities: 'bg-green-500',
                    capital: 'bg-red-500',
                    transfer_payments: 'bg-indigo-500'
                  }
                  const amount = entity.budget ? entity.budget * percentage : 0
                  const percentageDisplay = (percentage * 100).toFixed(percentage * 100 < 1 ? 2 : percentage * 100 < 10 ? 1 : 0)
                  
                  return (
                    <div key={category}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-600">{categoryLabels[category] || category}</span>
                        <span className="text-xs font-medium text-gray-900">
                          {percentageDisplay}% ({formatBudget(amount)})
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`${categoryColors[category] || 'bg-gray-500'} h-2 rounded-full transition-all duration-300`}
                          style={{ width: `${percentage * 100}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Sidebar
