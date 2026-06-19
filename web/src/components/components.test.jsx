import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Badge from './Badge.jsx'
import MovementArrow from './MovementArrow.jsx'
import ProgressBar from './ProgressBar.jsx'
import TabNav from './TabNav.jsx'
import BrandBar from './BrandBar.jsx'

test('Badge renders its label', () => {
  render(<Badge kind="jersey">Yellow Jersey</Badge>)
  expect(screen.getByText('Yellow Jersey')).toBeInTheDocument()
})

test('MovementArrow hides when show is false', () => {
  const { rerender, container } = render(<MovementArrow move={1} show={true} />)
  expect(screen.getByText('▲ 1')).toBeInTheDocument()
  rerender(<MovementArrow move={1} show={false} />)
  expect(container).toBeEmptyDOMElement()
})

test('ProgressBar sets the fill width', () => {
  const { container } = render(<ProgressBar pct="52%" />)
  const fill = container.querySelector('[data-fill]')
  expect(fill).toHaveStyle({ width: '52%' })
})

test('BrandBar shows the wordmark', () => {
  render(<BrandBar />)
  expect(screen.getByText('Sunshine Fantasy')).toBeInTheDocument()
})

test('TabNav calls onSelect with the tab key', async () => {
  const onSelect = vi.fn()
  const tabs = [['Standings', 'standings'], ['Stage', 'stage']]
  render(<TabNav tabs={tabs} active="standings" onSelect={onSelect} />)
  await userEvent.click(screen.getByText('Stage'))
  expect(onSelect).toHaveBeenCalledWith('stage')
})
