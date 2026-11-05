/**
 * Organization settings, now. The same Kopra Labs as the Then screen: its organization, members,
 * roles, sign-in policy and alert defaults are read straight from `org-settings/data.ts`, so the
 * pair compares like for like. Added here: the people in Kopra Labs Directory who are not members
 * yet, who asked for and who approved each past change, and the scene.
 * "Now" is Wed 18 Nov 2026, 14:20 WIB.
 */
import type { CheckRow } from '../_kit/desk'
import {
  digestOptions,
  footprint,
  locales,
  members as thenMembers,
  notificationDefaults,
  notificationEvents,
  org,
  regions,
  roleLabel,
  sessionLabel,
  timezones,
  type Channel,
  type MemberStatus,
  type Role,
} from '../org-settings/data'
import type { Change } from './model'

export { footprint, notificationEvents, org, roleLabel }
export type { Channel, MemberStatus, Role }

export type SessionLength = '8h' | '24h' | '7d' | '30d'

export interface Member {
  id: string
  name: string
  email: string
  role: Role
  status: MemberStatus
  /** null while the invite is pending. */
  twoFactor: boolean | null
  lastActive: string
}

/** Someone in Kopra Labs Directory (the SAML identity provider) who can be invited by name. */
export interface Person {
  id: string
  name: string
  email: string
  team: string
}

/** The scene: who is signed in, today, and the dates the rules produce from it. */
export const scene = {
  start: '14:20',
  today: '18 Nov',
  date: '18 Nov 2026',
  zone: 'WIB',
  /** Raka Wibisono, the owner, is the one talking to Simpul. */
  you: 'Raka W.',
  ownerId: 'm01',
  idp: 'Kopra Labs Directory',
  idpTested: '17 Nov 16:42',
  inviteUntil: '25 Nov',
  /** Ownership must be accepted within 72 hours. */
  acceptBy: '21 Nov',
  deletionOn: '25 Nov 2026',
  redirectUntil: '18 Dec 2026',
  policy: 12,
  seats: org.seats,
} as const

/** Every member, as on the Then screen. */
export const seedMembers: Member[] = thenMembers.map((m) => ({ ...m }))

/** People in the directory who are not in the organization yet. */
export const directory: Person[] = [
  { id: 'd01', name: 'Rina Wulandari', email: 'rina.wulandari@kopralabs.io', team: 'Operations' },
  { id: 'd02', name: 'Dimas Prakoso', email: 'dimas.prakoso@kopralabs.io', team: 'Engineering' },
  { id: 'd03', name: 'Wulan Sari', email: 'wulan.sari@kopralabs.io', team: 'Finance' },
  { id: 'd04', name: 'Kevin Tanoto', email: 'kevin.tanoto@kopralabs.io', team: 'Sales' },
]

/** How a name is recognised in a sentence (matched on the normalised text, word bounded). */
export const namePattern: Record<string, string> = {
  m01: 'raka',
  m02: 'sekar',
  m03: 'daniel',
  m04: 'putri',
  m05: 'hendra',
  m06: 'mei ?ling',
  m07: 'arif',
  m08: 'lukas',
  m09: 'ketut',
  m10: 'nadia',
  m11: 'yusuf',
  m12: 'clara',
  m13: 'tomas',
  m14: 'bima',
  d01: 'rina',
  d02: 'dimas',
  d03: 'wulan',
  d04: 'kevin',
}

/** What a role can do, in a few words. */
export const roleScope: Record<Role, string> = {
  owner: 'Everything, including deletion',
  admin: 'Members, policy and every project',
  developer: 'Projects and deployments',
  billing: 'Plan, invoices and payment',
  viewer: 'Read-only',
}

export const sessionText = (s: SessionLength) => sessionLabel[s] ?? s
export const SESSIONS: SessionLength[] = ['8h', '24h', '7d', '30d']

export const regionText = (value: string) => String(regions.find((r) => r.value === value)?.label ?? value)
export const regionCity = (value: string) => regionText(value).split(' · ')[0]
export const regionValues = regions.map((r) => String(r.value))

export const digestText = (value: string) => String(digestOptions.find((d) => d.value === value)?.label ?? value)
/** The digest in running text: "weekly, on Mondays at 09:00". */
const DIGEST_PHRASE: Record<string, string> = { daily: 'daily at 09:00', weekly: 'weekly, on Mondays at 09:00', off: 'off' }
export const digestPhrase = (value: string) => DIGEST_PHRASE[value] ?? digestText(value)

const zoneOf = (value: string) => timezones.find((z) => z.value === value) ?? timezones[0]
/** "Asia/Makassar · WITA". */
export const zoneText = (value: string) => `${value.replace('_', ' ')} · ${zoneOf(value).abbr}`
export const zoneAbbr = (value: string) => zoneOf(value).abbr
/** Minutes ahead of WIB, the scene's own clock. */
export const zoneShift = (value: string) => zoneOf(value).offset - 420
export const zoneValues = timezones.map((z) => z.value)

export const localeText = (value: string) => String(locales.find((l) => l.value === value)?.label ?? value)
/** What a locale does to an invoice, as the Then screen's hint shows it. */
export function localeExample(locale: string): string {
  const date = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(Date.UTC(2026, 10, 18))
  const amount = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(1284.5)
  return `Invoices read ${date} · USD ${amount}`
}

/** "14:20" moved by some minutes, on a 24-hour clock. */
export function shiftTime(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(':').map(Number)
  const total = (((h * 60 + m + minutes) % 1440) + 1440) % 1440
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export const eventLabel = (id: string) => notificationEvents.find((e) => e.id === id)?.label ?? id

const CHANNEL_ORDER: Channel[] = ['email', 'inapp', 'webhook']
const CHANNEL_WORD: Record<Channel, string> = { email: 'email', inapp: 'in-app', webhook: 'webhook' }

/** ['inapp', 'email'] → "Email, in-app"; [] → "Off". */
export function channelsText(list: Channel[]): string {
  const words = CHANNEL_ORDER.filter((c) => list.includes(c)).map((c) => CHANNEL_WORD[c])
  if (!words.length) return 'Off'
  const text = words.join(', ')
  return text[0].toUpperCase() + text.slice(1)
}

export const defaultNotifications = (): Record<string, Channel[]> =>
  Object.fromEntries(Object.entries(notificationDefaults).map(([k, v]) => [k, [...v]]))

/**
 * The settings history before this conversation: the Then screen's audit trail, with who asked
 * and who approved. `inverse` is what Revert puts back. `stamp` is month × 100 + day, for "last
 * week" (9–15 Nov) and "this week" (16–18 Nov).
 */
export interface SeedLine {
  id: string
  stamp: number
  day: string
  time: string
  who: string
  text: string
  detail: string
  kind: 'change' | 'event'
  inverse?: Change
}

export const seedHistory: SeedLine[] = [
  {
    id: 'h6',
    stamp: 1117,
    day: '17 Nov',
    time: '16:42',
    who: 'Sekar A.',
    text: 'SAML test sign-in passed',
    detail: 'Kopra Labs Directory · raka.wibisono@kopralabs.io mapped to Owner',
    kind: 'event',
  },
  {
    id: 'h5',
    stamp: 1117,
    day: '17 Nov',
    time: '09:15',
    who: 'Daniel O.',
    text: 'Tomás Rivera invited as Viewer',
    detail: 'Asked and approved by Daniel O. · open until 24 Nov',
    kind: 'change',
    inverse: { kind: 'uninvite', id: 'm13' },
  },
  {
    id: 'h4',
    stamp: 1116,
    day: '16 Nov',
    time: '15:30',
    who: 'Daniel O.',
    text: 'Clara Mendes invited as Developer',
    detail: 'Asked and approved by Daniel O. · open until 23 Nov',
    kind: 'change',
    inverse: { kind: 'uninvite', id: 'm12' },
  },
  {
    id: 'h3',
    stamp: 1112,
    day: '12 Nov',
    time: '10:05',
    who: 'Raka W.',
    text: 'Two-factor required for all members',
    detail: 'Policy v12 · asked by Sekar A., approved by Raka W.',
    kind: 'change',
    inverse: { kind: 'twofactor', on: false },
  },
  {
    id: 'h2',
    stamp: 1112,
    day: '12 Nov',
    time: '10:02',
    who: 'Sekar A.',
    text: 'Identity provider connected',
    detail: 'Kopra Labs Directory · SAML 2.0 · idp.kopralabs.io',
    kind: 'change',
  },
  {
    id: 'h1',
    stamp: 902,
    day: '2 Sep',
    time: '11:20',
    who: 'Sekar A.',
    text: 'Bima Saputra suspended',
    detail: 'Asked and approved by Sekar A.',
    kind: 'change',
    inverse: { kind: 'status', id: 'm14', to: 'active' },
  },
]

/** The one sentence the screen opens on: the person said it, Simpul answered with a check. */
export const OPENING =
  "Sekar's test passed, so require single sign-on for everyone with 8-hour sessions, make Putri an admin, invite Rina from ops as admin and email us when someone joins"

/**
 * What the opening job costs on each screen. Then: Security (single sign-on switch, session radio),
 * Members (Putri's role select), the invite dialog (addresses, role) and Notifications (the email
 * box on "New member joined"), saved twice: Send invitation, then Save changes. Now: one sentence,
 * one check, one confirm.
 */
export const cost = {
  then: [
    { value: 4, unit: 'steps' },
    { value: 6, unit: 'fields' },
    { value: 2, unit: 'saves' },
  ],
  now: [
    { value: 1, unit: 'sentence' },
    { value: 1, unit: 'check' },
    { value: 1, unit: 'confirm' },
  ],
}

/** A card in the thread: what was understood, an answer with facts, or a deliberate action. */
export type CardData =
  | { kind: 'understood'; setId: string; title: string; rows: CheckRow[] }
  | { kind: 'facts'; eyebrow: string; title: string; rows: CheckRow[] }
  | { kind: 'transfer'; to: string; title: string; rows: CheckRow[]; at: string }
  | { kind: 'deletion'; title: string; rows: CheckRow[]; at: string }
