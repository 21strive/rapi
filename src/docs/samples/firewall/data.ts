/**
 * Edge firewall · Selaras Bank, zone selaras.id. The last 24 hours of traffic (02 Nov 2026
 * 06:00 UTC to 03 Nov 2026 05:59 UTC) as traffic profiles, the custom rules, and everything
 * the screen shows derived from running one through the other, so the table, the KPIs, the
 * chart, the top sources and the rule preview all agree.
 */
import {
  parseRange,
  parseRule,
  shareOf,
  simulate,
  type Profile,
  type RuleAction,
  type RuleNode,
} from './engine'

/* ── Time ───────────────────────────────────────────────────────────────────────── */

export const NOW_LABEL = '05:30 UTC'
export const HOURS = Array.from({ length: 24 }, (_, i) => `${String((6 + i) % 24).padStart(2, '0')}:00`)
const H = HOURS.length

/** Small deterministic generator, so every load draws the same traffic. */
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

const normalize = (values: number[]) => {
  const sum = values.reduce((a, b) => a + b, 0)
  return values.map((v) => v / sum)
}

/* Hourly shapes, bucket 0 = 06:00 UTC (13:00 WIB). */
const BY_WIB_HOUR = [
  0.35, 0.22, 0.15, 0.12, 0.14, 0.3, 0.6, 0.9, 1.05, 1.1, 1.1, 1.15, 1.25, 1.2, 1.1, 1.05, 1.05, 1.1, 1.2, 1.35, 1.4, 1.2, 0.9, 0.6,
]
const SHAPES = {
  /** Customers, following the day in Jakarta. */
  human: HOURS.map((_, i) => BY_WIB_HOUR[(13 + i) % 24]),
  /** Monitors and scrapers: steady. */
  flat: HOURS.map((_, i) => 1 + 0.05 * Math.sin(i / 3)),
  /** The credential-stuffing wave against login.selaras.id, 21:00–23:59 UTC. */
  wave: [
    0.2, 0.18, 0.2, 0.25, 0.22, 0.3, 0.35, 0.4, 0.45, 0.55, 0.7, 1.1, 1.6, 2.6, 5.2, 9.8, 12.6, 8.4, 2.2, 0.9, 0.6, 0.45, 0.4, 0.35,
  ],
  /** Scanners come in bursts. */
  scan: [0.6, 0.5, 0.7, 2.4, 0.8, 0.6, 0.5, 0.6, 1.8, 0.7, 0.5, 0.6, 0.9, 0.7, 0.6, 0.5, 0.6, 3.1, 0.9, 0.6, 0.5, 0.7, 1.6, 0.6],
  /** OTP pumping in the Jakarta evening. */
  evening: [0.3, 0.3, 0.4, 0.5, 0.6, 0.9, 2.2, 3.4, 3.8, 3.1, 1.9, 0.8, 0.4, 0.3, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.3, 0.3, 0.3, 0.3],
  /** Partner callbacks: Jakarta business hours plus the 23:00 WIB settlement run. */
  business: HOURS.map((_, i) => {
    const wib = (13 + i) % 24
    return wib === 23 ? 2.6 : wib >= 8 && wib <= 17 ? 1.3 : 0.25
  }),
}

/* ── Networks ───────────────────────────────────────────────────────────────────── */

export const COUNTRIES: Record<string, string> = {
  ID: 'Indonesia',
  SG: 'Singapore',
  MY: 'Malaysia',
  AU: 'Australia',
  NL: 'Netherlands',
  JP: 'Japan',
  US: 'United States',
  GB: 'United Kingdom',
  NO: 'Norway',
  BR: 'Brazil',
  DE: 'Germany',
  IN: 'India',
  VN: 'Vietnam',
  FR: 'France',
}

/** Private-use ASNs (64512–65534), invented networks. */
export const NETWORKS: Record<number, { name: string; country: string }> = {
  64512: { name: 'Nusantara Seluler', country: 'ID' },
  64530: { name: 'Kepulauan Broadband', country: 'ID' },
  64545: { name: 'Merdeka Serat', country: 'ID' },
  64551: { name: 'Jawa Data Net', country: 'ID' },
  64561: { name: 'Lintas Selat Telecom', country: 'SG' },
  64577: { name: 'Harbourline Fibre', country: 'SG' },
  64583: { name: 'Semenanjung Net', country: 'MY' },
  64587: { name: 'Wattlewave Broadband', country: 'AU' },
  64591: { name: 'Polderkabel', country: 'NL' },
  64593: { name: 'Kiri Hikari', country: 'JP' },
  64595: { name: 'Prairiewave Fiber', country: 'US' },
  64597: { name: 'Ashdown Broadband', country: 'GB' },
  64600: { name: 'Kumulus Hosting', country: 'SG' },
  64620: { name: 'Ravenna Cloud', country: 'NL' },
  64652: { name: 'Fjordhall Hosting', country: 'NO' },
  64713: { name: 'Teluk Compute', country: 'ID' },
  64788: { name: 'Basalt Hosting', country: 'US' },
  64830: { name: 'Ipê Telecom', country: 'BR' },
  64845: { name: 'Rheinkabel', country: 'DE' },
  64866: { name: 'Ganga Broadband', country: 'IN' },
  64871: { name: 'Mekong Mobile', country: 'VN' },
  64877: { name: 'Loire Fibre', country: 'FR' },
  64905: { name: 'Tirta Clearing', country: 'ID' },
  64921: { name: 'Kancil Pay', country: 'ID' },
  64933: { name: 'Merak Fintech', country: 'ID' },
  64940: { name: 'Pantau Uptime', country: 'ID' },
  65012: { name: 'Halong Compute', country: 'VN' },
}

/* ── Traffic profiles ───────────────────────────────────────────────────────────── */

export const HOSTS = ['app.selaras.id', 'api.selaras.id', 'login.selaras.id']

const profiles: Profile[] = []
const jitter = rng(2026_11_03)

function add(ip: string, asn: number, host: string, method: string, path: string, ua: string, weight: number, shape: number[]) {
  const range = parseRange(ip)
  if (!range) throw new Error(`Bad address ${ip}`)
  // A little noise per profile, so the hours of different sources do not move in lockstep.
  const noisy = shape.map((v) => v * (0.94 + jitter() * 0.12))
  profiles.push({ ip: range, country: NETWORKS[asn].country, asn, host, path, method, ua, weight: Math.round(weight), shape: normalize(noisy) })
}

const UA = {
  android: 'SelarasApp/4.12.0 (phone; os 14)',
  ios: 'SelarasApp/4.12.0 (phone; os 18.1)',
  legacy: 'SelarasApp/3.9.4 (phone; os 11)',
  desktop: 'selaras-web/2026.10 (desktop)',
  mobileWeb: 'selaras-web/2026.10 (mobile)',
}

// Customers: where they connect from and with which client.
const ORIGINS: [number, number][] = [
  [64512, 0.34],
  [64530, 0.22],
  [64545, 0.18],
  [64551, 0.12],
  [64561, 0.05],
  [64577, 0.025],
  [64583, 0.012],
  [64587, 0.006],
  [64591, 0.004],
  [64593, 0.004],
  [64595, 0.004],
  [64597, 0.002],
]
const originTotal = ORIGINS.reduce((sum, [, share]) => sum + share, 0)

const WEB: [string, number][] = [
  [UA.desktop, 0.58],
  [UA.mobileWeb, 0.42],
]
const APP: [string, number][] = [
  [UA.android, 0.64],
  [UA.ios, 0.31],
  [UA.legacy, 0.05],
]
const LOGIN: [string, number][] = [
  [UA.android, 0.45],
  [UA.ios, 0.22],
  [UA.legacy, 0.03],
  [UA.desktop, 0.18],
  [UA.mobileWeb, 0.12],
]

const ENDPOINTS: [string, string, string, number, [string, number][]][] = [
  ['app.selaras.id', 'GET', '/', 1_420_000, WEB],
  ['app.selaras.id', 'GET', '/assets/app.js', 2_380_000, WEB],
  ['app.selaras.id', 'GET', '/dashboard', 2_160_000, WEB],
  ['app.selaras.id', 'GET', '/transfers', 1_040_000, WEB],
  ['app.selaras.id', 'POST', '/transfers', 210_000, WEB],
  ['app.selaras.id', 'GET', '/cards', 640_000, WEB],
  ['api.selaras.id', 'GET', '/mobile/v3/accounts', 11_200_000, APP],
  ['api.selaras.id', 'GET', '/mobile/v3/transactions', 9_600_000, APP],
  ['api.selaras.id', 'GET', '/mobile/v3/notifications', 4_100_000, APP],
  ['api.selaras.id', 'GET', '/mobile/v3/cards', 2_300_000, APP],
  ['api.selaras.id', 'POST', '/mobile/v3/transfers', 1_960_000, APP],
  ['api.selaras.id', 'GET', '/mobile/v3/rates', 1_150_000, APP],
  ['api.selaras.id', 'POST', '/v1/otp/resend', 214_000, APP],
  ['login.selaras.id', 'POST', '/session', 1_860_000, LOGIN],
  ['login.selaras.id', 'POST', '/session/refresh', 3_240_000, LOGIN],
  ['login.selaras.id', 'POST', '/mfa', 920_000, LOGIN],
]

for (const [host, method, path, total, clients] of ENDPOINTS) {
  for (const [ua, clientShare] of clients) {
    for (const [asn, originShare] of ORIGINS) {
      const block = NETWORKS[asn].country === 'ID' ? '192.0.2.0/25' : '192.0.2.128/25'
      add(block, asn, host, method, path, ua, (total * clientShare * originShare) / originTotal, SHAPES.human)
    }
  }
}

// Partners: settlement callbacks and the open-banking API.
add('198.51.100.32/28', 64905, 'api.selaras.id', 'POST', '/v2/settlement/callback', 'TirtaGateway/2.1', 312_400, SHAPES.business)
add('198.51.100.64/27', 64921, 'api.selaras.id', 'POST', '/v2/transfers', 'openbank-client/1.6', 118_000, SHAPES.human)
add('198.51.100.96/27', 64933, 'api.selaras.id', 'POST', '/v2/transfers', 'openbank-client/1.6', 66_400, SHAPES.human)
add('198.51.100.64/27', 64921, 'api.selaras.id', 'GET', '/v2/accounts', 'openbank-client/1.6', 162_000, SHAPES.human)
add('198.51.100.96/27', 64933, 'api.selaras.id', 'GET', '/v2/accounts', 'openbank-client/1.6', 91_000, SHAPES.human)

// Uptime monitors send no user agent.
add('198.51.100.120', 64940, 'app.selaras.id', 'GET', '/', '', 8_640, SHAPES.flat)
add('198.51.100.121', 64940, 'api.selaras.id', 'GET', '/healthz', '', 8_640, SHAPES.flat)
add('203.0.113.230', 64595, 'app.selaras.id', 'GET', '/', '', 1_930, SHAPES.scan)

// Credential stuffing from hosting networks, posing as the web app.
const STUFFING: [string, number, number][] = [
  ['203.0.113.14', 64620, 52_400],
  ['203.0.113.15', 64620, 41_800],
  ['203.0.113.22', 64620, 33_100],
  ['203.0.113.23', 64620, 12_600],
  ['203.0.113.87', 64788, 38_900],
  ['203.0.113.88', 64788, 24_300],
  ['203.0.113.91', 64788, 9_800],
  ['203.0.113.140', 65012, 31_200],
  ['203.0.113.141', 65012, 18_700],
  ['203.0.113.152', 65012, 7_900],
]
for (const [ip, asn, n] of STUFFING) add(ip, asn, 'login.selaras.id', 'POST', '/session', UA.desktop, n, SHAPES.wave)

// The same wave through residential proxies abroad.
const PROXIES: [string, number, number][] = [
  ['198.51.100.140', 64830, 6_100],
  ['198.51.100.141', 64830, 4_800],
  ['198.51.100.150', 64845, 5_200],
  ['198.51.100.160', 64866, 7_400],
  ['198.51.100.161', 64866, 3_900],
  ['198.51.100.170', 64871, 4_600],
  ['198.51.100.180', 64877, 2_900],
]
for (const [ip, asn, n] of PROXIES) add(ip, asn, 'login.selaras.id', 'POST', '/session', UA.mobileWeb, n, SHAPES.wave)

// Scanners walking the usual paths.
const SCAN_PATHS: [string, number][] = [
  ['/.env', 0.22],
  ['/.git/config', 0.18],
  ['/admin/login', 0.16],
  ['/actuator/env', 0.12],
  ['/backup.zip', 0.1],
  ['/api/swagger.json', 0.12],
  ['/phpinfo.php', 0.1],
]
const SCANNERS: [string, number, string, number, string[]][] = [
  ['198.51.100.21', 64713, 'sqlprobe/1.4', 9_800, ['app.selaras.id', 'api.selaras.id']],
  ['198.51.100.22', 64713, 'sqlprobe/1.4', 4_300, ['app.selaras.id']],
  ['198.51.100.90', 64652, 'VulnHound/0.9', 8_400, HOSTS],
  ['203.0.113.95', 64788, 'masscrawl/3.0', 11_200, HOSTS],
  ['203.0.113.30', 64620, 'sqlprobe/1.4', 6_300, ['api.selaras.id']],
  ['198.51.100.10', 64600, 'VulnHound/0.9', 3_100, ['app.selaras.id']],
]
for (const [ip, asn, ua, n, hosts] of SCANNERS) {
  for (const host of hosts) for (const [path, share] of SCAN_PATHS) add(ip, asn, host, 'GET', path, ua, (n * share) / hosts.length, SHAPES.scan)
}

// Admin probes with ordinary user agents.
add('203.0.113.60', 64600, 'app.selaras.id', 'GET', '/admin', 'fetchit/2.0', 8_100, SHAPES.flat)
add('203.0.113.61', 64600, 'api.selaras.id', 'GET', '/internal/metrics', 'fetchit/2.0', 4_900, SHAPES.flat)
add('198.51.100.200', 64713, 'api.selaras.id', 'GET', '/actuator/health', UA.desktop, 6_200, SHAPES.flat)
add('203.0.113.170', 65012, 'app.selaras.id', 'GET', '/admin', 'fetchit/2.0', 3_800, SHAPES.flat)

// Scrapers on the mobile API from hosting networks, posing as the app.
add('203.0.113.62', 64600, 'api.selaras.id', 'GET', '/mobile/v3/rates', UA.android, 17_400, SHAPES.flat)
add('203.0.113.63', 64600, 'api.selaras.id', 'GET', '/mobile/v3/rates', UA.android, 9_800, SHAPES.flat)
add('198.51.100.201', 64713, 'api.selaras.id', 'GET', '/mobile/v3/rates', UA.android, 14_600, SHAPES.flat)
add('198.51.100.202', 64713, 'api.selaras.id', 'GET', '/mobile/v3/accounts', UA.android, 6_300, SHAPES.flat)
add('198.51.100.203', 64713, 'api.selaras.id', 'GET', '/mobile/v3/accounts', UA.android, 4_100, SHAPES.flat)

// OTP pumping: resends from scripts, not from the app.
add('203.0.113.200', 64512, 'api.selaras.id', 'POST', '/v1/otp/resend', 'fetchit/2.0', 14_200, SHAPES.evening)
add('203.0.113.201', 64512, 'api.selaras.id', 'POST', '/v1/otp/resend', 'fetchit/2.0', 9_700, SHAPES.evening)
add('203.0.113.205', 64583, 'api.selaras.id', 'POST', '/v1/otp/resend', 'fetchit/2.0', 8_100, SHAPES.evening)
add('203.0.113.210', 64530, 'api.selaras.id', 'POST', '/v1/otp/resend', 'fetchit/2.0', 6_400, SHAPES.evening)

export { profiles }

/* ── Rules ──────────────────────────────────────────────────────────────────────── */

export const ACTIONS: Record<RuleAction, { label: string; tone: 'danger' | 'warning' | 'success' | 'neutral'; verb: string }> = {
  block: { label: 'Block', tone: 'danger', verb: 'block' },
  challenge: { label: 'Challenge', tone: 'warning', verb: 'challenge' },
  allow: { label: 'Allow', tone: 'success', verb: 'allow' },
  log: { label: 'Log', tone: 'neutral', verb: 'log' },
}

export interface FirewallRule {
  id: string
  name: string
  expression: string
  action: RuleAction
  /** A hostname, or "all". */
  scope: string
  enabled: boolean
  author: string
  /** Quiet second line: when it last changed. */
  updated: string
  /** Requests matched in the last 24 hours, and per hour for the sparkline. */
  matches: number
  hourly: number[]
  /** Added in this session: its figures are a preview over the last 24 hours. */
  preview?: boolean
}

interface RuleSeed extends Omit<FirewallRule, 'matches' | 'hourly'> {
  /** Hour bucket and share of it from which the rule was off, for a rule switched off overnight. */
  offFrom?: [number, number]
}

const SEEDS: RuleSeed[] = [
  {
    id: 'r-01',
    name: 'Allow partner settlement callbacks',
    expression: 'http.path matches "^/v2/settlement/callback" and ip.src in {198.51.100.32/28}',
    action: 'allow',
    scope: 'api.selaras.id',
    enabled: true,
    author: 'Tomás Ferreira',
    updated: '14 Oct 2026',
  },
  {
    id: 'r-02',
    name: 'Block credential-stuffing networks',
    expression: 'asn in {64620 64788 65012}',
    action: 'block',
    scope: 'login.selaras.id',
    enabled: true,
    author: 'Rizky Pratama',
    updated: '28 Oct 2026',
  },
  {
    id: 'r-03',
    name: 'Challenge sign-ins from outside ID and SG',
    expression: 'http.path == "/session" and not ip.geo.country in {"ID" "SG"}',
    action: 'challenge',
    scope: 'login.selaras.id',
    enabled: true,
    author: 'Ayu Lestari',
    updated: '21 Oct 2026',
  },
  {
    id: 'r-04',
    name: 'Block scanner user agents',
    expression: 'http.user_agent contains "sqlprobe" or http.user_agent contains "VulnHound" or http.user_agent contains "masscrawl"',
    action: 'block',
    scope: 'all',
    enabled: true,
    author: 'Daniel Okafor',
    updated: '9 Oct 2026',
  },
  {
    id: 'r-05',
    name: 'Block admin paths from the internet',
    expression: 'http.path matches "^/(admin|internal|actuator)" and not ip.src in {10.0.0.0/8}',
    action: 'block',
    scope: 'all',
    enabled: true,
    author: 'Kevin Halim',
    updated: '30 Sep 2026',
  },
  {
    id: 'r-06',
    name: 'Challenge OTP resends from non-app clients',
    expression: 'http.path == "/v1/otp/resend" and not http.user_agent contains "SelarasApp/"',
    action: 'challenge',
    scope: 'api.selaras.id',
    enabled: true,
    author: 'Mei Lin Tan',
    updated: '27 Oct 2026',
  },
  {
    id: 'r-07',
    name: 'Block hosting networks on the mobile API',
    expression: 'http.path matches "^/mobile/" and asn in {64600 64713}',
    action: 'block',
    scope: 'api.selaras.id',
    enabled: true,
    author: 'Arjun Mehta',
    updated: '19 Oct 2026',
  },
  {
    id: 'r-08',
    name: 'Log open-banking transfer calls',
    expression: 'http.path matches "^/v2/transfers" and http.method == "POST"',
    action: 'log',
    scope: 'api.selaras.id',
    enabled: true,
    author: 'Tomás Ferreira',
    updated: '6 Oct 2026',
  },
  {
    id: 'r-09',
    name: 'Log requests with no user agent',
    expression: 'http.user_agent == ""',
    action: 'log',
    scope: 'all',
    enabled: true,
    author: 'Daniel Okafor',
    updated: '2 Oct 2026',
  },
  {
    id: 'r-10',
    name: 'Challenge transfers from app 3.x',
    expression: 'http.path == "/mobile/v3/transfers" and http.user_agent contains "SelarasApp/3."',
    action: 'challenge',
    scope: 'api.selaras.id',
    enabled: false,
    author: 'Kevin Halim',
    updated: 'Off since 2 Nov 2026, 23:12 UTC',
    // 23:12 UTC: bucket 17 (23:00), on for the first 12 minutes.
    offFrom: [17, 0.2],
  },
]

function astOf(expression: string): RuleNode {
  const parsed = parseRule(expression)
  if (!parsed.ok) throw new Error(`Rule does not parse: ${expression} (${parsed.message})`)
  return parsed.ast
}

const sim = simulate(
  SEEDS.map((seed) => ({
    ast: astOf(seed.expression),
    scope: seed.scope,
    action: seed.action,
    live: HOURS.map((_, h) => {
      if (!seed.offFrom) return seed.enabled ? 1 : 0
      const [from, share] = seed.offFrom
      return h < from ? 1 : h === from ? share : 0
    }),
  })),
  profiles,
  H,
)

export const RULES: FirewallRule[] = SEEDS.map(({ offFrom: _offFrom, ...seed }, r) => {
  const hourly = sim.hourly[r].map(Math.round)
  return { ...seed, hourly, matches: hourly.reduce((a, b) => a + b, 0) }
})

/* ── Totals and series ──────────────────────────────────────────────────────────── */

const sum = (values: number[]) => Math.round(values.reduce((a, b) => a + b, 0))

export const TOTALS = {
  requests: sum(sim.outcome.total),
  blocked: sum(sim.outcome.block),
  challenged: sum(sim.outcome.challenge),
  allowed: sum(sim.outcome.allow),
  logged: sum(sim.outcome.log),
}

const peakIndex = sim.outcome.total.indexOf(Math.max(...sim.outcome.total))
export const PEAK = {
  label: `${String((6 + peakIndex) % 24).padStart(2, '0')}:00 UTC`,
  value: Math.round(sim.outcome.total[peakIndex]),
}

/** The current hour as a per-second rate, for the live readout. */
export const NOW_RATE = {
  requests: sim.outcome.total[H - 1] / 3600,
  blocked: sim.outcome.block[H - 1] / 3600,
}

/** Blocked and challenged per hour over the last 24 hours. */
export const HOURLY = {
  blocked: sim.outcome.block.map(Math.round),
  challenged: sim.outcome.challenge.map(Math.round),
}

export const BLOCK_ALERT_PER_HOUR = 30_000

/**
 * The last six hours in five-minute buckets (23:30 to 05:25 UTC). Each hour is split along a
 * line between its neighbours, with a little noise, and the parts still add up to the hour.
 */
function fiveMinute(series: number[], seed: number) {
  const draw = rng(seed)
  const buckets: number[] = []
  series.forEach((v, h) => {
    const before = (series[h - 1] ?? v + (v - (series[h + 1] ?? v))) * 0.5 + v * 0.5
    const after = (series[h + 1] ?? v) * 0.5 + v * 0.5
    const raw = Array.from({ length: 12 }, (_, k) => {
      const t = (k + 0.5) / 12
      const level = t < 0.5 ? before + (v - before) * (t / 0.5) : v + (after - v) * ((t - 0.5) / 0.5)
      return Math.max(0, level) * (0.82 + draw() * 0.36)
    })
    const total = raw.reduce((a, b) => a + b, 0) || 1
    raw.forEach((x) => buckets.push((x / total) * v))
  })
  // Bucket 17 is 23:00; the window starts at 23:30 and ends with the 05:25 bucket.
  return buckets.slice(17 * 12 + 6, 23 * 12 + 6).map(Math.round)
}

export const SIX_HOURS = {
  labels: Array.from({ length: 72 }, (_, i) => {
    const minutes = 23 * 60 + 30 + i * 5
    return `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
  }),
  blocked: fiveMinute(HOURLY.blocked, 7),
  challenged: fiveMinute(HOURLY.challenged, 11),
}

/** Blocked requests by the rule that blocked them, for the share bar under the top sources. */
const SHORT_NAMES: Record<string, string> = {
  'r-02': 'Stuffing networks',
  'r-04': 'Scanner agents',
  'r-05': 'Admin paths',
  'r-07': 'Mobile API hosts',
}
export const BLOCKED_BY_RULE = RULES.filter((rule) => rule.action === 'block').map((rule) => ({
  id: rule.id,
  short: SHORT_NAMES[rule.id] ?? rule.name,
  value: rule.matches,
}))

/* ── Top sources of blocked requests ────────────────────────────────────────────── */

function formatIp(n: number) {
  return [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.')
}

function top(keyOf: (p: Profile) => string, count = 7) {
  const totals = new Map<string, number>()
  profiles.forEach((p, i) => {
    if (sim.blockedBy[i] > 0) totals.set(keyOf(p), (totals.get(keyOf(p)) ?? 0) + sim.blockedBy[i])
  })
  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([label, value]) => ({ label, values: Math.round(value) }))
}

export const TOP_SOURCES = {
  countries: top((p) => COUNTRIES[p.country] ?? p.country),
  asns: top((p) => `AS${p.asn} ${NETWORKS[p.asn].name}`),
  ips: top((p) => `${formatIp(p.ip[0])}${p.ip[0] === p.ip[1] ? '' : `/${32 - Math.log2(p.ip[1] - p.ip[0] + 1)}`} · ${p.country}`),
}

/* ── Preview for the rule editor ────────────────────────────────────────────────── */

export interface RulePreview {
  total: number
  hourly: number[]
  /** Share of all requests in the window, in percent. */
  share: number
  topHost: string | null
  topCountry: string | null
}

/** What a new rule at the top of the list would have matched over the last 24 hours. */
export function previewRule(ast: RuleNode, scope: string): RulePreview {
  const hourly = new Array<number>(H).fill(0)
  const byHost = new Map<string, number>()
  const byCountry = new Map<string, number>()
  for (const p of profiles) {
    const share = shareOf({ ast, scope }, p)
    if (share === 0) continue
    const n = p.weight * share
    p.shape.forEach((s, h) => (hourly[h] += n * s))
    byHost.set(p.host, (byHost.get(p.host) ?? 0) + n)
    byCountry.set(p.country, (byCountry.get(p.country) ?? 0) + n)
  }
  // Rounded per hour and summed, the same way as the rules table, so the figures agree.
  const rounded = hourly.map(Math.round)
  const total = rounded.reduce((a, b) => a + b, 0)
  const lead = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
  const country = lead(byCountry)
  return {
    total,
    hourly: rounded,
    share: (total / TOTALS.requests) * 100,
    topHost: lead(byHost),
    topCountry: country ? (COUNTRIES[country] ?? country) : null,
  }
}

/* ── Editor options ─────────────────────────────────────────────────────────────── */

export const ACTION_OPTIONS = (Object.keys(ACTIONS) as RuleAction[]).map((value) => ({ value, label: ACTIONS[value].label }))

export const SCOPE_OPTIONS = [
  { value: 'all', label: 'All hostnames', description: 'Every hostname in the zone' },
  { value: 'app.selaras.id', label: 'app.selaras.id', description: 'Web banking' },
  { value: 'api.selaras.id', label: 'api.selaras.id', description: 'Mobile and partner APIs' },
  { value: 'login.selaras.id', label: 'login.selaras.id', description: 'Sign-in and MFA' },
]

export const NEW_RULE_EXAMPLE = {
  name: 'Block proxies from the 2 Nov sign-in wave',
  expression: 'http.path == "/session" and ip.src in {198.51.100.140/31 198.51.100.160/31}',
  action: 'block' as RuleAction,
  scope: 'login.selaras.id',
}

export const CURRENT_USER = 'Rizky Pratama'
