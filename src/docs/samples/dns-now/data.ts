/**
 * DNS records, Now. The same zone as the Then screen (lintang.example on 21 Strive Edge), the same
 * 22 records, people and moment: Tue 3 Nov 2026, 11:47 WIB, six minutes after Dimas moved vpn to
 * gateway 2. The records, resolvers and zone figures come straight from the Then screen's data, so
 * the pair compares like for like. What is new is only what the conversation needs: the load
 * balancer Dimas set up this morning, the mail provider in Ayu's ticket, and the shapes of a change.
 */
import type { CheckRow } from '../_kit/desk'
import {
  EDGE_V4,
  EDGE_V6,
  NAMESERVERS,
  ZONE,
  initialRecords,
  proxiable,
  resolvers,
  ttlLabel,
  zoneFile as thenZoneFile,
  type RecordType,
  type Resolver,
} from '../dns/data'

export { EDGE_V4, EDGE_V6, NAMESERVERS, ZONE, proxiable, resolvers, ttlLabel }
export type { RecordType, Resolver }

/* ── The scene ───────────────────────────────────────────────────────────────────── */

/** The person at the desk, and the agent. */
export const ME = 'Ayu Lestari'
export const AGENT = 'Simpul'
/** The Then screen's moment: its strip reads 11:47 WIB on 3 Nov. */
export const START = '11:47'
/** Day part of change ids: CHG-0311-01. */
export const DAY = '0311'

/** The load balancer Dimas Pratama set up at 10:20 this morning. */
export const LB = {
  name: 'lb-jkt-2',
  host: 'lb-jkt-2.lb.21strive.example',
  v4: '203.0.113.60',
  v6: '2001:db8:4f1a::60',
  by: 'Dimas Pratama',
  at: '10:20',
  pools: 'Jakarta and Surabaya pools',
}

/** The single origin lb-jkt-2 replaces: the apex and www still point at it. */
export const WEB1 = { name: 'web-1', v4: '203.0.113.10', v6: '2001:db8:4f1a::10' }

/** shop does not exist yet, but the campaign email already links to it. */
export const SHOP = { name: 'shop', lookups: 214, since: '11:20', missFor: 30 }

/** Where mail is moving, from Ayu's ticket. */
export const NEWMAIL = {
  name: 'Kotak Surat',
  ticket: 'OPS-1182',
  opened: '30 Oct',
  mx: '1 mx.kotaksurat.example',
  spf: '"v=spf1 include:_spf.kotaksurat.example include:_spf.mailroute.example -all"',
  dkimName: 'kotaksurat._domainkey',
  dkim: '"v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0B…"',
  verify: '"kotaksurat-verification=Kp3v8R1xQd0Z5wNfT2mYhL7cE9aUbG4sJ6oXr"',
  /** Mailroute stays allowed in SPF until mail queued there has drained. */
  spfUntil: '4 Nov',
}

/**
 * The cost of the opening job, counted on the Then screen: add shop as an A record (name and
 * address), add it again as AAAA (type, name, address), then pick it in the resolver check. TTL is
 * locked while proxied and the proxy switch starts on, so neither counts. Now: one sentence, one
 * check to read, one confirm.
 */
export const COST = {
  then: [
    { value: 3, unit: 'steps' },
    { value: 6, unit: 'fields' },
  ],
  now: [
    { value: 1, unit: 'sentence' },
    { value: 1, unit: 'check' },
    { value: 1, unit: 'confirm' },
  ],
}

/* ── Records ─────────────────────────────────────────────────────────────────────── */

/** A record's content, as a change sees it. The apex is written as the zone name. */
export interface Shape {
  type: RecordType
  name: string
  content: string
  /** Seconds; 1 means Auto. */
  ttl: number
  proxied: boolean
}

export interface Rec extends Shape {
  id: string
  /** Changed in this session, and when. */
  touched?: { kind: 'new' | 'edited'; at: string }
}

export function startRecords(): Rec[] {
  return initialRecords.map(({ id, type, name, content, ttl, proxied }) => ({ id, type, name, content, ttl, proxied }))
}

export const shape = (r: Shape): Shape => ({ type: r.type, name: r.name, content: r.content, ttl: r.ttl, proxied: r.proxied })
export const fqdn = (name: string) => (name === ZONE.name ? ZONE.name : `${name}.${ZONE.name}`)
/** "www", or the zone name for the apex. */
export const short = (name: string) => (name === ZONE.name ? ZONE.name : name)
export const ttlOf = (r: Pick<Shape, 'ttl' | 'proxied'>) => (r.proxied ? 'Auto' : ttlLabel(r.ttl))

/** The zone as a BIND file, stamped with the scene's time. */
export function zoneFile(records: Shape[], at: string): string {
  return thenZoneFile(records.map((r, i) => ({ ...r, id: String(i) }))).replace('11:47 WIB', `${at} WIB`)
}

/* ── Changes ─────────────────────────────────────────────────────────────────────── */

export type Field = 'type' | 'content' | 'ttl' | 'proxied'

/** One record in a change: added (no before), removed (no after) or changed. */
export interface Op {
  id: string
  before?: Shape
  after?: Shape
  /** What the conversation filled in, marked so it can be checked. */
  inferred?: Field[]
  /** A quiet line under the record: "Flattened at the edge". */
  note?: string
}

/** A warning that matters, or a reassurance, on a change. Always a word, never colour alone. */
export interface Note {
  tone: 'warning' | 'danger' | 'success' | 'neutral'
  word: string
  text: string
  /** Something to say next, offered as a button: pressing it says it in the thread. */
  action?: { label: string; say: string }
}

export type Topic = 'lb' | 'mail' | 'verify' | 'ttl' | 'proxy' | 'remove' | 'history'
export type Status = 'pending' | 'scheduled' | 'applied' | 'reverted' | 'replaced' | 'discarded'

export interface Change {
  id: string
  topic: Topic
  /** "Add shop.lintang.example". */
  title: string
  /** The trail line and its mono detail. */
  summary: string
  detail: string
  ops: Op[]
  notes: Note[]
  /** What Simpul understood, for the check in the thread. */
  rows: CheckRow[]
  status: Status
  at: string
  /** When the status last changed. */
  doneAt?: string
  /** Scheduled time: "23:00". */
  when?: string
  /** Who made it, for history; Simpul applies what a person approves. */
  who?: string
  /** Load balancer changes: the names and the record style. */
  names?: string[]
  style?: 'address' | 'cname'
  /** What Simpul says after it is reverted. */
  revertSay: string
}

/* ── Propagation ─────────────────────────────────────────────────────────────────── */

/** What to watch once a change lands: the answer resolvers should give, and who still holds the old one. */
export interface WatchPlan {
  host: string
  type: RecordType
  ttl: string
  expect: string
  old: string
  /** Resolver code → minutes until it drops the old answer. */
  stale: Record<string, number>
  /** A resolver that does not answer at first, and when it does. */
  timeout?: { code: string; until: number }
  note?: string
}

export type ProbeState = 'match' | 'stale' | 'timeout' | 'checking'

export interface Probe {
  code: string
  city: string
  rtt: number
  state: ProbeState
  /** What a probe being checked turns into. */
  next?: ProbeState
  answer: string
  ms: number
  /** Scene minute at which it drops the old answer. */
  flipAt: number
}

export interface Watch {
  key: string
  host: string
  type: RecordType
  ttl: string
  expect: string
  old: string
  note?: string
  who: string
  startedAt: string
  settleBy: string
  settledAt?: string
  /** This watch follows a revert. */
  back?: boolean
  probes: Probe[]
}

/** Resolvers nearest first, so a turnover reads outward from Jakarta. */
export const RESOLVERS = [...resolvers].sort((a, b) => a.rtt - b.rtt)

/** Minutes after the change at which each resolver drops an answer cached for up to `span` minutes. */
export function spread(span: number): Record<string, number> {
  const share: Record<string, number> = { CGK: 0.14, SUB: 0.14, SIN: 0.33, KUL: 0.33, BOM: 0.52, NRT: 0.52, SYD: 0.71, FRA: 0.71, IAD: 0.93, GRU: 0.93 }
  return Object.fromEntries(Object.entries(share).map(([code, f]) => [code, Math.max(1, Math.round(span * f))]))
}

/* ── Time ────────────────────────────────────────────────────────────────────────── */

export const toMin = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}
export const fromMin = (n: number) => `${String(Math.floor(n / 60) % 24).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`
export const later = (t: string, minutes: number) => fromMin(toMin(t) + minutes)

/* ── History the trail starts from: the Then screen's change log, with a way back ── */

const R = Object.fromEntries(startRecords().map((r) => [r.id, r])) as Record<string, Rec>

export function history(): Change[] {
  const base = { topic: 'history' as const, notes: [], rows: [], status: 'applied' as const }
  return [
    {
      ...base,
      id: 'H-c1',
      at: '11:41',
      doneAt: '11:41',
      who: 'Dimas Pratama',
      title: 'vpn moved to gateway 2',
      summary: 'vpn moved to gateway 2',
      detail: 'A 198.51.100.7 → 198.51.100.9 · gateway 1 failed its health check',
      ops: [{ id: 'r13', before: { ...shape(R.r13), content: '198.51.100.7' }, after: shape(R.r13) }],
      revertSay:
        'vpn points at 198.51.100.7 again, which is gateway 1. It has failed its health check since 11:39, so VPN users cannot connect there. Say “undo that” to go back to gateway 2.',
    },
    {
      ...base,
      id: 'H-c2',
      at: '09:12',
      doneAt: '09:12',
      who: 'Ayu Lestari',
      title: '_21strive-verify added',
      summary: '_21strive-verify added',
      detail: 'TXT · verifies the zone for the 21 Strive console',
      ops: [{ id: 'r20', after: shape(R.r20) }],
      revertSay: '_21strive-verify is gone. The 21 Strive console checks it daily and will ask to verify lintang.example again.',
    },
    {
      ...base,
      id: 'H-c3',
      at: '2 Nov',
      doneAt: '2 Nov',
      who: 'Dimas Pratama',
      title: 'api moved to origin pool B',
      summary: 'api moved to origin pool B',
      detail: 'A 203.0.113.19 → 203.0.113.24',
      ops: [{ id: 'r04', before: { ...shape(R.r04), content: '203.0.113.19' }, after: shape(R.r04) }],
      revertSay: 'api points at 203.0.113.19 again, origin pool A. It is proxied, so visitors move at the edge within a minute.',
    },
    {
      ...base,
      id: 'H-c4',
      at: '31 Oct',
      doneAt: '31 Oct',
      who: 'Kevin Tan',
      title: 'status proxy turned off',
      summary: 'status proxy turned off',
      detail: 'The status page serves its own certificate',
      ops: [{ id: 'r11', before: { ...shape(R.r11), proxied: true, ttl: 1 }, after: shape(R.r11) }],
      revertSay:
        'status is proxied again, so visitors get the edge certificate instead of the status page’s own. That is why Kevin turned it off on 31 Oct; check the page still loads.',
    },
    {
      ...base,
      id: 'H-c5',
      at: '28 Oct',
      doneAt: '28 Oct',
      who: 'Ayu Lestari',
      title: 'sel1._domainkey rotated',
      summary: 'sel1._domainkey key rotated',
      detail: 'New 2048-bit DKIM key for Mailroute · the old key is retired',
      ops: [],
      revertSay: '',
    },
  ]
}

/** The resolver check the Then screen shows at 11:47: vpn, 8 of 10, Frankfurt stale, São Paulo silent. */
export function vpnPlan(): WatchPlan {
  return {
    host: 'vpn.lintang.example',
    type: 'A',
    ttl: '5 min',
    expect: '198.51.100.9',
    old: '198.51.100.7',
    stale: { FRA: 2 },
    timeout: { code: 'GRU', until: 3 },
  }
}
