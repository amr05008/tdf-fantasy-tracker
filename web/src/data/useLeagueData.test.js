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
