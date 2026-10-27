import { describe, it, expect } from 'vitest'
import { formatBudget, formatPercent } from './format'

describe('formatBudget', () => {
  it('returns N/A only for missing values', () => {
    expect(formatBudget(null)).toBe('N/A')
    expect(formatBudget(undefined)).toBe('N/A')
  })

  it('formats real amounts in CAD', () => {
    expect(formatBudget(9344293029)).toContain('9,344,293,029')
    expect(formatBudget(9344293029)).toContain('$')
  })

  it('formats zero as an amount, not N/A', () => {
    expect(formatBudget(0)).toContain('0')
    expect(formatBudget(0)).not.toBe('N/A')
  })
})

describe('formatPercent', () => {
  it('uses 2 decimals below 1%', () => {
    expect(formatPercent(0.0012)).toBe('0.12')
  })

  it('uses 1 decimal below 10%', () => {
    expect(formatPercent(0.035)).toBe('3.5')
  })

  it('uses no decimals at 10%+', () => {
    expect(formatPercent(0.546)).toBe('55')
  })
})
