export default function TabNav({ tabs, active, onSelect }) {
  return (
    <div className="noscroll" style={{ display: 'flex', gap: 22, padding: '14px 18px 0', borderBottom: '1px solid #ECEAE4', overflowX: 'auto' }}>
      {tabs.map(([label, key]) => (
        <div key={key} onClick={() => onSelect(key)} style={{ position: 'relative', paddingBottom: 11, cursor: 'pointer', fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', color: active === key ? '#1A1813' : '#A8A49C' }}>
          {label}
          {active === key && <div style={{ position: 'absolute', left: 0, right: 0, bottom: -1, height: 2, background: '#1A1813', borderRadius: 2 }} />}
        </div>
      ))}
    </div>
  )
}
