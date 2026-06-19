import { buildTeamView } from '../lib/selectors.js'
import Badge from '../components/Badge.jsx'

export default function Team({ data, team, setTeam, showMovement, openRider, openDraft }) {
  const view = buildTeamView(data.teams, team)
  return (
    <div>
      <div className="noscroll" style={{ display: 'flex', gap: 7, overflowX: 'auto', padding: '14px 16px 4px', scrollbarWidth: 'none' }}>
        {data.teams.map(p => {
          const active = team === p.name
          return (
            <div key={p.name} onClick={() => setTeam(p.name)} style={{ flex: 'none', padding: '7px 13px', borderRadius: 999, cursor: 'pointer', fontSize: 13, fontWeight: 600, border: '1px solid ' + (active ? 'var(--accent)' : '#E4E1D8'), background: active ? 'var(--accent)' : '#FFFFFF', color: active ? 'var(--accent-ink)' : '#6E6A62' }}>
              {p.name}
            </div>
          )
        })}
      </div>

      <div style={{ padding: '14px 18px 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 23, fontWeight: 700, color: '#1A1813', letterSpacing: '-.01em' }}>{view.name}</span>
          {view.isYou && <Badge kind="you">You</Badge>}
          {view.isLeader && <Badge kind="jersey">Yellow Jersey</Badge>}
          {view.isLast && <span title="Lanterne rouge" style={{ fontSize: 15 }}>🐼</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 7 }}>
          <span style={{ fontSize: 24, fontWeight: 700, color: '#1A1813', fontVariantNumeric: 'tabular-nums', letterSpacing: '-.01em' }}>{view.total}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: view.gapColorVar }}>{view.gapLine}</span>
        </div>
        <div style={{ fontSize: 12, color: '#9A968D', marginTop: 5 }}>{view.standingLine}</div>
      </div>

      <div style={{ padding: '12px 16px 6px' }}>
        {view.riders.map(r => (
          <div key={r.name} onClick={() => openRider(r.name)} style={{ background: '#FFFFFF', border: '1px solid #E8E5DD', borderRadius: 12, padding: '13px 14px', marginBottom: 10, cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: '#F4F2EC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '.06em', color: '#A8A49C' }}>GC</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#1A1813', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{r.gcNum}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#1A1813', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
                <div style={{ fontSize: 11, color: '#9A968D', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.proTeam}</div>
              </div>
              <div style={{ textAlign: 'right', flex: 'none' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1813', fontVariantNumeric: 'tabular-nums' }}>{r.time}</div>
                <div style={{ fontSize: 11.5, color: '#9A968D', fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>{r.gapGC}</div>
              </div>
            </div>
            {showMovement && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 11, paddingTop: 10, borderTop: '1px solid #F2F0EA' }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#B4B0A6' }}>Today</span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: r.today.color }}>{r.today.label}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {view.isYou && (
        <div style={{ padding: '0 16px 18px' }}>
          <div onClick={openDraft} style={{ cursor: 'pointer', textAlign: 'center', padding: 13, borderRadius: 11, fontSize: 13.5, fontWeight: 700, color: '#1A1813', background: '#FFFFFF', border: '1px solid #D8D4CA' }}>Edit your picks</div>
        </div>
      )}
    </div>
  )
}
