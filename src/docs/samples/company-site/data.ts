/**
 * 21 Strive's site. Copy is plain and modest: what the company builds, for whom, and how to
 * join. Figures carry their period and source in the footnote under them.
 */

export const nav = ['Products', 'Services', 'Rapi', 'Careers', 'Company']

export interface Offer {
  index: string
  kind: 'Product' | 'Service' | 'Design system'
  title: string
  body: string
  meta: string
}

export const offers: Offer[] = [
  {
    index: '01',
    kind: 'Product',
    title: 'Ledger',
    body: 'A double-entry ledger for wallets, fees and settlements. Every balance is the sum of its entries, and every entry has a reason.',
    meta: 'Double entry · IDR, USD, SGD',
  },
  {
    index: '02',
    kind: 'Product',
    title: 'Payments',
    body: 'Payment links, virtual accounts and disbursements, connected to licensed partner banks and reconciled every night.',
    meta: 'Virtual accounts · QRIS · Payouts',
  },
  {
    index: '03',
    kind: 'Product',
    title: 'Scheduling',
    body: 'Bookings, resources and queues for service businesses, with reminders that go out in the customer’s own time zone.',
    meta: 'Calendars · Queues · Reminders',
  },
  {
    index: '04',
    kind: 'Design system',
    title: 'Rapi',
    body: 'The design language and Vue component library behind every 21 Strive screen, from the ledger console to this page.',
    meta: 'Vue 3 · 60 components · 15 charts',
  },
  {
    index: '05',
    kind: 'Service',
    title: 'Product engineering',
    body: 'A small team that designs, builds and runs software alongside your operators, from the first interview to the on-call rota.',
    meta: 'Discovery · Build · Run',
  },
  {
    index: '06',
    kind: 'Service',
    title: 'Platform operations',
    body: 'Infrastructure as code, observability and incident response for systems that move money and cannot stop at night.',
    meta: 'Infrastructure · Monitoring · On-call',
  },
]

export const figures = [
  { label: 'Products in production', value: 4, note: '¹' },
  { label: 'API availability', value: 99.97, decimals: 2, suffix: '%', note: '²' },
  { label: 'Median API response', value: 38, unit: 'ms', note: '³' },
  { label: 'Rapi components', value: 60, note: '⁴' },
]

export const footnotes = [
  '¹ Ledger, Payments, Scheduling and Rapi, as of 31 Oct 2026.',
  '² Successful responses over all requests, 03 Aug – 31 Oct 2026.',
  '³ Server time at the edge, October 2026.',
  '⁴ Components and charts in Rapi 0.2.',
]

export type Team = 'Engineering' | 'Design' | 'Operations'

export interface Role {
  id: string
  title: string
  team: Team
  place: string
  type: string
  posted: string
  summary: string
  duties: string[]
}

export const roles: Role[] = [
  {
    id: 'ENG-24',
    title: 'Senior backend engineer, ledger',
    team: 'Engineering',
    place: 'Remote, Indonesia',
    type: 'Full time',
    posted: '28 Oct 2026',
    summary: 'Own the ledger service: entries, balances and the nightly reconciliation with partner banks.',
    duties: ['Design schema changes that never lose an entry', 'Keep p99 under 150 ms as volume grows', 'Join the on-call rota, one week in six'],
  },
  {
    id: 'ENG-27',
    title: 'Site reliability engineer',
    team: 'Engineering',
    place: 'Jakarta, hybrid',
    type: 'Full time',
    posted: '21 Oct 2026',
    summary: 'Run the platform the products stand on: infrastructure as code, alerts that mean something, calm incidents.',
    duties: ['Own the deploy pipeline and its rollbacks', 'Write the runbooks you would want at 03:00', 'Cut noisy alerts by half'],
  },
  {
    id: 'ENG-29',
    title: 'Frontend engineer, Vue',
    team: 'Engineering',
    place: 'Remote, Indonesia',
    type: 'Full time',
    posted: '14 Oct 2026',
    summary: 'Build operator consoles in Vue 3 with Rapi, and send improvements back into the component library.',
    duties: ['Ship screens that hold up at 375 px and at 2560 px', 'Keep every chart readable without colour', 'Review accessibility on each pull request'],
  },
  {
    id: 'DES-08',
    title: 'Product designer, Rapi',
    team: 'Design',
    place: 'Jakarta, hybrid',
    type: 'Full time',
    posted: '30 Oct 2026',
    summary: 'Shape the design language itself: tokens, components, charts and the documentation that explains them.',
    duties: ['Design new components with engineering, not after it', 'Keep DESIGN.md the source of truth', 'Run a monthly review of every sample screen'],
  },
  {
    id: 'DES-09',
    title: 'Technical writer',
    team: 'Design',
    place: 'Remote, Indonesia',
    type: 'Contract, 6 months',
    posted: '09 Oct 2026',
    summary: 'Write the docs operators and developers read first: guides, API references and release notes.',
    duties: ['Rewrite the ledger API reference', 'Keep the changelog plain and specific', 'Edit product copy for clarity'],
  },
  {
    id: 'OPS-05',
    title: 'Payments operations analyst',
    team: 'Operations',
    place: 'Jakarta, on site',
    type: 'Full time',
    posted: '02 Nov 2026',
    summary: 'Watch settlements, chase exceptions with partner banks and turn what you learn into product changes.',
    duties: ['Clear the daily exception queue by 11:00 WIB', 'Report settlement health every Monday', 'Write the specs for the tools you need'],
  },
]

export const footer = [
  { title: 'Products', links: ['Ledger', 'Payments', 'Scheduling', 'Rapi'] },
  { title: 'Company', links: ['About', 'Careers', 'Press kit', 'Contact'] },
  { title: 'Resources', links: ['Rapi docs', 'Status', 'Security', 'Changelog'] },
  { title: 'Contact', links: ['hello@21strive.com', 'careers@21strive.com', '+62 21 3000 2121'] },
]

/** Requests per minute on the API over the last 12 hours, thousands; for the Rapi specimen. */
export const traffic = [18.2, 17.6, 16.9, 15.8, 15.1, 14.9, 16.4, 19.8, 24.6, 28.9, 31.2, 30.4]
export const trafficLabels = ['03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00']
