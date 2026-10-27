import { describe, it, expect } from 'vitest'
import { budgetInsight } from './budgetInsight'

describe('budgetInsight', () => {
  it('returns empty for an entity with no breakdown or context', () => {
    expect(budgetInsight({ type: 'Agency', budget: 1e6 })).toEqual([])
  })

  it('leads with curated budgetContext', () => {
    const insights = budgetInsight({
      type: 'CrownCorporation',
      budgetContext: 'Statutory investment capital.',
      spendingBreakdown: { transfer_payments: 0.8 }
    })
    expect(insights[0]).toBe('Statutory investment capital.')
    expect(insights.length).toBeGreaterThan(1)
  })

  it('explains transfer-dominated budgets as passthrough', () => {
    const insights = budgetInsight({
      type: 'Ministry',
      spendingBreakdown: { transfer_payments: 0.87, personnel: 0.05 }
    })
    expect(insights.join(' ')).toMatch(/87% is transfer payments/)
  })

  it('explains personnel-dominated budgets', () => {
    const insights = budgetInsight({
      type: 'Agency',
      spendingBreakdown: { personnel: 0.72, professional_services: 0.2 }
    })
    expect(insights.join(' ')).toMatch(/Personnel-dominated/)
  })

  it('flags public-debt-dominated figures', () => {
    const insights = budgetInsight({
      type: 'Ministry',
      spendingBreakdown: { public_debt: 0.5 }
    })
    expect(insights.join(' ')).toMatch(/public debt charges/)
  })

  it('notes capital-heavy non-transfer budgets', () => {
    const insights = budgetInsight({
      type: 'Agency',
      spendingBreakdown: { capital: 0.15, personnel: 0.4 }
    })
    expect(insights.join(' ')).toMatch(/capital-heavy/)
  })

  it('gives ForeignCountry entities an aid note', () => {
    const insights = budgetInsight({ type: 'ForeignCountry', received_aid: 1e9 })
    expect(insights.join(' ')).toMatch(/international assistance/)
  })
})
