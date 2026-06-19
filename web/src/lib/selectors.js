import { fmtMove, fmtDelta, fmtToday, surname, ordinal } from './format.js'

const MUTED = '#9A968D'
const LEADER_VAR = 'var(--accent-ink)'

export function buildStandingsRows(teams) {
  return teams.map(p => ({
    name: p.name,
    rank: String(p.rank),
    totalTime: p.total,
    gap: p.gap,
    gapColorVar: p.leader ? LEADER_VAR : MUTED,
    move: fmtMove(p.move),
    isLeader: p.leader,
    isLast: p.last,
    subline: p.riders.map(r => surname(r.name)).join('  ·  '),
    riders: p.riders.map(r => ({
      name: r.name,
      gcLabel: '#' + r.gc,
      time: r.time,
      delta: fmtDelta(r.d),
    })),
  }))
}

export function buildTeamView(teams, selectedName) {
  const sel = teams.find(p => p.name === selectedName) || teams[0]
  const second = teams.find(p => p.rank === 2) || {}
  const secondGap = second.gap || ''
  return {
    name: sel.name,
    total: sel.total,
    isYou: sel.name === 'Aaron',
    isLeader: sel.leader,
    isLast: sel.last,
    gapColorVar: sel.leader ? LEADER_VAR : MUTED,
    gapLine: sel.leader ? 'Leads by ' + secondGap.replace('+', '') : sel.gap + ' behind',
    standingLine: ordinal(sel.rank) + ' of 6 overall · 3 riders',
    riders: sel.riders.map(r => ({
      name: r.name,
      gcNum: String(r.gc),
      proTeam: r.proTeam,
      time: r.time,
      gapGC: r.gapGC,
      today: fmtToday(r.d),
    })),
  }
}

function riderIndex(teams) {
  const idx = {}
  teams.forEach(t => t.riders.forEach(r => { idx[r.name] = { rider: r, owner: t.name } }))
  return idx
}

export function buildRiderProfile(teams, name, stageNum) {
  const hit = riderIndex(teams)[name]
  if (!hit) return null
  const r = hit.rider
  return {
    name: r.name,
    team: r.proTeam,
    role: r.role,
    nat: r.nat,
    age: r.age + ' yrs',
    gcRank: '#' + r.gc,
    gcTime: r.time,
    gapGC: r.gapGC,
    form: r.form.map((p, i) => ({ label: 'St ' + (stageNum - 2 + i), place: ordinal(p) })),
    owned: 'Drafted by ' + hit.owner + (hit.owner === 'Aaron' ? ' (you)' : ''),
  }
}

export function buildDraftView(draftPool, picks) {
  const full = picks.length >= 3
  const byName = n => draftPool.find(x => x.name === n) || { name: n, team: '', role: '' }
  const slots = [0, 1, 2].map(i => {
    const nm = picks[i]
    if (nm) { const r = byName(nm); return { slotNo: String(i + 1), filled: true, name: nm, team: r.team, role: r.role } }
    return { slotNo: String(i + 1), filled: false }
  })
  const pool = draftPool.filter(r => !picks.includes(r.name)).map(r => ({
    name: r.name, team: r.team, role: r.role, disabled: full,
  }))
  const remaining = 3 - picks.length
  return {
    slots,
    pool,
    count: String(picks.length),
    full,
    note: full
      ? 'Your team is set · picks lock when Stage 12 starts'
      : 'Pick ' + remaining + ' more · picks lock when Stage 12 starts',
    countColor: full ? '#3E8F5F' : '#C25B43',
    confirmLabel: full ? 'Save team' : 'Pick ' + remaining + ' more rider' + (remaining === 1 ? '' : 's'),
  }
}

export function buildRaceCards(races, currentRaceId) {
  const badge = s =>
    s === 'Live' ? { bg: '#E6F4EC', color: '#2F7D52' }
    : s === 'Complete' ? { bg: '#F0EEE8', color: '#8C8881' }
    : { bg: '#F4F2EC', color: '#9A968D' }
  return races.map(rc => ({ ...rc, stages: String(rc.stages), viewing: rc.id === currentRaceId, badge: badge(rc.status) }))
}
