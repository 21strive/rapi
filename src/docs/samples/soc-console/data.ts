/**
 * Sample 07 · Security operations at Selaras Bank (invented). Everything on the screen comes from
 * here. Alert times are offsets from the moment the page opens, so the queue, the live clock and
 * the event-rate chart always agree with each other.
 */
import type { StatusTone, TimelineItem } from '@/design-system'

/* ── Helpers ───────────────────────────────────────────────────────────────────────── */

/** Small deterministic PRNG (mulberry32), so generated data is the same on every load. */
export function seeded(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const pad = (n: number) => String(n).padStart(2, '0')
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "05:21:44" in UTC. */
export const clockUtc = (ms: number) => {
  const d = new Date(ms)
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
}

/** "05:21" in UTC. */
export const hourMinuteUtc = (ms: number) => {
  const d = new Date(ms)
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
}

/** "Tue 03 Nov 2026" in UTC. */
export const dateUtc = (ms: number) => {
  const d = new Date(ms)
  return `${DAYS[d.getUTCDay()]} ${pad(d.getUTCDate())} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

/** "00:04:12" under a day, "1d 04:12" past it. */
export function duration(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  return d ? `${d}d ${pad(h)}:${pad(m)}` : `${pad(h)}:${pad(m)}:${pad(s % 60)}`
}

/** ISO week number of a UTC timestamp. */
export function isoWeek(ms: number) {
  const d = new Date(ms)
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const day = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - day)
  const yearStart = Date.UTC(date.getUTCFullYear(), 0, 1)
  return Math.ceil(((date.getTime() - yearStart) / 86400000 + 1) / 7)
}

/** The analyst looking at the screen: the shift lead. */
export const me = 'Rizky Pratama'

/** Analysts on shift. Workload bars and assignee avatars use these names. */
export const analysts = ['Rizky Pratama', 'Ayu Lestari', 'Daniel Okafor', 'Mei Lin Tan', 'Bayu Saputra', 'Sofia Marques']

/** Day shifts follow Jakarta time. */
export function shiftOf(ms: number) {
  const wib = (new Date(ms).getUTCHours() + 7) % 24
  if (wib >= 7 && wib < 15) return { name: 'Shift A', hours: '07:00–15:00 WIB' }
  if (wib >= 15 && wib < 23) return { name: 'Shift B', hours: '15:00–23:00 WIB' }
  return { name: 'Shift C', hours: '23:00–07:00 WIB' }
}

/* ── Vocabulary ────────────────────────────────────────────────────────────────────── */

export type Severity = 'critical' | 'high' | 'medium' | 'low'
export const severities: Severity[] = ['critical', 'high', 'medium', 'low']

export const severityMeta: Record<
  Severity,
  { label: string; short: string; tone: StatusTone; badge: 'solid' | 'soft' | 'outline'; rank: number }
> = {
  critical: { label: 'Critical', short: 'Crit', tone: 'danger', badge: 'solid', rank: 4 },
  high: { label: 'High', short: 'High', tone: 'warning', badge: 'soft', rank: 3 },
  medium: { label: 'Medium', short: 'Med', tone: 'neutral', badge: 'soft', rank: 2 },
  low: { label: 'Low', short: 'Low', tone: 'neutral', badge: 'outline', rank: 1 },
}

export type AlertStatus = 'new' | 'ack' | 'escalated'
export const statusMeta: Record<AlertStatus, { label: string; tone: StatusTone }> = {
  new: { label: 'New', tone: 'signal' },
  ack: { label: 'Ack', tone: 'brand' },
  escalated: { label: 'Escalated', tone: 'danger' },
}

export const tactics = [
  { code: 'INIT', name: 'Initial access' },
  { code: 'EXEC', name: 'Execution' },
  { code: 'PERS', name: 'Persistence' },
  { code: 'PRIV', name: 'Privilege escalation' },
  { code: 'EVADE', name: 'Defense evasion' },
  { code: 'CRED', name: 'Credential access' },
  { code: 'DISC', name: 'Discovery' },
  { code: 'LAT', name: 'Lateral movement' },
  { code: 'COLL', name: 'Collection' },
  { code: 'C2', name: 'Command and control' },
  { code: 'EXFIL', name: 'Exfiltration' },
  { code: 'IMPACT', name: 'Impact' },
] as const
export type Tactic = (typeof tactics)[number]['code']
export const tacticName = (code: Tactic) => tactics.find((t) => t.code === code)?.name ?? code

/* ── Log sources (the live lamps) ──────────────────────────────────────────────────── */

export type SourceId = 'edr' | 'ndr' | 'idp' | 'waf' | 'cloud' | 'mail' | 'core'
export type SourceState = 'nominal' | 'degraded' | 'silent'

export interface LogSource {
  id: SourceId
  name: string
  detail: string
  /** Events per second at page open. The total is the ingest figure on the screen. */
  eps: number
  state: SourceState
  /** Seconds since the last event at page open. */
  lastEvent: number
}

export const sources: LogSource[] = [
  { id: 'edr', name: 'Endpoint sensors', detail: '2,140 agents', eps: 412, state: 'nominal', lastEvent: 1 },
  { id: 'ndr', name: 'Network sensors', detail: '14 taps · JKT, SIN', eps: 388, state: 'nominal', lastEvent: 1 },
  { id: 'waf', name: 'Edge firewall', detail: 'selaras.id', eps: 241, state: 'nominal', lastEvent: 1 },
  { id: 'cloud', name: 'Cloud audit', detail: 'prod + staging', eps: 135, state: 'nominal', lastEvent: 2 },
  { id: 'idp', name: 'Identity provider', detail: 'SSO + MFA', eps: 96, state: 'nominal', lastEvent: 1 },
  { id: 'mail', name: 'Mail gateway', detail: 'Inbound + outbound', eps: 12, state: 'degraded', lastEvent: 247 },
  { id: 'core', name: 'Core banking audit', detail: 'core-audit-01', eps: 0, state: 'silent', lastEvent: 1080 },
]

export const sourceName = (id: SourceId) => sources.find((s) => s.id === id)?.name ?? id

export const sourceStateMeta: Record<SourceState, { label: string; tone: StatusTone }> = {
  nominal: { label: 'Nominal', tone: 'success' },
  degraded: { label: 'Degraded', tone: 'warning' },
  silent: { label: 'Silent', tone: 'danger' },
}

/** Events per second the pipeline is licensed and sized for; above this the SIEM queues. */
export const EPS_THRESHOLD = 1800

/* ── Rules and alerts ──────────────────────────────────────────────────────────────── */

type EntityKind = 'host' | 'user' | 'ip' | 'service'

/** One step of what happened, `at` seconds before the alert fired (negative: after it). */
interface Step {
  at: number
  title: string
  body?: string
  tone?: StatusTone
}

export interface Rule {
  id: string
  name: string
  severity: Severity
  source: SourceId
  tactic: Tactic
  kind: EntityKind
  steps: (a: AlertSeed) => Step[]
  fields: (a: AlertSeed) => Record<string, unknown>
}

export interface AlertSeed {
  rule: Rule
  entity: string
  /** Seconds since the alert fired, at page open. */
  age: number
  status: AlertStatus
  assignee: string | null
  events: number
  /** Seconds after firing when the assignee acknowledged it, for alerts acknowledged before the page opened. */
  ackAfter?: number
}

export interface Alert extends AlertSeed {
  id: string
}

const raised = (a: AlertSeed, what: string): Step => ({
  at: 0,
  title: 'Alert raised',
  body: `Rule ${a.rule.id} matched ${a.events} ${a.events === 1 ? 'event' : 'events'}. ${what}`,
  tone: severityMeta[a.rule.severity].tone === 'neutral' ? 'brand' : severityMeta[a.rule.severity].tone,
})

const RULES = {
  credStore: {
    id: 'R-1001',
    name: 'Credential store read by unsigned process',
    severity: 'critical',
    source: 'edr',
    tactic: 'CRED',
    kind: 'host',
    steps: (a) => [
      { at: 412, title: 'HTML attachment opened', body: 'invoice_Q4_2026.html from an external sender seen for the first time today.' },
      { at: 380, title: 'Script host started by the mail client', body: 'Command line is base64-encoded, 2,048 characters.' },
      { at: 361, title: 'Unsigned binary written', body: 'svchelper.exe, first seen on 1 of 2,140 hosts in the fleet.' },
      { at: 60, title: 'Protected memory read', body: 'svchelper.exe opened the local credential service with read access.' },
      raised(a, 'Credential theft on a finance workstation.'),
    ],
    fields: (a) => ({
      host: { name: a.entity, ip: '10.20.4.12', owner: 'h.wijaya', department: 'Finance' },
      process: {
        name: 'svchelper.exe',
        sha256: '9f2c4e81d07b3a6c5e1f8d2a4b6c9e0f1a3d5c7b9e2f4a6c8d0b1e3f5a7c9d24',
        signed: false,
        parent: 'mailclient.exe',
      },
      target: 'credential-service',
      access: 'read',
    }),
  },
  travel: {
    id: 'R-1007',
    name: 'Impossible travel for a privileged user',
    severity: 'critical',
    source: 'idp',
    tactic: 'INIT',
    kind: 'user',
    steps: (a) => [
      { at: 1260, title: 'Sign-in from Jakarta', body: '10.20.8.31 on the office network, MFA push approved.' },
      { at: 420, title: 'Sign-in from 203.0.113.88', body: 'Geolocated to São Paulo, 15,700 km away, 14 min later.' },
      { at: 400, title: 'MFA approved on the enrolled phone', body: 'Approved 20 s after the prompt.' },
      raised(a, 'Travel speed of 67,286 km/h against a 1,000 km/h limit.'),
    ],
    fields: (a) => ({
      user: { id: a.entity, display: 'Arjun Mehta', groups: ['iam-admins', 'break-glass'] },
      sign_ins: [
        { ip: '10.20.8.31', geo: 'Jakarta, ID', mfa: 'push' },
        { ip: '203.0.113.88', geo: 'São Paulo, BR', asn: 'AS64871 Kumulus Hosting', mfa: 'push' },
      ],
      distance_km: 15700,
      speed_kmh: 67286,
    }),
  },
  silent: {
    id: 'R-1013',
    name: 'Log source silent: core banking audit',
    severity: 'critical',
    source: 'core',
    tactic: 'EVADE',
    kind: 'service',
    steps: (a) => [
      { at: 900, title: 'Last event received', body: 'core-audit-01 sent 1,912 events in its final minute.' },
      { at: 540, title: 'Forwarder heartbeat missed', body: 'fwd-jkt-03 missed 3 heartbeats in a row.' },
      raised(a, 'Silent for 15 min, the limit for tier-1 log sources.'),
    ],
    fields: (a) => ({
      source: { id: a.entity, tier: 1, forwarder: 'fwd-jkt-03' },
      expected_eps: 30,
      observed_eps: 0,
      silent_for_s: 900,
    }),
  },
  bruteForce: {
    id: 'R-1021',
    name: 'Brute force against the VPN gateway',
    severity: 'high',
    source: 'idp',
    tactic: 'CRED',
    kind: 'host',
    steps: (a) => [
      { at: 300, title: 'Failed sign-ins begin', body: '203.0.113.47 tries 61 accounts, 412 attempts in 5 min.' },
      { at: 120, title: 'Ingest above threshold', body: 'Event rate crossed 1,800 EPS on the identity pipeline.' },
      raised(a, 'More than 200 failures from one source in 5 min.'),
      { at: -95, title: 'Source blocked at the edge', body: 'Firewall rule 1040 added for 203.0.113.47.', tone: 'success' },
    ],
    fields: (a) => ({
      target: a.entity,
      src: { ip: '203.0.113.47', asn: 'AS64871 Kumulus Hosting', geo: 'NL' },
      attempts: 412,
      accounts_tried: 61,
      successes: 0,
    }),
  },
  roleGrant: {
    id: 'R-1024',
    name: 'Admin role granted outside a change window',
    severity: 'high',
    source: 'cloud',
    tactic: 'PRIV',
    kind: 'user',
    steps: (a) => [
      { at: 60, title: 'Role binding created', body: `prod-admin granted to ${a.entity} by terraform-ci, pipeline run 8812.` },
      { at: 30, title: 'No change ticket found', body: 'No approved change covers production IAM at this time.' },
      raised(a, 'Privileged grant without an approved change.'),
    ],
    fields: (a) => ({ actor: 'terraform-ci', target_user: a.entity, role: 'prod-admin', pipeline_run: 8812, change_ticket: null }),
  },
  exfil: {
    id: 'R-1030',
    name: 'Large outbound transfer to a rare destination',
    severity: 'high',
    source: 'ndr',
    tactic: 'EXFIL',
    kind: 'host',
    steps: (a) => [
      { at: 900, title: 'Connection opened', body: `${a.entity} to 198.51.100.23:443, never seen before.` },
      { at: 300, title: 'Transfer passes 1 GB', body: 'Sustained 9.6 MB/s for 4 min.' },
      raised(a, '2.4 GB out in 15 min; the baseline for this host is 40 MB.'),
      { at: -600, title: 'Escalated to IR-2026-0146', body: 'Daniel Okafor opened an incident with the database team.', tone: 'danger' },
    ],
    fields: (a) => ({
      src: { host: a.entity, ip: '10.30.1.11' },
      dst: { ip: '198.51.100.23', port: 443, asn: 'AS65102 Lintang Transit', first_seen: true },
      bytes_out: 2576980378,
      duration_s: 900,
    }),
  },
  encoded: {
    id: 'R-1033',
    name: 'Encoded script execution',
    severity: 'high',
    source: 'edr',
    tactic: 'EXEC',
    kind: 'host',
    steps: (a) => [
      { at: 95, title: 'Script host started', body: 'Command line is base64-encoded, 2,048 characters.' },
      { at: 40, title: 'Payload fetched', body: 'A 41 KB file downloaded from 192.0.2.140.' },
      raised(a, 'Encoded command followed by a download.'),
    ],
    fields: (a) => ({
      host: { name: a.entity, ip: '10.40.2.13', owner: 'm.chen' },
      process: { name: 'scripthost', args_length: 2048, encoded: true },
      network: { dst: '192.0.2.140', bytes_in: 41984 },
    }),
  },
  phish: {
    id: 'R-1036',
    name: 'Phishing link clicked',
    severity: 'high',
    source: 'mail',
    tactic: 'INIT',
    kind: 'user',
    steps: (a) => [
      { at: 610, title: 'Message delivered', body: 'Subject “Settlement report”, from the look-alike domain selaras-id.net.' },
      { at: 75, title: 'Link opened on mac-jkt-0331', body: 'The page asked for SSO credentials.' },
      raised(a, 'No password was submitted.'),
    ],
    fields: (a) => ({
      user: a.entity,
      sender: 'settlement@selaras-id.net',
      url: 'https://selaras-id.net/sso/login',
      clicked_from: 'mac-jkt-0331',
      credentials_submitted: false,
    }),
  },
  svcInteractive: {
    id: 'R-1040',
    name: 'Service account used interactively',
    severity: 'high',
    source: 'idp',
    tactic: 'PRIV',
    kind: 'service',
    steps: (a) => [
      { at: 140, title: 'Interactive sign-in on jump-01', body: `${a.entity} opened a shell from 10.20.8.77.` },
      { at: 20, title: 'Privilege change', body: 'Switched to root on jump-01.' },
      raised(a, 'Service accounts never sign in interactively.'),
    ],
    fields: (a) => ({ account: a.entity, host: 'jump-01', src_ip: '10.20.8.77', session: 'tty/3', commands: 14 }),
  },
  webShell: {
    id: 'R-1044',
    name: 'Web shell pattern in an upload',
    severity: 'high',
    source: 'waf',
    tactic: 'PERS',
    kind: 'host',
    steps: (a) => [
      { at: 4, title: 'Upload received', body: 'POST /v2/kyc/documents, 18 KB, declared as image/jpeg.' },
      { at: 3, title: 'Script found in the image body', body: 'Script tags and an eval call after the JPEG header.' },
      { at: 2, title: 'Blocked at the edge', body: 'Answered 403 by firewall rule 1012.', tone: 'success' },
      raised(a, 'Upload blocked; checking for earlier uploads from the same source.'),
    ],
    fields: (a) => ({
      request: { method: 'POST', host: 'api.selaras.id', path: '/v2/kyc/documents', src_ip: '198.51.100.61', bytes: 18432 },
      upstream: a.entity,
      firewall: { rule: 1012, action: 'block' },
    }),
  },
  containerShell: {
    id: 'R-1047',
    name: 'Interactive shell into a production container',
    severity: 'high',
    source: 'cloud',
    tactic: 'EXEC',
    kind: 'service',
    steps: (a) => [
      { at: 30, title: 'Exec session opened', body: `k.halim opened a shell in ${a.entity}, namespace payments.` },
      { at: 10, title: 'Change ticket found', body: 'CHG-4471 covers a hotfix on payments-api today.' },
      raised(a, 'Allowed by change; review the commands.'),
    ],
    fields: (a) => ({ actor: 'k.halim', workload: a.entity, namespace: 'payments', change: 'CHG-4471', commands: 9 }),
  },
  mfaFatigue: {
    id: 'R-1050',
    name: 'MFA fatigue: repeated push denials',
    severity: 'high',
    source: 'idp',
    tactic: 'CRED',
    kind: 'user',
    steps: (a) => [
      { at: 360, title: 'Push prompts start', body: `14 prompts in 6 min to ${a.entity}’s enrolled phone.` },
      { at: 15, title: '13 denied, 1 timed out', body: 'No prompt has been approved.' },
      raised(a, 'The password is probably known to someone else.'),
    ],
    fields: (a) => ({ user: a.entity, prompts: 14, denied: 13, approved: 0, src_ip: '198.51.100.19' }),
  },
  edrOff: {
    id: 'R-1052',
    name: 'Endpoint protection disabled',
    severity: 'high',
    source: 'edr',
    tactic: 'EVADE',
    kind: 'host',
    steps: (a) => [
      { at: 50, title: 'Sensor service stopped', body: 'Stopped by a local administrator account.' },
      { at: 5, title: 'Tamper check failed', body: 'No uninstall token was used.' },
      raised(a, 'The host is not reporting.'),
    ],
    fields: (a) => ({ host: a.entity, sensor: 'stopped', actor: 'local-admin', uninstall_token: false }),
  },
  approvals: {
    id: 'R-1055',
    name: 'Unusual payment approval volume',
    severity: 'high',
    source: 'core',
    tactic: 'IMPACT',
    kind: 'user',
    steps: (a) => [
      { at: 600, title: 'Approvals start', body: '38 outgoing payments approved in 10 min, Rp 4.812.500.000 in total.' },
      { at: 30, title: 'Baseline exceeded', body: 'Fajar Nugroho approves 6 payments in a typical hour.' },
      raised(a, 'Approval volume 6× the user’s baseline.'),
      { at: -900, title: 'Escalated to IR-2026-0145', body: 'Fraud desk paged; the payments are held for review.', tone: 'danger' },
    ],
    fields: (a) => ({ user: a.entity, approvals: 38, amount_idr: 4812500000, window_min: 10, held: true }),
  },
  portScan: {
    id: 'R-2010',
    name: 'Port scan from an internal host',
    severity: 'medium',
    source: 'ndr',
    tactic: 'DISC',
    kind: 'host',
    steps: (a) => [
      { at: 180, title: 'Connection fan-out', body: `${a.entity} touched 1,024 ports on 37 hosts in 3 min.` },
      raised(a, 'Internal scanning outside the vulnerability-scan window.'),
    ],
    fields: (a) => ({ host: a.entity, ports: 1024, targets: 37, window_s: 180 }),
  },
  newCountry: {
    id: 'R-2014',
    name: 'Sign-in from a new country',
    severity: 'medium',
    source: 'idp',
    tactic: 'INIT',
    kind: 'user',
    steps: (a) => [
      { at: 5, title: 'Sign-in from 198.51.100.203', body: 'Geolocated to Kuala Lumpur, first time for this user.' },
      raised(a, 'MFA was approved on the enrolled phone.'),
    ],
    fields: (a) => ({ user: a.entity, ip: '198.51.100.203', geo: 'Kuala Lumpur, MY', mfa: 'push' }),
  },
  deniedRecords: {
    id: 'R-2019',
    name: 'Repeated access denied to customer records',
    severity: 'medium',
    source: 'cloud',
    tactic: 'DISC',
    kind: 'user',
    steps: (a) => [
      { at: 600, title: 'Denied reads begin', body: `${a.entity} was denied 26 customer records in 10 min.` },
      raised(a, 'Looks like browsing outside the user’s portfolio.'),
    ],
    fields: (a) => ({ user: a.entity, denied: 26, window_min: 10, resource: 'customers/*' }),
  },
  unsigned: {
    id: 'R-2023',
    name: 'Unsigned binary executed',
    severity: 'medium',
    source: 'edr',
    tactic: 'EXEC',
    kind: 'host',
    steps: (a) => [
      { at: 2, title: 'Process started', body: 'toolbox-portable.exe from the downloads folder, unsigned.' },
      raised(a, 'Not on the software allowlist.'),
    ],
    fields: (a) => ({ host: a.entity, process: 'toolbox-portable.exe', signed: false, path: 'Downloads' }),
  },
  newDomain: {
    id: 'R-2027',
    name: 'DNS query to a newly registered domain',
    severity: 'medium',
    source: 'ndr',
    tactic: 'C2',
    kind: 'host',
    steps: (a) => [
      { at: 1, title: 'Query resolved', body: 'cdn-sync-update.net, registered 3 days ago.' },
      raised(a, 'Beacon-like interval of 60 s.'),
    ],
    fields: (a) => ({ host: a.entity, query: 'cdn-sync-update.net', domain_age_days: 3, interval_s: 60 }),
  },
  bulkDownload: {
    id: 'R-2031',
    name: 'Bulk download from the document store',
    severity: 'medium',
    source: 'cloud',
    tactic: 'COLL',
    kind: 'user',
    steps: (a) => [
      { at: 420, title: 'Downloads begin', body: `${a.entity} downloaded 312 files, 1.9 GB, in 7 min.` },
      raised(a, 'Ten times the user’s daily volume.'),
    ],
    fields: (a) => ({ user: a.entity, files: 312, bytes: 2040109466, store: 'docs-finance' }),
  },
  spray: {
    id: 'R-3002',
    name: 'Password spray below threshold',
    severity: 'low',
    source: 'idp',
    tactic: 'CRED',
    kind: 'ip',
    steps: (a) => [
      { at: 3600, title: 'Slow failures', body: `${a.entity} tried 9 accounts once each over an hour.` },
      raised(a, 'Below the brute-force threshold; watching.'),
    ],
    fields: (a) => ({ src_ip: a.entity, accounts: 9, attempts: 9, window_min: 60 }),
  },
  usb: {
    id: 'R-3011',
    name: 'USB storage mounted',
    severity: 'low',
    source: 'edr',
    tactic: 'EXFIL',
    kind: 'host',
    steps: (a) => [
      { at: 1, title: 'Device mounted', body: '64 GB removable drive, read-write.' },
      raised(a, 'Policy allows read-only for this group.'),
    ],
    fields: (a) => ({ host: a.entity, device: 'usb-storage', size_gb: 64, mode: 'rw' }),
  },
  geoBlock: {
    id: 'R-3015',
    name: 'Geo-blocked request burst',
    severity: 'low',
    source: 'waf',
    tactic: 'INIT',
    kind: 'ip',
    steps: (a) => [
      { at: 120, title: 'Requests blocked', body: `${a.entity} sent 640 requests to login.selaras.id, all blocked.` },
      raised(a, 'Blocked by the country rule; no action needed unless it repeats.'),
    ],
    fields: (a) => ({ src_ip: a.entity, host: 'login.selaras.id', requests: 640, action: 'block' }),
  },
  localAdmin: {
    id: 'R-3019',
    name: 'Local admin group changed',
    severity: 'low',
    source: 'edr',
    tactic: 'PERS',
    kind: 'host',
    steps: (a) => [
      { at: 1, title: 'Group membership changed', body: 'A local account was added to Administrators.' },
      raised(a, 'Check for an IT ticket.'),
    ],
    fields: (a) => ({ host: a.entity, group: 'Administrators', change: 'add' }),
  },
  tokenReuse: {
    id: 'R-3024',
    name: 'Session token reused from another host',
    severity: 'low',
    source: 'idp',
    tactic: 'LAT',
    kind: 'user',
    steps: (a) => [
      { at: 30, title: 'Token presented from a second IP', body: 'Same session from 10.20.4.88 and 10.20.6.14.' },
      raised(a, 'Often a docking station switch; sometimes not.'),
    ],
    fields: (a) => ({ user: a.entity, ips: ['10.20.4.88', '10.20.6.14'], session_age_min: 42 }),
  },
} satisfies Record<string, Rule>

/* The open queue: 3 critical and 11 high written by hand, the rest generated. */
const HAND: AlertSeed[] = [
  { rule: RULES.credStore, entity: 'ws-jkt-0412', age: 401, status: 'new', assignee: null, events: 37 },
  { rule: RULES.travel, entity: 'a.mehta', age: 680, status: 'ack', assignee: 'Ayu Lestari', events: 3, ackAfter: 150 },
  { rule: RULES.silent, entity: 'core-audit-01', age: 182, status: 'new', assignee: null, events: 1 },
  { rule: RULES.bruteForce, entity: 'vpn-gw-02', age: 1480, status: 'ack', assignee: 'Bayu Saputra', events: 412, ackAfter: 180 },
  { rule: RULES.roleGrant, entity: 't.ferreira', age: 2535, status: 'new', assignee: null, events: 2 },
  { rule: RULES.exfil, entity: 'pg-ledger-prod-01', age: 4360, status: 'escalated', assignee: 'Daniel Okafor', events: 1 },
  { rule: RULES.encoded, entity: 'ws-sg-0213', age: 1085, status: 'new', assignee: null, events: 4 },
  { rule: RULES.phish, entity: 'l.wulandari', age: 2030, status: 'ack', assignee: 'Mei Lin Tan', events: 2, ackAfter: 240 },
  { rule: RULES.svcInteractive, entity: 'svc-ledger-sync', age: 7512, status: 'ack', assignee: 'Sofia Marques', events: 16, ackAfter: 420 },
  { rule: RULES.webShell, entity: 'api-gw-prod-03', age: 3150, status: 'new', assignee: null, events: 1 },
  { rule: RULES.containerShell, entity: 'payments-api-7f9c', age: 5468, status: 'ack', assignee: 'Rizky Pratama', events: 9, ackAfter: 300 },
  { rule: RULES.mfaFatigue, entity: 'g.liu', age: 558, status: 'new', assignee: null, events: 14 },
  { rule: RULES.edrOff, entity: 'mac-sg-0087', age: 7124, status: 'ack', assignee: 'Daniel Okafor', events: 2, ackAfter: 600 },
  { rule: RULES.approvals, entity: 'f.nugroho', age: 9610, status: 'escalated', assignee: 'Ayu Lestari', events: 38 },
]

const HOSTS = [
  'ws-jkt-0118', 'ws-jkt-0233', 'ws-jkt-0587', 'ws-jkt-0702', 'ws-sg-0230', 'ws-sg-0145', 'mac-jkt-0331',
  'mac-sg-0112', 'k8s-prod-node-09', 'k8s-prod-node-14', 'jump-01', 'mail-relay-01', 'build-runner-04',
]
const USERS = [
  'h.wijaya', 'p.maharani', 's.rahayu', 'm.chen', 'r.siregar', 'n.putri', 'j.tanaka', 'a.kowalski',
  'y.hakim', 'k.halim', 'i.santoso', 'o.adeyemi',
]
const IPS = ['203.0.113.12', '203.0.113.91', '203.0.113.156', '198.51.100.44', '198.51.100.172', '192.0.2.77', '192.0.2.201']

function generate(): AlertSeed[] {
  const rand = seeded(20261103)
  const pick = <T,>(list: T[]) => list[Math.floor(rand() * list.length)]
  const entityFor = (rule: Rule) => (rule.kind === 'host' ? pick(HOSTS) : rule.kind === 'user' ? pick(USERS) : pick(IPS))
  const plan: [Rule[], number, [number, number], number][] = [
    // rules, count, age range in seconds, share acknowledged
    [[RULES.portScan, RULES.newCountry, RULES.deniedRecords, RULES.unsigned, RULES.newDomain, RULES.bulkDownload], 26, [1200, 32400], 0.4],
    [[RULES.spray, RULES.usb, RULES.geoBlock, RULES.localAdmin, RULES.tokenReuse], 41, [3600, 108000], 0.2],
  ]
  const out: AlertSeed[] = []
  for (const [rules, count, [lo, hi], ackShare] of plan) {
    for (let i = 0; i < count; i++) {
      const rule = rules[i % rules.length]
      const acked = rand() < ackShare
      const routed = !acked && rand() < 0.25
      const age = Math.round(lo + rand() * (hi - lo))
      out.push({
        rule,
        entity: entityFor(rule),
        age,
        status: acked ? 'ack' : 'new',
        assignee: acked || routed ? pick(analysts.slice(1)) : null,
        events: 1 + Math.floor(rand() * (rule.severity === 'medium' ? 40 : 12)),
        ackAfter: acked ? Math.round(60 + rand() * Math.min(age - 60, 1500)) : undefined,
      })
    }
  }
  return out
}

/** Every open alert, oldest first, numbered in the order they fired. */
export const initialAlerts: Alert[] = [...HAND, ...generate()]
  .sort((a, b) => b.age - a.age)
  .map((seed, i) => ({ ...seed, id: `AL-26-0${4331 + i}` }))

/** The related-event timeline of one alert, with real clock times. */
export function timelineOf(alert: Alert, firedAt: number): TimelineItem[] {
  const steps = alert.rule.steps(alert).slice()
  if (alert.ackAfter != null && alert.assignee) {
    steps.push({ at: -alert.ackAfter, title: 'Acknowledged', body: `${alert.assignee} took the alert.`, tone: 'brand' })
  }
  return steps
    .sort((a, b) => b.at - a.at)
    .map((step, i) => ({
      id: i,
      time: clockUtc(firedAt - step.at * 1000),
      title: step.title,
      body: step.body,
      tone: step.tone,
    }))
}

/** The raw event as the SIEM stored it. */
export function rawEventOf(alert: Alert, firedAt: number) {
  const event = {
    alert_id: alert.id,
    rule: { id: alert.rule.id, name: alert.rule.name, severity: alert.rule.severity },
    source: alert.rule.source,
    observed_at: new Date(firedAt).toISOString(),
    tactic: tacticName(alert.rule.tactic).toLowerCase().replace(/ /g, '-'),
    entity: { kind: alert.rule.kind, name: alert.entity },
    event_count: alert.events,
    ...alert.rule.fields(alert),
  }
  return JSON.stringify(event, null, 2)
}

/* ── Event rate (peak events per second per bucket) ────────────────────────────────── */

export type RangeKey = '1h' | '24h' | '7d'

export const ranges: { value: RangeKey; label: string; bucket: number; count: number }[] = [
  { value: '1h', label: '1H', bucket: 60_000, count: 60 },
  { value: '24h', label: '24H', bucket: 1_800_000, count: 48 },
  { value: '7d', label: '7D', bucket: 14_400_000, count: 42 },
]

/** Business-hours shape of the bank's traffic, by hour of day in Jakarta (WIB = UTC+7). */
function dayShape(utcHour: number) {
  const wib = (utcHour + 7) % 24
  if (wib < 6) return 0.38
  if (wib < 9) return 0.38 + ((wib - 6) / 3) * 0.6
  if (wib < 17) return 1
  if (wib < 22) return 1 - ((wib - 17) / 5) * 0.5
  return 0.5 - ((wib - 22) / 2) * 0.12
}

/** Values for each range, ending at the bucket that contains `now`. */
export function eventRate(range: RangeKey, now: number, live: number) {
  const spec = ranges.find((r) => r.value === range)!
  const rand = seeded(range === '1h' ? 71 : range === '24h' ? 72 : 73)
  const values: number[] = []
  const times: number[] = []
  for (let i = 0; i < spec.count; i++) {
    const back = spec.count - 1 - i
    const t = now - back * spec.bucket
    times.push(t)
    const shape = dayShape(new Date(t).getUTCHours() + new Date(t).getUTCMinutes() / 60)
    if (range === '1h') {
      // The brute force on vpn-gw-02 started 29 min ago and was blocked 23 min ago.
      const spike: Record<number, number> = { 29: 1590, 28: 1980, 27: 2210, 26: 2160, 25: 1890, 24: 1420 }
      values.push(spike[back] ?? Math.round(1240 + Math.sin(i / 5) * 38 + (rand() - 0.5) * 90))
    } else {
      const peakiness = range === '24h' ? 1.12 : 1.18
      const weekend = [0, 6].includes(new Date(t + 7 * 3_600_000).getUTCDay()) ? 0.72 : 1
      let v = (380 + 1020 * shape) * weekend * peakiness + (rand() - 0.5) * 120
      // Bursts that crossed the threshold: today's brute force, a scanner last night, two last week.
      if (range === '24h' && back === 0) v = 2210
      if (range === '24h' && back === 27) v = 1930
      if (range === '7d' && back === 0) v = 2210
      if (range === '7d' && (back === 19 || back === 33)) v = back === 19 ? 1960 : 1870
      values.push(Math.round(v))
    }
  }
  if (range === '1h') values[values.length - 1] = live
  const label = (t: number) => {
    if (range === '7d') {
      const d = new Date(t)
      return `${DAYS[d.getUTCDay()]} ${pad(d.getUTCHours() - (d.getUTCHours() % 4))}:00`
    }
    if (range === '24h') {
      const d = new Date(t)
      return `${pad(d.getUTCHours())}:${d.getUTCMinutes() < 30 ? '00' : '30'}`
    }
    return hourMinuteUtc(t)
  }
  return { labels: times.map(label), values }
}

/* ── Detections by tactic, last 12 ISO weeks ───────────────────────────────────────── */

const TACTIC_BASE: Record<Tactic, number> = {
  INIT: 38, EXEC: 22, PERS: 9, PRIV: 14, EVADE: 11, CRED: 46, DISC: 27, LAT: 6, COLL: 8, C2: 12, EXFIL: 5, IMPACT: 2,
}

export function tacticWeeks(now: number) {
  const rand = seeded(45)
  const thisWeek = isoWeek(now)
  const cols = Array.from({ length: 12 }, (_, i) => `W${thisWeek - 11 + i}`)
  // This week has only run since Monday 00:00 UTC.
  const day = (new Date(now).getUTCDay() + 6) % 7
  const elapsed = (day * 86400000 + (now % 86400000)) / (7 * 86400000)
  const values = tactics.map((t) =>
    cols.map((_, c) => {
      // A phishing wave lifts initial access and credential access in the last three weeks.
      const wave = (t.code === 'CRED' || t.code === 'INIT') && c >= 9 ? 1.7 : 1
      const v = TACTIC_BASE[t.code] * wave * (0.7 + rand() * 0.6)
      return Math.round(c === 11 ? v * Math.max(0.12, elapsed) * 1.4 : v)
    }),
  )
  return { rows: tactics.map((t) => t.code), cols, values }
}
