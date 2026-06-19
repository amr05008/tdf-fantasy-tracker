import sampleData from '../data/sampleData.js'
import {
  buildStandingsRows, buildTeamView, buildRiderProfile, buildDraftView, buildRaceCards,
} from './selectors.js'

const { teams, draftPool, races } = sampleData

test('buildStandingsRows builds rows with subline and leader gap color', () => {
  const rows = buildStandingsRows(teams)
  expect(rows).toHaveLength(6)
  const nate = rows[0]
  expect(nate.isLeader).toBe(true)
  expect(nate.gap).toBe('Leader')
  expect(nate.gapColorVar).toBe('var(--accent-ink)')
  expect(nate.subline).toBe('Lipowitz  ·  Almeida  ·  Mas')
  expect(nate.move).toEqual({ label: '▲ 1', color: '#3E8F5F' })
  expect(rows[0].rawMove).toBe(1)
  expect(rows[5].isLast).toBe(true)
  expect(rows[1].gapColorVar).toBe('#9A968D')
})

test('buildTeamView for the leader shows "Leads by" using second place gap', () => {
  const view = buildTeamView(teams, 'Nate')
  expect(view.isLeader).toBe(true)
  expect(view.gapLine).toBe('Leads by 1:18')
  expect(view.standingLine).toBe('1st of 6 overall · 3 riders')
  expect(view.riders[0].gcNum).toBe('5')
})

test('buildTeamView for Aaron marks isYou and behind gap', () => {
  const view = buildTeamView(teams, 'Aaron')
  expect(view.isYou).toBe(true)
  expect(view.gapLine).toBe('+6:41 behind')
  expect(view.riders[0].today).toEqual({ label: '– Held position', color: '#9A968D' })
})

test('buildRiderProfile resolves owner and form labels', () => {
  const rp = buildRiderProfile(teams, 'Tadej Pogačar', 11)
  expect(rp.gcRank).toBe('#1')
  expect(rp.owned).toBe('Drafted by Aaron (you)')
  expect(rp.form).toEqual([
    { label: 'St 9', place: '1st' },
    { label: 'St 10', place: '2nd' },
    { label: 'St 11', place: '1st' },
  ])
  expect(buildRiderProfile(teams, 'Nobody', 11)).toBeNull()
})

test('buildDraftView gates at three picks', () => {
  const two = buildDraftView(draftPool, ['Tadej Pogačar', 'Santiago Buitrago'])
  expect(two.full).toBe(false)
  expect(two.count).toBe('2')
  expect(two.countColor).toBe('#C25B43')
  expect(two.confirmLabel).toBe('Pick 1 more rider')
  expect(two.slots[2].filled).toBe(false)
  // pool excludes already-picked riders and is enabled while slots remain
  expect(two.pool.find(r => r.name === 'Tadej Pogačar')).toBeUndefined()
  expect(two.pool.every(r => r.disabled === false)).toBe(true)

  const three = buildDraftView(draftPool, ['Tadej Pogačar', 'Egan Bernal', 'Adam Yates'])
  expect(three.full).toBe(true)
  expect(three.countColor).toBe('#3E8F5F')
  expect(three.confirmLabel).toBe('Save team')
  expect(three.pool.every(r => r.disabled === true)).toBe(true)
})

test('buildRaceCards marks the viewing race and badges by status', () => {
  const cards = buildRaceCards(races, 'tdf-2026')
  const live = cards.find(c => c.id === 'tdf-2026')
  expect(live.viewing).toBe(true)
  expect(live.badge).toEqual({ bg: '#E6F4EC', color: '#2F7D52' })
  const complete = cards.find(c => c.id === 'tdf-2025')
  expect(complete.badge).toEqual({ bg: '#F0EEE8', color: '#8C8881' })
})
