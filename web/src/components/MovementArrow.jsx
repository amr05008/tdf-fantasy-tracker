import { fmtMove } from '../lib/format.js'

export default function MovementArrow({ move, show }) {
  if (!show) return null
  const m = fmtMove(move)
  return (
    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.02em', marginTop: 3, color: m.color }}>
      {m.label}
    </div>
  )
}
