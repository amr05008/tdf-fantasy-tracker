import { accentForRace, themeVars } from './theme.js'

test('accentForRace maps race id prefix to accent name', () => {
  expect(accentForRace('tdf-2026')).toBe('Tour Yellow')
  expect(accentForRace('giro-2026')).toBe('Giro Pink')
  expect(accentForRace('vuelta-2026')).toBe('Vuelta Red')
  expect(accentForRace('unknown')).toBe('Tour Yellow')
})

test('themeVars returns the four CSS variables for each accent', () => {
  expect(themeVars('Tour Yellow')).toEqual({
    '--accent': '#F2C200',
    '--accent-tint': '#FEFAE6',
    '--accent-border': '#F2E4A0',
    '--accent-ink': '#6E5300',
  })
  expect(themeVars('Giro Pink')['--accent']).toBe('#E83E8C')
  expect(themeVars('Vuelta Red')['--accent']).toBe('#DC143C')
  expect(themeVars('nonsense')['--accent']).toBe('#F2C200')
})
