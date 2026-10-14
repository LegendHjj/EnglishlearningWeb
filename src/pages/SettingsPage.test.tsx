import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom'
import VocabularyTab from '../features/vocabulary/VocabularyTab'
import { AppProvider } from '../context/AppContext'
import { loadState } from '../services/storage'
import { speechController } from '../services/speechController'
import SettingsPage from './SettingsPage'

beforeEach(() => localStorage.clear())
afterEach(() => { cleanup(); vi.restoreAllMocks() })
test('selecting Heart persists immediately and other pages use it without Save changes', () => {
  const speak = vi.spyOn(speechController, 'speak').mockImplementation(() => {})
  render(<MemoryRouter><AppProvider><Link to="/library">Library</Link><Routes><Route path="/" element={<SettingsPage/>}/><Route path="/library" element={<VocabularyTab/>}/></Routes></AppProvider></MemoryRouter>)
  fireEvent.click(screen.getByRole('button', { name: /Natural Female · Heart/ }))
  expect(loadState().preferences.speechEngine).toBe('heart')
  expect(speak).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('link', { name: 'Library' }))
  fireEvent.click(screen.getByRole('button', { name: 'Listen to achieve' }))
  expect(speak).toHaveBeenCalledWith(expect.objectContaining({ engine: 'heart', items: ['achieve'] }))
})

test('changing voice preserves unsaved practice edits and survives remount', () => {
  const view = render(<AppProvider><SettingsPage/></AppProvider>)
  fireEvent.change(screen.getByRole('textbox', { name: 'Your name' }), { target: { value: 'Draft name' } })
  fireEvent.click(screen.getByRole('button', { name: /Natural Female · Heart/ }))
  expect(screen.getByRole('textbox', { name: 'Your name' })).toHaveValue('Draft name')
  expect(loadState().preferences.name).not.toBe('Draft name')
  view.unmount()
  render(<AppProvider><SettingsPage/></AppProvider>)
  expect(screen.getByRole('button', { name: /Natural Female · Heart/ })).toHaveAttribute('aria-pressed', 'true')
  fireEvent.click(screen.getByRole('button', { name: /Male Prefer a male/ }))
  expect(loadState().preferences.speechEngine).toBe('browser')
  expect(loadState().preferences.voiceGender).toBe('male')
})
test('saving Heart does not download it', () => {
  render(<AppProvider><SettingsPage/></AppProvider>)
  fireEvent.click(screen.getByRole('button', { name: /Natural Female · Heart/ }))
  expect(speechController.getSnapshot().phase).toBe('idle')
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
  expect(loadState().preferences.speechEngine).toBe('heart')
  expect(screen.getByRole('button', { name: 'Download & preview Heart' })).toBeInTheDocument()
  expect(speechController.getSnapshot().phase).toBe('idle')
})
