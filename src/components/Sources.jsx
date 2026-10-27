import { useState, useEffect, useRef, useCallback } from 'react'
import { useFocusTrap } from '../hooks/useFocusTrap'

const Sources = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [sources, setSources] = useState([])
  const [status, setStatus] = useState('idle')
  const dialogRef = useRef(null)

  const close = useCallback(() => setIsOpen(false), [])
  // Reopening after a failure retries — 'error' resets to 'idle' so the
  // lazy-fetch effect re-fires.
  const open = useCallback(() => {
    setStatus(prev => (prev === 'error' ? 'idle' : prev))
    setIsOpen(true)
  }, [])

  // Lazy-fetch sources.json on first open — no point requesting it on
  // every page load when most sessions never open the modal.
  useEffect(() => {
    if (!isOpen || status !== 'idle') return
    let cancelled = false
    setStatus('loading')
    fetch(`${import.meta.env.BASE_URL}sources.json`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(data => {
        if (cancelled) return
        setSources(data)
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })
    return () => { cancelled = true }
  }, [isOpen, status])

  // Focus trap + Escape + focus restore. Only active while open.
  useFocusTrap(dialogRef, close, isOpen)

  return (
    <>
      <button
        onClick={open}
        className="bg-white text-gray-700 px-4 py-2 rounded-lg shadow-md hover:bg-gray-50 text-sm font-medium"
      >
        Sources
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={close}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Data sources"
            tabIndex={-1}
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Data Sources</h2>
                <button
                  onClick={close}
                  aria-label="Close data sources"
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <p className="text-sm text-gray-600 mb-4">
                This map is built using publicly available data from official Canadian government sources.
                Each entity in the graph includes a direct link to its official source. The following are the primary sources used:
              </p>

              {status === 'loading' && (
                <p className="text-sm text-gray-500">Loading sources…</p>
              )}
              {status === 'error' && (
                <div className="flex items-center gap-3">
                  <p className="text-sm text-red-600">Failed to load sources.</p>
                  <button
                    onClick={() => setStatus('idle')}
                    className="text-sm text-red-700 underline hover:text-red-900"
                  >
                    Retry
                  </button>
                </div>
              )}

              <div className="space-y-4">
                {sources.map((source) => (
                  <div key={source.url} className="border-l-4 border-red-600 pl-4">
                    <h3 className="font-semibold text-gray-900">{source.name}</h3>
                    {/* Same allowlist the Sidebar applies — non-https URLs
                        render as text, never as a clickable scheme. */}
                    {/^https:/i.test(source.url) ? (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm underline break-all"
                      >
                        {source.url}
                      </a>
                    ) : (
                      <p className="text-sm text-gray-500 break-all">{source.url}</p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">{source.description}</p>
                    <p className="text-xs text-gray-400 mt-1">Last accessed: {source.lastAccessed}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-semibold text-yellow-800 text-sm mb-2">Note on Data Accuracy</h4>
                <p className="text-sm text-yellow-700">
                  This is a simplified representation of the Canadian federal government structure for educational purposes.
                  Budget figures are approximate and may not reflect current fiscal year data.
                  For official and up-to-date information, please refer directly to the government sources listed above.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Sources
