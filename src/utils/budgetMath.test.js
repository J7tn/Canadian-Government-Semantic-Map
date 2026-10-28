import { describe, it, expect } from 'vitest'
import { computeBudgetMath, MAIN_ESTIMATES_TOTAL } from './budgetMath'

const estimatesEntity = (id, budget) => ({
  id,
  name: id,
  type: 'Ministry',
  budget,
  inMainEstimates: true
})

describe('computeBudgetMath', () => {
  it('reconciles approved total against flagged appropriations', () => {
    const entities = [
      estimatesEntity('a', MAIN_ESTIMATES_TOTAL - 100),
      estimatesEntity('b', 100)
    ]
    const m = computeBudgetMath(entities, [])
    expect(m.approved).toBe(MAIN_ESTIMATES_TOTAL)
    expect(m.estimatesTracked).toBe(MAIN_ESTIMATES_TOTAL)
    expect(m.estimatesOrgCount).toBe(2)
    expect(m.estimatesGap).toBe(0)
  })

  it('surfaces approved money no mapped org claims', () => {
    const entities = [estimatesEntity('a', MAIN_ESTIMATES_TOTAL - 5000)]
    const m = computeBudgetMath(entities, [])
    expect(m.estimatesGap).toBe(5000)
  })

  it('collects non-Estimates budgets as outside money, largest first', () => {
    const entities = [
      { id: 'self', name: 'Self Funded', type: 'Agency', budget: 200 },
      { id: 'stat', name: 'Statutory', type: 'CrownCorporation', budget: 900 },
      estimatesEntity('a', 50),
      { id: 'flat', name: 'No Budget', type: 'Other' }
    ]
    const m = computeBudgetMath(entities, [])
    expect(m.outsideTotal).toBe(1100)
    expect(m.outsideOrgs.map((o) => o.id)).toEqual(['stat', 'self'])
    expect(m.totalShown).toBe(1150)
    expect(m.noBudgetOrgs.map((o) => o.id)).toEqual(['flat'])
  })

  it('excludes defunct and fictional entities from every figure', () => {
    const entities = [
      estimatesEntity('a', 100),
      {
        id: 'dead',
        name: 'Dead',
        type: 'Agency',
        budget: 999,
        status: 'defunct'
      }
    ]
    const rels = [
      { from: 'x', to: 'dead', type: 'funds', amount: null },
      { from: 'x', to: 'a', type: 'funds', amount: null }
    ]
    const m = computeBudgetMath(entities, rels)
    expect(m.totalShown).toBe(100)
    expect(m.outsideTotal).toBe(0)
    expect(m.unknownFundsCount).toBe(1)
  })

  it('counts unknown-size funds and aid flows separately', () => {
    const entities = [estimatesEntity('a', 10), estimatesEntity('b', 20)]
    const rels = [
      { from: 'p', to: 'a', type: 'funds', amount: 10 },
      { from: 't', to: 'a', type: 'funds', amount: null },
      { from: 'p', to: 'ukr', type: 'international_aid', amount: null },
      { from: 'p', to: 'fra', type: 'international_aid', amount: 5 }
    ]
    const m = computeBudgetMath(entities, rels)
    expect(m.unknownFundsCount).toBe(1)
    expect(m.unknownAidCount).toBe(1)
  })
})
