import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import RecordingPlayer from './RecordingPlayer'

beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
})

test('large control follows the real audio play and pause state', () => {
  render(<RecordingPlayer src="blob:test" label="Test answer" />)
  const audio = screen.getByTestId('recording-audio')

  fireEvent.click(screen.getByRole('button', { name: /play test answer/i }))
  expect(HTMLMediaElement.prototype.play).toHaveBeenCalled()

  fireEvent.play(audio)
  expect(screen.getByRole('button', { name: /pause test answer/i })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /pause test answer/i }))
  expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled()
})
