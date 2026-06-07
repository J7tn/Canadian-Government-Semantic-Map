import React, { useState, useEffect } from 'react'

const Sources = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [sources, setSources] = useState([])

  useEffect(() => {
    fetch('/data/sources.json')
      .then(res => res.json())
      .then(data => setSources(data))
      .catch(err => console.error('Error loading sources:', err))
  }, [])

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-white text-gray-700 px-4 py-2 rounded-lg shadow-md hover:bg-gray-50 text-sm font-medium"
      >
        Sources
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Data Sources</h2>
                <button
                  onClick={() => setIsOpen(false)}
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

              <div className="space-y-4">
                {sources.map((source, index) => (
                  <div key={index} className="border-l-4 border-red-600 pl-4">
                    <h3 className="font-semibold text-gray-900">{source.name}</h3>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm underline"
                    >
                      {source.url}
                    </a>
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
