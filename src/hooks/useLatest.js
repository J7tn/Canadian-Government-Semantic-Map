import { useRef, useEffect } from 'react'

// Latest-value ref pattern: lets stable event handlers (bound once, e.g. on
// a Cytoscape instance) always read the current prop without rebinding.
// Assignment happens in an effect — not during render — which is the
// React-legal form of this pattern.
export function useLatest(value) {
  const ref = useRef(value)
  useEffect(() => {
    ref.current = value
  })
  return ref
}
