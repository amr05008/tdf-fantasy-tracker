export default function ProgressBar({ pct }) {
  return (
    <div style={{ height: 4, background: '#ECEAE4', borderRadius: 2, marginTop: 7, overflow: 'hidden' }}>
      <div data-fill style={{ height: '100%', width: pct, background: '#1A1813', borderRadius: 2 }} />
    </div>
  )
}
