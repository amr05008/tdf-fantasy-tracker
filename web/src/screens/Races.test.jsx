import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Races from './Races.jsx'
import sampleData from '../data/sampleData.js'

test('renders four races with the active one marked Viewing', () => {
  render(<Races data={sampleData} race="tdf-2026" setRace={() => {}} />)
  expect(screen.getByText('Choose competition')).toBeInTheDocument()
  expect(screen.getByText('Viewing')).toBeInTheDocument()
  expect(screen.getByText('Won by Aaron')).toBeInTheDocument()
  expect(screen.getAllByText('Upcoming')).toHaveLength(2)
})

test('clicking a race selects it', async () => {
  const setRace = vi.fn()
  render(<Races data={sampleData} race="tdf-2026" setRace={setRace} />)
  await userEvent.click(screen.getByText("Giro d'Italia 2026"))
  expect(setRace).toHaveBeenCalledWith('giro-2026')
})
