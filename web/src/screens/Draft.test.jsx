import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import Draft from './Draft.jsx'
import sampleData from '../data/sampleData.js'

function Harness() {
  const [picks, setPicks] = useState(['Tadej Pogačar', 'Santiago Buitrago'])
  const addPick = n => setPicks(p => (p.length >= 3 || p.includes(n) ? p : [...p, n]))
  const removePick = n => setPicks(p => p.filter(x => x !== n))
  return <Draft data={sampleData} draftPicks={picks} addPick={addPick} removePick={removePick} closeSub={() => {}} />
}

test('shows two filled slots, one empty, and the pick count', () => {
  render(<Harness />)
  expect(screen.getByText('2 / 3 picked')).toBeInTheDocument()
  expect(screen.getByText('Empty — add a rider below')).toBeInTheDocument()
  expect(screen.getByText('Pick 1 more rider')).toBeInTheDocument()
})

test('adding a third rider fills the slot, gates further adds, and shows Save team', async () => {
  render(<Harness />)
  await userEvent.click(screen.getByRole('button', { name: 'add Egan Bernal' }))
  expect(screen.getByText('3 / 3 picked')).toBeInTheDocument()
  expect(screen.getByText('Save team')).toBeInTheDocument()
  expect(screen.queryByText('Empty — add a rider below')).not.toBeInTheDocument()
})

test('removing a pick empties its slot', async () => {
  render(<Harness />)
  const removeButtons = screen.getAllByRole('button', { name: 'remove' })
  await userEvent.click(removeButtons[0])
  expect(screen.getByText('1 / 3 picked')).toBeInTheDocument()
})
