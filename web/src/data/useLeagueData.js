import sampleData from './sampleData.js'

// Phase 1: returns the placeholder dataset regardless of raceId.
// Phase 2 swap point: fetch('/data.json') for the active race and return
// the same shape. Components depend only on this hook, never on sampleData.
export default function useLeagueData(_raceId) {
  return sampleData
}
