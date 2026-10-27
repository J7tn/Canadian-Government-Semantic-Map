// The "money" figure for an entity. ForeignCountry entities carry
// received_aid rather than budget, so both are treated as the
// monetary magnitude for filtering and node sizing.
export function entityMoney(entity) {
  if (typeof entity.budget === 'number') return entity.budget
  if (typeof entity.received_aid === 'number') return entity.received_aid
  return null
}

// Single search predicate shared by SearchBar suggestions and graph
// filtering — they must agree, or an alias match would suggest an entity
// the graph is simultaneously hiding. Matches name and aliases.
export function matchesQuery(entity, query) {
  if (!query) return true
  const lowered = query.toLowerCase()
  if (entity.name && entity.name.toLowerCase().includes(lowered)) return true
  return Array.isArray(entity.aliases) && entity.aliases.some(
    alias => typeof alias === 'string' && alias.toLowerCase().includes(lowered)
  )
}

export function passesFilters(entity, filters, searchQuery) {
  if (filters.type !== 'all' && entity.type !== filters.type) return false
  if (filters.budgetThreshold > 0) {
    const money = entityMoney(entity)
    // Entities with no monetary figure cannot satisfy a threshold.
    if (money == null || money < filters.budgetThreshold) return false
  }
  return matchesQuery(entity, searchQuery)
}

// Builds the Cytoscape elements array for the current filter state.
// Edge ids are JSON-encoded [from, to, type] tuples so ids containing
// hyphens can never collide (e.g. ('a-b','c') vs ('a','b-c')).
export function buildGraphElements(entities, relationships, filters, searchQuery) {
  const visible = entities.filter(entity => passesFilters(entity, filters, searchQuery))
  const visibleIds = new Set(visible.map(entity => entity.id))

  const nodes = visible.map(entity => ({
    data: {
      id: entity.id,
      label: entity.name,
      type: entity.type,
      money: entityMoney(entity),
      description: entity.description
    }
  }))

  const edges = relationships
    .filter(rel => visibleIds.has(rel.from) && visibleIds.has(rel.to))
    .map(rel => ({
      data: {
        id: JSON.stringify([rel.from, rel.to, rel.type]),
        source: rel.from,
        target: rel.to,
        type: rel.type
      }
    }))

  return [...nodes, ...edges]
}

// Incremental update for an existing Cytoscape instance: removes elements
// that left the view, adds ones that entered, and leaves everything in
// between untouched (so hover state and in-flight drags survive a filter
// change). `cy` is only used for element lookups — pure given a cytoscape
// collection API, and easy to stub in tests.
export function diffGraphElements(cy, entities, relationships, filters, searchQuery, positions = null) {
  const wanted = buildGraphElements(entities, relationships, filters, searchQuery)
  const wantedIds = new Set(wanted.map(el => el.data.id))
  cy.elements().filter(el => !wantedIds.has(el.id())).remove()
  const incoming = wanted.filter(el => cy.getElementById(el.data.id).length === 0)
  if (positions) {
    // Give re-entering nodes their saved position up front — otherwise
    // they'd render one frame at the origin before the position pass.
    for (const el of incoming) {
      const p = positions[el.data.id]
      if (p) el.position = { x: p.x, y: p.y }
    }
  }
  cy.add(incoming)
}
