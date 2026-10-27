import { useEffect, useRef } from 'react'
import cytoscape from 'cytoscape'
import {
  ENTITY_TYPES,
  DEFAULT_ENTITY_COLOR,
  RELATIONSHIP_TYPES,
  DEFAULT_EDGE_COLOR
} from '../config/graphTheme'
import { diffGraphElements } from '../utils/graphFilter'
import { useLatest } from '../hooks/useLatest'

const COSE_OPTIONS = {
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
}

function nodeSize(money) {
  if (!money || money <= 0) return 30
  return Math.max(30, Math.min(80, Math.log10(money) * 10))
}

function buildStylesheet() {
  const styles = [
    {
      selector: 'node',
      style: {
        'background-color': (ele) => ENTITY_TYPES[ele.data('type')]?.color || DEFAULT_ENTITY_COLOR,
        'label': 'data(label)',
        'font-size': '12px',
        'text-valign': 'center',
        'text-halign': 'center',
        'width': (ele) => nodeSize(ele.data('money')),
        'height': (ele) => nodeSize(ele.data('money')),
        'border-width': 2,
        'border-color': '#ffffff',
        'color': '#ffffff',
        'text-outline-color': '#000000',
        'text-outline-width': 2
      }
    },
    // Base edge style so unknown/future relationship types still render sanely.
    {
      selector: 'edge',
      style: {
        'width': 2,
        'line-color': DEFAULT_EDGE_COLOR,
        'target-arrow-color': DEFAULT_EDGE_COLOR,
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier'
      }
    }
  ]

  for (const [type, rel] of Object.entries(RELATIONSHIP_TYPES)) {
    styles.push({
      selector: `edge[type="${type}"]`,
      style: {
        'width': rel.width,
        'line-color': rel.color,
        'target-arrow-color': rel.color,
        'control-point-step-size': rel.stepSize,
        ...(rel.dashed ? { 'line-style': 'dashed' } : {})
      }
    })
  }

  styles.push(
    {
      selector: 'node:selected',
      style: { 'border-width': 4, 'border-color': '#fbbf24' }
    },
    {
      selector: 'node:hover',
      style: { 'border-width': 3, 'border-color': '#fbbf24' }
    }
  )

  return styles
}

// Places positionless nodes on a ring around the centroid of the
// positioned ones so newly added entities are never stacked at (0, 0).
function placeMissingNodes(cy, positions) {
  const missing = cy.nodes().filter(node => !positions[node.id()])
  if (missing.length === 0) return

  let cx = 0
  let cySum = 0
  let count = 0
  cy.nodes().forEach(node => {
    const p = positions[node.id()]
    if (p) {
      cx += p.x
      cySum += p.y
      count++
    }
  })
  cx = count ? cx / count : 0
  cySum = count ? cySum / count : 0
  const radius = 300 + missing.length * 40

  missing.forEach((node, i) => {
    const angle = (i / missing.length) * Math.PI * 2
    node.position({ x: cx + radius * Math.cos(angle), y: cySum + radius * Math.sin(angle) })
  })
}

const GraphView = ({ entities, relationships, layout, selectedEntityId, onNodeClick, searchQuery, filters, onGraphReady, positionsRegistry }) => {
  const containerRef = useRef(null)
  const cyRef = useRef(null)
  // Live position registry: saved layout + in-session drags. Re-applied on
  // every element rebuild so filtering/search never loses manual layout.
  // Owned by App (positionsRegistry prop) so layout export can dump the
  // complete registry — including nodes currently filtered out.
  const fallbackPositionsRef = useRef({})
  const positionsRef = positionsRegistry ?? fallbackPositionsRef
  const fittedRef = useRef(false)
  const onNodeClickRef = useLatest(onNodeClick)
  const selectedRef = useLatest(selectedEntityId)

  // Mount once: create/destroy the Cytoscape instance and bind handlers.
  useEffect(() => {
    if (!containerRef.current) return undefined

    const cy = cytoscape({
      container: containerRef.current,
      elements: [],
      style: buildStylesheet(),
      wheelSensitivity: 0.3
    })
    cyRef.current = cy
    // Debug handle for live inspection (pan flags, viewport, element state) —
    // dev builds only, no reason to leak the instance in production.
    if (import.meta.env.DEV) {
      window.__cy = cy
    }

    cy.on('tap', 'node', (evt) => onNodeClickRef.current?.(evt.target.id()))

    cy.on('dblclick', 'node', (evt) => {
      cy.animate({ center: { eles: evt.target }, zoom: 2, duration: 500 })
    })

    cy.on('dragfree', 'node', (evt) => {
      positionsRef.current[evt.target.id()] = { ...evt.target.position() }
    })

    let rightClickCount = 0
    let rightClickTimeout = null
    cy.on('cxttap', () => {
      rightClickCount++
      if (rightClickCount === 2) {
        cy.fit(undefined, 50)
        rightClickCount = 0
        if (rightClickTimeout) clearTimeout(rightClickTimeout)
        rightClickTimeout = null
      } else {
        if (rightClickTimeout) clearTimeout(rightClickTimeout)
        rightClickTimeout = setTimeout(() => { rightClickCount = 0 }, 500)
      }
    })

    onGraphReady?.(cy)

    return () => {
      if (rightClickTimeout) clearTimeout(rightClickTimeout)
      cy.destroy()
      cyRef.current = null
      onGraphReady?.(null)
    }
    // Ref objects are stable — including them satisfies exhaustive-deps
    // without changing re-run behavior.
  }, [onGraphReady, onNodeClickRef, positionsRef])

  // Merge saved layout positions and frame the graph once. A new layout
  // object (initial load or retry) re-arms the one-shot fit.
  useEffect(() => {
    const cy = cyRef.current
    if (!layout || !cy) return

    fittedRef.current = false
    Object.assign(positionsRef.current, layout)
    cy.nodes().forEach(node => {
      const p = layout[node.id()]
      if (p) node.position(p)
    })
    placeMissingNodes(cy, positionsRef.current)

    if (!fittedRef.current && cy.nodes().length > 0) {
      cy.fit(undefined, 50)
      fittedRef.current = true
    }
  }, [layout, positionsRef])

  // Diff elements when data/filters/search change. The instance is reused;
  // positions (saved + dragged) are re-applied to newly added nodes.
  useEffect(() => {
    const cy = cyRef.current
    if (!cy) return

    diffGraphElements(cy, entities, relationships, filters, searchQuery, positionsRef.current)

    const positions = positionsRef.current
    if (Object.keys(positions).length > 0) {
      cy.nodes().forEach(node => {
        const p = positions[node.id()]
        if (p) node.position(p)
      })
      placeMissingNodes(cy, positions)
    } else if (cy.nodes().length > 0) {
      const layoutRun = cy.layout(COSE_OPTIONS)
      layoutRun.on('layoutstop', () => {
        // Only adopt cose positions if no saved layout arrived meanwhile.
        if (Object.keys(positionsRef.current).length === 0) {
          cy.nodes().forEach(node => {
            positionsRef.current[node.id()] = { ...node.position() }
          })
          if (!fittedRef.current) {
            cy.fit(undefined, 50)
            fittedRef.current = true
          }
        }
      })
      layoutRun.run()
    }

    const selectedId = selectedRef.current
    if (selectedId && cy.getElementById(selectedId).length > 0) {
      cy.getElementById(selectedId).select()
    }

    if (!fittedRef.current && cy.nodes().length > 0 && Object.keys(positions).length > 0) {
      cy.fit(undefined, 50)
      fittedRef.current = true
    }
  }, [entities, relationships, filters, searchQuery, positionsRef, selectedRef])

  // Keep Cytoscape selection in sync without triggering a rebuild.
  useEffect(() => {
    const cy = cyRef.current
    if (!cy) return
    cy.$(':selected').unselect()
    if (selectedEntityId && cy.getElementById(selectedEntityId).length > 0) {
      cy.getElementById(selectedEntityId).select()
    }
  }, [selectedEntityId])

  return (
    // touch-action:none is required: cytoscape binds Pointer Events but only
    // sets touch-action on legacy MS browsers — without it the browser claims
    // drags for page scrolling, fires pointercancel, and panning dies.
    <div
      ref={containerRef}
      className="w-full h-full bg-gray-50"
      style={{ position: 'relative', touchAction: 'none' }}
    />
  )
}

export default GraphView
