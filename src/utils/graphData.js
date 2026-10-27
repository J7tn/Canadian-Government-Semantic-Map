// Runtime shape checks for the fetched graph payloads. pipeline/validate_data.py
// gates data at build time, but a corrupted deploy, hand-edited file, or stale
// CDN artifact must fail into the error UI — not crash a render and rely on the
// error boundary (which can only offer a reload that fails the same way).
//
// Kept deliberately lightweight: it verifies the shapes the renderer dereferences,
// not the full editorial schema (that's the Python validator's job).

import { RELATIONSHIP_TYPES } from '../config/graphTheme'

function describe(index, collection) {
  return `${collection}[${index}]`
}

export function validateGraphPayload(entities, relationships, layout) {
  const problems = []

  if (!Array.isArray(entities)) {
    problems.push('entities.json root is not an array')
  }
  if (!Array.isArray(relationships)) {
    problems.push('relationships.json root is not an array')
  }
  if (layout != null && (typeof layout !== 'object' || Array.isArray(layout))) {
    problems.push('layout.json root is not an object')
  }

  if (Array.isArray(entities)) {
    const seenIds = new Set()
    entities.forEach((entity, i) => {
      const loc = describe(i, 'entities')
      if (!entity || typeof entity !== 'object') {
        problems.push(`${loc} is not an object`)
        return
      }
      if (typeof entity.id !== 'string' || entity.id.length === 0) {
        problems.push(`${loc} is missing a string 'id'`)
        return // can't dedupe-check or name-check reliably without an id
      }
      if (seenIds.has(entity.id)) {
        // Cytoscape throws on duplicate element ids — catch it here so the
        // failure lands in the error UI, not inside a layout effect.
        problems.push(`${loc} duplicates id '${entity.id}'`)
      }
      seenIds.add(entity.id)
      if (typeof entity.name !== 'string') {
        problems.push(`${loc} ('${entity.id}') is missing a string 'name'`)
      }
      if (typeof entity.type !== 'string') {
        problems.push(`${loc} ('${entity.id}') is missing a string 'type'`)
      }
    })
  }

  if (Array.isArray(relationships)) {
    relationships.forEach((rel, i) => {
      const loc = describe(i, 'relationships')
      if (!rel || typeof rel !== 'object') {
        problems.push(`${loc} is not an object`)
        return
      }
      for (const field of ['from', 'to', 'type']) {
        if (typeof rel[field] !== 'string') {
          problems.push(`${loc} is missing a string '${field}'`)
        }
      }
    })
  }

  if (problems.length > 0) {
    const extra = problems.length > 1 ? ` (+${problems.length - 1} more)` : ''
    throw new Error(`Invalid graph data: ${problems[0]}${extra}`)
  }
}

// Soft lint for anomalies that still render — run after the payload
// passes validateGraphPayload. Dangling refs are dropped by
// buildGraphElements and unknown types render as gray edges: silent
// degradation worth surfacing, but not worth the error UI.
export function warnGraphAnomalies(entities, relationships) {
  if (!Array.isArray(entities) || !Array.isArray(relationships)) return

  const ids = new Set(entities.map(e => e?.id).filter(Boolean))
  const names = new Set()
  const anomalies = []

  entities.forEach((entity, i) => {
    if (entity?.name) {
      if (names.has(entity.name)) {
        anomalies.push(`entities[${i}] duplicates name '${entity.name}'`)
      }
      names.add(entity.name)
    }
  })

  relationships.forEach((rel, i) => {
    if (!rel || typeof rel !== 'object') return
    const loc = `relationships[${i}]`
    for (const field of ['from', 'to']) {
      if (typeof rel[field] === 'string' && !ids.has(rel[field])) {
        anomalies.push(`${loc} '${field}' id '${rel[field]}' has no matching entity (edge dropped)`)
      }
    }
    if (typeof rel.type === 'string' && !RELATIONSHIP_TYPES[rel.type]) {
      anomalies.push(`${loc} unknown relationship type '${rel.type}' (renders as default edge)`)
    }
  })

  anomalies.slice(0, 10).forEach(msg => console.warn(`graph data anomaly: ${msg}`))
  if (anomalies.length > 10) {
    console.warn(`graph data anomalies: +${anomalies.length - 10} more`)
  }
}
