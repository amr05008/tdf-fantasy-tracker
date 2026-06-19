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
