import { beforeEach, expect, test } from 'vitest'
import { loadState, exportState, importState, exportBackup, importBackup } from './storage'
import { clearRecordings, listRecordings, saveRecording } from './recordingDb'
import { parsePracticePack, mergePracticePack } from './practicePacks'
import { readFileSync } from 'node:fs'

const pack = { app:'fluency-reset-practice-pack', version:1, id:'test-pack', name:'My examples', description:'Everyday practice', items:[
  {id:'c1',kind:'chunk',title:'Works for me',topic:'Plans',cue:'Accept a time',model:'Saturday works for me.',examples:['Ten works for me.'],keywords:['Saturday'],expressions:['Works for me'],meaning:'That is suitable.'},
  {id:'a1',kind:'answer',questionId:'q1',title:'An example answer',topic:'Daily life',cue:'Describe your day',model:'I start work at nine.',examples:[],keywords:['nine'],expressions:[]},
] }
beforeEach(()=>localStorage.clear())

test('pack merge adds chunks and examples without replacing personal work or counting completion',()=>{
  const current=loadState();current.memos.q1='My real story';current.completedQuestions=['q2']
  const next=mergePracticePack(current,parsePracticePack(JSON.stringify(pack)))
  expect(next.phrases).toHaveLength(current.phrases.length+1)
  expect(next.phrases.at(-1)).toMatchObject({text:'Works for me',personalExample:'',practised:0})
  expect(next.practicePacks[0].items).toHaveLength(2)
  expect(next.packPractice).toEqual({})
  expect(next.memos.q1).toBe('My real story');expect(next.completedQuestions).toEqual(['q2'])
  expect(next.completedProgrammeMissionIds).toEqual([])
})

test('reimport skips duplicates and preserves edited chunks, practice notes and existing example text',()=>{
  const first=mergePracticePack(loadState(),parsePracticePack(JSON.stringify(pack)))
  first.phrases.at(-1)!.personalExample='Friday works for me.'
  first.packPractice['test-pack/a1']={notes:'My notes',reply:'My reply',stage:'Recall',attempts:2,lastPractisedAt:'2026-10-18T00:00:00Z'}
  const changed=structuredClone(pack);changed.items[1].model='A replacement that should not overwrite the imported example.'
  const next=mergePracticePack(first,parsePracticePack(JSON.stringify(changed)))
  expect(next.practicePacks).toHaveLength(1);expect(next.practicePacks[0].items[1].model).toBe('I start work at nine.')
  expect(next.phrases).toHaveLength(first.phrases.length)
  expect(next.phrases.at(-1)!.personalExample).toBe('Friday works for me.')
  expect(next.packPractice['test-pack/a1'].attempts).toBe(2)
})

test('chunks with matching saved text are kept even when pack IDs differ',()=>{
  const current=loadState();current.phrases[0]={...current.phrases[0],text:'  WORKS for me! ',personalExample:'My own version'}
  const next=mergePracticePack(current,parsePracticePack(JSON.stringify(pack)))
  expect(next.phrases).toHaveLength(current.phrases.length)
  expect(next.phrases[0].personalExample).toBe('My own version')
})

test.each([
  {...pack,app:'fluency-reset',state:{}},
  {...pack,version:999},
  {...pack,items:[pack.items[0],pack.items[0]]},
  {...pack,items:[{...pack.items[1],questionId:'q999'}]},
  {...pack,items:[{...pack.items[0],model:123}]},
  {...pack,items:[{...pack.items[0],examples:[null]}]},
])('rejects invalid pack before any merge (%#)',value=>{
  const before=JSON.stringify(loadState())
  expect(()=>parsePracticePack(JSON.stringify(value))).toThrow(/practice pack|question|duplicate/i)
  expect(JSON.stringify(loadState())).toBe(before)
})

test('pack data and per-example progress survive export and import; old backups start empty',()=>{
  const current=mergePracticePack(loadState(),parsePracticePack(JSON.stringify(pack)))
  current.packPractice['test-pack/a1']={notes:'My note',reply:'Tomorrow is better.',stage:'Free',attempts:1,lastPractisedAt:'2026-10-18T00:00:00Z'}
  const restored=importState(exportState(current))
  expect(restored.practicePacks[0].items[1].model).toBe('I start work at nine.')
  expect(restored.packPractice['test-pack/a1']).toMatchObject({stage:'Free',attempts:1,notes:'My note'})
  const old={...loadState(),practicePacks:undefined,packPractice:undefined}
  expect(importState(JSON.stringify({app:'fluency-reset',version:7,state:old})).practicePacks).toEqual([])
})

test('complete backups retain imported content and the recording-to-example link',async()=>{
  await clearRecordings()
  const current=mergePracticePack(loadState(),parsePracticePack(JSON.stringify(pack)))
  await saveRecording({id:'pack-recording',name:'My example practice',createdAt:'2026-10-18T00:00:00Z',duration:4,practiceItemId:'test-pack/a1',mimeType:'audio/webm',size:10},new Blob(['pack audio'],{type:'audio/webm'}))
  const raw=await exportBackup(current)
  await clearRecordings()
  const restored=await importBackup(raw)
  expect(restored.practicePacks[0].items[1].model).toBe('I start work at nine.')
  const [recording]=await listRecordings()
  expect(recording).toMatchObject({id:'pack-recording',practiceItemId:'test-pack/a1',size:10})
  expect(recording.blob.size).toBe(10)
  await clearRecordings()
})

test.each([
  ['everyday-600-chunks',660,'chunk',600],
  ['big30-120-answers',120,'answer',120],
  ['everyday-120-conversations',140,'conversation',120],
] as const)('downloadable %s is importable and contains the workbook content', (id,total,kind,count)=>{
  const parsed=parsePracticePack(readFileSync(`public/practice-packs/${id}.json`,'utf8'))
  expect(parsed.items).toHaveLength(total)
  expect(parsed.items.filter(i=>i.kind===kind)).toHaveLength(count)
  if(kind==='answer'){
    expect(new Set(parsed.items.map(i=>i.questionId)).size).toBe(30)
    expect(parsed.items.filter(i=>i.questionId==='q1')).toHaveLength(4)
    expect(parsed.resources?.some(r=>r.body.includes('MY NOTES:'))).toBe(true)
  }
  if(kind==='conversation'){
    expect(parsed.items[0].model.split('\n')).toHaveLength(6)
    expect(parsed.items[0].challenge?.cue).toBe("I didn't catch your name.")
    expect(parsed.items.filter(i=>i.kind==='pattern')).toHaveLength(20)
  }
})
