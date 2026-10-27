import { useState, useEffect } from 'react'

// Debounces a fast-moving value (e.g. search keystrokes) so expensive
// downstream work (graph rebuilds) runs once per pause, not per character.
export function useDebouncedValue(value, delay = 150) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
