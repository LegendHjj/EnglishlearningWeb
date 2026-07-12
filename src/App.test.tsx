import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { AppProvider } from './context/AppContext'
import { defaultState } from './data/seed'

const renderApp = (route = '/') => render(
  <AppProvider><MemoryRouter initialEntries={[route]}><App /></MemoryRouter></AppProvider>,
)

beforeEach(() => localStorage.clear())
afterEach(cleanup)

test('renders the speaking reset landing page', () => {
  renderApp()
  expect(screen.getByRole('heading', { name: /you understand english/i })).toBeInTheDocument()
  expect(screen.getAllByRole('link', { name: /start my speaking reset/i })).toHaveLength(2)
})

test('sends a first-time user from the app to onboarding', async () => {
  renderApp('/app')
  expect(await screen.findByRole('heading', { name: /what is your current speaking level/i })).toBeInTheDocument()
})

test('sends a returning user away from onboarding to the dashboard', async () => {
  localStorage.setItem('fluency-reset-state-v1', JSON.stringify({
    ...defaultState,
    preferences: { ...defaultState.preferences, onboarded: true },
  }))

  renderApp('/onboarding')
  expect(await screen.findByRole('heading', { name: /build your speaking reflex/i })).toBeInTheDocument()
})

test('landing start action sends returning users to the app', () => {
  localStorage.setItem('fluency-reset-state-v1', JSON.stringify({
    ...defaultState,
    preferences: { ...defaultState.preferences, onboarded: true },
  }))

  renderApp()
  expect(screen.getByRole('link', { name: /start free/i })).toHaveAttribute('href', '/app')
})
