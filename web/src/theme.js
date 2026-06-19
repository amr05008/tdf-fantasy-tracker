const THEMES = {
  'Tour Yellow': { '--accent': '#F2C200', '--accent-tint': '#FEFAE6', '--accent-border': '#F2E4A0', '--accent-ink': '#6E5300' },
  'Giro Pink':   { '--accent': '#E83E8C', '--accent-tint': '#FCEAF2', '--accent-border': '#F6C9DE', '--accent-ink': '#8E1A55' },
  'Vuelta Red':  { '--accent': '#DC143C', '--accent-tint': '#FDEAEC', '--accent-border': '#F4C5CD', '--accent-ink': '#8E0E26' },
}

export function accentForRace(raceId) {
  if (typeof raceId === 'string') {
    if (raceId.startsWith('giro')) return 'Giro Pink'
    if (raceId.startsWith('vuelta')) return 'Vuelta Red'
  }
  return 'Tour Yellow'
}

export function themeVars(accentName) {
  return THEMES[accentName] || THEMES['Tour Yellow']
}
