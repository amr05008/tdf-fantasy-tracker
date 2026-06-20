import { renderHook } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import useLeagueData, { fetchRaceData } from './useLeagueData.js'
import sampleData from './sampleData.js'

afterEach(() => { vi.unstubAllGlobals() })

test('fetchRaceData returns parsed JSON on a 200', async () => {
  const payload = { meta: { raceId: 'tdf-2025' }, teams: [] }
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => payload })))
  expect(await fetchRaceData('tdf-2025')).toEqual(payload)
})

test('fetchRaceData falls back to sampleData on a non-OK response', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false })))
  expect(await fetchRaceData('tdf-2099')).toBe(sampleData)
})

test('fetchRaceData falls back to sampleData when fetch throws', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline') }))
  expect(await fetchRaceData('tdf-2025')).toBe(sampleData)
})

test('hook returns sampleData synchronously (no fetch in test mode)', () => {
  const { result } = renderHook(() => useLeagueData('tdf-2025'))
  expect(result.current).toBe(sampleData)
})

test('an upcoming race returns the upcoming view without fetching', () => {
  const fetchSpy = vi.fn()
  vi.stubGlobal('fetch', fetchSpy)
  const { result } = renderHook(() => useLeagueData('tdf-2026'))
  expect(result.current.upcoming).toBe(true)
  expect(result.current.meta.raceId).toBe('tdf-2026')
  expect(result.current.races).toBe(sampleData.races)
  expect(fetchSpy).not.toHaveBeenCalled()
})
