import { archetype } from '../../kit'
import type { MoodEntry } from '../../types'
import ChargeSession from './ChargeSession.vue'
import Countdown from './Countdown.vue'
import DeliveryTracker from './DeliveryTracker.vue'
import EventStream from './EventStream.vue'
import JobProgress from './JobProgress.vue'
import LedColumns from './LedColumns.vue'
import LegProgress from './LegProgress.vue'
import LiftShaft from './LiftShaft.vue'
import LiveCaptions from './LiveCaptions.vue'
import LiveCounter from './LiveCounter.vue'
import LiveLine from './LiveLine.vue'
import LiveTally from './LiveTally.vue'
import NowPlaying from './NowPlaying.vue'
import OrderBook from './OrderBook.vue'
import PipelineLamps from './PipelineLamps.vue'
import QueuePosition from './QueuePosition.vue'
import RackLeds from './RackLeds.vue'
import RecLevel from './RecLevel.vue'
import RegionPing from './RegionPing.vue'
import Scope from './Scope.vue'
import Stopwatch from './Stopwatch.vue'
import SweepTrace from './SweepTrace.vue'
import SyncList from './SyncList.vue'
import TicketRail from './TicketRail.vue'
import WaterLevel from './WaterLevel.vue'

/* ── 01 Live counter ──────────────────────────────────────────────────────────────── */
const counter = archetype(LiveCounter, {
  name: 'Live counter',
  hint: 'Run the pointer along the columns to read a second; the pause key freezes the figure',
  why: 'A rate that changes every second is read in a look; asking for it again and again is slower.',
  tags: ['counter', 'live', 'rate', 'figure'],
})

const counters = [
  counter({
    id: 'watch-counter-gateway',
    size: '2x1',
    domain: 'devops',
    surface: 'dark',
    name: 'Requests per second',
    props: { label: 'api-gateway · ap-southeast-3', unit: 'req/s', base: 1284, vol: 0.09, font: 'pixel', seed: 'watch-counter-gateway' },
  }),
  counter({
    id: 'watch-counter-qris',
    size: '2x1',
    domain: 'payments',
    surface: 'brand',
    name: 'QRIS payments today',
    props: { label: 'QRIS payments since 00:00 WIB', unit: 'paid', mode: 'total', base: 64, start: 1284903, seed: 'watch-counter-qris' },
  }),
  counter({
    id: 'watch-counter-viewers',
    size: '1x1',
    domain: 'media',
    name: 'Live viewers',
    props: { label: 'Kanal 21', unit: 'viewers', base: 48210, vol: 0.015, seed: 'watch-counter-viewers' },
  }),
  counter({
    id: 'watch-counter-solar',
    size: '1x1',
    domain: 'energy',
    surface: 'muted',
    name: 'PLTS Cirata',
    props: { label: 'Output', unit: 'MW', base: 142.8, decimals: 1, vol: 0.035, seed: 'watch-counter-solar' },
  }),
  counter({
    id: 'watch-counter-taps',
    size: '1x1',
    domain: 'transit',
    name: 'Taps, Dukuh Atas',
    props: { label: 'Gates 1–12', unit: 'taps/min', base: 312, vol: 0.14, seed: 'watch-counter-taps' },
  }),
]

/* ── 02 Event stream ──────────────────────────────────────────────────────────────── */
const stream = archetype(EventStream, {
  name: 'Event stream',
  hint: 'Pause to read, or pick a line with the pointer or arrow keys; Escape goes back to live',
  why: 'Events arrive faster than anyone could ask about them; a live tail shows the pattern as it forms.',
  tags: ['log', 'stream', 'events', 'tail', 'live'],
})

const streams = [
  stream({
    id: 'watch-stream-signin',
    size: '3x2',
    domain: 'security',
    surface: 'dark',
    name: 'Sign-in events',
    props: {
      eyebrow: 'auth · sign-in events',
      source: 'ap-southeast-3',
      seed: 'watch-stream-signin',
      rows: 12,
      templates: [
        { level: 'ok', text: 'Signed in {user} from {city} · {device}', weight: 6 },
        { level: 'info', text: 'Session refreshed for {user} · {device}', weight: 3 },
        { level: 'warn', text: 'Second MFA attempt for {user} from {ip}', weight: 2 },
        { level: 'error', text: 'Blocked {user} from {ip} · {reason}', weight: 1 },
      ],
      fills: {
        user: ['ayu.lestari', 'rizky.pratama', 'sari.w', 'kevin.tan', 'dewi.anggraini', 'fajar.n', 'maya.kartika', 'grace.liu'],
        city: ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Makassar', 'Singapore', 'Denpasar'],
        device: ['Sesi mobile', 'Sesi web', 'Sesi desktop', 'Sesi tablet', 'Sesi kiosk'],
        ip: ['36.71.142.18', '114.122.8.201', '182.253.70.4', '103.47.132.9', '45.155.205.33'],
        reason: ['impossible travel', 'address on a block list', 'password spraying'],
      },
    },
  }),
  stream({
    id: 'watch-stream-webhooks',
    size: '2x2',
    domain: 'payments',
    name: 'Webhook tail',
    props: {
      eyebrow: 'Webhooks · payments-core',
      source: 'v2',
      seed: 'watch-stream-webhooks',
      rows: 11,
      templates: [
        { level: 'ok', text: 'charge.settled INV-2611-{#4800-4999} · {amount}', weight: 5 },
        { level: 'info', text: 'payout.created PO-{#10200-10999} · {amount}', weight: 2 },
        { level: 'info', text: 'refund.requested INV-2611-{#4800-4999}', weight: 1 },
        { level: 'warn', text: 'Delivery retry 2 of 5 to {shop}', weight: 1 },
        { level: 'error', text: 'charge.failed INV-2611-{#4800-4999} · card declined', weight: 1 },
      ],
      fills: {
        amount: ['Rp 1.250.000', 'Rp 86.500', 'Rp 432.000', 'Rp 2.890.000', 'Rp 59.900', 'Rp 175.000', 'Rp 12.400.000'],
        shop: ['Toko Kelontong Bu Ratna', 'Kopi Lereng', 'CV Rotan Cirebon', 'Graha Niaga'],
      },
    },
  }),
  stream({
    id: 'watch-stream-deploy',
    size: '4x2',
    domain: 'devops',
    surface: 'dark',
    name: 'Deploy log',
    props: {
      eyebrow: 'deploy · payments-core v4.12.0',
      source: 'prod · ap-southeast-3',
      seed: 'watch-stream-deploy',
      rows: 13,
      ms: 1300,
      templates: [
        { level: 'info', text: 'Pod payments-core-7d9f{#10-99} pulled image sha256:4be1c{#100-999}', weight: 3 },
        { level: 'ok', text: 'Readiness probe passed on payments-core-7d9f{#10-99} in {#3-9}.{#1-9} s', weight: 4 },
        { level: 'info', text: 'Shifted {share} of traffic to v4.12.0', weight: 2 },
        { level: 'warn', text: 'p99 on /v2/charges at {#301-340} ms, SLO is 300 ms', weight: 1 },
        { level: 'info', text: 'Draining connections on payments-core-6c4a{#10-99}', weight: 2 },
        { level: 'error', text: 'Container payments-core-7d9f{#10-99} OOMKilled, restarting', weight: 0.5 },
      ],
      fills: { share: ['5%', '10%', '25%', '50%'] },
    },
  }),
  stream({
    id: 'watch-stream-scans',
    size: '2x2',
    domain: 'logistics',
    surface: 'muted',
    name: 'Warehouse scans',
    props: {
      eyebrow: 'Scans · Gudang Cikarang',
      source: 'DC-2',
      seed: 'watch-stream-scans',
      rows: 11,
      ms: 1500,
      templates: [
        { level: 'ok', text: 'KK-00{#48100-48999} in at Dock {#1-8}', weight: 5 },
        { level: 'ok', text: 'Pallet P-{#1000-1999} loaded on {plate}', weight: 2 },
        { level: 'info', text: 'Tote T-{#200-899} moved to Zone {zone}', weight: 3 },
        { level: 'warn', text: 'KK-00{#48100-48999} weighs 4.2 kg, label says 3.0 kg', weight: 1 },
        { level: 'error', text: 'Label unreadable at Dock {#1-8}, held for a check', weight: 0.6 },
      ],
      fills: { plate: ['B 9123 UXT', 'B 9871 TKA', 'D 8402 AF', 'B 1924 KZT'], zone: ['A', 'B', 'C', 'D'] },
    },
  }),
  stream({
    id: 'watch-stream-wire',
    size: '2x2',
    domain: 'media',
    name: 'Newsroom wire',
    props: {
      eyebrow: 'Wire · national desk',
      source: 'Kanal 21',
      seed: 'watch-stream-wire',
      rows: 11,
      ms: 2400,
      templates: [
        { level: 'info', text: 'Weather service: heavy rain over Jabodetabek from 15:00', weight: 1 },
        { level: 'info', text: 'Photo desk filed {#6-24} frames from Tanjung Priok', weight: 2 },
        { level: 'ok', text: 'Published: Merak–Bakauheni ferries back on schedule', weight: 1 },
        { level: 'warn', text: 'Embargo to 16:00 WIB: inflation figures for October', weight: 1 },
        { level: 'info', text: '{city} correspondent filed {#320-980} words', weight: 3 },
        { level: 'ok', text: 'Published: rice harvest in Karawang up on last year', weight: 1 },
        { level: 'error', text: 'Feed from the {city} bureau dropped, retrying', weight: 0.5 },
      ],
      fills: { city: ['Makassar', 'Surabaya', 'Medan', 'Ambon', 'Pontianak', 'Jayapura'] },
    },
  }),
]

/* ── 03 Job with stages ───────────────────────────────────────────────────────────── */
const job = archetype(JobProgress, {
  name: 'Job with stages',
  hint: 'Watch the stage and the time left; stop it with the one key, then restart',
  why: 'A long job is checked many times while it runs; a bar and a stage answer before anyone asks.',
  tags: ['progress', 'job', 'stages', 'deploy', 'upload'],
})

const jobs = [
  job({
    id: 'watch-job-deploy',
    size: '2x2',
    domain: 'devops',
    name: 'Deploy in stages',
    props: {
      eyebrow: 'Deploy · production',
      title: 'payments-core v4.12.0',
      stages: [
        { label: 'Build', secs: 50 },
        { label: 'Test', secs: 85 },
        { label: 'Canary 5%', secs: 120 },
        { label: 'Roll out', secs: 150 },
        { label: 'Verify', secs: 60 },
      ],
      ran: 150,
      stop: 'Roll back',
      stopped: 'Rolled back',
    },
  }),
  job({
    id: 'watch-job-upload',
    size: '2x1',
    domain: 'media',
    name: 'Upload and publish',
    props: {
      eyebrow: 'Upload · Kanal 21',
      title: 'Episode 14 · Pasar Terapung.mov',
      stages: [
        { label: 'Upload', secs: 140 },
        { label: 'Transcode', secs: 90 },
        { label: 'Captions', secs: 40 },
        { label: 'Publish', secs: 10 },
      ],
      sizeMb: 3277,
      ran: 60,
      layout: 'strip',
    },
  }),
  job({
    id: 'watch-job-payroll',
    size: '2x2',
    domain: 'banking',
    surface: 'muted',
    name: 'Payroll file import',
    props: {
      eyebrow: 'Payroll import · October',
      title: 'gaji-oktober-2026.csv · 312 rows',
      stages: [
        { label: 'Read the file', secs: 12 },
        { label: 'Check accounts', secs: 45 },
        { label: 'Match to roster', secs: 30 },
        { label: 'Ready to release', secs: 6 },
      ],
      ran: 20,
      stop: 'Stop import',
      stopped: 'Stopped',
    },
  }),
  job({
    id: 'watch-job-firmware',
    size: '1x1',
    domain: 'home',
    name: 'Lock firmware',
    props: {
      eyebrow: 'Front door lock',
      title: 'Firmware 2.4.1',
      stages: [
        { label: 'Download', secs: 40 },
        { label: 'Verify', secs: 10 },
        { label: 'Install', secs: 50 },
        { label: 'Restart', secs: 15 },
      ],
      ran: 25,
      layout: 'mini',
    },
  }),
  job({
    id: 'watch-job-downlink',
    size: '2x1',
    domain: 'aerospace',
    name: 'Image downlink',
    props: {
      eyebrow: 'Downlink · pass 0412 · Biak',
      title: 'Scene 18 · Kalimantan Timur',
      stages: [
        { label: 'Lock', secs: 15 },
        { label: 'Downlink', secs: 260 },
        { label: 'Checksum', secs: 20 },
        { label: 'Archive', secs: 25 },
      ],
      sizeMb: 1843,
      ran: 70,
      stop: 'Abort',
      stopped: 'Aborted',
      layout: 'strip',
      zone: 'WIT',
    },
  }),
]

/* ── 04 Countdown ─────────────────────────────────────────────────────────────────── */
const count = archetype(Countdown, {
  name: 'Countdown',
  hint: 'Hold and resume a launch count, or ask to be reminded before zero',
  why: 'Time left changes every second; a running count says it better than any answer to “how long now”.',
  tags: ['countdown', 'timer', 't-minus', 'live'],
})

const counts = [
  count({
    id: 'watch-count-staticfire',
    size: '2x1',
    domain: 'aerospace',
    surface: 'dark',
    name: 'T-minus with hold',
    props: { eyebrow: 'Static fire · Stand 2', zero: 'Ignition', seconds: 252, format: 'tminus', action: 'hold', font: 'pixel' },
  }),
  count({
    id: 'watch-count-range',
    size: '1x1',
    domain: 'defense',
    surface: 'dark',
    name: 'Range R-3, Natuna',
    props: { eyebrow: 'Range R-3', zero: 'Range hot', seconds: 720, format: 'tminus', action: 'hold' },
  }),
  count({
    id: 'watch-count-clearing',
    size: '2x1',
    domain: 'payments',
    name: 'Next clearing batch',
    props: { eyebrow: 'SKN clearing', zero: 'Next batch', after: 'Batch sent', every: 30, action: 'remind', lead: 5 },
  }),
  count({
    id: 'watch-count-flashsale',
    size: '1x1',
    domain: 'commerce',
    surface: 'brand',
    name: 'Flash sale opens',
    props: { eyebrow: 'Flash sale', zero: 'Opens', after: 'Open now', every: 60, action: 'remind', lead: 5 },
  }),
  count({
    id: 'watch-count-water',
    size: '1x1',
    domain: 'civic',
    surface: 'muted',
    name: 'Water back on',
    props: { eyebrow: 'PAM Menteng', zero: 'Water back', seconds: 5520, action: 'remind', lead: 15 },
  }),
]

/* ── 05 Stopwatch with laps ───────────────────────────────────────────────────────── */
const sw = archetype(Stopwatch, {
  name: 'Stopwatch with laps',
  hint: 'Start, stop and mark a lap with the keys; reset when stopped',
  why: 'Work against the clock needs the clock in view; reading it aloud on request would always be late.',
  tags: ['stopwatch', 'timer', 'laps', 'live'],
})

const stopwatches = [
  sw({
    id: 'watch-sw-resus',
    size: '2x2',
    domain: 'health',
    surface: 'dark',
    name: 'Resuscitation timer',
    props: {
      label: 'Resuscitation · Bed 4',
      sub: 'ICU · started by Nadia Rahman',
      lapNoun: 'Cycle',
      lapAction: 'End cycle',
      startedAgo: 254,
      laps: [118, 121],
      cycle: 120,
      cycleLabel: 'Rhythm check',
      target: 125,
    },
  }),
  sw({
    id: 'watch-sw-standup',
    size: '1x2',
    domain: 'workspace',
    name: 'Standup timer',
    props: { label: 'Standup', sub: 'Platform team · 6 people', lapNoun: 'Speaker', lapAction: 'Next speaker', startedAgo: 212, laps: [74, 92], target: 90, layout: 'tall' },
  }),
  sw({
    id: 'watch-sw-dock',
    size: '2x1',
    domain: 'logistics',
    name: 'Loading timer',
    props: { label: 'Dock 4 · B 9123 UXT', lapNoun: 'Pallet', lapAction: 'Pallet loaded', startedAgo: 640, laps: [110, 96, 131, 102, 99], target: 120, layout: 'strip' },
  }),
  sw({
    id: 'watch-sw-take',
    size: '1x1',
    domain: 'audio',
    surface: 'muted',
    name: 'Take timer',
    props: { label: 'Studio B · take 7', lapNoun: 'Take', lapAction: 'New take', tenths: true, font: 'pixel', layout: 'mini' },
  }),
]

/* ── 06 Live line ─────────────────────────────────────────────────────────────────── */
const line = archetype(LiveLine, {
  name: 'Live line',
  hint: 'Run the pointer or the arrow keys along the line to read a point; pause holds the picture',
  why: 'Whether a reading is drifting toward its limit is a shape, seen in a second and missed in a sentence.',
  tags: ['line', 'chart', 'live', 'now', 'threshold'],
})

const lines = [
  line({
    id: 'watch-line-frequency',
    size: '4x2',
    domain: 'energy',
    surface: 'dark',
    name: 'Grid frequency',
    props: {
      label: 'Grid frequency · Jawa–Bali',
      unit: 'Hz',
      start: 50,
      vol: 0.0004,
      revert: 0.12,
      decimals: 3,
      limits: [
        { value: 50.2, label: 'High 50.200' },
        { value: 49.8, label: 'Low 49.800' },
      ],
      band: [49.8, 50.2],
      words: ['Under-frequency', 'Normal', 'Over-frequency'],
      points: 90,
      seed: 'watch-line-frequency',
    },
  }),
  line({
    id: 'watch-line-latency',
    size: '2x2',
    domain: 'devops',
    name: 'Latency against the SLO',
    props: {
      label: 'p99 latency · /v2/charges',
      unit: 'ms',
      start: 182,
      vol: 0.05,
      jump: 0.06,
      limits: [{ value: 300, label: 'SLO 300 ms' }],
      band: [0, 300],
      words: ['Within SLO', 'Within SLO', 'Over SLO'],
      seed: 'watch-line-latency',
    },
  }),
  line({
    id: 'watch-line-usdidr',
    size: '2x1',
    domain: 'banking',
    name: 'USD/IDR spot',
    props: { label: 'USD/IDR · spot', start: 15742, vol: 0.0006, points: 40, layout: 'mini', seed: 'watch-line-usdidr' },
  }),
  line({
    id: 'watch-line-reefer',
    size: '3x1',
    domain: 'logistics',
    name: 'Reefer temperature',
    props: {
      label: 'Reefer NSLU 4821930 · Tanjung Priok',
      unit: '°C',
      start: 4.6,
      vol: 0.03,
      decimals: 1,
      limits: [
        { value: 8, label: '8 °C' },
        { value: 2, label: '2 °C' },
      ],
      band: [2, 8],
      words: ['Too cold', 'In range', 'Too warm'],
      layout: 'strip',
      seed: 'watch-line-reefer',
    },
  }),
  line({
    id: 'watch-line-power',
    size: '1x1',
    domain: 'home',
    surface: 'muted',
    name: 'Home power draw',
    props: { label: 'Power', unit: 'W', start: 1840, vol: 0.06, jump: 0.05, points: 30, layout: 'mini', seed: 'watch-line-power' },
  }),
]

/* ── 07 Queue position ────────────────────────────────────────────────────────────── */
const queue = archetype(QueuePosition, {
  name: 'Place in line',
  hint: 'Watch the line move; leave asks once, and your turn takes an answer',
  why: 'Waiting is easier when the line is visible; a person should not have to ask “how many before me”.',
  tags: ['queue', 'wait', 'ticket', 'position'],
})

const queues = [
  queue({
    id: 'watch-queue-clinic',
    size: '2x1',
    domain: 'health',
    name: 'Clinic queue',
    props: { place: 'Klinik Sehat Sentosa · Poli Anak', ticket: 'A-042', ahead: 4, every: 95, firstIn: 7, counter: 'Room 3' },
  }),
  queue({
    id: 'watch-queue-teller',
    size: '1x1',
    domain: 'banking',
    name: 'Teller queue',
    props: { place: 'Arunika · KCP Dago', ticket: 'B-118', ahead: 2, every: 70, firstIn: 6, counter: 'Teller 2', layout: 'mini' },
  }),
  queue({
    id: 'watch-queue-samsat',
    size: '2x2',
    domain: 'civic',
    surface: 'muted',
    name: 'Service counter board',
    props: {
      place: 'Samsat Jakarta Barat · tax renewal',
      ticket: 'C-207',
      ahead: 6,
      every: 55,
      firstIn: 5,
      counter: 'Loket 4',
      counters: ['Loket 1', 'Loket 2', 'Loket 3', 'Loket 4'],
      layout: 'board',
    },
  }),
  queue({
    id: 'watch-queue-chat',
    size: '1x2',
    domain: 'commerce',
    name: 'Support chat queue',
    props: {
      place: 'Customer care · chat',
      ticket: '#519',
      ahead: 3,
      every: 40,
      firstIn: 6,
      counter: 'Putri is here',
      go: 'Putri Maharani from customer care is ready for {ticket}.',
      ack: 'Open the chat',
      acked: 'Chat open with Putri.',
      layout: 'tall',
    },
  }),
]

/* ── 08 Delivery tracker ──────────────────────────────────────────────────────────── */
const track = archetype(DeliveryTracker, {
  name: 'Delivery tracker',
  hint: 'Pick a stop with the pointer or the arrow keys to read its time',
  why: 'Where a delivery is right now is a position on a line; one look beats a status message read twice.',
  tags: ['tracking', 'delivery', 'eta', 'route', 'map'],
})

const tracks = [
  track({
    id: 'watch-track-parcel',
    size: '4x1',
    domain: 'logistics',
    name: 'Parcel on its way',
    props: {
      eyebrow: 'PT Kurir Kilat · KK-0048213',
      title: 'Parcel for Jl. Dago 112, Bandung',
      stops: [
        { name: 'Hub Cikarang', mins: 0, note: 'left the hub' },
        { name: 'Tol Cipularang', mins: 38 },
        { name: 'Hub Pasteur', mins: 52, note: 'sorted onto van 7' },
        { name: 'Jl. Sukajadi', mins: 14, note: '2 parcels' },
        { name: 'Jl. Cihampelas', mins: 9, note: '1 parcel' },
        { name: 'Jl. Dago 112', mins: 11, note: 'your parcel' },
      ],
      at: 3,
      legDone: 0.4,
    },
  }),
  track({
    id: 'watch-track-food',
    size: '2x2',
    domain: 'commerce',
    name: 'Food order on its way',
    props: {
      eyebrow: 'Order 0412 · Warung Bu Ratna',
      title: 'Nasi campur ×2, es teh manis',
      vehicle: 'Fikri Ramadhan · B 3412 KZT',
      stops: [
        { name: 'Warung Bu Ratna', mins: 0, note: 'picked up' },
        { name: 'Jl. Kemang Raya', mins: 6 },
        { name: 'Jl. Bangka II', mins: 5 },
        { name: 'Your door', mins: 4, note: 'leave it at the gate' },
      ],
      at: 2,
      legDone: 0.5,
      layout: 'card',
    },
  }),
  track({
    id: 'watch-track-blood',
    size: '1x3',
    domain: 'health',
    name: 'Blood courier',
    props: {
      eyebrow: 'O neg ×4',
      title: 'To RSU Cahaya Bekasi, emergency',
      vehicle: 'Motor 07 · B 4417 KJA',
      stops: [
        { name: 'Blood bank', mins: 0, note: 'cold box sealed' },
        { name: 'Jl. Ahmad Yani', mins: 7 },
        { name: 'Bekasi Barat', mins: 6 },
        { name: 'Emergency ramp', mins: 5, note: 'Nadia meets the courier' },
      ],
      at: 1,
      legDone: 0.6,
      layout: 'tall',
    },
  }),
  track({
    id: 'watch-track-harvest',
    size: '3x1',
    domain: 'agri',
    surface: 'muted',
    name: 'Harvest truck',
    props: {
      eyebrow: 'Harvest truck · DD 7710 KM',
      title: 'Fresh fruit bunches, 9.2 t',
      stops: [
        { name: 'Afdeling 3', mins: 0, note: 'loaded 7.1 t' },
        { name: 'Afdeling 5', mins: 18, note: '2.1 t more' },
        { name: 'Weighbridge', mins: 24 },
        { name: 'Mill gate', mins: 6, note: 'grade check' },
      ],
      at: 2,
      legDone: 0.25,
      zone: 'WITA',
    },
  }),
]

/* ── 09 Pipeline lamps ────────────────────────────────────────────────────────────── */
const pipe = archetype(PipelineLamps, {
  name: 'Pipeline lamps',
  hint: 'Pick a stage with the pointer or the arrow keys to read its log; retry a failed stage',
  why: 'A row of lamps says where a run is and where it broke before anyone opens a log.',
  tags: ['pipeline', 'ci', 'lamps', 'build', 'stages'],
})

const pipes = [
  pipe({
    id: 'watch-pipe-ci',
    size: '3x1',
    domain: 'devops',
    name: 'CI pipeline',
    props: {
      eyebrow: 'ci · payments-core #1841',
      stages: [
        { label: 'Lint', secs: 18, log: '0 problems in 412 files' },
        { label: 'Test', secs: 64, log: '1,284 passed in 58.2 s' },
        { label: 'Build', secs: 40, log: 'Image 182 MB, sha256:4be1c09' },
        { label: 'Scan', secs: 22, log: '0 critical, 2 low', fail: 'CVE-2026-1182 in libxml2 2.11, critical' },
        { label: 'Deploy', secs: 30, log: 'Staging healthy in 24 s' },
      ],
      ran: 112,
    },
  }),
  pipe({
    id: 'watch-pipe-docs',
    size: '2x1',
    domain: 'rapi',
    surface: 'brand',
    name: 'Rapi docs build',
    props: {
      eyebrow: 'rapi docs · 0.2.14',
      stages: [
        { label: 'Types', secs: 14, log: 'vue-tsc clean' },
        { label: 'Lint', secs: 9, log: 'moodlint: 0 rule' },
        { label: 'Build', secs: 31, log: '1,014 modules, 2.1 MB' },
        { label: 'Publish', secs: 12, log: 'Live in 12 s' },
      ],
      ran: 20,
    },
  }),
  pipe({
    id: 'watch-pipe-settlement',
    size: '4x1',
    domain: 'payments',
    surface: 'dark',
    name: 'Settlement run',
    props: {
      eyebrow: 'Settlement · batch 0412',
      stages: [
        { label: 'Collect', secs: 40, log: 'Collected 18,204 payments' },
        { label: 'Screen', secs: 55, log: 'Screened 18,204, 3 held for review' },
        { label: 'Net', secs: 25, log: 'Net position IDR 4.82 bn across 5 banks' },
        { label: 'Post', secs: 35, log: 'Posted 5 entries to the ledger' },
        { label: 'Settle', secs: 60, log: 'Settled with Bank Sagara, Bank Pesisir and 3 more' },
      ],
      ran: 70,
    },
  }),
  pipe({
    id: 'watch-pipe-pass',
    size: '2x2',
    domain: 'aerospace',
    name: 'Satellite pass',
    props: {
      eyebrow: 'Pass 0412 · Biak ground station',
      stages: [
        { label: 'Acquire', secs: 10, log: 'Signal at 5° elevation' },
        { label: 'Lock', secs: 15, log: 'Autotrack locked, 12.4 dB margin' },
        { label: 'Downlink', secs: 240, log: '1.8 GB at 150 Mbit/s' },
        { label: 'Verify', secs: 20, log: 'CRC clean on 1,204 frames', fail: 'CRC errors on 3 of 1,204 frames' },
        { label: 'Archive', secs: 25, log: 'Stored in the Biak archive' },
      ],
      ran: 30,
      layout: 'list',
    },
  }),
]

/* ── 10 Live tally ────────────────────────────────────────────────────────────────── */
const tally = archetype(LiveTally, {
  name: 'Live tally',
  hint: 'Watch the count come in; switch between counts and shares',
  why: 'Who leads while the count comes in is a picture that changes by the second; bars show it at once.',
  tags: ['tally', 'votes', 'count', 'poll', 'live'],
})

const tallies = [
  tally({
    id: 'watch-tally-village',
    size: '2x2',
    domain: 'civic',
    name: 'Election count',
    props: {
      eyebrow: 'Pilkades Sukamaju · count',
      title: 'Village head election',
      options: [
        { label: 'Hj. Siti Aminah', share: 0.44 },
        { label: 'Bambang Sutrisno', share: 0.37 },
        { label: 'Yohanes Kurniawan', share: 0.19 },
      ],
      total: 6420,
      counted: 3880,
      perTick: 24,
      stations: { total: 18, noun: 'TPS' },
      seed: 'watch-tally-village',
    },
  }),
  tally({
    id: 'watch-tally-offsite',
    size: '2x1',
    domain: 'workspace',
    name: 'Poll results',
    props: {
      eyebrow: 'All-hands poll · offsite day',
      options: [
        { label: 'Thu 12 Nov', share: 0.46 },
        { label: 'Fri 13 Nov', share: 0.33 },
        { label: 'Mon 16 Nov', share: 0.21 },
      ],
      total: 214,
      counted: 131,
      perTick: 2,
      ms: 2000,
      layout: 'compact',
      seed: 'watch-tally-offsite',
    },
  }),
  tally({
    id: 'watch-tally-viewers',
    size: '3x2',
    domain: 'media',
    surface: 'dark',
    name: 'Viewer vote',
    props: {
      eyebrow: 'Viewer vote · Panggung Kampus final',
      title: 'Who goes through to the last round?',
      options: [
        { label: 'Rara, Makassar', share: 0.31 },
        { label: 'Dimas, Yogyakarta', share: 0.29 },
        { label: 'Kezia, Ambon', share: 0.24 },
        { label: 'Teuku, Banda Aceh', share: 0.16 },
      ],
      total: 182000,
      counted: 96400,
      perTick: 420,
      ms: 1200,
      seed: 'watch-tally-viewers',
    },
  }),
  tally({
    id: 'watch-tally-sizes',
    size: '1x2',
    domain: 'commerce',
    surface: 'muted',
    name: 'Batik pre-orders',
    props: {
      eyebrow: 'Drop 3',
      options: [
        { label: 'S', share: 0.18 },
        { label: 'M', share: 0.36 },
        { label: 'L', share: 0.31 },
        { label: 'XL', share: 0.15 },
      ],
      total: 1200,
      counted: 642,
      perTick: 3,
      unit: 'orders',
      layout: 'tall',
      seed: 'watch-tally-sizes',
    },
  }),
]

/* ── 11 Sweep trace ───────────────────────────────────────────────────────────────── */
const trace = archetype(SweepTrace, {
  name: 'Sweep trace',
  hint: 'Freeze the trace to look at it; switch the lead or axis with the keys',
  why: 'A rhythm is a shape over time; nobody can describe a heartbeat or a tremor as fast as it is seen.',
  tags: ['trace', 'monitor', 'waveform', 'live'],
})

const traces = [
  trace({
    id: 'watch-trace-ecg',
    size: '3x1',
    domain: 'health',
    surface: 'dark',
    name: 'Bedside ECG',
    props: {
      label: 'ICU · Bed 4',
      kind: 'ecg',
      figure: { label: 'HR', value: 78, unit: 'bpm', vol: 0.015 },
      extra: { label: 'SpO₂', value: 97, unit: '%', vol: 0.005 },
      channels: ['II', 'V1', 'V5'],
      seed: 'watch-trace-ecg',
    },
  }),
  trace({
    id: 'watch-trace-seismic',
    size: '1x1',
    domain: 'civic',
    surface: 'dark',
    name: 'Seismometer',
    props: { label: 'Lembang · BHZ', kind: 'seismic', figure: { label: 'Peak', value: 0.8, unit: 'µm/s', decimals: 1 }, layout: 'mini', seed: 'watch-trace-seismic' },
  }),
  trace({
    id: 'watch-trace-turbine',
    size: '2x2',
    domain: 'energy',
    name: 'Bearing vibration',
    props: {
      label: 'Turbine 3 · bearing 2',
      kind: 'vibration',
      figure: { label: 'Velocity RMS', value: 4.2, unit: 'mm/s', decimals: 1 },
      limit: { value: 11.2, label: 'Trip 11.2 mm/s' },
      channels: ['X', 'Y', 'Z'],
      layout: 'card',
      seed: 'watch-trace-turbine',
    },
  }),
  trace({
    id: 'watch-trace-pleth',
    size: '1x1',
    domain: 'health',
    name: 'Pulse oximeter',
    props: {
      label: 'Ward 3 · Bed 9',
      kind: 'pleth',
      figure: { label: 'SpO₂', value: 98, unit: '%' },
      extra: { label: 'PR', value: 72, unit: 'bpm' },
      layout: 'mini',
      seed: 'watch-trace-pleth',
    },
  }),
]

/* ── 12 Radar scope ───────────────────────────────────────────────────────────────── */
const scope = archetype(Scope, {
  name: 'Radar scope',
  hint: 'Pick a track on the scope or in the list; arrow keys and Enter work on the scope',
  why: 'Where things are and where they are heading is spatial; a scope shows it in one sweep.',
  tags: ['radar', 'scope', 'tracks', 'map', 'live'],
})

const scopes = [
  scope({
    id: 'watch-scope-natuna',
    size: '3x3',
    domain: 'defense',
    surface: 'dark',
    name: 'Air picture',
    props: {
      label: 'Air picture · Natuna sector',
      range: 120,
      alertRing: 40,
      alertLabel: 'Inner zone 40 NM',
      initial: 'U04',
      layout: 'side',
      tracks: [
        { id: 'U04', label: 'UNK 04', kind: 'unknown', bearing: 15, range: 92, heading: 200, speed: 420 },
        { id: 'R01', label: 'RED 01', kind: 'hostile', bearing: 62, range: 71, heading: 250, speed: 520 },
        { id: 'H21', label: 'Elang 21', kind: 'friendly', bearing: 300, range: 36, heading: 120, speed: 380, turn: 2 },
        { id: 'P02', label: 'Patrol 2', kind: 'friendly', bearing: 140, range: 54, heading: 330, speed: 210, turn: -3 },
        { id: 'NA712', label: 'NA 712', kind: 'neutral', bearing: 212, range: 84, heading: 40, speed: 460 },
        { id: 'NA418', label: 'NA 418', kind: 'neutral', bearing: 250, range: 108, heading: 70, speed: 450 },
      ],
    },
  }),
  scope({
    id: 'watch-scope-strait',
    size: '2x2',
    domain: 'defense',
    name: 'Sea picture',
    props: {
      label: 'Sea picture · Selat Malaka',
      range: 24,
      step: 90,
      initial: 'U12',
      tracks: [
        { id: 'P7', label: 'Patrol 7', kind: 'friendly', bearing: 330, range: 6.2, heading: 60, speed: 22 },
        { id: 'SB', label: 'MV Sinar Armada', kind: 'neutral', bearing: 80, range: 15.8, heading: 300, speed: 14 },
        { id: 'TB', label: 'MT Tirta Baja', kind: 'neutral', bearing: 200, range: 19.4, heading: 120, speed: 11 },
        { id: 'U12', label: 'UNK 12', kind: 'unknown', bearing: 120, range: 11.5, heading: 280, speed: 26 },
      ],
    },
  }),
  scope({
    id: 'watch-scope-drones',
    size: '2x2',
    domain: 'agri',
    name: 'Spray drones',
    props: {
      label: 'Spray drones · Blok 7',
      range: 800,
      unit: 'm',
      speedUnit: 'km/h',
      step: 20,
      alertRing: 600,
      alertLabel: 'Geofence 600 m',
      initial: 'D3',
      tracks: [
        { id: 'D1', label: 'Drone 1', kind: 'friendly', bearing: 40, range: 320, heading: 130, speed: 18, turn: 6 },
        { id: 'D2', label: 'Drone 2', kind: 'friendly', bearing: 150, range: 410, heading: 250, speed: 20, turn: 5 },
        { id: 'D3', label: 'Drone 3', kind: 'friendly', bearing: 260, range: 520, heading: 20, speed: 22, turn: -4 },
        { id: 'T2', label: 'Tractor 2', kind: 'neutral', bearing: 330, range: 180, heading: 90, speed: 6 },
      ],
    },
  }),
]

/* ── 13 Leg progress ──────────────────────────────────────────────────────────────── */
const leg = archetype(LegProgress, {
  name: 'Leg in progress',
  hint: 'Switch the times between local and UTC',
  why: 'How far along a journey is reads off a line in a glance; the arrival time stays in view as it shifts.',
  tags: ['flight', 'ferry', 'eta', 'progress', 'travel'],
})

const legs = [
  leg({
    id: 'watch-leg-cgkdps',
    size: '3x1',
    domain: 'transit',
    name: 'Flight in progress',
    props: {
      eyebrow: 'Nusa Air NA 712',
      from: { code: 'CGK', city: 'Jakarta', zone: 'WIB' },
      to: { code: 'DPS', city: 'Denpasar', zone: 'WITA' },
      minutes: 110,
      done: 52,
      stats: [
        { label: 'Altitude', value: 37000, unit: 'ft', vol: 0.0005 },
        { label: 'Ground speed', value: 452, unit: 'kn', vol: 0.006 },
      ],
      seed: 'watch-leg-cgkdps',
    },
  }),
  leg({
    id: 'watch-leg-cargo',
    size: '2x1',
    domain: 'logistics',
    surface: 'dark',
    name: 'Cargo flight',
    props: {
      eyebrow: 'Nusa Air Cargo NA 8821',
      from: { code: 'UPG', city: 'Makassar', zone: 'WITA' },
      to: { code: 'DJJ', city: 'Jayapura', zone: 'WIT' },
      minutes: 215,
      done: 140,
      layout: 'mini',
      seed: 'watch-leg-cargo',
    },
  }),
  leg({
    id: 'watch-leg-ferry',
    size: '2x2',
    domain: 'transit',
    surface: 'muted',
    name: 'Ferry crossing',
    props: {
      eyebrow: 'KMP Laut Teduh · crossing 14',
      vehicle: 'ship',
      from: { code: 'KTP', city: 'Ketapang, Banyuwangi', zone: 'WIB' },
      to: { code: 'GLM', city: 'Gilimanuk, Bali', zone: 'WITA' },
      minutes: 55,
      done: 21,
      stats: [
        { label: 'Speed', value: 9.4, unit: 'kn', decimals: 1, vol: 0.02 },
        { label: 'Waves', value: 0.8, unit: 'm', decimals: 1, vol: 0.03 },
        { label: 'On board', value: 412, unit: 'people', vol: 0 },
      ],
      layout: 'card',
      seed: 'watch-leg-ferry',
    },
  }),
  leg({
    id: 'watch-leg-medevac',
    size: '2x1',
    domain: 'health',
    name: 'Air ambulance',
    props: {
      eyebrow: 'Air ambulance · patient transfer',
      from: { code: 'KOE', city: 'Kupang', zone: 'WITA' },
      to: { code: 'DPS', city: 'Denpasar', zone: 'WITA' },
      minutes: 105,
      done: 38,
      layout: 'mini',
      seed: 'watch-leg-medevac',
    },
  }),
]

/* ── 14 Order book ────────────────────────────────────────────────────────────────── */
const book = archetype(OrderBook, {
  name: 'Live order book',
  hint: 'Pick a level with the pointer, or arrow keys and Enter, to set a limit there',
  why: 'Depth and spread change every second; the book shows where the price can go before anyone asks.',
  tags: ['order book', 'market', 'depth', 'trading', 'live'],
})

const books = [
  book({
    id: 'watch-book-usdidr',
    size: '2x3',
    domain: 'banking',
    surface: 'dark',
    name: 'USD/IDR order book',
    props: { label: 'USD/IDR · spot', mid: 15742.5, step: 5, levels: 9, size: 4.2, sizeUnit: 'USD M', seed: 'watch-book-usdidr' },
  }),
  book({
    id: 'watch-book-cpo',
    size: '2x2',
    domain: 'agri',
    name: 'Palm oil futures book',
    props: { label: 'CPO · Dec 2026 · Rp/kg', mid: 13262.5, step: 25, levels: 4, size: 120, sizeUnit: 't', sizeDecimals: 0, seed: 'watch-book-cpo' },
  }),
  book({
    id: 'watch-book-carbon',
    size: '2x2',
    domain: 'energy',
    surface: 'muted',
    name: 'Carbon units book',
    props: { label: 'Carbon units · IDR/tCO₂e', mid: 58250, step: 500, levels: 4, size: 1800, sizeUnit: 't', sizeDecimals: 0, seed: 'watch-book-carbon' },
  }),
]

/* ── 15 Live captions ─────────────────────────────────────────────────────────────── */
const captions = archetype(LiveCaptions, {
  name: 'Live captions',
  hint: 'Pause to read a line again; Back to live catches up in one press',
  why: 'Speech that is happening now has to be read now; captions keep up where a summary would come after.',
  tags: ['captions', 'speech', 'transcript', 'accessibility', 'live'],
})

const captionTiles = [
  captions({
    id: 'watch-captions-townhall',
    size: '3x2',
    domain: 'workspace',
    name: 'Town hall captions',
    props: {
      eyebrow: 'Town hall · Q4 plans',
      source: 'English · live captions',
      rows: 5,
      script: [
        { who: 'Ayu Lestari', text: 'Payroll moved to the new ledger in October, and nobody noticed, which is what we wanted.' },
        { who: 'Ayu Lestari', text: 'Settlement now closes at half past four instead of six.' },
        { who: 'Kevin Tan', text: 'On the platform side, p99 on charges is down to one hundred and eighty milliseconds.' },
        { who: 'Kevin Tan', text: 'Next quarter the risk engine moves to the same cluster.' },
        { who: 'Rina Hartono', text: 'A question from the room: does the Surabaya office get the same setup?' },
        { who: 'Ayu Lestari', text: 'Yes. Surabaya moves in January and Makassar in February.' },
      ],
    },
  }),
  captions({
    id: 'watch-captions-dprd',
    size: '2x2',
    domain: 'civic',
    surface: 'dark',
    name: 'Council session captions',
    props: {
      eyebrow: 'DPRD plenary · captions',
      source: 'Bahasa Indonesia',
      script: [
        { who: 'Chair', text: 'Rapat paripurna kami buka dan dinyatakan terbuka untuk umum.' },
        { who: 'Chair', text: 'Agenda pertama adalah pandangan fraksi tentang anggaran tahun 2027.' },
        { who: 'Fraksi 1', text: 'Kami meminta tambahan anggaran untuk perbaikan drainase di Jakarta Utara.' },
        { who: 'Fraksi 2', text: 'Kami setuju, dengan catatan jadwal pengerjaan dibuka kepada warga.' },
        { who: 'Chair', text: 'Terima kasih. Kita lanjutkan ke agenda kedua.' },
      ],
    },
  }),
  captions({
    id: 'watch-captions-broadcast',
    size: '4x1',
    domain: 'media',
    surface: 'dark',
    name: 'Broadcast captions',
    props: {
      eyebrow: 'Kanal 21 · evening news',
      source: 'Bahasa Indonesia',
      rows: 2,
      script: [
        { who: 'Presenter', text: 'Selamat malam. Hujan deras sore ini membuat sejumlah ruas jalan di Jakarta tergenang.' },
        { who: 'Presenter', text: 'Pintu Air Manggarai berada di status Siaga 2 sejak sore tadi.' },
        { who: 'Reporter', text: 'Petugas meminta warga di bantaran sungai bersiap untuk mengungsi.' },
      ],
    },
  }),
  captions({
    id: 'watch-captions-station',
    size: '2x1',
    domain: 'transit',
    name: 'Platform announcements',
    props: {
      eyebrow: 'Manggarai · platform 4',
      rows: 2,
      ms: 420,
      script: [
        { who: 'Station', text: 'Kereta tujuan Bogor akan tiba di jalur 4.' },
        { who: 'Station', text: 'The train to Bogor arrives at platform 4.' },
        { who: 'Station', text: 'Kereta tujuan Jakarta Kota berangkat dari jalur 2.' },
        { who: 'Station', text: 'The train to Jakarta Kota leaves from platform 2.' },
      ],
    },
  }),
]

/* ── 16 Recorder ──────────────────────────────────────────────────────────────────── */
const rec = archetype(RecLevel, {
  name: 'Recording',
  hint: 'Drop a marker while it records; Stop saves the take, Record starts a new one',
  why: 'While recording, the lamp, the time and the level must be in view; nobody stops to ask if it is working.',
  tags: ['recording', 'audio', 'level', 'meter', 'live'],
})

const recs = [
  rec({
    id: 'watch-rec-podcast',
    size: '2x1',
    domain: 'audio',
    surface: 'dark',
    name: 'Podcast recording',
    props: { label: 'Podcast · episode 14', startedAgo: 2533, level: 0.62, marks: [612, 1490], seed: 'watch-rec-podcast' },
  }),
  rec({
    id: 'watch-rec-field',
    size: '1x2',
    domain: 'media',
    name: 'Field recorder',
    props: { label: 'Way Kambas', sub: 'Dawn chorus · 48 kHz', startedAgo: 1210, level: 0.45, layout: 'tall', seed: 'watch-rec-field' },
  }),
  rec({
    id: 'watch-rec-meeting',
    size: '1x1',
    domain: 'workspace',
    name: 'Meeting recording',
    props: { label: 'This meeting', channels: ['Mic'], startedAgo: 1412, level: 0.5, layout: 'mini', seed: 'watch-rec-meeting' },
  }),
  rec({
    id: 'watch-rec-hearing',
    size: '2x2',
    domain: 'civic',
    surface: 'muted',
    name: 'Hearing record',
    props: {
      label: 'Hearing room 2',
      sub: 'Public hearing on the 2027 budget',
      channels: ['Chair', 'Floor'],
      startedAgo: 4211,
      level: 0.55,
      marks: [600, 1820, 3605],
      mbPerMin: 1.9,
      layout: 'card',
      seed: 'watch-rec-hearing',
    },
  }),
]

/* ── 17 Sync list ─────────────────────────────────────────────────────────────────── */
const sync = archetype(SyncList, {
  name: 'Transfers in progress',
  hint: 'Pause everything with the key in the corner; retry a failed row',
  why: 'Many transfers at once are a picture, not a sentence: which are done, which move, which failed.',
  tags: ['sync', 'download', 'upload', 'progress', 'transfer'],
})

const syncs = [
  sync({
    id: 'watch-sync-maps',
    size: '2x2',
    domain: 'transit',
    name: 'Offline maps download',
    props: {
      eyebrow: 'Offline maps · Jawa',
      items: [
        { name: 'Jakarta and Bodetabek', sizeMb: 412, done: 1, rate: 0 },
        { name: 'Bandung Raya', sizeMb: 186, done: 0.62, rate: 6.4 },
        { name: 'Semarang', sizeMb: 121, done: 0.18, rate: 5.1 },
        { name: 'Yogyakarta', sizeMb: 98, rate: 5.8 },
      ],
      seed: 'watch-sync-maps',
    },
  }),
  sync({
    id: 'watch-sync-photos',
    size: '2x1',
    domain: 'home',
    name: 'Photo backup',
    props: {
      eyebrow: 'Photo backup · Rina’s phone',
      direction: 'up',
      count: {
        done: 1284,
        total: 3420,
        noun: 'photos',
        perTick: 3,
        current: ['IMG_20261104_0712.jpg', 'IMG_20261104_0713.jpg', 'VID_20261103_1830.mp4', 'IMG_20261103_1902.jpg'],
      },
      layout: 'single',
      seed: 'watch-sync-photos',
    },
  }),
  sync({
    id: 'watch-sync-pacs',
    size: '2x2',
    domain: 'health',
    surface: 'dark',
    name: 'Scans to the archive',
    props: {
      eyebrow: 'Scans to PACS · radiology',
      direction: 'up',
      items: [
        { name: 'CT thorax · RM-08821', sizeMb: 512, done: 1, rate: 0 },
        { name: 'MRI lumbar · RM-08822', sizeMb: 380, done: 0.44, rate: 9.2 },
        { name: 'X-ray chest · RM-08823', sizeMb: 24, done: 0.5, rate: 3, failAt: 0.5 },
        { name: 'CT head · RM-08824', sizeMb: 290, rate: 8.4 },
      ],
      seed: 'watch-sync-pacs',
    },
  }),
  sync({
    id: 'watch-sync-survey',
    size: '1x2',
    domain: 'agri',
    name: 'Field survey sync',
    props: {
      eyebrow: 'Tablets',
      direction: 'up',
      items: [
        { name: 'Tablet 1 · Afdeling 3', sizeMb: 14, done: 1, rate: 0 },
        { name: 'Tablet 2 · Afdeling 5', sizeMb: 22, done: 0.4, rate: 0.6 },
        { name: 'Tablet 3 · Afdeling 7', sizeMb: 18, done: 0.1, rate: 0.5 },
        { name: 'Tablet 4 · nursery', sizeMb: 9, rate: 0.4 },
      ],
      seed: 'watch-sync-survey',
    },
  }),
]

/* ── 18 Activity lamps ────────────────────────────────────────────────────────────── */
const leds = archetype(RackLeds, {
  name: 'Activity lamps',
  hint: 'Pick a unit with the pointer or the arrow keys to read it',
  why: 'Dozens of units working at once read as one flickering picture; a dead one stands out without a query.',
  tags: ['leds', 'rack', 'activity', 'hardware', 'lamps'],
})

const ledTiles = [
  leds({
    id: 'watch-leds-rack',
    size: '1x3',
    domain: 'devops',
    surface: 'dark',
    name: 'Rack activity',
    props: {
      label: 'Rack B07',
      detailLines: 2,
      seed: 'watch-leds-rack',
      units: [
        { name: 'U01', leds: 6, load: 0.7, detail: 'edge-cache-1 · 2,140 req/s · 41 °C' },
        { name: 'U02', leds: 6, load: 0.65, detail: 'edge-cache-2 · 1,980 req/s · 40 °C' },
        { name: 'U03', leds: 6, load: 0.4, detail: 'api-gateway-1 · 38% CPU' },
        { name: 'U04', leds: 6, load: 0.45, detail: 'api-gateway-2 · 41% CPU' },
        { name: 'U05', leds: 6, load: 0.3, detail: 'ledger-1 · 412 IOPS · 38 °C' },
        { name: 'U06', leds: 6, load: 0.3, detail: 'ledger-2 · 398 IOPS · 37 °C' },
        { name: 'U07', leds: 6, load: 0.25, fault: 2, faultWord: 'Disk 3 failed', detail: 'db-replica-2 · rebuild queued' },
        { name: 'U08', leds: 6, load: 0.5, detail: 'kyc-worker · 64 jobs in queue' },
        { name: 'U09', leds: 6, load: 0.2, detail: 'backup-1 · next run 02:00 WIB' },
        { name: 'U10', leds: 6, load: 0.55, detail: 'search-1 · 820 q/s' },
        { name: 'U11', leds: 6, load: 0.1, detail: 'spare · powered, idle' },
        { name: 'U12', leds: 6, load: 0.6, detail: 'top of rack switch · 9.4 Gbit/s' },
      ],
    },
  }),
  leds({
    id: 'watch-leds-nas',
    size: '1x1',
    domain: 'home',
    name: 'Home NAS',
    props: {
      label: 'NAS',
      seed: 'watch-leds-nas',
      units: [
        { name: 'Bay 1', leds: 6, load: 0.35, detail: '4 TB · 61% full' },
        { name: 'Bay 2', leds: 6, load: 0.35, detail: '4 TB · 61% full' },
        { name: 'Bay 3', leds: 6, load: 0.5, detail: '8 TB · photo library' },
        { name: 'Bay 4', leds: 6, load: 0.15, detail: '8 TB · backups' },
      ],
    },
  }),
  leds({
    id: 'watch-leds-switch',
    size: '2x1',
    domain: 'security',
    surface: 'muted',
    name: 'Core switch ports',
    props: {
      label: 'Core switch · SW-CORE-1',
      seed: 'watch-leds-switch',
      units: [
        { name: '1–12', leds: 12, load: 0.55, detail: 'Office floors 3 to 8 · 1 Gbit/s' },
        { name: '13–24', leds: 12, load: 0.4, detail: 'Branch VPN and printers' },
        { name: '25–36', leds: 12, load: 0.3, fault: 6, faultWord: 'Port 31 down', detail: 'CCTV ring · link lost 14 min ago' },
        { name: '37–48', leds: 12, load: 0.6, detail: 'Uplinks and servers · 10 Gbit/s' },
      ],
    },
  }),
  leds({
    id: 'watch-leds-gates',
    size: '2x1',
    domain: 'transit',
    name: 'Ticket gates',
    props: {
      label: 'Gates · Bundaran HI',
      layout: 'columns',
      seed: 'watch-leds-gates',
      units: Array.from({ length: 12 }, (_, i) => ({
        name: `G${i + 1}`,
        leds: 4,
        load: i === 8 ? 0 : 0.18 + (i % 4) * 0.07,
        fault: i === 8 ? 0 : undefined,
        faultWord: i === 8 ? 'Card reader fault' : undefined,
        detail: i === 8 ? 'Out since 13:40 WIB, technician called' : `${412 + i * 37} taps since 05:00 WIB`,
      })),
    },
  }),
]

/* ── 19 Tickets with timers ───────────────────────────────────────────────────────── */
const tickets = archetype(TicketRail, {
  name: 'Tickets with timers',
  hint: 'Clear a ticket with its key; undo for five seconds after',
  why: 'Which order has waited longest is a question asked every minute; the rail answers it as it changes.',
  tags: ['tickets', 'kitchen', 'queue', 'timer', 'orders'],
})

const ticketTiles = [
  tickets({
    id: 'watch-tickets-kitchen',
    size: '4x2',
    domain: 'commerce',
    name: 'Kitchen tickets',
    props: {
      eyebrow: 'Kitchen · Warung Bu Ratna',
      late: 480,
      over: 720,
      columns: 4,
      every: 20,
      tickets: [
        { id: '#0411', title: 'Table 7 · dine in', items: ['Nasi campur ×2', 'Sate ayam ×1', 'Es teh manis ×3'], ago: 760 },
        { id: '#0412', title: 'Delivery · Fikri', items: ['Nasi campur ×2', 'Es teh manis ×1'], ago: 455 },
        { id: '#0413', title: 'Table 2 · dine in', items: ['Soto betawi ×1', 'Kerupuk ×2'], ago: 205 },
        { id: '#0414', title: 'Takeaway', items: ['Gado-gado ×1', 'Teh tawar ×1'], ago: 40 },
      ],
      incoming: [
        { id: '#0415', title: 'Table 4 · dine in', items: ['Rawon ×2', 'Es jeruk ×2'] },
        { id: '#0416', title: 'Delivery · Dimas', items: ['Nasi goreng ×3'] },
        { id: '#0417', title: 'Table 9 · dine in', items: ['Mie ayam ×2', 'Es teh manis ×2'] },
      ],
    },
  }),
  tickets({
    id: 'watch-tickets-pharmacy',
    size: '3x2',
    domain: 'health',
    surface: 'muted',
    name: 'Pharmacy queue',
    props: {
      eyebrow: 'Pharmacy · prescriptions',
      late: 900,
      over: 1500,
      action: 'Ready',
      every: 30,
      tickets: [
        { id: 'RX-2207', title: 'Racikan · Ward 3, bed 9', items: ['Paracetamol syrup 120 ml', 'Amoxicillin 250 mg ×15'], ago: 1560 },
        { id: 'RX-2208', title: 'Outpatient · Clara S.', items: ['Metformin 500 mg ×60'], ago: 620 },
        { id: 'RX-2209', title: 'ICU · bed 4', items: ['Noradrenaline 4 mg ×4', 'Heparin 5,000 IU ×6'], ago: 140 },
      ],
      incoming: [{ id: 'RX-2210', title: 'Outpatient · Ahmad F.', items: ['Amlodipine 5 mg ×30'] }],
    },
  }),
  tickets({
    id: 'watch-tickets-pick',
    size: '2x2',
    domain: 'logistics',
    name: 'Pick tickets',
    props: {
      eyebrow: 'Pick tickets · zone B',
      late: 300,
      over: 600,
      action: 'Picked',
      columns: 2,
      every: 18,
      tickets: [
        { id: 'PK-7712', title: 'KK-0048311', items: ['B-04-2 · Rice cooker ×1', 'B-11-1 · Kettle ×2'], ago: 340 },
        { id: 'PK-7713', title: 'KK-0048315', items: ['B-02-3 · Desk fan ×1'], ago: 95 },
      ],
      incoming: [{ id: 'PK-7714', title: 'KK-0048320', items: ['B-07-1 · Iron ×1', 'B-09-4 · Blender ×1'] }],
    },
  }),
]

/* ── 20 Charging session ──────────────────────────────────────────────────────────── */
const charge = archetype(ChargeSession, {
  name: 'Charging session',
  hint: 'Stop asks once and leaves a receipt; move the limit between 80% and 100%',
  why: 'Charge, power and cost all move while a car charges; one look says when to come back.',
  tags: ['ev', 'charging', 'battery', 'energy', 'live'],
})

const charges = [
  charge({
    id: 'watch-charge-spklu',
    size: '2x2',
    domain: 'energy',
    name: 'Fast charging',
    props: {
      eyebrow: 'SPKLU Rest Area KM 57 · bay 2',
      vehicle: 'B 1924 KZT · 60 kWh battery',
      capacity: 60,
      startPct: 42,
      power: 50,
      tariff: 2467,
      ran: 21,
      seed: 'watch-charge-spklu',
    },
  }),
  charge({
    id: 'watch-charge-ebus',
    size: '2x1',
    domain: 'transit',
    name: 'Electric bus at the depot',
    props: { eyebrow: 'Depot Pulogadung · bus 07-114', capacity: 324, startPct: 22, power: 150, tariff: 1650, ran: 40, layout: 'strip', seed: 'watch-charge-ebus' },
  }),
  charge({
    id: 'watch-charge-garage',
    size: '1x2',
    domain: 'home',
    name: 'Home charger',
    props: { eyebrow: 'Garage', capacity: 40, startPct: 35, power: 7.4, tariff: 1700, ran: 95, limit: 100, layout: 'tall', seed: 'watch-charge-garage' },
  }),
  charge({
    id: 'watch-charge-swap',
    size: '1x1',
    domain: 'energy',
    surface: 'muted',
    name: 'Swap battery',
    props: { eyebrow: 'Slot 3', capacity: 1.8, startPct: 30, power: 0.9, tariff: 1700, ran: 40, layout: 'mini', seed: 'watch-charge-swap' },
  }),
]

/* ── 21 Lift position ─────────────────────────────────────────────────────────────── */
const lift = archetype(LiftShaft, {
  name: 'Lift position',
  hint: 'Click a floor to call the lift, or use the arrow keys and Enter',
  why: 'Where the lift is and which way it goes is read off a column in a glance; nobody asks a lift.',
  tags: ['lift', 'elevator', 'building', 'position', 'live'],
})

const lifts = [
  lift({
    id: 'watch-lift-tower',
    size: '1x3',
    domain: 'workspace',
    name: 'Office lift',
    props: {
      label: 'Lift A',
      floors: ['R', ...Array.from({ length: 20 }, (_, i) => String(20 - i)), 'B1'],
      at: 9,
      calls: [18, 2],
      perFloor: 1,
      busy: 0.1,
      seed: 'watch-lift-tower',
    },
  }),
  lift({
    id: 'watch-lift-ward',
    size: '1x2',
    domain: 'health',
    surface: 'muted',
    name: 'Bed lift',
    props: { label: 'Wing B', floors: ['6', '5', '4', '3', '2', '1', 'G', 'B1'], at: 5, calls: [2], perFloor: 2, busy: 0.05, seed: 'watch-lift-ward' },
  }),
  lift({
    id: 'watch-lift-hoist',
    size: '1x2',
    domain: 'energy',
    surface: 'dark',
    name: 'Mine hoist',
    props: {
      label: 'Shaft 2',
      floors: ['Top', '−120', '−180', '−240', '−300', '−360', '−420'],
      at: 3,
      calls: [6],
      perFloor: 3,
      busy: 0.04,
      seed: 'watch-lift-hoist',
    },
  }),
]

/* ── 22 Water level ───────────────────────────────────────────────────────────────── */
const level = archetype(WaterLevel, {
  name: 'Water level',
  hint: 'Step through the gauges with the arrow keys or the two keys by the name',
  why: 'A rising level against its alert marks is a picture people read before they would think to ask.',
  tags: ['water', 'flood', 'level', 'gauge', 'live'],
})

const SIAGA = (s3: number, s2: number, s1: number) => [
  { from: 0, word: 'Normal', tone: 'success' as const },
  { from: s3, word: 'Siaga 3', tone: 'warning' as const },
  { from: s2, word: 'Siaga 2', tone: 'warning' as const },
  { from: s1, word: 'Siaga 1', tone: 'danger' as const },
]

const levels = [
  level({
    id: 'watch-level-manggarai',
    size: '1x2',
    domain: 'civic',
    surface: 'signal',
    name: 'Flood gate levels',
    props: {
      label: 'Flood gates',
      seed: 'watch-level-manggarai',
      stations: [
        { name: 'Pintu Air Manggarai', level: 862, trend: 0.03, min: 500, max: 1100, bands: SIAGA(750, 850, 950) },
        { name: 'Bendung Katulampa', level: 118, trend: 0.015, min: 0, max: 300, bands: SIAGA(80, 150, 200) },
        { name: 'Pos Depok', level: 236, trend: 0.02, min: 0, max: 450, bands: SIAGA(200, 270, 350) },
      ],
    },
  }),
  level({
    id: 'watch-level-tide',
    size: '2x1',
    domain: 'logistics',
    name: 'Tide at the berth',
    props: {
      label: 'Tide · port berths',
      unit: 'm',
      decimals: 2,
      every: 3,
      layout: 'strip',
      seed: 'watch-level-tide',
      stations: [
        {
          name: 'Tanjung Priok · berth 3',
          level: 1.12,
          trend: 0.0003,
          min: 0,
          max: 2.2,
          bands: [
            { from: 0, word: 'Too low', tone: 'warning' },
            { from: 0.6, word: 'Workable', tone: 'success' },
            { from: 1.8, word: 'High', tone: 'warning' },
          ],
        },
        {
          name: 'Tanjung Perak · berth 1',
          level: 1.64,
          trend: -0.0002,
          min: 0,
          max: 2.6,
          bands: [
            { from: 0, word: 'Too low', tone: 'warning' },
            { from: 0.7, word: 'Workable', tone: 'success' },
            { from: 2.1, word: 'High', tone: 'warning' },
          ],
        },
      ],
    },
  }),
  level({
    id: 'watch-level-reservoir',
    size: '2x2',
    domain: 'energy',
    name: 'Reservoir level',
    props: {
      label: 'Hydro reservoirs',
      unit: 'm',
      decimals: 2,
      every: 3,
      layout: 'card',
      seed: 'watch-level-reservoir',
      stations: [
        {
          name: 'Waduk Jatiluhur',
          level: 104.62,
          trend: -0.00005,
          min: 75,
          max: 111,
          bands: [
            { from: 0, word: 'Low', tone: 'warning' },
            { from: 87.5, word: 'Normal', tone: 'success' },
            { from: 107, word: 'Spill', tone: 'warning' },
          ],
        },
        {
          name: 'Waduk Cirata',
          level: 214.3,
          trend: 0.00004,
          min: 190,
          max: 223,
          bands: [
            { from: 0, word: 'Low', tone: 'warning' },
            { from: 200, word: 'Normal', tone: 'success' },
            { from: 220, word: 'Spill', tone: 'warning' },
          ],
        },
      ],
    },
  }),
  level({
    id: 'watch-level-paddy',
    size: '1x1',
    domain: 'agri',
    name: 'Paddy water',
    props: {
      label: 'Paddy water',
      decimals: 1,
      layout: 'mini',
      seed: 'watch-level-paddy',
      stations: [
        {
          name: 'Petak 12 · Karawang',
          level: 5.2,
          trend: -0.0006,
          min: 0,
          max: 12,
          bands: [
            { from: 0, word: 'Dry', tone: 'warning' },
            { from: 3, word: 'Good', tone: 'success' },
            { from: 8, word: 'Too deep', tone: 'warning' },
          ],
        },
        {
          name: 'Petak 14 · Karawang',
          level: 2.6,
          trend: -0.0005,
          min: 0,
          max: 12,
          bands: [
            { from: 0, word: 'Dry', tone: 'warning' },
            { from: 3, word: 'Good', tone: 'success' },
            { from: 8, word: 'Too deep', tone: 'warning' },
          ],
        },
      ],
    },
  }),
]

/* ── 23 Ping by region ────────────────────────────────────────────────────────────── */
const ping = archetype(RegionPing, {
  name: 'Ping by region',
  hint: 'Pick a row with the pointer or the arrow keys to read it; Ping now sends a round',
  why: 'Which place is slow right now is a comparison across rows; it reads in a look and changes by the second.',
  tags: ['ping', 'latency', 'network', 'regions', 'live'],
})

const pings = [
  ping({
    id: 'watch-ping-edge',
    size: '2x2',
    domain: 'devops',
    name: 'Edge round trips',
    props: {
      eyebrow: 'Edge PoPs · from Jakarta',
      slow: 200,
      seed: 'watch-ping-edge',
      targets: [
        { code: 'CGK', name: 'Jakarta', base: 4, vol: 0.3 },
        { code: 'SUB', name: 'Surabaya', base: 14 },
        { code: 'SIN', name: 'Singapore', base: 19 },
        { code: 'HKG', name: 'Hong Kong', base: 48 },
        { code: 'NRT', name: 'Tokyo', base: 86 },
        { code: 'FRA', name: 'Frankfurt', base: 182, loss: 0.05 },
      ],
    },
  }),
  ping({
    id: 'watch-ping-branches',
    size: '3x2',
    domain: 'banking',
    name: 'Branch links',
    props: {
      eyebrow: 'Branch links · Arunika Bank',
      slow: 90,
      seed: 'watch-ping-branches',
      targets: [
        { code: 'MDN', name: 'Medan, Jl. Balai Kota', base: 38 },
        { code: 'BDG', name: 'Bandung, Dago', base: 12 },
        { code: 'SUB', name: 'Surabaya, Tunjungan', base: 18 },
        { code: 'DPS', name: 'Denpasar, Renon', base: 26 },
        { code: 'UPG', name: 'Makassar, Panakkukang', base: 44 },
        { code: 'DJJ', name: 'Jayapura, Abepura', base: 78, vol: 0.3, loss: 0.12 },
      ],
    },
  }),
  ping({
    id: 'watch-ping-ground',
    size: '2x1',
    domain: 'aerospace',
    name: 'Ground station links',
    props: {
      eyebrow: 'Ground station links',
      slow: 120,
      seed: 'watch-ping-ground',
      targets: [
        { code: 'BIK', name: 'Biak', base: 61 },
        { code: 'PRE', name: 'Parepare', base: 34 },
        { code: 'JKT', name: 'Jakarta', base: 9 },
      ],
    },
  }),
  ping({
    id: 'watch-ping-vpn',
    size: '1x1',
    domain: 'security',
    name: 'VPN tunnel',
    props: {
      eyebrow: 'VPN tunnel',
      slow: 80,
      layout: 'single',
      seed: 'watch-ping-vpn',
      targets: [{ code: 'VPN', name: 'Jakarta office', base: 22, vol: 0.2, loss: 0.02 }],
    },
  }),
]

/* ── 24 Now playing ───────────────────────────────────────────────────────────────── */
const play = archetype(NowPlaying, {
  name: 'Now playing',
  hint: 'Play, pause and skip with the keys; on air, the key mutes the monitor',
  why: 'What is on and how long it has left changes by the second; the transport sits next to it.',
  tags: ['audio', 'player', 'radio', 'transport', 'live'],
})

const plays = [
  play({
    id: 'watch-play-onair',
    size: '2x1',
    domain: 'media',
    surface: 'signal',
    name: 'On air',
    props: {
      eyebrow: 'Radio Suara Kota · 101.4 FM',
      mode: 'onair',
      position: 412,
      seed: 'watch-play-onair',
      tracks: [
        { title: 'Kabar Sore', artist: 'News at five · Laras Wulandari', secs: 600 },
        { title: 'Senja di Dermaga', artist: 'Orkes Lima Warna', secs: 252 },
        { title: 'Traffic and weather', artist: 'With Fikri Ramadhan', secs: 180 },
      ],
    },
  }),
  play({
    id: 'watch-play-speaker',
    size: '1x1',
    domain: 'home',
    name: 'Living room speaker',
    props: {
      eyebrow: 'Speaker',
      position: 82,
      layout: 'mini',
      seed: 'watch-play-speaker',
      tracks: [
        { title: 'Gerimis November', artist: 'Ruang Tamu', secs: 214 },
        { title: 'Kopi Pagi', artist: 'Teras Belakang', secs: 188 },
      ],
    },
  }),
  play({
    id: 'watch-play-store',
    size: '2x1',
    domain: 'commerce',
    surface: 'muted',
    name: 'In-store music',
    props: {
      eyebrow: 'In-store music · Toko 14',
      position: 120,
      seed: 'watch-play-store',
      tracks: [
        { title: 'Pasar Malam', artist: 'Lantai Dua', secs: 201 },
        { title: 'Langkah Pelan', artist: 'Dua Arah', secs: 236 },
        { title: 'Kota Tua', artist: 'Ruang Tamu', secs: 190 },
      ],
    },
  }),
  play({
    id: 'watch-play-studio',
    size: '2x2',
    domain: 'audio',
    surface: 'dark',
    name: 'Studio playback',
    props: {
      eyebrow: 'Studio B · playback',
      position: 1388,
      timecode: true,
      layout: 'card',
      seed: 'watch-play-studio',
      tracks: [
        { title: 'Mix 3 · v2', artist: 'Episode 14 · Pasar Terapung', secs: 2712 },
        { title: 'Mix 3 · v1', artist: 'Episode 14 · Pasar Terapung', secs: 2698 },
      ],
    },
  }),
]

/* ── 25 Dot-matrix activity ───────────────────────────────────────────────────────── */
const dots = archetype(LedColumns, {
  name: 'Dot-matrix activity',
  hint: 'Run the pointer along the columns to read one; the key in the corner switches the reading',
  why: 'A rhythm of activity is easier to feel in a moving matrix than to read as a column of numbers.',
  tags: ['dot matrix', 'activity', 'instrument', 'live'],
})

const dotTiles = [
  dots({
    id: 'watch-dots-waf',
    size: '2x1',
    domain: 'security',
    surface: 'dark',
    name: 'Blocked requests',
    props: {
      label: 'WAF · edge',
      seed: 'watch-dots-waf',
      metrics: [
        { label: 'Blocked', unit: 'req/s', base: 42, vol: 0.4, max: 120 },
        { label: 'Bots', unit: 'req/s', base: 18, vol: 0.35, max: 60 },
      ],
    },
  }),
  dots({
    id: 'watch-dots-footfall',
    size: '1x1',
    domain: 'commerce',
    name: 'Footfall',
    props: {
      label: 'Toko 14 doors',
      rows: 6,
      seed: 'watch-dots-footfall',
      metrics: [
        { label: 'In', unit: 'per min', base: 14, vol: 0.4, max: 40 },
        { label: 'Out', unit: 'per min', base: 12, vol: 0.4, max: 40 },
      ],
    },
  }),
  dots({
    id: 'watch-dots-spectrum',
    size: '1x1',
    domain: 'audio',
    surface: 'dark',
    name: 'Spectrum',
    props: {
      label: 'Mix bus',
      kind: 'spectrum',
      seed: 'watch-dots-spectrum',
      metrics: [{ label: 'Mix', unit: 'dB', base: 30, max: 60 }],
    },
  }),
]

/* ── The chapter, in an order that keeps neighbours different ─────────────────────── */
const all = [
  ...counters,
  ...streams,
  ...jobs,
  ...counts,
  ...stopwatches,
  ...lines,
  ...queues,
  ...tracks,
  ...pipes,
  ...tallies,
  ...traces,
  ...scopes,
  ...legs,
  ...books,
  ...captionTiles,
  ...recs,
  ...syncs,
  ...ledTiles,
  ...ticketTiles,
  ...charges,
  ...lifts,
  ...levels,
  ...pings,
  ...plays,
  ...dotTiles,
]

const order = [
  'counter-gateway', 'stream-webhooks', 'count-flashsale', 'queue-teller', 'trace-ecg', 'job-firmware',
  'line-latency', 'rec-meeting', 'level-manggarai', 'tally-offsite', 'scope-natuna', 'play-store',
  'counter-solar', 'pipe-ci', 'sw-resus', 'dots-footfall', 'leg-cgkdps', 'count-range',
  'sync-maps', 'charge-swap', 'stream-signin', 'queue-chat', 'job-upload', 'trace-pleth',
  'book-cpo', 'leds-switch', 'counter-qris', 'track-parcel', 'level-paddy', 'tickets-pharmacy',
  'lift-hoist', 'ping-vpn', 'captions-dprd', 'line-usdidr', 'sw-take', 'tally-village',
  'count-staticfire', 'rec-field', 'job-payroll', 'leds-nas', 'line-frequency', 'queue-clinic',
  'play-speaker', 'track-food', 'dots-waf', 'counter-viewers', 'scope-drones', 'leds-rack',
  'captions-station', 'charge-spklu', 'tally-sizes', 'pipe-settlement', 'trace-seismic', 'stream-scans',
  'leg-medevac', 'ping-branches', 'count-water', 'sync-photos', 'play-studio', 'lift-tower',
  'job-deploy', 'level-tide', 'counter-taps', 'tickets-kitchen', 'rec-podcast', 'line-power',
  'tally-viewers', 'sw-standup', 'ping-ground', 'scope-strait', 'dots-spectrum', 'track-harvest',
  'book-usdidr', 'queue-samsat', 'charge-ebus', 'captions-townhall', 'lift-ward', 'pipe-docs',
  'sync-pacs', 'leds-gates', 'trace-turbine', 'stream-wire', 'sw-dock', 'charge-garage',
  'leg-cargo', 'level-reservoir', 'captions-broadcast', 'pipe-pass', 'rec-hearing', 'ping-edge',
  'play-onair', 'track-blood', 'book-carbon', 'line-reefer', 'job-downlink', 'sync-survey',
  'stream-deploy', 'count-clearing', 'leg-ferry', 'tickets-pick',
]

const byId = new Map(all.map((e) => [e.id, e]))
export const entries: MoodEntry[] = order.map((id) => byId.get(`watch-${id}`)!)
