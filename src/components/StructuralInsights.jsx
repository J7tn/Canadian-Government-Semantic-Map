import { useMemo } from 'react'
import { collectInsights } from '../utils/structuralInsights'

const SEVERITY_STYLES = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-gray-100 text-gray-600'
}

const StructuralInsights = ({ entities, relationships }) => {
  const insights = useMemo(
    () => collectInsights(entities, relationships),
    [entities, relationships]
  )

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <h2 className="text-xl font-bold text-gray-900">
        Structural Observations
      </h2>
      <p className="text-sm text-gray-500 mt-1 mb-4">
        Things this data reveals about how the federal government is actually put together — written in plain English, computed live from the numbers.
      </p>
      {/* Stacked cards on small screens where a 5-column table is unreadable */}
      <div className="space-y-4 md:hidden">
        {insights.map((insight) => (
          <article
            key={insight.issue}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium text-gray-900">{insight.issue}</h3>
              <span
                className={`inline-block flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${SEVERITY_STYLES[insight.severity] || SEVERITY_STYLES.low}`}
              >
                {insight.severity}
              </span>
            </div>
            <p className="text-xs text-gray-500">{insight.scope}</p>
            <p className="text-sm text-gray-700 leading-relaxed">{insight.detail}</p>
            <p className="text-sm text-gray-700 leading-relaxed rounded bg-blue-50/40 p-2">
              {insight.impact}
            </p>
          </article>
        ))}
      </div>

      <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Severity</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Issue</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Scope</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Analysis</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">What it means for you</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {insights.map((insight) => (
              <tr key={insight.issue} className="align-top">
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${SEVERITY_STYLES[insight.severity] || SEVERITY_STYLES.low}`}
                  >
                    {insight.severity}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-gray-900 min-w-40">
                  {insight.issue}
                </td>
                <td className="px-4 py-3 text-gray-600 min-w-28">
                  {insight.scope}
                </td>
                <td className="px-4 py-3 text-gray-700 leading-relaxed">
                  {insight.detail}
                </td>
                <td className="px-4 py-3 text-gray-700 leading-relaxed bg-blue-50/40">
                  {insight.impact}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default StructuralInsights
