import { useEffect, useState } from 'react'
import sampleData from './sampleData.js'

// Fetch the committed per-race dataset; fall back to the bundled placeholder
// (used as a safety net for a real race whose file fails to load).
export async function fetchRaceData(raceId) {
  try {
    const res = await fetch(`/data/${raceId}.json`)
    if (!res.ok) return sampleData
    return await res.json()
  } catch {
    return sampleData
  }
}

function isUpcoming(raceId) {
  const race = sampleData.races.find(r => r.id === raceId)
  return Boolean(race && race.status === 'Upcoming')
}

// Lightweight view for a not-yet-started race: enough for the selector (races)
// and theme/notice (meta.raceId + name), with no fake standings.
function upcomingData(raceId) {
  const race = sampleData.races.find(r => r.id === raceId)
  return {
    upcoming: true,
    meta: { raceId, name: race ? race.name : raceId },
    races: sampleData.races,
  }
}

function viewFor(raceId) {
  return isUpcoming(raceId) ? upcomingData(raceId) : sampleData
}

export default function useLeagueData(raceId) {
  const [data, setData] = useState(() => viewFor(raceId))
  useEffect(() => {
    setData(viewFor(raceId)) // keep state in sync when raceId changes
    // Upcoming races never fetch; in test mode component tests stay synchronous.
    if (isUpcoming(raceId) || import.meta.env.MODE === 'test') return
    let alive = true
    fetchRaceData(raceId).then(d => { if (alive) setData(d) })
    return () => { alive = false }
  }, [raceId])
  return data
}
