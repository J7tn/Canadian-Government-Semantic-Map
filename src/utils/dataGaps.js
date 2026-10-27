// Derives per-entity "data gap" records for the Data Gaps table.
// A gap is a field the schema supports but the data does not fill —
// kept in sync with the checks in pipeline/validate_data.py.

const HTTPS_SOURCE = /^https:/i

// Entities that legitimately carry no funding edge.
const FUNDING_EXEMPT = new Set(['parliament'])

/**
 * @param {object} entity
 * @param {{hasFundsEdge: boolean, fundsAmountMissing: boolean}} relInfo
 * @returns {Array<{field: string, label: string, detail: string}>}
 */
export function getEntityGaps(entity, relInfo = {}) {
  // Defunct/fictional entities aren't 'missing data' — they're a status
  // problem. Report the status, not per-field gaps.
  if (entity.status === 'defunct' || entity.status === 'fictional') {
    return [{
      field: 'status',
      label: entity.status === 'fictional' ? 'Fabricated entity' : 'Defunct entity',
      detail: 'no current data exists — see description'
    }]
  }

  const gaps = []

  if (entity.type === 'ForeignCountry') {
    if (entity.received_aid == null) {
      gaps.push({ field: 'received_aid', label: 'No aid figure', detail: 'received_aid is null' })
    }
    if (entity.aidVerified === false) {
      gaps.push({ field: 'aidVerified', label: 'Aid unverified', detail: 'figure lacks an official source' })
    }
  } else {
    if (entity.budget == null) {
      gaps.push({ field: 'budget', label: 'No budget', detail: 'not in Main Estimates (self-funded or appropriated via a parent)' })
    } else if (entity.budgetVerified === false) {
      gaps.push({ field: 'budgetVerified', label: 'Budget unverified', detail: 'figure lacks an official source' })
    }
  }

  if (!entity.parent) {
    gaps.push({ field: 'parent', label: 'No parent', detail: 'no hierarchy link' })
  }

  if (!entity.source || !HTTPS_SOURCE.test(entity.source)) {
    gaps.push({ field: 'source', label: 'Weak source', detail: 'missing or non-HTTPS source URL' })
  }

  if (!entity.lastUpdated || entity.lastUpdated === 'unknown') {
    gaps.push({ field: 'lastUpdated', label: 'Never verified', detail: "lastUpdated is 'unknown'" })
  }

  if (!entity.spendingBreakdown) {
    gaps.push({ field: 'spendingBreakdown', label: 'No spending breakdown', detail: 'standard-object split not extracted' })
  }

  if (entity.type !== 'ForeignCountry' && !FUNDING_EXEMPT.has(entity.id)) {
    if (!relInfo.hasFundsEdge) {
      gaps.push({ field: 'funds', label: 'No funding edge', detail: 'no incoming funds relationship' })
    } else if (relInfo.fundsAmountMissing) {
      gaps.push({ field: 'funds.amount', label: 'Funding amount unknown', detail: 'funds edge has no amount' })
    }
  }

  return gaps
}

/**
 * Builds the relationship context for an entity: does it have an incoming
 * funds edge, and is that edge missing its amount?
 */
export function relationshipInfo(entityId, relationships) {
  const incoming = relationships.filter(r => r.type === 'funds' && r.to === entityId)
  return {
    hasFundsEdge: incoming.length > 0,
    fundsAmountMissing: incoming.length > 0 && incoming.every(r => r.amount == null)
  }
}

/**
 * @returns {Array<{entity: object, gaps: Array}>} entities with ≥1 gap,
 * sorted most-gaps-first then alphabetically.
 */
export function collectDataGaps(entities, relationships) {
  return entities
    .map(entity => ({
      entity,
      gaps: getEntityGaps(entity, relationshipInfo(entity.id, relationships))
    }))
    .filter(row => row.gaps.length > 0)
    .sort((a, b) => b.gaps.length - a.gaps.length || a.entity.name.localeCompare(b.entity.name))
}

/**
 * Aggregates gap counts by field for the summary chips.
 * @returns {Array<{field: string, label: string, count: number}>}
 */
export function summarizeGaps(gapRows) {
  const byField = new Map()
  for (const row of gapRows) {
    for (const gap of row.gaps) {
      const entry = byField.get(gap.field) || { field: gap.field, label: gap.label, count: 0 }
      entry.count++
      byField.set(gap.field, entry)
    }
  }
  return [...byField.values()].sort((a, b) => b.count - a.count)
}
