export default function Callout({ children }) {
  return (
    <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', background: 'var(--accent-tint)', border: '1px solid var(--accent-border)', borderRadius: 9, padding: '9px 11px' }}>
      <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--accent)', flex: 'none', marginTop: 3 }} />
      <span style={{ fontSize: 12, color: '#5E5A50', lineHeight: 1.4 }}>{children}</span>
    </div>
  )
}
