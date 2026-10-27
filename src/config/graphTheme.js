// Single source of truth for entity/relationship visual encoding.
// Consumed by GraphView (Cytoscape styles), Sidebar (badges), and Legend.
// NOTE: Tailwind classes must be literal strings here so the content
// scanner picks them up — do not build class names dynamically.

export const ENTITY_TYPES = {
  Ministry: {
    color: '#dc2626',
    badge: 'bg-red-100 text-red-800',
    label: 'Ministry',
    description: 'Federal government departments responsible for specific policy areas (e.g., Health, Finance, Defence).'
  },
  Agency: {
    color: '#2563eb',
    badge: 'bg-blue-100 text-blue-800',
    label: 'Agency',
    description: 'Government agencies that provide specialized services or regulate specific sectors (e.g., CRA, Statistics Canada).'
  },
  CrownCorporation: {
    color: '#16a34a',
    badge: 'bg-green-100 text-green-800',
    label: 'Crown Corporation',
    description: 'State-owned enterprises that operate at arms-length from government (e.g., CBC, Canada Post, VIA Rail).'
  },
  Program: {
    color: '#9333ea',
    badge: 'bg-purple-100 text-purple-800',
    label: 'Program',
    description: 'Specific government programs or initiatives with defined objectives and budgets.'
  },
  Other: {
    color: '#6b7280',
    badge: 'bg-gray-100 text-gray-800',
    label: 'Other',
    description: 'Other government entities that do not fit into standard categories (e.g., Parliament).'
  },
  ForeignCountry: {
    color: '#f97316',
    badge: 'bg-orange-100 text-orange-800',
    label: 'Foreign Country',
    description: 'Recipient countries of Canadian international aid and foreign relations.'
  }
}

export const DEFAULT_ENTITY_COLOR = '#6b7280'
export const DEFAULT_ENTITY_BADGE = 'bg-gray-100 text-gray-800'

export const RELATIONSHIP_TYPES = {
  reports_to: {
    color: '#94a3b8',
    width: 2,
    stepSize: 50,
    dashed: false,
    label: 'Reports To',
    description: 'Formal reporting relationships showing chain of accountability within the government hierarchy.'
  },
  oversees: {
    color: '#f59e0b',
    width: 2,
    stepSize: 25,
    dashed: false,
    label: 'Oversees',
    description: 'Parent-child organizational structure showing which entities oversee others (generated from parent field).'
  },
  funds: {
    color: '#16a34a',
    width: 3,
    stepSize: 50,
    dashed: false,
    label: 'Funds (Money Flow)',
    description: 'Budgetary relationships showing the flow of funds from one entity to another (e.g., Parliament funds departments).'
  },
  international_aid: {
    color: '#8b5cf6',
    width: 4,
    stepSize: 100,
    dashed: true,
    label: 'International Aid',
    description: 'Foreign aid and assistance provided to other countries (e.g., Ukraine aid from Global Affairs).'
  }
}

export const DEFAULT_EDGE_COLOR = '#cbd5e1'

// Spending-breakdown categories. Keys match the `spendingBreakdown`
// fraction map on entities in data/entities.json.
export const SPENDING_CATEGORIES = {
  personnel: { label: 'Personnel', color: 'bg-blue-500' },
  professional_services: { label: 'Professional Services', color: 'bg-purple-500' },
  transportation: { label: 'Transportation', color: 'bg-yellow-500' },
  information: { label: 'Information Technology', color: 'bg-cyan-500' },
  rentals: { label: 'Rentals', color: 'bg-pink-500' },
  maintenance: { label: 'Maintenance', color: 'bg-orange-500' },
  utilities: { label: 'Utilities', color: 'bg-green-500' },
  capital: { label: 'Capital & Equipment', color: 'bg-red-500' },
  transfer_payments: { label: 'Transfer Payments', color: 'bg-indigo-500' },
  public_debt: { label: 'Public Debt Charges', color: 'bg-rose-600' },
  other_subsidies: { label: 'Other Subsidies & Payments', color: 'bg-fuchsia-500' }
}
