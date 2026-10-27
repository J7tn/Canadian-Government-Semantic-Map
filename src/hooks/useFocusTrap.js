import { useEffect } from 'react'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(', ')

// Modal keyboard behavior: focuses the dialog on mount, keeps Tab cycling
// inside it, closes on Escape, and restores focus to the previously focused
// element on cleanup. `onClose` must be a stable callback (useCallback) —
// otherwise the effect re-runs and focus restore fires mid-session.
// `enabled` lets callers keep the ref stable while gating activation.
export function useFocusTrap(dialogRef, onClose, enabled = true) {
  useEffect(() => {
    const dialog = dialogRef.current
    if (!enabled || !dialog) return undefined

    const previouslyFocused = document.activeElement
    dialog.focus()

    const onKey = (e) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const items = [...dialog.querySelectorAll(FOCUSABLE)]
      if (items.length === 0) {
        e.preventDefault()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      // The dialog itself (tabIndex -1) holds initial focus — route the
      // first Tab press to the correct end based on direction.
      if (!e.shiftKey && (active === last || active === dialog)) {
        e.preventDefault()
        first.focus()
      } else if (e.shiftKey && (active === first || active === dialog)) {
        e.preventDefault()
        last.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus()
      }
    }
  }, [dialogRef, onClose, enabled])
}
