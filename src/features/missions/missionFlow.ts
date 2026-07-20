import type { ProgrammeMission } from '../../content/types'
import type { Difficulty } from '../../types'

export type MissionStage = 'warm-up'|'overview'|'prepare'|'first-attempt'|'retry'|'follow-up'|'reflection'|'self-check'|'complete'

export function getSessionStages(duration: 2|5|10): MissionStage[] {
  if (duration === 2) return ['overview', 'prepare', 'first-attempt', 'self-check', 'complete']
  if (duration === 5) return ['overview', 'prepare', 'first-attempt', 'retry', 'self-check', 'complete']
  return ['warm-up', 'overview', 'prepare', 'first-attempt', 'retry', 'follow-up', 'reflection', 'self-check', 'complete']
}

export function getDifficultyConfig(mission: ProgrammeMission, difficulty: Difficulty) {
  const key = difficulty.toLowerCase() as 'easy'|'practical'|'brave'
  const level = mission.levels[key]
  return { ...level, support: key === 'easy' ? 'full' as const : key === 'practical' ? 'partial' as const : 'minimal' as const, allowRestart: key !== 'brave', requiresFollowUp: key === 'brave' }
}
