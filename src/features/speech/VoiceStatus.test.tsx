import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import VoiceStatus from './VoiceStatus'
import { speechController } from '../../services/speechController'

test('a modal owns the single visible voice status host', () => {
  const view = render(<><VoiceStatus scope="page" hostId="page"/><VoiceStatus scope="modal" hostId="modal"/></>)
  expect(speechController.getSnapshot().hostId).toBe('modal')
  view.rerender(<VoiceStatus scope="page" hostId="page"/>)
  expect(speechController.getSnapshot().hostId).toBe('page')
  view.unmount()
  expect(screen.queryByRole('status')).toBeNull()
})
