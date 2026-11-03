/*
 * Sample 09 · Audit trail. The production audit log of Selaras Bank, an invented neo-bank
 * (Jakarta, Singapore). The scenario moment is Tue 03 Nov 2026, 05:30 UTC; every event happened
 * before it. Thirty days of background events come from a seeded generator, so the filters,
 * facets and pages work on real volume. The last hour is written by hand and tells one story:
 * a credential-stuffing attempt the SOC shuts down, a denied role grant, a policy change and a
 * key rotation inside a change window.
 *
 * External addresses use the documentation ranges (192.0.2.0/24, 198.51.100.0/24,
 * 203.0.113.0/24); internal ones are 10.x.
 */
import type { StatusTone } from '@/design-system'

export const NOW = Date.UTC(2026, 10, 3, 5, 30, 0)
const SECOND = 1000
const MIN = 60 * SECOND
const HOUR = 60 * MIN
const DAY = 24 * HOUR

/* ── Vocabulary ──────────────────────────────────────────────────────────── */

export type Result = 'success' | 'denied' | 'error'
export type Source = 'console' | 'api' | 'cli' | 'system'
export type ResourceType = 'session' | 'user' | 'customer' | 'payment' | 'role' | 'api_key' | 'policy' | 'secret' | 'report'

export const RESULTS: Result[] = ['success', 'denied', 'error']
export const SOURCES: Source[] = ['console', 'api', 'cli', 'system']
export const TYPES: ResourceType[] = ['session', 'user', 'customer', 'payment', 'role', 'api_key', 'policy', 'secret', 'report']

export const RESULT_LABEL: Record<Result, string> = { success: 'Success', denied: 'Denied', error: 'Error' }
export const RESULT_TONE: Record<Result, StatusTone> = { success: 'success', denied: 'danger', error: 'warning' }
export const SOURCE_LABEL: Record<Source, string> = { console: 'Console', api: 'API', cli: 'CLI', system: 'System' }
export const TYPE_LABEL: Record<ResourceType, string> = {
  session: 'Session',
  user: 'User',
  customer: 'Customer',
  payment: 'Payment',
  role: 'Role',
  api_key: 'API key',
  policy: 'Policy',
  secret: 'Secret',
  report: 'Report',
}

/** One value of a facet with the number of events it would match. */
export interface FacetOption {
  value: string
  label: string
  count: number
  /** A status lamp before the label (results only). */
  tone?: StatusTone
}

export interface Actor {
  id: string
  name: string
  kind: 'person' | 'service'
  /** Name the avatar is drawn from; service accounts get a readable one. */
  avatar: string
  team: string
  region: 'JKT-1' | 'SGP-1'
  /** Workstation or host the actor works from. */
  device: string
}

export interface AuditEvent {
  id: string
  ts: number
  actor: Actor
  action: string
  type: ResourceType
  resource: string
  ip: string
  source: Source
  result: Result
  /** One plain sentence: what happened. */
  summary: string
  /** Why it was denied or failed. */
  reason?: string
  session: string
  request: string
  agent: string
  region: string
  /** State of the resource before and after (or as requested, when it was not applied). */
  change?: { before: unknown; after: unknown }
  /** What a read-only event asked for. */
  params?: Record<string, unknown>
}

/* ── People and services ─────────────────────────────────────────────────── */

const person = (id: string, name: string, team: string, device: string, region: Actor['region'] = 'JKT-1'): Actor => ({
  id,
  name,
  kind: 'person',
  avatar: name,
  team,
  region,
  device,
})

const service = (id: string, avatar: string, team: string, device: string): Actor => ({
  id,
  name: id,
  kind: 'service',
  avatar,
  team,
  region: 'JKT-1',
  device,
})

export const actors: Actor[] = [
  person('rizky.pratama', 'Rizky Pratama', 'Security · SOC', 'ws-jkt-0412'),
  person('ayu.lestari', 'Ayu Lestari', 'Security · SOC', 'ws-jkt-0388'),
  person('daniel.okafor', 'Daniel Okafor', 'Security · SOC', 'ws-jkt-0451'),
  person('mei.lin.tan', 'Mei Lin Tan', 'Security · SOC', 'mac-sg-0087', 'SGP-1'),
  person('bayu.saputra', 'Bayu Saputra', 'Security · SOC', 'ws-jkt-0417'),
  person('sofia.marques', 'Sofia Marques', 'Security · SOC', 'mac-sg-0091', 'SGP-1'),
  person('dewi.anggraini', 'Dewi Anggraini', 'Security · CISO office', 'mac-jkt-0102'),
  person('arjun.mehta', 'Arjun Mehta', 'Security · IAM', 'mac-jkt-0144'),
  person('nadia.rahman', 'Nadia Rahman', 'Security · GRC', 'ws-jkt-0233'),
  person('kevin.halim', 'Kevin Halim', 'Platform · SRE', 'mac-jkt-0310'),
  person('tomas.ferreira', 'Tomás Ferreira', 'Platform', 'mac-jkt-0322'),
  person('grace.liu', 'Grace Liu', 'Data', 'mac-jkt-0356'),
  person('fajar.nugroho', 'Fajar Nugroho', 'Payments', 'ws-jkt-0521'),
  person('laras.wulandari', 'Laras Wulandari', 'Customer support', 'ws-jkt-0604'),
  person('yusuf.hakim', 'Yusuf Hakim', 'Risk', 'ws-jkt-0277'),
  person('emma.schmidt', 'Emma Schmidt', 'External audit', 'guest-sg-0012', 'SGP-1'),
  service('svc-ledger-sync', 'Ledger Sync', 'Core ledger', 'k8s-prod-node-14'),
  service('svc-payments-api', 'Payments API', 'Payments', 'payments-api-7f9c'),
  service('terraform-ci', 'Terraform CI', 'Platform', 'ci-runner-03'),
]

const byId = Object.fromEntries(actors.map((a) => [a.id, a])) as Record<string, Actor>
export const actorById = (id: string) => byId[id]

/** Colleagues who are not actors in the log but appear as targets of grants and locks. */
const staff: Record<string, string> = {
  'putri.maharani': 'Putri Maharani',
  'hendra.wijaya': 'Hendra Wijaya',
  'ahmad.fauzi': 'Ahmad Fauzi',
  'chloe.tan': 'Chloe Tan',
  'wahyu.setiawan': 'Wahyu Setiawan',
  'rina.kusuma': 'Rina Kusuma',
  'oliver.grant': 'Oliver Grant',
  'siti.rahayu': 'Siti Rahayu',
  'andre.gunawan': 'Andre Gunawan',
  'priya.nair': 'Priya Nair',
  ...Object.fromEntries(actors.filter((a) => a.kind === 'person').map((a) => [a.id, a.name])),
}
const staffIds = Object.keys(staff)

/* ── Seeded randomness ───────────────────────────────────────────────────── */

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(823)
const int = (lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1))
const pick = <T>(list: readonly T[]): T => list[Math.floor(rand() * list.length)]
const chance = (p: number) => rand() < p
function weighted<T>(entries: readonly (readonly [T, number])[]): T {
  const total = entries.reduce((sum, [, w]) => sum + w, 0)
  let r = rand() * total
  for (const [value, w] of entries) {
    r -= w
    if (r <= 0) return value
  }
  return entries[entries.length - 1][0]
}

const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const HEX = '0123456789abcdef'
const b32 = (n: number) => Array.from({ length: n }, () => B32[int(0, 31)]).join('')
const hex = (n: number) => Array.from({ length: n }, () => HEX[int(0, 15)]).join('')
/** The 48-bit millisecond time part of a ULID, ten Crockford base32 characters. */
function ulidTime(ms: number) {
  let out = ''
  let rest = ms
  for (let i = 0; i < 10; i++) {
    out = B32[rest % 32] + out
    rest = Math.floor(rest / 32)
  }
  return out
}

const eventId = (ts: number) => `evt_${ulidTime(ts)}${b32(6)}`
const sessionId = () => `ses_${b32(10).toLowerCase()}`
const requestId = () => `req_${hex(16)}`
const customerId = () => `cus_${b32(8)}`
const accountNo = () => `00${int(10, 39)}-${int(1000, 9999)}-${int(1000, 9999)}`

/** Rp 4.820.000.000 */
export const idr = (n: number) => `Rp ${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
const thousands = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
const iso = (ms: number) => new Date(ms).toISOString().replace('.000Z', 'Z')
const ymd = (ms: number) => new Date(ms).toISOString().slice(0, 10).replace(/-/g, '')

/* ── Addresses and clients ───────────────────────────────────────────────── */

const OFFICE = { 'JKT-1': ['203.0.113.10', '203.0.113.11', '203.0.113.12'], 'SGP-1': ['203.0.113.40', '203.0.113.41'] }
const JUMP_HOST = '10.30.1.5'

function consoleIp(actor: Actor) {
  const r = rand()
  if (r < 0.72) return pick(OFFICE[actor.region])
  if (r < 0.92) return `10.8.${int(0, 3)}.${int(10, 250)}`
  return `198.51.100.${int(2, 250)}`
}

const consoleAgent = (actor: Actor) => `Console 2026.11.2 · ${actor.device}`
const CLI_AGENT = 'selaras-cli 3.4.1 · arm64 · jump-01'
const SCHEDULER_AGENT = 'scheduler 1.18 · k8s-prod-node-14'
const PAYMENTS_AGENT = 'svc-payments-api 7.2.0 · payments-api-7f9c'
const CI_AGENT = 'terraform-ci · ci-runner-03'

/* ── What each action does to its resource ───────────────────────────────── */

export type Action =
  | 'session.start'
  | 'session.end'
  | 'customer.view'
  | 'customer.update'
  | 'account.freeze'
  | 'account.unfreeze'
  | 'user.lock'
  | 'user.mfa_reset'
  | 'payment.approve'
  | 'payment.cancel'
  | 'payment.release'
  | 'role.grant'
  | 'role.revoke'
  | 'key.create'
  | 'key.rotate'
  | 'key.revoke'
  | 'policy.update'
  | 'secret.read'
  | 'secret.update'
  | 'db.session.start'
  | 'report.export'
  | 'ledger.reconcile'

export const ACTIONS: Action[] = [
  'account.freeze',
  'account.unfreeze',
  'customer.update',
  'customer.view',
  'db.session.start',
  'key.create',
  'key.revoke',
  'key.rotate',
  'ledger.reconcile',
  'payment.approve',
  'payment.cancel',
  'payment.release',
  'policy.update',
  'report.export',
  'role.grant',
  'role.revoke',
  'secret.read',
  'secret.update',
  'session.end',
  'session.start',
  'user.lock',
  'user.mfa_reset',
]

interface Built {
  type: ResourceType
  resource: string
  summary: string
  /** The same sentence for a request that was refused or failed. */
  attempt?: string
  change?: { before: unknown; after: unknown }
  params?: Record<string, unknown>
  deny?: string[]
  error?: string[]
}

interface Context {
  actor: Actor
  ts: number
  source: Source
  session: string
}

/** Who holds each role today. */
const ROLE_MEMBERS: Record<string, string[]> = {
  'payments-initiator': ['hendra.wijaya', 'laras.wulandari', 'putri.maharani', 'rina.kusuma'],
  'payments-approver': ['andre.gunawan', 'fajar.nugroho', 'yusuf.hakim'],
  'customer-pii-read': ['ayu.lestari', 'chloe.tan', 'daniel.okafor', 'laras.wulandari', 'siti.rahayu'],
  'customer-pii-export': ['grace.liu', 'priya.nair'],
  'kyc-editor': ['chloe.tan', 'laras.wulandari', 'siti.rahayu'],
  'prod-read': ['grace.liu', 'kevin.halim', 'oliver.grant', 'tomas.ferreira', 'wahyu.setiawan'],
  'prod-write': ['kevin.halim', 'oliver.grant', 'tomas.ferreira', 'wahyu.setiawan'],
  'break-glass': ['kevin.halim', 'tomas.ferreira'],
  'audit-read': ['dewi.anggraini', 'emma.schmidt', 'nadia.rahman'],
  'fraud-analyst': ['ahmad.fauzi', 'ayu.lestari', 'bayu.saputra', 'sofia.marques'],
}
const ROLES = Object.keys(ROLE_MEMBERS)
const SECRETS = ['prod/ledger/db-password', 'prod/payments/switch-client-key', 'prod/payments/signing-key', 'prod/mobile/push-token', 'prod/data/warehouse-reader']
const KEY_OWNERS = ['svc-payments-api', 'svc-ledger-sync', 'svc-mobile-bff', 'svc-risk-scoring', 'svc-data-export']
const DB_HOSTS = ['pg-ledger-prod-01', 'pg-payments-prod-02', 'pg-customers-prod-01', 'wh-analytics-01']
const REPORTS = [
  ['access-review-q4-2026', 'access review evidence', 1284],
  ['privileged-sessions-oct-2026', 'privileged session report', 312],
  ['payments-approvals-oct-2026', 'payment approval report', 2140],
  ['mfa-coverage-2026-11', 'MFA coverage report', 48],
] as const

const ticket = () => `CHG-${int(4380, 4470)}`
/** A policy and one realistic edit to it. */
function policyEdit(name: string, actor: Actor, ts: number) {
  const version = int(6, 22)
  const base = { id: `pol_${name.replace(/-/g, '_')}`, version, updated_by: 'nadia.rahman', updated_at: iso(ts - int(9, 60) * DAY) }
  const next = { version: version + 1, updated_by: actor.id, updated_at: iso(ts) }
  switch (name) {
    case 'session-timeout-console':
      return { before: { ...base, idle_minutes: 30, absolute_hours: 12, applies_to: ['staff'] }, after: { ...base, ...next, idle_minutes: 15, absolute_hours: 12, applies_to: ['staff'] } }
    case 'mfa-enforcement':
      return {
        before: { ...base, factors: ['webauthn'], groups: ['staff', 'service-desk'] },
        after: { ...base, ...next, factors: ['webauthn'], groups: ['staff', 'service-desk', 'contractors'] },
      }
    case 'ip-allowlist-console':
      return {
        before: { ...base, cidrs: ['203.0.113.8/29', '10.8.0.0/16'] },
        after: { ...base, ...next, cidrs: ['203.0.113.8/29', '203.0.113.40/29', '10.8.0.0/16'] },
      }
    case 'change-window-prod':
      return {
        before: { ...base, window: { days: ['tue', 'thu'], start: '04:00', end: '06:00', zone: 'UTC' } },
        after: { ...base, ...next, window: { days: ['tue', 'thu'], start: '03:00', end: '06:00', zone: 'UTC' } },
      }
    default:
      return {
        before: { ...base, daily_limit_idr: 250000000, new_device: { limit_idr: 50000000, cooling_off_hours: 0 }, applies_to: ['retail'] },
        after: { ...base, ...next, daily_limit_idr: 250000000, new_device: { limit_idr: 25000000, cooling_off_hours: 24 }, applies_to: ['retail'] },
      }
  }
}

function build(action: Action, ctx: Context, opts: Record<string, string | number> = {}): Built {
  const { actor, ts, source } = ctx
  switch (action) {
    case 'session.start': {
      const cli = source === 'cli'
      return {
        type: 'session',
        resource: `/iam/users/${actor.id}/sessions/${ctx.session}`,
        summary: cli ? 'Signed in to the CLI with single sign-on' : 'Signed in with a hardware key',
        attempt: 'Sign-in failed',
        params: cli ? { method: 'sso', via: 'jump-01', mfa: 'webauthn' } : { method: 'password+webauthn', device: actor.device },
        deny: ['MFA challenge failed', 'Password correct, hardware key not presented within 60 s'],
      }
    }
    case 'session.end': {
      const idle = chance(0.35)
      return {
        type: 'session',
        resource: `/iam/users/${actor.id}/sessions/${ctx.session}`,
        summary: idle ? 'Session expired after 15 min idle' : 'Signed out',
        params: { reason: idle ? 'idle_timeout' : 'user' },
      }
    }
    case 'customer.view': {
      const id = String(opts.customer ?? customerId())
      const ticketNo = `CS-${int(48000, 48999)}`
      return {
        type: 'customer',
        resource: `/customers/${id}`,
        summary: `Viewed customer profile ${id} for ticket ${ticketNo}`,
        params: { customer: id, fields: pick([['name', 'phone', 'kyc_tier'], ['name', 'accounts', 'recent_transfers'], ['name', 'kyc_documents']]), purpose: ticketNo },
      }
    }
    case 'customer.update': {
      const id = String(opts.customer ?? customerId())
      const old = int(1000, 9999)
      const next = int(1000, 9999)
      return {
        type: 'customer',
        resource: `/customers/${id}/contact`,
        summary: `Changed the phone number on ${id}`,
        attempt: `Tried to change the phone number on ${id}`,
        change: {
          before: { customer: id, phone: `+62 812-••••-${old}`, phone_verified: true, updated_by: 'customer', updated_at: iso(ts - int(40, 400) * DAY) },
          after: { customer: id, phone: `+62 813-••••-${next}`, phone_verified: false, updated_by: actor.id, updated_at: iso(ts) },
        },
        deny: ['Step-up MFA required for contact changes'],
      }
    }
    case 'account.freeze':
    case 'account.unfreeze': {
      const id = customerId()
      const account = accountNo()
      const freeze = action === 'account.freeze'
      const caseNo = `SOC-2026-${int(1100, 1186)}`
      const frozen = { account, customer: id, status: 'frozen', reason: `Suspected account takeover · ${caseNo}`, frozen_by: 'ayu.lestari' }
      const active = { account, customer: id, status: 'active', reason: null, frozen_by: null }
      return {
        type: 'customer',
        resource: `/customers/${id}/accounts/${account}`,
        summary: freeze ? `Froze account ${account} (${caseNo})` : `Unfroze account ${account} after customer verification`,
        attempt: freeze ? `Tried to freeze account ${account}` : `Tried to unfreeze account ${account}`,
        change: freeze
          ? { before: active, after: { ...frozen, frozen_by: actor.id, frozen_at: iso(ts) } }
          : { before: { ...frozen, frozen_at: iso(ts - int(2, 30) * HOUR) }, after: { ...active, verified_by: actor.id } },
        deny: ['Unfreeze needs a second approver from Risk'],
      }
    }
    case 'user.lock': {
      const target = String(opts.target ?? pick(staffIds))
      return {
        type: 'user',
        resource: `/iam/users/${target}`,
        summary: `Locked the account of ${staff[target]}`,
        attempt: `Tried to lock the account of ${staff[target]}`,
        change: {
          before: { user: target, status: 'active', sessions: Number(opts.sessions ?? int(1, 3)), locked_reason: null },
          after: { user: target, status: 'locked', sessions: 0, locked_reason: String(opts.reason ?? 'Suspicious sign-in pattern'), locked_by: actor.id },
        },
      }
    }
    case 'user.mfa_reset': {
      const target = String(opts.target ?? pick(staffIds))
      return {
        type: 'user',
        resource: `/iam/users/${target}/mfa`,
        summary: `Reset MFA for ${staff[target]}; a new hardware key is required`,
        attempt: `Tried to reset MFA for ${staff[target]}`,
        change: {
          before: { user: target, factors: [{ type: 'webauthn', label: 'Key 1', added: '2026-02-11' }], enrollment_required: false },
          after: { user: target, factors: [], enrollment_required: true, reset_by: actor.id },
        },
      }
    }
    case 'payment.approve':
    case 'payment.cancel': {
      const batch = String(opts.batch ?? `PAY-${ymd(ts)}-0${int(300, 499)}`)
      const amount = Number(opts.amount ?? int(40, 980) * 10_000_000)
      const transfers = Number(opts.transfers ?? int(12, 340))
      const creator = pick(['putri.maharani', 'hendra.wijaya', 'rina.kusuma'])
      const first = actor.id === 'yusuf.hakim' ? 'fajar.nugroho' : 'yusuf.hakim'
      const pending = { batch, amount_idr: amount, transfers, status: 'pending_approval', created_by: creator, approvals: [{ by: first }], required_approvals: 2 }
      const approve = action === 'payment.approve'
      return {
        type: 'payment',
        resource: `/payments/batches/${batch}`,
        summary: approve ? `Approved payout batch ${batch} (${idr(amount)})` : `Cancelled payout batch ${batch} (${idr(amount)})`,
        attempt: approve ? `Tried to approve payout batch ${batch} (${idr(amount)})` : `Tried to cancel payout batch ${batch}`,
        change: approve
          ? { before: pending, after: { ...pending, status: 'approved', approvals: [{ by: first }, { by: actor.id }] } }
          : { before: pending, after: { ...pending, status: 'cancelled', cancelled_by: actor.id } },
        deny: ["Amount is above the approver's limit of Rp 5.000.000.000", 'Approver also created a transfer in this batch'],
      }
    }
    case 'payment.release': {
      const batch = String(opts.batch ?? `PAY-${ymd(ts)}-0${int(300, 499)}`)
      const transfers = Number(opts.transfers ?? int(12, 340))
      return {
        type: 'payment',
        resource: `/payments/batches/${batch}`,
        summary: `Released batch ${batch} to the clearing switch (${transfers} transfers)`,
        attempt: `Could not release batch ${batch}`,
        change: {
          before: { batch, transfers, status: 'approved', released_at: null },
          after: { batch, transfers, status: 'released', released_at: iso(ts) },
        },
        error: ['Clearing switch answered 503; retry scheduled in 2 min'],
      }
    }
    case 'role.grant':
    case 'role.revoke': {
      const role = String(opts.role ?? pick(ROLES))
      const grant = action === 'role.grant'
      const holders = ROLE_MEMBERS[role]
      const target = String(opts.target ?? (grant ? pick(staffIds.filter((id) => !holders.includes(id))) : pick(holders)))
      const members = holders.filter((id) => id !== target)
      const withTarget = [...members, target].sort()
      const conflict = role === 'payments-approver' && ROLE_MEMBERS['payments-initiator'].includes(target)
      return {
        type: 'role',
        resource: `/iam/roles/${role}/members/${target}`,
        summary: grant ? `Granted ${role} to ${staff[target]}` : `Revoked ${role} from ${staff[target]}`,
        attempt: grant ? `Tried to grant ${role} to ${staff[target]}` : `Tried to revoke ${role} from ${staff[target]}`,
        change: grant
          ? { before: { role, members, expires: null }, after: { role, members: withTarget, expires: '2026-12-31' } }
          : { before: { role, members: withTarget }, after: { role, members } },
        deny: conflict
          ? [`Separation of duties: ${staff[target]} already holds payments-initiator (policy sod-payments)`]
          : ['Needs a second approver from Security', 'Grants outside the access request flow are blocked'],
      }
    }
    case 'key.create':
    case 'key.rotate':
    case 'key.revoke': {
      const owner = String(opts.owner ?? pick(KEY_OWNERS))
      const oldKey = `ak_live_${hex(4)}`
      const newKey = String(opts.key ?? `ak_live_${hex(4)}`)
      const scopes = owner === 'svc-payments-api' ? ['payments:write', 'switch:submit'] : ['ledger:read', 'reports:read']
      const created = iso(ts - int(60, 88) * DAY)
      const resource = `/iam/service-accounts/${owner}/keys/${action === 'key.create' ? newKey : oldKey}`
      if (action === 'key.create')
        return {
          type: 'api_key',
          resource,
          summary: `Created API key ${newKey} for ${owner}`,
          attempt: `Tried to create an API key for ${owner}`,
          change: { before: null, after: { key: newKey, owner, scopes, created_at: iso(ts), expires_at: iso(ts + 90 * DAY) } },
        }
      if (action === 'key.revoke')
        return {
          type: 'api_key',
          resource,
          summary: `Revoked API key ${oldKey} of ${owner}`,
          attempt: `Tried to revoke API key ${oldKey}`,
          change: { before: { key: oldKey, owner, status: 'active', created_at: created }, after: { key: oldKey, owner, status: 'revoked', revoked_by: actor.id } },
        }
      return {
        type: 'api_key',
        resource: `/iam/service-accounts/${owner}/keys/${newKey}`,
        summary: `Rotated the API key of ${owner}; ${oldKey} stays valid for 24 h`,
        attempt: `Key rotation for ${owner} failed`,
        change: {
          before: { key: oldKey, owner, scopes, created_at: created, expires_at: iso(ts + int(2, 20) * DAY), previous: null },
          after: { key: newKey, owner, scopes, created_at: iso(ts), expires_at: iso(ts + 90 * DAY), previous: { key: oldKey, valid_until: iso(ts + DAY) } },
        },
        error: ['Secret store write timed out; the old key is still active'],
      }
    }
    case 'policy.update': {
      const name = String(opts.policy ?? pick(['session-timeout-console', 'mfa-enforcement', 'ip-allowlist-console', 'change-window-prod', 'transfer-limits-retail']))
      return {
        type: 'policy',
        resource: `/policies/${name}`,
        summary: `Updated policy ${name}`,
        attempt: `Tried to update policy ${name}`,
        change: policyEdit(name, actor, ts),
        deny: ['Policy changes need approval from the CISO office'],
      }
    }
    case 'secret.read': {
      const path = String(opts.secret ?? pick(SECRETS))
      return {
        type: 'secret',
        resource: `/secrets/${path}`,
        summary: `Read secret ${path}`,
        attempt: `Tried to read secret ${path}`,
        params: { secret: path, version: int(4, 19), purpose: actor.kind === 'service' ? 'token refresh' : String(opts.ticket ?? ticket()) },
        deny: ['Outside the approved change window'],
      }
    }
    case 'secret.update': {
      const path = String(opts.secret ?? pick(SECRETS))
      const version = int(4, 19)
      return {
        type: 'secret',
        resource: `/secrets/${path}`,
        summary: `Wrote version ${version + 1} of secret ${path}`,
        attempt: `Tried to write secret ${path}`,
        change: {
          before: { secret: path, version, value: '••••••••', rotated_at: iso(ts - int(20, 80) * DAY) },
          after: { secret: path, version: version + 1, value: '••••••••', rotated_at: iso(ts) },
        },
      }
    }
    case 'db.session.start': {
      const host = String(opts.host ?? pick(DB_HOSTS))
      const t = String(opts.ticket ?? ticket())
      return {
        type: 'session',
        resource: `/db/${host}/sessions`,
        summary: `Opened a read-only database session on ${host} (${t})`,
        attempt: `Tried to open a database session on ${host}`,
        params: { host, mode: 'read_only', ticket: t, via: 'jump-01', max_minutes: 60 },
        deny: ['No approved change ticket for this host'],
      }
    }
    case 'report.export': {
      const [slug, what, items] = opts.report ? REPORTS.find((r) => r[0] === opts.report) ?? REPORTS[0] : pick(REPORTS)
      return {
        type: 'report',
        resource: `/reports/${slug}/export`,
        summary: `Exported the ${what} (${thousands(items)} items)`,
        attempt: `Export of the ${what} failed`,
        params: { report: slug, format: 'zip', items, watermark: actor.id },
        error: ['Export worker ran out of time; retry with a narrower range'],
      }
    }
    case 'ledger.reconcile': {
      const entries = Number(opts.entries ?? int(3200, 6400))
      const run = `rec-${ymd(ts)}-${new Date(ts).toISOString().slice(11, 13)}00`
      return {
        type: 'payment',
        resource: `/ledger/reconciliations/${run}`,
        summary: `Reconciled the ledger with the clearing switch: ${thousands(entries)} entries, 0 breaks`,
        attempt: 'Ledger reconciliation did not finish',
        params: { run, entries, breaks: 0, window: '3h' },
        error: ['Upstream timeout after 30 s (core-ledger-gw)'],
      }
    }
  }
}

/* ── Assembling events ───────────────────────────────────────────────────── */

const DENY_P: Partial<Record<Action, number>> = {
  'session.start': 0.03,
  'role.grant': 0.12,
  'payment.approve': 0.07,
  'db.session.start': 0.1,
  'secret.read': 0.04,
  'customer.update': 0.03,
  'account.unfreeze': 0.08,
  'policy.update': 0.05,
}
const ERROR_P: Partial<Record<Action, number>> = {
  'key.rotate': 0.06,
  'ledger.reconcile': 0.04,
  'payment.release': 0.03,
  'report.export': 0.03,
}

interface Spec {
  action: Action
  ts: number
  ip: string
  agent: string
  result?: Result
  reason?: string
  opts?: Record<string, string | number>
}

const all: AuditEvent[] = []

function emit(actor: Actor, source: Source, session: string, spec: Spec): AuditEvent {
  const built = build(spec.action, { actor, ts: spec.ts, source, session }, spec.opts)
  let result = spec.result
  if (!result) {
    if (built.deny && chance(DENY_P[spec.action] ?? 0.01)) result = 'denied'
    else if (built.error && chance(ERROR_P[spec.action] ?? 0)) result = 'error'
    else result = 'success'
  }
  const reason = result === 'success' ? undefined : (spec.reason ?? pick((result === 'denied' ? built.deny : built.error) ?? ['Refused']))
  const event: AuditEvent = {
    id: eventId(spec.ts),
    ts: spec.ts,
    actor,
    action: spec.action,
    type: built.type,
    resource: built.resource,
    ip: spec.ip,
    source,
    result,
    summary: result === 'success' ? built.summary : (built.attempt ?? built.summary),
    reason,
    session,
    request: requestId(),
    agent: spec.agent,
    region: actor.region,
    change: built.change,
    params: built.params,
  }
  all.push(event)
  return event
}

/* People: sessions of a sign-in, a few actions and usually a sign-out. */
const SOC: [Action, number][] = [['customer.view', 3], ['account.freeze', 0.8], ['user.lock', 0.15], ['user.mfa_reset', 0.3], ['account.unfreeze', 0.3]]
const PLAYBOOK: Record<string, [Action, number][]> = {
  'rizky.pratama': SOC,
  'ayu.lestari': SOC,
  'daniel.okafor': SOC,
  'mei.lin.tan': SOC,
  'bayu.saputra': SOC,
  'sofia.marques': SOC,
  'dewi.anggraini': [['policy.update', 1], ['report.export', 1]],
  'arjun.mehta': [['role.grant', 3], ['role.revoke', 2], ['user.mfa_reset', 0.6], ['policy.update', 0.3]],
  'nadia.rahman': [['report.export', 2], ['role.revoke', 1], ['role.grant', 0.5], ['policy.update', 0.3]],
  'kevin.halim': [['secret.read', 2], ['db.session.start', 1.5], ['key.rotate', 1], ['key.create', 0.4]],
  'tomas.ferreira': [['key.create', 1], ['key.rotate', 1], ['secret.read', 1], ['db.session.start', 0.5], ['key.revoke', 0.3]],
  'grace.liu': [['db.session.start', 2], ['secret.read', 1], ['report.export', 1]],
  'fajar.nugroho': [['payment.approve', 4], ['payment.cancel', 0.4], ['customer.view', 1]],
  'laras.wulandari': [['customer.view', 4], ['customer.update', 2], ['account.unfreeze', 0.4]],
  'yusuf.hakim': [['account.freeze', 1.2], ['customer.view', 2], ['payment.approve', 1], ['policy.update', 0.3]],
  'emma.schmidt': [['report.export', 1]],
}
const PRESENCE: [string, number][] = [
  ['rizky.pratama', 1.2],
  ['ayu.lestari', 1.2],
  ['daniel.okafor', 1.1],
  ['mei.lin.tan', 1],
  ['bayu.saputra', 1.1],
  ['sofia.marques', 0.9],
  ['dewi.anggraini', 0.3],
  ['arjun.mehta', 1],
  ['nadia.rahman', 0.6],
  ['kevin.halim', 0.9],
  ['tomas.ferreira', 0.8],
  ['grace.liu', 0.7],
  ['fajar.nugroho', 1.2],
  ['laras.wulandari', 1.5],
  ['yusuf.hakim', 0.8],
  ['emma.schmidt', 0.15],
]
const CLI_USERS: Record<string, number> = { 'kevin.halim': 0.55, 'tomas.ferreira': 0.5, 'grace.liu': 0.4 }
const SOC_IDS = new Set(['rizky.pratama', 'ayu.lestari', 'daniel.okafor', 'mei.lin.tan', 'bayu.saputra', 'sofia.marques'])

/** Background events stop an hour before now; the last hour is written by hand below. */
const QUIET_FROM = NOW - 62 * MIN
const gap = () => 8 * SECOND + Math.floor(rand() ** 2 * 5 * MIN) + int(0, 999)

function personSession(actorId: string, start: number) {
  const actor = byId[actorId]
  const cli = chance(CLI_USERS[actorId] ?? 0)
  const source: Source = cli ? 'cli' : 'console'
  const ip = cli ? JUMP_HOST : consoleIp(actor)
  const agent = cli ? CLI_AGENT : consoleAgent(actor)
  const session = sessionId()
  let ts = start
  const signIn = emit(actor, source, session, { action: 'session.start', ts, ip, agent })
  if (signIn.result !== 'success') return
  const count = actorId === 'emma.schmidt' ? int(1, 2) : weighted([[1, 2], [2, 4], [3, 3], [4, 2], [5, 1]] as const)
  const playbook = PLAYBOOK[actorId]
  for (let i = 0; i < count; i++) {
    ts += gap()
    if (ts > QUIET_FROM) return
    const action = weighted(playbook)
    // A database session needs the secret first: read it, then connect.
    if (action === 'db.session.start' && chance(0.5)) {
      const t = ticket()
      emit(actor, source, session, { action: 'secret.read', ts, ip, agent, opts: { secret: 'prod/ledger/db-password', ticket: t } })
      ts += gap()
      emit(actor, source, session, { action, ts, ip, agent, opts: { ticket: t } })
      continue
    }
    emit(actor, source, session, { action, ts, ip, agent })
  }
  ts += gap()
  if (ts < QUIET_FROM && chance(0.62)) emit(actor, source, session, { action: 'session.end', ts, ip, agent })
}

const ledger = byId['svc-ledger-sync']
const payments = byId['svc-payments-api']
const ci = byId['terraform-ci']

for (let d = 30; d >= 0; d--) {
  const dayStart = Date.UTC(2026, 10, 3) - d * DAY
  const weekday = new Date(dayStart).getUTCDay()
  const workday = weekday !== 0 && weekday !== 6

  // People. Office hours are 08:00–18:00 WIB (01:00–11:00 UTC); the SOC works around the clock.
  const sessions = workday ? int(16, 21) : int(4, 7)
  for (let s = 0; s < sessions; s++) {
    const id = weighted(PRESENCE)
    const soc = SOC_IDS.has(id)
    if (!workday && !soc && chance(0.7)) continue
    const hour = soc && chance(0.45) ? rand() * 24 : 1 + rand() * 10 + (chance(0.1) ? rand() * 3 : 0)
    const start = dayStart + Math.floor(hour * HOUR) + int(0, 59_999)
    if (start < NOW - 30 * DAY || start > QUIET_FROM) continue
    personSession(id, start)
  }

  // svc-ledger-sync reconciles every three hours.
  for (let h = 0; h < 24; h += 3) {
    const ts = dayStart + h * HOUR + int(2_000, 6_000)
    if (ts < NOW - 30 * DAY || ts > QUIET_FROM) continue
    const run = emit(ledger, 'system', sessionId(), { action: 'ledger.reconcile', ts, ip: '10.20.14.31', agent: SCHEDULER_AGENT })
    if (run.result === 'error') {
      const retry = ts + 5 * MIN + int(500, 3_000)
      if (retry < QUIET_FROM)
        emit(ledger, 'system', run.session, { action: 'ledger.reconcile', ts: retry, ip: '10.20.14.31', agent: SCHEDULER_AGENT, result: 'success' })
    }
  }

  // svc-payments-api refreshes its switch credentials every six hours and releases approved batches.
  for (let h = 0; h < 24; h += 6) {
    const ts = dayStart + h * HOUR + 15 * MIN + int(0, 4_000)
    if (ts < NOW - 30 * DAY || ts > QUIET_FROM) continue
    emit(payments, 'api', sessionId(), { action: 'secret.read', ts, ip: '10.20.7.18', agent: PAYMENTS_AGENT, opts: { secret: 'prod/payments/switch-client-key' } })
  }
  const releases = workday ? int(8, 12) : int(2, 3)
  for (let r = 0; r < releases; r++) {
    const ts = dayStart + Math.floor((1.2 + rand() * 9.5) * HOUR) + int(0, 59_999)
    if (ts < NOW - 30 * DAY || ts > QUIET_FROM) continue
    emit(payments, 'api', sessionId(), { action: 'payment.release', ts, ip: `10.20.7.${int(10, 40)}`, agent: PAYMENTS_AGENT })
  }

  // terraform-ci applies infrastructure changes on workdays.
  const runs = workday ? weighted([[0, 2], [1, 3], [2, 1]] as const) : 0
  for (let r = 0; r < runs; r++) {
    let ts = dayStart + Math.floor((2 + rand() * 8) * HOUR) + int(0, 59_999)
    const session = sessionId()
    const steps = int(1, 3)
    for (let k = 0; k < steps && ts > NOW - 30 * DAY && ts < QUIET_FROM; k++) {
      const action = weighted([['secret.update', 2], ['policy.update', 1], ['key.rotate', 1], ['role.grant', 0.4]] as const)
      emit(ci, 'api', session, { action, ts, ip: '10.40.2.15', agent: CI_AGENT })
      ts += int(3, 40) * SECOND + int(0, 999)
    }
  }
}

/* ── The last hour, by hand ──────────────────────────────────────────────── */

const at = (h: number, m: number, s: number, ms: number) => Date.UTC(2026, 10, 3, h, m, s, ms)
function scripted(actorId: string, source: Source, ip: string, agent: string, steps: Omit<Spec, 'ip' | 'agent'>[], session = sessionId()) {
  const actor = byId[actorId]
  for (const step of steps) emit(actor, source, session, { ...step, ip, agent })
  return session
}

const jkt = byId['rizky.pratama']

// Access review remediation: unused privileges come off.
scripted('arjun.mehta', 'console', '203.0.113.10', consoleAgent(byId['arjun.mehta']), [
  { action: 'session.start', ts: at(4, 29, 51, 6), result: 'success' },
  { action: 'role.revoke', ts: at(4, 31, 18, 402), result: 'success', opts: { role: 'prod-write', target: 'tomas.ferreira' } },
  { action: 'role.revoke', ts: at(4, 32, 40, 915), result: 'success', opts: { role: 'customer-pii-export', target: 'grace.liu' } },
  { action: 'session.end', ts: at(4, 44, 2, 330), result: 'success' },
])

// The external auditor takes the evidence pack.
scripted('emma.schmidt', 'console', '203.0.113.41', consoleAgent(byId['emma.schmidt']), [
  { action: 'session.start', ts: at(4, 46, 30, 144), result: 'success' },
  { action: 'report.export', ts: at(4, 48, 9, 771), result: 'success', opts: { report: 'access-review-q4-2026' } },
  { action: 'session.end', ts: at(4, 52, 17, 8), result: 'success' },
])

// The 05:00 reconciliation times out and the retry succeeds.
const recon = scripted('svc-ledger-sync', 'system', '10.20.14.31', SCHEDULER_AGENT, [
  { action: 'ledger.reconcile', ts: at(5, 0, 4, 221), result: 'error', reason: 'Upstream timeout after 30 s (core-ledger-gw)', opts: { entries: 4812 } },
])
scripted('svc-ledger-sync', 'system', '10.20.14.31', SCHEDULER_AGENT, [{ action: 'ledger.reconcile', ts: at(5, 5, 2, 618), result: 'success', opts: { entries: 4812 } }], recon)

// A payout batch gets its second approval and goes to the switch a second later.
scripted('fajar.nugroho', 'console', '203.0.113.11', consoleAgent(byId['fajar.nugroho']), [
  { action: 'session.start', ts: at(5, 1, 12, 90), result: 'success' },
  { action: 'payment.approve', ts: at(5, 3, 12, 640), result: 'success', opts: { batch: 'PAY-20261103-0412', amount: 4_820_000_000, transfers: 212 } },
])
scripted('svc-payments-api', 'api', '10.20.7.22', PAYMENTS_AGENT, [
  { action: 'payment.release', ts: at(5, 3, 13, 902), result: 'success', opts: { batch: 'PAY-20261103-0412', transfers: 212 } },
])

// Inside the Tuesday change window: break-glass read, then the payments key is rotated.
scripted('kevin.halim', 'cli', JUMP_HOST, CLI_AGENT, [
  { action: 'session.start', ts: at(5, 6, 44, 19), result: 'success' },
  { action: 'secret.read', ts: at(5, 7, 2, 117), result: 'success', opts: { secret: 'prod/ledger/db-password', ticket: 'CHG-4471' } },
  { action: 'db.session.start', ts: at(5, 7, 31, 552), result: 'success', opts: { host: 'pg-ledger-prod-01', ticket: 'CHG-4471' } },
  { action: 'key.rotate', ts: at(5, 12, 44, 218), result: 'success', opts: { owner: 'svc-payments-api', key: 'ak_live_2b71' } },
])

// Risk lowers the limit for transfers from a new device.
scripted('yusuf.hakim', 'console', '203.0.113.12', consoleAgent(byId['yusuf.hakim']), [
  { action: 'session.start', ts: at(5, 13, 5, 330), result: 'success' },
  { action: 'policy.update', ts: at(5, 14, 22, 310), result: 'success', opts: { policy: 'transfer-limits-retail' } },
  { action: 'account.freeze', ts: at(5, 16, 48, 77), result: 'success' },
])

// Support asks for approver rights for itself and is refused.
scripted('laras.wulandari', 'console', '203.0.113.10', consoleAgent(byId['laras.wulandari']), [
  { action: 'session.start', ts: at(5, 18, 2, 447), result: 'success' },
  { action: 'customer.view', ts: at(5, 18, 40, 129), result: 'success', opts: { customer: 'cus_7Q2M9X4K' } },
  { action: 'customer.update', ts: at(5, 19, 55, 613), result: 'success', opts: { customer: 'cus_7Q2M9X4K' } },
  {
    action: 'role.grant',
    ts: at(5, 21, 7, 482),
    result: 'denied',
    reason: 'Separation of duties: Laras Wulandari already holds payments-initiator (policy sod-payments)',
    opts: { role: 'payments-approver', target: 'laras.wulandari' },
  },
])

// Credential stuffing against one SOC analyst, then the shift lead locks the account.
scripted(
  'mei.lin.tan',
  'console',
  '192.0.2.66',
  'Console 2026.11.2 · unknown device',
  [
    { action: 'session.start', ts: at(5, 24, 10, 117), result: 'denied', reason: 'MFA challenge failed (attempt 1 of 3)' },
    { action: 'session.start', ts: at(5, 25, 33, 562), result: 'denied', reason: 'MFA challenge failed (attempt 2 of 3)' },
    { action: 'session.start', ts: at(5, 26, 51, 904), result: 'denied', reason: 'MFA challenge failed (attempt 3 of 3); address blocked for 1 h' },
  ],
  'ses_pre_auth_7x2kq',
)
scripted('rizky.pratama', 'console', '203.0.113.10', consoleAgent(jkt), [
  { action: 'session.start', ts: at(5, 23, 58, 200), result: 'success' },
  {
    action: 'user.lock',
    ts: at(5, 27, 40, 336),
    result: 'success',
    opts: { target: 'mei.lin.tan', sessions: 2, reason: 'Credential stuffing from 192.0.2.66 · SOC-2026-1187' },
  },
  { action: 'user.mfa_reset', ts: at(5, 28, 55, 712), result: 'success', opts: { target: 'mei.lin.tan' } },
])

// Earlier this morning: the CISO extends MFA enforcement to contractors.
scripted('dewi.anggraini', 'console', '203.0.113.10', consoleAgent(byId['dewi.anggraini']), [
  { action: 'session.start', ts: at(3, 9, 47, 512), result: 'success' },
  { action: 'policy.update', ts: at(3, 12, 6, 905), result: 'success', opts: { policy: 'mfa-enforcement' } },
  { action: 'session.end', ts: at(3, 20, 31, 77), result: 'success' },
])

/** Every event, newest first. */
export const events: AuditEvent[] = all.filter((e) => e.ts <= NOW && e.ts > NOW - 30 * DAY).sort((a, b) => b.ts - a.ts)

export const actionOptions = ACTIONS.filter((a) => events.some((e) => e.action === a))

/* ── Time ranges and the histogram buckets that go with them ─────────────── */

export type RangeKey = '1h' | '24h' | '7d' | '30d'

const pad = (n: number) => String(n).padStart(2, '0')
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const clock = (ms: number) => {
  const d = new Date(ms)
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
}
export const dayMonth = (ms: number) => {
  const d = new Date(ms)
  return `${pad(d.getUTCDate())} ${MONTHS[d.getUTCMonth()]}`
}

export const RANGES: Record<RangeKey, { label: string; span: number; bucket: number; unit: string; tick: (start: number) => string }> = {
  '1h': { label: 'last hour', span: HOUR, bucket: 5 * MIN, unit: 'per 5 minutes', tick: clock },
  '24h': { label: 'last 24 hours', span: DAY, bucket: HOUR, unit: 'per hour', tick: clock },
  '7d': { label: 'last 7 days', span: 7 * DAY, bucket: DAY, unit: 'per day', tick: (start) => dayMonth(start + DAY) },
  '30d': { label: 'last 30 days', span: 30 * DAY, bucket: DAY, unit: 'per day', tick: (start) => dayMonth(start + DAY) },
}

/* ── Formatting ──────────────────────────────────────────────────────────── */

/** "05:12:44.218" */
export function stamp(ms: number) {
  const d = new Date(ms)
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}.${String(d.getUTCMilliseconds()).padStart(3, '0')}`
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
/** "Tue 03 Nov 2026 · 05:12:44.218 UTC · 12:12:44 WIB" */
export function longStamp(ms: number) {
  const d = new Date(ms)
  const wib = new Date(ms + 7 * HOUR)
  return `${WEEKDAYS[d.getUTCDay()]} ${dayMonth(ms)} ${d.getUTCFullYear()} · ${stamp(ms)} UTC · ${pad(wib.getUTCHours())}:${pad(wib.getUTCMinutes())}:${pad(wib.getUTCSeconds())} WIB`
}

/** Where an address comes from, as the log enriches it. */
export function network(ip: string) {
  if (ip === JUMP_HOST) return 'jump-01 · bastion, JKT-1'
  if (ip.startsWith('10.8.')) return 'Staff VPN pool · AS64600 Selaras Bank'
  if (ip.startsWith('10.20.')) return 'Production cluster · JKT-1'
  if (ip.startsWith('10.40.')) return 'CI runners · JKT-1'
  if (ip.startsWith('203.0.113.4')) return 'Singapore office · AS64600 Selaras Bank'
  if (ip.startsWith('203.0.113.')) return 'Jakarta office · AS64600 Selaras Bank'
  if (ip.startsWith('192.0.2.')) return 'Not seen before · AS65021 Lumbra Hosting'
  return 'Residential · AS64788 Larik Net'
}
