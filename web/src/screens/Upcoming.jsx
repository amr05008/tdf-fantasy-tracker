export default function Upcoming({ race }) {
  const name = (race && race.name) || 'This race'
  return (
    <div style={{ padding: '44px 22px 52px', textAlign: 'center' }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--accent-ink)' }}>
        Upcoming
      </div>
      <div style={{ fontSize: 23, fontWeight: 700, color: '#1A1813', marginTop: 10, letterSpacing: '-.015em' }}>
        {name}
      </div>
      {race && race.dates && (
        <div style={{ fontSize: 13, color: '#6E6A62', marginTop: 8 }}>{race.dates}</div>
      )}
      <div style={{ fontSize: 13.5, color: '#8C8881', marginTop: 20, lineHeight: 1.5 }}>
        Standings will appear once the race begins.
      </div>
    </div>
  )
}
