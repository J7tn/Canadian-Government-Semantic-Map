import { useMemo } from 'react'
import { ENTITY_TYPES, DEFAULT_ENTITY_COLOR, DEFAULT_ENTITY_BADGE } from '../config/graphTheme'
import { collectDataGaps, summarizeGaps } from '../utils/dataGaps'

// Transparency table rendered below the graph: every entity with at
// least one missing/unverified field, with what exactly is missing.
const DataGaps = ({ entities, relationships, onSelect }) => {
  const rows = useMemo(
    () => collectDataGaps(entities, relationships),
    [entities, relationships]
  )
  const summary = useMemo(() => summarizeGaps(rows), [rows])

  if (entities.length === 0) return null

  return (
    <section className="border-t border-gray-200 bg-gray-50 px-6 py-6" aria-labelledby="data-gaps-heading">
      <div className="max-w-7xl mx-auto">
        <h2 id="data-gaps-heading" className="text-lg font-bold text-gray-900">
          Data Gaps
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {rows.length} of {entities.length} entities have missing or unverified
          data. Click a row to inspect the entity.
        </p>

        <div className="flex flex-wrap gap-2 mt-3" aria-label="Gap summary by field">
          {summary.map(({ field, label, count }) => (
            <span
              key={field}
              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-50 border border-amber-200 text-xs text-amber-800"
            >
              {label}
              <span className="font-semibold">{count}</span>
            </span>
          ))}
        </div>

        <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-100 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-2" scope="col">Entity</th>
                <th className="px-4 py-2" scope="col">Type</th>
                <th className="px-4 py-2" scope="col">Missing data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map(({ entity, gaps }) => {
                const typeInfo = ENTITY_TYPES[entity.type]
                return (
                  <tr
                    key={entity.id}
                    onClick={() => onSelect?.(entity.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onSelect?.(entity.id)
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    className="hover:bg-gray-50 focus:bg-gray-100 cursor-pointer outline-none"
                  >
                    <td className="px-4 py-2 text-gray-900 font-medium">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full mr-2"
                        style={{ backgroundColor: typeInfo?.color || DEFAULT_ENTITY_COLOR }}
                        aria-hidden="true"
                      />
                      {entity.name}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${typeInfo?.badge || DEFAULT_ENTITY_BADGE}`}>
                        {typeInfo?.label || entity.type}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <ul className="space-y-0.5">
                        {gaps.map(gap => (
                          <li key={gap.field} className="text-xs">
                            <span className="font-medium text-gray-800">{gap.label}</span>
                            <span className="text-gray-500"> — {gap.detail}</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export default DataGaps
