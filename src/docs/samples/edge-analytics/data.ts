/**
 * Edge analytics · the data model behind the screen.
 *
 * Sixty days of hourly traffic per zone are generated once from a seeded random walk on top of
 * a WIB day curve, a weekly curve and a few real events (a payday on 25 Oct, a cache purge,
 * an origin incident, a credential-stuffing burst). Every number on the screen is a slice of
 * that: range, zone and filter chips re-cut the same hours, so totals, lists and charts agree.
 */

export type RangeId = '24h' | '7d' | '30d'
export type ZoneId = 'all' | 'lintang' | 'cdn' | 'pay'

/** The clock of the screen: 03 Nov 2026, 11:47 WIB. The current hour bucket is 11:00. */
export const NOW_LABEL = '03 Nov 2026 · 11:47 WIB'
const HOURS = 24 * 60
const NOW_HOUR_UTC = Date.UTC(2026, 10, 3, 4) // 11:00 WIB
const WIB = 7 * 3600_000

export const ranges = [
  { label: '24H', value: '24h' },
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
]

export const rangeWords: Record<RangeId, { span: string; previous: string; bucket: string }> = {
  '24h': { span: 'last 24 hours', previous: 'previous 24 hours', bucket: 'hour' },
  '7d': { span: 'last 7 days', previous: 'previous 7 days', bucket: '6 hours' },
  '30d': { span: 'last 30 days', previous: 'previous 30 days', bucket: 'day' },
}

interface Zone {
  id: Exclude<ZoneId, 'all'>
  host: string
  /** Requests a day at the start of the window, before growth. */
  daily: number
  status: { s2: number; s3: number; s4: number; s5: number }
}

const zoneList: Zone[] = [
  { id: 'lintang', host: 'lintang.example', daily: 13_600_000, status: { s2: 0.931, s3: 0.046, s4: 0.022, s5: 0.001 } },
  { id: 'cdn', host: 'lintangcdn.example', daily: 34_900_000, status: { s2: 0.9115, s3: 0.081, s4: 0.007, s5: 0.0005 } },
  { id: 'pay', host: 'lintangpay.example', daily: 2_950_000, status: { s2: 0.951, s3: 0.012, s4: 0.035, s5: 0.002 } },
]

export const zones = [
  { label: 'All zones', value: 'all' },
  ...zoneList.map((z) => ({ label: z.host, value: z.id })),
]

interface PathRow {
  zone: Exclude<ZoneId, 'all'>
  method: 'GET' | 'POST'
  path: string
  share: number
  /** Share of this path's requests that come from crawlers and monitors. */
  bot: number
  /** Share the edge can serve from cache when it is warm. */
  cacheable: number
  /** Mean response size, KB. */
  kb: number
}

const paths: PathRow[] = [
  // lintang.example · web app and public API
  { zone: 'lintang', method: 'GET', path: '/assets/app.7f3c2a.js', share: 0.124, bot: 0.02, cacheable: 0.995, kb: 214 },
  { zone: 'lintang', method: 'GET', path: '/v1/fx/quotes', share: 0.118, bot: 0.004, cacheable: 0.9, kb: 3.2 },
  { zone: 'lintang', method: 'GET', path: '/assets/img/*', share: 0.112, bot: 0.04, cacheable: 0.99, kb: 58 },
  { zone: 'lintang', method: 'GET', path: '/assets/vendor.91d0e4.js', share: 0.094, bot: 0.02, cacheable: 0.995, kb: 342 },
  { zone: 'lintang', method: 'GET', path: '/v1/accounts/:id', share: 0.082, bot: 0, cacheable: 0, kb: 4.1 },
  { zone: 'lintang', method: 'GET', path: '/', share: 0.068, bot: 0.17, cacheable: 0.92, kb: 61 },
  { zone: 'lintang', method: 'GET', path: '/v1/transactions', share: 0.066, bot: 0, cacheable: 0.06, kb: 12.6 },
  { zone: 'lintang', method: 'GET', path: '/healthz', share: 0.058, bot: 1, cacheable: 0, kb: 0.2 },
  { zone: 'lintang', method: 'POST', path: '/v1/payments', share: 0.054, bot: 0, cacheable: 0, kb: 2.2 },
  { zone: 'lintang', method: 'GET', path: '/assets/fonts/*', share: 0.041, bot: 0.01, cacheable: 1, kb: 38 },
  { zone: 'lintang', method: 'GET', path: '/help/*', share: 0.038, bot: 0.31, cacheable: 0.96, kb: 46 },
  { zone: 'lintang', method: 'GET', path: '/api/session', share: 0.036, bot: 0, cacheable: 0, kb: 1.1 },
  { zone: 'lintang', method: 'POST', path: '/v1/auth/token', share: 0.032, bot: 0.01, cacheable: 0, kb: 1.3 },
  { zone: 'lintang', method: 'POST', path: '/v1/transfers', share: 0.026, bot: 0, cacheable: 0, kb: 2.4 },
  { zone: 'lintang', method: 'POST', path: '/v1/events', share: 0.03, bot: 0, cacheable: 0, kb: 0.4 },
  { zone: 'lintang', method: 'GET', path: '/robots.txt', share: 0.011, bot: 0.97, cacheable: 1, kb: 0.3 },
  { zone: 'lintang', method: 'GET', path: '/sitemap.xml', share: 0.01, bot: 0.98, cacheable: 1, kb: 22 },
  // lintangcdn.example · images, bundles, statements
  { zone: 'cdn', method: 'GET', path: '/img/merchants/*', share: 0.338, bot: 0.03, cacheable: 0.985, kb: 96 },
  { zone: 'cdn', method: 'GET', path: '/static/js/*', share: 0.221, bot: 0.01, cacheable: 0.998, kb: 188 },
  { zone: 'cdn', method: 'GET', path: '/img/promo/*', share: 0.164, bot: 0.04, cacheable: 0.99, kb: 242 },
  { zone: 'cdn', method: 'GET', path: '/static/css/*', share: 0.118, bot: 0.01, cacheable: 0.998, kb: 41 },
  { zone: 'cdn', method: 'GET', path: '/statements/*.pdf', share: 0.071, bot: 0, cacheable: 0.62, kb: 318 },
  { zone: 'cdn', method: 'GET', path: '/fonts/*', share: 0.052, bot: 0.01, cacheable: 1, kb: 36 },
  { zone: 'cdn', method: 'GET', path: '/healthz', share: 0.036, bot: 1, cacheable: 0, kb: 0.2 },
  // lintangpay.example · checkout and payment links
  { zone: 'pay', method: 'GET', path: '/c/:link', share: 0.284, bot: 0.06, cacheable: 0.55, kb: 34 },
  { zone: 'pay', method: 'POST', path: '/v1/checkout/sessions', share: 0.192, bot: 0, cacheable: 0, kb: 3.4 },
  { zone: 'pay', method: 'GET', path: '/checkout/assets/*', share: 0.181, bot: 0.01, cacheable: 0.99, kb: 72 },
  { zone: 'pay', method: 'POST', path: '/v1/qr/charges', share: 0.142, bot: 0, cacheable: 0, kb: 2.1 },
  { zone: 'pay', method: 'GET', path: '/v1/charges/:id', share: 0.118, bot: 0, cacheable: 0, kb: 2.8 },
  { zone: 'pay', method: 'GET', path: '/healthz', share: 0.083, bot: 1, cacheable: 0, kb: 0.2 },
]

const countries = [
  { label: 'Indonesia', code: 'ID', share: 0.642, threat: 0.29 },
  { label: 'Singapore', code: 'SG', share: 0.089, threat: 0.07 },
  { label: 'Malaysia', code: 'MY', share: 0.051, threat: 0.05 },
  { label: 'United States', code: 'US', share: 0.046, threat: 0.19 },
  { label: 'Australia', code: 'AU', share: 0.032, threat: 0.02 },
  { label: 'Japan', code: 'JP', share: 0.024, threat: 0.02 },
  { label: 'Netherlands', code: 'NL', share: 0.019, threat: 0.09 },
  { label: 'Germany', code: 'DE', share: 0.017, threat: 0.06 },
  { label: 'India', code: 'IN', share: 0.015, threat: 0.08 },
  { label: 'Other', code: '—', share: 0.065, threat: 0.13 },
]

const agents = [
  { label: 'Lintang Android 6.12', bot: false, share: 0.236 },
  { label: 'Lintang iOS 6.12', bot: false, share: 0.208 },
  { label: 'Chrome 130 · Android', bot: false, share: 0.171 },
  { label: 'Safari 18 · iOS', bot: false, share: 0.112 },
  { label: 'Chrome 130 · Windows', bot: false, share: 0.081 },
  { label: 'okhttp/4.12 · partner SDK', bot: false, share: 0.058 },
  { label: 'UptimeProbe/3.1', bot: true, share: 0.044 },
  { label: 'Search crawler · verified', bot: true, share: 0.031 },
  { label: 'Firefox 132 · macOS', bot: false, share: 0.022 },
  { label: 'curl/8.5', bot: false, share: 0.012 },
  { label: 'Other', bot: false, share: 0.025 },
]

/* ── Filters ─────────────────────────────────────────────────────────────── */

export type FilterId = 'bots' | 'health' | 'get' | 'post' | 'id' | 'sg'

export interface FilterDef {
  id: FilterId
  /** Field name, shown quiet in the chip. */
  field: string
  /** Operator and value, shown in ink. */
  value: string
  /** Filters in one group replace each other. */
  group: string
}

export const filterDefs: FilterDef[] = [
  { id: 'bots', field: 'Bots', value: 'excluded', group: 'bots' },
  { id: 'health', field: 'Path', value: '≠ /healthz', group: 'health' },
  { id: 'get', field: 'Method', value: '= GET', group: 'method' },
  { id: 'post', field: 'Method', value: '= POST', group: 'method' },
  { id: 'id', field: 'Country', value: '= Indonesia', group: 'country' },
  { id: 'sg', field: 'Country', value: '= Singapore', group: 'country' },
]

/* ── The hourly model ────────────────────────────────────────────────────── */

function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Traffic by WIB hour: quiet at 03:00, a lunch peak, a bigger evening peak. */
const DAY = [0.36, 0.27, 0.22, 0.2, 0.23, 0.36, 0.6, 0.86, 1.06, 1.18, 1.27, 1.34, 1.38, 1.3, 1.22, 1.2, 1.24, 1.32, 1.44, 1.56, 1.6, 1.42, 1.04, 0.62]
/** Sunday → Saturday. */
const WEEK = [0.88, 1.05, 1.04, 1.03, 1.02, 1.08, 0.92]
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

interface HourInfo {
  hour: number
  weekday: number
  date: number
  month: number
}

const hourInfo: HourInfo[] = Array.from({ length: HOURS }, (_, i) => {
  const wib = new Date(NOW_HOUR_UTC - (HOURS - 1 - i) * 3600_000 + WIB)
  return { hour: wib.getUTCHours(), weekday: wib.getUTCDay(), date: wib.getUTCDate(), month: wib.getUTCMonth() }
})

const is = (h: HourInfo, month: number, date: number, from: number, to = from) =>
  h.month === month && h.date === date && h.hour >= from && h.hour <= to

interface ZoneHours {
  req: number[]
  /** Mean response size against the zone's usual, 1 = usual. Evenings pull more images. */
  size: number[]
  /** Cache warmth, 1 = normal. A purge drops it. */
  warm: number[]
  /** Extra 5xx rate on top of the baseline. */
  s5: number[]
  threat: number[]
}

function buildZone(zone: Zone, seed: number): ZoneHours {
  const rand = rng(seed)
  const req: number[] = []
  const size: number[] = []
  const warm: number[] = []
  const s5: number[] = []
  const threat: number[] = []
  let walk = 1
  hourInfo.forEach((h, i) => {
    walk = Math.min(1.08, Math.max(0.93, walk + (rand() - 0.5) * 0.024))
    const growth = 1 + (i / HOURS) * 0.11
    let event = 1
    if (is(h, 9, 25, 0, 23)) event = 1.24 // payday
    if (is(h, 9, 24, 17, 23)) event = 1.1
    if (is(h, 9, 26, 0, 12)) event = 1.08
    const noise = 0.95 + rand() * 0.1
    req.push((zone.daily / 24) * DAY[h.hour] * WEEK[h.weekday] * growth * event * walk * noise)
    const evening = h.hour >= 18 && h.hour <= 22 ? 1.07 : h.hour <= 5 ? 0.9 : 1
    const weekend = h.weekday === 0 || h.weekday === 6 ? 1.05 : 1
    size.push(evening * weekend * (0.96 + rand() * 0.08) * (1 - (i / HOURS) * 0.04))

    // Cache purge on lintang.example, 02 Nov 15:10 WIB (deploy of app 7f3c2a)
    let w = 1
    if (zone.id === 'lintang') {
      if (is(h, 10, 2, 15)) w = 0.34
      if (is(h, 10, 2, 16)) w = 0.58
      if (is(h, 10, 2, 17)) w = 0.8
      if (is(h, 10, 2, 18)) w = 0.93
    }
    warm.push(w)

    // Origin incidents: connection pool exhausted at the evening peak, and a smaller one last week
    let e = rand() * 0.0004
    if (zone.id !== 'cdn' && is(h, 10, 2, 19)) e += zone.id === 'pay' ? 0.024 : 0.031
    if (zone.id !== 'cdn' && is(h, 10, 2, 20)) e += 0.011
    if (zone.id === 'lintang' && is(h, 9, 30, 9)) e += 0.009
    if (zone.id === 'pay' && is(h, 9, 21, 13, 14)) e += 0.014
    s5.push(e)

    // Credential stuffing against /v1/auth/token, 03 Nov 01:00–03:00 WIB
    let t = (zone.id === 'cdn' ? 0.0007 : zone.id === 'pay' ? 0.006 : 0.0044) * (0.7 + rand() * 0.6)
    if (zone.id === 'lintang' && is(h, 10, 3, 1)) t *= 8.5
    if (zone.id === 'lintang' && is(h, 10, 3, 2)) t *= 11.2
    if (zone.id === 'lintang' && is(h, 10, 3, 3)) t *= 4.6
    if (zone.id === 'lintang' && is(h, 9, 19, 22, 23)) t *= 5.1
    threat.push(t)
  })
  return { req, size, warm, s5, threat }
}

const hoursByZone = Object.fromEntries(zoneList.map((z, i) => [z.id, buildZone(z, 2107 + i * 977)])) as Record<
  Zone['id'],
  ZoneHours
>

/* ── Slicing ─────────────────────────────────────────────────────────────── */

export interface Slice {
  labels: string[]
  /** Short labels for columns, where the band is narrow. */
  columnLabels: string[]
  requests: number[]
  cached: number[]
  uncached: number[]
  bandwidth: number[]
  ratio: number[]
  threats: number[]
  status: { name: string; values: number[]; color: string }[]
  totals: { requests: number; bandwidth: number; ratio: number; threats: number; s5: number }
  previous: { requests: number; bandwidth: number; ratio: number; threats: number }
  peak5xx: { rate: number; label: string }
  topPaths: { label: string; values: number }[]
  topCountries: { label: string; values: number }[]
  topAgents: { label: string; values: number }[]
  counts: { paths: number; countries: number; agents: number }
  heat: { rows: string[]; cols: string[]; values: number[][]; span: string }
  /** Requests a second in the current hour, before jitter. */
  rps: number
}

const pad = (n: number) => String(n).padStart(2, '0')

function bucketsFor(range: RangeId) {
  const end = HOURS - 1
  if (range === '24h') return { size: 1, count: 24, end }
  if (range === '7d') return { size: 6, count: 28, end }
  return { size: 24, count: 30, end }
}

function labelFor(range: RangeId, first: number, last: number) {
  const a = hourInfo[first]
  const b = hourInfo[last]
  if (range === '24h') return { long: `${pad(a.hour)}:00`, short: `${pad(a.hour)}:00` }
  if (range === '7d') return { long: `${WEEKDAYS[a.weekday]} ${pad(a.hour)}:00`, short: `${WEEKDAYS[a.weekday]} ${pad(a.hour)}` }
  return { long: `${b.date} ${MONTHS[b.month]}`, short: `${b.date} ${MONTHS[b.month]}` }
}

/* Each path keeps its own rhythm on top of the zone's curve, so a filter changes the shape too. */
type Profile = 'web' | 'api' | 'pay' | 'flat' | 'crawl'

function profileOf(p: PathRow): Profile {
  if (p.path === '/healthz') return 'flat'
  if (p.path === '/robots.txt' || p.path === '/sitemap.xml') return 'crawl'
  if (p.method === 'POST' && /payments|transfers|qr|checkout/.test(p.path)) return 'pay'
  if (p.path.startsWith('/v1/') || p.path.startsWith('/api/')) return 'api'
  return 'web'
}

const profiles: Record<Profile, number[]> = { web: [], api: [], pay: [], flat: [], crawl: [] }
hourInfo.forEach((h) => {
  const curve = DAY[h.hour] * WEEK[h.weekday]
  const weekend = h.weekday === 0 || h.weekday === 6
  const payday = h.month === 9 && h.date === 25
  profiles.flat.push(1 / curve)
  profiles.crawl.push((h.hour <= 6 ? 1.5 : 0.9) / curve)
  profiles.web.push((h.hour >= 18 && h.hour <= 22 ? 1.12 : h.hour >= 9 && h.hour <= 16 ? 0.93 : 1) * (weekend ? 1.08 : 0.98))
  profiles.api.push((h.hour >= 9 && h.hour <= 17 ? 1.08 : h.hour >= 19 ? 0.92 : 1) * (weekend ? 0.86 : 1.03))
  profiles.pay.push(
    (h.hour >= 11 && h.hour <= 13 ? 1.24 : h.hour >= 19 && h.hour <= 21 ? 1.12 : h.hour <= 5 ? 0.58 : 0.95) *
      (weekend ? 0.9 : 1.03) *
      (payday ? 1.3 : 1),
  )
})

export function slice(range: RangeId, zone: ZoneId, active: FilterId[]): Slice {
  const has = (id: FilterId) => active.includes(id)
  const method = has('get') ? 'GET' : has('post') ? 'POST' : null
  const country = has('id') ? countries[0] : has('sg') ? countries[1] : null
  const zonesIn = zone === 'all' ? zoneList : zoneList.filter((z) => z.id === zone)
  const countryShare = country ? country.share : 1
  const threatShare = (country ? country.threat : 1) * (method === 'GET' ? 0.38 : method === 'POST' ? 2.6 : 1)

  // The paths left after the filters, each with its weight in its zone's raw traffic.
  const kept = paths
    .filter((p) => zonesIn.some((z) => z.id === p.zone))
    .filter((p) => !method || p.method === method)
    .filter((p) => !has('health') || p.path !== '/healthz')
    .map((p) => {
      const z = zoneList.find((x) => x.id === p.zone)!
      return {
        ...p,
        w: p.share * (has('bots') ? 1 - p.bot : 1) * countryShare,
        prof: profiles[profileOf(p)],
        hours: hoursByZone[p.zone],
        s3: method === 'POST' ? 0.002 : z.status.s3,
        s4: z.status.s4 * (method === 'POST' ? 2.1 : method === 'GET' ? 0.8 : 1),
        s5: z.status.s5,
      }
    })
    .filter((p) => p.w > 0)

  const reqAt = (i: number) => kept.reduce((sum, p) => sum + p.hours.req[i] * p.w * p.prof[i], 0)

  const { size, count, end } = bucketsFor(range)
  const span = size * count
  const cur0 = end - span + 1
  const prev0 = cur0 - span

  // Hourly totals over the window and the one before it.
  const H = { req: [] as number[], cached: [] as number[], bytes: [] as number[], s2: [] as number[], s3: [] as number[], s4: [] as number[], s5: [] as number[], threat: [] as number[] }
  const pathSums = kept.map(() => 0)
  for (let i = prev0; i <= end; i++) {
    let req = 0
    let cached = 0
    let bytes = 0
    let s3 = 0
    let s4 = 0
    let s5 = 0
    kept.forEach((p, k) => {
      const r = p.hours.req[i] * p.w * p.prof[i]
      req += r
      cached += r * p.cacheable * p.hours.warm[i]
      bytes += r * p.kb * 1024 * p.hours.size[i]
      s3 += r * p.s3
      s4 += r * p.s4
      s5 += r * (p.s5 + p.hours.s5[i] * (method === 'GET' ? 0.6 : 1))
      if (i >= cur0) pathSums[k] += r
    })
    let threat = 0
    for (const z of zonesIn) threat += hoursByZone[z.id].req[i] * hoursByZone[z.id].threat[i] * threatShare
    H.req.push(req)
    H.cached.push(cached)
    H.bytes.push(bytes)
    H.s3.push(s3)
    H.s4.push(s4)
    H.s5.push(s5)
    H.s2.push(req - s3 - s4 - s5)
    H.threat.push(threat)
  }
  const sum = (arr: number[], a: number, b: number) => {
    let total = 0
    for (let i = a; i <= b; i++) total += arr[i - prev0] ?? 0
    return total
  }

  const labels: string[] = []
  const columnLabels: string[] = []
  const requests: number[] = []
  const cachedS: number[] = []
  const uncached: number[] = []
  const bandwidth: number[] = []
  const ratio: number[] = []
  const threats: number[] = []
  const st = { s2: [] as number[], s3: [] as number[], s4: [] as number[], s5: [] as number[] }
  let peak5xx = { rate: 0, label: '' }
  for (let k = 0; k < count; k++) {
    const a = cur0 + k * size
    const b = a + size - 1
    const l = labelFor(range, a, b)
    labels.push(l.long)
    columnLabels.push(l.short)
    const r = sum(H.req, a, b)
    const c = sum(H.cached, a, b)
    requests.push(r)
    cachedS.push(c)
    uncached.push(r - c)
    bandwidth.push(sum(H.bytes, a, b))
    ratio.push(r ? (c / r) * 100 : 0)
    threats.push(sum(H.threat, a, b))
    st.s2.push(sum(H.s2, a, b))
    st.s3.push(sum(H.s3, a, b))
    st.s4.push(sum(H.s4, a, b))
    const e = sum(H.s5, a, b)
    st.s5.push(e)
    if (r && e / r > peak5xx.rate) peak5xx = { rate: e / r, label: l.long }
  }

  const curReq = sum(H.req, cur0, end)
  const prevReq = sum(H.req, prev0, cur0 - 1)
  const totals = {
    requests: curReq,
    bandwidth: sum(H.bytes, cur0, end),
    ratio: curReq ? (sum(H.cached, cur0, end) / curReq) * 100 : 0,
    threats: sum(H.threat, cur0, end),
    s5: curReq ? (sum(H.s5, cur0, end) / curReq) * 100 : 0,
  }
  const previous = {
    requests: prevReq,
    bandwidth: sum(H.bytes, prev0, cur0 - 1),
    ratio: prevReq ? (sum(H.cached, prev0, cur0 - 1) / prevReq) * 100 : 0,
    threats: sum(H.threat, prev0, cur0 - 1),
  }

  // Top lists: paths are measured; countries and agents are shares of the same total.
  const shortHost: Record<string, string> = { lintang: 'lintang', cdn: 'cdn', pay: 'pay' }
  const topPaths = kept
    .map((p, k) => ({ label: zone === 'all' ? `${shortHost[p.zone]} ${p.path}` : `${p.method} ${p.path}`, values: pathSums[k] }))
    .sort((a, b) => b.values - a.values)

  const countryRows = (country ? [country] : countries).filter((c) => c.code !== '—')
  const cShare = (country ? [country] : countries).reduce((total, c) => total + c.share, 0)
  const topCountries = countryRows
    .map((c) => ({ label: c.label, values: (curReq * c.share) / cShare }))
    .sort((a, b) => b.values - a.values)

  const agentPool = agents.filter((a) => !has('bots') || !a.bot)
  const aShare = agentPool.reduce((total, a) => total + a.share, 0)
  const topAgents = agentPool
    .filter((a) => a.label !== 'Other')
    .map((a) => ({ label: a.label, values: (curReq * a.share) / aShare }))
    .sort((a, b) => b.values - a.values)

  // Weekday × hour, average requests an hour. Needs whole weeks, so 24H borrows the last 7 days.
  const heatSpan = range === '30d' ? 28 * 24 : 7 * 24
  const sums = Array.from({ length: 7 }, () => new Array(24).fill(0))
  const counts = Array.from({ length: 7 }, () => new Array(24).fill(0))
  for (let i = end - heatSpan + 1; i <= end; i++) {
    const h = hourInfo[i]
    const row = (h.weekday + 6) % 7 // Monday first
    sums[row][h.hour] += reqAt(i)
    counts[row][h.hour] += 1
  }
  const heatValues = sums.map((row, r) => row.map((v, c) => (counts[r][c] ? v / counts[r][c] : 0)))

  return {
    labels,
    columnLabels,
    requests,
    cached: cachedS,
    uncached,
    bandwidth,
    ratio,
    threats,
    status: [
      { name: '2xx', values: st.s2, color: 'var(--r-chart-1)' },
      { name: '3xx', values: st.s3, color: 'var(--r-chart-context)' },
      { name: '4xx', values: st.s4, color: 'var(--r-status-warning)' },
      { name: '5xx', values: st.s5, color: 'var(--r-status-critical)' },
    ],
    totals,
    previous,
    peak5xx: { rate: peak5xx.rate * 100, label: peak5xx.label },
    topPaths: topPaths.slice(0, 8),
    topCountries: topCountries.slice(0, 8),
    topAgents: topAgents.slice(0, 8),
    counts: { paths: topPaths.length, countries: topCountries.length, agents: topAgents.length },
    heat: {
      rows: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      cols: Array.from({ length: 24 }, (_, i) => pad(i)),
      values: heatValues,
      span: range === '30d' ? 'Last 4 weeks' : 'Last 7 days',
    },
    rps: reqAt(end) / 3600,
  }
}

/* ── Formatting ──────────────────────────────────────────────────────────── */

/** 12_480_000 → { value: 12.48, suffix: 'M' } */
export function scaled(n: number, digits = 2): { value: number; suffix: string; text: string } {
  const steps: [number, string][] = [
    [1e12, 'T'],
    [1e9, 'B'],
    [1e6, 'M'],
    [1e3, 'K'],
  ]
  for (const [size, suffix] of steps) {
    if (Math.abs(n) >= size) {
      const value = Number((n / size).toFixed(digits))
      return { value, suffix, text: `${value.toFixed(digits)}${suffix}` }
    }
  }
  return { value: Math.round(n), suffix: '', text: String(Math.round(n)) }
}

/** Bytes → { value: 1.84, unit: 'TB' } in decimal units, as edge networks bill. */
export function bytes(n: number, digits = 2): { value: number; unit: string; text: string } {
  const steps: [number, string][] = [
    [1e15, 'PB'],
    [1e12, 'TB'],
    [1e9, 'GB'],
    [1e6, 'MB'],
    [1e3, 'KB'],
  ]
  for (const [size, unit] of steps) {
    if (n >= size) {
      const value = Number((n / size).toFixed(digits))
      return { value, unit, text: `${value.toFixed(digits)} ${unit}` }
    }
  }
  return { value: Math.round(n), unit: 'B', text: `${Math.round(n)} B` }
}
