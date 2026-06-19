export default function BrandBar() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 0' }}>
      <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase', color: '#1A1813' }}>
        Sunshine Fantasy
      </span>
      <span title="Leader jersey" style={{ width: 20, height: 13, borderRadius: 2, background: 'var(--accent)', display: 'inline-block' }} />
    </div>
  )
}
