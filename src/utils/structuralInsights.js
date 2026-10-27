// Derives real-world observations about the structure of government
// from the graph data — rendered in the StructuralInsights table below
// the map. Everything is computed live from entities + relationships
// so the table stays honest as the dataset changes.

const TRANSFER_THRESHOLD = 0.8
// Entities whose "budget" figure is not a parliamentary appropriation —
// repayable capital, billed services, or fee revenue — so the graph's
// uniform $ scale conflates different semantics.
const NON_APPROPRIATION = new Set([
  'cib', 'defence-construction', 'patent-office'
])

/**
 * @param {Array} entities
 * @param {Array} relationships
 * @returns {Array<{severity: string, issue: string, scope: string, detail: string}>}
 */
export function collectInsights(entities, relationships) {
  const insights = []
  const live = entities.filter(e => e.status !== 'defunct' && e.status !== 'fictional')
  const flagged = entities.length - live.length

  // 1. Passthrough state — orgs that are mostly transfer machines.
  const passthrough = live.filter(e =>
    (e.spendingBreakdown?.transfer_payments || 0) > TRANSFER_THRESHOLD
  )
  if (passthrough.length) {
    const names = passthrough.slice(0, 4).map(e => e.name).join(', ')
    insights.push({
      severity: 'high',
      issue: 'Most of government is a pass-through, not a service',
      scope: `${passthrough.length} organizations mostly hand out cheques`,
      detail:
        `A lot of these organizations exist mainly to hand money to someone else — ` +
        `benefits to people, grants to provinces and charities (e.g. ${names}). ` +
        'The biggest “spenders” are really the mail room: they move money on, rather than ' +
        'run anything with it themselves.',
      impact:
        'Mostly good — money reaches you without a bureaucracy spending it on itself ' +
        'first. But when something goes wrong (a late benefit cheque, a bad grant), ' +
        'it can be unclear who to blame, because nobody “did” anything — they just ' +
        'moved money.'
    })
  }

  // 2. Spending concentration.
  const budgeted = live.filter(e => e.budget != null)
  const total = budgeted.reduce((s, e) => s + e.budget, 0)
  const top10 = [...budgeted].sort((a, b) => b.budget - a.budget).slice(0, 10)
  const top10Sum = top10.reduce((s, e) => s + e.budget, 0)
  const top2Sum = top10.slice(0, 2).reduce((s, e) => s + e.budget, 0)
  if (total > 0) {
    const topDetail = top10.length > 1
      ? `${top10[0].name} and ${top10[1].name} alone handle ${Math.round(top2Sum / total * 100)}% ` +
        'of every dollar on this map — but most of it is payments they mail on to someone ' +
        'else (benefits, health transfers, debt interest). Biggest doesn’t mean busiest.'
      : `${top10[0].name} handles ${Math.round(top10[0].budget / total * 100)}% of every dollar on this map.`
    insights.push({
      severity: 'high',
      issue: 'Two departments move more than half the money',
      scope: `Top 10 of ${budgeted.length} = ${Math.round(top10Sum / total * 100)}%`,
      detail: topDetail,
      impact:
        'Efficient to run — but it makes those two departments single points of failure. ' +
        'A payroll glitch or benefits outage there touches more Canadians than a failure ' +
        'almost anywhere else in government.'
    })
  }

  // 3. Arm's-length delivery.
  const ministries = live.filter(e => e.type === 'Ministry').length
  const armLength = live.filter(e => e.type === 'Agency' || e.type === 'CrownCorporation').length
  const ratio = ministries > 0 ? (armLength / ministries).toFixed(1) : null
  insights.push({
    severity: 'medium',
    issue: 'Most of government works at arm’s length',
    scope: `${armLength} outside bodies vs ${ministries} departments`,
    detail:
      `Agencies and Crown corporations outnumber departments ${ratio ? `${ratio} to 1` : ''}. ` +
      'Most federal work is done by organizations a minister doesn’t run day to day — they answer to ' +
      'their own boards, which makes it harder to say who’s really in charge.',
    impact:
      'Cuts both ways: it keeps things like statistics and policing insulated from ' +
      'day-to-day politics — good. But when one underperforms, ministers can shrug ' +
      '“not my department” and voters are left holding the bag.'
  })

  // 4. Overlapping budgetary authority. Multiple incoming funds edges
  // are real funding channels (e.g. departments can draw on Treasury
  // Board's central votes in addition to their own appropriation) —
  // secondary channels carry amount null since the draw is unknown.
  const funders = new Map()
  for (const r of relationships) {
    if (r.type !== 'funds') continue
    if (!funders.has(r.to)) funders.set(r.to, new Set())
    funders.get(r.to).add(r.from)
  }
  const dualFunded = [...funders.entries()].filter(([, s]) => s.size > 1)
  if (dualFunded.length) {
    insights.push({
      severity: 'medium',
      issue: 'Some departments are paid from two pockets',
      scope: `${dualFunded.length} organizations with two funders`,
      detail:
        'Several departments get money from Parliament’s main vote AND can draw on Treasury ' +
        'Board’s central reserve. How much flows through the second channel isn’t published ' +
        'per department — a real blind spot in how central funds are held and handed out.',
      impact:
        'Mostly bad for transparency — money drawn from the reserve gets less debate ' +
        'and less of a paper trail per dollar, so it’s harder for Parliament (and you) ' +
        'to see exactly what your taxes bought.'
    })
  }

  // 5. Missing program layer.
  const programs = live.filter(e => e.type === 'Program').length
  if (programs === 0) {
    insights.push({
      severity: 'high',
      issue: 'You can see who holds the money, not what it buys',
      scope: 'No individual programs shown',
      detail:
        'The map stops at whole departments, but money is really spent on programs — ' +
        'Old Age Security, EI, specific grants. Where the dollars actually land is ' +
        'invisible here.',
      impact:
        'The “was it worth it?” question can’t be answered from this view — you can see ' +
        'Health Canada’s billions, but not how much went to dental care vs. hospitals ' +
        'vs. overhead. That’s the layer citizens and journalists actually ask about.'
    })
  }

  // 6. Aid coverage asymmetry.
  const recipientNames = live.filter(e => e.type === 'ForeignCountry').map(e => e.name)
  const gac = entities.find(e => e.id === 'global-affairs')
  if (recipientNames.length <= 1 && gac?.spendingBreakdown?.transfer_payments > 0.3) {
    const shown = recipientNames.length === 1 ? recipientNames[0] : 'none'
    insights.push({
      severity: 'medium',
      issue: 'Foreign aid: only one country shown',
      scope: `${recipientNames.length} recipient${recipientNames.length === 1 ? '' : 's'} on the map`,
      detail:
        'Canada sends billions abroad through Global Affairs to dozens of countries — ' +
        `but only ${shown} is mapped. The rest of the aid picture is invisible.`,
      impact:
        'Most of Canada’s role in the world stays out of sight — it’s hard for the ' +
        'public to see where aid goes, how much, or why those countries were chosen.'
    })
  }

  // 7. Budget semantics conflated.
  const conflated = live.filter(e => NON_APPROPRIATION.has(e.id)).length
  if (conflated) {
    insights.push({
      severity: 'medium',
      issue: 'Not all “budgets” mean the same thing',
      scope: `${conflated} figures that aren’t yearly handouts`,
      detail:
        'CIB’s number is money it lends out and expects back, DCC’s is money it bills ' +
        'other departments, CIPO’s is fee revenue it earns itself. None of them live off ' +
        'yearly handouts like a normal department — but they all look identical on the map.',
      impact:
        'Misleading at a glance — CIB looks like it “spends” $3.6B a year when most of ' +
        'that money is lent and expected back. Mixing these numbers can make government ' +
        'spending look bigger (or smaller) than it really is.'
    })
  }

  // 8. Stale entities still on the map.
  if (flagged) {
    insights.push({
      severity: 'low',
      issue: 'Organizations that no longer exist are still on the map',
      scope: `${flagged} outdated entries`,
      detail:
        'Ridley Terminals was sold in 2019; the Old Port and Parc Downsview were folded ' +
        'into Canada Lands in 2012. One entry (the “Canadian Lakes Loaches Commission”) ' +
        'doesn’t exist in any federal registry at all. They’re flagged, but still drawn ' +
        'alongside real, current organizations.',
      impact:
        'Mostly a trust issue — maps like this shape how people understand government, ' +
        'and ghost entries quietly teach a wrong picture of what exists today.'
    })
  }

  // 9. Revenue side invisible.
  insights.push({
    severity: 'low',
    issue: 'The map only shows money going out — never coming in',
    scope: 'No income shown',
    detail:
      'The CRA appears only as a cost, but it’s the agency that collects the taxes. ' +
      'Where the money comes from — taxes, fees, Crown corporation profits — isn’t ' +
      'shown anywhere, so you only see half the story.',
    impact:
      'You only see the bill, never the wallet — which makes it easy to argue about ' +
      'spending without ever seeing whether taxes, fees, or borrowing paid for it.'
  })

  return insights
}
