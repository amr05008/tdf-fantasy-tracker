import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App.jsx'

test('renders brand bar and standings by default', () => {
  render(<App />)
  expect(screen.getByText('Sunshine Fantasy')).toBeInTheDocument()
  expect(screen.getByText('Tour de France 2026')).toBeInTheDocument()
})

test('switching tabs changes the screen and clears sub-screens', async () => {
  render(<App />)
  await userEvent.click(screen.getAllByText('Team')[0])
  expect(screen.getByText('Edit your picks')).toBeInTheDocument()
  await userEvent.click(screen.getByText('Races'))
  expect(screen.getByText('Choose competition')).toBeInTheDocument()
})

test('accent follows the displayed dataset, not the selected race (no half-swap)', async () => {
  const { container } = render(<App />)
  const root = container.firstChild
  // Tour Yellow accent on load
  expect(root.style.getPropertyValue('--accent')).toBe('#F2C200')
  // Selecting Giro must NOT repaint the panel pink while Tour data is still shown
  await userEvent.click(screen.getByText('Races'))
  await userEvent.click(screen.getByText("Giro d'Italia 2026"))
  expect(root.style.getPropertyValue('--accent')).toBe('#F2C200')
})
