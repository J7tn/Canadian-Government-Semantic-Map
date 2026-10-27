// Derives a plain-language "why is this number what it is" explanation
// for an entity's budget, from (a) curated context text and (b) the
// spendingBreakdown composition — so the sidebar answers 'why does X
// need that much?' without hand-writing a blurb for all 140 orgs.

const TRANSFER_LABEL = 'transfer_payments'
const PERSONNEL_LABEL = 'personnel'
const DEBT_LABEL = 'public_debt'
const CAPITAL_LABEL = 'capital'

/**
 * @param {object} entity
 * @returns {string[]} insight sentences, most important first (empty if none)
 */
export function budgetInsight(entity) {
  const insights = []

  // Curated explanation wins — it's the actual story.
  if (entity.budgetContext) {
    insights.push(entity.budgetContext)
  }

  const bd = entity.spendingBreakdown
  if (bd && typeof bd === 'object') {
    const transfers = bd[TRANSFER_LABEL] || 0
    const personnel = bd[PERSONNEL_LABEL] || 0
    const debt = bd[DEBT_LABEL] || 0
    const capital = bd[CAPITAL_LABEL] || 0

    if (transfers > 0.5) {
      insights.push(
        `${Math.round(transfers * 100)}% is transfer payments — grants, benefits, and contributions passed through to individuals, provinces, and organizations rather than spent on this department's own operations.`
      )
    } else if (transfers > 0.25) {
      insights.push(
        `About ${Math.round(transfers * 100)}% goes to transfer payments (grants, benefits, contributions); the rest is direct program spending.`
      )
    }

    if (personnel > 0.5) {
      insights.push(
        'Personnel-dominated: the majority of this budget is salaries and benefits for staff.'
      )
    }

    if (debt > 0.3) {
      insights.push(
        'Dominated by public debt charges — interest payments, not program spending.'
      )
    }

    if (capital > 0.1 && transfers <= 0.5) {
      insights.push(
        `Notably capital-heavy: ~${Math.round(capital * 100)}% goes to buildings, works, and equipment.`
      )
    }
  }

  if (entity.type === 'ForeignCountry' && !entity.budgetContext) {
    insights.push(
      'Shows Canadian international assistance received, not a departmental budget.'
    )
  }

  return insights
}
