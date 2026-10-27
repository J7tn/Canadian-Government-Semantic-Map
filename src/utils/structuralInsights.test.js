import { describe, it, expect } from 'vitest'
import { collectInsights } from './structuralInsights'

const mkEntity = (over = {}) => ({
  id: `e-${Math.random().toString(36).slice(2, 8)}`,
  name: 'X',
  type: 'Agency',
  ...over
})

describe('collectInsights', () => {
  it('detects passthrough organizations', () => {
    const entities = [
      mkEntity({ id: 'a', name: 'Grants-R-Us', spendingBreakdown: { transfer_payments: 0.96 } }),
      mkEntity({ id: 'b', budget: 1 })
    ]
    const insights = collectInsights(entities, [])
    const row = insights.find(i => i.issue === 'Most of government is a pass-through, not a service')
    expect(row.scope).toMatch(/1 organization/)
    expect(row.detail).toMatch(/Grants-R-Us/)
  })

  it('excludes defunct/fictional entities from live analysis but counts them separately', () => {
    const entities = [
      mkEntity({ status: 'defunct', spendingBreakdown: { transfer_payments: 1 } }),
      mkEntity({ id: 'ok' })
    ]
    const insights = collectInsights(entities, [])
    const passthrough = insights.find(i => i.issue === 'Most of government is a pass-through, not a service')
    expect(passthrough).toBeUndefined() // the defunct org isn't counted live
    const dead = insights.find(i => i.issue === 'Organizations that no longer exist are still on the map')
    expect(dead.scope).toBe('1 outdated entries')
  })

  it('reports spending concentration', () => {
    const entities = Array.from({ length: 12 }, (_, i) =>
      mkEntity({ id: `e${i}`, name: `E${i}`, budget: i === 0 ? 100 : 1 })
    )
    const insights = collectInsights(entities, [])
    const row = insights.find(i => i.issue === 'Two departments move more than half the money')
    expect(row.scope).toMatch(/Top 10 of 12 = \d+%/)
  })

  it('counts dual-funded entities', () => {
    const rels = [
      { from: 'parliament', to: 'x', type: 'funds' },
      { from: 'treasury-board', to: 'x', type: 'funds' },
      { from: 'parliament', to: 'y', type: 'funds' }
    ]
    const insights = collectInsights([mkEntity()], rels)
    const row = insights.find(i => i.issue === 'Some departments are paid from two pockets')
    expect(row.scope).toBe('1 organizations with two funders')
  })

  it('flags missing program layer when no Program entities exist', () => {
    const insights = collectInsights([mkEntity()], [])
    expect(insights.some(i => i.issue.includes('what it buys'))).toBe(true)
  })

  it('always emits the revenue-side observation', () => {
    const insights = collectInsights([mkEntity()], [])
    expect(insights.some(i => i.issue === 'The map only shows money going out — never coming in')).toBe(true)
  })
})
