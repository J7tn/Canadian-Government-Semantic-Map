import { useRef, useMemo } from 'react'
import { ENTITY_TYPES, DEFAULT_ENTITY_COLOR } from '../config/graphTheme'
import { formatBudget } from '../utils/format'
import { entityMoney } from '../utils/graphFilter'
import { useFocusTrap } from '../hooks/useFocusTrap'

// Keyboard- and screen-reader-accessible alternative to the canvas graph:
// a flat, grouped list of every entity that can be navigated and selected.
const Directory = ({ entities, onSelect, onClose }) => {
  const dialogRef = useRef(null)

  // Initial focus, Tab cycling, Escape to close, focus restore on close.
  useFocusTrap(dialogRef, onClose)

  const grouped = useMemo(() => {
    const map = new Map()
    for (const entity of entities) {
      const list = map.get(entity.type) || []
      list.push(entity)
      map.set(entity.type, list)
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [entities])

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Entity directory"
        tabIndex={-1}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Entity Directory</h2>
            <button
              onClick={onClose}
              aria-label="Close entity directory"
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {grouped.map(([type, members]) => {
            const info = ENTITY_TYPES[type]
            return (
              <div key={type} className="mb-5">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {info?.label || type} ({members.length})
                </h3>
                <ul className="space-y-1">
                  {members.map(entity => {
                    const money = entityMoney(entity)
                    return (
                      <li key={entity.id}>
                        <button
                          onClick={() => onSelect(entity.id)}
                          className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 text-sm"
                        >
                          <span
                            className="w-3 h-3 rounded-full border border-white flex-shrink-0"
                            style={{ backgroundColor: info?.color || DEFAULT_ENTITY_COLOR }}
                            aria-hidden="true"
                          />
                          <span className="text-gray-900">{entity.name}</span>
                          {money != null && (
                            <span className="text-xs text-gray-500 ml-auto">{formatBudget(money)}</span>
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Directory
