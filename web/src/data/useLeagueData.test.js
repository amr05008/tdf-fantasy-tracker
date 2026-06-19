import { renderHook } from '@testing-library/react'
import useLeagueData from './useLeagueData.js'

test('useLeagueData returns the league dataset with six teams', () => {
  const { result } = renderHook(() => useLeagueData('tdf-2026'))
  expect(result.current.teams).toHaveLength(6)
  expect(result.current.teams[0].name).toBe('Nate')
  expect(result.current.races).toHaveLength(4)
  expect(result.current.draftPool.length).toBeGreaterThanOrEqual(8)
  expect(result.current.meta.stageNum).toBe(11)
  expect(result.current.movers[0]).toEqual({ name: 'Nate', move: 1, note: 'Takes the yellow jersey' })
})
