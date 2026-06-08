import React from 'react'

const Legend = ({ onHover }) => {
  const entityTypes = [
    { type: 'Ministry', color: '#dc2626', label: 'Ministry', description: 'Federal government departments responsible for specific policy areas (e.g., Health, Finance, Defence).' },
    { type: 'Agency', color: '#2563eb', label: 'Agency', description: 'Government agencies that provide specialized services or regulate specific sectors (e.g., CRA, Statistics Canada).' },
    { type: 'CrownCorporation', color: '#16a34a', label: 'Crown Corporation', description: 'State-owned enterprises that operate at arms-length from government (e.g., CBC, Canada Post, VIA Rail).' },
    { type: 'Program', color: '#9333ea', label: 'Program', description: 'Specific government programs or initiatives with defined objectives and budgets.' },
    { type: 'Other', color: '#6b7280', label: 'Other', description: 'Other government entities that do not fit into standard categories (e.g., Parliament).' },
    { type: 'ForeignCountry', color: '#f97316', label: 'Foreign Country', description: 'Recipient countries of Canadian international aid and foreign relations.' }
  ]

  const relationshipTypes = [
    { type: 'reports_to', color: '#94a3b8', label: 'Reports To', description: 'Formal reporting relationships showing chain of accountability within the government hierarchy.' },
    { type: 'oversees', color: '#f59e0b', label: 'Oversees', description: 'Parent-child organizational structure showing which entities oversee others (generated from parent field).' },
    { type: 'funds', color: '#16a34a', label: 'Funds (Money Flow)', description: 'Budgetary relationships showing the flow of funds from one entity to another (e.g., Parliament funds departments).' },
    { type: 'international_aid', color: '#8b5cf6', label: 'International Aid', description: 'Foreign aid and assistance provided to other countries (e.g., Ukraine aid from Global Affairs).' }
  ]

  return (
    <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 z-10 max-w-xs">
      <h3 className="text-sm font-bold text-gray-900 mb-3">Legend</h3>
      
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Entity Types
        </h4>
        <div className="space-y-1.5">
          {entityTypes.map(({ type, color, label, description }) => (
            <div 
              key={type} 
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5"
              onMouseEnter={() => onHover(description)}
              onMouseLeave={() => onHover(null)}
            >
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
          {relationshipTypes.map(({ type, color, label, description }) => (
            <div 
              key={type} 
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5"
              onMouseEnter={() => onHover(description)}
              onMouseLeave={() => onHover(null)}
            >
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
