/**
 * Budget reconciliation: compares the money Parliament approved
 * (Main Estimates 2024-25) against the money this map can trace.
 *
 * Entity budgets tagged `inMainEstimates` represent parliamentary
 * appropriations; live entities with a budget but no flag carry
 * self-funded or statutory money shown on the map but outside the
 * Estimates. Funding channels whose draw isn't published keep
 * `amount: null` on their edge and count as unknown flows.
 */

// Official total of the 2024-25 Main Estimates (see data/sources.json).
export const MAIN_ESTIMATES_TOTAL = 449177002277

const isLive = (e) => e.status !== 'defunct' && e.status !== 'fictional'

export function computeBudgetMath(entities, relationships) {
  const live = entities.filter(isLive)
  const liveIds = new Set(live.map((e) => e.id))

  // Appropriations traced to organizations on the map.
  const estimatesOrgs = live.filter((e) => e.inMainEstimates === true)
  const estimatesTracked = estimatesOrgs.reduce(
    (sum, e) => sum + (e.budget || 0),
    0
  )
  // Approved money that no mapped organization claims — the headline
  // "unaccounted" figure. Can go negative if mapped budgets overshoot
  // the official total (a data error worth surfacing, not hiding).
  const estimatesGap = MAIN_ESTIMATES_TOTAL - estimatesTracked

  // Money shown on the map that is NOT a parliamentary appropriation
  // (self-funded revolving funds, statutory payments, own revenue).
  const outsideOrgs = live
    .filter((e) => e.inMainEstimates !== true && (e.budget || 0) > 0)
    .map((e) => ({ id: e.id, name: e.name, budget: e.budget }))
    .sort((a, b) => b.budget - a.budget)
  const outsideTotal = outsideOrgs.reduce((sum, o) => sum + o.budget, 0)

  // Flows that exist but whose size isn't published.
  const unknownFunds = relationships.filter(
    (r) => r.type === 'funds' && liveIds.has(r.to) && r.amount == null
  )
  const unknownAid = relationships.filter(
    (r) => r.type === 'international_aid' && r.amount == null
  )
  const noBudgetOrgs = live
    .filter((e) => e.budget == null)
    .map((e) => ({ id: e.id, name: e.name, type: e.type }))

  const totalShown = live.reduce((sum, e) => sum + (e.budget || 0), 0)

  return {
    approved: MAIN_ESTIMATES_TOTAL,
    estimatesTracked,
    estimatesOrgCount: estimatesOrgs.length,
    estimatesGap,
    outsideTotal,
    outsideOrgs,
    unknownFundsCount: unknownFunds.length,
    unknownAidCount: unknownAid.length,
    noBudgetOrgs,
    totalShown,
  }
}
