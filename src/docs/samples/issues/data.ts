/**
 * Issue tracker · team Platform (STR) at 21 Strive, cycle 42 (3–16 Nov 2026). Times are WIB.
 * Several issues point at the other developer-platform samples: STR-1204 is the FX quote cache
 * whose deploy a41c9e2 fails at Test, STR-1198 is the webhook retry build c2d8f10.
 */

export type StatusId = 'backlog' | 'todo' | 'progress' | 'review' | 'done'
export type PriorityId = 0 | 1 | 2 | 3 | 4 // none, urgent, high, medium, low

export interface Activity {
  id: string
  time: string
  title: string
  body?: string
  meta?: string
  tone?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger'
}

export interface Issue {
  id: string
  title: string
  status: StatusId
  priority: PriorityId
  assignee: string | null
  labels: string[]
  estimate: number | null
  /** Short date, WIB. */
  updated: string
  project: string
  description: string[]
  activity: Activity[]
}

export const ME = 'Nadia Rahman'

export const people = ['Nadia Rahman', 'Dimas Pratama', 'Kevin Tan', 'Ayu Lestari', 'Sari Wulandari', 'Rina Hartono']

export const statuses: { id: StatusId; label: string }[] = [
  { id: 'progress', label: 'In progress' },
  { id: 'review', label: 'In review' },
  { id: 'todo', label: 'Todo' },
  { id: 'backlog', label: 'Backlog' },
  { id: 'done', label: 'Done' },
]

export const statusLabel = (id: StatusId) => statuses.find((s) => s.id === id)!.label

export const priorities: { id: PriorityId; label: string }[] = [
  { id: 1, label: 'Urgent' },
  { id: 2, label: 'High' },
  { id: 3, label: 'Medium' },
  { id: 4, label: 'Low' },
  { id: 0, label: 'No priority' },
]

export const priorityLabel = (id: PriorityId) => priorities.find((p) => p.id === id)!.label

/** Labels that carry a lamp colour; everything else is neutral. */
export const labelTone: Record<string, 'danger' | 'warning' | 'brand' | 'neutral'> = {
  bug: 'danger',
  security: 'warning',
  edge: 'brand',
}

export const CYCLE = { name: 'Cycle 42', range: '3–16 Nov', scope: 41, done: 17, issues: 20, closed: 7, daysLeft: 13 }

type Seed = Omit<Issue, 'activity' | 'description'> & { description?: string[]; activity?: Activity[] }

const seeds: Seed[] = [
  {
    id: 'STR-1204',
    title: 'Edge cache serves FX quotes past the 30 s TTL',
    status: 'progress',
    priority: 2,
    assignee: 'Dimas Pratama',
    labels: ['edge', 'bug'],
    estimate: 3,
    updated: '11:31',
    project: 'Edge cache v2',
    description: [
      'Quotes for USD/IDR stay cached past their 30-second TTL when the origin answers with max-age=30 and stale-while-revalidate=60. The edge then serves the old quote for up to 90 s, long enough for a merchant to lock a rate that has already moved.',
      'The new case in quotes.spec.ts reproduces it, which is why deploy a41c9e2 fails at Test. The fix is to drop stale-while-revalidate on /v1/fx/quotes and let the edge revalidate on expiry.',
    ],
    activity: [
      { id: 'a1', time: '2 Nov 09:14', title: 'Ayu Lestari opened the issue', meta: 'Ayu Lestari' },
      { id: 'a2', time: '2 Nov 09:20', title: 'Priority set to High', meta: 'Ayu Lestari', tone: 'warning' },
      { id: 'a3', time: '2 Nov 10:02', title: 'Moved from Todo to In progress', meta: 'Dimas Pratama', tone: 'brand' },
      {
        id: 'a4',
        time: '2 Nov 15:41',
        title: 'Comment',
        body: 'Seen on two merchants in Surabaya this afternoon. Both locked USD/IDR at 16,412 while the market was at 16,455.',
        meta: 'Sari Wulandari',
      },
      {
        id: 'a5',
        time: '3 Nov 11:31',
        title: 'Linked a41c9e2 · Cache FX quotes at the edge for 30 s',
        body: 'Deployment dpl_7Zx9wRt failed at Test: 1 of 312 tests.',
        meta: 'Dimas Pratama',
        tone: 'danger',
      },
    ],
  },
  { id: 'STR-1198', title: 'Webhook retries: add jitter and stop after 6 attempts', status: 'progress', priority: 3, assignee: 'Kevin Tan', labels: ['webhooks'], estimate: 2, updated: '11:45', project: 'Webhooks' },
  { id: 'STR-1215', title: 'DNS: show propagation for records changed in the last hour', status: 'progress', priority: 3, assignee: 'Ayu Lestari', labels: ['dns'], estimate: 3, updated: '10:12', project: 'DNS' },
  { id: 'STR-1187', title: 'Return rate-limit headers with every 429 from /v1/payments', status: 'progress', priority: 2, assignee: 'Sari Wulandari', labels: ['api'], estimate: 2, updated: '09:58', project: 'Public API' },
  { id: 'STR-1221', title: 'Status page: 90-day uptime strip for each component', status: 'progress', priority: 4, assignee: 'Rina Hartono', labels: ['status-page'], estimate: 5, updated: 'Yesterday', project: 'Status page' },

  { id: 'STR-1192', title: 'Settlement webhook answers 502 under load', status: 'review', priority: 1, assignee: 'Dimas Pratama', labels: ['webhooks', 'bug'], estimate: 5, updated: '11:02', project: 'Webhooks' },
  { id: 'STR-1176', title: 'Roll keys without downtime: keep the old secret for 24 h', status: 'review', priority: 2, assignee: ME, labels: ['api-keys', 'security'], estimate: 3, updated: '10:40', project: 'Public API' },
  { id: 'STR-1209', title: 'Analytics: weekday by hour heatmap in WIB', status: 'review', priority: 4, assignee: 'Kevin Tan', labels: ['analytics'], estimate: 2, updated: 'Yesterday', project: 'Analytics' },

  { id: 'STR-1219', title: 'Restricted keys: allow calls only from listed IP ranges', status: 'todo', priority: 2, assignee: 'Sari Wulandari', labels: ['api-keys', 'security'], estimate: 5, updated: '2 Nov', project: 'Public API' },
  { id: 'STR-1230', title: 'Purge by cache tag after a deploy instead of the whole zone', status: 'todo', priority: 3, assignee: null, labels: ['edge', 'perf'], estimate: 5, updated: '2 Nov', project: 'Edge cache v2' },
  { id: 'STR-1224', title: 'Zone export: redact origins of proxied records', status: 'todo', priority: 3, assignee: 'Rina Hartono', labels: ['dns', 'security'], estimate: 2, updated: '1 Nov', project: 'DNS' },
  { id: 'STR-1228', title: 'Warn when no CAA record allows the edge certificate issuer', status: 'todo', priority: 4, assignee: 'Ayu Lestari', labels: ['dns'], estimate: 1, updated: '1 Nov', project: 'DNS' },
  { id: 'STR-1226', title: 'Dashboard: keyboard shortcut sheet on ?', status: 'todo', priority: 4, assignee: ME, labels: ['dashboard'], estimate: 1, updated: '31 Oct', project: 'Dashboard' },
  { id: 'STR-1213', title: 'Deploy previews: post the preview URL on merge requests', status: 'todo', priority: 4, assignee: 'Kevin Tan', labels: ['deploy'], estimate: 2, updated: '30 Oct', project: 'Deploy' },

  { id: 'STR-1233', title: 'Edge functions: allow 30 s for CSV exports', status: 'backlog', priority: 3, assignee: null, labels: ['edge'], estimate: 3, updated: '30 Oct', project: 'Edge cache v2' },
  { id: 'STR-1238', title: 'Import BIND files that use $INCLUDE', status: 'backlog', priority: 4, assignee: null, labels: ['dns'], estimate: 3, updated: '29 Oct', project: 'DNS' },
  { id: 'STR-1231', title: 'Audit log: show the API key in the actor column', status: 'backlog', priority: 4, assignee: null, labels: ['security'], estimate: 1, updated: '28 Oct', project: 'Public API' },
  { id: 'STR-1229', title: 'Go SDK: pass context timeouts through on every call', status: 'backlog', priority: 4, assignee: null, labels: ['sdk'], estimate: 2, updated: '27 Oct', project: 'SDKs' },
  { id: 'STR-1240', title: 'Bot score as an analytics filter', status: 'backlog', priority: 0, assignee: null, labels: ['analytics'], estimate: null, updated: '27 Oct', project: 'Analytics' },
  { id: 'STR-1236', title: 'Status page: subscribe to one component', status: 'backlog', priority: 0, assignee: null, labels: ['status-page'], estimate: 2, updated: '26 Oct', project: 'Status page' },

  { id: 'STR-1183', title: 'Show settlement batch totals in IDR', status: 'done', priority: 3, assignee: 'Sari Wulandari', labels: ['dashboard'], estimate: 2, updated: '2 Nov', project: 'Dashboard' },
  { id: 'STR-1168', title: 'Fix rounding of IDR amounts under Rp 1.000', status: 'done', priority: 1, assignee: 'Sari Wulandari', labels: ['bug'], estimate: 1, updated: '2 Nov', project: 'Dashboard' },
  { id: 'STR-1171', title: 'Merchant onboarding: KTP upload step', status: 'done', priority: 2, assignee: 'Ayu Lestari', labels: ['onboarding'], estimate: 5, updated: '31 Oct', project: 'Onboarding' },
  { id: 'STR-1160', title: 'Payouts table: sticky header and totals row', status: 'done', priority: 4, assignee: 'Dimas Pratama', labels: ['dashboard'], estimate: 1, updated: '29 Oct', project: 'Dashboard' },
  { id: 'STR-1158', title: 'Poll QR charge status every 3 s', status: 'done', priority: 3, assignee: 'Rina Hartono', labels: ['payments'], estimate: 2, updated: '28 Oct', project: 'Payments' },
  { id: 'STR-1151', title: 'Turn on DNSSEC for lintang.example', status: 'done', priority: 3, assignee: 'Kevin Tan', labels: ['dns'], estimate: 2, updated: '27 Oct', project: 'DNS' },
]

/** Issues without their own story get a short, plausible history from their fields. */
function history(s: Seed): Activity[] {
  const opener = s.assignee && s.assignee !== ME ? 'Ayu Lestari' : 'Dimas Pratama'
  const list: Activity[] = [{ id: `${s.id}-1`, time: '27 Oct 10:05', title: `${opener} opened the issue`, meta: opener }]
  if (s.assignee) list.push({ id: `${s.id}-2`, time: '28 Oct 09:30', title: `Assigned to ${s.assignee}`, meta: opener })
  if (s.status !== 'backlog') list.push({ id: `${s.id}-3`, time: '3 Nov 09:00', title: 'Added to Cycle 42', meta: 'Nadia Rahman', tone: 'brand' })
  if (s.status === 'progress' || s.status === 'review' || s.status === 'done')
    list.push({ id: `${s.id}-4`, time: `${s.updated === 'Yesterday' ? '2 Nov' : '3 Nov'} 10:00`, title: `Moved to ${statusLabel(s.status)}`, meta: s.assignee ?? opener, tone: s.status === 'done' ? 'success' : 'brand' })
  return list
}

const notes: Record<string, string[]> = {
  'STR-1198': [
    'Failed deliveries retry at fixed 30 s steps today, so a merchant endpoint that comes back up gets every queued event in the same second. Spread retries with full jitter between 10 s and 10 min and give up after the sixth attempt.',
    'Build c2d8f10 is on preview. Check the retry schedule in the delivery log before it goes to production.',
  ],
  'STR-1215': [
    'A record changed in the last hour gets a Propagating badge and the resolver check opens on it. Ten public resolvers, stale answers in amber with the old value next to them.',
  ],
  'STR-1187': [
    'Clients hitting the payments limit get a bare 429. Send X-RateLimit-Limit, X-RateLimit-Remaining and Retry-After on every response from /v1/payments, and document them in the API reference.',
  ],
  'STR-1221': [
    'Ninety squares per component, one per day, coloured by the worst state that day. Hover or arrow keys show the date and the minutes of downtime; the uptime figure sits at the end of the row.',
  ],
  'STR-1192': [
    'Under the 11:00 settlement burst the webhook handler holds a database connection while it calls the merchant, and the pool of 20 runs dry. Requests queue for 10 s and the edge answers 502.',
    'The fix releases the connection before the outbound call. Load test at 3× the burst before merging.',
  ],
  'STR-1176': [
    'Rolling a key replaces the secret at once and breaks every server still holding the old one. Keep the old secret valid for 24 h after a roll, show its expiry next to the key, and email the owner an hour before it stops working.',
  ],
  'STR-1209': ['Traffic by weekday and hour, bucketed in WIB rather than UTC so the evening peak lands on 19:00–21:00 where merchants expect it.'],
  'STR-1219': ['A restricted key can list the IP ranges it may be used from. Calls from anywhere else get a 403 with the code key_ip_not_allowed and show up in the audit log.'],
  'STR-1230': ['Every production deploy purges the whole zone, and the cache hit ratio on lintang.example drops from 63% to 34% for an hour. Tag assets by build and purge only the tags the deploy replaced.'],
  'STR-1224': ['The BIND export lists origin addresses of proxied records, which defeats the point of the proxy. Write the edge address instead and add the origin only behind an explicit option.'],
  'STR-1228': ['If a zone has CAA records and none of them allows the edge certificate issuer, renewal will fail in up to 30 days. Warn on the DNS page and in the weekly zone report.'],
  'STR-1226': ['Press ? anywhere in the dashboard to see every shortcut in one sheet, grouped by page.'],
  'STR-1213': ['When a preview is ready, post its URL on the merge request with the commit, the build time and a link to the log.'],
  'STR-1233': ['Settlement exports for large merchants take 14 to 22 s to render and the 10 s limit cuts them off. Allow 30 s for routes under /api/settlements/export.'],
  'STR-1238': ['Zone files exported from older registrars use $INCLUDE for the mail records. Resolve includes from the same upload and list any file that is missing.'],
  'STR-1231': ['When an action came from an API key, the audit log shows the key owner. Show the key name and its prefix instead, so a leaked key is easy to trace.'],
  'STR-1229': ['Every SDK call should take a context and honour its deadline, including retries. Today retries ignore the caller timeout.'],
  'STR-1240': ['Add the bot score as a filter chip on the analytics page, with ranges for likely human, likely automated and verified bots.'],
  'STR-1236': ['Subscribers can choose the components they care about instead of getting every incident.'],
  'STR-1183': ['Settlement batches show their totals in IDR with the batch count and the fee line. Shipped in 7f3c2a1.'],
  'STR-1168': ['Amounts under Rp 1.000 were rounded half-down on the receipt and half-up in the ledger. Both round half-up now, matching the bank file.'],
  'STR-1171': ['New merchants upload a KTP photo during onboarding. The image is checked for size and blur before it is sent for review. Shipped in 5d8e21b.'],
  'STR-1160': ['The payouts table keeps its header in view while scrolling and adds a totals row for the filtered range.'],
  'STR-1158': ['The QR charge screen polls the charge every 3 s until it is paid or expires, then stops.'],
  'STR-1151': ['DNSSEC is on for lintang.example with algorithm 13. The DS record is published at the registrar.'],
}

function describe(s: Seed): string[] {
  return notes[s.id] ?? [`${s.title}. Tracked in ${s.project}.`]
}

export const initialIssues: Issue[] = seeds.map((s) => ({
  ...s,
  description: s.description ?? describe(s),
  activity: s.activity ?? history(s),
}))

export const nextIssueNumber = 1241
