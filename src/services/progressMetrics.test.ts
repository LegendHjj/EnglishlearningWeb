import { expect, test } from 'vitest'
import { defaultState } from '../data/seed'
import { calculateProgressMetrics } from './progressMetrics'

test('returns honest empty metrics without demonstration data',()=>{
  expect(calculateProgressMetrics(defaultState,[])).toMatchObject({programmeDays:0,recordedSeconds:0,retries:0,followUps:0,practiceDrills:0,confidenceTrend:[]})
})

test('derives confidence and usage only from learner self-checks',()=>{
  const state={...defaultState,completedProgrammeMissionIds:['day-01'],completedPracticeDrillIds:['repair-01'],missionSelfChecks:[{missionId:'day-01',completedAt:'2026-07-14T00:00:00.000Z',duration:42,messageCompleted:'yes' as const,usedPhraseIds:['p1'],usedVocabularyIds:['v1'],confidence:4 as const,answeredFollowUp:true,noteStage:'Recall' as const,sessionDuration:5 as const,difficulty:'Practical' as const,retryCompleted:true,recordingIds:[]}]}
  expect(calculateProgressMetrics(state,[])).toMatchObject({programmeDays:1,recordedSeconds:42,retries:1,followUps:1,practiceDrills:1,repairDrills:1,confidenceTrend:[{label:'Day 1',confidence:4}]})
})
