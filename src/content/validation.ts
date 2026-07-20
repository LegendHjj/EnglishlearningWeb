import type { Big30Content, ContentStatus, PracticeContent, PracticeMode, ProgrammeContent } from './types'

const isObject = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value)
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every(item => typeof item === 'string')
const uniqueErrors = (items: { id: string }[], label: string) => {
  const seen = new Set<string>(); const errors: string[] = []
  for (const item of items) { if (seen.has(item.id)) errors.push(`Duplicate ${label} ID: ${item.id}`); seen.add(item.id) }
  return errors
}

export function validateContent(programmeValue: unknown, practiceValue: unknown, big30Value: unknown): { status: ContentStatus; programme?: ProgrammeContent; practice?: PracticeContent; big30?: Big30Content } {
  const errors: string[] = []
  if (!isObject(programmeValue) || !Array.isArray(programmeValue.phases) || !Array.isArray(programmeValue.missions)) errors.push('Programme content must include phases and missions.')
  if (!isObject(practiceValue) || !isObject(practiceValue.modes) || !Array.isArray(practiceValue.modeOrder)) errors.push('Practice content must include modes and modeOrder.')
  if (!isObject(big30Value) || !Array.isArray(big30Value.items)) errors.push('Big 30 content must include items.')
  if (errors.length) return { status: { ok: false, errors } }

  const programme = programmeValue as unknown as ProgrammeContent
  const practice = practiceValue as unknown as PracticeContent
  const big30 = big30Value as unknown as Big30Content
  const phaseIds = new Set(programme.phases.map(item => item.id))
  errors.push(...uniqueErrors(programme.missions, 'mission'))
  if (new Set(programme.missions.map(item => item.day)).size !== programme.missions.length) errors.push('Duplicate programme day found.')
  for (const mission of programme.missions) {
    if (!mission.id || typeof mission.day !== 'number' || !phaseIds.has(mission.phaseId) || !strings(mission.linkedPracticeIds) || !isObject(mission.levels)) errors.push(`Malformed mission: ${mission.id || 'unknown'}`)
  }
  const drills = practice.modeOrder.flatMap(mode => {
    const value = practice.modes[mode as PracticeMode]
    if (!value || !Array.isArray(value.items)) { errors.push(`Malformed practice mode: ${mode}`); return [] }
    return value.items.map(item => ({ ...(item as { id: string }), mode }))
  })
  errors.push(...uniqueErrors(drills, 'drill'))
  const drillIds = new Set(drills.map(item => item.id))
  for (const mission of programme.missions) for (const id of mission.linkedPracticeIds) if (!drillIds.has(id)) errors.push(`Mission ${mission.id} references missing drill ${id}.`)
  errors.push(...uniqueErrors(big30.items, 'Big 30 guide'))
  for (const guide of big30.items) if (!guide.id || !strings(guide.keyPoints) || !strings(guide.supportFrames) || !Array.isArray(guide.recommendedRounds)) errors.push(`Malformed Big 30 guide: ${guide.id || 'unknown'}`)
  return errors.length ? { status: { ok: false, errors } } : { status: { ok: true, errors: [] }, programme, practice, big30 }
}
