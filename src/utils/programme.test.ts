import { expect, test } from 'vitest'
import { contentRepository } from '../services/contentRepository'
import type { PracticeQueueItem } from '../types'
import { addQueueItem, getNextIncompleteMission, migrateLegacyMissionIds, moveQueueItem } from './programme'

test('a new learner starts at programme Day 1 regardless of the calendar', () => {
  expect(getNextIncompleteMission(contentRepository.programme.missions, [])?.id).toBe('day-01')
})

test('returns the earliest incomplete day and does not let later credits skip it', () => {
  expect(getNextIncompleteMission(contentRepository.programme.missions, ['day-01', 'day-03'])?.id).toBe('day-02')
})

test('curates strong legacy equivalents while preserving every old ID', () => {
  const result = migrateLegacyMissionIds(['m1', 'm5', 'm17', 'm99'])
  expect(result.legacyIds).toEqual(['m1', 'm5', 'm17', 'm99'])
  expect(result.programmeIds).toEqual(expect.arrayContaining(['day-06', 'day-24', 'day-29']))
})

test('caps and reorders the personal practice queue', () => {
  let queue:PracticeQueueItem[] = Array.from({ length: 10 }, (_, index) => ({ id: `mission-${index}`, type: 'mission' as const, contentId: `day-${index + 1}`, title: `Day ${index + 1}`, estimatedMinutes: 5 }))
  expect(addQueueItem(queue, { id: 'extra', type: 'drill', contentId: 'mr-01', title: 'Extra', estimatedMinutes: 2 })).toHaveLength(10)
  queue = moveQueueItem(queue, 9, 0)
  expect(queue[0].id).toBe('mission-9')
})
