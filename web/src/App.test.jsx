import { render, screen } from '@testing-library/react'
import App from './App.jsx'

test('renders the app', () => {
  render(<App />)
  expect(screen.getByText('Sunshine Fantasy')).toBeInTheDocument()
})
