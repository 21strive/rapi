/**
 * Simpul at the audit desk. A person asks the trail a question in a sentence, in English or in
 * Indonesian; Simpul reads it into terms (what, who, which change, when, from where), answers with
 * the events themselves, and shows the terms as chips so the reading can be checked and taken
 * apart. Follow-ups narrow or widen the same question ("only the ones from outside the office
 * network", "and today?"), ask why an event passed, pin it as evidence, and share a signed extract
 * with the auditor. Pins and extracts are actions, so they go to the trail and can be reverted.
 *
 * There is no model: the patterns below are the whole of Simpul's understanding, written against
 * the same events the Then screen filters.
 */
import { computed, ref, shallowRef } from 'vue'
import { count, norm, useDesk, type CheckRow, type DeskReply, type TrailItem } from '../_kit/desk'
import {
  AGENT,
  CHAIN,
  HERO_ID,
  NOW,
  PERSON,
  REQUEST,
  SIGNING,
  T,
  actorById,
  byId,
  byLowerId,
  dayWib,
  events,
  explain,
  firstName,
  hhmm,
  hhmmWib,
  idr,
  inSevenDays,
  isInfra,
  isOffice,
  outsideOffice,
  place,
  sessionOf,
  utcLabel,
  weekdayWib,
  whenPhrase,
  wibHour,
  wibMidnight,
  type AuditEvent,
  type Explanation,
} from './data'

const pad = (n: number) => String(n).padStart(2, '0')
/** "05:34" → "05:35": when a reply written now lands. */
const nextMinute = (clock: string) => {
  const [h, m] = clock.split(':').map(Number)
  const t = h * 60 + m + 1
  return `${pad(Math.floor(t / 60) % 24)}:${pad(t % 60)}`
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/* ── Terms: what a sentence was read as ──────────────────────────────────── */

export type TermKey = 'subject' | 'actor' | 'kind' | 'change' | 'result' | 'source' | 'network' | 'hours' | 'when' | 'session'
const ORDER: TermKey[] = ['subject', 'actor', 'kind', 'change', 'result', 'source', 'network', 'hours', 'when', 'session']

export interface Term {
  key: TermKey
  /** What the chip says: "Policy transfer-limits-retail". */
  chip: string
  /** The row of the check. */
  label: string
  value: string
  hint?: string
  /** Read into the sentence rather than said: marked so it can be checked. */
  inferred?: boolean
  test: (e: AuditEvent) => boolean
  /** Time terms: the window they cover, and how to say it in a sentence ("yesterday"). */
  from?: number
  to?: number
  phrase?: string
  /** Hour terms: how far an event falls outside, to find the closest one. */
  distance?: (e: AuditEvent) => number
}

export interface Query {
  /** The sentence that asked it. */
  said: string
  /** Follow-ups that narrowed or widened it, in order. */
  then: string[]
  terms: Term[]
}

const sortTerms = (terms: Term[]) => [...terms].sort((a, b) => ORDER.indexOf(a.key) - ORDER.indexOf(b.key))

const SUBJECTS: { match: RegExp; term: Omit<Term, 'key'> }[] = [
  {
    match: /transfer.?limit|limit.{0,12}transfer|batas.{0,14}transfer/,
    term: {
      chip: 'Policy transfer-limits-retail',
      label: 'What',
      value: 'Policy transfer-limits-retail',
      hint: 'From “transfer limits”: the only policy that sets them',
      inferred: true,
      test: (e) => e.resource === '/policies/transfer-limits-retail',
    },
  },
  {
    match: /prod.?admin|admin.{0,8}prod/,
    term: {
      chip: 'Roles prod-write, break-glass',
      label: 'What',
      value: 'Roles prod-write and break-glass',
      hint: 'There is no prod-admin role; these two carry admin rights on production',
      inferred: true,
      test: (e) => /^\/iam\/roles\/(prod-write|break-glass)\//.test(e.resource),
    },
  },
  {
    match: /prod.?write/,
    term: { chip: 'Role prod-write', label: 'What', value: 'Role prod-write', test: (e) => e.resource.startsWith('/iam/roles/prod-write/') },
  },
  {
    match: /break.?glass/,
    term: { chip: 'Role break-glass', label: 'What', value: 'Role break-glass', test: (e) => e.resource.startsWith('/iam/roles/break-glass/') },
  },
  {
    match: /secret|rahasia|password|kata sandi|credential|kredensial/,
    term: {
      chip: 'Secrets prod/*',
      label: 'What',
      value: 'Production secrets',
      hint: 'Reads and writes under /secrets/prod',
      test: (e) => e.type === 'secret',
    },
  },
  {
    match: /api.?keys?|kunci api|\bkeys?\b|\bkunci\b/,
    term: { chip: 'API keys', label: 'What', value: 'API keys of service accounts', test: (e) => e.type === 'api_key' },
  },
  {
    match: /\bmfa\b|2fa|hardware key|kunci keamanan|webauthn/,
    term: {
      chip: 'MFA',
      label: 'What',
      value: 'MFA resets and failed MFA checks',
      test: (e) => e.action === 'user.mfa_reset' || /MFA/.test(e.reason ?? ''),
    },
  },
  {
    match: /sign.?ins?|signed in|log.?ins?|logged in|masuk|login/,
    term: { chip: 'Sign-ins', label: 'What', value: 'Sign-ins', test: (e) => e.action === 'session.start' },
  },
  {
    match: /\broles?\b|hak akses|\baccess\b|\bakses\b|permission|\bizin\b|\bgrants?\b|\brevoke/,
    term: { chip: 'Roles and access', label: 'What', value: 'Role grants and revocations', test: (e) => e.type === 'role' },
  },
  {
    match: /polic|kebijakan/,
    term: { chip: 'Policies', label: 'What', value: 'Policies', test: (e) => e.type === 'policy' },
  },
  {
    match: /database|\bdb\b|basis data|pg-/,
    term: { chip: 'Database sessions', label: 'What', value: 'Database sessions', test: (e) => e.action === 'db.session.start' },
  },
  {
    match: /freez|frozen|\bbeku|bekukan/,
    term: { chip: 'Account freezes', label: 'What', value: 'Account freezes and unfreezes', test: (e) => e.action.startsWith('account.') },
  },
  {
    match: /payment|pembayaran|payout|batch|\btransfers?\b/,
    term: { chip: 'Payments', label: 'What', value: 'Payout batches', test: (e) => e.type === 'payment' && e.action !== 'ledger.reconcile' },
  },
  {
    match: /ledger|reconcil|rekonsiliasi/,
    term: { chip: 'Ledger reconciliation', label: 'What', value: 'Ledger reconciliation', test: (e) => e.action === 'ledger.reconcile' },
  },
  {
    match: /customer|nasabah|pelanggan/,
    term: { chip: 'Customer records', label: 'What', value: 'Customer records', test: (e) => e.type === 'customer' },
  },
  {
    match: /report|laporan/,
    term: { chip: 'Reports', label: 'What', value: 'Report exports', test: (e) => e.type === 'report' },
  },
]

const ACTORS: [RegExp, string][] = [
  [/\bkevin\b/, 'kevin.halim'],
  [/\byusuf\b/, 'yusuf.hakim'],
  [/\barjun\b/, 'arjun.mehta'],
  [/\bnadia\b/, 'nadia.rahman'],
  [/\blaras\b/, 'laras.wulandari'],
  [/\bmei ?lin\b/, 'mei.lin.tan'],
  [/\brizky\b/, 'rizky.pratama'],
  [/\bayu\b/, 'ayu.lestari'],
  [/\bdaniel\b/, 'daniel.okafor'],
  [/\bbayu\b/, 'bayu.saputra'],
  [/\bsofia\b/, 'sofia.marques'],
  [/\bdewi\b/, 'dewi.anggraini'],
  [/\btomas\b/, 'tomas.ferreira'],
  [/\bgrace\b/, 'grace.liu'],
  [/\bfajar\b/, 'fajar.nugroho'],
  [/\bemma\b/, 'emma.schmidt'],
  [/terraform/, 'terraform-ci'],
  [/ledger.?sync|svc-ledger/, 'svc-ledger-sync'],
  [/payments.?api|svc-payments/, 'svc-payments-api'],
]
const ME = /\b(did i|have i|i (changed|did|made|touched|read)|my own|saya|aku)\b/

function actorTerm(id: string): Term {
  const a = actorById(id)
  const me = id === PERSON.id
  return {
    key: 'actor',
    chip: me ? `${PERSON.name} (you)` : a?.name ?? id,
    label: 'Who',
    value: me ? `${PERSON.name}, you` : a?.name ?? id,
    hint: a ? (a.kind === 'service' ? `Service account · ${a.team}` : `${a.team} · ${a.id}`) : undefined,
    test: (e) => e.actor.id === id,
  }
}

const CHANGES: Term = {
  key: 'change',
  chip: 'Applied changes',
  label: 'Change',
  value: 'Applied changes only',
  hint: '“Changed” leaves out reads and refused attempts',
  inferred: true,
  test: (e) => !!e.change && e.result === 'success',
}
const ATTEMPTS: Term = {
  key: 'change',
  chip: 'Changes and attempts',
  label: 'Change',
  value: 'Changes, refused attempts included',
  test: (e) => !!e.change,
}
const READS: Term = { key: 'change', chip: 'Reads only', label: 'Change', value: 'Reads, nothing changed', test: (e) => !e.change }
const REFUSED: Term = {
  key: 'result',
  chip: 'Refused or failed',
  label: 'Result',
  value: 'Refused or failed',
  test: (e) => e.result !== 'success',
}

function windowTerm(chip: string, value: string, phrase: string, from: number, to: number, hint?: string, inferred = true): Term {
  return { key: 'when', chip, label: 'When', value, phrase, hint, inferred, from, to, test: (e) => e.ts >= from && e.ts < to }
}

const END = NOW + 1
const DAY_MS = 86_400_000
const DEFAULT_WHEN = windowTerm('Last 30 days', 'Last 30 days', 'in the last 30 days', T.start, END, 'No time given: everything this view holds')
const MONTH_INDEX: Record<string, number> = { oct: 9, okt: 9, october: 9, oktober: 9, nov: 10, november: 10 }

function whenTerm(t: string): Term | null {
  const date = t.match(/\b(\d{1,2}) ?(oct|okt|october|oktober|nov|november)\b/)
  if (date) {
    const from = wibMidnight(2026, MONTH_INDEX[date[2]], Number(date[1]))
    if (from > NOW || from + DAY_MS <= T.start) return null
    return windowTerm(`${dayWib(from)} (WIB)`, `${weekdayWib(from)}, 00:00–24:00 WIB`, `on ${weekdayWib(from)}`, from, from + DAY_MS, `In Jakarta time: from ${utcLabel(from)}, 24 hours`)
  }
  if (/\btoday|hari ini|\btadi\b|this morning|pagi ini|siang ini/.test(t))
    return windowTerm('Today (WIB)', 'Tue 03 Nov since 00:00 WIB', 'today', T.today, END, `“Today”, in Jakarta time: from ${utcLabel(T.today)}`)
  if (/yesterday|kemarin/.test(t))
    return windowTerm('Mon 02 Nov (WIB)', 'Mon 02 Nov, 00:00–24:00 WIB', 'yesterday (Mon 02 Nov, WIB)', T.yesterday, T.today, `“Yesterday”, in Jakarta time: ${utcLabel(T.yesterday)} – ${utcLabel(T.today)}`)
  if (/this week|minggu ini|pekan ini/.test(t))
    return windowTerm('Since Mon 02 Nov (WIB)', 'Since Mon 02 Nov 00:00 WIB', 'this week', T.week, END, `“This week”, in Jakarta time: from ${utcLabel(T.week)}`)
  if (/last week|minggu lalu|pekan lalu/.test(t))
    return windowTerm('Mon 26 Oct – Sun 01 Nov', 'Last week, Mon 26 Oct – Sun 01 Nov WIB', 'last week', T.lastWeek, T.week, `In Jakarta time: ${utcLabel(T.lastWeek)} – ${utcLabel(T.week)}`)
  if (/this month|bulan ini/.test(t))
    return windowTerm('Since 01 Nov (WIB)', 'Since Sun 01 Nov 00:00 WIB', 'this month', T.month, END, `In Jakarta time: from ${utcLabel(T.month)}`)
  if (/last hour|past hour|\bsejam\b|satu jam|1 jam|an hour/.test(t))
    return windowTerm('Last hour', 'Since 04:30 UTC', 'in the last hour', NOW - 3_600_000, END, undefined, false)
  if (/24 ?h|24 jam|last day|sehari/.test(t))
    return windowTerm('Last 24 hours', 'Since 02 Nov 05:30 UTC', 'in the last 24 hours', NOW - DAY_MS, END, undefined, false)
  if (/7 days|7 hari|seminggu|last 7/.test(t))
    return windowTerm('Last 7 days', 'Since 27 Oct 05:30 UTC', 'in the last 7 days', NOW - 7 * DAY_MS, END, undefined, false)
  if (/30 days|30 hari|sebulan|last month|all time|semua waktu|everything ever|whole trail|any time|kapan saja/.test(t))
    return windowTerm('Last 30 days', 'Since 04 Oct 05:30 UTC', 'in the last 30 days', T.start, END, 'Everything this view holds', false)
  return null
}

const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']
/** "three", "12": small counts read better as words in a sentence. */
const words = (n: number) => WORDS[n] ?? String(n)

function hoursTerm(t: string): Term | null {
  const zone = /\butc\b/.test(t) ? 'UTC' : 'WIB'
  const hourOf = (e: AuditEvent) => (zone === 'WIB' ? wibHour(e.ts) : new Date(e.ts).getUTCHours() + new Date(e.ts).getUTCMinutes() / 60)
  const after =
    t.match(/\b(?:after|past|since|setelah|sesudah|lewat|di atas|diatas|mulai)\s+(?:jam\s+|pukul\s+)?(\d{1,2})[:.](\d{2})/) ??
    t.match(/\b(?:after|setelah|sesudah|lewat)\s+(?:jam|pukul)\s+(\d{1,2})()\b/) ??
    t.match(/\b(?:after|setelah|sesudah|lewat)\s+(\d{1,2})()(?!\s*(?:oct|okt|nov|days?|hari|hours?|jam|minutes?|menit|events?))\b/)
  if (after && Number(after[1]) <= 23) {
    const evening = /\b(pm|sore|malam)\b/.test(t) && Number(after[1]) < 12
    const h = Number(after[1]) + (evening ? 12 : 0)
    const m = Number(after[2] || 0)
    const at = h + m / 60
    const utc = zone === 'WIB' ? `${pad((h + 17) % 24)}:${pad(m)}–17:00 UTC` : `${pad((h + 7) % 24)}:${pad(m)} WIB onwards`
    return {
      key: 'hours',
      chip: `After ${pad(h)}:${pad(m)} ${zone}`,
      label: 'Hours',
      value: `${pad(h)}:${pad(m)}–24:00 ${zone}, every day asked`,
      hint: zone === 'WIB' ? `Jakarta time, so ${utc}` : utc,
      inferred: zone === 'WIB',
      test: (e) => hourOf(e) >= at,
      distance: (e) => (hourOf(e) >= at ? 0 : at - hourOf(e)),
    }
  }
  const before = t.match(/\b(?:before|sebelum)\s+(?:jam\s+|pukul\s+)?(\d{1,2})(?:[:.](\d{2}))?\b(?!\s*(?:oct|okt|nov))/)
  if (before && Number(before[1]) <= 24) {
    const h = Number(before[1])
    const m = Number(before[2] || 0)
    const at = h + m / 60
    return {
      key: 'hours',
      chip: `Before ${pad(h)}:${pad(m)} ${zone}`,
      label: 'Hours',
      value: `00:00–${pad(h)}:${pad(m)} ${zone}, every day asked`,
      hint: zone === 'WIB' ? 'Jakarta time' : undefined,
      inferred: zone === 'WIB',
      test: (e) => hourOf(e) < at,
      distance: (e) => (hourOf(e) < at ? 0 : hourOf(e) - at),
    }
  }
  if (/after.?hours|outside (office|working|business|work) hours|di luar jam (kerja|kantor)|luar jam kerja|at night|overnight|malam hari|tengah malam/.test(t))
    return {
      key: 'hours',
      chip: 'Outside 08:00–18:00 WIB',
      label: 'Hours',
      value: 'Outside office hours, 18:00–08:00 WIB',
      hint: 'Jakarta office hours, Monday to Friday',
      inferred: true,
      test: (e) => wibHour(e.ts) >= 18 || wibHour(e.ts) < 8,
      distance: (e) => Math.max(0, Math.min(18 - wibHour(e.ts), wibHour(e.ts) - 8)),
    }
  return null
}

function networkTerm(t: string): Term | null {
  if (/outside (the )?(office|network)|off.?site|luar kantor|di luar (jaringan )?kantor|not (from )?(the |an )?office|bukan (dari )?kantor|from home|dari rumah|\bremote/.test(t))
    return {
      key: 'network',
      chip: 'Not from an office',
      label: 'Network',
      value: 'Not an office: staff VPN, home or unknown',
      hint: 'jump-01, CI and the production cluster count as inside',
      inferred: true,
      test: (e) => outsideOffice(e.ip),
    }
  if (/\bvpn\b/.test(t)) return { key: 'network', chip: 'Staff VPN', label: 'Network', value: 'Staff VPN, 10.8.0.0/16', test: (e) => e.ip.startsWith('10.8.') }
  if (/unknown (ip|address)|not seen before|new (ip|address)|ip (baru|asing)|suspicious|mencurigakan|\basing\b/.test(t))
    return { key: 'network', chip: 'Never-seen addresses', label: 'Network', value: 'Addresses never seen before', test: (e) => e.ip.startsWith('192.0.2.') }
  if (/singapore|singapura|\bsgp\b/.test(t))
    return { key: 'network', chip: 'Singapore office', label: 'Network', value: 'Singapore office, 203.0.113.40/29', test: (e) => e.ip.startsWith('203.0.113.4') }
  if (/from (the )?office|dari kantor|in the office|di kantor/.test(t))
    return { key: 'network', chip: 'From an office', label: 'Network', value: 'Jakarta or Singapore office', test: (e) => isOffice(e.ip) }
  return null
}

function sourceTerm(t: string): Term | null {
  if (/\bcli\b|command.?line|terminal|jump.?01|bastion/.test(t)) return { key: 'source', chip: 'CLI', label: 'Source', value: 'CLI, through jump-01', test: (e) => e.source === 'cli' }
  if (/console|konsol/.test(t)) return { key: 'source', chip: 'Console', label: 'Source', value: 'Console', test: (e) => e.source === 'console' }
  return null
}

function kindTerm(t: string): Term | null {
  if (/only (the )?(people|humans|persons|staff)|people only|humans only|hanya orang|orang saja|tanpa (mesin|layanan|service)|no (machines|services)|without (the )?(machines|services)|bukan mesin/.test(t))
    return { key: 'kind', chip: 'People only', label: 'Actors', value: 'People, no service accounts', test: (e) => e.actor.kind === 'person' }
  if (/only (the )?(machines|services)|machines only|services only|hanya (mesin|layanan)/.test(t))
    return { key: 'kind', chip: 'Services only', label: 'Actors', value: 'Service accounts only', test: (e) => e.actor.kind === 'service' }
  return null
}

interface Parsed {
  terms: Term[]
  /** "Include the refused attempts": widen a change term, drop a result term. */
  attempts: boolean
}

/** Everything a sentence says about which events it wants. */
export function parse(text: string): Parsed {
  const t = norm(text)
  const terms: Term[] = []
  const subject = SUBJECTS.find((s) => s.match.test(t))
  if (subject) terms.push({ key: 'subject', ...subject.term })
  const actor = ACTORS.find(([p]) => p.test(t))
  if (actor) terms.push(actorTerm(actor[1]))
  else if (ME.test(t)) terms.push(actorTerm(PERSON.id))
  const attempts = /includ\w* (the )?(refus|denied|attempt|fail)|termasuk (yang )?(ditolak|gagal)|with (the )?(refus|attempt)|attempts (too|as well)|also (the )?(refus|attempt)|tambah\w* (yang )?(ditolak|gagal)/.test(t)
  if (!attempts) {
    if (/\bchang|\bubah|diubah|mengubah|merubah|\bedit|\bupdat|modif|\bganti|diganti/.test(t)) terms.push(CHANGES)
    else if (/\bread\b|\breads\b|\bbaca|dibaca|membaca|\bviewed\b|dilihat|accessed|diakses/.test(t)) terms.push(READS)
    if (/refus|denied|\bdeny|ditolak|\btolak|blocked|diblokir|gagal|\bfail|\berror/.test(t)) terms.push(REFUSED)
  }
  for (const term of [kindTerm(t), sourceTerm(t), networkTerm(t), hoursTerm(t), whenTerm(t)]) if (term) terms.push(term)
  return { terms: sortTerms(terms), attempts }
}

/* ── The answer ──────────────────────────────────────────────────────────── */

export type Item = { kind: 'event'; event: AuditEvent } | { kind: 'group'; key: string; events: AuditEvent[] }

export interface Answer {
  events: AuditEvent[]
  items: Item[]
  /** Events in the time window, before any other term. */
  read: number
  from: number
  to: number
  people: number
  refused: number
  /** A term set aside because it found nothing ("what did Kevin change" when he changed nothing). */
  relaxed?: Term
  /** When nothing matches: the nearest event once one term is let go. */
  closest?: { event: AuditEvent; without: Term }
}

const run = (terms: Term[]) => events.filter((e) => terms.every((t) => t.test(e)))

/** Single events first, then a service doing the same thing four times or more as one routine line. */
function itemsOf(list: AuditEvent[]): Item[] {
  const routine = new Map<string, AuditEvent[]>()
  for (const e of list) {
    if (e.actor.kind !== 'service') continue
    const key = `${e.actor.id}|${e.action}`
    routine.set(key, [...(routine.get(key) ?? []), e])
  }
  const grouped = new Set([...routine].filter(([, l]) => l.length >= 4).map(([k]) => k))
  return [
    ...list.filter((e) => !grouped.has(`${e.actor.id}|${e.action}`)).map((event): Item => ({ kind: 'event', event })),
    ...[...grouped].map((key): Item => ({ kind: 'group', key, events: routine.get(key) ?? [] })),
  ]
}

export function answerOf(q: Query): Answer {
  const when = q.terms.find((t) => t.key === 'when')
  const from = when?.from ?? T.start
  const to = Math.min(when?.to ?? END, END)
  let matched = run(q.terms)
  let relaxed: Term | undefined
  const change = q.terms.find((t) => t.key === 'change')
  if (!matched.length && change && q.terms.some((t) => t.key === 'actor')) {
    const wider = run(q.terms.filter((t) => t !== change))
    if (wider.length) {
      matched = wider
      relaxed = change
    }
  }
  let closest: Answer['closest']
  if (!matched.length) {
    for (const key of ['hours', 'network', 'source', 'kind', 'result', 'change', 'when', 'actor'] as TermKey[]) {
      const without = q.terms.find((t) => t.key === key)
      if (!without) continue
      const wider = run(q.terms.filter((t) => t !== without))
      if (!wider.length) continue
      const near = without.distance
      const event = near ? wider.reduce((best, e) => (near(e) < near(best) ? e : best)) : wider[0]
      closest = { event, without }
      break
    }
  }
  return {
    events: matched,
    items: itemsOf(matched),
    read: events.filter((e) => e.ts >= from && e.ts < to).length,
    from,
    to,
    people: new Set(matched.filter((e) => e.actor.kind === 'person').map((e) => e.actor.id)).size,
    refused: matched.filter((e) => e.result !== 'success').length,
    relaxed,
    closest,
  }
}

/* ── Saying it ───────────────────────────────────────────────────────────── */

/** What an event did, as a verb phrase after the actor's name. */
export function gloss(e: AuditEvent): string {
  const c = e.change as { before?: Record<string, unknown>; after?: Record<string, unknown> } | undefined
  if (e.action === 'policy.update' && e.result === 'success' && c?.before && c.after) {
    const b = c.before
    const a = c.after
    if (e.resource.endsWith('transfer-limits-retail')) {
      const nb = b.new_device as { limit_idr: number; cooling_off_hours: number }
      const na = a.new_device as { limit_idr: number; cooling_off_hours: number }
      let s = `${na.limit_idr < nb.limit_idr ? 'lowered' : 'raised'} the new-device transfer limit from ${idr(nb.limit_idr)} to ${idr(na.limit_idr)}`
      if (na.cooling_off_hours !== nb.cooling_off_hours)
        s += na.cooling_off_hours ? ` and added a ${na.cooling_off_hours}-hour cooling-off` : ' and removed the cooling-off'
      return s
    }
    if (e.resource.endsWith('mfa-enforcement')) return 'extended MFA enforcement to contractors'
    if (e.resource.endsWith('ip-allowlist-console')) return 'added 203.0.113.40/29 to the console allowlist'
    if (e.resource.endsWith('change-window-prod')) return 'moved the start of the production change window from 04:00 to 03:00 UTC'
    if (e.resource.endsWith('session-timeout-console')) return 'cut the console idle timeout from 30 to 15 minutes'
  }
  const s = e.summary
  if (s === 'Sign-in failed') return 'failed to sign in'
  if (s === 'Signed out') return 'signed out'
  if (s.startsWith('Session expired')) return 'was signed out after 15 minutes idle'
  if (/^Key rotation for (.+) failed$/.test(s)) return s.replace(/^Key rotation for (.+) failed$/, 'failed to rotate the API key of $1')
  if (/^Export of the (.+) failed$/.test(s)) return s.replace(/^Export of the (.+) failed$/, 'failed to export the $1')
  if (s === 'Ledger reconciliation did not finish') return 'did not finish the ledger reconciliation'
  // The second clause of a summary ("; a new hardware key is required") is said elsewhere, if at all.
  const first = s.split(';')[0]
  return first.charAt(0).toLowerCase() + first.slice(1)
}

/** "Yusuf Hakim lowered …: today at 05:14 UTC (12:14 WIB), from the Jakarta office." */
export function sayOne(e: AuditEvent, leftOut: AuditEvent[] = []): string {
  if (e.action === 'session.start' && e.result !== 'success' && e.ip.startsWith('192.0.2.')) return `${cap(sayPerson([e]))}.`
  let s = `${e.actor.name} ${gloss(e)}: ${whenPhrase(e.ts)}, from ${place(e.ip)}.`
  if (e.result !== 'success') s += ` ${e.result === 'denied' ? 'Refused' : 'It failed'}: ${e.reason}.`
  if (e.action === 'key.rotate' && e.result === 'success') {
    const prev = (e.change?.after as { previous?: { key: string; valid_until: string } } | undefined)?.previous
    if (prev) s += ` The old key ${prev.key} stays valid until ${prev.valid_until.slice(11, 16)} UTC tomorrow.`
  }
  const earlier = leftOut.filter((x) => x.session === e.session && x.ts < e.ts && !x.action.startsWith('session.'))
  if (earlier.length) s += ` Earlier in the same session, ${firstName(e.actor)} ${joinAnd([...earlier].reverse().map(gloss))}.`
  return s
}

/** Actions that only look: an answer made of them is "all reads". */
const READ_ACTIONS = new Set(['secret.read', 'customer.view', 'db.session.start'])

/** "today", "yesterday" or "on 22 Oct", in Jakarta time. */
const onDay = (ms: number) => (ms >= T.today ? 'today' : ms >= T.yesterday ? 'yesterday' : `on ${dayWib(ms)}`)

/** "17:57 WIB on 29 Oct, Arjun Mehta granted prod-write to Bayu Saputra" */
const sayShort = (e: AuditEvent) => `${hhmmWib(e.ts)} WIB ${onDay(e.ts)}, ${e.actor.name} ${gloss(e)}`

const VERB: Record<string, [verb: string, noun: string, nouns: string]> = {
  'secret.read': ['read', 'secret', 'secrets'],
  'db.session.start': ['opened', 'database session', 'database sessions'],
  'key.rotate': ['rotated', 'API key', 'API keys'],
  'key.create': ['created', 'API key', 'API keys'],
  'role.grant': ['granted', 'role', 'roles'],
  'role.revoke': ['revoked', 'role', 'roles'],
  'policy.update': ['changed', 'policy', 'policies'],
  'user.mfa_reset': ['reset MFA for', 'person', 'people'],
  'account.freeze': ['froze', 'account', 'accounts'],
  'customer.view': ['viewed', 'customer profile', 'customer profiles'],
  'payment.approve': ['approved', 'payout batch', 'payout batches'],
}

const times = (n: number) => (n === 1 ? 'once' : n === 2 ? 'twice' : `${words(n)} times`)

/** What one actor did in a list of events, as a verb phrase. */
function doing(list: AuditEvent[]): string {
  const e = list[0]
  const same = list.every((x) => x.action === e.action && x.result === e.result)
  if (same && e.action === 'session.start') return e.result === 'success' ? `signed in ${times(list.length)}` : `failed to sign in ${times(list.length)}`
  if (same && e.result !== 'success') return `had ${words(list.length)} ${NOUN[e.action] ?? e.action}s refused`
  if (same && VERB[e.action]) {
    const things = new Set(list.map((x) => x.resource))
    if (things.size === 1) return `${VERB[e.action][0]} ${e.resource.split('/').pop()} ${times(list.length)}`
    return `${VERB[e.action][0]} ${words(things.size)} ${VERB[e.action][2]}`
  }
  // Different things in one stretch read as a sequence, oldest first.
  const steps = [...new Set([...list].reverse().map(gloss))]
  return steps.length > 4 ? `${steps.slice(0, 4).join(', then ')} and ${words(steps.length - 4)} more` : steps.join(', then ')
}

/** "Kevin Halim read three secrets through jump-01 on 22 Oct between 19:56 and 20:02 WIB" */
function sayPerson(list: AuditEvent[]): string {
  const a = list[0].actor
  const first = list[0]
  const where = new Set(list.map((e) => place(e.ip))).size === 1 ? ` ${first.ip === '10.30.1.5' ? 'through' : 'from'} ${place(first.ip)}` : ''
  const sorted = [...list].sort((x, y) => x.ts - y.ts)
  const days = new Set(list.map((e) => dayWib(e.ts)))
  const span =
    list.length === 1
      ? ` ${onDay(first.ts)} at ${hhmmWib(first.ts)} WIB`
      : days.size === 1
        ? ` ${onDay(sorted[0].ts)} between ${hhmmWib(sorted[0].ts)} and ${hhmmWib(sorted[sorted.length - 1].ts)} WIB`
        : ` over ${words(days.size)} days`
  // Refused sign-ins from an address never seen before are someone else trying the account.
  if (list.every((e) => e.action === 'session.start' && e.result !== 'success' && e.ip.startsWith('192.0.2.'))) {
    const lock = events.find((e) => e.action === 'user.lock' && e.resource === `/iam/users/${a.id}` && e.ts > sorted[sorted.length - 1].ts)
    const then = lock ? `; ${lock.actor.name} locked the account at ${hhmmWib(lock.ts)} WIB` : ''
    return `someone failed to sign in as ${a.name} ${times(list.length)} from ${first.ip}, an address never seen before,${span}${then}`
  }
  if (list.length === 1) return `${a.name} ${gloss(first)}${where}${span}`
  return `${a.name} ${doing(list)}${where}${span}`
}

function sayRoutine(list: AuditEvent[]): string {
  const e = list[0]
  const resources = new Set(list.map((x) => x.resource))
  const what =
    e.actor.id === 'svc-payments-api' && e.action === 'secret.read'
      ? 'refreshing the switch client key'
      : `running ${e.action}${resources.size === 1 ? ` on ${e.resource}` : ''}`
  const hours = new Set(list.map((x) => hhmmWib(x.ts)))
  const daily = hours.size === 1 && new Set(list.map((x) => dayWib(x.ts))).size === list.length
  return `${list.length} are ${e.actor.name} ${what}${daily ? `, daily at ${[...hours][0]} WIB` : ''}`
}

const joinAnd = (parts: string[]) => (parts.length <= 1 ? parts.join('') : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`)

/** The reply to a question: what was found, in a sentence or three. */
export function describe(q: Query, a: Answer): string {
  const list = a.events
  if (!list.length) {
    const prodAdmin = q.terms.some((t) => t.chip === 'Roles prod-write, break-glass')
    const hours = q.terms.find((t) => t.key === 'hours')
    const when = q.terms.find((t) => t.key === 'when')?.phrase ?? ''
    let s = prodAdmin
      ? `None. No role is called prod-admin, so I read it as prod-write and break-glass, the two roles with admin rights on production. Nobody touched either${hours ? ` ${hours.chip.charAt(0).toLowerCase()}${hours.chip.slice(1)}` : ''} ${when}.`
      : `Nothing matches. I read ${count(a.read, 'event')} ${when || 'in that window'}.`
    if (a.closest)
      s += prodAdmin || a.closest.without.key === 'hours'
        ? ` The closest: at ${sayShort(a.closest.event)}.`
        : ` The closest, once “${a.closest.without.chip}” is let go: ${sayShort(a.closest.event)}.`
    return s
  }
  if (a.relaxed) {
    const who = list[0].actor
    const when = q.terms.find((t) => t.key === 'when')?.phrase ?? 'in that window'
    const what = list.length === 1 ? `event: ${gloss(list[0])}, ${hhmmWib(list[0].ts)} WIB from ${place(list[0].ip)}` : `events were ${summarise(list)}`
    return `Nothing. ${who.name} made no changes ${when}. ${firstName(who)}’s only ${what}.`
  }
  if (list.length === 1) {
    const change = q.terms.find((t) => t.key === 'change')
    return sayOne(list[0], change ? run(q.terms.filter((t) => t !== change)).filter((e) => !list.includes(e)) : [])
  }
  const groups = a.items.filter((i): i is Extract<Item, { kind: 'group' }> => i.kind === 'group')
  const singles = list.filter((e) => !groups.some((g) => g.events.includes(e)))
  const reads = list.every((e) => READ_ACTIONS.has(e.action))
  const signIns = list.every((e) => e.action === 'session.start')
  const head = `${list.length} ${signIns ? 'sign-ins' : 'events'}${reads ? ', all reads' : ''}.`
  const byPerson = new Map<string, AuditEvent[]>()
  for (const e of singles) byPerson.set(e.actor.id, [...(byPerson.get(e.actor.id) ?? []), e])
  const phrases = [...byPerson.values()].map(sayPerson)
  // A phrase with its own semicolon reads better as its own sentence.
  const people = phrases.some((x) => x.includes(';')) ? phrases.map(cap).join('. ') : joinAnd(phrases)
  if (groups.length) {
    const routine = joinAnd(groups.map((g) => sayRoutine(g.events)))
    if (!singles.length) return `${head} ${cap(routine)}.`
    return `${head} ${cap(routine)}. The other ${singles.length} ${singles.length === 1 ? 'is' : 'are'}: ${people}.`
  }
  const said = /tried to|refused|failed/.test(people)
  const refused =
    a.refused && !said ? ` ${a.refused === list.length ? (list.length === 2 ? 'Both were' : 'All were') : `${cap(words(a.refused))} ${a.refused === 1 ? 'was' : 'were'}`} refused.` : ''
  if (byPerson.size <= 3) return `${head} ${cap(people)}.${refused}`
  return `${head} By ${byPerson.size} people; the latest: ${sayShort(list[0])}.${refused}`
}

/** "two refused sign-ins, both “MFA challenge failed”: 09:44 WIB from the staff VPN and …" */
function summarise(list: AuditEvent[]): string {
  const oldest = [...list].reverse()
  const reasons = new Set(list.map((e) => e.reason))
  if (list.every((e) => e.result !== 'success' && e.action === 'session.start')) {
    const all = list.length === 2 ? 'both' : 'all'
    const why = reasons.size === 1 ? `, ${all} “${list[0].reason}”` : ''
    return `${words(list.length)} refused sign-ins${why}: ${joinAnd(oldest.map((e) => `${hhmmWib(e.ts)} WIB from ${place(e.ip)}`))}`
  }
  return `${words(list.length)}: ${joinAnd(oldest.slice(0, 3).map((e) => `${gloss(e)} at ${hhmmWib(e.ts)} WIB`))}`
}

/** The rows of the check that shows how a question was read. */
export function readingRows(q: Query, a: Answer): CheckRow[] {
  const rows: CheckRow[] = q.terms.map((t) => ({
    label: t.label,
    value: a.relaxed === t ? `${t.value}: none, so all events shown` : t.value,
    hint: t.hint,
    inferred: t.inferred || a.relaxed === t,
  }))
  rows.push({ label: 'Where', value: 'Production · all services', hint: `${count(a.read, 'event')} read` })
  const names = [...new Set(a.events.map((e) => e.actor.name))]
  rows.push({
    label: 'Found',
    value: a.events.length ? `${count(a.events.length, 'event')} · ${names.length > 2 ? `${names.length} actors` : names.join(', ')}` : 'Nothing',
  })
  return rows
}

/* ── Thread cards ────────────────────────────────────────────────────────── */

export interface ReadingCard {
  eyebrow: string
  title: string
  rows: CheckRow[]
}
export interface WhyCard {
  eventId: string
  ex: Explanation
}
export interface ExportCard {
  /** The id the extract will have once it is shared. */
  extractId: string
}

/* ── Pins, extracts and the trail ────────────────────────────────────────── */

export interface Pin {
  id: string
  trailId: string
}
export interface SignedExtract {
  id: string
  events: string[]
  at: string
  hash: string
  trailId: string
  revokedAt?: string
}

const NOUN: Record<string, string> = {
  'policy.update': 'policy change',
  'key.rotate': 'key rotation',
  'key.create': 'new API key',
  'secret.read': 'secret read',
  'session.start': 'sign-in',
  'role.grant': 'role grant',
  'role.revoke': 'role revocation',
  'db.session.start': 'database session',
  'user.lock': 'account lock',
  'user.mfa_reset': 'MFA reset',
  'account.freeze': 'account freeze',
}
const possessive = (name: string) => `${name}’s`
export const eventNoun = (e: AuditEvent) => `${possessive(e.actor.name)} ${NOUN[e.action] ?? e.action}`

/** A short, stable stand-in for the extract's digest. */
function digest(ids: string[]) {
  let h = 0x811c9dc5
  for (const ch of ids.join('|')) h = Math.imul(h ^ ch.charCodeAt(0), 0x01000193) >>> 0
  const hex = h.toString(16).padStart(8, '0')
  return `sha256:${hex.slice(0, 4)}…${hex.slice(4)}`
}

const OPENING_SAID = 'Who changed transfer limits this week?'

/* ── The desk ────────────────────────────────────────────────────────────── */

export function useAuditDesk() {
  const opening: Query = { said: OPENING_SAID, then: [], terms: parse(OPENING_SAID).terms }
  const query = shallowRef<Query>(opening)
  const answer = computed(() => answerOf(query.value))
  /** The event the conversation is about: "pin it", "why was this allowed?". */
  const focusId = ref<string>(HERO_ID)
  /** Events opened to their fields; the newest answer opens its first few. */
  const open = ref<string[]>([HERO_ID])
  const showAll = ref(false)
  const record = ref<string | null>(null)
  const pins = ref<Pin[]>([{ id: HERO_ID, trailId: 'pin-hero' }])
  const extracts = ref<SignedExtract[]>([])
  /** The export card waiting in the thread, by the id its extract will get. */
  const exportCard = ref<string | null>(null)
  const asked = new Set<string>([norm(OPENING_SAID)])
  /** Events already explained in the thread: no need to suggest asking again. */
  const explained = new Set<string>()

  const trail = ref<TrailItem[]>([
    { id: 'pin-hero', at: '05:30', who: AGENT, text: `Pinned ${eventNoun(byId.get(HERO_ID)!)} as evidence`, detail: `${HERO_ID} → ${REQUEST.id}`, canRevert: true },
    { id: 'ext-0411', at: '04:45', who: PERSON.name, text: 'Shared a signed extract with Emma Schmidt', detail: 'EXT-1103-0411 · 2 events · opened 04:47' },
    { id: 'pin-0417', at: '04:43', who: PERSON.name, text: 'Pinned Arjun Mehta’s two revocations as evidence', detail: 'evt_01M6FTT0W2HDNQD7, evt_01M6FTWHEKSNS35A → AUD-REQ-0417' },
  ])

  const sharedIds = computed(() => new Set(extracts.value.filter((x) => !x.revokedAt).flatMap((x) => x.events)))
  const pending = computed(() => pins.value.filter((p) => !sharedIds.value.has(p.id)))
  const liveExtract = computed(() => [...extracts.value].reverse().find((x) => !x.revokedAt))
  const nextExtractId = () => `EXT-1103-${String(412 + extracts.value.length).padStart(4, '0')}`
  const isPinned = (id: string) => pins.value.some((p) => p.id === id)
  const focus = computed(() => byId.get(focusId.value))

  /* Opening a new answer: focus its first event, open the first few. */
  function setQuery(q: Query) {
    query.value = q
    const a = answerOf(q)
    const first = a.items.filter((i): i is Extract<Item, { kind: 'event' }> => i.kind === 'event').map((i) => i.event.id)
    focusId.value = first[0] ?? a.closest?.event.id ?? focusId.value
    open.value = first.length ? (first.length <= 2 ? first : first.slice(0, 1)) : a.closest ? [a.closest.event.id] : []
    showAll.value = false
    record.value = null
  }

  /* ── Actions: each writes to the trail, and to the thread through the caller. ── */

  function pin(id: string, by: string): boolean {
    if (isPinned(id)) return false
    const e = byId.get(id)
    if (!e) return false
    const trailId = `pin-${id}-${trail.value.length}`
    pins.value = [...pins.value, { id, trailId }]
    trail.value = [{ id: trailId, at: desk.clock.now(), who: by, text: `Pinned ${eventNoun(e)} as evidence`, detail: `${id} → ${REQUEST.id}`, canRevert: true }, ...trail.value]
    return true
  }

  function unpin(id: string) {
    const p = pins.value.find((x) => x.id === id)
    if (!p) return
    pins.value = pins.value.filter((x) => x !== p)
    trail.value = trail.value.map((t) => (t.id === p.trailId ? { ...t, revertedAt: desk.clock.now() } : t))
  }

  function share(by: string): SignedExtract | null {
    const ids = pending.value.map((p) => p.id)
    if (!ids.length) return null
    const at = desk.clock.now()
    const x: SignedExtract = { id: nextExtractId(), events: ids, at, hash: digest(ids), trailId: `ext-${extracts.value.length}` }
    extracts.value = [...extracts.value, x]
    exportCard.value = null
    trail.value = [
      { id: x.trailId, at, who: by, text: 'Shared a signed extract with Emma Schmidt', detail: `${x.id} · ${count(ids.length, 'event')} · ${x.hash}`, canRevert: true },
      ...trail.value,
    ]
    return x
  }

  function revoke(extractId: string) {
    const x = extracts.value.find((v) => v.id === extractId)
    if (!x || x.revokedAt) return
    const at = desk.clock.now()
    extracts.value = extracts.value.map((v) => (v === x ? { ...v, revokedAt: at } : v))
    trail.value = trail.value.map((t) => (t.id === x.trailId ? { ...t, revertedAt: at } : t))
  }

  /** What reverting a line of the trail will undo, said before it is done. */
  function revertText(trailId: string): string {
    const p = pins.value.find((x) => x.trailId === trailId)
    if (p) {
      const e = byId.get(p.id)
      const left = pending.value.length - (sharedIds.value.has(p.id) ? 0 : 1)
      return `Unpinned ${e ? eventNoun(e) : p.id}. ${pendingLine(left)}`
    }
    const x = extracts.value.find((v) => v.trailId === trailId)
    if (x) {
      const back = x.events.filter((id) => isPinned(id)).length
      return `Revoked the link to ${x.id} before Emma opened it. ${pendingLine(pending.value.length + back)}`
    }
    return 'That line cannot be reverted.'
  }

  function revert(trailId: string) {
    const p = pins.value.find((x) => x.trailId === trailId)
    if (p) return unpin(p.id)
    const x = extracts.value.find((v) => v.trailId === trailId)
    if (x) revoke(x.id)
  }

  function pendingLine(n = pending.value.length) {
    if (!n) return 'Nothing is waiting to be shared with Emma now.'
    return `${cap(words(n))} pinned ${n === 1 ? 'event is' : 'events are'} waiting to be shared.`
  }

  /* ── Suggestions that fit the moment ── */

  function suggest(extra: string[] = []): string[] {
    const out: string[] = [...extra]
    const add = (s: string, fresh = false) => {
      if (!out.includes(s) && !(fresh && asked.has(norm(s)))) out.push(s)
    }
    const a = answerOf(query.value)
    const e = focus.value
    if (e && a.events.includes(e) && !explained.has(e.id)) add(e.result === 'success' ? 'Why was this allowed?' : 'Why was this refused?')
    if (e && a.events.includes(e) && e.result === 'success' && !isPinned(e.id)) add('Pin it as evidence')
    if (!query.value.terms.some((t) => t.key === 'network') && a.events.some((x) => outsideOffice(x.ip)) && a.events.some((x) => !outsideOffice(x.ip)))
      add('Only the ones from outside the office network')
    if (pending.value.length && !exportCard.value) add('Share the extract with Emma')
    for (const s of ['Apa saja yang diubah Kevin kemarin?', 'Everything touching prod secrets after 18:00', 'Who signed in from outside the office network today?', 'Show me everything touching prod-admin after 18:00'])
      add(s, true)
    return out.slice(0, 3)
  }

  /* ── Replies ── */

  function question(said: string, terms: Term[]): DeskReply {
    const withWhen = terms.some((t) => t.key === 'when' || t.key === 'session') ? terms : sortTerms([...terms, DEFAULT_WHEN])
    const q: Query = { said, then: [], terms: withWhen }
    const a = answerOf(q)
    return {
      text: describe(q, a),
      card: 'reading',
      data: { eyebrow: 'Read as', title: titleOf(q, a), rows: readingRows(q, a) } satisfies ReadingCard,
      after: () => {
        setQuery(q)
        desk.chips.value = suggest(a.relaxed && q.terms.some((t) => t.key === 'when' && t.from === T.yesterday) ? ['And today?'] : [])
      },
    }
  }

  function titleOf(q: Query, a: Answer) {
    const when = q.terms.find((t) => t.key === 'when')
    const scope = when ? when.chip.replace(/ \(WIB\)$/, '') : 'one session'
    const n = a.relaxed ? `No changes · ${count(a.events.length, 'other event')}` : a.events.length ? count(a.events.length, 'event') : 'Nothing found'
    return `${n} · ${/^(Since|Last|Today)/.test(scope) ? scope.charAt(0).toLowerCase() + scope.slice(1) : scope}`
  }

  function followUp(said: string, parsed: Parsed): DeskReply {
    const prev = query.value
    const before = answerOf(prev).events.length
    if (parsed.attempts && !parsed.terms.length && !prev.terms.some((t) => t.key === 'change' || t.key === 'result')) {
      const refused = answerOf(prev).refused
      return { text: refused ? `They are in already: ${words(refused)} of the ${before} were refused.` : 'Nothing leaves them out: this answer has no refused attempts.' }
    }
    let terms = [...prev.terms]
    const changed: Term[] = []
    for (const t of parsed.terms) {
      terms = [...terms.filter((x) => x.key !== t.key), t]
      changed.push(t)
    }
    const removed: string[] = []
    if (parsed.attempts) {
      const result = terms.find((t) => t.key === 'result')
      if (result) removed.push(result.chip)
      terms = terms.filter((t) => t.key !== 'result' && t.key !== 'change')
      if (prev.terms.some((t) => t.key === 'change')) {
        terms.push(ATTEMPTS)
        changed.push(ATTEMPTS)
      }
    }
    const q: Query = { said: prev.said, then: [...prev.then, said], terms: sortTerms(terms) }
    const a = answerOf(q)
    const after = a.events.length
    let text = describe(q, a)
    if (parsed.attempts && after === before) text = `None were refused in that window; the answer stays at ${count(after, 'event')}.`
    const network = changed.find((t) => t.key === 'network')
    if (network && after) {
      // Say what the narrowing left out on purpose: people who came in through the bastion.
      const inside = answerOf(prev).events.filter((e) => !network.test(e) && e.actor.kind === 'person' && isInfra(e.ip))
      const names = [...new Set(inside.map((e) => firstName(e.actor)))]
      if (inside.length)
        text += ` ${joinAnd(names.map(possessive))} ${words(inside.length)} went through ${place(inside[0].ip)}, which counts as inside.`
    }
    return {
      text: text.replace(/\s+/g, ' ').trim(),
      card: 'reading',
      data: {
        eyebrow: after < before ? 'Narrowed' : after > before ? 'Widened' : 'Changed',
        title: `${count(before, 'event')} → ${count(after, 'event')}`,
        rows: [
          ...changed.map((t) => ({ label: t.label, value: t.value, hint: t.hint, inferred: t.inferred })),
          ...removed.map((chip) => ({ label: 'Taken out', value: chip })),
        ],
      } satisfies ReadingCard,
      after: () => {
        setQuery(q)
        desk.chips.value = suggest()
      },
    }
  }

  function why(said: string): DeskReply {
    const t = norm(said)
    const a = answerOf(query.value)
    const actor = ACTORS.find(([p]) => p.test(t))
    const askRefused = /refus|denied|ditolak|tolak|blocked|diblokir|gagal|fail/.test(t)
    const refused = askRefused && focus.value?.result === 'success' ? a.events.find((x) => x.result !== 'success') : undefined
    const e = (actor && a.events.find((x) => x.actor.id === actor[1])) || refused || focus.value || a.closest?.event
    if (!e) return { text: 'Ask for an event first, then why it was let through. Try “Who changed transfer limits this week?”' }
    const ex = explain(e)
    return {
      text: ex.text,
      card: 'why',
      data: { eventId: e.id, ex } satisfies WhyCard,
      after: () => {
        focusId.value = e.id
        explained.add(e.id)
        desk.chips.value = suggest(ex.allowed && !isPinned(e.id) && e.change ? ['Pin it as evidence'] : [])
      },
    }
  }

  function pinReply(said: string): DeskReply {
    const t = norm(said)
    const a = answerOf(query.value)
    if (/\b(all|them|semua|mereka|both|keduanya)\b/.test(t)) {
      const ids = a.events.filter((e) => e.actor.kind === 'person').slice(0, 12).map((e) => e.id).filter((id) => !isPinned(id))
      if (!ids.length) return { text: 'They are all pinned already.' }
      return {
        text: `Pinned ${count(ids.length, 'event')}. Emma’s extract now holds ${count(pending.value.length + ids.length, 'event')}.`,
        after: () => {
          ids.forEach((id) => pin(id, AGENT))
          desk.chips.value = suggest(['Share the extract with Emma', 'Undo that'])
        },
      }
    }
    const e = focus.value
    if (!e) return { text: 'Nothing to pin yet. Ask for an event first.' }
    if (isPinned(e.id)) return { text: `${cap(eventNoun(e))} is pinned already. ${pendingLine()}` }
    return {
      text: `Pinned ${eventNoun(e)}. Emma’s extract now holds ${count(pending.value.length + 1, 'event')}.`,
      after: () => {
        pin(e.id, AGENT)
        desk.chips.value = suggest(['Share the extract with Emma', 'Undo that'])
      },
    }
  }

  function unpinReply(): DeskReply {
    const e = focus.value
    if (!e || !isPinned(e.id)) return { text: 'That one is not pinned. Say “what’s left?” to see what is.' }
    return {
      text: `Unpinned ${eventNoun(e)}. ${pins.value.length - 1 ? `${count(pins.value.length - 1, 'event')} stay pinned.` : 'Nothing is pinned now.'}`,
      after: () => {
        unpin(e.id)
        desk.chips.value = suggest()
      },
    }
  }

  function exportReply(): DeskReply {
    if (!pending.value.length) {
      const live = liveExtract.value
      if (live) return { text: `Already shared as ${live.id} at ${live.at}. Say “undo” to take the link back.` }
      return { text: 'Nothing is pinned yet, so there is nothing to sign. Pin an event first: “Pin it as evidence”.' }
    }
    const id = nextExtractId()
    return {
      text: `Here is what Emma will get. It is signed, so any later edit to it would show.`,
      card: 'export',
      data: { extractId: id } satisfies ExportCard,
      chips: ['Yes, share it', 'Not yet'],
      after: () => (exportCard.value = id),
    }
  }

  function shareReply(by: string): DeskReply {
    const n = pending.value.length
    return {
      text: `Shared ${count(n, 'event')} with Emma. The link opens until ${inSevenDays(nextMinute(desk.clock.now()))}; the extract is signed with ${SIGNING.split(' · ')[1]} and anchored to chain head ${CHAIN.head}.`,
      after: () => {
        share(by)
        desk.chips.value = suggest(['Undo that', 'What’s left?'])
      },
    }
  }

  function undoReply(): DeskReply {
    const item = trail.value.find((t) => t.canRevert && !t.revertedAt)
    if (!item) return { text: 'Nothing to undo. Questions change nothing; pins and shared extracts can be taken back.' }
    return {
      text: revertText(item.id),
      after: () => {
        revert(item.id)
        desk.chips.value = suggest(['What’s left?'])
      },
    }
  }

  function statusReply(): DeskReply {
    const n = pending.value.length
    const live = liveExtract.value
    const rows: CheckRow[] = [
      { label: 'Request', value: `${REQUEST.id} · ${REQUEST.from}`, hint: `${REQUEST.asked}. Due ${REQUEST.due}.` },
      { label: 'Pinned', value: pins.value.length ? count(pins.value.length, 'event') : 'Nothing', hint: pins.value.map((p) => p.id).join(', ') || undefined },
      {
        label: 'Shared',
        value: live ? `${live.id} · ${count(live.events.length, 'event')}` : 'Not yet',
        hint: live ? `At ${live.at} UTC; the link opens until ${inSevenDays(live.at)}` : undefined,
      },
    ]
    const text = n
      ? `${cap(words(n))} pinned ${n === 1 ? 'event waits' : 'events wait'} to be signed and shared with Emma. Her request is due ${REQUEST.due}.`
      : live
        ? `Nothing waits on you. Emma has ${live.id}; she has not opened it yet.`
        : 'Nothing is pinned for Emma’s request yet. Ask for the events, then pin them.'
    return { text, card: 'status', data: { eyebrow: 'What’s left', title: n ? 'One decision waits' : 'Nothing waits', rows } satisfies ReadingCard, chips: suggest() }
  }

  function sessionReply(said: string): DeskReply {
    const e = focus.value
    if (!e) return { text: 'Ask for an event first; then I can show the rest of its session.' }
    const list = sessionOf(e)
    const term: Term = {
      key: 'session',
      chip: `Session ${e.session}`,
      label: 'Session',
      value: e.session,
      hint: `${e.actor.name}, ${dayWib(list[0].ts)} ${hhmm(list[0].ts)}–${hhmm(list[list.length - 1].ts)} UTC`,
      test: (x) => x.session === e.session,
    }
    return question(said, [term])
  }

  function respond(said: string): DeskReply | DeskReply[] {
    const t = norm(said)
    asked.add(t)
    const id = t.match(/evt_[0-9a-z]{16}/)?.[0]
    if (id && byLowerId.has(id)) focusId.value = byLowerId.get(id)!.id

    if (/^(thanks?|thank you|thx|makasih|terima ?kasih|matur nuwun|nuhun)\b/.test(t)) return { text: 'You are welcome.' }
    if (/^(hi|hello|halo|hai|hey|pagi|siang|sore|selamat \w+)\b/.test(t) && t.split(' ').length <= 3)
      return { text: 'Hello Nadia. Ask the trail anything: who did what, when, from where, and what it changed.', chips: suggest() }
    if (/\b(help|bantu|bantuan|what can you do|bisa apa)\b/.test(t))
      return {
        text: 'Ask the trail in a sentence: “who changed transfer limits this week?”, “apa saja yang diubah Kevin kemarin?”. I show the events with their before and after; you can narrow the answer, ask why one was allowed, pin it as evidence and share a signed extract with Emma.',
        chips: suggest(),
      }
    if (exportCard.value && /^(yes|ya|iya|yup|ok|oke|okay|sure|go ahead|confirm|share it|kirim|lanjut|do it|sign|silakan|boleh)\b/.test(t)) return shareReply(PERSON.name)
    if (exportCard.value && /^(no|not yet|nanti|belum|jangan|tidak|gak|nggak|nope|later|wait)\b/.test(t))
      return {
        text: 'Fine, nothing was shared. It stays under Needs you until Friday.',
        after: () => {
          exportCard.value = null
          desk.chips.value = suggest()
        },
      }
    if (/^(undo|batal|batalkan|urungkan|revert|take (it|that) back)\b|undo that|batalkan (itu|yang tadi)/.test(t)) return undoReply()
    if (/(that|the same|this|same) session|sesi (itu|ini|yang sama|tersebut)|what else (did|happened|was done)|apa lagi yang (dia|ia) lakukan/.test(t)) return sessionReply(said)
    if (/what.?s left|what is left|anything left|what remains|status|\bsisa\b|apa lagi\b|tinggal apa|what needs me|apa yang perlu/.test(t)) return statusReply()
    if (/\bunpin\b|lepas (pin|sematan)|hapus (pin|sematan|bukti)|remove (the )?pin/.test(t)) return unpinReply()
    if (/\bpin\b|\bpins\b|pin (it|this|that|them)|sematkan|jadikan bukti|simpan (sebagai|jadi) bukti|as evidence|tandai/.test(t)) return pinReply(said)
    if (/(export|ekspor|share|bagikan|kirim|send).{0,40}(extract|evidence|bukti|signed|auditor|emma|\bit\b|ini|itu)|signed extract|extract for|ke emma|untuk auditor/.test(t)) return exportReply()
    if (/^(why|kenapa|mengapa|how come)\b|\bwhy (was|did|is)|who approved|siapa yang (menyetujui|approve)|kenapa (bisa|boleh|diizinkan|ditolak)|why (allowed|refused)/.test(t)) return why(said)
    if (/besok|tomorrow|next week|minggu depan|\blusa\b/.test(t))
      return { text: 'The trail only holds what already happened. Try “kemarin” or “hari ini”.', chips: ['Apa saja yang diubah Kevin hari ini?'] }
    if (/show (all|everything)|tampilkan semua|lihat semua|see all/.test(t) && !/touching|after|from|who/.test(t))
      return { text: `All ${count(answerOf(query.value).items.length, 'line')} are in the answer now.`, after: () => (showAll.value = true) }
    if (/full record|\bjson\b|\braw\b|record lengkap|data mentah/.test(t)) {
      const e = focus.value
      if (!e) return { text: 'Ask for an event first.' }
      return {
        text: `The full record of ${e.id} is open under its fields, as stored.`,
        after: () => {
          record.value = e.id
          if (!open.value.includes(e.id)) open.value = [...open.value, e.id]
        },
      }
    }

    const parsed = parse(said)
    const hasWho = parsed.terms.some((x) => x.key === 'subject' || x.key === 'actor')
    const followWord = /^(only|just|hanya|cuma|of (those|these|them)|dari (itu|situ|yang tadi)|yang (dari|di)|from (those|these)|exclude|without|tanpa|kecuali|include|termasuk|plus|also|juga|and|dan|what about|how about|bagaimana dengan|kalau|gimana|terus|now)\b/.test(t)
    if ((parsed.terms.length || parsed.attempts) && (!hasWho || followWord)) return followUp(said, parsed)
    if (hasWho) return question(said, parsed.terms)
    return {
      text: 'I answer questions about the audit trail of Selaras production: who did what, when, from where, and what it changed. Try “Who signed in from outside the office network today?”',
      chips: suggest(['Who signed in from outside the office network today?']),
    }
  }

  const openingAnswer = answerOf(opening)
  const desk = useDesk({
    agent: AGENT,
    start: '05:30',
    opening: [
      { who: '', system: true, text: `${REQUEST.id}: ${REQUEST.from}, external audit, asked at ${REQUEST.at} UTC for ${REQUEST.asked.charAt(0).toLowerCase()}${REQUEST.asked.slice(1)}. Due ${REQUEST.due}.` },
      { who: 'You', mine: true, text: OPENING_SAID },
      {
        who: AGENT,
        text: `One change this week. ${sayOne(byId.get(HERO_ID)!)} It answers Emma’s request, so I pinned it as evidence.`,
        card: 'reading',
        data: { eyebrow: 'Read as', title: titleOf(opening, openingAnswer), rows: readingRows(opening, openingAnswer) } satisfies ReadingCard,
      },
    ],
    chips: ['Why was this allowed?', 'Apa saja yang diubah Kevin kemarin?', 'Everything touching prod secrets after 18:00'],
    respond,
  })

  /* ── From the surfaces: the same actions, said in the thread too ── */

  /* A note first, then the act: the note's minute is the one the trail records. */
  function pinFromSurface(id: string) {
    const e = byId.get(id)
    const name = e ? eventNoun(e) : id
    if (isPinned(id)) {
      desk.note(`You unpinned ${name}`)
      unpin(id)
    } else {
      desk.note(`You pinned ${name} as evidence for ${REQUEST.id}`)
      pin(id, PERSON.name)
    }
    focusId.value = id
    desk.chips.value = suggest()
  }

  function shareFromSurface() {
    if (!pending.value.length) return
    desk.note(`You signed and shared ${nextExtractId()} with Emma Schmidt`)
    const x = share(PERSON.name)
    if (x) desk.say({ text: `Shared ${count(x.events.length, 'event')}. The link opens until ${inSevenDays(x.at)}.`, chips: suggest(['Undo that', 'What’s left?']) })
  }

  function shareFromThread() {
    shareFromSurface()
  }

  function revertFromSurface(trailId: string) {
    const item = trail.value.find((t) => t.id === trailId)
    const said = revertText(trailId)
    desk.note(`You reverted: ${item?.text.replace(/^\w/, (c) => c.toLowerCase()) ?? trailId}`)
    revert(trailId)
    desk.say({ text: said, chips: suggest() })
  }

  function removeTerm(term: Term) {
    const prev = query.value
    const before = answerOf(prev).events.length
    const q: Query = { ...prev, terms: prev.terms.filter((t) => t !== term) }
    setQuery(q)
    desk.note(`You took out “${term.chip}”: ${count(before, 'event')} → ${count(answerOf(q).events.length, 'event')}`)
    desk.chips.value = suggest()
  }

  function ask(text: string, id?: string) {
    if (id) focusId.value = id
    desk.send(text)
  }

  return {
    desk,
    query,
    answer,
    focusId,
    open,
    showAll,
    record,
    pins,
    extracts,
    exportCard,
    trail,
    pending,
    liveExtract,
    nextExtractId,
    isPinned,
    pinFromSurface,
    shareFromSurface,
    shareFromThread,
    notNow: () => {
      exportCard.value = null
      desk.note('You left the extract for later')
      desk.chips.value = suggest()
    },
    revertFromSurface,
    removeTerm,
    ask,
  }
}

/**
 * Cost of the same job, Then and Now: who changed transfer limits this week, with the change, for
 * the auditor. Then: the filter row (search "transfer-limits"), the facets (Result: Success), the
 * range (7D), the table, the drawer per event, then Export CSV; three fields set over five steps,
 * and the CSV carries no before-and-after. Now: one sentence, one check of the reading, one confirm.
 */
export const COST = {
  then: [
    { value: 5, unit: 'steps' },
    { value: 3, unit: 'fields' },
  ],
  now: [
    { value: 1, unit: 'sentence' },
    { value: 1, unit: 'check' },
    { value: 1, unit: 'confirm' },
  ],
}
