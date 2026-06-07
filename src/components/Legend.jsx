import React from 'react'

const Legend = () => {
  const entityTypes = [
    { type: 'Ministry', color: '#dc2626', label: 'Ministry' },
    { type: 'Agency', color: '#2563eb', label: 'Agency' },
    { type: 'CrownCorporation', color: '#16a34a', label: 'Crown Corporation' },
    { type: 'Program', color: '#9333ea', label: 'Program' },
    { type: 'Other', color: '#6b7280', label: 'Other' },
    { type: 'ForeignCountry', color: '#f97316', label: 'Foreign Country' }
  ]

  const relationshipTypes = [
    { type: 'reports_to', color: '#94a3b8', label: 'Reports To' },
    { type: 'oversees', color: '#f59e0b', label: 'Oversees' },
    { type: 'funds', color: '#16a34a', label: 'Funds (Money Flow)' },
    { type: 'international_aid', color: '#8b5cf6', label: 'International Aid' }
  ]

  return (
    <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 z-10 max-w-xs">
      <h3 className="text-sm font-bold text-gray-900 mb-3">Legend</h3>
      
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Entity Types
        </h4>
        <div className="space-y-1.5">
          {entityTypes.map(({ type, color, label }) => (
            <div key={type} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full border-2 border-white"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-gray-700">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Relationship Types
        </h4>
        <div className="space-y-1.5">
          {relationshipTypes.map(({ type, color, label }) => (
            <div key={type} className="flex items-center gap-2">
              <div className="flex items-center">
                <div
                  className="w-8 h-0.5"
                  style={{ backgroundColor: color }}
                />
                <div
                  className="w-0 h-0 border-l-4"
                  style={{
                    borderLeftColor: color,
                    borderTop: '4px solid transparent',
                    borderBottom: '4px solid transparent'
                  }}
                />
              </div>
              <span className="text-xs text-gray-700">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Legend
