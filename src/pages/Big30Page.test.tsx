import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { AppProvider } from '../context/AppContext'
import { defaultState } from '../data/seed'
import { exportBackup, exportState, importBackup, importState, loadState } from '../services/storage'
import Big30Page from './Big30Page'

beforeEach(()=>{localStorage.clear();localStorage.setItem('fluency-reset-state-v1',JSON.stringify(defaultState))})
afterEach(()=>{cleanup();vi.restoreAllMocks()})
const open=()=>render(<AppProvider><Big30Page/></AppProvider>)
const fill=async(user:ReturnType<typeof userEvent.setup>,label:string,value:string)=>{
  await user.click(screen.getByLabelText(label));await user.paste(value)
}

test('builds and copies a purpose-specific prompt from long notes, then practises a saved personal answer with fading support',async()=>{
  const user=userEvent.setup();open()
  await user.click(screen.getByRole('button',{name:/How was your weekend/}))
  await user.click(screen.getByRole('tab',{name:'My Answer'}))
  await fill(user,'What I want to say','周末和家人去吃饭。我讲了很多工作细节，但重点是妈妈做了我最喜欢的咖喱。')
  const prompt=screen.getByLabelText('Prompt to copy') as HTMLTextAreaElement
  expect(prompt.value).toContain('How was your weekend?')
  expect(prompt.value).toContain('Give a natural short answer with one memorable detail.')
  expect(prompt.value).toContain('narrating every hour')
  expect(prompt.value).toContain('妈妈')
  expect(prompt.value).toContain('Do not invent')
  expect(prompt.value).toContain('30 seconds')
  await user.selectOptions(screen.getByLabelText('Answer length'),'60')
  expect(prompt.value).toContain('60 seconds')
  await user.click(screen.getByRole('button',{name:'Copy AI prompt'}))
  expect(await navigator.clipboard.readText()).toBe(prompt.value)
  await fill(user,'My spoken answer','My weekend was relaxed. I had lunch with my family, and Mum made my favourite curry. That was the best part.')
  await fill(user,'Recall keywords','relaxed · family lunch · Mum’s curry')
  await fill(user,'Useful chunks','The best part was ...')
  await user.click(screen.getByRole('button',{name:'Practise my answer'}))
  const practice=screen.getByRole('tabpanel',{name:'Practice'})
  expect(within(practice).getByText(/My weekend was relaxed\./)).toBeInTheDocument()
  await user.click(screen.getByRole('button',{name:'Recall'}))
  expect(within(practice).queryByText(/My weekend was relaxed\./)).not.toBeInTheDocument()
  expect(within(practice).getByText('relaxed · family lunch · Mum’s curry')).toBeInTheDocument()
  await user.click(screen.getByRole('button',{name:'Free'}))
  expect(within(practice).queryByText('relaxed · family lunch · Mum’s curry')).not.toBeInTheDocument()
  expect(loadState().completedQuestions).toEqual(defaultState.completedQuestions)
  const restored=importState(exportState(loadState()))
  expect(restored.big30Answers.q5).toMatchObject({notes:expect.stringContaining('妈妈'),targetSeconds:60,answer:expect.stringContaining('favourite curry'),keywords:'relaxed · family lunch · Mum’s curry'})
  const backup=await importBackup(await exportBackup(loadState()))
  expect(backup.big30Answers.q5).toEqual(restored.big30Answers.q5)
})

test('keeps each question’s answer separate after switching questions and reloading',async()=>{
  const user=userEvent.setup();const first=open()
  await user.click(screen.getByRole('button',{name:/How was your weekend/}))
  await user.click(screen.getByRole('tab',{name:'My Answer'}))
  await fill(user,'What I want to say','A quiet weekend at home.')
  await fill(user,'My spoken answer','I stayed home and enjoyed a quiet weekend.')
  await user.click(screen.getByRole('button',{name:'All questions'}))
  await user.click(screen.getByRole('button',{name:/Tell me about yourself/}))
  await user.click(screen.getByRole('tab',{name:'My Answer'}))
  expect(screen.getByLabelText('What I want to say')).toHaveValue('')
  expect((screen.getByLabelText('Prompt to copy') as HTMLTextAreaElement).value).toContain('Create a friendly overview')
  first.unmount();open()
  await user.click(screen.getByRole('button',{name:/How was your weekend/}))
  await user.click(screen.getByRole('tab',{name:'My Answer'}))
  expect(screen.getByLabelText('What I want to say')).toHaveValue('A quiet weekend at home.')
  expect(screen.getByLabelText('My spoken answer')).toHaveValue('I stayed home and enjoyed a quiet weekend.')
})

test('provides manual copying when clipboard access fails and keeps AI notes out of the speaking memo',async()=>{
  const user=userEvent.setup();open()
  await user.click(screen.getByRole('button',{name:/How was your weekend/}))
  await fill(user,'Speaking memo','My existing memo')
  await user.click(screen.getByRole('tab',{name:'My Answer'}))
  expect(screen.getByRole('button',{name:'Copy AI prompt'})).toBeDisabled()
  await fill(user,'What I want to say','My separate long story')
  vi.spyOn(navigator.clipboard,'writeText').mockRejectedValue(new Error('Blocked'))
  await user.click(screen.getByRole('button',{name:'Copy AI prompt'}))
  expect(screen.getByRole('status')).toHaveTextContent('copy manually')
  expect(screen.getByLabelText('Prompt to copy')).toHaveFocus()
  expect(loadState().memos.q5).toBe('My existing memo')
})
