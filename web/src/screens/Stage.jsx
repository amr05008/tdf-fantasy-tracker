import { fmtMove } from '../lib/format.js'

export default function Stage({ data, openRider }) {
  const { stage, movers, yourToday } = data
  return (
    <div>
      <div style={{ padding: '18px 18px 14px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: '#A8A49C' }}>Stage {stage.stageNum} · {stage.date}</div>
        <div style={{ fontSize: 23, fontWeight: 700, color: '#1A1813', marginTop: 6, letterSpacing: '-.015em', lineHeight: 1.15 }}>{stage.route}</div>
        <div style={{ fontSize: 12.5, color: '#6E6A62', marginTop: 6 }}>{stage.type} · {stage.km}</div>
      </div>

      <div style={{ padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 13, background: 'var(--accent-tint)', border: '1px solid var(--accent-border)', borderRadius: 13, padding: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--accent)', color: 'var(--accent-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flex: 'none' }}>🏆</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--accent-ink)' }}>Stage winner</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1A1813', marginTop: 2 }}>{stage.winner}</div>
            <div style={{ fontSize: 11.5, color: '#7A7568', marginTop: 1 }}>{stage.winnerTeam}</div>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1813', fontVariantNumeric: 'tabular-nums', flex: 'none' }}>{stage.winnerTime}</div>
        </div>
      </div>

      <div style={{ padding: '20px 18px 6px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#B4B0A6' }}>League shake-up</div>
      </div>
      <div style={{ padding: '0 18px 6px' }}>
        {movers.map(m => {
          const mv = fmtMove(m.move)
          return (
            <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 0', borderTop: '1px solid #F2F0EA' }}>
              <span style={{ fontSize: 13, fontWeight: 700, width: 34, color: mv.color }}>{mv.label}</span>
              <span style={{ fontSize: 14.5, fontWeight: 600, color: '#1A1813', width: 66 }}>{m.name}</span>
              <span style={{ flex: 1, fontSize: 12.5, color: '#6E6A62' }}>{m.note}</span>
            </div>
          )
        })}
      </div>

      <div style={{ padding: '18px 18px 6px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#B4B0A6' }}>Your riders today</div>
      </div>
      <div style={{ padding: '0 16px 18px' }}>
        {yourToday.map(r => (
          <div key={r.name} onClick={() => openRider(r.name)} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#FFFFFF', border: '1px solid #E8E5DD', borderRadius: 11, padding: '12px 13px', marginBottom: 9, cursor: 'pointer' }}>
            <span style={{ width: 34, textAlign: 'center', fontSize: 15, fontWeight: 800, color: '#1A1813', fontVariantNumeric: 'tabular-nums', flex: 'none' }}>{r.place}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: '#1A1813', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
              <div style={{ fontSize: 11, color: '#9A968D', marginTop: 1 }}>{r.note}</div>
            </div>
            <span style={{ fontSize: 13, color: '#6E6A62', fontVariantNumeric: 'tabular-nums', flex: 'none' }}>{r.gap}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
