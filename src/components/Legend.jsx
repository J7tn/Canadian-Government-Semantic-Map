import { ENTITY_TYPES, RELATIONSHIP_TYPES } from '../config/graphTheme'

const Legend = ({ onHover }) => {
  const entityTypes = Object.entries(ENTITY_TYPES).map(([type, info]) => ({ type, ...info }))
  const relationshipTypes = Object.entries(RELATIONSHIP_TYPES).map(([type, info]) => ({ type, ...info }))

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
              tabIndex={0}
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 focus:bg-gray-100 rounded px-1 py-0.5 outline-none"
              onMouseEnter={() => onHover(description)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onHover(description)}
              onBlur={() => onHover(null)}
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
          {relationshipTypes.map(({ type, color, width, dashed, label, description }) => (
            <div
              key={type}
              tabIndex={0}
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 focus:bg-gray-100 rounded px-1 py-0.5 outline-none"
              onMouseEnter={() => onHover(description)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onHover(description)}
              onBlur={() => onHover(null)}
            >
              <div className="flex items-center">
                {/* Glyph mirrors the canvas stroke: width + dash from
                    RELATIONSHIP_TYPES so the legend never lies. */}
                <div
                  className="w-8"
                  style={{
                    borderTop: `${width}px ${dashed ? 'dashed' : 'solid'} ${color}`
                  }}
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
