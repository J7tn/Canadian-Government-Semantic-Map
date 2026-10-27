import {
  ENTITY_TYPES,
  DEFAULT_ENTITY_BADGE,
  RELATIONSHIP_TYPES,
  SPENDING_CATEGORIES
} from '../config/graphTheme'
import { formatBudget, formatPercent } from '../utils/format'
import { entityMoney } from '../utils/graphFilter'
import { budgetInsight } from '../utils/budgetInsight'
import { plainSummary } from '../utils/plainSummary'

// One edge row: direction arrow, type label, resolved counterpart name,
// and the amount when the edge carries one (primary funding edges only).
const EdgeRow = ({ rel, entity, nameOf }) => {
  const outgoing = rel.from === entity.id
  const otherId = outgoing ? rel.to : rel.from
  const info = RELATIONSHIP_TYPES[rel.type]
  return (
    <li className="flex items-baseline gap-1.5 text-sm">
      <span
        aria-hidden="true"
        className="inline-block w-2.5 h-0.5 flex-shrink-0 translate-y-[-3px]"
        style={{
          borderTop: `2px ${info?.dashed ? 'dashed' : 'solid'} ${info?.color || '#cbd5e1'}`
        }}
      />
      <span className="text-gray-700">
        {outgoing ? '→ ' : '← '}
        <span className="font-medium">{info?.label || rel.type}</span>{' '}
        {nameOf(otherId)}
        {rel.type === 'funds' && rel.amount != null && (
          <span className="text-gray-500"> ({formatBudget(rel.amount)})</span>
        )}
      </span>
    </li>
  )
}

const Sidebar = ({ entity, onClose, entities = [], relationships = [] }) => {
  if (!entity) return null

  const typeInfo = ENTITY_TYPES[entity.type]
  const isForeignCountry = entity.type === 'ForeignCountry'

  const nameOf = (id) => entities.find(e => e.id === id)?.name || id
  const edges = relationships.filter(r => r.from === entity.id || r.to === entity.id)
  const parentEntity = entity.parent
    ? entities.find(e => e.id === entity.parent)
    : null

  const breakdownEntries = entity.spendingBreakdown
    ? Object.entries(entity.spendingBreakdown)
    : []
  const accounted = breakdownEntries.reduce((sum, [, value]) => sum + value, 0)
  const remainder = 1 - accounted
  const money = entityMoney(entity)
  const insights = budgetInsight(entity)
  const summary = plainSummary(entity)

  return (
    <div
      role="complementary"
      aria-label="Entity details"
      className="fixed inset-0 z-40 md:static md:z-auto md:w-96 md:flex-shrink-0 bg-white border-l border-gray-200 overflow-y-auto shadow-lg"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">{entity.name}</h2>
          <button
            onClick={onClose}
            aria-label="Close entity details"
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${typeInfo?.badge || DEFAULT_ENTITY_BADGE}`}>
              {typeInfo?.label || entity.type}
            </span>
          </div>

          {/* Plain-language lead — jargon-free reading of type +
              first description sentence; the formal Description below
              remains the verbatim mandate text. */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
              What it does
            </h3>
            <p className="text-gray-800 text-sm leading-relaxed">{summary}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Description
            </h3>
            <p className="text-gray-700 text-sm leading-relaxed">{entity.description}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
              {isForeignCountry ? 'Received Aid' : 'Budget'}
            </h3>
            {isForeignCountry ? (
              entity.aidVerified === false ? (
                <>
                  <p className="text-gray-900 font-semibold text-lg">Unverified</p>
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
                  <p className="text-gray-900 font-semibold text-lg">Unverified</p>
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
            {insights.length > 0 && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <h4 className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">
                  Why this number
                </h4>
                <ul className="space-y-1">
                  {insights.map((insight, i) => (
                    <li key={i} className="text-xs text-blue-900 leading-relaxed">
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {entity.parent && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Parent Entity
              </h3>
              <p className="text-gray-700 text-sm">
                {parentEntity?.name || entity.parent}
              </p>
            </div>
          )}

          {edges.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Relationships
              </h3>
              <ul className="space-y-1">
                {edges.map(rel => (
                  <EdgeRow
                    key={`${rel.from}-${rel.to}-${rel.type}`}
                    rel={rel}
                    entity={entity}
                    nameOf={nameOf}
                  />
                ))}
              </ul>
            </div>
          )}

          {entity.source && /^https:/i.test(entity.source) && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Source
              </h3>
              <a
                href={entity.source}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm underline break-all"
              >
                {entity.source}
              </a>
              {entity.sourceParsedDate && (
                <p className="text-xs text-gray-500 mt-1">
                  Parsed: {entity.sourceParsedDate}
                </p>
              )}
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Last Updated
            </h3>
            <p className="text-gray-700 text-sm">{entity.lastUpdated}</p>
          </div>

          {breakdownEntries.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Spending Breakdown
              </h3>
              <div className="space-y-2">
                {breakdownEntries.map(([category, percentage]) => {
                  const meta = SPENDING_CATEGORIES[category]
                  const amount = money ? money * percentage : 0
                  return (
                    <div key={category}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-600">{meta?.label || category}</span>
                        <span className="text-xs font-medium text-gray-900">
                          {formatPercent(percentage)}% ({formatBudget(amount)})
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`${meta?.color || 'bg-gray-500'} h-2 rounded-full transition-all duration-300`}
                          style={{ width: `${Math.min(percentage, 1) * 100}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
                {remainder > 0.005 && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-600">Uncategorized</span>
                      <span className="text-xs font-medium text-gray-900">
                        {formatPercent(remainder)}% ({formatBudget(money ? money * remainder : 0)})
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gray-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(remainder, 1) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Sidebar
