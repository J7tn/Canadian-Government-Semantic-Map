import { describe, it, expect } from 'vitest'
import { entityMoney, passesFilters, matchesQuery, buildGraphElements, diffGraphElements } from './graphFilter'

const entities = [
  { id: 'a', name: 'Alpha Ministry', type: 'Ministry', budget: 500e6 },
  { id: 'b', name: 'Beta Agency', type: 'Agency', budget: null },
  { id: 'c', name: 'Gamma Country', type: 'ForeignCountry', received_aid: 2e9 },
  { id: 'tbs', name: 'Treasury Board Secretariat', type: 'Agency', budget: 9e9, aliases: ['TBS', 'Treasury Board'] }
]

const relationships = [
  { from: 'a', to: 'b', type: 'funds' },
  { from: 'b', to: 'c', type: 'international_aid' },
  { from: 'a', to: 'ghost', type: 'reports_to' }
]

const noFilters = { type: 'all', budgetThreshold: 0 }

describe('entityMoney', () => {
  it('prefers budget', () => {
    expect(entityMoney(entities[0])).toBe(500e6)
  })

  it('falls back to received_aid for foreign countries', () => {
    expect(entityMoney(entities[2])).toBe(2e9)
  })

  it('returns null when neither exists', () => {
    expect(entityMoney(entities[1])).toBeNull()
  })
})

describe('passesFilters', () => {
  it('filters by type', () => {
    expect(passesFilters(entities[0], { type: 'Ministry', budgetThreshold: 0 }, '')).toBe(true)
    expect(passesFilters(entities[1], { type: 'Ministry', budgetThreshold: 0 }, '')).toBe(false)
  })

  it('budget threshold applies to received_aid for foreign countries', () => {
    const filters = { type: 'all', budgetThreshold: 1e9 }
    expect(passesFilters(entities[2], filters, '')).toBe(true)
    expect(passesFilters(entities[0], filters, '')).toBe(false)
  })

  it('entities with no monetary figure fail a positive threshold', () => {
    expect(passesFilters(entities[1], { type: 'all', budgetThreshold: 1 }, '')).toBe(false)
    expect(passesFilters(entities[1], { type: 'all', budgetThreshold: 0 }, '')).toBe(true)
  })

  it('search matches name case-insensitively', () => {
    expect(passesFilters(entities[0], noFilters, 'alpha')).toBe(true)
    expect(passesFilters(entities[0], noFilters, 'zzz')).toBe(false)
  })
})

describe('buildGraphElements', () => {
  it('builds nodes for all visible entities', () => {
    const elements = buildGraphElements(entities, relationships, noFilters, '')
    expect(elements.filter(e => !e.data.source)).toHaveLength(4)
  })

  it('drops edges to entities not in the graph', () => {
    const elements = buildGraphElements(entities, relationships, noFilters, '')
    const edges = elements.filter(e => e.data.source)
    expect(edges).toHaveLength(2)
    expect(edges.every(e => e.data.target !== 'ghost')).toBe(true)
  })

  it('drops edges when an endpoint is filtered out', () => {
    const elements = buildGraphElements(
      entities, relationships, { type: 'Ministry', budgetThreshold: 0 }, ''
    )
    expect(elements.filter(e => e.data.source)).toHaveLength(0)
  })

  it('hides edges whose type is in hiddenRelTypes', () => {
    const filters = { ...noFilters, hiddenRelTypes: new Set(['funds']) }
    const edges = buildGraphElements(entities, relationships, filters, '')
      .filter(e => e.data.source)
    expect(edges).toHaveLength(1)
    expect(edges[0].data.type).toBe('international_aid')
  })

  it('keeps every edge when hiddenRelTypes is empty or absent', () => {
    expect(
      buildGraphElements(entities, relationships, noFilters, '')
        .filter(e => e.data.source)
    ).toHaveLength(2)
    const empty = { ...noFilters, hiddenRelTypes: new Set() }
    expect(
      buildGraphElements(entities, relationships, empty, '')
        .filter(e => e.data.source)
    ).toHaveLength(2)
  })

  it('produces unique edge ids even with hyphenated entity ids', () => {
    const tricky = [
      { id: 'a-b', name: 'AB', type: 'Other' },
      { id: 'c', name: 'C', type: 'Other' },
      { id: 'a', name: 'A', type: 'Other' },
      { id: 'b-c', name: 'BC', type: 'Other' }
    ]
    const rels = [
      { from: 'a-b', to: 'c', type: 'funds' },
      { from: 'a', to: 'b-c', type: 'funds' }
    ]
    const edges = buildGraphElements(tricky, rels, noFilters, '').filter(e => e.data.source)
    const ids = edges.map(e => e.data.id)
    expect(new Set(ids).size).toBe(2)
  })
})

describe('matchesQuery', () => {
  const entity = entities[3] // Treasury Board Secretariat, aliases TBS / Treasury Board

  it('matches on name case-insensitively', () => {
    expect(matchesQuery(entity, 'treasury')).toBe(true)
    expect(matchesQuery(entity, 'SECRETARIAT')).toBe(true)
  })

  it('matches on aliases', () => {
    expect(matchesQuery(entity, 'tbs')).toBe(true)
  })

  it('passesFilters agrees — an alias-matched entity is not filtered out', () => {
    expect(passesFilters(entity, noFilters, 'tbs')).toBe(true)
  })

  it('rejects non-matches and tolerates empty query', () => {
    expect(matchesQuery(entity, 'zzz')).toBe(false)
    expect(matchesQuery(entity, '')).toBe(true)
  })
})

describe('diffGraphElements', () => {
  // Minimal cytoscape stub: id-keyed element store with the methods the
  // diff relies on (elements/getElementById/remove/add).
  function makeCyStub(initialElements) {
    const store = new Map(initialElements.map(el => [el.data.id, el]))
    const wrap = (el) => ({ id: () => el.data.id, data: el.data })
    return {
      store,
      elements: () => ({
        filter: (fn) => {
          const matched = [...store.values()].filter(el => fn(wrap(el)))
          return { remove: () => matched.forEach(el => store.delete(el.data.id)) }
        }
      }),
      getElementById: (id) => (store.has(id) ? [wrap(store.get(id))] : []),
      add: (els) => els.forEach(el => store.set(el.data.id, el))
    }
  }

  it('adds missing elements and removes filtered-out ones', () => {
    const initial = buildGraphElements(entities, relationships, noFilters, '')
    const cy = makeCyStub(initial)

    // Filter down to Ministry only — nodes b, c, tbs and all edges leave.
    diffGraphElements(cy, entities, relationships, { type: 'Ministry', budgetThreshold: 0 }, '')
    expect([...cy.store.keys()]).toEqual(['a'])

    // Widen again — nodes and edges come back.
    diffGraphElements(cy, entities, relationships, noFilters, '')
    expect(cy.store.size).toBe(initial.length)
  })

  it('leaves surviving elements untouched (identity preserved)', () => {
    const initial = buildGraphElements(entities, relationships, noFilters, '')
    const cy = makeCyStub(initial)
    const nodeA = cy.store.get('a')

    diffGraphElements(cy, entities, relationships, noFilters, 'alpha')
    expect(cy.store.get('a')).toBe(nodeA) // same object — not re-added
  })
})
