/**
 * SQ-16, a 16-step drum machine. Project 07, "Pasar malam": four patterns of eight tracks.
 * Steps are written as 16 characters, x for a hit and . for a rest, so the patterns read like
 * the grid they become.
 */

export interface Track {
  index: string
  name: string
  /** Sample slot on the device. */
  sample: string
  /** Channel level, dB. */
  level: number
  mute: boolean
}

export const tracks: Track[] = [
  { index: '01', name: 'Kick', sample: 'KCK 909 A', level: -2, mute: false },
  { index: '02', name: 'Snare', sample: 'SNR 707 B', level: -4.5, mute: false },
  { index: '03', name: 'Clap', sample: 'CLP 808', level: -6, mute: false },
  { index: '04', name: 'Closed hat', sample: 'HHC 606', level: -9, mute: false },
  { index: '05', name: 'Open hat', sample: 'HHO 606', level: -11, mute: false },
  { index: '06', name: 'Low tom', sample: 'TOM LO 2', level: -7.5, mute: false },
  { index: '07', name: 'Rim', sample: 'RIM 727', level: -8, mute: true },
  { index: '08', name: 'Sub bass', sample: 'SUB 101 C1', level: -3.5, mute: false },
]

export type PatternId = 'A' | 'B' | 'C' | 'D'

export interface Pattern {
  id: PatternId
  name: string
  rows: string[]
}

export const patterns: Pattern[] = [
  {
    id: 'A',
    name: 'Main groove',
    rows: [
      'x...x...x...x...',
      '................',
      '....x.......x...',
      '..x...x...x...x.',
      '..............x.',
      '................',
      '...x......x..x..',
      'x..x..x...x.x...',
    ],
  },
  {
    id: 'B',
    name: 'Break',
    rows: [
      'x......x..x.....',
      '....x.......x..x',
      '................',
      'x.x.x.x.x.x.x.x.',
      '.......x........',
      '...........x..x.',
      '..x..x....x.....',
      'x......x..x.....',
    ],
  },
  {
    id: 'C',
    name: 'Half-time',
    rows: [
      'x.......x.x.....',
      '........x.......',
      '........x.......',
      'x.x.x.x.x.x.x.x.',
      '....x.......x...',
      '..............xx',
      '................',
      'x.....x.x.......',
    ],
  },
  {
    id: 'D',
    name: 'Fill',
    rows: [
      'x...x...x...x...',
      '............xxxx',
      '................',
      'x.x.x.x.x.x.....',
      '................',
      '........x.x.x...',
      '................',
      'x...x...x...x...',
    ],
  },
]

export const parse = (row: string) => Array.from(row, (c) => c === 'x')

export const project = { id: '07', name: 'Pasar malam', saved: '02 Nov 2026, 23:41 WIB' }
