import { describe, it, expect } from 'vitest'
import entities from '../../data/entities.json'
import relationships from '../../data/relationships.json'
import layout from '../../data/layout.json'
import { RELATIONSHIP_TYPES, ENTITY_TYPES } from '../config/graphTheme'

// Regression tests mirroring pipeline/validate_data.py so `npm test`
// catches the same data errors the Python gate does — in particular the
// Oct-2026 sync bug that minted duplicate records for orgs already in
// the dataset under different ids.

const byId = new Map(entities.map(e => [e.id, e]))

describe('shipped graph data', () => {
  it('has no duplicate entity ids or names', () => {
    const ids = new Set()
    const names = new Set()
    for (const e of entities) {
      expect(ids.has(e.id), `duplicate id '${e.id}'`).toBe(false)
      ids.add(e.id)
      if (e.name) {
        expect(names.has(e.name), `duplicate name '${e.name}'`).toBe(false)
        names.add(e.name)
      }
    }
  })

  it('uses only known entity and relationship types', () => {
    for (const e of entities) {
      expect(ENTITY_TYPES[e.type], `unknown entity type '${e.type}' on ${e.id}`).toBeTruthy()
    }
    for (const r of relationships) {
      expect(RELATIONSHIP_TYPES[r.type], `unknown relationship type '${r.type}'`).toBeTruthy()
    }
  })

  it('every relationship endpoint resolves to an entity', () => {
    for (const r of relationships) {
      expect(byId.has(r.from), `'from' id '${r.from}' not in entities`).toBe(true)
      expect(byId.has(r.to), `'to' id '${r.to}' not in entities`).toBe(true)
    }
  })

  it('no funds edge targets a ForeignCountry (aid uses international_aid)', () => {
    for (const r of relationships) {
      if (r.type !== 'funds') continue
      expect(byId.get(r.to)?.type, `funds edge -> ${r.to}`).not.toBe('ForeignCountry')
    }
  })

  it('amount lives on the primary funding edge only', () => {
    // Primary = sole incoming funds edge, or the parliament edge when
    // several channels exist. Secondary channels (TBS central votes,
    // portfolio routing) must carry null — a copied budget double-counts.
    const incoming = new Map()
    for (const r of relationships) {
      if (r.type !== 'funds') continue
      const list = incoming.get(r.to) || []
      list.push(r)
      incoming.set(r.to, list)
    }
    for (const r of relationships) {
      if (r.type !== 'funds') continue
      const primary = incoming.get(r.to).length === 1 || r.from === 'parliament'
      if (!primary) {
        expect(r.amount ?? null, `secondary edge ${r.from} -> ${r.to} should have amount null`).toBeNull()
      }
    }
  })

  it('non-curated oversees edges are backed by a parent field', () => {
    for (const r of relationships) {
      if (r.type !== 'oversees' || r.curated) continue
      expect(
        byId.get(r.to)?.parent,
        `oversees ${r.from} -> ${r.to} has no parent field and is not marked curated`
      ).toBe(r.from)
    }
  })

  it('layout positions reference existing entities', () => {
    for (const key of Object.keys(layout)) {
      expect(byId.has(key), `layout key '${key}' has no entity`).toBe(true)
    }
  })
})
