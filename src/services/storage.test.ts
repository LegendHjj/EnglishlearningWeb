import { beforeEach, expect, test } from 'vitest'
import { bigQuestions, missions, seedPhrases } from '../data/seed'
import { exportBackup, exportState, importBackup, importState, loadState } from './storage'
import { clearRecordings, listRecordings, saveRecording } from './recordingDb'

beforeEach(()=>localStorage.clear())
test('ships enough useful practice content',()=>{expect(missions).toHaveLength(24);expect(bigQuestions).toHaveLength(30);expect(seedPhrases).toHaveLength(60)})
test('falls back safely when saved data is corrupted',()=>{localStorage.setItem('fluency-reset-state-v1','{nope');expect(loadState().phrases).toHaveLength(60)})
test('rejects an unrelated import',()=>{expect(()=>importState('{"hello":"world"}')).toThrow(/valid Fluency Reset/)})

test('migrates existing state without vocabulary and preserves saved content',()=>{
  const edited={...seedPhrases[0],text:'My edited phrase'}
  const legacy={...loadState(),schemaVersion:undefined,vocabulary:undefined,pinnedVocabularyIds:undefined,libraryTab:undefined,phrases:[edited],progress:[{date:'2026-07-01',minutes:4,missions:1,confidence:6}]}
  localStorage.setItem('fluency-reset-state-v1',JSON.stringify(legacy))
  const loaded=loadState()
  expect(loaded.phrases[0].text).toBe('My edited phrase')
  expect(loaded.phrases).toHaveLength(1)
  expect(loaded.vocabulary).toEqual([])
  expect(loaded.pinnedVocabularyIds).toEqual([])
  expect(loaded.schemaVersion).toBe(4)
  expect(loaded.legacyCompletedMissions).toEqual([])
  expect(loaded.completedProgrammeMissionIds).toEqual([])
  expect(loaded.progress[0].minutes).toBe(4)
})

test('does not restore deleted seed phrases or vocabulary',()=>{
  const first=loadState()
  expect(first.vocabulary.length).toBeGreaterThan(0)
  localStorage.setItem('fluency-reset-state-v1',JSON.stringify({...first,phrases:first.phrases.slice(1),vocabulary:first.vocabulary.slice(1)}))
  const loaded=loadState()
  expect(loaded.phrases.some(item=>item.id===first.phrases[0].id)).toBe(false)
  expect(loaded.vocabulary.some(item=>item.id===first.vocabulary[0].id)).toBe(false)
})

test('imports legacy backup version 1 without losing phrases or progress',()=>{
  const version=1
  const state={...loadState(),schemaVersion:undefined,vocabulary:undefined,pinnedVocabularyIds:undefined,libraryTab:undefined,phrases:[seedPhrases[0]],progress:[{date:'2026-07-02',minutes:6,missions:1,confidence:5}]}
  const restored=importState(JSON.stringify({app:'fluency-reset',version,state}))
  expect(restored.vocabulary).toEqual([]);expect(restored.phrases).toHaveLength(1);expect(restored.progress[0].minutes).toBe(6)
})

test('imports legacy backup version 2 without losing phrases or progress',async()=>{
  const state={...loadState(),schemaVersion:undefined,vocabulary:undefined,pinnedVocabularyIds:undefined,libraryTab:undefined,phrases:[seedPhrases[0]],progress:[{date:'2026-07-02',minutes:6,missions:1,confidence:5}]}
  const restored=await importBackup(JSON.stringify({app:'fluency-reset',version:2,state,recordings:[]}))
  expect(restored.vocabulary).toEqual([]);expect(restored.phrases).toHaveLength(1);expect(restored.progress[0].minutes).toBe(6)
})

test('exports and imports version 4 progress and library without audio',()=>{
  const state=loadState()
  const raw=exportState({...state,vocabulary:[{...state.vocabulary[0],english:'custom word'}]})
  expect(JSON.parse(raw)).toMatchObject({version:4,state:{schemaVersion:4,programmeVersion:1}})
  const restored=importState(raw)
  expect(restored.vocabulary[0].english).toBe('custom word')
})

test('exports and imports progress with recording audio',async()=>{
  await clearRecordings()
  await saveRecording({id:'r1',name:'Question answer',createdAt:'2026-07-12T00:00:00.000Z',duration:8,questionId:'q1',mimeType:'audio/webm',size:5},new Blob(['audio'],{type:'audio/webm'}))
  const raw=await exportBackup(loadState())
  expect(JSON.parse(raw).version).toBe(4)
  await clearRecordings()
  const restored=await importBackup(raw)
  const recordings=await listRecordings()
  expect(restored.completedQuestions).toEqual([])
  expect(recordings).toHaveLength(1)
  expect(recordings[0]).toMatchObject({id:'r1',questionId:'q1',size:5})
  const audioText=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(reader.error);reader.readAsText(recordings[0].blob)})
  expect(audioText).toBe('audio')
})
