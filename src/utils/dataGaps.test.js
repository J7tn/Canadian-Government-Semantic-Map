import { describe, it, expect } from 'vitest'
import { getEntityGaps, relationshipInfo, collectDataGaps, summarizeGaps } from './dataGaps'

const baseEntity = {
  id: 'test-org',
  name: 'Test Org',
  type: 'Agency',
  parent: 'parliament',
  budget: 1000000,
  budgetVerified: true,
  description: 'x',
  source: 'https://example.ca',
  lastUpdated: '2026-01-01',
  spendingBreakdown: { personnel: 1 }
}

const fundedRel = { from: 'parliament', to: 'test-org', type: 'funds', amount: 1000000 }

describe('getEntityGaps', () => {
  it('returns no gaps for a complete entity', () => {
    expect(getEntityGaps(baseEntity, { hasFundsEdge: true })).toEqual([])
  })

  it('flags a null budget', () => {
    const gaps = getEntityGaps({ ...baseEntity, budget: null }, { hasFundsEdge: true })
    expect(gaps.map(g => g.field)).toContain('budget')
  })

  it('flags an unverified budget', () => {
    const gaps = getEntityGaps({ ...baseEntity, budgetVerified: false }, { hasFundsEdge: true })
    expect(gaps.map(g => g.field)).toContain('budgetVerified')
  })

  it('flags missing spending breakdown and stale lastUpdated', () => {
    const gaps = getEntityGaps(
      { ...baseEntity, spendingBreakdown: undefined, lastUpdated: 'unknown' },
      { hasFundsEdge: true }
    )
    expect(gaps.map(g => g.field)).toEqual(expect.arrayContaining(['spendingBreakdown', 'lastUpdated']))
  })

  it('uses received_aid checks for ForeignCountry', () => {
    const gaps = getEntityGaps(
      { ...baseEntity, type: 'ForeignCountry', budget: null, received_aid: null },
      {}
    )
    expect(gaps.map(g => g.field)).toContain('received_aid')
    expect(gaps.map(g => g.field)).not.toContain('budget')
  })

  it('flags a weak or missing source', () => {
    expect(getEntityGaps({ ...baseEntity, source: 'javascript:alert(1)' }, { hasFundsEdge: true })
      .map(g => g.field)).toContain('source')
    expect(getEntityGaps({ ...baseEntity, source: null }, { hasFundsEdge: true })
      .map(g => g.field)).toContain('source')
  })

  it('reports only the status for defunct/fictional entities', () => {
    const gaps = getEntityGaps(
      { ...baseEntity, status: 'defunct', budget: null, spendingBreakdown: null },
      {}
    )
    expect(gaps).toHaveLength(1)
    expect(gaps[0].field).toBe('status')
  })

  it('exempts parliament from the funding-edge gap', () => {
    const gaps = getEntityGaps({ ...baseEntity, id: 'parliament', budget: null, parent: null }, {})
    expect(gaps.map(g => g.field)).not.toContain('funds')
  })

  it('flags missing funding edge and missing amount', () => {
    expect(getEntityGaps(baseEntity, { hasFundsEdge: false }).map(g => g.field)).toContain('funds')
    expect(getEntityGaps(baseEntity, { hasFundsEdge: true, fundsAmountMissing: true })
      .map(g => g.field)).toContain('funds.amount')
  })
})

describe('relationshipInfo', () => {
  it('detects incoming funds edge with amount', () => {
    expect(relationshipInfo('test-org', [fundedRel])).toEqual({
      hasFundsEdge: true,
      fundsAmountMissing: false
    })
  })

  it('flags edge missing amount', () => {
    expect(relationshipInfo('test-org', [{ ...fundedRel, amount: null }])).toEqual({
      hasFundsEdge: true,
      fundsAmountMissing: true
    })
  })
})

describe('collectDataGaps + summarizeGaps', () => {
  it('returns only entities with gaps, sorted most-gaps-first', () => {
    const entities = [
      baseEntity,
      { ...baseEntity, id: 'sparse', name: 'Sparse', budget: null, spendingBreakdown: null, lastUpdated: 'unknown', parent: null },
      { ...baseEntity, id: 'full', name: 'Full' }
    ]
    const rels = [fundedRel, { from: 'parliament', to: 'full', type: 'funds', amount: 1 }, { from: 'parliament', to: 'sparse', type: 'funds', amount: null }]
    const rows = collectDataGaps(entities, rels)
    expect(rows.map(r => r.entity.id)).toEqual(['sparse'])
    expect(rows[0].gaps.length).toBeGreaterThan(0)
  })

  it('aggregates counts per field', () => {
    const rows = [
      { entity: baseEntity, gaps: [{ field: 'budget', label: 'No budget' }, { field: 'parent', label: 'No parent' }] },
      { entity: baseEntity, gaps: [{ field: 'budget', label: 'No budget' }] }
    ]
    const summary = summarizeGaps(rows)
    expect(summary[0]).toMatchObject({ field: 'budget', count: 2 })
    expect(summary[1]).toMatchObject({ field: 'parent', count: 1 })
  })
})
