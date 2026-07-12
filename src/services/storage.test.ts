import { beforeEach, expect, test } from 'vitest'
import { bigQuestions, missions, seedPhrases } from '../data/seed'
import { exportBackup, importBackup, importState, loadState } from './storage'
import { clearRecordings, listRecordings, saveRecording } from './recordingDb'

beforeEach(()=>localStorage.clear())
test('ships enough useful practice content',()=>{expect(missions).toHaveLength(24);expect(bigQuestions).toHaveLength(30);expect(seedPhrases).toHaveLength(60)})
test('falls back safely when saved data is corrupted',()=>{localStorage.setItem('fluency-reset-state-v1','{nope');expect(loadState().phrases).toHaveLength(60)})
test('rejects an unrelated import',()=>{expect(()=>importState('{"hello":"world"}')).toThrow(/valid Fluency Reset/)})

test('adds new built-in phrases without replacing saved phrase edits',()=>{
  const edited={...seedPhrases[0],text:'My edited phrase'}
  localStorage.setItem('fluency-reset-state-v1',JSON.stringify({...loadState(),phrases:[edited]}))
  const loaded=loadState()
  expect(loaded.phrases[0].text).toBe('My edited phrase')
  expect(loaded.phrases.length).toBeGreaterThanOrEqual(50)
})

test('exports and imports progress with recording audio',async()=>{
  await clearRecordings()
  await saveRecording({id:'r1',name:'Question answer',createdAt:'2026-07-12T00:00:00.000Z',duration:8,questionId:'q1',mimeType:'audio/webm',size:5},new Blob(['audio'],{type:'audio/webm'}))
  const raw=await exportBackup(loadState())
  await clearRecordings()
  const restored=await importBackup(raw)
  const recordings=await listRecordings()
  expect(restored.completedQuestions).toEqual([])
  expect(recordings).toHaveLength(1)
  expect(recordings[0]).toMatchObject({id:'r1',questionId:'q1',size:5})
  const audioText=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(reader.error);reader.readAsText(recordings[0].blob)})
  expect(audioText).toBe('audio')
})
