import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import Recorder from './Recorder'
import { saveRecording } from '../services/recordingDb'

vi.mock('../hooks/useRecorder', () => ({
  useRecorder: () => ({
    blob: new Blob(['audio'], { type: 'audio/webm' }),
    pause: vi.fn(),
    reset: vi.fn(),
    seconds: 12,
    start: vi.fn(),
    status: 'ready',
    stop: vi.fn(),
    url: 'blob:test',
  }),
}))

vi.mock('../services/recordingDb', () => ({ saveRecording: vi.fn() }))

beforeEach(() => vi.mocked(saveRecording).mockReset())

test('records completion before waiting for audio storage', () => {
  vi.mocked(saveRecording).mockResolvedValue(undefined)
  const onSaved = vi.fn()

  render(<Recorder onSaved={onSaved} />)
  fireEvent.click(screen.getByRole('button', { name: /save recording/i }))

  expect(onSaved).toHaveBeenCalledWith(12)
})

test('stores the Big 30 question source with its recording', () => {
  vi.mocked(saveRecording).mockResolvedValue(undefined)

  render(<Recorder questionId="q1" recordingName="Big 30 · Tell me about yourself" />)
  fireEvent.click(screen.getByRole('button', { name: /save recording/i }))

  expect(saveRecording).toHaveBeenCalledWith(
    expect.objectContaining({ questionId: 'q1', name: 'Big 30 · Tell me about yourself' }),
    expect.any(Blob),
  )
})
