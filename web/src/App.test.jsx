import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App.jsx'

test('renders brand bar and standings by default', () => {
  render(<App />)
  expect(screen.getByText('Sunshine Fantasy')).toBeInTheDocument()
  expect(screen.getByText('standings screen')).toBeInTheDocument()
})

test('switching tabs changes the screen and clears sub-screens', async () => {
  render(<App />)
  await userEvent.click(screen.getByText('Team'))
  expect(screen.getByText('team screen')).toBeInTheDocument()
  await userEvent.click(screen.getByText('Races'))
  expect(screen.getByText('races screen')).toBeInTheDocument()
})
