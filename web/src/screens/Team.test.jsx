import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import Team from './Team.jsx'
import sampleData from '../data/sampleData.js'

function Harness({ openRider = () => {}, openDraft = () => {} }) {
  const [team, setTeam] = useState('Aaron')
  return <Team data={sampleData} team={team} setTeam={setTeam} showMovement={true} openRider={openRider} openDraft={openDraft} />
}

test('shows your team with You badge and Edit button', () => {
  render(<Harness />)
  expect(screen.getByText('You')).toBeInTheDocument()
  expect(screen.getByText('Tadej Pogačar')).toBeInTheDocument()
  expect(screen.getByText('Edit your picks')).toBeInTheDocument()
  expect(screen.getByText('+6:41 behind')).toBeInTheDocument()
})

test('selecting another chip swaps the team and hides Edit button', async () => {
  render(<Harness />)
  await userEvent.click(screen.getByText('Nate'))
  expect(screen.getByText('Leads by 1:18')).toBeInTheDocument()
  expect(screen.queryByText('Edit your picks')).not.toBeInTheDocument()
})

test('clicking a rider card opens the rider', async () => {
  const openRider = vi.fn()
  render(<Harness openRider={openRider} />)
  await userEvent.click(screen.getByText('Tadej Pogačar'))
  expect(openRider).toHaveBeenCalledWith('Tadej Pogačar')
})
