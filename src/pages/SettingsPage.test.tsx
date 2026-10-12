import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'
import { AppProvider } from '../context/AppContext'
import { loadState } from '../services/storage'
import { speechController } from '../services/speechController'
import SettingsPage from './SettingsPage'

beforeEach(() => localStorage.clear())
test('saving Heart does not download it', () => {
  render(<AppProvider><SettingsPage/></AppProvider>)
  fireEvent.click(screen.getByRole('button', { name: /Natural Female · Heart/ }))
  expect(speechController.getSnapshot().phase).toBe('idle')
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
  expect(loadState().preferences.speechEngine).toBe('heart')
  expect(screen.getByRole('button', { name: 'Download & preview Heart' })).toBeInTheDocument()
  expect(speechController.getSnapshot().phase).toBe('idle')
})
