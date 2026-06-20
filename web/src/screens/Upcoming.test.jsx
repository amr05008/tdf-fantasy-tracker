import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import Upcoming from './Upcoming.jsx'

test('renders the race name and upcoming copy', () => {
  render(<Upcoming race={{ name: 'Tour de France 2026', dates: 'Jul 4 – 26, 2026' }} />)
  expect(screen.getByText('Upcoming')).toBeInTheDocument()
  expect(screen.getByText('Tour de France 2026')).toBeInTheDocument()
  expect(screen.getByText('Jul 4 – 26, 2026')).toBeInTheDocument()
  expect(screen.getByText(/Standings will appear once the race begins/i)).toBeInTheDocument()
})

test('does not crash when race is undefined', () => {
  render(<Upcoming race={undefined} />)
  expect(screen.getByText('Upcoming')).toBeInTheDocument()
})
