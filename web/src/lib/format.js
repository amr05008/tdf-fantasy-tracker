const GREEN = '#3E8F5F'
const RED = '#C25B43'
const NEUTRAL = '#B0ACA2'
const HOLD_TODAY = '#9A968D'

export function fmtMove(m) {
  if (m > 0) return { label: '▲ ' + m, color: GREEN }
  if (m < 0) return { label: '▼ ' + (-m), color: RED }
  return { label: 'hold', color: NEUTRAL }
}

export function fmtDelta(d) {
  if (d > 0) return { label: '▲' + d, color: GREEN }
  if (d < 0) return { label: '▼' + (-d), color: RED }
  return { label: '–', color: NEUTRAL }
}

export function fmtToday(d) {
  if (d > 0) return { label: '▲ Gained ' + d + (d === 1 ? ' place' : ' places'), color: GREEN }
  if (d < 0) return { label: '▼ Lost ' + (-d) + (d === -1 ? ' place' : ' places'), color: RED }
  return { label: '– Held position', color: HOLD_TODAY }
}

export function surname(n) {
  const p = n.split(' ')
  return p[p.length - 1]
}

export function ordinal(n) {
  return n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : n + 'th'
}
