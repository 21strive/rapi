/**
 * 21 Strive status page. Ninety days to 3 Nov 2026, times in UTC written as Zulu (04:38Z).
 * The screen's clock reads 04:47Z, the same moment as the other developer-platform samples.
 */

export type DayState = 'ok' | 'maintenance' | 'degraded' | 'partial' | 'major' | 'none'
export type ComponentState = 'operational' | 'degraded' | 'partial' | 'major'

export interface Day {
  date: string
  state: DayState
  /** Minutes the component was impaired that day. */
  minutes: number
  note?: string
}

export interface Component {
  id: string
  name: string
  description: string
  state: ComponentState
  days: Day[]
}

export interface Group {
  id: string
  name: string
  components: Component[]
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const dayLabel = (i: number) => {
  const d = new Date(Date.UTC(2026, 10, 3 - (89 - i)))
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}
/** Index of a date in the 90-day window (89 is today, 3 Nov 2026). */
const at = (month: number, date: number) => 89 - Math.round((Date.UTC(2026, 10, 3) - Date.UTC(2026, month, date)) / 86_400_000)

interface Event {
  i: number
  state: Exclude<DayState, 'ok' | 'none'>
  minutes: number
  note: string
}

function days(events: Event[], since?: number): Day[] {
  return Array.from({ length: 90 }, (_, i) => {
    if (since != null && i < since) return { date: dayLabel(i), state: 'none', minutes: 0, note: 'Not launched yet' }
    const e = events.find((x) => x.i === i)
    return e ? { date: dayLabel(i), state: e.state, minutes: e.minutes, note: e.note } : { date: dayLabel(i), state: 'ok', minutes: 0 }
  })
}

export const groups: Group[] = [
  {
    id: 'api',
    name: 'API',
    components: [
      {
        id: 'rest',
        name: 'REST API',
        description: 'api.21strive.example, every /v1 endpoint',
        state: 'operational',
        days: days([
          { i: at(9, 28), state: 'partial', minutes: 38, note: 'Elevated API error rate' },
          { i: at(8, 16), state: 'degraded', minutes: 22, note: 'Slow responses from jkt1' },
        ]),
      },
      {
        id: 'auth',
        name: 'Authentication',
        description: 'API keys, OAuth tokens and signing',
        state: 'operational',
        days: days([{ i: at(9, 28), state: 'degraded', minutes: 31, note: 'Token checks slowed by the database failover' }]),
      },
    ],
  },
  {
    id: 'webhooks',
    name: 'Webhooks',
    components: [
      {
        id: 'delivery',
        name: 'Event delivery',
        description: 'Webhook events to merchant endpoints',
        state: 'degraded',
        days: days([
          { i: 89, state: 'degraded', minutes: 56, note: 'Delayed webhook deliveries, ongoing' },
          { i: at(9, 28), state: 'degraded', minutes: 40, note: 'Events queued during the API incident' },
          { i: at(8, 22), state: 'partial', minutes: 18, note: 'Deliveries paused in sin1' },
        ]),
      },
      {
        id: 'logs',
        name: 'Delivery logs',
        description: 'Event history and replay',
        state: 'operational',
        days: days([]),
      },
    ],
  },
  {
    id: 'payments',
    name: 'Payments',
    components: [
      {
        id: 'cards',
        name: 'Card acquiring',
        description: 'Visa, Mastercard and JCB in IDR and SGD',
        state: 'operational',
        days: days([{ i: at(9, 28), state: 'partial', minutes: 38, note: 'Elevated API error rate' }]),
      },
      {
        id: 'qris',
        name: 'QRIS',
        description: 'Dynamic and static QR payments',
        state: 'operational',
        days: days([
          { i: at(9, 21), state: 'maintenance', minutes: 40, note: 'Scheduled maintenance of the settlement switch' },
          { i: at(8, 3), state: 'major', minutes: 12, note: 'QR charges failed at the switch' },
        ]),
      },
      {
        id: 'va',
        name: 'Virtual accounts',
        description: 'Bank transfer to a virtual account',
        state: 'operational',
        days: days([{ i: at(9, 9), state: 'degraded', minutes: 25, note: 'One bank confirming late' }], at(8, 8)),
      },
      {
        id: 'payouts',
        name: 'Disbursements',
        description: 'Payouts to bank accounts and e-wallets',
        state: 'operational',
        days: days([
          { i: at(9, 2), state: 'partial', minutes: 132, note: 'Disbursements delayed at one partner bank' },
          { i: at(8, 25), state: 'degraded', minutes: 44, note: 'Payout batch ran late' },
        ]),
      },
    ],
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    components: [
      {
        id: 'web',
        name: 'Web dashboard',
        description: 'dashboard.21strive.example',
        state: 'operational',
        days: days([
          { i: at(9, 14), state: 'partial', minutes: 47, note: 'Dashboard sign-in failures' },
          { i: at(7, 29), state: 'degraded', minutes: 15, note: 'Reports loading slowly' },
        ]),
      },
      {
        id: 'reports',
        name: 'Reports and exports',
        description: 'Settlement reports and CSV exports',
        state: 'operational',
        days: days([{ i: at(9, 1), state: 'degraded', minutes: 96, note: 'Month-end exports queued' }]),
      },
    ],
  },
]

/** Uptime counts outages in full and partial outages at a third; slow is not down. */
export function uptime(c: Component, span = 90): number {
  const live = c.days.slice(-span).filter((d) => d.state !== 'none')
  const lost = live.reduce((s, d) => s + (d.state === 'major' ? d.minutes : d.state === 'partial' ? d.minutes / 3 : 0), 0)
  return (1 - lost / (live.length * 1440)) * 100
}

export const STATE_WORD: Record<DayState, string> = {
  ok: 'No incidents',
  maintenance: 'Scheduled maintenance',
  degraded: 'Degraded performance',
  partial: 'Partial outage',
  major: 'Major outage',
  none: 'No data',
}

export const COMPONENT_WORD: Record<ComponentState, string> = {
  operational: 'Operational',
  degraded: 'Degraded',
  partial: 'Partial outage',
  major: 'Major outage',
}

/* ── Response times: 24 hourly points, 05:00Z yesterday to the 04:00Z hour now running ── */

export const HOURS = Array.from({ length: 24 }, (_, i) => `${String((5 + i) % 24).padStart(2, '0')}:00`)

function wave(base: number, swing: number, seed: number) {
  return HOURS.map((_, i) => {
    const day = Math.sin(((i + 2) / 24) * Math.PI * 2) * swing
    const noise = Math.sin(i * 2.7 + seed) * swing * 0.35 + Math.cos(i * 1.3 + seed * 2) * swing * 0.2
    return Math.round(base + day + noise)
  })
}

/** Delivery delay in seconds: a few seconds as usual, then the 03:51Z incident. */
const webhookDelay = wave(4, 1.2, 3).map((v, i) => (i === 22 ? 186 : i === 23 ? 241 : Math.max(2, v)))

export const latency = {
  api: { label: 'REST API', unit: 'ms', series: 'p95 response', values: wave(182, 34, 1), slo: 300, note: 'p95 of all /v1 requests, measured from Jakarta, Singapore and Tokyo' },
  dashboard: { label: 'Dashboard', unit: 'ms', series: 'p95 page load', values: wave(640, 90, 5), slo: 1500, note: 'p95 time to interactive for the overview page' },
  webhooks: { label: 'Webhooks', unit: 's', series: 'p95 delivery delay', values: webhookDelay, slo: 60, note: 'p95 time from event to first delivery attempt' },
}

/* ── Incidents ───────────────────────────────────────────────────────────── */

export type UpdateKind = 'Investigating' | 'Identified' | 'Monitoring' | 'Resolved' | 'Scheduled' | 'Completed'

export interface Incident {
  id: string
  title: string
  date: string
  components: string[]
  impact: ComponentState | 'maintenance'
  duration: string
  updates: { time: string; kind: UpdateKind; body: string }[]
}

export const incidents: Incident[] = [
  {
    id: 'inc-1103',
    title: 'Delayed webhook deliveries',
    date: '3 Nov 2026',
    components: ['Event delivery'],
    impact: 'degraded',
    duration: 'Ongoing since 03:51Z',
    updates: [
      {
        time: '04:38Z',
        kind: 'Monitoring',
        body: 'Delivery workers in jkt1 are back at full capacity. The backlog is down from 41,200 to 6,800 events and falling; some events still arrive up to 4 minutes late.',
      },
      {
        time: '04:12Z',
        kind: 'Identified',
        body: 'A configuration change capped delivery workers in jkt1 at half capacity. We rolled it back at 04:09Z and are draining the queue.',
      },
      {
        time: '03:51Z',
        kind: 'Investigating',
        body: 'Webhook events reach some endpoints up to 9 minutes late. Payments and the API are not affected. Events are queued, not lost.',
      },
    ],
  },
  {
    id: 'inc-1028',
    title: 'Elevated API error rate',
    date: '28 Oct 2026',
    components: ['REST API', 'Authentication', 'Card acquiring'],
    impact: 'partial',
    duration: '38 min',
    updates: [
      { time: '09:41Z', kind: 'Resolved', body: 'Error rates have been normal since 09:33Z. Between 08:55Z and 09:33Z, 0.8% of API requests returned 503. Retried requests succeeded.' },
      { time: '09:20Z', kind: 'Monitoring', body: 'The database failover finished at 09:17Z and error rates are falling.' },
      { time: '09:02Z', kind: 'Identified', body: 'A primary database node in jkt1 stopped answering. Failover to the standby has started.' },
      { time: '08:58Z', kind: 'Investigating', body: 'Some API requests return 503. We are looking into it.' },
    ],
  },
  {
    id: 'inc-1021',
    title: 'Scheduled maintenance of the QRIS settlement switch',
    date: '21 Oct 2026',
    components: ['QRIS'],
    impact: 'maintenance',
    duration: '40 min',
    updates: [
      { time: '17:40Z', kind: 'Completed', body: 'Maintenance is complete. QR charges created during the window settled at 17:52Z.' },
      { time: '17:00Z', kind: 'Scheduled', body: 'QR charges stay available; settlement of new charges waits until the window closes.' },
    ],
  },
  {
    id: 'inc-1014',
    title: 'Dashboard sign-in failures',
    date: '14 Oct 2026',
    components: ['Web dashboard'],
    impact: 'partial',
    duration: '47 min',
    updates: [
      { time: '02:31Z', kind: 'Resolved', body: 'Sign-in works for everyone again. Sessions that were active before 01:44Z were not affected.' },
      { time: '02:05Z', kind: 'Identified', body: 'An expired certificate on the session service rejected new sign-ins. A new certificate is deployed.' },
      { time: '01:44Z', kind: 'Investigating', body: 'Some users cannot sign in to the dashboard.' },
    ],
  },
]
