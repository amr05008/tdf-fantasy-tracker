import { buildDraftView } from '../lib/selectors.js'

export default function Draft({ data, draftPicks, addPick, removePick, closeSub }) {
  const view = buildDraftView(data.draftPool, draftPicks)
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', padding: '15px 18px', borderBottom: '1px solid #ECEAE4' }}>
        <div onClick={closeSub} style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#6E6A62', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 17, lineHeight: 1 }}>‹</span> Standings
        </div>
      </div>
      <div style={{ padding: '18px 18px 8px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: '#A8A49C' }}>Tour de France 2026</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#1A1813', marginTop: 6, letterSpacing: '-.015em' }}>Edit your three riders</div>
        <div style={{ fontSize: 12, color: '#9A968D', marginTop: 6 }}>{view.note}</div>
      </div>

      <div style={{ padding: '8px 16px 4px' }}>
        {view.slots.map(s => (
          s.filled ? (
            <div key={s.slotNo} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#FFFFFF', border: '1px solid #E4E1D8', borderRadius: 11, padding: '12px 13px', marginBottom: 9 }}>
              <span style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--accent)', color: 'var(--accent-ink)', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>{s.slotNo}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: '#1A1813', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                <div style={{ fontSize: 11, color: '#9A968D', marginTop: 1 }}>{s.team} · {s.role}</div>
              </div>
              <button aria-label="remove" onClick={() => removePick(s.name)} style={{ cursor: 'pointer', width: 26, height: 26, borderRadius: '50%', background: '#F2F0EA', color: '#8C8881', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', border: 'none' }}>×</button>
            </div>
          ) : (
            <div key={s.slotNo} style={{ display: 'flex', alignItems: 'center', gap: 12, border: '1.5px dashed #D8D4CA', borderRadius: 11, padding: '12px 13px', marginBottom: 9 }}>
              <span style={{ width: 26, height: 26, borderRadius: 7, background: '#F2F0EA', color: '#B4B0A6', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>{s.slotNo}</span>
              <span style={{ fontSize: 13.5, color: '#B4B0A6' }}>Empty — add a rider below</span>
            </div>
          )
        ))}
      </div>

      <div style={{ padding: '8px 18px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #ECEAE4', marginTop: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#A8A49C' }}>Available riders</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: view.countColor }}>{view.count} / 3 picked</span>
      </div>

      <div style={{ padding: '2px 16px 16px' }}>
        {view.pool.map(r => (
          <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 4px', borderTop: '1px solid #F2F0EA' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1813', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
              <div style={{ fontSize: 11, color: '#9A968D', marginTop: 1 }}>{r.team}</div>
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: '#8C8881', background: '#F2F0EA', padding: '3px 8px', borderRadius: 999, flex: 'none' }}>{r.role}</span>
            <button aria-label={'add ' + r.name} onClick={() => addPick(r.name)} disabled={r.disabled} style={{ cursor: r.disabled ? 'default' : 'pointer', width: 30, height: 30, borderRadius: '50%', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 600, border: '1px solid ' + (r.disabled ? '#E4E1D8' : 'var(--accent)'), color: r.disabled ? '#C2BEB4' : 'var(--accent-ink)', background: r.disabled ? '#F4F2EC' : 'var(--accent-tint)' }}>+</button>
          </div>
        ))}
      </div>

      <div style={{ padding: '4px 16px 18px' }}>
        <div onClick={closeSub} style={{ cursor: 'pointer', textAlign: 'center', padding: 14, borderRadius: 11, fontSize: 14, fontWeight: 700, background: view.full ? 'var(--accent)' : '#F0EEE8', color: view.full ? 'var(--accent-ink)' : '#B4B0A6' }}>{view.confirmLabel}</div>
      </div>
    </div>
  )
}
