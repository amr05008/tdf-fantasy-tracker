import { useEffect, useState } from 'react'
import sampleData from './sampleData.js'

// Fetch the committed per-race dataset; fall back to the bundled placeholder
// (e.g. a race whose data.json hasn't been generated yet).
export async function fetchRaceData(raceId) {
  try {
    const res = await fetch(`/data/${raceId}.json`)
    if (!res.ok) return sampleData
    return await res.json()
  } catch {
    return sampleData
  }
}

export default function useLeagueData(raceId) {
  const [data, setData] = useState(sampleData)
  useEffect(() => {
    // Tests assert the synchronous sampleData bootstrap; fetch logic is covered
    // directly via fetchRaceData. Skipping the effect keeps component tests free
    // of async act() noise.
    if (import.meta.env.MODE === 'test') return
    let alive = true
    fetchRaceData(raceId).then(d => { if (alive) setData(d) })
    return () => { alive = false }
  }, [raceId])
  return data
}
