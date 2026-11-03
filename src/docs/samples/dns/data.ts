/**
 * DNS records · zone lintang.example on the 21 Strive edge.
 * Addresses come from the documentation ranges (192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24,
 * 2001:db8::/32), so nothing here points at a real host.
 */

export type RecordType = 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'CAA'

export interface DnsRecord {
  id: string
  type: RecordType
  /** Relative name; the apex is written as the zone name. */
  name: string
  content: string
  /** Seconds; 1 means Auto. */
  ttl: number
  proxied: boolean
  /** Shown quietly under the content. */
  note?: string
  /** Value before the last change, while resolvers may still hold it. */
  previous?: string
  /** Minutes since the last change, for propagation. */
  changedAgo?: number
}

export const ZONE = {
  name: 'lintang.example',
  id: '7c1e09d4a83b4f52b6e1c0f9a2d47e3b',
  plan: 'Business',
  activated: '14 Mar 2025',
  registrar: 'Pendaftar Nusantara',
  dnssec: 'Active · DS 2371 13 2',
  queries24h: 18_420_000,
  queriesTrend: 3.8,
  queriesSpark: [612, 588, 571, 562, 570, 604, 668, 731, 776, 804, 822, 840, 851, 838, 829, 826, 834, 851, 878, 902, 911, 884, 802, 704],
}

export const NAMESERVERS = `ana.ns.21strive.example
rudi.ns.21strive.example`

export const recordTypes: RecordType[] = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'CAA']

/** Only address records can sit behind the edge proxy. */
export const proxiable = (type: RecordType) => type === 'A' || type === 'AAAA' || type === 'CNAME'

export const ttlOptions = [
  { label: 'Auto', value: 1 },
  { label: '1 min', value: 60 },
  { label: '5 min', value: 300 },
  { label: '30 min', value: 1800 },
  { label: '1 hr', value: 3600 },
  { label: '12 hr', value: 43200 },
  { label: '1 day', value: 86400 },
]

export const ttlLabel = (ttl: number) => ttlOptions.find((o) => o.value === ttl)?.label ?? `${ttl} s`

export const initialRecords: DnsRecord[] = [
  { id: 'r01', type: 'A', name: 'lintang.example', content: '203.0.113.10', ttl: 1, proxied: true },
  { id: 'r02', type: 'AAAA', name: 'lintang.example', content: '2001:db8:4f1a::10', ttl: 1, proxied: true },
  { id: 'r03', type: 'A', name: 'www', content: '203.0.113.10', ttl: 1, proxied: true },
  { id: 'r04', type: 'A', name: 'api', content: '203.0.113.24', ttl: 1, proxied: true, note: 'Origin pool B' },
  { id: 'r05', type: 'AAAA', name: 'api', content: '2001:db8:4f1a::24', ttl: 1, proxied: true },
  { id: 'r06', type: 'A', name: 'app', content: '203.0.113.31', ttl: 1, proxied: true },
  { id: 'r07', type: 'AAAA', name: 'app', content: '2001:db8:4f1a::31', ttl: 1, proxied: true },
  { id: 'r08', type: 'CNAME', name: 'cdn', content: 'lintangcdn.example', ttl: 1, proxied: true },
  { id: 'r09', type: 'CNAME', name: 'pay', content: 'lintangpay.example', ttl: 1, proxied: true },
  { id: 'r10', type: 'CNAME', name: 'docs', content: 'lintang-docs.pages.21strive.example', ttl: 1, proxied: true },
  { id: 'r11', type: 'CNAME', name: 'status', content: 'lintang.status.21strive.example', ttl: 300, proxied: false },
  { id: 'r12', type: 'A', name: 'staging', content: '192.0.2.44', ttl: 1, proxied: true },
  {
    id: 'r13',
    type: 'A',
    name: 'vpn',
    content: '198.51.100.9',
    ttl: 300,
    proxied: false,
    previous: '198.51.100.7',
    changedAgo: 6,
    note: 'Failover to gateway 2 · 6 min ago',
  },
  { id: 'r14', type: 'A', name: 'mail', content: '198.51.100.20', ttl: 3600, proxied: false },
  { id: 'r15', type: 'MX', name: 'lintang.example', content: '10 mx1.mailroute.example', ttl: 3600, proxied: false },
  { id: 'r16', type: 'MX', name: 'lintang.example', content: '20 mx2.mailroute.example', ttl: 3600, proxied: false },
  { id: 'r17', type: 'TXT', name: 'lintang.example', content: '"v=spf1 include:_spf.mailroute.example -all"', ttl: 3600, proxied: false },
  {
    id: 'r18',
    type: 'TXT',
    name: '_dmarc',
    content: '"v=DMARC1; p=quarantine; rua=mailto:dmarc@lintang.example; pct=100"',
    ttl: 3600,
    proxied: false,
  },
  {
    id: 'r19',
    type: 'TXT',
    name: 'sel1._domainkey',
    content: '"v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA2v7…"',
    ttl: 3600,
    proxied: false,
  },
  { id: 'r20', type: 'TXT', name: '_21strive-verify', content: '"21s-verification=8f3a2c91d04e"', ttl: 300, proxied: false },
  { id: 'r21', type: 'CAA', name: 'lintang.example', content: '0 issue "ca.trustline.example"', ttl: 3600, proxied: false },
  { id: 'r22', type: 'CAA', name: 'lintang.example', content: '0 iodef "mailto:security@lintang.example"', ttl: 3600, proxied: false },
]

/** Validates content for a record type; returns an error sentence or ''. */
export function validate(type: RecordType, name: string, content: string): { name: string; content: string } {
  const errors = { name: '', content: '' }
  const n = name.trim()
  const c = content.trim()
  if (!n) errors.name = 'Enter a name, or @ for the zone apex.'
  else if (!/^(@|[a-z0-9_*]([a-z0-9_.-]*[a-z0-9])?)$/i.test(n)) errors.name = 'Use letters, digits, dots, hyphens and underscores.'
  if (!c) {
    errors.content = 'Enter the record content.'
    return errors
  }
  const v4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/
  const host = /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}\.?$/i
  if (type === 'A' && !v4.test(c)) errors.content = 'An A record points at an IPv4 address, like 203.0.113.40.'
  if (type === 'AAAA' && !(/^[0-9a-f:]+$/i.test(c) && c.includes(':'))) errors.content = 'An AAAA record points at an IPv6 address, like 2001:db8::40.'
  if (type === 'CNAME' && !host.test(c)) errors.content = 'A CNAME points at a hostname, like app.lintangpay.example.'
  if (type === 'MX' && !/^\d{1,5}\s+\S+\.\S+$/.test(c)) errors.content = 'Write the priority, then the mail server: 10 mx1.mailroute.example.'
  if (type === 'CAA' && !/^\d+\s+(issue|issuewild|iodef)\s+".+"$/.test(c)) errors.content = 'Write flags, tag and value: 0 issue "ca.trustline.example".'
  return errors
}

/* ── Change log ──────────────────────────────────────────────────────────── */

export interface ChangeEntry {
  id: string
  time: string
  title: string
  body?: string
  meta: string
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'brand'
}

export const initialChanges: ChangeEntry[] = [
  { id: 'c1', time: '11:41 WIB', title: 'vpn · A record changed', body: '198.51.100.7 → 198.51.100.9, failover to gateway 2', meta: 'Dimas Pratama', tone: 'warning' },
  { id: 'c2', time: '09:12 WIB', title: '_21strive-verify · TXT added', body: 'Domain verification for the 21 Strive console', meta: 'Ayu Lestari', tone: 'success' },
  { id: 'c3', time: '2 Nov 16:30', title: 'api · A record changed', body: '203.0.113.19 → 203.0.113.24, origin pool B', meta: 'Dimas Pratama' },
  { id: 'c4', time: '31 Oct 10:05', title: 'status · proxy turned off', body: 'The status page host serves its own certificate', meta: 'Kevin Tan' },
  { id: 'c5', time: '28 Oct 14:22', title: 'sel1._domainkey · TXT rotated', body: 'New 2048-bit DKIM key for mailroute', meta: 'Ayu Lestari' },
]

/* ── Propagation ─────────────────────────────────────────────────────────── */

export interface Resolver {
  id: string
  city: string
  code: string
  /** Round trip from the checker, ms. */
  rtt: number
}

export const resolvers: Resolver[] = [
  { id: 'cgk', city: 'Jakarta', code: 'CGK', rtt: 6 },
  { id: 'sub', city: 'Surabaya', code: 'SUB', rtt: 14 },
  { id: 'sin', city: 'Singapore', code: 'SIN', rtt: 19 },
  { id: 'kul', city: 'Kuala Lumpur', code: 'KUL', rtt: 24 },
  { id: 'nrt', city: 'Tokyo', code: 'NRT', rtt: 71 },
  { id: 'syd', city: 'Sydney', code: 'SYD', rtt: 92 },
  { id: 'bom', city: 'Mumbai', code: 'BOM', rtt: 64 },
  { id: 'fra', city: 'Frankfurt', code: 'FRA', rtt: 168 },
  { id: 'iad', city: 'Ashburn', code: 'IAD', rtt: 221 },
  { id: 'gru', city: 'São Paulo', code: 'GRU', rtt: 312 },
]

export type ProbeState = 'match' | 'stale' | 'timeout' | 'checking'

export interface Probe {
  resolver: Resolver
  state: ProbeState
  answer: string
  ms: number
}

/**
 * What each resolver answers for a record. Proxied records answer with edge addresses, so the
 * check compares against what the edge publishes. Records changed in the last few minutes are
 * still cached by some resolvers, more so the further away and the fewer runs ago.
 */
export function probe(record: DnsRecord, run: number, seed = 0): Probe[] {
  // A proxied record answers with edge addresses, so only a brand-new name can be stale.
  const fresh =
    record.changedAgo != null && record.previous != null && (!record.proxied || record.previous === 'NXDOMAIN')
  return resolvers.map((resolver, i) => {
    const jitter = ((i * 37 + run * 11 + seed * 7) % 9) - 4
    const ms = Math.max(3, resolver.rtt + jitter)
    if (!fresh) return { resolver, state: 'match', answer: answerOf(record, record.content), ms }
    // The older the change, the more resolvers have expired it; a run is about a minute later.
    const age = (record.changedAgo ?? 0) + run
    const holds = Math.max(0, 3 - Math.floor(age / 3))
    const order = [9, 7, 5, 8, 6, 4, 3, 2, 1, 0]
    const rank = order.indexOf(i)
    if (rank === 0 && age < 8) return { resolver, state: 'timeout', answer: 'No answer', ms: 2000 }
    if (rank > 0 && rank <= holds) return { resolver, state: 'stale', answer: answerOf(record, record.previous!), ms }
    return { resolver, state: 'match', answer: answerOf(record, record.content), ms }
  })
}

/** The edge publishes its own anycast addresses for proxied names. */
export const EDGE_V4 = '203.0.113.200'
export const EDGE_V6 = '2001:db8:e0::200'

function answerOf(record: DnsRecord, value: string) {
  if (value === 'NXDOMAIN') return value
  if (record.proxied) return record.type === 'AAAA' ? EDGE_V6 : EDGE_V4
  if (record.type === 'TXT') return value.length > 34 ? `${value.slice(0, 33)}…"` : value
  return value
}

/* ── Zone file ───────────────────────────────────────────────────────────── */

export function zoneFile(records: DnsRecord[]): string {
  const rel = (name: string) => (name === ZONE.name ? '@' : name)
  const fq = (type: RecordType, content: string) =>
    type === 'CNAME' ? `${content}.` : type === 'MX' ? content.replace(/(\S+)$/, '$1.') : content
  const lines = [
    `; ${ZONE.name} · exported 03 Nov 2026 11:47 WIB · ${records.length} records`,
    `; Proxied records publish edge addresses; the origin values below stay private.`,
    `$ORIGIN ${ZONE.name}.`,
    `$TTL 300`,
    '',
  ]
  for (const r of records) {
    const ttl = r.ttl === 1 ? 300 : r.ttl
    const proxy = proxiable(r.type) ? `  ; ${r.proxied ? 'proxied' : 'dns only'}` : ''
    lines.push(`${rel(r.name).padEnd(18)} ${String(ttl).padEnd(6)} IN  ${r.type.padEnd(6)} ${fq(r.type, r.content)}${proxy}`)
  }
  return lines.join('\n')
}

export const IMPORT_EXAMPLE = `; Paste BIND lines: name, TTL, class, type, content
blog               3600   IN  CNAME  lintang-blog.pages.21strive.example.
api-v2             300    IN  A      203.0.113.52
_mta-sts           3600   IN  TXT    "v=STSv1; id=20261103"`

/** Reads BIND lines into records. Returns the records and the lines it could not read. */
export function parseZone(text: string): { records: Omit<DnsRecord, 'id'>[]; skipped: number } {
  const records: Omit<DnsRecord, 'id'>[] = []
  let skipped = 0
  for (const raw of text.split('\n')) {
    const line = raw.replace(/;.*$/, '').trim()
    if (!line || line.startsWith('$')) continue
    const parts = line.split(/\s+/)
    const at = parts.findIndex((p) => p.toUpperCase() === 'IN')
    const type = (parts[at + 1] ?? '').toUpperCase() as RecordType
    if (at < 1 || !recordTypes.includes(type)) {
      skipped++
      continue
    }
    const name = parts[0] === '@' ? ZONE.name : parts[0].replace(/\.$/, '')
    const ttl = Number(parts[1]) || 300
    const content = parts
      .slice(at + 2)
      .join(' ')
      .replace(/\.$/, '')
    if (!content) {
      skipped++
      continue
    }
    records.push({ type, name, content, ttl: ttlOptions.some((o) => o.value === ttl) ? ttl : 300, proxied: false })
  }
  return { records, skipped }
}
