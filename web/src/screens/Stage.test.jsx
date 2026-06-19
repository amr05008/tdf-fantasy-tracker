import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Stage from './Stage.jsx'
import sampleData from '../data/sampleData.js'

test('renders stage header, winner, movers, and your riders', () => {
  render(<Stage data={sampleData} openRider={() => {}} />)
  expect(screen.getByText('Pau → Luchon-Superbagnères')).toBeInTheDocument()
  expect(screen.getByText('Oscar Onley')).toBeInTheDocument()
  expect(screen.getByText('Takes the yellow jersey')).toBeInTheDocument()
  expect(screen.getByText('Holds GC #1')).toBeInTheDocument()
})

test('clicking a "your riders today" card opens that rider', async () => {
  const openRider = vi.fn()
  render(<Stage data={sampleData} openRider={openRider} />)
  await userEvent.click(screen.getByText('Kévin Vauquelin'))
  expect(openRider).toHaveBeenCalledWith('Kévin Vauquelin')
})
