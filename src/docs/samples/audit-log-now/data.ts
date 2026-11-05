/*
 * Sample 09, now · Audit trail. The same production audit log of Selaras Bank as the Then screen:
 * the events are imported from ../audit-log/data.ts, so every id, time, actor and change is the
 * one the facets and the drawer show. The scenario moment is the same too: Tue 03 Nov 2026,
 * 05:30 UTC (12:30 WIB).
 *
 * What this file adds is what a question needs: the person at the desk and the auditor's open
 * request, Jakarta time for words like "this week" and "after 18:00", the before-and-after as
 * fields instead of two JSON blocks, a short name for every network, and why an event was let
 * through (or refused), built from the same trail.
 */
import {
  NOW,
  RESULT_LABEL,
  RESULT_TONE,
  SOURCE_LABEL,
  actorById,
  dayMonth,
  events,
  idr,
  network,
  stamp,
  type Actor,
  type AuditEvent,
  type Result,
} from '../audit-log/data'

export { NOW, RESULT_LABEL, RESULT_TONE, SOURCE_LABEL, actorById, dayMonth, events, idr, network, stamp }
export type { Actor, AuditEvent, Result }

const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR
const pad = (n: number) => String(n).padStart(2, '0')

/* ── Who is here ─────────────────────────────────────────────────────────── */

export const AGENT = 'Simpul'

/** The person at the desk: governance, risk and compliance, with audit-read. */
export const PERSON = { id: 'nadia.rahman', name: 'Nadia Rahman', first: 'Nadia' }

/** The external auditor's open request: the reason for the first question. */
export const REQUEST = {
  id: 'AUD-REQ-0419',
  from: 'Emma Schmidt',
  team: 'External audit',
  asked: 'Every change to retail transfer limits this week, with before and after',
  at: '04:57',
  due: 'Fri 06 Nov',
}

/** The log's own integrity, as the Then screen shows it. */
export const CHAIN = { head: 'sha256:3f9a…c21e', anchor: '05:00:00 UTC', copies: 'JKT-1, SGP-1' }
export const SIGNING = 'Ed25519 · audit-signing-2026'

/** The change Yusuf Hakim made today: the answer the screen opens on. */
export const HERO_ID = 'evt_01M6FX8W7699HYVP'

/* ── Time, in UTC and in Jakarta ─────────────────────────────────────────── */

export const WIB = 7 * HOUR
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Midnight in Jakarta of a calendar day, as a UTC instant. */
export const wibMidnight = (y: number, m: number, d: number) => Date.UTC(y, m, d) - WIB

/** The instants the time words resolve to, in Jakarta time. */
export const T = {
  /** Tue 03 Nov 00:00 WIB = 02 Nov 17:00 UTC. */
  today: wibMidnight(2026, 10, 3),
  /** Mon 02 Nov 00:00 WIB: yesterday, and the start of this week. */
  yesterday: wibMidnight(2026, 10, 2),
  week: wibMidnight(2026, 10, 2),
  lastWeek: wibMidnight(2026, 9, 26),
  month: wibMidnight(2026, 10, 1),
  /** The oldest event this view holds: 30 days back. */
  start: NOW - 30 * DAY,
}

/** "05:14" in UTC. */
export const hhmm = (ms: number) => {
  const d = new Date(ms)
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
}
/** "12:14" in Jakarta. */
export const hhmmWib = (ms: number) => hhmm(ms + WIB)
export const wibHour = (ms: number) => new Date(ms + WIB).getUTCHours() + new Date(ms + WIB).getUTCMinutes() / 60
/** "22 Oct", the day in Jakarta. */
export const dayWib = (ms: number) => {
  const d = new Date(ms + WIB)
  return `${pad(d.getUTCDate())} ${MONTHS[d.getUTCMonth()]}`
}
/** "Mon 02 Nov", the day in Jakarta. */
export const weekdayWib = (ms: number) => `${WEEKDAYS[new Date(ms + WIB).getUTCDay()]} ${dayWib(ms)}`
/** "01 Nov 17:00 UTC" */
export const utcLabel = (ms: number) => `${dayMonth(ms)} ${hhmm(ms)} UTC`
/** "today", "yesterday", "on 22 Oct" (in Jakarta). */
export function dayPhrase(ms: number) {
  if (ms >= T.today) return 'today'
  if (ms >= T.yesterday) return 'yesterday'
  return `on ${dayWib(ms)}`
}
/** "today at 05:14 UTC (12:14 WIB)" */
export const whenPhrase = (ms: number) => `${dayPhrase(ms)} at ${hhmm(ms)} UTC (${hhmmWib(ms)} WIB)`
/** "Tue 10 Nov 05:42 UTC": when a link opened now stops opening. */
export const inSevenDays = (clock: string) => {
  const [h, m] = clock.split(':').map(Number)
  const at = Date.UTC(2026, 10, 3, h, m) + 7 * DAY
  return `${WEEKDAYS[new Date(at).getUTCDay()]} ${dayMonth(at)} ${hhmm(at)} UTC`
}

/* ── Networks ────────────────────────────────────────────────────────────── */

export const isOffice = (ip: string) => ip.startsWith('203.0.113.')
/** The bastion, the production cluster and the CI runners: inside, though not an office. */
export const isInfra = (ip: string) => ip === '10.30.1.5' || ip.startsWith('10.20.') || ip.startsWith('10.40.')
/** "Outside the office network": the staff VPN, a home address or one never seen before. */
export const outsideOffice = (ip: string) => !isOffice(ip) && !isInfra(ip)

/** A short name for where an event came from: "the Jakarta office", "jump-01". */
export function place(ip: string): string {
  if (ip === '10.30.1.5') return 'jump-01'
  if (ip.startsWith('10.8.')) return 'the staff VPN'
  if (ip.startsWith('10.20.')) return 'the production cluster'
  if (ip.startsWith('10.40.')) return 'the CI runners'
  if (ip.startsWith('203.0.113.4')) return 'the Singapore office'
  if (ip.startsWith('203.0.113.')) return 'the Jakarta office'
  if (ip.startsWith('192.0.2.')) return 'an address never seen before'
  return 'a home address'
}
/** "Jakarta office", for labels; host names keep their case. */
export const placeLabel = (ip: string) => {
  const p = place(ip).replace(/^(the|an|a) /, '')
  return /^[a-z]+-\d/.test(p) ? p : p.charAt(0).toUpperCase() + p.slice(1)
}

/* ── Who people are ──────────────────────────────────────────────────────── */

export const firstName = (a: Actor) => (a.kind === 'service' ? a.name : a.name.split(' ')[0])
export const who = (a: Actor) => (a.kind === 'service' ? `Service account · ${a.team}` : `${a.team} · ${a.id}`)

/* ── The change as fields ────────────────────────────────────────────────── */

export interface FieldChange {
  path: string
  before: string
  after: string
  /** A quiet gloss under the value: "Rp 25.000.000", "4 kept". */
  hint?: string
}

export interface FieldDiff {
  /** What the change is about. */
  changed: FieldChange[]
  /** Bookkeeping that moves with every edit: version, updated_by, updated_at. */
  book: FieldChange[]
  unchanged: string[]
}

const BOOK = new Set(['version', 'updated_by', 'updated_at'])
const isPlain = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const show = (v: unknown) => (v === undefined ? '—' : typeof v === 'string' ? v : JSON.stringify(v))

function flatten(value: unknown, prefix = '', out = new Map<string, unknown>()) {
  if (isPlain(value) && Object.keys(value).length) {
    for (const [k, v] of Object.entries(value)) flatten(v, prefix ? `${prefix}.${k}` : k, out)
  } else if (prefix) out.set(prefix, value)
  return out
}

/** Field by field: what changed, the bookkeeping that came with it, and what stayed. */
export function fieldDiff(before: unknown, after: unknown): FieldDiff {
  const a = flatten(before ?? {})
  const b = flatten(after ?? {})
  const diff: FieldDiff = { changed: [], book: [], unchanged: [] }
  // A field that was null on one side and an object on the other is said through its children.
  const parentOf = (side: Map<string, unknown>, path: string) => [...side.keys()].find((k) => path.startsWith(`${k}.`))
  const hasChildren = (side: Map<string, unknown>, path: string) => [...side.keys()].some((k) => k.startsWith(`${path}.`))
  for (const path of new Set([...a.keys(), ...b.keys()])) {
    if ((!a.has(path) && hasChildren(a, path)) || (!b.has(path) && hasChildren(b, path))) continue
    const x = a.get(path)
    const y = b.get(path)
    if (JSON.stringify(x) === JSON.stringify(y)) {
      diff.unchanged.push(path)
      continue
    }
    const before = a.has(path) ? show(x) : parentOf(a, path) ? show(a.get(parentOf(a, path)!)) : '—'
    const after = b.has(path) ? show(y) : parentOf(b, path) ? show(b.get(parentOf(b, path)!)) : '—'
    let row: FieldChange = { path, before, after }
    if (Array.isArray(x) && Array.isArray(y)) {
      // Lists say what came and went, not the whole list twice.
      const xs = x.map(show)
      const ys = y.map(show)
      const gone = xs.filter((v) => !ys.includes(v))
      const came = ys.filter((v) => !xs.includes(v))
      const kept = xs.length - gone.length
      row = {
        path,
        before: gone.length ? gone.map((v) => `− ${v}`).join('\n') : '—',
        after: came.length ? came.map((v) => `+ ${v}`).join('\n') : '—',
        hint: `${kept} kept`,
      }
    } else if (/_idr$/.test(path) && typeof y === 'number') {
      row.hint = typeof x === 'number' ? `${idr(x)} → ${idr(y)}` : idr(y)
    }
    ;(BOOK.has(path) ? diff.book : diff.changed).push(row)
  }
  return diff
}

/** Lines (1-based) outside the longest common run, as the Then drawer marks them. */
export function lineDiff(a: string[], b: string[]) {
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0))
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
  const keptA = new Set<number>()
  const keptB = new Set<number>()
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      keptA.add(i++)
      keptB.add(j++)
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++
    else j++
  }
  return {
    removed: a.map((_, k) => k).filter((k) => !keptA.has(k)).map((k) => k + 1),
    added: b.map((_, k) => k).filter((k) => !keptB.has(k)).map((k) => k + 1),
  }
}

/* ── The rest of a session ───────────────────────────────────────────────── */

const bySession = new Map<string, AuditEvent[]>()
for (const e of [...events].reverse()) {
  const list = bySession.get(e.session)
  if (list) list.push(e)
  else bySession.set(e.session, [e])
}
/** Every event of the session, oldest first. */
export const sessionOf = (e: AuditEvent) => bySession.get(e.session) ?? [e]

export const byId = new Map(events.map((e) => [e.id, e]))
/** Ids as the composer sees them once normalised (lower case). */
export const byLowerId = new Map(events.map((e) => [e.id.toLowerCase(), e]))

/* ── Why an event was let through, or refused ────────────────────────────── */

export interface Explanation {
  allowed: boolean
  title: string
  text: string
  rows: { label: string; value: string; hint?: string; inferred?: boolean; mono?: boolean }[]
}

/** The production change window since Dewi Anggraini moved it on 30 Oct: Tue and Thu 03:00–06:00 UTC. */
function inWindow(ms: number) {
  const d = new Date(ms)
  const h = d.getUTCHours()
  return (d.getUTCDay() === 2 || d.getUTCDay() === 4) && h >= 3 && h < 6
}

function allowlist(ip: string) {
  if (ip.startsWith('203.0.113.4')) return 'On the console allowlist: 203.0.113.40/29'
  if (isOffice(ip)) return 'On the console allowlist: 203.0.113.8/29'
  if (ip.startsWith('10.8.')) return 'On the console allowlist: 10.8.0.0/16'
  if (ip === '10.30.1.5') return 'The bastion: every CLI session comes through it'
  if (isInfra(ip)) return 'Inside the production network'
  return 'Not on the console allowlist'
}

/**
 * Whether the actor held prod-write at that moment, by the grants and revocations in the trail.
 * Says nothing when the trail shows it was taken away before.
 */
function heldProdWrite(actor: string, at: number): string | null {
  const path = `/iam/roles/prod-write/members/${actor}`
  const last = events.find((e) => e.resource === path && e.result === 'success' && e.ts < at)
  const standing = ['kevin.halim', 'oliver.grant', 'tomas.ferreira', 'wahyu.setiawan'].includes(actor)
  if (last?.action === 'role.revoke' || (!standing && last?.action !== 'role.grant')) return null
  return actor === 'kevin.halim' || actor === 'tomas.ferreira' ? 'Holds prod-write and break-glass' : 'Holds prod-write'
}

function signIn(e: AuditEvent) {
  if (e.actor.kind === 'service') return { label: 'Identity', value: `Service account key`, hint: e.agent }
  const start = sessionOf(e).find((s) => s.action === 'session.start' && s.result === 'success')
  if (!start) return { label: 'Sign-in', value: 'No sign-in in this session', hint: 'Refused before a session existed' }
  const sso = start.params?.method === 'sso'
  return {
    label: 'Sign-in',
    value: sso ? `Single sign-on and a hardware key, ${stamp(start.ts).slice(0, 8)} UTC` : `Hardware key, ${stamp(start.ts).slice(0, 8)} UTC`,
    hint: sso ? 'Through jump-01, WebAuthn' : `Password and WebAuthn on ${String(start.params?.device ?? e.actor.device)}`,
  }
}

/** The checks that would have refused the event, and how each one came out. */
export function explain(e: AuditEvent): Explanation {
  const rows: Explanation['rows'] = []
  const net = { label: 'Network', value: `${e.ip} · ${placeLabel(e.ip)}`, hint: allowlist(e.ip), mono: false }

  if (e.result !== 'success') {
    const next = events
      .filter((x) => x.actor.id === e.actor.id && x.ts > e.ts && x.action === 'session.start' && x.result === 'success')
      .at(-1)
    const asked = e.summary.startsWith('Tried to ')
      ? e.summary.replace(/^Tried to (\w)/, (_, c: string) => c.toUpperCase())
      : `A ${SOURCE_LABEL[e.source].toLowerCase()} session`
    rows.push({ label: 'Rule', value: e.reason ?? 'Refused' })
    rows.push(net)
    rows.push({ label: 'Asked for', value: asked, hint: `${e.action} · ${SOURCE_LABEL[e.source]}` })
    // What the SOC did about it, if anything: a lock or an MFA reset on the same account afterwards.
    const lock = events.find((x) => x.action === 'user.lock' && x.resource === `/iam/users/${e.actor.id}` && x.ts > e.ts && x.ts < e.ts + DAY)
    const reset = events.find((x) => x.action === 'user.mfa_reset' && x.resource === `/iam/users/${e.actor.id}/mfa` && x.ts > e.ts && x.ts < e.ts + DAY)
    const why = (lock?.change?.after as { locked_reason?: string } | undefined)?.locked_reason
    const signIn = e.action === 'session.start'
    if (lock) rows.push({ label: 'Then', value: `Locked by ${lock.actor.name}, ${stamp(lock.ts).slice(0, 8)} UTC`, hint: why })
    else if (next && signIn) rows.push({ label: 'Next', value: `Signed in ${dayPhrase(next.ts)} at ${hhmm(next.ts)} UTC from ${place(next.ip)}`, hint: next.id })
    const tries = sessionOf(e).filter((x) => x.action === 'session.start' && x.result !== 'success').length
    const stranger = e.ip.startsWith('192.0.2.')
    let text = signIn
      ? `The rule stopped it, so nothing changed. ${next ? `${firstName(e.actor)} got in ${dayPhrase(next.ts)} at ${hhmm(next.ts)} UTC from ${place(next.ip)}.` : ''}`
      : `${(e.reason ?? 'A rule refused it').split(' (')[0]}, and the request did not have that, so nothing changed. The record keeps what was asked for, marked as not applied.`
    if (stranger && lock)
      text = `Someone without the hardware key tried the account ${tries === 3 ? 'three times' : `${tries} times`}, and the last refusal blocked the address for an hour. ${lock.actor.name} locked the account at ${hhmm(lock.ts)} UTC${reset ? ` and reset its MFA a minute later` : ''}${why ? ` (${why.split(' · ').at(-1)})` : ''}.`
    return {
      allowed: false,
      title: `Refused · ${e.reason?.split(/[;(]/)[0].trim() ?? RESULT_LABEL[e.result]}`,
      text: text.trim(),
      rows,
    }
  }

  rows.push(signIn(e))
  rows.push(net)
  const ticket = String(e.params?.purpose ?? e.params?.ticket ?? '')
  const window = inWindow(e.ts)
  const windowRow = {
    label: 'Window',
    value: window ? 'Inside · Tue 03:00–06:00 UTC' : `Outside · ${hhmm(e.ts)} UTC`,
    hint: 'change-window-prod, as set on 30 Oct',
  }
  let text = 'Every check that could have refused it passed.'

  switch (e.action) {
    case 'policy.update': {
      const hero = e.id === HERO_ID
      rows.push({
        label: 'Approval',
        value: hero ? 'Dewi Anggraini, CISO office · CHG-4468' : 'CISO office approval on file',
        hint: hero ? 'Approved 03:16 UTC, in the change system, not this trail' : 'Held by the change system, not this trail',
        inferred: true,
      })
      rows.push(windowRow)
      text = hero
        ? 'Policy changes need the CISO office to approve them, and Dewi Anggraini approved this one this morning. The other checks passed as usual.'
        : 'Policy changes need the CISO office to approve them; the approval is on file in the change system.'
      break
    }
    case 'secret.read':
    case 'db.session.start': {
      if (ticket.startsWith('CHG')) rows.push({ label: 'Ticket', value: ticket, mono: true, hint: 'Given as the purpose of the request' })
      rows.push(windowRow)
      const after = sessionOf(e).find((s) => s.ts > e.ts && s.action !== 'session.end')
      text = window
        ? 'It was inside the change window and carried a ticket.'
        : `Reads outside the change window need a ticket, and ${ticket || 'one'} was given.`
      if (after && e.actor.kind === 'person') {
        const gap = Math.round((after.ts - e.ts) / 1000)
        text += ` In the same session, ${gap < 60 ? `${gap} seconds` : `${Math.round(gap / 60)} minutes`} later, ${firstName(e.actor)} ${after.summary.charAt(0).toLowerCase()}${after.summary.slice(1)}.`
      }
      break
    }
    case 'key.rotate':
    case 'key.create':
    case 'key.revoke': {
      const access = heldProdWrite(e.actor.id, e.ts)
      if (access) rows.push({ label: 'Access', value: access })
      rows.push(windowRow)
      const prior = sessionOf(e).find((s) => s.ts < e.ts && s.params?.ticket)
      if (prior) rows.push({ label: 'Ticket', value: String(prior.params?.ticket), mono: true, hint: `Given earlier in the session, for ${prior.action}` })
      if (e.action === 'key.rotate') {
        rows.push({ label: 'Fallback', value: 'The old key stays valid for 24 h', hint: 'So nothing calling with it broke' })
        text = 'Key rotations are allowed for prod-write holders inside the change window, and the old key keeps working for a day, so nothing broke.'
      }
      break
    }
    case 'role.grant':
    case 'role.revoke':
      rows.push({ label: 'Request', value: 'Through the access request flow', hint: 'Grants outside it are blocked', inferred: true })
      rows.push({ label: 'Second approver', value: 'Someone from Security', hint: 'Named in the access request, not this trail', inferred: true })
      text = 'Role changes go through an access request with a second approver from Security; both are on the request.'
      break
    case 'payment.approve':
      rows.push({ label: 'Limit', value: 'Within Rp 5.000.000.000', hint: "The approver's own limit" })
      rows.push({ label: 'Four eyes', value: 'Second of two approvals', hint: 'The approver created no transfer in the batch' })
      text = 'It was the second of two approvals and inside the approver’s limit.'
      break
    default:
      rows.push({ label: 'Permission', value: `${e.action} for ${e.actor.team}`, hint: 'Part of the team’s standing access' })
  }
  if (e.ip.startsWith('198.51.100.') || e.ip.startsWith('192.0.2.'))
    text += ' The address is not on the console allowlist, and this trail does not show why it was let in: worth asking IAM.'
  const checks = rows.filter((r) => r.label !== 'Fallback').length
  return { allowed: true, title: `Allowed · ${checks} checks passed`, text, rows }
}
