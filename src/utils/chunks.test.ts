import { expect, test } from 'vitest'
import { defaultState } from '../data/seed'
import { addStarterChunks, chunkCue, isChunkDue, reviewChunk } from './chunks'

const phrase={...defaultState.phrases[0],text:"I'm trying to ...",whenToUse:'Explain an effort.',practised:0,used:0}
test('independent recall spaces reviews, again resets the interval and usage needs confirmation',()=>{
  const first=reviewChunk(phrase,'On my own',false,new Date('2026-10-12T00:00:00Z'))
  expect(first.chunkReview).toMatchObject({nextReviewAt:'2026-10-15T00:00:00.000Z',step:1,timesReviewed:1})
  expect(isChunkDue(first,new Date('2026-10-14T23:59:59Z'))).toBe(false)
  expect(isChunkDue(first,new Date('2026-10-15T00:00:00Z'))).toBe(true)
  const second=reviewChunk(first,'On my own',true,new Date('2026-10-15T00:00:00Z'))
  expect(second.chunkReview?.nextReviewAt).toBe('2026-10-22T00:00:00.000Z')
  expect(second.used).toBe(1)
  const again=reviewChunk(second,'Again',false,new Date('2026-10-22T00:00:00Z'))
  expect(again.chunkReview?.nextReviewAt).toBe('2026-10-23T00:00:00.000Z')
  expect(again.chunkReview?.step).toBe(0)
  expect(again.practised).toBe(3)
  expect(again.used).toBe(1)
})
test('recall cues conceal the fixed stem even with different apostrophes and frame punctuation',()=>{
  expect(chunkCue({...phrase,recallCue:'Use I’m trying to finish a task.'})).toBe('Use [your expression] finish a task.')
  expect(chunkCue({...phrase,text:'Works for me.',recallCue:'Say works for me to accept a plan.'})).toBe('Say [your expression] to accept a plan.')
  expect(chunkCue({...phrase,text:'Works for me.',recallCue:'Respond with Works  for me to accept the time.'})).toBe('Respond with [your expression] to accept the time.')
  expect(chunkCue({...phrase,text:'If I were you, I would ...',recallCue:'Say If I were you I would to give advice.'})).toBe('Say [your expression] to give advice.')
})
test('starter import recognises matching frames with different punctuation and never overwrites saved content',()=>{
  const existing={...phrase,text:'I’m trying to ___.',personalExample:'My own sentence'}
  const added=addStarterChunks([existing],[{...phrase,id:'starter'}])
  expect(added).toHaveLength(1)
  expect(added[0].personalExample).toBe('My own sentence')
})
