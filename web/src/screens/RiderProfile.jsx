import { buildRiderProfile } from '../lib/selectors.js'

export default function RiderProfile({ data, name, closeSub }) {
  const rp = buildRiderProfile(data.teams, name, data.meta.stageNum)
  const owned = rp ? rp.owned : 'Not drafted in your league'
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', padding: '15px 18px', borderBottom: '1px solid #ECEAE4' }}>
        <div onClick={closeSub} style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#6E6A62', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 17, lineHeight: 1 }}>‹</span> Back
        </div>
      </div>
      {rp && (
        <>
          <div style={{ padding: '20px 18px 6px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: '#A8A49C' }}>{rp.role} · {rp.nat} · {rp.age}</div>
            <div style={{ fontSize: 27, fontWeight: 700, color: '#1A1813', marginTop: 6, letterSpacing: '-.02em' }}>{rp.name}</div>
            <div style={{ fontSize: 13, color: '#6E6A62', marginTop: 3 }}>{rp.team}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, padding: '16px 18px 6px' }}>
            {[['GC rank', rp.gcRank, 21], ['GC time', rp.gcTime, 17], ['To leader', rp.gapGC, 17]].map(([label, value, size]) => (
              <div key={label} style={{ background: '#FFFFFF', border: '1px solid #E8E5DD', borderRadius: 11, padding: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#A8A49C' }}>{label}</div>
                <div style={{ fontSize: size, fontWeight: label === 'GC rank' ? 800 : 700, color: '#1A1813', marginTop: label === 'GC rank' ? 5 : 7, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: '14px 18px 6px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#B4B0A6', marginBottom: 9 }}>Recent form — last 3 stages</div>
            <div style={{ display: 'flex', gap: 9 }}>
              {rp.form.map(f => (
                <div key={f.label} style={{ flex: 1, background: '#F4F2EC', borderRadius: 10, padding: 11, textAlign: 'center' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: '#A8A49C' }}>{f.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#1A1813', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>{f.place}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      <div style={{ margin: '16px 18px 20px', padding: '13px 15px', background: 'var(--accent-tint)', border: '1px solid var(--accent-border)', borderRadius: 11, display: 'flex', alignItems: 'center', gap: 9 }}>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--accent)', flex: 'none' }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#5E5A50' }}>{owned}</span>
      </div>
    </div>
  )
}
