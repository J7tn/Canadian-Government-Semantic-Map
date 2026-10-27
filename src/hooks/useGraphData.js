import { useState, useEffect, useCallback, useRef } from 'react'
import { validateGraphPayload } from '../utils/graphData'

const BASE = import.meta.env.BASE_URL
const FETCH_TIMEOUT_MS = 15000

async function fetchJson(path) {
  const res = await fetch(`${BASE}${path}`, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
  })
  if (!res.ok) {
    throw new Error(`Failed to load ${path} (HTTP ${res.status})`)
  }
  return res.json()
}

// Loads entities.json + relationships.json (required) and layout.json
// (optional — falls back to null so the graph can use auto-layout).
// Exposes retry() so the error UI can recover without a full reload.
export function useGraphData() {
  const [state, setState] = useState({
    status: 'loading',
    entities: [],
    relationships: [],
    layout: null,
    error: null
  })
  const attemptRef = useRef(0)

  const load = useCallback(async () => {
    const attempt = ++attemptRef.current
    setState(prev => ({ ...prev, status: 'loading', error: null }))
    try {
      const [entities, relationships] = await Promise.all([
        fetchJson('entities.json'),
        fetchJson('relationships.json')
      ])
      let layout = null
      try {
        layout = await fetchJson('layout.json')
      } catch {
        // Positions are optional — auto-layout covers their absence.
      }
      if (attempt !== attemptRef.current) return
      try {
        validateGraphPayload(entities, relationships, layout)
      } catch (validationError) {
        // A malformed layout is degradable — bad entities/relationships are not.
        if (layout != null) {
          try {
            validateGraphPayload(entities, relationships, null)
            console.warn(validationError.message, '— ignoring layout.json')
            layout = null
          } catch {
            throw validationError
          }
        } else {
          throw validationError
        }
      }
      setState({ status: 'ready', entities, relationships, layout, error: null })
    } catch (err) {
      if (attempt !== attemptRef.current) return
      setState(prev => ({
        ...prev,
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown error loading graph data'
      }))
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { ...state, retry: load }
}
