import { fmtMove, fmtDelta, fmtToday, surname, ordinal } from './format.js'

test('fmtMove', () => {
  expect(fmtMove(1)).toEqual({ label: '▲ 1', color: '#3E8F5F' })
  expect(fmtMove(-2)).toEqual({ label: '▼ 2', color: '#C25B43' })
  expect(fmtMove(0)).toEqual({ label: 'hold', color: '#B0ACA2' })
})

test('fmtDelta', () => {
  expect(fmtDelta(3)).toEqual({ label: '▲3', color: '#3E8F5F' })
  expect(fmtDelta(-1)).toEqual({ label: '▼1', color: '#C25B43' })
  expect(fmtDelta(0)).toEqual({ label: '–', color: '#B0ACA2' })
})

test('fmtToday pluralizes correctly', () => {
  expect(fmtToday(1)).toEqual({ label: '▲ Gained 1 place', color: '#3E8F5F' })
  expect(fmtToday(2)).toEqual({ label: '▲ Gained 2 places', color: '#3E8F5F' })
  expect(fmtToday(-1)).toEqual({ label: '▼ Lost 1 place', color: '#C25B43' })
  expect(fmtToday(-3)).toEqual({ label: '▼ Lost 3 places', color: '#C25B43' })
  expect(fmtToday(0)).toEqual({ label: '– Held position', color: '#9A968D' })
})

test('surname returns last token', () => {
  expect(surname('Tadej Pogačar')).toBe('Pogačar')
  expect(surname("Ben O'Connor")).toBe("O'Connor")
})

test('ordinal', () => {
  expect(ordinal(1)).toBe('1st')
  expect(ordinal(2)).toBe('2nd')
  expect(ordinal(3)).toBe('3rd')
  expect(ordinal(41)).toBe('41th')
})
