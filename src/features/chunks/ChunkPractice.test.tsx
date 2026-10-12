import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { AppProvider } from '../../context/AppContext'
import { defaultState } from '../../data/seed'
import NotebookPage from '../../pages/NotebookPage'
import { exportState, importState, loadState } from '../../services/storage'

const fill=async(user:ReturnType<typeof userEvent.setup>,label:string,value:string)=>{
  await user.click(screen.getByLabelText(label))
  await user.paste(value)
}
const key = 'fluency-reset-state-v1'
const phrase = {...defaultState.phrases[0], id:'my-frame', text:"I'm trying to ...", meaning:'Describe something you are making an effort to do.', whenToUse:'Discuss a current effort.', example:"I'm trying to finish my report.", personalExample:'',practised:0,used:0}
beforeEach(() => {
  localStorage.clear()
  localStorage.setItem(key, JSON.stringify({...defaultState, phrases:[phrase], pinnedPhraseIds:[], libraryTab:'Speaking Phrases'}))
})
afterEach(cleanup)
const openLibrary = () => render(<MemoryRouter><AppProvider><NotebookPage/></AppProvider></MemoryRouter>)

test('saves a personal chunk with context and source and retains it across reload and backup', async () => {
  const user=userEvent.setup()
  const first=openLibrary()
  await user.click(screen.getByRole('tab',{name:'Chunk Practice'}))
  await user.click(screen.getByRole('button',{name:'Add chunk'}))
  await fill(user,'Phrase', 'Could we reschedule?')
  await fill(user,'Simple meaning', 'Ask to change a planned time.')
  await fill(user,'When to use', 'A meeting time no longer works.')
  await fill(user,'Source (optional)', 'My meeting notes')
  await fill(user,'Recall cue', 'Ask to move a meeting to another time.')
  await user.click(screen.getByRole('button',{name:'Save phrase'}))
  first.unmount()
  openLibrary()
  expect(screen.getByRole('tab',{name:'Chunk Practice'})).toHaveAttribute('aria-selected','true')
  const restored=importState(exportState(loadState()))
  expect(restored.libraryTab).toBe('Chunk Practice')
  expect(restored.phrases.find(p=>p.text==='Could we reschedule?')).toMatchObject({source:'My meeting notes',recallCue:'Ask to move a meeting to another time.',chunkKind:'Fixed expression'})
})

test('personalises a legacy phrase, hides it for recall and saves only explicit self-reported use', async () => {
  const user=userEvent.setup()
  openLibrary()
  await user.click(screen.getByRole('button',{name:'Practise chunk'}))
  await user.click(screen.getByRole('button',{name:'Next: make it yours'}))
  await fill(user,'My first sentence', "I'm trying to explain the issue clearly.")
  await fill(user,'Another situation', "I'm trying to walk every morning.")
  await user.click(screen.getByRole('button',{name:'Save sentences and recall'}))
  const dialog=screen.getByRole('dialog')
  expect(within(dialog).queryByText("I'm trying to ...")).not.toBeInTheDocument()
  expect(within(dialog).queryByText("I'm trying to explain the issue clearly.")).not.toBeInTheDocument()
  await user.click(screen.getByRole('button',{name:'Next: speak freely'}))
  expect(screen.getByText(/recording is not supported/i)).toBeInTheDocument()
  await user.click(screen.getByRole('button',{name:'I finished speaking'}))
  await user.click(screen.getByRole('button',{name:'With help'}))
  const saved=JSON.parse(localStorage.getItem(key)!)
  expect(saved.phrases[0]).toMatchObject({personalExample:"I'm trying to explain the issue clearly.",variations:["I'm trying to walk every morning."],practised:1,used:0,chunkReview:{timesReviewed:1,step:0,lastRating:'With help'}})
  expect(Date.parse(saved.phrases[0].chunkReview.nextReviewAt)-Date.parse(saved.phrases[0].chunkReview.lastReviewedAt)).toBe(86400000)
  expect(saved.practiceResults).toEqual([])
  await user.click(screen.getByRole('button',{name:'Back to library'}))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

test('starter collection does not duplicate matching expressions or overwrite personal edits', async () => {
  localStorage.setItem(key,JSON.stringify({...defaultState,libraryTab:'Speaking Phrases',phrases:[{...phrase,text:'That makes sense.',personalExample:'My original personal example'}]}))
  const user=userEvent.setup()
  openLibrary()
  await user.click(screen.getByRole('tab',{name:'Chunk Practice'}))
  await user.click(screen.getByRole('button',{name:'Add starter collection'}))
  const first=loadState()
  expect(first.phrases.filter(p=>p.text.toLowerCase()==='that makes sense.')).toHaveLength(1)
  expect(first.phrases.find(p=>p.id==='my-frame')?.personalExample).toBe('My original personal example')
  expect(first.phrases.some(p=>p.text==='Works for me.')).toBe(true)
  await user.click(screen.getByRole('button',{name:'Add starter collection'}))
  expect(loadState().phrases).toHaveLength(first.phrases.length)
})
