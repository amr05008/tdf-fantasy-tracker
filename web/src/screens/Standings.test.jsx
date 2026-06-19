import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import Standings from './Standings.jsx'
import sampleData from '../data/sampleData.js'

function Harness() {
  const [expanded, setExpanded] = useState({ Nate: true })
  const toggle = name => setExpanded(e => ({ ...e, [name]: !e[name] }))
  return <Standings data={sampleData} expanded={expanded} toggle={toggle} showMovement={true} />
}

test('shows title, leader badge, and six teams', () => {
  render(<Harness />)
  expect(screen.getByText('Tour de France 2026')).toBeInTheDocument()
  expect(screen.getByText('Yellow Jersey')).toBeInTheDocument()
  expect(screen.getByText('Nate')).toBeInTheDocument()
  expect(screen.getByText('Jeremy')).toBeInTheDocument()
  expect(screen.getByText('Leader')).toBeInTheDocument()
})

test('leader expanded by default reveals its riders; clicking another expands it', async () => {
  render(<Harness />)
  // Nate open by default -> his rider visible
  expect(screen.getByText('Florian Lipowitz')).toBeInTheDocument()
  // Leo collapsed -> rider not shown yet
  expect(screen.queryByText('Remco Evenepoel')).not.toBeInTheDocument()
  await userEvent.click(screen.getByText('Leo'))
  expect(screen.getByText('Remco Evenepoel')).toBeInTheDocument()
})
