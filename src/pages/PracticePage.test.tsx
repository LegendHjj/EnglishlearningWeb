import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { AppProvider } from '../context/AppContext'
import { defaultState } from '../data/seed'
import PracticePage from './PracticePage'

beforeEach(()=>{localStorage.clear();localStorage.setItem('fluency-reset-state-v1',JSON.stringify({...defaultState,preferences:{...defaultState.preferences,onboarded:true}}))})
afterEach(cleanup)

test('renders all seven guided workout modes from the content pack',async()=>{
  const user=userEvent.setup();render(<MemoryRouter><AppProvider><PracticePage/></AppProvider></MemoryRouter>)
  for(const label of ['Mouth Reps','Tight Build','Loose Story','Free Response','Echo & Shadow','Repair Lab','Fluency Sprint'])expect(screen.getByRole('button',{name:new RegExp(label,'i')})).toBeInTheDocument()
  await user.click(screen.getByRole('button',{name:/repair lab/i}))
  expect(screen.getByText(/mind goes blank/i)).toBeInTheDocument()
  expect(screen.getByText(/keep the conversation moving/i)).toBeInTheDocument()
})
