import { render, screen } from '@testing-library/react'
import { useLocation } from 'react-router-dom'
import { afterEach, expect, test } from 'vitest'
import AppRouter from './AppRouter'

function LocationProbe() {
  return <p>{useLocation().pathname}</p>
}

afterEach(() => {
  window.location.hash = ''
})

test('reads application routes from the URL hash', () => {
  window.location.hash = '#/app/notebook'

  render(
    <AppRouter>
      <LocationProbe />
    </AppRouter>,
  )

  expect(screen.getByText('/app/notebook')).toBeInTheDocument()
})
