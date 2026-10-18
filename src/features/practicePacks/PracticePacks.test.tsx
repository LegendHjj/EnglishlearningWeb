import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AppProvider } from '../../context/AppContext'
import { loadState, saveState } from '../../services/storage'
import { mergePracticePack, parsePracticePack } from '../../services/practicePacks'
import PracticePackSettings from './PracticePackSettings'
import PackExample from './PackExample'
import ChunkWorkout from '../chunks/ChunkWorkout'
import type { PracticePack } from '../../types/practicePacks'

const pack:PracticePack={app:'fluency-reset-practice-pack',version:1,id:'sample',name:'Sample conversations',description:'Practice for real life',items:[{id:'one',kind:'conversation',title:'A café order',topic:'Food',cue:'Order a drink.',model:'A: Could I have tea?\nB: Of course.',examples:[],keywords:['drink','choice'],expressions:['Could I have'],challenge:{cue:'We have no tea left.',model:'Coffee is fine, thanks.',followUp:'Do you have milk?'}}]}
beforeEach(()=>localStorage.clear())
afterEach(()=>{cleanup();vi.restoreAllMocks()})
test('Settings preview is optional, preserves existing work and makes reimport harmless',async()=>{
  vi.spyOn(globalThis,'fetch').mockResolvedValue({ok:true,text:async()=>JSON.stringify(pack)} as Response)
  render(<MemoryRouter><AppProvider><PracticePackSettings/></AppProvider></MemoryRouter>)
  fireEvent.click(screen.getByRole('button',{name:'Preview 120 everyday conversations'}))
  expect(await screen.findByRole('heading',{name:'Review Sample conversations'})).toBeInTheDocument()
  expect(loadState().practicePacks).toEqual([])
  fireEvent.click(screen.getByRole('button',{name:'Add to my practice'}))
  expect(loadState().practicePacks).toHaveLength(1)
  expect(loadState().packPractice).toEqual({})
  fireEvent.click(screen.getByRole('button',{name:'Preview 120 everyday conversations'}))
  await screen.findByRole('heading',{name:'Review Sample conversations'})
  expect(screen.getByText(/0 new examples/)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button',{name:'Add to my practice'}))
  expect(loadState().practicePacks).toHaveLength(1)
})
test('invalid uploaded content leaves progress intact and reports the problem',async()=>{
  render(<MemoryRouter><AppProvider><PracticePackSettings/></AppProvider></MemoryRouter>)
  const input=screen.getByLabelText('Import a practice pack JSON file')
  const file=new File(['not JSON'],'broken.json',{type:'application/json'})
  Object.defineProperty(file,'text',{value:async()=>'{broken'})
  fireEvent.change(input,{target:{files:[file]}})
  expect(await screen.findByRole('alert')).toHaveTextContent(/valid practice pack/i)
  expect(loadState().practicePacks).toEqual([])
})

test('storage failure keeps the pack preview open and leaves the current library unchanged',async()=>{
  vi.spyOn(globalThis,'fetch').mockResolvedValue({ok:true,text:async()=>JSON.stringify(pack)} as Response)
  render(<MemoryRouter><AppProvider><PracticePackSettings/></AppProvider></MemoryRouter>)
  fireEvent.click(screen.getByRole('button',{name:'Preview 120 everyday conversations'}))
  await screen.findByRole('heading',{name:'Review Sample conversations'})
  vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new DOMException('Quota exceeded','QuotaExceededError')})
  fireEvent.click(screen.getByRole('button',{name:'Add to my practice'}))
  expect(screen.getByRole('alert')).toHaveTextContent(/not enough device storage/)
  expect(screen.getByRole('heading',{name:'Review Sample conversations'})).toBeInTheDocument()
  expect(loadState().practicePacks).toEqual([])
})
test('example support hides models and personal notes in Recall and Free, and only explicit practice counts',async()=>{
  saveState(mergePracticePack(loadState(),parsePracticePack(JSON.stringify(pack))))
  render(<AppProvider><PackExample pack={pack} item={pack.items[0]}/></AppProvider>)
  expect(screen.getByText(/Could I have tea/)).toBeInTheDocument()
  fireEvent.change(screen.getByLabelText('My notes for this example'),{target:{value:'I prefer coffee.'}})
  fireEvent.click(screen.getByRole('button',{name:'Show possible reply'}))
  expect(screen.getByText('Coffee is fine, thanks.')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button',{name:'Recall'}))
  expect(screen.queryByText(/Could I have tea/)).not.toBeInTheDocument()
  expect(screen.queryByText('Coffee is fine, thanks.')).not.toBeInTheDocument()
  expect(screen.queryByLabelText('My notes for this example')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button',{name:'Free'}))
  expect(screen.queryByText('drink · choice')).not.toBeInTheDocument()
  expect(loadState().packPractice['sample/one'].attempts).toBe(0)
  fireEvent.click(screen.getByRole('button',{name:'I practised this example'}))
  await waitFor(()=>expect(loadState().packPractice['sample/one']).toMatchObject({stage:'Free',attempts:1,notes:'I prefer coffee.'}))
  expect(loadState().completedQuestions).toEqual([])
  expect(loadState().completedProgrammeMissionIds).toEqual([])
})

test('matching personal chunks keep their original example and can still show the imported samples',()=>{
  const current=loadState();current.phrases[0]={...current.phrases[0],text:'A phrase I already saved.',example:'My original example.'}
  const chunkPack:PracticePack={...pack,items:[{id:'chunk-one',kind:'chunk',title:'A phrase I already saved.',topic:'Daily life',cue:'A familiar situation',model:'My new pack example.',examples:['Another pack example.'],keywords:[],expressions:[]}]}
  saveState(mergePracticePack(current,chunkPack))
  render(<AppProvider><ChunkWorkout phraseId="p1" onClose={()=>{}}/></AppProvider>)
  expect(screen.getByText('My original example.')).toBeInTheDocument()
  fireEvent.click(screen.getByText('More examples from practice packs'))
  expect(screen.getByText('My new pack example.')).toBeVisible()
  expect(screen.getByText('Another pack example.')).toBeVisible()
  expect(loadState().phrases[0].example).toBe('My original example.')
})
