import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import Races from './Races.jsx'
import sampleData from '../data/sampleData.js'

test('renders the Tour de France races with the active one marked Viewing', () => {
  render(<Races data={sampleData} race="tdf-2026" setRace={() => {}} />)
  expect(screen.getByText('Choose competition')).toBeInTheDocument()
  expect(screen.getByText('Viewing')).toBeInTheDocument()
  expect(screen.getByText('Won by Aaron')).toBeInTheDocument()
})

test('clicking a race selects it', async () => {
  const setRace = vi.fn()
  render(<Races data={sampleData} race="tdf-2026" setRace={setRace} />)
  await userEvent.click(screen.getByText('Tour de France 2025'))
  expect(setRace).toHaveBeenCalledWith('tdf-2025')
})
