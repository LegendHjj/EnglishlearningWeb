import type { ProgrammeMission } from '../content/types'
import type { PracticeQueueItem } from '../types'

const LEGACY_EQUIVALENTS: Record<string, string> = {
  m1: 'day-29', m4: 'day-01', m5: 'day-06', m9: 'day-13', m12: 'day-38', m13: 'day-33', m16: 'day-37', m17: 'day-24', m18: 'day-52', m20: 'day-34', m21: 'day-40', m23: 'day-39',
}

export function getNextIncompleteMission(missions: ProgrammeMission[], completedIds: string[]) {
  const completed = new Set(completedIds)
  return [...missions].sort((a, b) => a.day - b.day).find(mission => !completed.has(mission.id))
}

export function migrateLegacyMissionIds(ids: string[]) {
  return { legacyIds: [...new Set(ids)], programmeIds: [...new Set(ids.flatMap(id => LEGACY_EQUIVALENTS[id] ? [LEGACY_EQUIVALENTS[id]] : []))] }
}

export function addQueueItem(queue: PracticeQueueItem[], item: PracticeQueueItem) {
  if (queue.some(existing => existing.type === item.type && existing.contentId === item.contentId) || queue.length >= 10) return queue
  return [...queue, item]
}

export function moveQueueItem(queue: PracticeQueueItem[], from: number, to: number) {
  if (from < 0 || from >= queue.length || to < 0 || to >= queue.length) return queue
  const result = [...queue]; const [item] = result.splice(from, 1); result.splice(to, 0, item); return result
}
