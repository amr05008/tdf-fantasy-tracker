import { buildRaceCards } from '../lib/selectors.js'
import Badge from '../components/Badge.jsx'

export default function Races({ data, race, setRace }) {
  const cards = buildRaceCards(data.races, race)
  return (
    <div>
      <div style={{ padding: '16px 18px 6px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: '#A8A49C' }}>Choose competition</div>
      </div>
      <div style={{ padding: '4px 16px 18px' }}>
        {cards.map(rc => (
          <div key={rc.id} onClick={() => setRace(rc.id)} style={{ display: 'flex', alignItems: 'center', gap: 13, background: '#FFFFFF', border: '1px solid ' + (rc.viewing ? 'var(--accent)' : '#E8E5DD'), borderRadius: 12, padding: 14, marginBottom: 10, cursor: 'pointer' }}>
            <span style={{ width: 14, height: 14, borderRadius: '50%', flex: 'none', background: rc.dot }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#1A1813', whiteSpace: 'nowrap' }}>{rc.name}</span>
                {rc.viewing && <Badge kind="viewing">Viewing</Badge>}
              </div>
              <div style={{ fontSize: 11.5, color: '#9A968D', marginTop: 3 }}>{rc.dates} · {rc.stages} stages</div>
            </div>
            <div style={{ textAlign: 'right', flex: 'none' }}>
              <Badge kind="status" bg={rc.badge.bg} color={rc.badge.color}>{rc.status}</Badge>
              <div style={{ fontSize: 11, color: '#9A968D', marginTop: 6 }}>{rc.note}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
