import { Blob as NodeBlob } from 'node:buffer'
import { webcrypto } from 'node:crypto'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AppProvider } from '../../context/AppContext'
import SettingsPage from '../../pages/SettingsPage'
import { getInstalledVoicePack } from '../../services/voicePack'
import { loadState } from '../../services/storage'
import { enableVoicePackLocks, makeVoicePack } from '../../test/voicePackFixture'

beforeEach(async () => {
  localStorage.clear(); vi.stubGlobal('crypto', webcrypto)
  enableVoicePackLocks()
  await new Promise<void>(resolve => { const request = indexedDB.deleteDatabase('fluency-reset-voice-packs'); request.onsuccess = () => resolve() })
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

test('Settings previews and imports real audio while preserving practice edits and existing content', async () => {
  render(<MemoryRouter><AppProvider><SettingsPage/></AppProvider></MemoryRouter>)
  const phrases = loadState().phrases.length
  fireEvent.change(screen.getByRole('textbox', { name: 'Your name' }), { target: { value: 'Unsaved draft' } })
  const blob = await makeVoicePack()
  fireEvent.change(screen.getByLabelText('Voice pack ZIP'), { target: { files: [blob] } })
  expect(await screen.findByText('Test Heart')).toBeInTheDocument()
  expect(await getInstalledVoicePack()).toBeUndefined()
  fireEvent.click(screen.getByRole('button', { name: 'Import these audio clips' }))
  expect(await screen.findByText(/1 audio clips ready on this device/)).toBeInTheDocument()
  expect((await getInstalledVoicePack())?.count).toBe(1)
  expect(loadState().phrases).toHaveLength(phrases)
  expect(screen.getByRole('textbox', { name: 'Your name' })).toHaveValue('Unsaved draft')
  fireEvent.click(screen.getByRole('button', { name: 'Use Heart for Listen buttons' }))
  await waitFor(() => expect(loadState().preferences.speechEngine).toBe('heart'))
  expect(screen.getByRole('textbox', { name: 'Your name' })).toHaveValue('Unsaved draft')
})

test('an invalid ZIP produces a useful error and no installation', async () => {
  render(<MemoryRouter><AppProvider><SettingsPage/></AppProvider></MemoryRouter>)
  fireEvent.change(screen.getByLabelText('Voice pack ZIP'), { target: { files: [new NodeBlob(['invalid'])] } })
  expect(await screen.findByRole('alert')).toHaveTextContent(/ZIP/)
  expect(await getInstalledVoicePack()).toBeUndefined()
})
