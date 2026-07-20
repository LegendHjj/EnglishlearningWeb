import { describe, expect, test } from 'vitest'
import programmeJson from '../content/fluency-reset-60-day-program.json'
import practiceJson from '../content/practice-room-content.json'
import big30Json from '../content/big-30-question-guides.json'
import { createContentRepository, contentRepository } from './contentRepository'

describe('content repository', () => {
  test('loads the complete linked content pack', () => {
    expect(contentRepository.status.ok).toBe(true)
    expect(contentRepository.programme.phases).toHaveLength(9)
    expect(contentRepository.programme.missions).toHaveLength(60)
    expect(contentRepository.practiceDrills).toHaveLength(156)
    expect(contentRepository.big30Guides).toHaveLength(30)
    expect(contentRepository.getLinkedDrills('day-01').map(item => item.id)).toEqual(['mr-01', 'tb-01', 'fr-01'])
  })

  test('finds stable programme and Big 30 content', () => {
    expect(contentRepository.getMissionByDay(1)?.id).toBe('day-01')
    expect(contentRepository.getMissionById('day-60')?.day).toBe(60)
    expect(contentRepository.getDrillById('repair-01')?.mode).toBe('repairLab')
    expect(contentRepository.getBig30Guide('q1')?.id).toBe('big-01')
  })

  test('rejects duplicate IDs and missing linked drills without throwing', () => {
    const duplicate = structuredClone(programmeJson)
    duplicate.missions[1].id = duplicate.missions[0].id
    const invalid = createContentRepository(duplicate, practiceJson, big30Json)
    expect(invalid.status.ok).toBe(false)
    expect(invalid.status.errors.join(' ')).toMatch(/duplicate mission/i)

    const missing = structuredClone(programmeJson)
    missing.missions[0].linkedPracticeIds = ['does-not-exist']
    expect(createContentRepository(missing, practiceJson, big30Json).status.errors.join(' ')).toMatch(/missing drill/i)
  })

  test('fails safely for malformed content', () => {
    const repository = createContentRepository({ title: 'broken' }, practiceJson, big30Json)
    expect(repository.status.ok).toBe(false)
    expect(repository.programme.missions).toEqual([])
    expect(repository.getMissionByDay(1)).toBeUndefined()
  })
})
