import { describe, it, expect } from 'vitest'
import { plainSummary } from './plainSummary'

describe('plainSummary', () => {
  it('prefers a curated summary field', () => {
    const entity = {
      type: 'Agency',
      description: 'Responsible for administering tax law.',
      summary: 'Collects taxes and runs benefit programs like the Canada Child Benefit.'
    }
    expect(plainSummary(entity)).toBe('Collects taxes and runs benefit programs like the Canada Child Benefit.')
  })

  it('rewrites "Responsible for" boilerplate into readable phrasing', () => {
    const entity = {
      type: 'Ministry',
      description: "Responsible for ensuring that Canada's justice system is fair, accessible, and efficient."
    }
    expect(plainSummary(entity)).toBe(
      "A federal government department — tasked with ensuring that Canada's justice system is fair, accessible, and efficient."
    )
  })

  it('uses only the first sentence of a multi-sentence description', () => {
    const entity = {
      type: 'Agency',
      description: 'Collects taxes for the federal government. It also administers benefits.'
    }
    expect(plainSummary(entity)).toBe('A federal agency — collects taxes for the federal government.')
  })

  it('strips bracketed editorial notes from the clause', () => {
    const entity = {
      type: 'CrownCorporation',
      status: 'defunct',
      description: 'Crown corporation operating coal terminals. [Sold December 2019.]'
    }
    const summary = plainSummary(entity)
    expect(summary).toContain('No longer exists')
    expect(summary).not.toContain('[')
    expect(summary).toContain('crown corporation operating coal terminals')
  })

  it('flags fictional entities', () => {
    const entity = { type: 'Agency', status: 'fictional', description: 'Manages lakes.' }
    expect(plainSummary(entity)).toContain('does not appear in federal registries')
  })

  it('falls back to the type lead alone when no description exists', () => {
    expect(plainSummary({ type: 'Other' })).toBe('A government body.')
    expect(plainSummary({ type: 'ForeignCountry' })).toBe(
      'Not a government body — a recipient of Canadian aid.'
    )
  })
})
