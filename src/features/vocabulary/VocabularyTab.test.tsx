import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { AppProvider } from '../../context/AppContext'
import { defaultState } from '../../data/seed'
import VocabularyTab from './VocabularyTab'

const renderTab=(state=defaultState)=>{
  localStorage.setItem('fluency-reset-state-v1',JSON.stringify(state))
  return render(<MemoryRouter><AppProvider><VocabularyTab/></AppProvider></MemoryRouter>)
}
beforeEach(()=>localStorage.clear())
afterEach(cleanup)

test('quick adds an incomplete word and makes it searchable',async()=>{
  const user=userEvent.setup();renderTab({...defaultState,vocabulary:[]})
  await user.click(screen.getByRole('button',{name:/add word/i}))
  await user.click(screen.getByRole('tab',{name:/quick add/i}))
  await user.type(screen.getByLabelText(/^english word$/i),'adapt')
  await user.click(screen.getByRole('button',{name:/save word/i}))
  expect(screen.getByRole('heading',{name:'adapt'})).toBeInTheDocument()
  expect(screen.getAllByText(/needs details/i).length).toBeGreaterThan(0)
  await user.type(screen.getByLabelText(/search vocabulary/i),'missing')
  expect(screen.queryByRole('heading',{name:'adapt'})).not.toBeInTheDocument()
})

test('previews pasted ChatGPT fields before saving',async()=>{
  const user=userEvent.setup();renderTab({...defaultState,vocabulary:[]})
  await user.click(screen.getByRole('button',{name:/add word/i}))
  await user.click(screen.getByRole('tab',{name:/paste and detect/i}))
  await user.type(screen.getByLabelText(/paste vocabulary content/i),'**English:** clarify\nChinese Meaning: 澄清\nDefinition: make something clear')
  await user.click(screen.getByRole('button',{name:/detect fields/i}))
  expect(screen.getByRole('status')).toHaveTextContent(/detected 3 fields/i)
  expect(screen.getByLabelText(/^english$/i)).toHaveValue('clarify')
  await user.click(screen.getByRole('button',{name:/save word/i}))
  expect(screen.getByRole('heading',{name:'clarify'})).toBeInTheDocument()
})

test('adds a collocation to speaking phrases from word details',async()=>{
  const user=userEvent.setup();renderTab({...defaultState,vocabulary:[{...defaultState.vocabulary[0],commonCollocations:['achieve a goal']}]})
  await user.click(screen.getByRole('button',{name:/open achieve details/i}))
  const row=screen.getByText('achieve a goal').closest('li')!
  await user.click(within(row).getByRole('button',{name:/add to speaking phrases/i}))
  expect(screen.getByRole('status')).toHaveTextContent(/added to speaking phrases/i)
})

test('shows feedback when combined support pin limit is reached',async()=>{
  const user=userEvent.setup();renderTab({...defaultState,pinnedPhraseIds:['p1','p2','p3'],pinnedVocabularyIds:[]})
  await user.click(screen.getByRole('button',{name:/open achieve details/i}))
  await user.click(screen.getByRole('button',{name:/use in speaking/i}))
  expect(screen.getByRole('status')).toHaveTextContent(/pin up to 3 support items/i)
})

test('reviews a due word after revealing the answer',async()=>{
  const user=userEvent.setup();renderTab({...defaultState,vocabulary:[{...defaultState.vocabulary[0],nextReviewAt:'2020-01-01T00:00:00.000Z'}]})
  await user.click(screen.getByRole('button',{name:/review now/i}))
  expect(screen.getByText(/recall the meaning/i)).toBeInTheDocument()
  await user.click(screen.getByRole('button',{name:/reveal answer/i}))
  await user.click(screen.getByRole('button',{name:'Good'}))
  expect(screen.getByRole('heading',{name:/review complete/i})).toBeInTheDocument()
  expect(screen.getByText(/1 word reviewed/i)).toBeInTheDocument()
})

test('opening a review over speaking word details cancels covered playback',async()=>{
  const user=userEvent.setup();const cancel=vi.fn(),speak=vi.fn()
  vi.stubGlobal('speechSynthesis',{speak,cancel,getVoices:()=>[]})
  vi.stubGlobal('SpeechSynthesisUtterance',class {constructor(public text:string){}})
  renderTab({...defaultState,vocabulary:[{...defaultState.vocabulary[0],nextReviewAt:'2020-01-01T00:00:00.000Z'}]})
  await user.click(screen.getByRole('button',{name:/open achieve details/i}))
  await user.click(screen.getByRole('button',{name:'Listen & Recap'}))
  expect(speak).toHaveBeenCalled()
  cancel.mockClear()
  await user.click(screen.getAllByRole('button',{name:'Review now'})[1])
  expect(cancel).toHaveBeenCalled()
  expect(screen.getByText(/recall the meaning/i)).toBeInTheDocument()
  vi.unstubAllGlobals()
})

test('manual add, status filter, edit, and delete work end to end',async()=>{
  const user=userEvent.setup();vi.stubGlobal('confirm',()=>true);renderTab({...defaultState,vocabulary:[]})
  await user.click(screen.getByRole('button',{name:/add word/i}))
  await user.click(screen.getByRole('tab',{name:/manual entry/i}))
  await user.type(screen.getByLabelText(/^english$/i),'dependable')
  await user.type(screen.getByLabelText(/^simple definition$/i),'Can be trusted.')
  await user.selectOptions(screen.getByLabelText(/learning status/i),'Usable')
  await user.click(screen.getByRole('button',{name:/save word/i}))
  await user.selectOptions(screen.getByLabelText(/status filter/i),'New')
  expect(screen.queryByRole('heading',{name:'dependable'})).not.toBeInTheDocument()
  await user.selectOptions(screen.getByLabelText(/status filter/i),'Usable')
  await user.click(screen.getByRole('button',{name:/open dependable details/i}))
  await user.click(screen.getByRole('button',{name:/edit/i}))
  const definition=screen.getByLabelText(/^simple definition$/i)
  await user.clear(definition);await user.type(definition,'Always works as expected.')
  await user.click(screen.getByRole('button',{name:/save word/i}))
  await user.click(screen.getByRole('button',{name:/open dependable details/i}))
  expect(screen.getAllByText('Always works as expected.').length).toBeGreaterThan(0)
  await user.click(screen.getByRole('button',{name:/delete/i}))
  expect(screen.queryByRole('heading',{name:'dependable'})).not.toBeInTheDocument()
})
