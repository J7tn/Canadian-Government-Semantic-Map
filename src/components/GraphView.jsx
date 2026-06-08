import React, { useEffect, useRef } from 'react'
import cytoscape from 'cytoscape'

const GraphView = ({ entities, relationships, onNodeClick, searchQuery, filters }) => {
  const containerRef = useRef(null)
  const cyRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    const typeColors = {
      Ministry: '#dc2626',
      Agency: '#2563eb',
      CrownCorporation: '#16a34a',
      Program: '#9333ea',
      Other: '#6b7280',
      ForeignCountry: '#f97316'
    }

    const filteredEntities = entities.filter(entity => {
      if (filters.type !== 'all' && entity.type !== filters.type) return false
      if (entity.budget && entity.budget < filters.budgetThreshold) return false
      if (searchQuery && !entity.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })

    const entityIds = new Set(filteredEntities.map(e => e.id))
    const filteredRelationships = relationships.filter(rel => 
      entityIds.has(rel.from) && entityIds.has(rel.to)
    )

    const elements = [
      ...filteredEntities.map(entity => ({
        data: {
          id: entity.id,
          label: entity.name,
          type: entity.type,
          budget: entity.budget,
          description: entity.description
        }
      })),
      ...filteredRelationships.map(rel => ({
        data: {
          id: `${rel.from}-${rel.to}-${rel.type}`,
          source: rel.from,
          target: rel.to,
          type: rel.type
        }
      }))
    ]

    if (cyRef.current) {
      cyRef.current.destroy()
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': (ele) => typeColors[ele.data('type')] || '#6b7280',
            'label': 'data(label)',
            'font-size': '12px',
            'text-valign': 'center',
            'text-halign': 'center',
            'width': (ele) => {
              const budget = ele.data('budget')
              if (!budget) return 30
              const size = Math.log10(budget) * 10
              return Math.max(30, Math.min(80, size))
            },
            'height': (ele) => {
              const budget = ele.data('budget')
              if (!budget) return 30
              const size = Math.log10(budget) * 10
              return Math.max(30, Math.min(80, size))
            },
            'border-width': 2,
            'border-color': '#ffffff',
            'color': '#ffffff',
            'text-outline-color': '#000000',
            'text-outline-width': 2
          }
        },
        {
          selector: 'edge[type="reports_to"]',
          style: {
            'width': 2,
            'line-color': '#94a3b8',
            'target-arrow-color': '#94a3b8',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'control-point-step-size': 50
          }
        },
        {
          selector: 'edge[type="oversees"]',
          style: {
            'width': 2,
            'line-color': '#f59e0b',
            'target-arrow-color': '#f59e0b',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'control-point-step-size': 25
          }
        },
        {
          selector: 'edge[type="funds"]',
          style: {
            'width': 3,
            'line-color': '#16a34a',
            'target-arrow-color': '#16a34a',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'control-point-step-size': 50
          }
        },
        {
          selector: 'edge[type="international_aid"]',
          style: {
            'width': 4,
            'line-color': '#8b5cf6',
            'target-arrow-color': '#8b5cf6',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'control-point-step-size': 100,
            'line-style': 'dashed'
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 4,
            'border-color': '#fbbf24'
          }
        },
        {
          selector: 'node:hover',
          style: {
            'border-width': 3,
            'border-color': '#fbbf24'
          }
        }
      ],
      layout: {
        name: 'preset'
      },
      wheelSensitivity: 1.0
    })

    // Load positions from layout.json if available
    fetch('/Canadian-Government-Semantic-Map/layout.json')
      .then(res => res.json())
      .then(positions => {
        cy.nodes().forEach(node => {
          if (positions[node.id()]) {
            node.position(positions[node.id()])
          }
        })
      })
      .catch(err => {
        console.log('No layout.json found, using auto-layout')
        // Run cose layout if no positions exist
        cy.layout({
          name: 'cose',
          animate: false,
          nodeRepulsion: 4000000,
          nodeOverlap: 5,
          idealEdgeLength: 500,
          edgeElasticity: 100,
          nestingFactor: 5,
          gravity: 10,
          numIter: 1000,
          initialTemp: 200,
          coolingFactor: 0.95,
          minTemp: 1.0,
          randomize: false
        }).run()
      })

    cy.on('tap', 'node', (evt) => {
      const node = evt.target
      onNodeClick(node.id())
    })

    // Set global instance for download functionality
    window.cyInstance = cy

    cyRef.current = cy

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy()
        cyRef.current = null
      }
    }
  }, [entities, relationships, onNodeClick, searchQuery, filters])

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-gray-50"
      style={{ position: 'relative' }}
    />
  )
}

export default GraphView
