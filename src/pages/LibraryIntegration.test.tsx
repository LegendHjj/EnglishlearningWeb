import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from '../App'
import AppShell from '../components/AppShell'
import { AppProvider } from '../context/AppContext'
import { defaultState } from '../data/seed'
import NotebookPage from './NotebookPage'
import MissionPage from './MissionPage'

const saved={...defaultState,preferences:{...defaultState.preferences,onboarded:true}}
beforeEach(()=>{localStorage.clear();localStorage.setItem('fluency-reset-state-v1',JSON.stringify(saved))})
afterEach(cleanup)

test('Library remembers its selected tab and phrase meaning does not overwrite when-to-use',async()=>{
  const user=userEvent.setup();render(<MemoryRouter><AppProvider><NotebookPage/></AppProvider></MemoryRouter>)
  await user.click(screen.getByRole('tab',{name:'Speaking Phrases'}))
  await user.click(screen.getAllByRole('button',{name:/edit phrase/i})[0])
  const meaning=screen.getByLabelText(/simple meaning/i);const when=screen.getByLabelText(/when to use/i);const original=when.getAttribute('value')||String((when as HTMLTextAreaElement).value)
  fireEvent.change(meaning,{target:{value:'A changed meaning'}})
  expect(when).toHaveValue(original)
  await user.click(screen.getByRole('button',{name:/cancel/i}))
  expect(JSON.parse(localStorage.getItem('fluency-reset-state-v1')||'{}').libraryTab).toBe('Speaking Phrases')
},10000)

test('dashboard keeps mission primary and shows compact vocabulary review',async()=>{
  render(<MemoryRouter initialEntries={['/app']}><AppProvider><App/></AppProvider></MemoryRouter>)
  expect(await screen.findByRole('button',{name:/start today’s speaking mission/i})).toBeInTheDocument()
  expect(await screen.findByText(/vocabulary review/i)).toBeInTheDocument()
  expect(await screen.findByRole('button',{name:/quick add/i})).toBeInTheDocument()
})

test('mobile More menu exposes recordings, progress, and settings',()=>{
  render(<MemoryRouter><AppProvider><AppShell/></AppProvider></MemoryRouter>)
  expect(screen.getByText('More')).toBeInTheDocument()
  expect(screen.getAllByRole('link',{name:/progress/i}).length).toBeGreaterThan(0)
  expect(screen.getAllByRole('link',{name:/settings/i}).length).toBeGreaterThan(0)
  expect(screen.getAllByRole('link',{name:/recordings/i}).length).toBeGreaterThan(0)
})

test('pins vocabulary during mission preparation and shows Follow support',async()=>{
  localStorage.setItem('fluency-reset-state-v1',JSON.stringify({...saved,pinnedPhraseIds:[],pinnedVocabularyIds:[]}))
  const user=userEvent.setup();render(<MemoryRouter initialEntries={['/app/mission?mission=m1']}><AppProvider><MissionPage/></AppProvider></MemoryRouter>)
  await user.click(screen.getByRole('button',{name:/prepare my answer/i}))
  await user.click(screen.getByRole('button',{name:/achieve/i}))
  await user.click(screen.getByRole('button',{name:/ready to speak/i}))
  expect(screen.getByText('实现；达到')).toBeInTheDocument()
  expect(screen.getByText(/achieve a goal/i)).toBeInTheDocument()
})
