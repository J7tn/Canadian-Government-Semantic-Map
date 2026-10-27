// Derives a one-line, jargon-free "what it actually does" for the
// sidebar. Hybrid: a curated `entity.summary` field wins when present;
// otherwise the first sentence of `description` is normalized into plain
// phrasing (mandate boilerplate like "Responsible for..." is rewritten).
// The idea is the same as budgetInsight — don't hand-write copy for all
// 140 entities when the data already carries it.

const TYPE_LEADS = {
  Ministry: 'A federal government department',
  Agency: 'A federal agency',
  CrownCorporation: 'A government-owned corporation',
  Program: 'A government program',
  Other: 'A government body',
  ForeignCountry: 'Not a government body — a recipient of Canadian aid'
}

const STATUS_LEADS = {
  defunct: 'No longer exists as a separate entity (dissolved, privatized, or merged).',
  fictional: 'Flagged: this entity does not appear in federal registries — likely a data error kept for transparency.'
}

// First sentence, with bracketed editorial notes removed and mandate
// boilerplate softened. "Responsible for X" -> "tasked with X" so the
// fragment can follow the type lead-in grammatically.
function normalizeDescription(description) {
  if (!description || typeof description !== 'string') return ''
  const firstSentence = description.split(/(?<=\.)\s+/)[0] || ''
  return firstSentence
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\b[Rr]esponsible for\b/, 'tasked with')
    .replace(/\s+/g, ' ')
    .trim()
}

function lowerFirst(text) {
  return text.length > 0 ? text[0].toLowerCase() + text.slice(1) : text
}

/**
 * @param {object} entity
 * @returns {string} one or two short sentences, plain language
 */
export function plainSummary(entity) {
  const parts = []

  if (entity.status && STATUS_LEADS[entity.status]) {
    parts.push(STATUS_LEADS[entity.status])
  }

  if (entity.summary) {
    parts.push(entity.summary)
    return parts.join(' ')
  }

  const lead = TYPE_LEADS[entity.type] || 'A government entity'
  const clause = normalizeDescription(entity.description)

  if (clause) {
    parts.push(`${lead} — ${lowerFirst(clause)}`)
  } else {
    parts.push(`${lead}.`)
  }

  return parts.join(' ')
}
