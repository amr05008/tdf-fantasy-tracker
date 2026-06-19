# Sunshine Fantasy TdF 2026 Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recreate the `design_handoff_tdf2026` prototype as a standalone React + Vite SPA at high fidelity, driven by placeholder data behind a `useLeagueData()` seam.

**Architecture:** A single `App.jsx` owns all UI state and renders one of four main screens (Standings/Stage/Team/Races) or one of two sub-screens (Draft/RiderProfile). Pure view-model derivation lives in `lib/selectors.js` and `lib/format.js`; placeholder data lives in `data/sampleData.js` and is read only through the `useLeagueData()` hook (the swap point for procyclingstats later). Styling is inline styles + CSS custom properties for the per-race accent theme, lifted verbatim from the prototype.

**Tech Stack:** React 18, Vite, Vitest + React Testing Library + jsdom (unit/behavior), Playwright (end-to-end walkthrough), plain JavaScript (JSX).

## Global Constraints

- All new code lives under `web/`. The existing Streamlit app (`app.py`, `api_client.py`, `races_config.py`) is **not modified**.
- Plain JavaScript (JSX) only — no TypeScript.
- Styling = inline styles + CSS custom properties. No Tailwind/CSS-modules. Token values are lifted verbatim from `design_handoff_tdf2026/Standings.dc.html` and the handoff README — do not re-derive colors/spacing.
- Font: `Archivo` via Google Fonts. All numbers use `font-variant-numeric: tabular-nums`.
- Accent theme is a CSS-variable set (`--accent`, `--accent-tint`, `--accent-border`, `--accent-ink`) applied on a root wrapper; **derived from the selected race**, not independent state.
- Emoji: only 🏆 (stage winner) and 🐼 (lanterne rouge). No other emoji anywhere.
- Draft picks are ephemeral local state (reset on reload). No persistence, no backend, no auth this phase.
- Components never import `sampleData` directly — they read data through `useLeagueData()` only.
- Default state: `screen='standings'`, `expanded={Nate:true}`, `team='Aaron'`, `race='tdf-2026'`, `draftPicks=['Tadej Pogačar','Santiago Buitrago']`, `showMovement=true`.
- Source-of-truth file for every value/string: `design_handoff_tdf2026/Standings.dc.html` (referred to below as "the prototype"). Copy strings exactly, including `·` separators and accented names.

---

### Task 1: Scaffold the `web/` project

**Files:**
- Create: `web/package.json`
- Create: `web/vite.config.js`
- Create: `web/index.html`
- Create: `web/src/main.jsx`
- Create: `web/src/App.jsx`
- Create: `web/src/test/setup.js`
- Create: `web/.gitignore`
- Test: `web/src/App.test.jsx`

**Interfaces:**
- Produces: `App` (default export from `web/src/App.jsx`), a React component rendering the app root.

- [ ] **Step 1: Create `web/package.json`**

```json
{
  "name": "sunshine-fantasy",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "e2e": "playwright test"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@playwright/test": "^1.48.0",
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/react": "^16.0.1",
    "@testing-library/user-event": "^14.5.2",
    "@vitejs/plugin-react": "^4.3.2",
    "jsdom": "^25.0.1",
    "vite": "^5.4.8",
    "vitest": "^2.1.2"
  }
}
```

- [ ] **Step 2: Create `web/vite.config.js`**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    exclude: ['**/node_modules/**', '**/e2e/**'],
  },
})
```

- [ ] **Step 3: Create `web/src/test/setup.js`**

```js
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Create `web/.gitignore`**

```
node_modules
dist
test-results
playwright-report
```

- [ ] **Step 5: Create `web/index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Sunshine Fantasy — Tour de France 2026</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&display=swap"
      rel="stylesheet"
    />
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; }
      .noscroll::-webkit-scrollbar { display: none; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create `web/src/main.jsx`**

```jsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

- [ ] **Step 7: Create `web/src/App.jsx` (smoke placeholder — replaced in Task 7)**

```jsx
export default function App() {
  return <div>Sunshine Fantasy</div>
}
```

- [ ] **Step 8: Write the failing smoke test `web/src/App.test.jsx`**

```jsx
import { render, screen } from '@testing-library/react'
import App from './App.jsx'

test('renders the app', () => {
  render(<App />)
  expect(screen.getByText('Sunshine Fantasy')).toBeInTheDocument()
})
```

- [ ] **Step 9: Install dependencies**

Run: `cd web && npm install`
Expected: dependencies install without errors; `node_modules/` created.

- [ ] **Step 10: Run the test to verify it passes**

Run: `cd web && npm test`
Expected: 1 passed.

- [ ] **Step 11: Commit**

```bash
git add web/package.json web/package-lock.json web/vite.config.js web/index.html web/src web/.gitignore
git commit -m "chore: scaffold web/ Vite + React project with test tooling"
```

---

### Task 2: Accent theme presets (`theme.js`)

**Files:**
- Create: `web/src/theme.js`
- Test: `web/src/theme.test.js`

**Interfaces:**
- Produces:
  - `accentForRace(raceId: string) -> 'Tour Yellow' | 'Giro Pink' | 'Vuelta Red'`
  - `themeVars(accentName: string) -> { '--accent', '--accent-tint', '--accent-border', '--accent-ink' }`

Values are verbatim from the prototype `accentTheme()` (lines 377–382) and README §Accent. `tdf-*` → Tour Yellow, `giro-*` → Giro Pink, `vuelta-*` → Vuelta Red, default → Tour Yellow.

- [ ] **Step 1: Write the failing test `web/src/theme.test.js`**

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npm test -- theme`
Expected: FAIL — cannot resolve `./theme.js`.

- [ ] **Step 3: Create `web/src/theme.js`**

```js
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npm test -- theme`
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add web/src/theme.js web/src/theme.test.js
git commit -m "feat: accent theme presets derived from race id"
```

---

### Task 3: Formatting helpers (`lib/format.js`)

**Files:**
- Create: `web/src/lib/format.js`
- Test: `web/src/lib/format.test.js`

**Interfaces:**
- Produces (ported verbatim from prototype lines 384–388):
  - `fmtMove(m: number) -> { label, color }` — `▲ n` green / `▼ n` red / `hold` neutral
  - `fmtDelta(d: number) -> { label, color }` — `▲n` / `▼n` / `–`
  - `fmtToday(d: number) -> { label, color }` — `▲ Gained n place(s)` / `▼ Lost n place(s)` / `– Held position`
  - `surname(name: string) -> string` — last space-delimited token
  - `ordinal(n: number) -> string` — `1st/2nd/3rd/Nth`

Colors: green `#3E8F5F`, red `#C25B43`, neutral `#B0ACA2` (move/delta) and `#9A968D` (today-hold).

- [ ] **Step 1: Write the failing test `web/src/lib/format.test.js`**

```js
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
```

> Note: `ordinal(41)` returning `41th` is intentional — it reproduces the prototype's exact logic (line 388), which the prototype itself renders.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npm test -- format`
Expected: FAIL — cannot resolve `./format.js`.

- [ ] **Step 3: Create `web/src/lib/format.js`**

```js
const GREEN = '#3E8F5F'
const RED = '#C25B43'
const NEUTRAL = '#B0ACA2'
const HOLD_TODAY = '#9A968D'

export function fmtMove(m) {
  if (m > 0) return { label: '▲ ' + m, color: GREEN }
  if (m < 0) return { label: '▼ ' + (-m), color: RED }
  return { label: 'hold', color: NEUTRAL }
}

export function fmtDelta(d) {
  if (d > 0) return { label: '▲' + d, color: GREEN }
  if (d < 0) return { label: '▼' + (-d), color: RED }
  return { label: '–', color: NEUTRAL }
}

export function fmtToday(d) {
  if (d > 0) return { label: '▲ Gained ' + d + (d === 1 ? ' place' : ' places'), color: GREEN }
  if (d < 0) return { label: '▼ Lost ' + (-d) + (d === -1 ? ' place' : ' places'), color: RED }
  return { label: '– Held position', color: HOLD_TODAY }
}

export function surname(n) {
  const p = n.split(' ')
  return p[p.length - 1]
}

export function ordinal(n) {
  return n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : n + 'th'
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npm test -- format`
Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/format.js web/src/lib/format.test.js
git commit -m "feat: movement/ordinal formatting helpers ported from prototype"
```

---

### Task 4: Placeholder data + `useLeagueData` hook

**Files:**
- Create: `web/src/data/sampleData.js`
- Create: `web/src/data/useLeagueData.js`
- Test: `web/src/data/useLeagueData.test.js`

**Interfaces:**
- Produces:
  - `sampleData` (default export object) `{ teams, races, draftPool, stage, movers, yourToday, meta }`
  - `useLeagueData(raceId) -> sampleData` (hook; ignores `raceId` in phase 1, returns the single sample dataset — this is the documented swap point for procyclingstats).
- `teams[]` item: `{ name, rank, total, gap, move, leader, last, riders[] }`; `riders[]` item: `{ name, gc, time, d, proTeam, gapGC, role, nat, age, form[] }`.
- `races[]` item: `{ id, name, dates, stages, status, dot, note }`.
- `draftPool[]` item: `{ name, team, role }`.
- `stage`: `{ stageNum, date, route, type, km, winner, winnerTeam, winnerTime }`.
- `movers[]` item: `{ name, move, note }` (`move` is a signed integer).
- `yourToday[]` item: `{ name, place, gap, note }`.
- `meta`: `{ raceId, name, stageNum, totalStages, progressPct, updated, recap }`.

- [ ] **Step 1: Create `web/src/data/sampleData.js`**

Port the prototype's data verbatim. Copy the six-team `teams` array from the prototype `data()` (lines 391–416), the `draftPool` from `draftPoolData()` (lines 425–438), and `races` from `racesData()` (lines 440–447). Convert `movers` to use signed `move` integers (the prototype hard-codes arrow strings on lines 536–541; use `move: 1` / `move: -1` instead so `fmtMove` renders them). Keep all names/accents/em-separators exactly.

```js
const sampleData = {
  meta: {
    raceId: 'tdf-2026',
    name: 'Tour de France 2026',
    stageNum: 11,
    totalStages: 21,
    progressPct: '52%',
    updated: '2 min ago',
    recap:
      'Nate takes the yellow jersey from Leo after the Pyrenees. Onley was the day’s big mover, climbing 3 places on GC.',
  },
  teams: [
    { name: 'Nate', rank: 1, total: '129:57:19', gap: 'Leader', move: 1, leader: true, last: false, riders: [
      { name: 'Florian Lipowitz', gc: 5, time: '43:15:36', d: 0, proTeam: 'Red Bull–BORA–hansgrohe', gapGC: '+3:31', role: 'Climber', nat: 'Germany', age: 25, form: [6, 5, 4] },
      { name: 'João Almeida', gc: 4, time: '43:18:26', d: 1, proTeam: 'UAE Team Emirates', gapGC: '+6:21', role: 'GC', nat: 'Portugal', age: 27, form: [9, 7, 3] },
      { name: 'Enric Mas', gc: 11, time: '43:23:17', d: -1, proTeam: 'Movistar Team', gapGC: '+11:12', role: 'GC', nat: 'Spain', age: 31, form: [12, 15, 11] },
    ] },
    { name: 'Leo', rank: 2, total: '129:58:37', gap: '+1:18', move: -1, leader: false, last: false, riders: [
      { name: 'Remco Evenepoel', gc: 3, time: '43:14:23', d: 0, proTeam: 'Red Bull–BORA–hansgrohe', gapGC: '+2:18', role: 'GC', nat: 'Belgium', age: 26, form: [3, 4, 2] },
      { name: 'Felix Gall', gc: 9, time: '43:19:49', d: 2, proTeam: 'Decathlon AG2R', gapGC: '+7:44', role: 'Climber', nat: 'Austria', age: 28, form: [7, 9, 1] },
      { name: "Ben O'Connor", gc: 14, time: '43:24:25', d: -1, proTeam: 'Jayco AlUla', gapGC: '+12:20', role: 'GC', nat: 'Australia', age: 30, form: [14, 11, 20] },
    ] },
    { name: 'Aaron', rank: 3, total: '130:04:00', gap: '+6:41', move: 0, leader: false, last: false, riders: [
      { name: 'Tadej Pogačar', gc: 1, time: '43:12:05', d: 0, proTeam: 'UAE Team Emirates', gapGC: 'GC leader', role: 'GC', nat: 'Slovenia', age: 27, form: [1, 2, 1] },
      { name: 'Kévin Vauquelin', gc: 12, time: '43:26:10', d: 1, proTeam: 'Arkéa–B&B Hotels', gapGC: '+14:05', role: 'All-rounder', nat: 'France', age: 25, form: [24, 12, 8] },
      { name: 'Santiago Buitrago', gc: 13, time: '43:25:45', d: -2, proTeam: 'Bahrain Victorious', gapGC: '+13:40', role: 'Climber', nat: 'Colombia', age: 26, form: [41, 33, 29] },
    ] },
    { name: 'Charles', rank: 4, total: '130:06:15', gap: '+8:56', move: 1, leader: false, last: false, riders: [
      { name: 'Primož Roglič', gc: 8, time: '43:17:52', d: 1, proTeam: 'Red Bull–BORA–hansgrohe', gapGC: '+5:47', role: 'GC', nat: 'Slovenia', age: 36, form: [8, 6, 9] },
      { name: 'Carlos Rodríguez', gc: 7, time: '43:21:00', d: 2, proTeam: 'INEOS Grenadiers', gapGC: '+8:55', role: 'GC', nat: 'Spain', age: 25, form: [10, 7, 5] },
      { name: 'Tobias H. Johannessen', gc: 15, time: '43:27:23', d: -1, proTeam: 'Uno-X Mobility', gapGC: '+15:18', role: 'Climber', nat: 'Norway', age: 26, form: [15, 18, 12] },
    ] },
    { name: 'Aly', rank: 5, total: '130:08:06', gap: '+10:47', move: -1, leader: false, last: false, riders: [
      { name: 'Oscar Onley', gc: 6, time: '43:16:53', d: 3, proTeam: 'Picnic PostNL', gapGC: '+4:48', role: 'Climber', nat: 'Britain', age: 23, form: [22, 9, 1] },
      { name: 'Juan Ayuso', gc: 10, time: '43:21:43', d: 0, proTeam: 'Lidl–Trek', gapGC: '+9:38', role: 'GC', nat: 'Spain', age: 23, form: [13, 10, 15] },
      { name: 'Aleksandr Vlasov', gc: 17, time: '43:29:30', d: -2, proTeam: 'Red Bull–BORA–hansgrohe', gapGC: '+17:25', role: 'Domestique', nat: 'Russia', age: 29, form: [17, 19, 16] },
    ] },
    { name: 'Jeremy', rank: 6, total: '130:12:24', gap: '+15:05', move: 0, leader: false, last: true, riders: [
      { name: 'Jonas Vingegaard', gc: 2, time: '43:12:57', d: 0, proTeam: 'Visma–Lease a Bike', gapGC: '+0:52', role: 'GC', nat: 'Denmark', age: 29, form: [2, 3, 2] },
      { name: 'Ben Healy', gc: 22, time: '43:30:52', d: -3, proTeam: 'EF Education–EasyPost', gapGC: '+18:47', role: 'Puncheur', nat: 'Ireland', age: 25, form: [22, 30, 19] },
      { name: 'Sepp Kuss', gc: 18, time: '43:28:35', d: 1, proTeam: 'Visma–Lease a Bike', gapGC: '+16:30', role: 'Domestique', nat: 'United States', age: 31, form: [18, 16, 21] },
    ] },
  ],
  draftPool: [
    { name: 'Tadej Pogačar', team: 'UAE Team Emirates', role: 'GC' },
    { name: 'Santiago Buitrago', team: 'Bahrain Victorious', role: 'Climber' },
    { name: 'Mattias Skjelmose', team: 'Lidl–Trek', role: 'All-rounder' },
    { name: 'Egan Bernal', team: 'INEOS Grenadiers', role: 'GC' },
    { name: 'Adam Yates', team: 'UAE Team Emirates', role: 'Climber' },
    { name: 'Mads Pedersen', team: 'Lidl–Trek', role: 'Sprinter' },
    { name: 'Tom Pidcock', team: 'Q36.5', role: 'All-rounder' },
    { name: 'Geraint Thomas', team: 'INEOS Grenadiers', role: 'GC' },
    { name: 'Wout van Aert', team: 'Visma–Lease a Bike', role: 'Puncheur' },
    { name: 'Felix Gall', team: 'Decathlon AG2R', role: 'Climber' },
  ],
  races: [
    { id: 'tdf-2025', name: 'Tour de France 2025', dates: 'Jul 5 – 27, 2025', stages: 21, status: 'Complete', dot: '#F2C200', note: 'Won by Aaron' },
    { id: 'giro-2026', name: "Giro d'Italia 2026", dates: 'May 9 – 31, 2026', stages: 21, status: 'Upcoming', dot: '#E83E8C', note: 'Starts May' },
    { id: 'tdf-2026', name: 'Tour de France 2026', dates: 'Jul 4 – 26, 2026', stages: 21, status: 'Live', dot: '#F2C200', note: 'Stage 11 / 21' },
    { id: 'vuelta-2026', name: 'Vuelta a España 2026', dates: 'Aug 22 – Sep 13, 2026', stages: 21, status: 'Upcoming', dot: '#DC143C', note: 'Starts Aug' },
  ],
  stage: {
    stageNum: 11, date: 'Thu Jul 16', route: 'Pau → Luchon-Superbagnères',
    type: 'High mountain', km: '183 km', winner: 'Oscar Onley',
    winnerTeam: 'Picnic PostNL', winnerTime: '4:52:18',
  },
  movers: [
    { name: 'Nate', move: 1, note: 'Takes the yellow jersey' },
    { name: 'Charles', move: 1, note: 'Up to 4th overall' },
    { name: 'Leo', move: -1, note: 'Cedes the race lead' },
    { name: 'Aly', move: -1, note: 'Slips to 5th' },
  ],
  yourToday: [
    { name: 'Tadej Pogačar', place: '2nd', gap: '+0:24', note: 'Holds GC #1' },
    { name: 'Kévin Vauquelin', place: '24th', gap: '+6:40', note: 'Up 1 on GC' },
    { name: 'Santiago Buitrago', place: '41st', gap: '+12:10', note: 'Lost 2 on GC' },
  ],
}

export default sampleData
```

- [ ] **Step 2: Write the failing test `web/src/data/useLeagueData.test.js`**

```js
import { renderHook } from '@testing-library/react'
import useLeagueData from './useLeagueData.js'

test('useLeagueData returns the league dataset with six teams', () => {
  const { result } = renderHook(() => useLeagueData('tdf-2026'))
  expect(result.current.teams).toHaveLength(6)
  expect(result.current.teams[0].name).toBe('Nate')
  expect(result.current.races).toHaveLength(4)
  expect(result.current.draftPool.length).toBeGreaterThanOrEqual(8)
  expect(result.current.meta.stageNum).toBe(11)
  expect(result.current.movers[0]).toEqual({ name: 'Nate', move: 1, note: 'Takes the yellow jersey' })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd web && npm test -- useLeagueData`
Expected: FAIL — cannot resolve `./useLeagueData.js`.

- [ ] **Step 4: Create `web/src/data/useLeagueData.js`**

```js
import sampleData from './sampleData.js'

// Phase 1: returns the placeholder dataset regardless of raceId.
// Phase 2 swap point: fetch('/data.json') for the active race and return
// the same shape. Components depend only on this hook, never on sampleData.
export default function useLeagueData(_raceId) {
  return sampleData
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd web && npm test -- useLeagueData`
Expected: 1 passed.

- [ ] **Step 6: Commit**

```bash
git add web/src/data
git commit -m "feat: placeholder league data behind useLeagueData seam"
```

---

### Task 5: View-model selectors (`lib/selectors.js`)

**Files:**
- Create: `web/src/lib/selectors.js`
- Test: `web/src/lib/selectors.test.js`

**Interfaces:**
- Consumes: `fmtMove`, `fmtDelta`, `fmtToday`, `surname`, `ordinal` from `./format.js`.
- Produces (pure functions over the `useLeagueData()` shape):
  - `buildStandingsRows(teams) -> [{ name, rank, totalTime, gap, gapColorVar, move:{label,color}, isLeader, isLast, subline, riders:[{ name, gcLabel, time, delta:{label,color} }] }]`
  - `buildTeamView(teams, selectedName) -> { name, total, isYou, isLeader, isLast, gapColorVar, gapLine, standingLine, riders:[{ name, gcNum, proTeam, time, gapGC, today:{label,color} }] }`
  - `buildRiderProfile(teams, name, stageNum) -> { name, team, role, nat, age, gcRank, gcTime, gapGC, form:[{label,place}], owned } | null`
  - `buildDraftView(draftPool, picks) -> { slots:[{ slotNo, filled, name, team, role }], pool:[{ name, team, role, disabled }], count, full, note, countColor, confirmLabel }`
  - `buildRaceCards(races, currentRaceId) -> [{ ...race, viewing, badge:{bg,color} }]`

`gapColorVar` is the string `'var(--accent-ink)'` for the leader else `'#9A968D'`. The leader's `gapLine` is `'Leads by ' + secondPlaceGap.replace('+','')`; non-leaders `gap + ' behind'`. `standingLine` = `ordinal(rank) + ' of 6 overall · 3 riders'`. `owned` = `'Drafted by ' + owner + (owner==='Aaron' ? ' (you)' : '')` or `'Not drafted in your league'`. Form label = `'St ' + (stageNum - 2 + i)`, place = `ordinal(form[i])`. Race badge: Live → `{bg:'#E6F4EC',color:'#2F7D52'}`, Complete → `{bg:'#F0EEE8',color:'#8C8881'}`, else `{bg:'#F4F2EC',color:'#9A968D'}`.

- [ ] **Step 1: Write the failing test `web/src/lib/selectors.test.js`**

```js
import sampleData from '../data/sampleData.js'
import {
  buildStandingsRows, buildTeamView, buildRiderProfile, buildDraftView, buildRaceCards,
} from './selectors.js'

const { teams, draftPool, races } = sampleData

test('buildStandingsRows builds rows with subline and leader gap color', () => {
  const rows = buildStandingsRows(teams)
  expect(rows).toHaveLength(6)
  const nate = rows[0]
  expect(nate.isLeader).toBe(true)
  expect(nate.gap).toBe('Leader')
  expect(nate.gapColorVar).toBe('var(--accent-ink)')
  expect(nate.subline).toBe('Lipowitz  ·  Almeida  ·  Mas')
  expect(nate.move).toEqual({ label: '▲ 1', color: '#3E8F5F' })
  expect(rows[5].isLast).toBe(true)
  expect(rows[1].gapColorVar).toBe('#9A968D')
})

test('buildTeamView for the leader shows "Leads by" using second place gap', () => {
  const view = buildTeamView(teams, 'Nate')
  expect(view.isLeader).toBe(true)
  expect(view.gapLine).toBe('Leads by 1:18')
  expect(view.standingLine).toBe('1st of 6 overall · 3 riders')
  expect(view.riders[0].gcNum).toBe('5')
})

test('buildTeamView for Aaron marks isYou and behind gap', () => {
  const view = buildTeamView(teams, 'Aaron')
  expect(view.isYou).toBe(true)
  expect(view.gapLine).toBe('+6:41 behind')
  expect(view.riders[0].today).toEqual({ label: '– Held position', color: '#9A968D' })
})

test('buildRiderProfile resolves owner and form labels', () => {
  const rp = buildRiderProfile(teams, 'Tadej Pogačar', 11)
  expect(rp.gcRank).toBe('#1')
  expect(rp.owned).toBe('Drafted by Aaron (you)')
  expect(rp.form).toEqual([
    { label: 'St 9', place: '1st' },
    { label: 'St 10', place: '2nd' },
    { label: 'St 11', place: '1st' },
  ])
  expect(buildRiderProfile(teams, 'Nobody', 11)).toBeNull()
})

test('buildDraftView gates at three picks', () => {
  const two = buildDraftView(draftPool, ['Tadej Pogačar', 'Santiago Buitrago'])
  expect(two.full).toBe(false)
  expect(two.count).toBe('2')
  expect(two.countColor).toBe('#C25B43')
  expect(two.confirmLabel).toBe('Pick 1 more rider')
  expect(two.slots[2].filled).toBe(false)
  // pool excludes already-picked riders and is enabled while slots remain
  expect(two.pool.find(r => r.name === 'Tadej Pogačar')).toBeUndefined()
  expect(two.pool.every(r => r.disabled === false)).toBe(true)

  const three = buildDraftView(draftPool, ['Tadej Pogačar', 'Egan Bernal', 'Adam Yates'])
  expect(three.full).toBe(true)
  expect(three.countColor).toBe('#3E8F5F')
  expect(three.confirmLabel).toBe('Save team')
  expect(three.pool.every(r => r.disabled === true)).toBe(true)
})

test('buildRaceCards marks the viewing race and badges by status', () => {
  const cards = buildRaceCards(races, 'tdf-2026')
  const live = cards.find(c => c.id === 'tdf-2026')
  expect(live.viewing).toBe(true)
  expect(live.badge).toEqual({ bg: '#E6F4EC', color: '#2F7D52' })
  const complete = cards.find(c => c.id === 'tdf-2025')
  expect(complete.badge).toEqual({ bg: '#F0EEE8', color: '#8C8881' })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npm test -- selectors`
Expected: FAIL — cannot resolve `./selectors.js`.

- [ ] **Step 3: Create `web/src/lib/selectors.js`**

```js
import { fmtMove, fmtDelta, fmtToday, surname, ordinal } from './format.js'

const MUTED = '#9A968D'
const LEADER_VAR = 'var(--accent-ink)'

export function buildStandingsRows(teams) {
  return teams.map(p => ({
    name: p.name,
    rank: String(p.rank),
    totalTime: p.total,
    gap: p.gap,
    gapColorVar: p.leader ? LEADER_VAR : MUTED,
    move: fmtMove(p.move),
    isLeader: p.leader,
    isLast: p.last,
    subline: p.riders.map(r => surname(r.name)).join('  ·  '),
    riders: p.riders.map(r => ({
      name: r.name,
      gcLabel: '#' + r.gc,
      time: r.time,
      delta: fmtDelta(r.d),
    })),
  }))
}

export function buildTeamView(teams, selectedName) {
  const sel = teams.find(p => p.name === selectedName) || teams[0]
  const second = teams.find(p => p.rank === 2) || {}
  const secondGap = second.gap || ''
  return {
    name: sel.name,
    total: sel.total,
    isYou: sel.name === 'Aaron',
    isLeader: sel.leader,
    isLast: sel.last,
    gapColorVar: sel.leader ? LEADER_VAR : MUTED,
    gapLine: sel.leader ? 'Leads by ' + secondGap.replace('+', '') : sel.gap + ' behind',
    standingLine: ordinal(sel.rank) + ' of 6 overall · 3 riders',
    riders: sel.riders.map(r => ({
      name: r.name,
      gcNum: String(r.gc),
      proTeam: r.proTeam,
      time: r.time,
      gapGC: r.gapGC,
      today: fmtToday(r.d),
    })),
  }
}

function riderIndex(teams) {
  const idx = {}
  teams.forEach(t => t.riders.forEach(r => { idx[r.name] = { rider: r, owner: t.name } }))
  return idx
}

export function buildRiderProfile(teams, name, stageNum) {
  const hit = riderIndex(teams)[name]
  if (!hit) return null
  const r = hit.rider
  return {
    name: r.name,
    team: r.proTeam,
    role: r.role,
    nat: r.nat,
    age: r.age + ' yrs',
    gcRank: '#' + r.gc,
    gcTime: r.time,
    gapGC: r.gapGC,
    form: r.form.map((p, i) => ({ label: 'St ' + (stageNum - 2 + i), place: ordinal(p) })),
    owned: 'Drafted by ' + hit.owner + (hit.owner === 'Aaron' ? ' (you)' : ''),
  }
}

export function buildDraftView(draftPool, picks) {
  const full = picks.length >= 3
  const byName = n => draftPool.find(x => x.name === n) || { name: n, team: '', role: '' }
  const slots = [0, 1, 2].map(i => {
    const nm = picks[i]
    if (nm) { const r = byName(nm); return { slotNo: String(i + 1), filled: true, name: nm, team: r.team, role: r.role } }
    return { slotNo: String(i + 1), filled: false }
  })
  const pool = draftPool.filter(r => !picks.includes(r.name)).map(r => ({
    name: r.name, team: r.team, role: r.role, disabled: full,
  }))
  const remaining = 3 - picks.length
  return {
    slots,
    pool,
    count: String(picks.length),
    full,
    note: full
      ? 'Your team is set · picks lock when Stage 12 starts'
      : 'Pick ' + remaining + ' more · picks lock when Stage 12 starts',
    countColor: full ? '#3E8F5F' : '#C25B43',
    confirmLabel: full ? 'Save team' : 'Pick ' + remaining + ' more rider' + (remaining === 1 ? '' : 's'),
  }
}

export function buildRaceCards(races, currentRaceId) {
  const badge = s =>
    s === 'Live' ? { bg: '#E6F4EC', color: '#2F7D52' }
    : s === 'Complete' ? { bg: '#F0EEE8', color: '#8C8881' }
    : { bg: '#F4F2EC', color: '#9A968D' }
  return races.map(rc => ({ ...rc, stages: String(rc.stages), viewing: rc.id === currentRaceId, badge: badge(rc.status) }))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npm test -- selectors`
Expected: 6 passed.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/selectors.js web/src/lib/selectors.test.js
git commit -m "feat: pure view-model selectors for all screens"
```

---

### Task 6: Shared presentational components

**Files:**
- Create: `web/src/components/Badge.jsx`
- Create: `web/src/components/MovementArrow.jsx`
- Create: `web/src/components/ProgressBar.jsx`
- Create: `web/src/components/Callout.jsx`
- Create: `web/src/components/BrandBar.jsx`
- Create: `web/src/components/TabNav.jsx`
- Test: `web/src/components/components.test.jsx`

**Interfaces:**
- Produces:
  - `Badge({ kind, children })` — `kind` ∈ `'jersey' | 'you' | 'viewing' | 'status'`. `jersey`/`viewing` use accent vars; `you` is dark `#1A1813`; `status` takes explicit `bg`/`color` props instead.
  - `Badge({ kind:'status', bg, color, children })`
  - `MovementArrow({ move, show })` — renders `fmtMove(move).label` colored, or `null` when `show` is false.
  - `ProgressBar({ pct })` — `pct` like `'52%'`; dark fill on `#ECEAE4` track.
  - `Callout({ children })` — accent-tint box with accent dot.
  - `BrandBar()` — wordmark + jersey swatch.
  - `TabNav({ tabs, active, onSelect })` — `tabs` = `[['Standings','standings'],...]`.

- [ ] **Step 1: Write the failing test `web/src/components/components.test.jsx`**

```jsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Badge from './Badge.jsx'
import MovementArrow from './MovementArrow.jsx'
import ProgressBar from './ProgressBar.jsx'
import TabNav from './TabNav.jsx'
import BrandBar from './BrandBar.jsx'

test('Badge renders its label', () => {
  render(<Badge kind="jersey">Yellow Jersey</Badge>)
  expect(screen.getByText('Yellow Jersey')).toBeInTheDocument()
})

test('MovementArrow hides when show is false', () => {
  const { rerender, container } = render(<MovementArrow move={1} show={true} />)
  expect(screen.getByText('▲ 1')).toBeInTheDocument()
  rerender(<MovementArrow move={1} show={false} />)
  expect(container).toBeEmptyDOMElement()
})

test('ProgressBar sets the fill width', () => {
  const { container } = render(<ProgressBar pct="52%" />)
  const fill = container.querySelector('[data-fill]')
  expect(fill).toHaveStyle({ width: '52%' })
})

test('BrandBar shows the wordmark', () => {
  render(<BrandBar />)
  expect(screen.getByText('Sunshine Fantasy')).toBeInTheDocument()
})

test('TabNav calls onSelect with the tab key', async () => {
  const onSelect = vi.fn()
  const tabs = [['Standings', 'standings'], ['Stage', 'stage']]
  render(<TabNav tabs={tabs} active="standings" onSelect={onSelect} />)
  await userEvent.click(screen.getByText('Stage'))
  expect(onSelect).toHaveBeenCalledWith('stage')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npm test -- components`
Expected: FAIL — cannot resolve component modules.

- [ ] **Step 3: Create `web/src/components/Badge.jsx`**

```jsx
const base = {
  fontSize: 8, fontWeight: 800, letterSpacing: '.08em',
  textTransform: 'uppercase', padding: '2px 5px', borderRadius: 3,
}

export default function Badge({ kind, bg, color, children }) {
  if (kind === 'status') {
    return (
      <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 999, background: bg, color }}>
        {children}
      </span>
    )
  }
  if (kind === 'you') {
    return <span style={{ ...base, color: '#FFFFFF', background: '#1A1813' }}>{children}</span>
  }
  // jersey | viewing
  return <span style={{ ...base, color: 'var(--accent-ink)', background: 'var(--accent)' }}>{children}</span>
}
```

- [ ] **Step 4: Create `web/src/components/MovementArrow.jsx`**

```jsx
import { fmtMove } from '../lib/format.js'

export default function MovementArrow({ move, show }) {
  if (!show) return null
  const m = fmtMove(move)
  return (
    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.02em', marginTop: 3, color: m.color }}>
      {m.label}
    </div>
  )
}
```

- [ ] **Step 5: Create `web/src/components/ProgressBar.jsx`**

```jsx
export default function ProgressBar({ pct }) {
  return (
    <div style={{ height: 4, background: '#ECEAE4', borderRadius: 2, marginTop: 7, overflow: 'hidden' }}>
      <div data-fill style={{ height: '100%', width: pct, background: '#1A1813', borderRadius: 2 }} />
    </div>
  )
}
```

- [ ] **Step 6: Create `web/src/components/Callout.jsx`**

```jsx
export default function Callout({ children }) {
  return (
    <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', background: 'var(--accent-tint)', border: '1px solid var(--accent-border)', borderRadius: 9, padding: '9px 11px' }}>
      <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--accent)', flex: 'none', marginTop: 3 }} />
      <span style={{ fontSize: 12, color: '#5E5A50', lineHeight: 1.4 }}>{children}</span>
    </div>
  )
}
```

- [ ] **Step 7: Create `web/src/components/BrandBar.jsx`**

```jsx
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
```

- [ ] **Step 8: Create `web/src/components/TabNav.jsx`**

```jsx
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
```

- [ ] **Step 9: Run test to verify it passes**

Run: `cd web && npm test -- components`
Expected: 5 passed.

- [ ] **Step 10: Commit**

```bash
git add web/src/components
git commit -m "feat: shared presentational components (badge, arrow, progress, callout, brand, tabs)"
```

---

### Task 7: App shell — state, theming, routing

**Files:**
- Modify: `web/src/App.jsx` (replace the Task 1 placeholder)
- Modify: `web/src/App.test.jsx` (replace the Task 1 smoke test)
- Create: `web/src/screens/Placeholder.jsx` (temporary stub for screens not yet built — replaced as Tasks 8–13 land)

**Interfaces:**
- Consumes: `useLeagueData` (Task 4), `accentForRace`/`themeVars` (Task 2), `BrandBar`/`TabNav` (Task 6), and screen components (added in Tasks 8–13).
- Produces: `App` default export. State as defined in Global Constraints. Handlers passed down: `setScreen(key)` (clears `sub`), `toggle(name)`, `setTeam(name)`, `setRace(id)` (also writes `?race=`), `openDraft()`, `openRider(name)`, `closeSub()`, `addPick(name)`, `removePick(name)`.

This task wires state + theme wrapper + brand/tab chrome and renders a per-screen stub so the shell is testable before individual screens exist. Each later task swaps its stub for the real screen.

- [ ] **Step 1: Create `web/src/screens/Placeholder.jsx`**

```jsx
export default function Placeholder({ name }) {
  return <div style={{ padding: 18 }} data-screen={name}>{name} screen</div>
}
```

- [ ] **Step 2: Replace `web/src/App.jsx`**

```jsx
import { useState, useEffect } from 'react'
import useLeagueData from './data/useLeagueData.js'
import { accentForRace, themeVars } from './theme.js'
import BrandBar from './components/BrandBar.jsx'
import TabNav from './components/TabNav.jsx'
import Placeholder from './screens/Placeholder.jsx'

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
  if (sub === 'draft') body = <Placeholder name="draft" />
  else if (sub && sub.type === 'rider') body = <Placeholder name="rider" />
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
      {screen === 'standings' && <Placeholder name="standings" />}
      {screen === 'stage' && <Placeholder name="stage" />}
      {screen === 'team' && <Placeholder name="team" />}
      {screen === 'races' && <Placeholder name="races" />}
    </div>
  )
}
```

> Tasks 8–13 each: import the real screen and replace the corresponding `<Placeholder .../>`. The `ctx` object carries everything screens need.

- [ ] **Step 3: Replace `web/src/App.test.jsx`**

```jsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App.jsx'

test('renders brand bar and standings by default', () => {
  render(<App />)
  expect(screen.getByText('Sunshine Fantasy')).toBeInTheDocument()
  expect(screen.getByText('standings screen')).toBeInTheDocument()
})

test('switching tabs changes the screen and clears sub-screens', async () => {
  render(<App />)
  await userEvent.click(screen.getByText('Team'))
  expect(screen.getByText('team screen')).toBeInTheDocument()
  await userEvent.click(screen.getByText('Races'))
  expect(screen.getByText('races screen')).toBeInTheDocument()
})
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd web && npm test -- App`
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add web/src/App.jsx web/src/App.test.jsx web/src/screens/Placeholder.jsx
git commit -m "feat: app shell with state, accent theming, tab routing, ?race= sync"
```

---

### Task 8: Standings screen

**Files:**
- Create: `web/src/screens/Standings.jsx`
- Modify: `web/src/App.jsx` (import `Standings`, replace the standings `<Placeholder />`)
- Test: `web/src/screens/Standings.test.jsx`

**Interfaces:**
- Consumes: `buildStandingsRows` (Task 5), `MovementArrow`/`ProgressBar`/`Callout`/`Badge` (Task 6), and `ctx` props: `data`, `expanded`, `toggle`, `showMovement`.
- Produces: `Standings({ data, expanded, toggle, showMovement })`.

- [ ] **Step 1: Write the failing test `web/src/screens/Standings.test.jsx`**

```jsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import Standings from './Standings.jsx'
import sampleData from '../data/sampleData.js'

function Harness() {
  const [expanded, setExpanded] = useState({ Nate: true })
  const toggle = name => setExpanded(e => ({ ...e, [name]: !e[name] }))
  return <Standings data={sampleData} expanded={expanded} toggle={toggle} showMovement={true} />
}

test('shows title, leader badge, and six teams', () => {
  render(<Harness />)
  expect(screen.getByText('Tour de France 2026')).toBeInTheDocument()
  expect(screen.getByText('Yellow Jersey')).toBeInTheDocument()
  expect(screen.getByText('Nate')).toBeInTheDocument()
  expect(screen.getByText('Jeremy')).toBeInTheDocument()
  expect(screen.getByText('Leader')).toBeInTheDocument()
})

test('leader expanded by default reveals its riders; clicking another expands it', async () => {
  render(<Harness />)
  // Nate open by default -> his rider visible
  expect(screen.getByText('Florian Lipowitz')).toBeInTheDocument()
  // Leo collapsed -> rider not shown yet
  expect(screen.queryByText('Remco Evenepoel')).not.toBeInTheDocument()
  await userEvent.click(screen.getByText('Leo'))
  expect(screen.getByText('Remco Evenepoel')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npm test -- Standings`
Expected: FAIL — cannot resolve `./Standings.jsx`.

- [ ] **Step 3: Create `web/src/screens/Standings.jsx`**

```jsx
import { buildStandingsRows } from '../lib/selectors.js'
import MovementArrow from '../components/MovementArrow.jsx'
import ProgressBar from '../components/ProgressBar.jsx'
import Callout from '../components/Callout.jsx'
import Badge from '../components/Badge.jsx'

export default function Standings({ data, expanded, toggle, showMovement }) {
  const { meta } = data
  const rows = buildStandingsRows(data.teams)
  return (
    <div>
      <div style={{ padding: '18px 18px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: '#A8A49C' }}>The Sunshine League</span>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.04em', color: '#A8A49C' }}>Updated {meta.updated}</span>
        </div>
        <div style={{ fontSize: 25, fontWeight: 700, color: '#1A1813', marginTop: 7, letterSpacing: '-.015em' }}>{meta.name}</div>
        <div style={{ marginTop: 15 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: '#8C8881' }}>
            <span>Stage {meta.stageNum} of {meta.totalStages}</span>
            <span>{meta.progressPct} done</span>
          </div>
          <ProgressBar pct={meta.progressPct} />
        </div>
        <div style={{ marginTop: 14 }}>
          <Callout>{meta.recap}</Callout>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', padding: '0 18px 8px', fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#B4B0A6' }}>
        <span style={{ width: 34, textAlign: 'center' }}>#</span>
        <span style={{ flex: 1, paddingLeft: 14 }}>Team</span>
        <span>Total time</span>
      </div>

      {rows.map(p => (
        <div key={p.name} style={{ borderTop: '1px solid #ECEAE4' }}>
          <div onClick={() => toggle(p.name)} style={{ position: 'relative', cursor: 'pointer', overflow: 'hidden' }}>
            {p.isLeader && <div style={{ position: 'absolute', inset: 0, background: 'var(--accent-tint)' }} />}
            {p.isLeader && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'var(--accent)' }} />}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', padding: '13px 18px 13px 16px' }}>
              <div style={{ width: 34, flex: 'none', textAlign: 'center' }}>
                <div style={{ fontSize: 19, fontWeight: 700, color: '#1A1813', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{p.rank}</div>
                <MovementArrow move={data.teams.find(t => t.name === p.name).move} show={showMovement} />
              </div>
              <div style={{ flex: '1 1 auto', minWidth: 0, paddingLeft: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 17, fontWeight: 600, color: '#1A1813' }}>{p.name}</span>
                  {p.isLeader && <Badge kind="jersey">Yellow Jersey</Badge>}
                  {p.isLast && <span title="Lanterne rouge" style={{ fontSize: 14 }}>🐼</span>}
                </div>
                <div style={{ fontSize: 11, color: '#9A968D', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.subline}</div>
              </div>
              <div style={{ textAlign: 'right', flex: 'none', paddingLeft: 10 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1A1813', fontVariantNumeric: 'tabular-nums', letterSpacing: '-.01em', lineHeight: 1.1 }}>{p.totalTime}</div>
                <div style={{ fontSize: 12, fontWeight: 600, fontVariantNumeric: 'tabular-nums', marginTop: 2, color: p.gapColorVar }}>{p.gap}</div>
              </div>
              <div style={{ width: 18, flex: 'none', textAlign: 'center', color: '#C2BEB4', fontSize: 11, paddingLeft: 4 }}>{expanded[p.name] ? '▾' : '▸'}</div>
            </div>
          </div>
          {expanded[p.name] && (
            <div style={{ padding: '2px 18px 14px 64px', background: '#FFFFFF' }}>
              {p.riders.map(r => (
                <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderTop: '1px solid #F2F0EA' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#B4B0A6', width: 26, fontVariantNumeric: 'tabular-nums' }}>{r.gcLabel}</span>
                  <span style={{ flex: 1, fontSize: 13.5, color: '#3A382F', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</span>
                  {showMovement && <span style={{ fontSize: 11, fontWeight: 600, width: 30, textAlign: 'right', color: r.delta.color }}>{r.delta.label}</span>}
                  <span style={{ fontSize: 13, color: '#6E6A62', fontVariantNumeric: 'tabular-nums', width: 70, textAlign: 'right' }}>{r.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <div style={{ padding: '13px 18px', borderTop: '1px solid #ECEAE4', fontSize: 10.5, color: '#A8A49C', lineHeight: 1.5 }}>
        Score = sum of your three riders' GC times. Lowest total wins. Data via procyclingstats.
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Wire into `web/src/App.jsx`**

Add the import at the top with the other screen imports:

```jsx
import Standings from './screens/Standings.jsx'
```

In `renderMain`, replace `{screen === 'standings' && <Placeholder name="standings" />}` with:

```jsx
{screen === 'standings' && <Standings data={ctx.data} expanded={ctx.expanded} toggle={ctx.toggle} showMovement={ctx.showMovement} />}
```

(Also pass `ctx` into `renderMain` — change `renderMain(ctx)` calls already pass it; ensure `renderMain` destructures `ctx` and uses it.)

Update `renderMain` signature usage so it has `ctx`:

```jsx
function renderMain(ctx) {
  const { screen, setScreen } = ctx
  return (
    <div>
      <BrandBar />
      <TabNav tabs={TABS} active={screen} onSelect={setScreen} />
      {screen === 'standings' && <Standings data={ctx.data} expanded={ctx.expanded} toggle={ctx.toggle} showMovement={ctx.showMovement} />}
      {screen === 'stage' && <Placeholder name="stage" />}
      {screen === 'team' && <Placeholder name="team" />}
      {screen === 'races' && <Placeholder name="races" />}
    </div>
  )
}
```

- [ ] **Step 5: Update `web/src/App.test.jsx` default-screen assertion**

Replace `expect(screen.getByText('standings screen')).toBeInTheDocument()` with:

```jsx
expect(screen.getByText('Tour de France 2026')).toBeInTheDocument()
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd web && npm test -- Standings App`
Expected: all passed.

- [ ] **Step 7: Commit**

```bash
git add web/src/screens/Standings.jsx web/src/screens/Standings.test.jsx web/src/App.jsx web/src/App.test.jsx
git commit -m "feat: standings screen with independent row expand"
```

---

### Task 9: Stage screen

**Files:**
- Create: `web/src/screens/Stage.jsx`
- Modify: `web/src/App.jsx` (import + replace stage `<Placeholder />`)
- Test: `web/src/screens/Stage.test.jsx`

**Interfaces:**
- Consumes: `fmtMove` (Task 3), `ctx` props: `data`, `openRider`.
- Produces: `Stage({ data, openRider })`.

- [ ] **Step 1: Write the failing test `web/src/screens/Stage.test.jsx`**

```jsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Stage from './Stage.jsx'
import sampleData from '../data/sampleData.js'

test('renders stage header, winner, movers, and your riders', () => {
  render(<Stage data={sampleData} openRider={() => {}} />)
  expect(screen.getByText('Pau → Luchon-Superbagnères')).toBeInTheDocument()
  expect(screen.getByText('Oscar Onley')).toBeInTheDocument()
  expect(screen.getByText('Takes the yellow jersey')).toBeInTheDocument()
  expect(screen.getByText('Holds GC #1')).toBeInTheDocument()
})

test('clicking a "your riders today" card opens that rider', async () => {
  const openRider = vi.fn()
  render(<Stage data={sampleData} openRider={openRider} />)
  await userEvent.click(screen.getByText('Kévin Vauquelin'))
  expect(openRider).toHaveBeenCalledWith('Kévin Vauquelin')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npm test -- Stage`
Expected: FAIL — cannot resolve `./Stage.jsx`.

- [ ] **Step 3: Create `web/src/screens/Stage.jsx`**

```jsx
import { fmtMove } from '../lib/format.js'

export default function Stage({ data, openRider }) {
  const { stage, movers, yourToday } = data
  return (
    <div>
      <div style={{ padding: '18px 18px 14px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: '#A8A49C' }}>Stage {stage.stageNum} · {stage.date}</div>
        <div style={{ fontSize: 23, fontWeight: 700, color: '#1A1813', marginTop: 6, letterSpacing: '-.015em', lineHeight: 1.15 }}>{stage.route}</div>
        <div style={{ fontSize: 12.5, color: '#6E6A62', marginTop: 6 }}>{stage.type} · {stage.km}</div>
      </div>

      <div style={{ padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 13, background: 'var(--accent-tint)', border: '1px solid var(--accent-border)', borderRadius: 13, padding: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--accent)', color: 'var(--accent-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flex: 'none' }}>🏆</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--accent-ink)' }}>Stage winner</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1A1813', marginTop: 2 }}>{stage.winner}</div>
            <div style={{ fontSize: 11.5, color: '#7A7568', marginTop: 1 }}>{stage.winnerTeam}</div>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1813', fontVariantNumeric: 'tabular-nums', flex: 'none' }}>{stage.winnerTime}</div>
        </div>
      </div>

      <div style={{ padding: '20px 18px 6px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#B4B0A6' }}>League shake-up</div>
      </div>
      <div style={{ padding: '0 18px 6px' }}>
        {movers.map(m => {
          const mv = fmtMove(m.move)
          return (
            <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 0', borderTop: '1px solid #F2F0EA' }}>
              <span style={{ fontSize: 13, fontWeight: 700, width: 34, color: mv.color }}>{mv.label}</span>
              <span style={{ fontSize: 14.5, fontWeight: 600, color: '#1A1813', width: 66 }}>{m.name}</span>
              <span style={{ flex: 1, fontSize: 12.5, color: '#6E6A62' }}>{m.note}</span>
            </div>
          )
        })}
      </div>

      <div style={{ padding: '18px 18px 6px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#B4B0A6' }}>Your riders today</div>
      </div>
      <div style={{ padding: '0 16px 18px' }}>
        {yourToday.map(r => (
          <div key={r.name} onClick={() => openRider(r.name)} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#FFFFFF', border: '1px solid #E8E5DD', borderRadius: 11, padding: '12px 13px', marginBottom: 9, cursor: 'pointer' }}>
            <span style={{ width: 34, textAlign: 'center', fontSize: 15, fontWeight: 800, color: '#1A1813', fontVariantNumeric: 'tabular-nums', flex: 'none' }}>{r.place}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: '#1A1813', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
              <div style={{ fontSize: 11, color: '#9A968D', marginTop: 1 }}>{r.note}</div>
            </div>
            <span style={{ fontSize: 13, color: '#6E6A62', fontVariantNumeric: 'tabular-nums', flex: 'none' }}>{r.gap}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Wire into `web/src/App.jsx`**

Add import:

```jsx
import Stage from './screens/Stage.jsx'
```

Replace `{screen === 'stage' && <Placeholder name="stage" />}` with:

```jsx
{screen === 'stage' && <Stage data={ctx.data} openRider={ctx.openRider} />}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd web && npm test -- Stage`
Expected: 2 passed.

- [ ] **Step 6: Commit**

```bash
git add web/src/screens/Stage.jsx web/src/screens/Stage.test.jsx web/src/App.jsx
git commit -m "feat: stage screen with winner, shake-up, your-riders cards"
```

---

### Task 10: Team screen

**Files:**
- Create: `web/src/screens/Team.jsx`
- Modify: `web/src/App.jsx` (import + replace team `<Placeholder />`)
- Test: `web/src/screens/Team.test.jsx`

**Interfaces:**
- Consumes: `buildTeamView` (Task 5), `Badge` (Task 6), `ctx` props: `data`, `team`, `setTeam`, `showMovement`, `openRider`, `openDraft`.
- Produces: `Team({ data, team, setTeam, showMovement, openRider, openDraft })`.

- [ ] **Step 1: Write the failing test `web/src/screens/Team.test.jsx`**

```jsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import Team from './Team.jsx'
import sampleData from '../data/sampleData.js'

function Harness({ openRider = () => {}, openDraft = () => {} }) {
  const [team, setTeam] = useState('Aaron')
  return <Team data={sampleData} team={team} setTeam={setTeam} showMovement={true} openRider={openRider} openDraft={openDraft} />
}

test('shows your team with You badge and Edit button', () => {
  render(<Harness />)
  expect(screen.getByText('You')).toBeInTheDocument()
  expect(screen.getByText('Tadej Pogačar')).toBeInTheDocument()
  expect(screen.getByText('Edit your picks')).toBeInTheDocument()
  expect(screen.getByText('+6:41 behind')).toBeInTheDocument()
})

test('selecting another chip swaps the team and hides Edit button', async () => {
  render(<Harness />)
  await userEvent.click(screen.getByText('Nate'))
  expect(screen.getByText('Leads by 1:18')).toBeInTheDocument()
  expect(screen.queryByText('Edit your picks')).not.toBeInTheDocument()
})

test('clicking a rider card opens the rider', async () => {
  const openRider = vi.fn()
  render(<Harness openRider={openRider} />)
  await userEvent.click(screen.getByText('Tadej Pogačar'))
  expect(openRider).toHaveBeenCalledWith('Tadej Pogačar')
})
```

> Note: "Nate" appears both as a chip and (after selecting) as the header. The default team is Aaron, so before clicking, "Nate" exists only as a chip — `getByText('Nate')` is unambiguous at click time.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npm test -- Team`
Expected: FAIL — cannot resolve `./Team.jsx`.

- [ ] **Step 3: Create `web/src/screens/Team.jsx`**

```jsx
import { buildTeamView } from '../lib/selectors.js'
import Badge from '../components/Badge.jsx'

export default function Team({ data, team, setTeam, showMovement, openRider, openDraft }) {
  const view = buildTeamView(data.teams, team)
  return (
    <div>
      <div className="noscroll" style={{ display: 'flex', gap: 7, overflowX: 'auto', padding: '14px 16px 4px', scrollbarWidth: 'none' }}>
        {data.teams.map(p => {
          const active = team === p.name
          return (
            <div key={p.name} onClick={() => setTeam(p.name)} style={{ flex: 'none', padding: '7px 13px', borderRadius: 999, cursor: 'pointer', fontSize: 13, fontWeight: 600, border: '1px solid ' + (active ? 'var(--accent)' : '#E4E1D8'), background: active ? 'var(--accent)' : '#FFFFFF', color: active ? 'var(--accent-ink)' : '#6E6A62' }}>
              {p.name}
            </div>
          )
        })}
      </div>

      <div style={{ padding: '14px 18px 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 23, fontWeight: 700, color: '#1A1813', letterSpacing: '-.01em' }}>{view.name}</span>
          {view.isYou && <Badge kind="you">You</Badge>}
          {view.isLeader && <Badge kind="jersey">Yellow Jersey</Badge>}
          {view.isLast && <span title="Lanterne rouge" style={{ fontSize: 15 }}>🐼</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 7 }}>
          <span style={{ fontSize: 24, fontWeight: 700, color: '#1A1813', fontVariantNumeric: 'tabular-nums', letterSpacing: '-.01em' }}>{view.total}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: view.gapColorVar }}>{view.gapLine}</span>
        </div>
        <div style={{ fontSize: 12, color: '#9A968D', marginTop: 5 }}>{view.standingLine}</div>
      </div>

      <div style={{ padding: '12px 16px 6px' }}>
        {view.riders.map(r => (
          <div key={r.name} onClick={() => openRider(r.name)} style={{ background: '#FFFFFF', border: '1px solid #E8E5DD', borderRadius: 12, padding: '13px 14px', marginBottom: 10, cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: '#F4F2EC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '.06em', color: '#A8A49C' }}>GC</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#1A1813', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{r.gcNum}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#1A1813', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
                <div style={{ fontSize: 11, color: '#9A968D', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.proTeam}</div>
              </div>
              <div style={{ textAlign: 'right', flex: 'none' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1813', fontVariantNumeric: 'tabular-nums' }}>{r.time}</div>
                <div style={{ fontSize: 11.5, color: '#9A968D', fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>{r.gapGC}</div>
              </div>
            </div>
            {showMovement && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 11, paddingTop: 10, borderTop: '1px solid #F2F0EA' }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#B4B0A6' }}>Today</span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: r.today.color }}>{r.today.label}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {view.isYou && (
        <div style={{ padding: '0 16px 18px' }}>
          <div onClick={openDraft} style={{ cursor: 'pointer', textAlign: 'center', padding: 13, borderRadius: 11, fontSize: 13.5, fontWeight: 700, color: '#1A1813', background: '#FFFFFF', border: '1px solid #D8D4CA' }}>Edit your picks</div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Wire into `web/src/App.jsx`**

Add import:

```jsx
import Team from './screens/Team.jsx'
```

Replace `{screen === 'team' && <Placeholder name="team" />}` with:

```jsx
{screen === 'team' && <Team data={ctx.data} team={ctx.team} setTeam={ctx.setTeam} showMovement={ctx.showMovement} openRider={ctx.openRider} openDraft={ctx.openDraft} />}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd web && npm test -- Team`
Expected: 3 passed.

- [ ] **Step 6: Commit**

```bash
git add web/src/screens/Team.jsx web/src/screens/Team.test.jsx web/src/App.jsx
git commit -m "feat: team screen with chip selector and rider cards"
```

---

### Task 11: Races screen

**Files:**
- Create: `web/src/screens/Races.jsx`
- Modify: `web/src/App.jsx` (import + replace races `<Placeholder />`)
- Test: `web/src/screens/Races.test.jsx`

**Interfaces:**
- Consumes: `buildRaceCards` (Task 5), `Badge` (Task 6), `ctx` props: `data`, `race`, `setRace`.
- Produces: `Races({ data, race, setRace })`.

- [ ] **Step 1: Write the failing test `web/src/screens/Races.test.jsx`**

```jsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Races from './Races.jsx'
import sampleData from '../data/sampleData.js'

test('renders four races with the active one marked Viewing', () => {
  render(<Races data={sampleData} race="tdf-2026" setRace={() => {}} />)
  expect(screen.getByText('Choose competition')).toBeInTheDocument()
  expect(screen.getByText('Viewing')).toBeInTheDocument()
  expect(screen.getByText('Won by Aaron')).toBeInTheDocument()
  expect(screen.getAllByText('Upcoming')).toHaveLength(2)
})

test('clicking a race selects it', async () => {
  const setRace = vi.fn()
  render(<Races data={sampleData} race="tdf-2026" setRace={setRace} />)
  await userEvent.click(screen.getByText("Giro d'Italia 2026"))
  expect(setRace).toHaveBeenCalledWith('giro-2026')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npm test -- Races`
Expected: FAIL — cannot resolve `./Races.jsx`.

- [ ] **Step 3: Create `web/src/screens/Races.jsx`**

```jsx
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
```

- [ ] **Step 4: Wire into `web/src/App.jsx`**

Add import:

```jsx
import Races from './screens/Races.jsx'
```

Replace `{screen === 'races' && <Placeholder name="races" />}` with:

```jsx
{screen === 'races' && <Races data={ctx.data} race={ctx.race} setRace={ctx.setRace} />}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd web && npm test -- Races`
Expected: 2 passed.

- [ ] **Step 6: Commit**

```bash
git add web/src/screens/Races.jsx web/src/screens/Races.test.jsx web/src/App.jsx
git commit -m "feat: races screen with status badges and viewing highlight"
```

---

### Task 12: Draft sub-screen

**Files:**
- Create: `web/src/screens/Draft.jsx`
- Modify: `web/src/App.jsx` (import + replace draft `<Placeholder />`)
- Test: `web/src/screens/Draft.test.jsx`

**Interfaces:**
- Consumes: `buildDraftView` (Task 5), `ctx` props: `data`, `draftPicks`, `addPick`, `removePick`, `closeSub`.
- Produces: `Draft({ data, draftPicks, addPick, removePick, closeSub })`.

- [ ] **Step 1: Write the failing test `web/src/screens/Draft.test.jsx`**

```jsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import Draft from './Draft.jsx'
import sampleData from '../data/sampleData.js'

function Harness() {
  const [picks, setPicks] = useState(['Tadej Pogačar', 'Santiago Buitrago'])
  const addPick = n => setPicks(p => (p.length >= 3 || p.includes(n) ? p : [...p, n]))
  const removePick = n => setPicks(p => p.filter(x => x !== n))
  return <Draft data={sampleData} draftPicks={picks} addPick={addPick} removePick={removePick} closeSub={() => {}} />
}

test('shows two filled slots, one empty, and the pick count', () => {
  render(<Harness />)
  expect(screen.getByText('2 / 3 picked')).toBeInTheDocument()
  expect(screen.getByText('Empty — add a rider below')).toBeInTheDocument()
  expect(screen.getByText('Pick 1 more rider')).toBeInTheDocument()
})

test('adding a third rider fills the slot, gates further adds, and shows Save team', async () => {
  render(<Harness />)
  await userEvent.click(screen.getByText('Egan Bernal'))
  expect(screen.getByText('3 / 3 picked')).toBeInTheDocument()
  expect(screen.getByText('Save team')).toBeInTheDocument()
  expect(screen.queryByText('Empty — add a rider below')).not.toBeInTheDocument()
})

test('removing a pick empties its slot', async () => {
  render(<Harness />)
  const removeButtons = screen.getAllByRole('button', { name: 'remove' })
  await userEvent.click(removeButtons[0])
  expect(screen.getByText('1 / 3 picked')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npm test -- Draft`
Expected: FAIL — cannot resolve `./Draft.jsx`.

- [ ] **Step 3: Create `web/src/screens/Draft.jsx`**

```jsx
import { buildDraftView } from '../lib/selectors.js'

export default function Draft({ data, draftPicks, addPick, removePick, closeSub }) {
  const view = buildDraftView(data.draftPool, draftPicks)
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', padding: '15px 18px', borderBottom: '1px solid #ECEAE4' }}>
        <div onClick={closeSub} style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#6E6A62', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 17, lineHeight: 1 }}>‹</span> Standings
        </div>
      </div>
      <div style={{ padding: '18px 18px 8px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: '#A8A49C' }}>Tour de France 2026</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#1A1813', marginTop: 6, letterSpacing: '-.015em' }}>Edit your three riders</div>
        <div style={{ fontSize: 12, color: '#9A968D', marginTop: 6 }}>{view.note}</div>
      </div>

      <div style={{ padding: '8px 16px 4px' }}>
        {view.slots.map(s => (
          s.filled ? (
            <div key={s.slotNo} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#FFFFFF', border: '1px solid #E4E1D8', borderRadius: 11, padding: '12px 13px', marginBottom: 9 }}>
              <span style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--accent)', color: 'var(--accent-ink)', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>{s.slotNo}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: '#1A1813', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                <div style={{ fontSize: 11, color: '#9A968D', marginTop: 1 }}>{s.team} · {s.role}</div>
              </div>
              <button aria-label="remove" onClick={() => removePick(s.name)} style={{ cursor: 'pointer', width: 26, height: 26, borderRadius: '50%', background: '#F2F0EA', color: '#8C8881', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', border: 'none' }}>×</button>
            </div>
          ) : (
            <div key={s.slotNo} style={{ display: 'flex', alignItems: 'center', gap: 12, border: '1.5px dashed #D8D4CA', borderRadius: 11, padding: '12px 13px', marginBottom: 9 }}>
              <span style={{ width: 26, height: 26, borderRadius: 7, background: '#F2F0EA', color: '#B4B0A6', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>{s.slotNo}</span>
              <span style={{ fontSize: 13.5, color: '#B4B0A6' }}>Empty — add a rider below</span>
            </div>
          )
        ))}
      </div>

      <div style={{ padding: '8px 18px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #ECEAE4', marginTop: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#A8A49C' }}>Available riders</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: view.countColor }}>{view.count} / 3 picked</span>
      </div>

      <div style={{ padding: '2px 16px 16px' }}>
        {view.pool.map(r => (
          <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 4px', borderTop: '1px solid #F2F0EA' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1813', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
              <div style={{ fontSize: 11, color: '#9A968D', marginTop: 1 }}>{r.team}</div>
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: '#8C8881', background: '#F2F0EA', padding: '3px 8px', borderRadius: 999, flex: 'none' }}>{r.role}</span>
            <button aria-label={'add ' + r.name} onClick={() => addPick(r.name)} disabled={r.disabled} style={{ cursor: r.disabled ? 'default' : 'pointer', width: 30, height: 30, borderRadius: '50%', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 600, border: '1px solid ' + (r.disabled ? '#E4E1D8' : 'var(--accent)'), color: r.disabled ? '#C2BEB4' : 'var(--accent-ink)', background: r.disabled ? '#F4F2EC' : 'var(--accent-tint)' }}>+</button>
          </div>
        ))}
      </div>

      <div style={{ padding: '4px 16px 18px' }}>
        <div onClick={closeSub} style={{ cursor: 'pointer', textAlign: 'center', padding: 14, borderRadius: 11, fontSize: 14, fontWeight: 700, background: view.full ? 'var(--accent)' : '#F0EEE8', color: view.full ? 'var(--accent-ink)' : '#B4B0A6' }}>{view.confirmLabel}</div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Wire into `web/src/App.jsx`**

Add import:

```jsx
import Draft from './screens/Draft.jsx'
```

Replace `if (sub === 'draft') body = <Placeholder name="draft" />` with:

```jsx
if (sub === 'draft') body = <Draft data={data} draftPicks={draftPicks} addPick={addPick} removePick={removePick} closeSub={closeSub} />
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd web && npm test -- Draft`
Expected: 3 passed.

- [ ] **Step 6: Commit**

```bash
git add web/src/screens/Draft.jsx web/src/screens/Draft.test.jsx web/src/App.jsx
git commit -m "feat: draft sub-screen with add/remove and 3-pick gate"
```

---

### Task 13: Rider profile sub-screen

**Files:**
- Create: `web/src/screens/RiderProfile.jsx`
- Modify: `web/src/App.jsx` (import + replace rider `<Placeholder />`)
- Test: `web/src/screens/RiderProfile.test.jsx`

**Interfaces:**
- Consumes: `buildRiderProfile` (Task 5), `ctx` props: `data`, `sub` (the `{type:'rider', name}` object), `closeSub`.
- Produces: `RiderProfile({ data, name, closeSub })`.

- [ ] **Step 1: Write the failing test `web/src/screens/RiderProfile.test.jsx`**

```jsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RiderProfile from './RiderProfile.jsx'
import sampleData from '../data/sampleData.js'

test('renders rider header, stats, form, and owner', () => {
  render(<RiderProfile data={sampleData} name="Tadej Pogačar" closeSub={() => {}} />)
  expect(screen.getByText('Tadej Pogačar')).toBeInTheDocument()
  expect(screen.getByText('UAE Team Emirates')).toBeInTheDocument()
  expect(screen.getByText('#1')).toBeInTheDocument()
  expect(screen.getByText('Drafted by Aaron (you)')).toBeInTheDocument()
  expect(screen.getByText('St 11')).toBeInTheDocument()
})

test('back link closes the sub-screen', async () => {
  const closeSub = vi.fn()
  render(<RiderProfile data={sampleData} name="Tadej Pogačar" closeSub={closeSub} />)
  await userEvent.click(screen.getByText('Back'))
  expect(closeSub).toHaveBeenCalled()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npm test -- RiderProfile`
Expected: FAIL — cannot resolve `./RiderProfile.jsx`.

- [ ] **Step 3: Create `web/src/screens/RiderProfile.jsx`**

```jsx
import { buildRiderProfile } from '../lib/selectors.js'

export default function RiderProfile({ data, name, closeSub }) {
  const rp = buildRiderProfile(data.teams, name, data.meta.stageNum)
  const owned = rp ? rp.owned : 'Not drafted in your league'
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', padding: '15px 18px', borderBottom: '1px solid #ECEAE4' }}>
        <div onClick={closeSub} style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#6E6A62', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 17, lineHeight: 1 }}>‹</span> Back
        </div>
      </div>
      {rp && (
        <>
          <div style={{ padding: '20px 18px 6px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: '#A8A49C' }}>{rp.role} · {rp.nat} · {rp.age}</div>
            <div style={{ fontSize: 27, fontWeight: 700, color: '#1A1813', marginTop: 6, letterSpacing: '-.02em' }}>{rp.name}</div>
            <div style={{ fontSize: 13, color: '#6E6A62', marginTop: 3 }}>{rp.team}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, padding: '16px 18px 6px' }}>
            {[['GC rank', rp.gcRank, 21], ['GC time', rp.gcTime, 17], ['To leader', rp.gapGC, 17]].map(([label, value, size]) => (
              <div key={label} style={{ background: '#FFFFFF', border: '1px solid #E8E5DD', borderRadius: 11, padding: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#A8A49C' }}>{label}</div>
                <div style={{ fontSize: size, fontWeight: label === 'GC rank' ? 800 : 700, color: '#1A1813', marginTop: label === 'GC rank' ? 5 : 7, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: '14px 18px 6px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#B4B0A6', marginBottom: 9 }}>Recent form — last 3 stages</div>
            <div style={{ display: 'flex', gap: 9 }}>
              {rp.form.map(f => (
                <div key={f.label} style={{ flex: 1, background: '#F4F2EC', borderRadius: 10, padding: 11, textAlign: 'center' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: '#A8A49C' }}>{f.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#1A1813', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>{f.place}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      <div style={{ margin: '16px 18px 20px', padding: '13px 15px', background: 'var(--accent-tint)', border: '1px solid var(--accent-border)', borderRadius: 11, display: 'flex', alignItems: 'center', gap: 9 }}>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--accent)', flex: 'none' }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#5E5A50' }}>{owned}</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Wire into `web/src/App.jsx`**

Add import:

```jsx
import RiderProfile from './screens/RiderProfile.jsx'
```

Replace `else if (sub && sub.type === 'rider') body = <Placeholder name="rider" />` with:

```jsx
else if (sub && sub.type === 'rider') body = <RiderProfile data={data} name={sub.name} closeSub={closeSub} />
```

Remove the now-unused `Placeholder` import once all six screens are wired (Tasks 8–13 complete).

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd web && npm test -- RiderProfile`
Expected: 2 passed.

- [ ] **Step 6: Commit**

```bash
git add web/src/screens/RiderProfile.jsx web/src/screens/RiderProfile.test.jsx web/src/App.jsx
git commit -m "feat: rider profile sub-screen with stats, form, owner callout"
```

---

### Task 14: End-to-end walkthrough, docs, and final verification

**Files:**
- Create: `web/playwright.config.js`
- Create: `web/e2e/flows.spec.js`
- Create: `web/README.md`
- Delete: `web/src/screens/Placeholder.jsx` (no longer referenced)
- Modify: `web/src/App.jsx` (remove the `Placeholder` import if still present)

**Interfaces:**
- Consumes: the running dev server (`npm run dev`, default port 5173).

- [ ] **Step 1: Confirm full unit suite passes**

Run: `cd web && npm test`
Expected: all suites pass (theme, format, useLeagueData, selectors, components, App, all six screens).

- [ ] **Step 2: Create `web/playwright.config.js`**

```js
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
  use: { baseURL: 'http://localhost:5173' },
})
```

- [ ] **Step 3: Create `web/e2e/flows.spec.js`**

```js
import { test, expect } from '@playwright/test'

test('full navigation flow across all screens and sub-screens', async ({ page }) => {
  await page.goto('/')

  // Standings default; leader visible
  await expect(page.getByText('Tour de France 2026').first()).toBeVisible()
  await expect(page.getByText('Yellow Jersey')).toBeVisible()

  // Stage tab
  await page.getByText('Stage', { exact: true }).click()
  await expect(page.getByText('Pau → Luchon-Superbagnères')).toBeVisible()

  // Team tab -> default Aaron -> open draft
  await page.getByText('Team', { exact: true }).click()
  await expect(page.getByText('Edit your picks')).toBeVisible()
  await page.getByText('Edit your picks').click()
  await expect(page.getByText('Edit your three riders')).toBeVisible()

  // Draft: add a third rider, confirm Save team, go back
  await page.getByText('Egan Bernal').click()
  await expect(page.getByText('Save team')).toBeVisible()
  await page.getByText('Save team').click()
  await expect(page.getByText('Edit your picks')).toBeVisible()

  // Open a rider profile from the team screen
  await page.getByText('Tadej Pogačar').first().click()
  await expect(page.getByText('Drafted by Aaron (you)')).toBeVisible()
  await page.getByText('Back').click()

  // Races tab -> switch to Giro -> accent swatch theme changes (pink dot present)
  await page.getByText('Races', { exact: true }).click()
  await expect(page.getByText('Choose competition')).toBeVisible()
  await page.getByText("Giro d'Italia 2026").click()
  await expect(page).toHaveURL(/race=giro-2026/)
})
```

- [ ] **Step 4: Install Playwright browser and run the e2e suite**

Run: `cd web && npx playwright install chromium && npm run e2e`
Expected: 1 passed.

- [ ] **Step 5: Create `web/README.md`**

````markdown
# Sunshine Fantasy (web)

React + Vite recreation of the `design_handoff_tdf2026` prototype.

## Develop
```bash
cd web
npm install
npm run dev      # http://localhost:5173
```

## Test
```bash
npm test         # unit + component (Vitest)
npm run e2e      # end-to-end flow (Playwright)
```

## Build
```bash
npm run build    # outputs web/dist/
npm run preview
```

## Data (phase 1 vs phase 2)
All screens read data through `src/data/useLeagueData.js`. Today it returns
the placeholder `src/data/sampleData.js`.

**Phase 2 (live procyclingstats):** add `scripts/generate_data.py` (reusing the
repo's `api_client.py` + `races_config.py`) to write `web/public/data.json` for
the active race, then change `useLeagueData` to `fetch('/data.json')`. The JSON
shape is documented in `docs/superpowers/specs/2026-06-18-sunshine-fantasy-tdf2026-redesign-design.md`
(§7). Movement deltas (`move`/`d`) require persisting a daily GC snapshot to diff.

## Deploy (when ready)
Static host. On Vercel: set **Root Directory** = `web`, framework **Vite**,
build `npm run build`, output `dist`. Push to deploy. Schedule the phase-2 data
refresh via a GitHub Action cron during the race.
````

- [ ] **Step 6: Delete the placeholder stub and clean up its import**

Delete `web/src/screens/Placeholder.jsx`. In `web/src/App.jsx`, remove the line `import Placeholder from './screens/Placeholder.jsx'` if it is still present (all six screens are now wired, so nothing references it).

- [ ] **Step 7: Run the full unit suite again to confirm nothing broke**

Run: `cd web && npm test`
Expected: all suites pass; no unresolved `Placeholder` import error.

- [ ] **Step 8: Commit**

```bash
git add web/playwright.config.js web/e2e web/README.md web/src/App.jsx
git rm web/src/screens/Placeholder.jsx
git commit -m "test: e2e walkthrough + web README; remove placeholder stub"
```

---

## Self-Review

**1. Spec coverage** — every spec section maps to a task:
- §4 project structure → Tasks 1, 6 (components), 8–13 (screens).
- §5 state model (screen/sub/expanded/team/race/draftPicks/showMovement; accent derived; transitions) → Task 7 (App) + per-screen tasks; `?race=` sync in Task 7.
- §6 all six screens → Standings (8), Stage (9), Team (10), Races (11), Draft (12), Rider profile (13).
- §7 data seam (`useLeagueData`, JSON contract, field provenance) → Task 4 + documented in `web/README.md` (Task 14).
- §8 verification (dev, Playwright walkthrough, README) → Task 14.
- Global constraints (Archivo, tabular-nums, accent vars, two-emoji rule, ephemeral draft, `web/` isolation) → index.html (Task 1), theme (Task 2), inline styles throughout, draft as local state (Task 7/12).

**2. Placeholder scan** — no "TBD/TODO/handle edge cases" steps; every code step contains full code. The temporary `Placeholder.jsx` is a real, working stub (not a plan placeholder) and is deleted in Task 14.

**3. Type/name consistency** — selector names used by screens match Task 5 definitions exactly: `buildStandingsRows` (Task 8), `buildTeamView` (Task 10), `buildRiderProfile` (Tasks 13), `buildDraftView` (Task 12), `buildRaceCards` (Task 11). Format helpers `fmtMove/fmtDelta/fmtToday/surname/ordinal` (Task 3) consumed by selectors (Task 5), `MovementArrow` (Task 6), and `Stage` (Task 9). `useLeagueData` shape (Task 4) matches every selector's expected fields. Handlers on `ctx` (Task 7) — `toggle/setTeam/setRace/openRider/openDraft/closeSub/addPick/removePick` — match the props each screen consumes.

No gaps found.
