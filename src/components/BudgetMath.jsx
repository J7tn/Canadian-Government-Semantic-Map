import { useMemo } from 'react'
import { computeBudgetMath } from '../utils/budgetMath'
import { formatBudget } from '../utils/format'

// Reconciliation ledger below the map: what Parliament approved vs what
// this map can trace, in plain English. Rendered as stacked rows so it
// reads at any screen width.
const LedgerRow = ({ label, amount, note, strong, tone }) => (
  <li
    className={`flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3 ${
      strong ? 'font-semibold' : ''
    } ${tone || ''}`}
  >
    <span className="text-gray-800">
      {label}
      {note && (
        <span className="block text-xs font-normal text-gray-500">{note}</span>
      )}
    </span>
    <span className="tabular-nums text-gray-900">{amount}</span>
  </li>
)

const BudgetMath = ({ entities, relationships }) => {
  const math = useMemo(
    () => computeBudgetMath(entities, relationships),
    [entities, relationships]
  )

  if (entities.length === 0) return null

  const gap = math.estimatesGap
  const gapTone =
    gap > 0
      ? 'bg-amber-50 text-amber-900'
      : gap < 0
        ? 'bg-red-50 text-red-900'
        : 'bg-green-50 text-green-900'
  const gapLabel =
    gap > 0
      ? 'Approved money no organization on this map claims'
      : gap < 0
        ? 'Mapped appropriations exceed the official total (a data error)'
        : 'Unaccounted inside the Estimates'
  const unknownCount =
    math.unknownFundsCount + math.unknownAidCount + math.noBudgetOrgs.length

  return (
    <section
      className="border-t border-gray-200 px-4 sm:px-6 py-8"
      aria-labelledby="budget-math-heading"
    >
      <div className="max-w-6xl mx-auto">
        <h2 id="budget-math-heading" className="text-xl font-bold text-gray-900">
          The Money Math
        </h2>
        <p className="text-sm text-gray-500 mt-1 mb-4">
          Every dollar Parliament approved in the 2024-25 Main Estimates,
          checked against what this map can actually trace — computed live
          from the data.
        </p>

        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white shadow-sm">
          <LedgerRow
            label="Approved by Parliament"
            note="2024-25 Main Estimates, all votes and statutory items"
            amount={formatBudget(math.approved)}
            strong
          />
          <LedgerRow
            label={`Traced to ${math.estimatesOrgCount} organizations on this map`}
            note="Entities flagged inMainEstimates by the data pipeline"
            amount={`−${formatBudget(math.estimatesTracked)}`}
          />
          <LedgerRow
            label={gapLabel}
            note={
              gap === 0
                ? 'Every dollar in the Estimates lands on a mapped organization'
                : undefined
            }
            amount={formatBudget(Math.abs(gap))}
            strong
            tone={gapTone}
          />
          <LedgerRow
            label="Shown on the map but outside the Estimates"
            note={math.outsideOrgs
              .map((o) => `${o.name} (${formatBudget(o.budget)})`)
              .join(', ')}
            amount={`+${formatBudget(math.outsideTotal)}`}
          />
          <LedgerRow
            label="Total spending visible on the map"
            amount={formatBudget(math.totalShown)}
            strong
          />
        </ul>

        {unknownCount > 0 && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <span className="font-semibold">
              Money we still can’t size:
            </span>{' '}
            {math.unknownFundsCount > 0 && (
              <>
                {math.unknownFundsCount} secondary funding channel
                {math.unknownFundsCount === 1 ? '' : 's'} (e.g. Treasury
                Board central votes) with no published per-department
                figure
              </>
            )}
            {math.unknownFundsCount > 0 &&
              (math.unknownAidCount > 0 || math.noBudgetOrgs.length > 0) &&
              '; '}
            {math.unknownAidCount > 0 && (
              <>
                {math.unknownAidCount} aid flow
                {math.unknownAidCount === 1 ? '' : 's'} with no amount
              </>
            )}
            {math.unknownAidCount > 0 && math.noBudgetOrgs.length > 0 && '; '}
            {math.noBudgetOrgs.length > 0 && (
              <>
                {math.noBudgetOrgs.length}{' '}
                {math.noBudgetOrgs.length === 1 ? 'entity' : 'entities'} with
                no budget figure (
                {math.noBudgetOrgs.map((o) => o.name).join(', ')})
              </>
            )}
            .
          </div>
        )}

        <p className="mt-4 text-xs text-gray-500 leading-relaxed">
          The Estimates are what the government <em>asked</em> for — actual
          spending is only settled later in the Public Accounts, and
          departments can draw on supplementary votes mid-year. Outside
          the Estimates, self-funded bodies like the Canada Infrastructure
          Bank spend money Parliament doesn’t vote on line-by-line.
        </p>
      </div>
    </section>
  )
}

export default BudgetMath
