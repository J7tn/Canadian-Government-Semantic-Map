// Shared formatter — NumberFormat construction is comparatively expensive
// and this is called per row in Directory/Sidebar renders.
const CAD_FORMATTER = new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
})

export function formatBudget(budget) {
  if (budget == null) return 'N/A'
  return CAD_FORMATTER.format(budget)
}

export function formatPercent(fraction) {
  const percent = fraction * 100
  return percent.toFixed(percent < 1 ? 2 : percent < 10 ? 1 : 0)
}
