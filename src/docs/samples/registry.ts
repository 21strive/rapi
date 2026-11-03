/**
 * The sample screens. Each one is a full-bleed page built only from Rapi components and the
 * tokens, and opens at /samples/<id>. Order here is the order in the gallery.
 */
import type { Component } from 'vue'

export type SampleGroup =
  | 'Banking'
  | 'Security & defense'
  | 'Aerospace & operations'
  | 'Instruments'
  | 'Developer platform'
  | 'Workspace'
  | 'Brand & editorial'

export interface Sample {
  id: string
  /** Two-digit running number, "01". */
  index: string
  title: string
  group: SampleGroup
  /** One sentence: what is on the screen. */
  summary: string
  /** The theme the screen was designed in. The toolbar can still switch it. */
  theme: 'light' | 'dark'
  /** The screen handles ⌘K itself (its own command palette). */
  ownsModK?: boolean
  load: () => Promise<{ default: Component }>
}

export const sampleGroups: SampleGroup[] = [
  'Banking',
  'Security & defense',
  'Aerospace & operations',
  'Instruments',
  'Developer platform',
  'Workspace',
  'Brand & editorial',
]

export const samples: Sample[] = [
  {
    id: 'treasury',
    index: '01',
    title: "Treasury",
    group: 'Banking',
    summary: "Cash position across accounts and currencies, a 13-week liquidity forecast with the forecast hatched, FX exposure against limits, and the payments due this week.",
    theme: 'light',
    load: () => import('./treasury/Treasury.vue'),
  },
  {
    id: 'trading-terminal',
    index: '02',
    title: "Markets terminal",
    group: 'Banking',
    summary: "Candles with volume for one instrument, order-book depth, positions with P&L, a watchlist of sparklines and an order ticket.",
    theme: 'dark',
    load: () => import('./trading-terminal/TradingTerminal.vue'),
  },
  {
    id: 'ledger',
    index: '03',
    title: "Ledger & reconciliation",
    group: 'Banking',
    summary: "A double-entry journal, the day’s net flows as a waterfall, settlement batches by status and the unmatched items left to clear.",
    theme: 'light',
    load: () => import('./ledger/Ledger.vue'),
  },
  {
    id: 'card-controls',
    index: '04',
    title: "Corporate cards",
    group: 'Banking',
    summary: "Card inventory, team spend against limits, merchant categories, and one card in detail with freeze and limit controls.",
    theme: 'light',
    load: () => import('./card-controls/CardControls.vue'),
  },
  {
    id: 'credit-risk',
    index: '05',
    title: "Credit risk",
    group: 'Banking',
    summary: "Exposure against probability of default, a rating-migration heatmap, concentration limits and the watchlist.",
    theme: 'light',
    load: () => import('./credit-risk/CreditRisk.vue'),
  },
  {
    id: 'mobile-banking',
    index: '06',
    title: "Mobile banking",
    group: 'Banking',
    summary: "Three phone screens: balance and activity, a transfer with its review step, and the receipt.",
    theme: 'light',
    load: () => import('./mobile-banking/MobileBanking.vue'),
  },
  {
    id: 'soc-console',
    index: '07',
    title: "Security operations",
    group: 'Security & defense',
    summary: "Alert queue by severity, event rate against its threshold, a technique heatmap, analyst load and live lamps.",
    theme: 'dark',
    load: () => import('./soc-console/SocConsole.vue'),
  },
  {
    id: 'access-review',
    index: '08',
    title: "Access review",
    group: 'Security & defense',
    summary: "A role-by-permission matrix, privileged sessions, MFA coverage and the quarterly certification in progress.",
    theme: 'light',
    load: () => import('./access-review/AccessReview.vue'),
  },
  {
    id: 'audit-log',
    index: '09',
    title: "Audit trail",
    group: 'Security & defense',
    summary: "A filterable event log with mono timestamps and an event drawer showing the change as before and after.",
    theme: 'light',
    load: () => import('./audit-log/AuditLog.vue'),
  },
  {
    id: 'radar-ops',
    index: '10',
    title: "Air picture",
    group: 'Security & defense',
    summary: "A radar scope with labelled tracks, the track table, sensor health and the engagement log.",
    theme: 'dark',
    load: () => import('./radar-ops/RadarOps.vue'),
  },
  {
    id: 'vulnerability',
    index: '11',
    title: "Vulnerability management",
    group: 'Security & defense',
    summary: "Findings by severity band, age against score, the asset table and patch deadlines as bullet graphs.",
    theme: 'light',
    load: () => import('./vulnerability/Vulnerability.vue'),
  },
  {
    id: 'firewall',
    index: '12',
    title: "Edge firewall",
    group: 'Security & defense',
    summary: "Rules with their match counts, blocked requests over time, top sources and a rule editor with a live preview.",
    theme: 'light',
    load: () => import('./firewall/Firewall.vue'),
  },
  {
    id: 'mission-control',
    index: '13',
    title: "Launch telemetry",
    group: 'Aerospace & operations',
    summary: "A mission clock in pixel digits, altitude and velocity readouts, the flight-event timeline, trajectory and subsystem lamps.",
    theme: 'dark',
    load: () => import('./mission-control/MissionControl.vue'),
  },
  {
    id: 'constellation',
    index: '14',
    title: "Satellite constellation",
    group: 'Aerospace & operations',
    summary: "Fleet health, ground-station passes on a Gantt, battery and thermal sparklines, and link margin on a dial.",
    theme: 'dark',
    load: () => import('./constellation/Constellation.vue'),
  },
  {
    id: 'static-fire',
    index: '15',
    title: "Engine test stand",
    group: 'Aerospace & operations',
    summary: "Chamber pressure and thrust traces, turbopump dials, valve states, abort limits and the test sequence.",
    theme: 'dark',
    load: () => import('./static-fire/StaticFire.vue'),
  },
  {
    id: 'ground-station',
    index: '16',
    title: "Ground station",
    group: 'Aerospace & operations',
    summary: "The antenna schedule, a sky plot of the next pass, signal-to-noise, the downlink queue and site weather.",
    theme: 'light',
    load: () => import('./ground-station/GroundStation.vue'),
  },
  {
    id: 'grid-ops',
    index: '17',
    title: "Grid operations",
    group: 'Aerospace & operations',
    summary: "Load against forecast, the generation mix, substation status, frequency on a dial and curtailment events.",
    theme: 'light',
    load: () => import('./grid-ops/GridOps.vue'),
  },
  {
    id: 'fleet-ops',
    index: '18',
    title: "Fleet operations",
    group: 'Aerospace & operations',
    summary: "The day’s routes on a Gantt, on-time performance, exceptions to handle and depot capacity.",
    theme: 'light',
    load: () => import('./fleet-ops/FleetOps.vue'),
  },
  {
    id: 'field-recorder',
    index: '19',
    title: "Field recorder",
    group: 'Instruments',
    summary: "Companion app for a pocket recorder: channel knobs, LED level meters, the waveform, transport and pixel time code.",
    theme: 'light',
    load: () => import('./field-recorder/FieldRecorder.vue'),
  },
  {
    id: 'sequencer',
    index: '20',
    title: "Step sequencer",
    group: 'Instruments',
    summary: "A 16-step pattern grid for eight tracks, tempo and swing knobs, the pattern bank and a pixel BPM readout.",
    theme: 'dark',
    load: () => import('./sequencer/Sequencer.vue'),
  },
  {
    id: 'sensor-lab',
    index: '21',
    title: "Sensor lab",
    group: 'Instruments',
    summary: "An air-quality station: CO₂, PM2.5 and VOC readouts, dials with limits, a 24-hour heatmap and the device fleet.",
    theme: 'light',
    load: () => import('./sensor-lab/SensorLab.vue'),
  },
  {
    id: 'edge-analytics',
    index: '22',
    title: "Edge analytics",
    group: 'Developer platform',
    summary: "Requests and bandwidth, cache hit ratio, status codes by hour, top paths and countries, under one filter row.",
    theme: 'light',
    load: () => import('./edge-analytics/EdgeAnalytics.vue'),
  },
  {
    id: 'dns',
    index: '23',
    title: "DNS records",
    group: 'Developer platform',
    summary: "Zone records with proxy switches, type badges, search, an add-record row and propagation status.",
    theme: 'light',
    load: () => import('./dns/Dns.vue'),
  },
  {
    id: 'deployments',
    index: '24',
    title: "Deployments",
    group: 'Developer platform',
    summary: "The build pipeline, its log, deployment history with status lamps and the environment spec.",
    theme: 'dark',
    load: () => import('./deployments/Deployments.vue'),
  },
  {
    id: 'issues',
    index: '25',
    title: "Issue tracker",
    group: 'Developer platform',
    summary: "Issues grouped by status with priority marks and keyboard hints, and one issue open with its activity.",
    theme: 'light',
    ownsModK: true,
    load: () => import('./issues/Issues.vue'),
  },
  {
    id: 'api-keys',
    index: '26',
    title: "API keys",
    group: 'Developer platform',
    summary: "Keys with their scopes, requests per key, a create-key dialog and a quick-start snippet.",
    theme: 'light',
    load: () => import('./api-keys/ApiKeys.vue'),
  },
  {
    id: 'status-page',
    index: '27',
    title: "Status page",
    group: 'Developer platform',
    summary: "A public status page: components with 90-day uptime strips, incident history and subscribe.",
    theme: 'light',
    load: () => import('./status-page/StatusPage.vue'),
  },
  {
    id: 'billing',
    index: '28',
    title: "Usage & billing",
    group: 'Workspace',
    summary: "Metered usage against plan quotas, invoice history, plan comparison and the payment method.",
    theme: 'light',
    load: () => import('./billing/Billing.vue'),
  },
  {
    id: 'org-settings',
    index: '29',
    title: "Organization settings",
    group: 'Workspace',
    summary: "General, members, security and danger-zone sections, using the whole form kit.",
    theme: 'light',
    load: () => import('./org-settings/OrgSettings.vue'),
  },
  {
    id: 'sign-in',
    index: '30',
    title: "Sign in & two-factor",
    group: 'Workspace',
    summary: "Sign-in, one-time code and recovery codes, beside a cobalt panel with the 21 Strive supergraphic.",
    theme: 'light',
    load: () => import('./sign-in/SignIn.vue'),
  },
  {
    id: 'onboarding',
    index: '31',
    title: "Workspace setup",
    group: 'Workspace',
    summary: "A guided setup: vertical steps, forms, a plan choice and the summary before launch.",
    theme: 'light',
    load: () => import('./onboarding/Onboarding.vue'),
  },
  {
    id: 'booking-ops',
    index: '32',
    title: "Booking operations",
    group: 'Workspace',
    summary: "Today’s bookings by resource on a Gantt, capacity by hour, the walk-in queue and revenue.",
    theme: 'light',
    load: () => import('./booking-ops/BookingOps.vue'),
  },
  {
    id: 'settlements',
    index: '33',
    title: "Settlements & KYC",
    group: 'Workspace',
    summary: "Platform balance, settlement batches, the KYC review queue with a document datasheet, and error groups.",
    theme: 'light',
    load: () => import('./settlements/Settlements.vue'),
  },
  {
    id: 'brand-book',
    index: '34',
    title: "21 Strive brand book",
    group: 'Brand & editorial',
    summary: "The 21 Strive guidelines as slides made with Rapi: logo, construction, colour, type and collateral.",
    theme: 'light',
    load: () => import('./brand-book/BrandBook.vue'),
  },
  {
    id: 'company-site',
    index: '35',
    title: "21 Strive website",
    group: 'Brand & editorial',
    summary: "A ruled-grid company site: hero over construction lines, products, figures, careers and footer.",
    theme: 'light',
    load: () => import('./company-site/CompanySite.vue'),
  },
  {
    id: 'annual-report',
    index: '36',
    title: "Annual report",
    group: 'Brand & editorial',
    summary: "A4 report spreads: editorial type, charts with footnotes and the year in key figures.",
    theme: 'light',
    load: () => import('./annual-report/AnnualReport.vue'),
  },
]

export const sampleById = (id: string) => samples.find((s) => s.id === id)
