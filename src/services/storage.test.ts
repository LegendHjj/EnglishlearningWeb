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
  expect(loaded.schemaVersion).toBe(7)
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

test('exports and imports version 7 progress and library without audio',()=>{
  const state=loadState()
  const raw=exportState({...state,vocabulary:[{...state.vocabulary[0],english:'custom word'}]})
  expect(JSON.parse(raw)).toMatchObject({version:7,state:{schemaVersion:7,programmeVersion:1}})
  const restored=importState(raw)
  expect(restored.vocabulary[0].english).toBe('custom word')
})

test('version 4 migration preserves existing programme and library data without adding chunks',()=>{
  const old={...loadState(),schemaVersion:4,libraryTab:'Speaking Phrases',phrases:[{...seedPhrases[0],personalExample:'My existing example'}],completedProgrammeMissionIds:['day-1'],memos:{q1:'My notes'},pinnedPhraseIds:['p1']}
  const restored=importState(JSON.stringify({app:'fluency-reset',version:4,state:old}))
  expect(restored.schemaVersion).toBe(7)
  expect(restored.phrases).toHaveLength(1)
  expect(restored.phrases[0]).toMatchObject({id:'p1',personalExample:'My existing example',variations:[]})
  expect(restored.phrases[0].chunkReview).toBeUndefined()
  expect(restored.completedProgrammeMissionIds).toEqual(old.completedProgrammeMissionIds)
  expect(restored.memos).toEqual(old.memos)
  expect(restored.pinnedPhraseIds).toEqual(old.pinnedPhraseIds)
  expect(restored.vocabulary).toEqual(old.vocabulary)
})

test('version 5 migration keeps chunk practice, memos and recording links and starts an empty personal-answer collection',async()=>{
  const old={...loadState(),schemaVersion:5,big30Answers:undefined,memos:{q5:'My existing memo'},phrases:[{...seedPhrases[0],chunkKind:'Sentence frame',variations:['My own version']}]}
  const restored=await importBackup(JSON.stringify({app:'fluency-reset',version:5,state:old,recordings:[]}))
  expect(restored.schemaVersion).toBe(7)
  expect(restored.big30Answers).toEqual({})
  expect(restored.memos).toEqual(old.memos)
  expect(restored.phrases[0]).toMatchObject(old.phrases[0])
})

test('malformed optional personal answers do not discard an otherwise valid library',()=>{
  const state={...loadState(),big30Answers:{q5:{notes:'My original notes',answer:123,keywords:null,chunks:[],targetSeconds:999},q1:null}}
  const restored=importState(JSON.stringify({app:'fluency-reset',version:6,state}))
  expect(restored.big30Answers.q5).toMatchObject({notes:'My original notes',answer:'',keywords:'',chunks:'',targetSeconds:30})
  expect(restored.big30Answers.q1).toBeUndefined()
  expect(restored.phrases).toHaveLength(state.phrases.length)
})

test('v6 import preserves personal answers and defaults to browser',()=>{
  const legacy={...loadState(),schemaVersion:6,preferences:{...loadState().preferences,voice:'Microsoft Zira',voiceGender:'female'},big30Answers:{q1:{notes:'A long personal story',targetSeconds:60 as const,answer:'I helped my team.',keywords:'team',chunks:'helped my team',useForPractice:true}},memos:{q1:'my memo'},pinnedPhraseIds:['p2'],completedProgrammeMissionIds:['day-01']}
  const restored=importState(JSON.stringify({app:'fluency-reset',version:6,state:legacy}))
  expect(restored.schemaVersion).toBe(7)
  expect(restored.preferences.speechEngine).toBe('browser')
  expect(restored.big30Answers).toEqual(legacy.big30Answers)
  expect(restored.memos).toEqual(legacy.memos)
  expect(restored.pinnedPhraseIds).toEqual(legacy.pinnedPhraseIds)
  expect(restored.completedProgrammeMissionIds).toEqual(legacy.completedProgrammeMissionIds)
  expect(restored.phrases).toMatchObject(legacy.phrases)
  expect(restored.vocabulary).toEqual(legacy.vocabulary)
})

test('version 7 exports preserve Heart and reject malformed engines without losing the library',()=>{
  const state={...loadState(),preferences:{...loadState().preferences,speechEngine:'heart' as const,voice:'Microsoft Zira',voiceGender:'female' as const}}
  const raw=exportState(state)
  expect(JSON.parse(raw).version).toBe(7)
  expect(importState(raw).preferences).toMatchObject({speechEngine:'heart',voice:'Microsoft Zira',voiceGender:'female'})
  const malformed=JSON.parse(raw)
  malformed.state.preferences.speechEngine='unknown'
  const restored=importState(JSON.stringify(malformed))
  expect(restored.preferences.speechEngine).toBe('browser')
  expect(restored.phrases).toMatchObject(state.phrases)
})

test('exports and imports progress with recording audio',async()=>{
  await clearRecordings()
  await saveRecording({id:'r1',name:'Question answer',createdAt:'2026-07-12T00:00:00.000Z',duration:8,questionId:'q1',phraseId:'personal-chunk',mimeType:'audio/webm',size:5},new Blob(['audio'],{type:'audio/webm'}))
  const phrase={...seedPhrases[0],id:'personal-chunk',variations:['Another personal sentence'],chunkReview:{step:1,timesReviewed:1,lastRating:'On my own' as const,lastReviewedAt:'2026-10-12T00:00:00Z',nextReviewAt:'2026-10-15T00:00:00Z'}}
  const raw=await exportBackup({...loadState(),phrases:[phrase],libraryTab:'Chunk Practice'})
  expect(JSON.parse(raw).version).toBe(7)
  await clearRecordings()
  const restored=await importBackup(raw)
  const recordings=await listRecordings()
  expect(restored.completedQuestions).toEqual([])
  expect(restored.libraryTab).toBe('Chunk Practice')
  expect(restored.phrases[0]).toMatchObject(phrase)
  expect(recordings).toHaveLength(1)
  expect(recordings[0]).toMatchObject({id:'r1',questionId:'q1',phraseId:'personal-chunk',size:5})
  const audioText=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(reader.error);reader.readAsText(recordings[0].blob)})
  expect(audioText).toBe('audio')
})
