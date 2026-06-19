import { useState, useEffect } from 'react'
import useLeagueData from './data/useLeagueData.js'
import { accentForRace, themeVars } from './theme.js'
import BrandBar from './components/BrandBar.jsx'
import TabNav from './components/TabNav.jsx'
import RiderProfile from './screens/RiderProfile.jsx'
import Draft from './screens/Draft.jsx'
import Standings from './screens/Standings.jsx'
import Stage from './screens/Stage.jsx'
import Team from './screens/Team.jsx'
import Races from './screens/Races.jsx'

const TABS = [['Standings', 'standings'], ['Stage', 'stage'], ['Team', 'team'], ['Races', 'races']]

function initialRace() {
  if (typeof window === 'undefined') return 'tdf-2026'
  const q = new URLSearchParams(window.location.search).get('race')
  return q || 'tdf-2026'
}

export default function App() {
  const [screen, setScreenState] = useState('standings')
  const [sub, setSub] = useState(null)
  const [expanded, setExpanded] = useState({ Nate: true })
  const [team, setTeam] = useState('Aaron')
  const [race, setRace] = useState(initialRace)
  const [draftPicks, setDraftPicks] = useState(['Tadej Pogačar', 'Santiago Buitrago'])
  const [showMovement] = useState(true)

  const data = useLeagueData(race)
  const accent = accentForRace(race)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    params.set('race', race)
    const url = window.location.pathname + '?' + params.toString()
    window.history.replaceState(null, '', url)
  }, [race])

  const setScreen = key => { setScreenState(key); setSub(null) }
  const toggle = name => setExpanded(e => ({ ...e, [name]: !e[name] }))
  const openDraft = () => setSub('draft')
  const openRider = name => setSub({ type: 'rider', name })
  const closeSub = () => setSub(null)
  const addPick = name => setDraftPicks(p => (p.length >= 3 || p.includes(name) ? p : [...p, name]))
  const removePick = name => setDraftPicks(p => p.filter(n => n !== name))

  const handlers = { setScreen, toggle, setTeam, setRace, openDraft, openRider, closeSub, addPick, removePick }
  const ctx = { data, screen, sub, expanded, team, race, draftPicks, showMovement, ...handlers }

  let body
  if (sub === 'draft') body = <Draft data={data} draftPicks={draftPicks} addPick={addPick} removePick={removePick} closeSub={closeSub} />
  else if (sub && sub.type === 'rider') body = <RiderProfile data={data} name={sub.name} closeSub={closeSub} />
  else body = renderMain(ctx)

  return (
    <div style={{ ...themeVars(accent), minHeight: '100vh', boxSizing: 'border-box', padding: '40px 20px 56px', background: '#E7E5DF', fontFamily: "'Archivo',-apple-system,BlinkMacSystemFont,sans-serif", display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 460 }}>
        <div style={{ background: '#FCFBF8', border: '1px solid #E4E1D8', borderRadius: 20, boxShadow: '0 6px 28px rgba(40,38,30,.10)', overflow: 'hidden' }}>
          {body}
        </div>
      </div>
    </div>
  )
}

function renderMain(ctx) {
  const { screen, setScreen } = ctx
  return (
    <div>
      <BrandBar />
      <TabNav tabs={TABS} active={screen} onSelect={setScreen} />
      {screen === 'standings' && <Standings data={ctx.data} expanded={ctx.expanded} toggle={ctx.toggle} showMovement={ctx.showMovement} />}
      {screen === 'stage' && <Stage data={ctx.data} openRider={ctx.openRider} />}
      {screen === 'team' && <Team data={ctx.data} team={ctx.team} setTeam={ctx.setTeam} showMovement={ctx.showMovement} openRider={ctx.openRider} openDraft={ctx.openDraft} />}
      {screen === 'races' && <Races data={ctx.data} race={ctx.race} setRace={ctx.setRace} />}
    </div>
  )
}
