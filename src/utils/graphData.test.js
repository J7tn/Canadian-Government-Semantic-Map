import { describe, it, expect } from 'vitest'
import { validateGraphPayload } from './graphData'

const goodEntities = [
  { id: 'a', name: 'Alpha', type: 'Ministry' },
  { id: 'b', name: 'Beta', type: 'Agency' }
]
const goodRels = [{ from: 'a', to: 'b', type: 'funds' }]
const goodLayout = { a: { x: 1, y: 2 }, b: { x: 3, y: 4 } }

describe('validateGraphPayload', () => {
  it('accepts a well-formed payload', () => {
    expect(() => validateGraphPayload(goodEntities, goodRels, goodLayout)).not.toThrow()
    expect(() => validateGraphPayload(goodEntities, goodRels, null)).not.toThrow()
  })

  it('rejects non-array roots', () => {
    expect(() => validateGraphPayload({}, goodRels, null)).toThrow(/entities\.json root/)
    expect(() => validateGraphPayload(goodEntities, 'oops', null)).toThrow(/relationships\.json root/)
  })

  it('rejects a non-object layout', () => {
    expect(() => validateGraphPayload(goodEntities, goodRels, [])).toThrow(/layout\.json root/)
    // null layout is legal — auto-layout fallback
    expect(() => validateGraphPayload(goodEntities, goodRels, undefined)).not.toThrow()
  })

  it('rejects entities missing required fields', () => {
    expect(() => validateGraphPayload([{ name: 'No Id' }], goodRels, null)).toThrow(/missing a string 'id'/)
    expect(() => validateGraphPayload([{ id: 'x' }], goodRels, null)).toThrow(/missing a string 'name'/)
  })

  it('rejects duplicate entity ids (cytoscape would throw on add)', () => {
    const dupes = [
      { id: 'a', name: 'A', type: 'Ministry' },
      { id: 'a', name: 'A2', type: 'Agency' }
    ]
    expect(() => validateGraphPayload(dupes, [], null)).toThrow(/duplicates id 'a'/)
  })

  it('rejects relationships missing endpoint fields', () => {
    expect(() => validateGraphPayload(goodEntities, [{ from: 'a' }], null)).toThrow(/missing a string 'to'/)
    expect(() => validateGraphPayload(goodEntities, [{ from: 'a', to: 'b' }], null)).toThrow(/missing a string 'type'/)
  })
})
