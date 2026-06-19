import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RiderProfile from './RiderProfile.jsx'
import sampleData from '../data/sampleData.js'

test('renders rider header, stats, form, and owner', () => {
  render(<RiderProfile data={sampleData} name="Tadej Pogačar" closeSub={() => {}} />)
  expect(screen.getByText('Tadej Pogačar')).toBeInTheDocument()
  expect(screen.getByText('UAE Team Emirates')).toBeInTheDocument()
  expect(screen.getByText('#1')).toBeInTheDocument()
  expect(screen.getByText('Drafted by Aaron (you)')).toBeInTheDocument()
  expect(screen.getByText('St 11')).toBeInTheDocument()
})

test('back link closes the sub-screen', async () => {
  const closeSub = vi.fn()
  render(<RiderProfile data={sampleData} name="Tadej Pogačar" closeSub={closeSub} />)
  await userEvent.click(screen.getByText('Back'))
  expect(closeSub).toHaveBeenCalled()
})
