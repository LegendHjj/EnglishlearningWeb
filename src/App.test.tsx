import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, test } from 'vitest'
import App from './App'

test('renders the speaking reset landing page', () => {
  render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>)
  expect(screen.getByRole('heading', { name: /you understand english/i })).toBeInTheDocument()
  expect(screen.getAllByRole('link', { name: /start my speaking reset/i })).toHaveLength(2)
})
