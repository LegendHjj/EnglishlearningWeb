import { expect, test } from 'vitest'
import { contentRepository } from '../../services/contentRepository'
import { getDifficultyConfig, getSessionStages } from './missionFlow'

test('session duration changes the actual mission stages', () => {
  expect(getSessionStages(2)).toEqual(['overview', 'prepare', 'first-attempt', 'self-check', 'complete'])
  expect(getSessionStages(5)).toContain('retry')
  expect(getSessionStages(5)).not.toContain('warm-up')
  expect(getSessionStages(10)).toEqual(expect.arrayContaining(['warm-up', 'retry', 'follow-up', 'reflection']))
})

test('difficulty uses the authored level requirements and support visibility', () => {
  const mission = contentRepository.getMissionByDay(1)!
  expect(getDifficultyConfig(mission, 'Easy')).toMatchObject({ prepSeconds: 30, speakSeconds: 30, support: 'full', allowRestart: true })
  expect(getDifficultyConfig(mission, 'Practical')).toMatchObject({ prepSeconds: 20, speakSeconds: 60, support: 'partial' })
  expect(getDifficultyConfig(mission, 'Brave')).toMatchObject({ prepSeconds: 5, speakSeconds: 90, support: 'minimal', allowRestart: false, requiresFollowUp: true })
})
