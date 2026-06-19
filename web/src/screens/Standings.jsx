import { buildStandingsRows } from '../lib/selectors.js'
import MovementArrow from '../components/MovementArrow.jsx'
import ProgressBar from '../components/ProgressBar.jsx'
import Callout from '../components/Callout.jsx'
import Badge from '../components/Badge.jsx'

export default function Standings({ data, expanded, toggle, showMovement }) {
  const { meta } = data
  const rows = buildStandingsRows(data.teams)
  return (
    <div>
      <div style={{ padding: '18px 18px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: '#A8A49C' }}>The Sunshine League</span>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.04em', color: '#A8A49C' }}>Updated {meta.updated}</span>
        </div>
        <div style={{ fontSize: 25, fontWeight: 700, color: '#1A1813', marginTop: 7, letterSpacing: '-.015em' }}>{meta.name}</div>
        <div style={{ marginTop: 15 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: '#8C8881' }}>
            <span>Stage {meta.stageNum} of {meta.totalStages}</span>
            <span>{meta.progressPct} done</span>
          </div>
          <ProgressBar pct={meta.progressPct} />
        </div>
        <div style={{ marginTop: 14 }}>
          <Callout>{meta.recap}</Callout>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', padding: '0 18px 8px', fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#B4B0A6' }}>
        <span style={{ width: 34, textAlign: 'center' }}>#</span>
        <span style={{ flex: 1, paddingLeft: 14 }}>Team</span>
        <span>Total time</span>
      </div>

      {rows.map(p => (
        <div key={p.name} style={{ borderTop: '1px solid #ECEAE4' }}>
          <div onClick={() => toggle(p.name)} style={{ position: 'relative', cursor: 'pointer', overflow: 'hidden' }}>
            {p.isLeader && <div style={{ position: 'absolute', inset: 0, background: 'var(--accent-tint)' }} />}
            {p.isLeader && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'var(--accent)' }} />}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', padding: '13px 18px 13px 16px' }}>
              <div style={{ width: 34, flex: 'none', textAlign: 'center' }}>
                <div style={{ fontSize: 19, fontWeight: 700, color: '#1A1813', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{p.rank}</div>
                <MovementArrow move={p.rawMove} show={showMovement} />
              </div>
              <div style={{ flex: '1 1 auto', minWidth: 0, paddingLeft: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 17, fontWeight: 600, color: '#1A1813' }}>{p.name}</span>
                  {p.isLeader && <Badge kind="jersey">Yellow Jersey</Badge>}
                  {p.isLast && <span title="Lanterne rouge" style={{ fontSize: 14 }}>🐼</span>}
                </div>
                <div style={{ fontSize: 11, color: '#9A968D', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.subline}</div>
              </div>
              <div style={{ textAlign: 'right', flex: 'none', paddingLeft: 10 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1A1813', fontVariantNumeric: 'tabular-nums', letterSpacing: '-.01em', lineHeight: 1.1 }}>{p.totalTime}</div>
                <div style={{ fontSize: 12, fontWeight: 600, fontVariantNumeric: 'tabular-nums', marginTop: 2, color: p.gapColorVar }}>{p.gap}</div>
              </div>
              <div style={{ width: 18, flex: 'none', textAlign: 'center', color: '#C2BEB4', fontSize: 11, paddingLeft: 4 }}>{expanded[p.name] ? '▾' : '▸'}</div>
            </div>
          </div>
          {expanded[p.name] && (
            <div style={{ padding: '2px 18px 14px 64px', background: '#FFFFFF' }}>
              {p.riders.map(r => (
                <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderTop: '1px solid #F2F0EA' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#B4B0A6', width: 26, fontVariantNumeric: 'tabular-nums' }}>{r.gcLabel}</span>
                  <span style={{ flex: 1, fontSize: 13.5, color: '#3A382F', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</span>
                  {showMovement && <span style={{ fontSize: 11, fontWeight: 600, width: 30, textAlign: 'right', color: r.delta.color }}>{r.delta.label}</span>}
                  <span style={{ fontSize: 13, color: '#6E6A62', fontVariantNumeric: 'tabular-nums', width: 70, textAlign: 'right' }}>{r.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <div style={{ padding: '13px 18px', borderTop: '1px solid #ECEAE4', fontSize: 10.5, color: '#A8A49C', lineHeight: 1.5 }}>
        Score = sum of your three riders' GC times. Lowest total wins. Data via procyclingstats.
      </div>
    </div>
  )
}
