/**
 * Chapter 08 · Respond — "Needs eyes now". Alarms, pages and warnings: each interrupts once, says
 * what and since when, and puts the one action next to it. Colour keeps its roles: danger red for
 * what broke, amber with a word for what drifts, International Orange only for what is live now.
 *
 * Variants are declared per pattern below; `order` sets the reading rhythm of the chapter.
 */
import { archetype } from '../../kit'
import type { MoodEntry } from '../../types'
import AlarmBanner from './AlarmBanner.vue'
import Annunciator from './Annunciator.vue'
import AutoAction from './AutoAction.vue'
import Backoff from './Backoff.vue'
import BatteryCritical from './BatteryCritical.vue'
import ConflictPick from './ConflictPick.vue'
import DeadlineSoon from './DeadlineSoon.vue'
import EmergencyStop from './EmergencyStop.vue'
import EmptyNext from './EmptyNext.vue'
import FieldError from './FieldError.vue'
import GeofenceExit from './GeofenceExit.vue'
import HazardReroute from './HazardReroute.vue'
import IncidentCard from './IncidentCard.vue'
import IncomingPage from './IncomingPage.vue'
import LowStock from './LowStock.vue'
import MasterCaution from './MasterCaution.vue'
import NotificationStack from './NotificationStack.vue'
import RetryFailed from './RetryFailed.vue'
import SafetyCheck from './SafetyCheck.vue'
import SlaCountdown from './SlaCountdown.vue'
import StatusBanner from './StatusBanner.vue'
import ThresholdMute from './ThresholdMute.vue'
import ToastAction from './ToastAction.vue'
import VitalAlarm from './VitalAlarm.vue'
import WasThisYou from './WasThisYou.vue'

/* ── Patterns ──────────────────────────────────────────────────────────────────────── */

const alarm = archetype(AlarmBanner, {
  name: 'Alarm banner',
  hint: 'Acknowledge to quiet the banner; Undo raises it again',
  why: 'An outage has to interrupt once, in one place, with the action beside it; a message in a thread is read too late.',
  tags: ['alarm', 'banner', 'acknowledge', 'alert'],
})

const incident = archetype(IncidentCard, {
  name: 'Incident card',
  hint: 'Acknowledge to stop the escalation clock, escalate now, then resolve',
  why: 'Severity, age, impact and who is paged read in one look; the person on call needs the facts and two keys, not a chat.',
  tags: ['incident', 'on-call', 'acknowledge', 'escalate', 'severity'],
})

const page = archetype(IncomingPage, {
  name: 'Incoming page',
  hint: 'Accept or decline before the clock runs out; hand back or undo after',
  why: 'A page is a question with a deadline; a clock and two keys answer it faster than a reply.',
  tags: ['page', 'call', 'accept', 'decline', 'countdown'],
})

const threshold = archetype(ThresholdMute, {
  name: 'Threshold breach',
  hint: 'Mute for a fixed time, or unmute; the reading stays live',
  why: 'A line crossing a dashed limit shows how bad and how fast at once; the mute says exactly until when.',
  tags: ['threshold', 'limit', 'mute', 'live', 'breach'],
})

const caution = archetype(MasterCaution, {
  name: 'Master caution',
  hint: 'Press the lamp to reset it; press it dark to recall',
  why: 'One big lamp that is also its button: a person sees it from across the room and puts it out with one press.',
  tags: ['lamp', 'caution', 'cockpit', 'reset', 'annunciator'],
})

const wasYou = archetype(WasThisYou, {
  name: 'Was this you?',
  hint: 'Answer yes or no; either can be undone',
  why: 'Only the person knows if it was them; two answers next to the amount settle it in a second.',
  tags: ['fraud', 'check', 'security', 'confirm', 'card'],
})

const stack = archetype(NotificationStack, {
  name: 'Notification stack',
  hint: 'Open a row to mark it read; the cross or Delete dismisses; undo for six seconds',
  why: 'A short stack shows what came in and lets a person clear it item by item, faster than asking what is new.',
  tags: ['notifications', 'inbox', 'dismiss', 'undo'],
})

const annunciator = archetype(Annunciator, {
  name: 'Annunciator panel',
  hint: 'Arrow keys move between windows; Enter acknowledges one; Acknowledge, Reset and Test below',
  why: 'A grid of labelled windows shows every condition at once and which are new; no list or sentence reads as fast.',
  tags: ['annunciator', 'lamps', 'control room', 'acknowledge', 'alarm'],
})

const toast = archetype(ToastAction, {
  name: 'Toast with undo',
  hint: 'Act, then Undo in the toast at the bottom of the screen, or Restore here',
  why: 'Done at once, said once, reversible for a few seconds: a toast is the lightest way to confirm without asking first.',
  tags: ['toast', 'undo', 'snackbar', 'confirm'],
})

const status = archetype(StatusBanner, {
  name: 'Service status',
  hint: 'Subscribe to updates, or unsubscribe',
  why: 'Saying what is affected and since when, where people use it, saves a hundred people asking the same question.',
  tags: ['status', 'degraded', 'outage', 'subscribe'],
})

const stock = archetype(LowStock, {
  name: 'Low stock',
  hint: 'Reorder the suggested amount, nudge it first, or cancel the order',
  why: 'How many are left and when they run out read faster than a stock report; the reorder is already worked out.',
  tags: ['stock', 'inventory', 'reorder', 'low'],
})

const vital = archetype(VitalAlarm, {
  name: 'Vital sign alarm',
  hint: 'Silence the sound for two minutes; the alarm stays on screen',
  why: 'A nurse reads the figure and the trace from the door; silencing is the one thing to do before reaching the bed.',
  tags: ['patient', 'monitor', 'alarm', 'silence', 'health'],
})

const reroute = archetype(HazardReroute, {
  name: 'Hazard reroute',
  hint: 'Pick a route with the arrow keys or a click, then take it; Undo goes back',
  why: 'The detour, its cost and the blocked road compare at a glance; describing three routes in words takes a paragraph.',
  tags: ['route', 'hazard', 'weather', 'flood', 'detour'],
})

const sla = archetype(SlaCountdown, {
  name: 'SLA countdown',
  hint: 'Take it to put your name on it; Release gives it back',
  why: 'Time left is a number that changes every second; looking at it beats asking how long is left.',
  tags: ['sla', 'deadline', 'countdown', 'support'],
})

const retry = archetype(RetryFailed, {
  name: 'Failed, retry',
  hint: 'Retry and watch it work; the result replaces the error',
  why: 'The reason, the retry and its result in one place let a person fix a failure without opening a log.',
  tags: ['error', 'failed', 'retry', 'payment', 'loading'],
})

const backoff = archetype(Backoff, {
  name: 'Backoff timer',
  hint: 'Wait for the clock, or retry now',
  why: 'A wait that counts down where the person is looking ends the guessing about when to try again.',
  tags: ['rate limit', 'backoff', 'cooldown', 'retry', 'timer'],
})

const battery = archetype(BatteryCritical, {
  name: 'Battery critical',
  hint: 'Take the safe action now; undo it if the battery holds',
  why: 'Cells and minutes left are read in a look, and the safe action has to be one press away while there is time.',
  tags: ['battery', 'power', 'critical', 'drone', 'ups'],
})

const deadline = archetype(DeadlineSoon, {
  name: 'Deadline soon',
  hint: 'Do it now, or ask to be reminded; both can be undone',
  why: 'A date block and the days left say how urgent it is before a word is read.',
  tags: ['deadline', 'due', 'reminder', 'bill'],
})

const conflict = archetype(ConflictPick, {
  name: 'Double-booked',
  hint: 'Pick the one to keep with the arrow keys or a click, then keep it',
  why: 'Two bars on one axis show the overlap at once; a person picks the one to keep, the rest follows.',
  tags: ['conflict', 'calendar', 'booking', 'overlap'],
})

const geofence = archetype(GeofenceExit, {
  name: 'Left the fence',
  hint: 'Call whoever is with it, or close it as planned',
  why: 'A track leaving a dashed fence says where and how far at once; a map beats an address.',
  tags: ['geofence', 'fleet', 'map', 'tracking'],
})

const estop = archetype(EmergencyStop, {
  name: 'Emergency stop',
  hint: 'Press to stop at once; press again to release; Start restarts after a warning',
  why: 'Stopping a machine cannot wait for a sentence; one press, and a deliberate second step to undo it.',
  tags: ['stop', 'emergency', 'machine', 'safety'],
})

const auto = archetype(AutoAction, {
  name: 'Automatic in…',
  hint: 'Cancel to stop it, or do it now; undo after',
  why: 'When the system will act by itself, a visible clock and a cancel key keep a person in charge.',
  tags: ['automation', 'countdown', 'cancel', 'failover'],
})

const field = archetype(FieldError, {
  name: 'Inline field error',
  hint: 'Type to fix it, or take the suggested fix',
  why: 'The error sits under the mistake and says how to fix it, so the person fixes it where they are typing.',
  tags: ['form', 'error', 'validation', 'input'],
})

const safety = archetype(SafetyCheck, {
  name: 'Are you safe?',
  hint: 'Answer safe or need help; change it after',
  why: 'After an earthquake or an alarm, two answers and a tally of the team are all anyone needs to see.',
  tags: ['safety', 'emergency', 'check-in', 'evacuation'],
})

const empty = archetype(EmptyNext, {
  name: 'Nothing needs you',
  hint: 'Take the suggested next step; undo it',
  why: 'An empty queue still earns its screen when it says why it is empty and what to do next.',
  tags: ['empty', 'quiet', 'next action'],
})

/* ── Variants ──────────────────────────────────────────────────────────────────────── */

const all: MoodEntry[] = [
  /* Alarm banner */
  alarm({
    id: 'respond-alarm-settlement',
    size: '4x1',
    domain: 'banking',
    name: 'Settlement alarm',
    props: {
      tone: 'danger',
      eyebrow: 'Settlement · Bank Sagara',
      title: 'Settlement file for 12 Nov was rejected',
      body: '1,204 transfers did not settle. Resend before the 15:00 WIB cut-off or they roll to tomorrow.',
      open: 412,
      facts: ['File STL-20261112-03', 'Reason: duplicate batch id', 'Runbook RB-114'],
    },
  }),
  alarm({
    id: 'respond-alarm-fire',
    size: '3x1',
    domain: 'logistics',
    surface: 'dark',
    name: 'Fire alarm banner',
    props: {
      tone: 'danger',
      eyebrow: 'Fire alarm · Gudang B, Cikarang',
      title: 'Smoke in zone 3, aisles 14 to 18',
      body: 'Detector 3-14 went off at 14:02 WIB. Sprinklers armed, roller doors closing.',
      open: 95,
      facts: ['41 people on shift', 'Muster point B'],
    },
  }),
  alarm({
    id: 'respond-alarm-pressure',
    size: '3x1',
    domain: 'energy',
    surface: 'muted',
    name: 'Low pressure warning',
    props: {
      tone: 'warning',
      eyebrow: 'Gas line 2 · Cilegon',
      title: 'Line pressure low at 38 bar',
      body: 'Under the 40 bar minimum since 13:51 WIB. Compressor C2 is ramping up.',
      open: 640,
      facts: ['Minimum 40 bar', 'Falling 0.4 bar/min'],
    },
  }),
  alarm({
    id: 'respond-alarm-bridge',
    size: '2x1',
    domain: 'devops',
    name: 'Bridge is live',
    hint: 'Join the call; Undo leaves it',
    props: {
      tone: 'signal',
      eyebrow: 'INC-2292 · payments-core',
      title: 'Incident bridge is live',
      body: '7 people on the call. Ayu Lestari leads.',
      action: 'Join bridge',
      done: 'Joined',
      open: 214,
    },
  }),

  /* Incident card */
  incident({
    id: 'respond-incident-auths',
    size: '2x2',
    domain: 'payments',
    surface: 'dark',
    props: {
      code: 'INC-2291',
      sev: 1,
      title: 'Card authorisations failing at Bank Pesisir',
      where: 'payments-core · ap-southeast-3',
      impact: '18%',
      impactNote: 'of card auths declined',
      open: 761,
      primary: 'Rizky Pratama',
      secondary: 'Kevin Tan',
      escalateIn: 161,
    },
  }),
  incident({
    id: 'respond-incident-ledger',
    size: '2x2',
    domain: 'banking',
    name: 'Ledger incident',
    props: {
      code: 'INC-2287',
      sev: 2,
      title: 'Day-end ledger close is running late',
      where: 'ledger · close-batch-1112',
      impact: '40 min',
      impactNote: 'behind the 18:00 WIB cut-off',
      open: 2405,
      primary: 'Andika Saputra',
      secondary: 'Ayu Lestari',
      escalateIn: 300,
    },
  }),
  incident({
    id: 'respond-incident-signal',
    size: '3x2',
    domain: 'transit',
    surface: 'muted',
    name: 'Line incident',
    props: {
      code: 'INC-0418',
      sev: 1,
      title: 'Signal failure between Manggarai and Jatinegara',
      where: 'Bekasi line · interlocking MRI-2',
      impact: '14',
      impactNote: 'trains held at platforms',
      open: 1140,
      primary: 'Wahyu Setiawan',
      secondary: 'Lina Wijaya',
      escalateIn: 240,
      updates: [
        { time: '14:02 WIB', text: 'Track circuit 12B shows occupied with no train on it.' },
        { time: '14:06 WIB', text: 'Trains held at Manggarai and Jatinegara. Platform announcements running.' },
        { time: '14:11 WIB', text: 'Maintainer on the way from Cawang, about 9 min out.' },
      ],
    },
  }),
  incident({
    id: 'respond-incident-ransom',
    size: '2x2',
    domain: 'security',
    surface: 'dark',
    name: 'Security incident',
    props: {
      code: 'SEC-1093',
      sev: 1,
      title: 'Ransomware behaviour on FIN-WS-0412',
      where: 'Endpoint agent · finance, floor 12',
      impact: '312',
      impactNote: 'files renamed in 2 min',
      open: 184,
      primary: 'Fajar Nugroho',
      secondary: 'Yusuf Hakim',
      escalateIn: 120,
    },
  }),

  /* Incoming page */
  page({
    id: 'respond-page-oncall',
    size: '2x2',
    domain: 'devops',
    surface: 'signal',
    props: {
      kind: 'Page · payments on-call',
      title: 'payments-core p99 latency at 2.4 s',
      detail: 'Over the 1.5 s limit for 5 min in ap-southeast-3.',
      lines: [
        { label: 'Source', value: 'api-gateway monitor' },
        { label: 'Runbook', value: 'RB-031 · latency' },
      ],
      timeout: 60,
      accepted: 'You own it. Bridge INC-2292 is open.',
      declined: 'Paged Kevin Tan instead.',
      missed: 'Escalated to Kevin Tan after 60 s.',
      acceptTone: 'neutral',
    },
  }),
  page({
    id: 'respond-page-nurse',
    size: '1x2',
    domain: 'health',
    name: 'Nurse call',
    props: {
      kind: 'Nurse call',
      icon: 'bell',
      layout: 'tall',
      title: 'Bed 7, Ward 3 pressed the call button',
      detail: 'Pak Hendra, day 2 after knee surgery.',
      timeout: 120,
      accept: 'On my way',
      decline: 'Pass on',
      accepted: 'Bed 7 knows you are coming.',
      declined: 'Passed to the next nurse on the ward.',
      missed: 'Moved to the charge nurse.',
    },
  }),
  page({
    id: 'respond-page-dispatch',
    size: '2x1',
    domain: 'transit',
    name: 'Job offer',
    props: {
      kind: 'New job · 1.2 km away',
      icon: 'car',
      layout: 'row',
      title: 'Kemang Raya to Blok M',
      detail: 'Rp 38.000 · pickup in 4 min · 2 riders, 1 suitcase',
      timeout: 15,
      decline: 'Skip',
      accepted: 'Head to Kemang Raya 12.',
      declined: 'Offered to the next driver.',
      missed: 'Offered to the next driver.',
    },
  }),
  page({
    id: 'respond-page-radio',
    size: '1x2',
    domain: 'defense',
    surface: 'dark',
    name: 'Radio call',
    props: {
      kind: 'Radio · channel 4',
      icon: 'radio',
      layout: 'tall',
      title: 'ELANG 2 calls base: contact in sector 7',
      detail: 'Priority traffic from a patrol boat, 3 crew.',
      timeout: 45,
      accept: 'Answer',
      decline: 'Hand to ops',
      accepted: 'Channel 4 open. Log started.',
      declined: 'Passed to the duty officer.',
      missed: 'Logged as missed. Duty officer paged.',
    },
  }),

  /* Threshold breach */
  threshold({
    id: 'respond-threshold-reefer',
    size: '2x1',
    domain: 'logistics',
    name: 'Reefer too warm',
    props: {
      label: 'Reefer SKGU 482109',
      sub: 'Supply air · bay 14',
      unit: '°C',
      limit: 8,
      seed: 'respond-reefer',
      start: 9.2,
      min: 7.7,
      max: 10.4,
      vol: 0.03,
      outFor: 720,
    },
  }),
  threshold({
    id: 'respond-threshold-pm25',
    size: '2x2',
    domain: 'civic',
    name: 'Air quality alert',
    props: {
      label: 'PM2.5 · Kemayoran',
      sub: 'Station JKT-03 · 1-hour average',
      unit: 'µg/m³',
      limit: 55,
      word: 'Unhealthy',
      tone: 'danger',
      seed: 'respond-pm25',
      start: 68,
      min: 52,
      max: 84,
      vol: 0.03,
      decimals: 0,
      outFor: 2400,
      mute: 60,
      layout: 'panel',
    },
  }),
  threshold({
    id: 'respond-threshold-disk',
    size: '2x1',
    domain: 'devops',
    surface: 'dark',
    name: 'Disk almost full',
    props: {
      label: 'db-ledger-02 · /var/lib/pg',
      unit: '%',
      limit: 90,
      word: 'Over 90%',
      seed: 'respond-disk',
      start: 92.4,
      min: 89.4,
      max: 95.5,
      vol: 0.004,
      outFor: 380,
    },
  }),
  threshold({
    id: 'respond-threshold-trafo',
    size: '2x2',
    domain: 'energy',
    surface: 'dark',
    name: 'Transformer hot',
    props: {
      label: 'Trafo 2 · GI Cawang',
      sub: 'Top oil · trips at 105 °C',
      unit: '°C',
      limit: 95,
      word: 'Hot',
      seed: 'respond-trafo',
      start: 96.6,
      min: 93.8,
      max: 100,
      vol: 0.006,
      outFor: 1500,
      mute: 30,
      layout: 'panel',
    },
  }),
  threshold({
    id: 'respond-threshold-usdidr',
    size: '2x1',
    domain: 'banking',
    surface: 'muted',
    name: 'Rate alert',
    props: {
      label: 'USD/IDR · spot',
      unit: 'IDR',
      limit: 16500,
      word: 'Over alert',
      seed: 'respond-usdidr',
      start: 16512,
      min: 16482,
      max: 16560,
      vol: 0.0004,
      decimals: 0,
      outFor: 260,
    },
  }),

  /* Master caution */
  caution({
    id: 'respond-caution-hyd',
    size: '1x1',
    domain: 'aerospace',
    surface: 'dark',
    props: { legend: ['Master', 'caution'], tone: 'warning', cause: 'HYD B · low press', next: 'Fuel · imbalance' },
  }),
  caution({
    id: 'respond-caution-radar',
    size: '1x1',
    domain: 'defense',
    surface: 'dark',
    name: 'Master warning',
    props: { legend: ['Master', 'warning'], tone: 'danger', cause: 'Radar · coolant temp' },
  }),
  caution({
    id: 'respond-caution-grid',
    size: '1x1',
    domain: 'energy',
    name: 'Grid alarm lamp',
    props: { legend: ['Grid', 'alarm'], tone: 'danger', cause: 'GI Gandul · bus trip' },
  }),
  caution({
    id: 'respond-caution-door',
    size: '1x1',
    domain: 'transit',
    surface: 'muted',
    name: 'Door fault lamp',
    props: { legend: ['Door', 'fault'], tone: 'warning', cause: 'Car 6 · door 3 open', next: 'Car 2 · door 1 open', nextAfter: 10 },
  }),
  caution({
    id: 'respond-caution-smoke',
    size: '1x1',
    domain: 'home',
    name: 'Smoke alarm',
    hint: 'Press to hush it; press it dark to check again',
    props: { legend: ['Smoke', 'alarm'], tone: 'danger', cause: 'Kitchen · detector 2' },
  }),

  /* Was this you? */
  wasYou({
    id: 'respond-wasyou-card',
    size: '2x2',
    domain: 'payments',
    name: 'Card payment check',
    props: {
      eyebrow: 'Card ···· 4471',
      figure: 'Rp 8.450.000',
      what: 'Toko Elektronik Sinar, Batam',
      lines: [
        { label: 'When', value: 'Fri 6 Nov, 02:14 WIB' },
        { label: 'Where', value: 'Batam, 880 km from usual' },
        { label: 'How', value: 'Online, card not present' },
      ],
      no: 'No, freeze card',
      yesDone: 'Marked as yours. Thanks for checking.',
      noDone: 'Card frozen and the payment stopped. A new card is on its way.',
      noWord: 'Frozen',
    },
  }),
  wasYou({
    id: 'respond-wasyou-signin',
    size: '2x2',
    domain: 'security',
    surface: 'dark',
    name: 'New sign-in',
    props: {
      eyebrow: 'Sign-in · Simpul workspace',
      what: 'A new browser on a laptop in Medan, at 02:14 WIB.',
      lines: [
        { label: 'Device', value: 'Laptop, never seen before' },
        { label: 'Place', value: 'Medan, Sumatera Utara' },
        { label: 'Address', value: '203.0.113.42' },
      ],
      no: 'No, secure account',
      yesDone: 'Device added to your trusted list.',
      noDone: 'Signed that device out. Change your password next.',
      noWord: 'Secured',
    },
  }),
  wasYou({
    id: 'respond-wasyou-payee',
    size: '2x1',
    domain: 'banking',
    name: 'New payee check',
    props: {
      eyebrow: 'Transfer · new payee',
      figure: 'Rp 25.000.000',
      what: 'to Andi Saputra at Bank Pesisir',
      yes: 'It’s me',
      no: 'Stop transfer',
      yesDone: 'Sent, and the payee is saved.',
      noDone: 'Stopped. Nothing left your account.',
      noWord: 'Stopped',
      layout: 'row',
    },
  }),
  wasYou({
    id: 'respond-wasyou-wallet',
    size: '2x1',
    domain: 'commerce',
    name: 'Top-up check',
    props: {
      eyebrow: 'Wallet top-up · new phone',
      figure: 'Rp 2.000.000',
      what: 'from a phone you have not used before',
      yes: 'Yes, new phone',
      no: 'Block it',
      yesDone: 'Phone added. Top-up done.',
      noDone: 'Blocked, and the phone is signed out.',
      noWord: 'Blocked',
      layout: 'row',
    },
  }),

  /* Notification stack */
  stack({
    id: 'respond-stack-workspace',
    size: '2x2',
    domain: 'workspace',
    props: {
      title: 'Inbox',
      items: [
        { id: 'w1', icon: 'mention', title: 'Rina Hartono mentioned you in the Q4 roadmap', meta: '14:02 · #design', unread: true },
        { id: 'w2', icon: 'review', title: 'Kevin Tan asked for your review on PR 1841', meta: '13:48 · simpul-web', unread: true },
        { id: 'w3', icon: 'calendar', title: 'Quarterly review moved to Thu 12 Nov, 10:00', meta: '13:15 · Dewi Anggraini', unread: true },
        { id: 'w4', icon: 'check', tone: 'success', title: 'Expense claim of Rp 1.240.000 approved', meta: '11:02 · Finance' },
      ],
    },
  }),
  stack({
    id: 'respond-stack-home',
    size: '1x3',
    domain: 'home',
    surface: 'dark',
    name: 'Home alerts',
    props: {
      title: 'Home',
      items: [
        { id: 'h1', icon: 'door', title: 'Someone at the front gate', meta: '14:06 · camera 1', unread: true },
        { id: 'h2', icon: 'package', title: 'Parcel left at the door', meta: '13:40 · Kurir Kilat', unread: true },
        { id: 'h3', icon: 'smoke', tone: 'warning', title: 'Bedroom smoke detector battery low', meta: '12:15 · replace soon', unread: true },
        { id: 'h4', icon: 'wash', title: 'Washing machine finished', meta: '11:50 · 58 min cycle' },
        { id: 'h5', icon: 'warning', tone: 'warning', title: 'Water tank down to 20%', meta: '09:30 · pump off' },
      ],
    },
  }),
  stack({
    id: 'respond-stack-deploys',
    size: '2x3',
    domain: 'devops',
    name: 'Deploys and alerts',
    props: {
      title: 'Platform',
      items: [
        { id: 'd1', icon: 'failed', tone: 'danger', title: 'Deploy failed: payments-core 4.18.0 in ap-southeast-3', meta: '14:04 · rolled back', unread: true },
        { id: 'd2', icon: 'cert', tone: 'warning', title: 'Certificate for api.simpul.id expires in 9 days', meta: '13:30 · edge-cache', unread: true },
        { id: 'd3', icon: 'review', title: 'Arjun Mehta approved PR 1902', meta: '13:12 · ledger', unread: true },
        { id: 'd4', icon: 'check', tone: 'success', title: 'ledger 2.9.1 is live in all 3 regions', meta: '12:41 · release' },
        { id: 'd5', icon: 'warning', tone: 'warning', title: 'Error budget for auth down to 22%', meta: '11:20 · 30-day window' },
        { id: 'd6', icon: 'mention', title: 'Sofia Marques mentioned you in the partner review', meta: '10:05 · #partners' },
      ],
    },
  }),
  stack({
    id: 'respond-stack-newsroom',
    size: '2x2',
    domain: 'media',
    surface: 'muted',
    name: 'Newsroom desk',
    props: {
      title: 'Desk',
      items: [
        { id: 'n1', icon: 'wire', title: 'Wire: central bank holds its rate at 5.75%', meta: '14:03 · economy', unread: true },
        { id: 'n2', icon: 'calendar', tone: 'warning', title: 'Embargo on the port story lifts at 15:00 WIB', meta: '13:55 · Laras Wulandari', unread: true },
        { id: 'n3', icon: 'failed', tone: 'danger', title: 'Correction requested on the Makassar flood piece', meta: '13:20 · reader desk', unread: true },
        { id: 'n4', icon: 'check', tone: 'success', title: 'Front page sent to print', meta: '12:00 · 48 pages' },
      ],
    },
  }),

  /* Annunciator */
  annunciator({
    id: 'respond-annunciator-substation',
    size: '3x2',
    domain: 'energy',
    surface: 'dark',
    name: 'Substation annunciator',
    props: {
      title: 'GI Cawang · 150 kV',
      cols: 4,
      trip: { id: 'sf6', after: 8 },
      windows: [
        { id: 'bus1', label: 'Bus 1 · low volt', tone: 'danger', state: 'alarm' },
        { id: 'bus2', label: 'Bus 2 · low volt', tone: 'danger' },
        { id: 't1oil', label: 'Trafo 1 · oil temp', state: 'acked' },
        { id: 't2oil', label: 'Trafo 2 · oil temp', state: 'alarm' },
        { id: 't2buch', label: 'Trafo 2 · Buchholz', tone: 'danger' },
        { id: 'cb7', label: 'Breaker 7 · trip', tone: 'danger', state: 'alarm' },
        { id: 'cb8', label: 'Breaker 8 · trip', tone: 'danger' },
        { id: 'dc', label: 'DC supply · fault' },
        { id: 'sf6', label: 'SF6 · low press' },
        { id: 'charger', label: 'Battery · charger' },
        { id: 'scada', label: 'SCADA · link lost' },
        { id: 'fire', label: 'Fire · cable room', tone: 'danger' },
      ],
    },
  }),
  annunciator({
    id: 'respond-annunciator-overhead',
    size: '2x2',
    domain: 'aerospace',
    surface: 'dark',
    name: 'Overhead panel',
    props: {
      title: 'PK-NAE · overhead',
      cols: 3,
      trip: { id: 'pack1', after: 10 },
      windows: [
        { id: 'fuel', label: 'Fuel · low press', state: 'alarm' },
        { id: 'hyd', label: 'Hyd B · low press', state: 'acked' },
        { id: 'bleed', label: 'Eng 2 · bleed' },
        { id: 'apu', label: 'APU · fire', tone: 'danger' },
        { id: 'cabin', label: 'Cabin · altitude', tone: 'danger' },
        { id: 'pack1', label: 'Pack 1 · hot' },
        { id: 'gen2', label: 'Gen 2 · off' },
        { id: 'ice', label: 'Anti-ice · fault' },
        { id: 'door', label: 'Cargo door · fwd', state: 'alarm' },
      ],
    },
  }),
  annunciator({
    id: 'respond-annunciator-engine',
    size: '4x2',
    domain: 'logistics',
    name: 'Engine room alarms',
    props: {
      title: 'KM Samudra Jaya · engine room',
      cols: 6,
      trip: { id: 'steer1', after: 9 },
      windows: [
        { id: 'melo', label: 'Main engine · LO press', tone: 'danger', state: 'alarm' },
        { id: 'mejw', label: 'Main engine · jacket temp' },
        { id: 'meos', label: 'Main engine · overspeed', tone: 'danger' },
        { id: 'gen1', label: 'Gen 1 · trip', tone: 'danger' },
        { id: 'gen2', label: 'Gen 2 · trip', tone: 'danger' },
        { id: 'bilge', label: 'Bilge · high level', state: 'alarm' },
        { id: 'settle', label: 'Fuel · settling tank' },
        { id: 'steer1', label: 'Steering · pump 1' },
        { id: 'steer2', label: 'Steering · pump 2' },
        { id: 'fire', label: 'Fire · engine room', tone: 'danger' },
        { id: 'co2', label: 'CO₂ · release', tone: 'danger' },
        { id: 'boiler', label: 'Boiler · flame fail', state: 'acked' },
      ],
    },
  }),
  annunciator({
    id: 'respond-annunciator-datacentre',
    size: '2x2',
    domain: 'devops',
    name: 'Data hall alarms',
    props: {
      title: 'DC Cikarang · hall 1',
      cols: 3,
      trip: { id: 'aisle7', after: 12 },
      windows: [
        { id: 'crac2', label: 'CRAC 2 · fail', tone: 'danger', state: 'alarm' },
        { id: 'upsa', label: 'UPS A · on battery' },
        { id: 'upsb', label: 'UPS B · on battery' },
        { id: 'pdu', label: 'PDU B3 · overload', state: 'alarm' },
        { id: 'leak', label: 'Leak · row 4', tone: 'danger' },
        { id: 'smoke', label: 'Smoke · hall 1', tone: 'danger' },
        { id: 'door2', label: 'Door 2 · held open', state: 'acked' },
        { id: 'aisle7', label: 'Aisle 7 · hot' },
        { id: 'genset', label: 'Genset · running' },
      ],
    },
  }),

  /* Toast with undo */
  toast({
    id: 'respond-toast-archive',
    size: '1x1',
    domain: 'workspace',
    name: 'Archive with undo',
    props: {
      eyebrow: 'Inbox',
      title: '12 read threads, older than 30 days',
      meta: '12 threads · 4.1 MB',
      action: 'Archive',
      toast: '12 threads archived',
      toastBody: 'They are in Archive if you need them.',
      done: 'Archived',
      icon: 'archive',
    },
  }),
  toast({
    id: 'respond-toast-revoke',
    size: '1x1',
    domain: 'security',
    name: 'Revoke with undo',
    props: {
      eyebrow: 'API key',
      title: 'ci-deploy, unused for 41 days',
      meta: 'Key ···· 7f2a',
      action: 'Revoke',
      tone: 'danger',
      toast: 'Key ci-deploy revoked',
      toastBody: 'Builds that used it fail until they get a new key.',
      done: 'Revoked',
      icon: 'key',
    },
  }),
  toast({
    id: 'respond-toast-stop',
    size: '2x1',
    domain: 'logistics',
    name: 'Remove a stop',
    props: {
      eyebrow: 'Route 7 · Fikri Ramadhan',
      title: 'Stop 7 · Toko Kelontong Bu Ratna',
      meta: 'Closed today · 2.4 km detour',
      action: 'Remove stop',
      toast: 'Stop 7 removed from route 7',
      toastBody: 'The route is 2.4 km shorter. Fikri sees it now.',
      done: 'Removed',
      icon: 'route',
      layout: 'row',
    },
  }),
  toast({
    id: 'respond-toast-take',
    size: '1x1',
    domain: 'audio',
    name: 'Delete a take',
    props: {
      eyebrow: 'Session 3',
      title: 'Take 14 · vocals · 00:42',
      meta: '48 kHz · 24 bit',
      action: 'Delete take',
      tone: 'danger',
      toast: 'Take 14 deleted',
      toastBody: 'Takes 13 and 15 stay in the session.',
      done: 'Deleted',
      icon: 'trash',
    },
  }),
  toast({
    id: 'respond-toast-shipped',
    size: '1x1',
    domain: 'commerce',
    name: 'Mark shipped',
    props: {
      eyebrow: 'Order TK-48213',
      title: '3 items to Surabaya, packed',
      meta: 'Kurir Kilat · regular',
      action: 'Mark shipped',
      toast: 'Order TK-48213 marked shipped',
      toastBody: 'The buyer gets the tracking number now.',
      done: 'Shipped',
      icon: 'shipped',
    },
  }),

  /* Service status */
  status({
    id: 'respond-status-qris',
    size: '4x1',
    domain: 'payments',
    name: 'Payments degraded',
    props: {
      service: 'QRIS acquiring · Bank Lestari Jaya',
      word: 'Degraded',
      tone: 'warning',
      title: 'QR payments confirm in up to 2 minutes instead of seconds',
      since: 'Since 13:42 WIB · updated 4 min ago',
      to: 'finance@kopralabs.id',
    },
  }),
  status({
    id: 'respond-status-krl',
    size: '3x1',
    domain: 'transit',
    surface: 'muted',
    name: 'Line delays',
    props: {
      service: 'Commuter line · Tangerang',
      word: 'Delays',
      tone: 'warning',
      title: 'Trains between Duri and Tangerang run about 15 min late',
      since: 'Since 06:50 WIB · track work at Batu Ceper',
    },
  }),
  status({
    id: 'respond-status-stream',
    size: '2x1',
    domain: 'media',
    name: 'Stream outage',
    props: {
      service: 'Live · Ruang Publik',
      word: 'Partial outage',
      tone: 'danger',
      title: 'Viewers in Sulawesi see buffering on the 720p stream',
      since: 'Since 19:58 WITA · 2,140 viewers',
    },
  }),
  status({
    id: 'respond-status-outage',
    size: '2x2',
    domain: 'energy',
    name: 'Planned outage',
    props: {
      service: 'Denpasar Barat · feeder DPS-07',
      word: 'Planned',
      tone: 'neutral',
      title: 'Power off on Fri 13 Nov, 09:00–13:00 WITA, for feeder work',
      since: 'Notice of 5 Nov · 1,820 homes',
      channels: ['SMS', 'Email'],
      layout: 'panel',
      updates: [
        { time: '5 Nov', text: 'Work on feeder DPS-07 confirmed for Friday morning.' },
        { time: '3 Nov', text: 'Homes on Jl. Gatot Subroto Barat and Jl. Mahendradatta affected.' },
      ],
    },
  }),

  /* Low stock */
  stock({
    id: 'respond-stock-rice',
    size: '2x1',
    domain: 'commerce',
    name: 'Out of stock today',
    props: {
      item: 'Beras Pandan Wangi 5 kg',
      sku: 'SKU 8992-0412',
      left: 6,
      unit: 'bags',
      perDay: 14,
      reorderAt: 20,
      capacity: 80,
      qty: 40,
      step: 10,
      supplier: 'PT Graha Niaga',
      arrives: 'Sat 7 Nov',
      word: 'Out today',
      tone: 'danger',
    },
  }),
  stock({
    id: 'respond-stock-pharmacy',
    size: '2x2',
    domain: 'health',
    name: 'Ward pharmacy low',
    props: {
      item: 'Paracetamol 500 mg tablets',
      sku: 'Ward 3 pharmacy · PCM-500',
      left: 240,
      unit: 'tabs',
      perDay: 110,
      reorderAt: 400,
      capacity: 2000,
      qty: 1000,
      step: 100,
      supplier: 'PT Cahaya Rantai',
      arrives: 'Fri 6 Nov',
      layout: 'panel',
    },
  }),
  stock({
    id: 'respond-stock-silo',
    size: '1x2',
    domain: 'agri',
    surface: 'muted',
    name: 'Feed silo low',
    props: {
      item: 'Silo 3 · layer feed',
      left: 1.2,
      unit: 't',
      perDay: 0.55,
      reorderAt: 2,
      capacity: 8,
      qty: 6,
      supplier: 'Koperasi Tani Sumber Rejeki',
      arrives: 'Sat 7 Nov',
      decimals: 1,
      layout: 'silo',
    },
  }),
  stock({
    id: 'respond-stock-lpg',
    size: '1x1',
    domain: 'home',
    name: 'Last gas cylinder',
    props: {
      item: 'LPG 3 kg',
      left: 1,
      unit: 'cylinder',
      perDay: 0.25,
      reorderAt: 1,
      capacity: 3,
      qty: 2,
      arrives: 'today 17:00',
      word: 'Last',
      layout: 'mini',
    },
  }),

  /* Vital sign alarm */
  vital({
    id: 'respond-vital-spo2',
    size: '2x2',
    domain: 'health',
    surface: 'dark',
    name: 'Desaturation alarm',
    props: {
      bed: 'ICU 2 · Bed 12',
      patient: 'Sari W., 64 · post-op day 1',
      label: 'SpO₂',
      unit: '%',
      value: 86,
      limit: 90,
      below: true,
      word: 'Desaturation',
      wave: 'pleth',
      seed: 'respond-spo2',
      pixel: true,
      extra: [
        { label: 'HR', value: '112', unit: 'bpm' },
        { label: 'RR', value: '26', unit: '/min' },
        { label: 'NIBP', value: '104/62', unit: 'mmHg' },
      ],
    },
  }),
  vital({
    id: 'respond-vital-hr',
    size: '1x2',
    domain: 'health',
    surface: 'dark',
    name: 'Heart rate alarm',
    props: {
      bed: 'ED · bay 4',
      patient: 'Male, 52 · chest pain',
      label: 'HR',
      unit: 'bpm',
      value: 148,
      limit: 130,
      word: 'Tachy',
      wave: 'ecg',
      seed: 'respond-hr',
      layout: 'tall',
    },
  }),
  vital({
    id: 'respond-vital-incubator',
    size: '2x1',
    domain: 'health',
    name: 'Incubator alarm',
    props: {
      bed: 'NICU · incubator 4',
      label: 'Skin temp',
      unit: '°C',
      value: 38.1,
      decimals: 1,
      limit: 37.5,
      word: 'High temp',
      tone: 'warning',
      wave: 'resp',
      seed: 'respond-nicu',
      layout: 'row',
    },
  }),
  vital({
    id: 'respond-vital-bp',
    size: '2x1',
    domain: 'health',
    surface: 'muted',
    name: 'Low pressure alarm',
    props: {
      bed: 'Ward 5 · bed 3',
      label: 'MAP',
      unit: 'mmHg',
      value: 58,
      limit: 65,
      below: true,
      word: 'Low BP',
      wave: 'pleth',
      seed: 'respond-map',
      layout: 'row',
    },
  }),

  /* Hazard reroute */
  reroute({
    id: 'respond-reroute-flood',
    size: '2x2',
    domain: 'transit',
    name: 'Flood detour',
    props: {
      eyebrow: 'Flood watch · Jakarta Selatan',
      word: 'Flooding',
      tone: 'danger',
      title: 'The Jl. Gatot Subroto underpass is under 40 cm of water',
      routes: [
        { id: 'gatsu', name: 'Jl. Gatot Subroto', delta: 'Closed', blocked: true },
        { id: 'casa', name: 'Via Jl. Casablanca', delta: '+6 min' },
        { id: 'tendean', name: 'Via Jl. Kapten Tendean', delta: '+11 min' },
      ],
      after: 'ETA 14:48 WIB.',
    },
  }),
  reroute({
    id: 'respond-reroute-rain',
    size: '2x1',
    domain: 'logistics',
    name: 'Heavy rain on route',
    props: {
      eyebrow: 'Truck L 8812 UA · to Bandung',
      word: 'Heavy rain',
      title: 'Tol Cipularang KM 92 is down to 20 km/h',
      routes: [
        { id: 'toll', name: 'Tol Cipularang', delta: 'Slow', blocked: true },
        { id: 'pwk', name: 'Via Purwakarta', delta: '+24 min' },
      ],
      action: 'Reroute',
      after: 'The driver has the new route.',
      layout: 'row',
    },
  }),
  reroute({
    id: 'respond-reroute-ash',
    size: '2x2',
    domain: 'aerospace',
    surface: 'dark',
    name: 'Ash on the route',
    props: {
      eyebrow: 'Nusa Air 418 · CGK to LBJ',
      word: 'Ash',
      tone: 'danger',
      title: 'Ash from Lewotobi between FL250 and FL350 on the planned route',
      routes: [
        { id: 'w17', name: 'Planned · W17', delta: 'Ash', blocked: true },
        { id: 'w33', name: 'South · W33', delta: '+9 min · +410 kg' },
        { id: 'fl230', name: 'Under it · FL230', delta: '+620 kg fuel' },
      ],
      action: 'Send to crew',
      after: 'New clearance requested.',
    },
  }),
  reroute({
    id: 'respond-reroute-landslide',
    size: '2x1',
    domain: 'civic',
    surface: 'muted',
    name: 'Road closed',
    props: {
      eyebrow: 'Road alert · Bogor',
      word: 'Landslide',
      tone: 'danger',
      title: 'Jalur Puncak closed both ways at KM 87',
      routes: [
        { id: 'puncak', name: 'Jalur Puncak', delta: 'Closed', blocked: true },
        { id: 'jonggol', name: 'Via Jonggol', delta: '+35 min' },
      ],
      action: 'Take detour',
      after: 'Directions updated.',
      layout: 'row',
    },
  }),

  /* SLA countdown */
  sla({
    id: 'respond-sla-ticket',
    size: '2x1',
    domain: 'workspace',
    name: 'First response due',
    props: {
      eyebrow: 'SUP-48213 · PT Sinar Armada',
      title: 'First response due',
      left: 252,
      total: 3600,
      action: 'Take it',
      pixel: true,
    },
  }),
  sla({
    id: 'respond-sla-shipby',
    size: '1x1',
    domain: 'commerce',
    name: 'Ship by',
    props: { eyebrow: '3 orders', title: 'Ship by 16:00', left: 95, total: 7200, action: 'Print labels', layout: 'square' },
  }),
  sla({
    id: 'respond-sla-complaint',
    size: '2x1',
    domain: 'banking',
    name: 'Complaint overdue',
    props: {
      eyebrow: 'CMP-2291 · card dispute',
      title: 'Answer to the customer',
      left: -95,
      total: 432000,
      action: 'Assign to me',
    },
  }),
  sla({
    id: 'respond-sla-triage',
    size: '1x1',
    domain: 'health',
    name: 'Triage clock',
    props: { eyebrow: 'ED · bay 4', title: 'Triage within 10 min', left: 412, total: 600, action: 'Start triage', pixel: true, layout: 'square' },
  }),

  /* Failed, retry */
  retry({
    id: 'respond-retry-autodebit',
    size: '2x1',
    domain: 'payments',
    name: 'Payment failed',
    props: {
      eyebrow: 'Auto-debit · electricity token',
      title: 'Payment failed',
      figure: 'Rp 500.000',
      reason: 'Not enough balance in Arunika Bank ···· 2207.',
      attempts: ['The bank did not answer in 30 s.', 'ok'],
      ok: 'Paid. Token sent by SMS',
    },
  }),
  retry({
    id: 'respond-retry-webhooks',
    size: '2x2',
    domain: 'devops',
    surface: 'dark',
    name: 'Webhooks failing',
    props: {
      eyebrow: 'Webhooks · order.paid',
      title: '42 deliveries failed in 10 min',
      layout: 'panel',
      items: [
        { name: 'sagara-daya.id/hooks', reason: '503 · server busy', retryable: true },
        { name: 'kopralabs.id/api/pay', reason: 'Timed out after 10 s', retryable: true, outcome: '503 again · paused' },
        { name: 'graha-niaga.id/wh', reason: '410 · endpoint removed', retryable: false },
      ],
    },
  }),
  retry({
    id: 'respond-retry-payroll',
    size: '2x2',
    domain: 'banking',
    name: 'Transfers failed',
    props: {
      eyebrow: 'Payroll · October',
      title: '3 of 312 transfers failed',
      layout: 'panel',
      items: [
        { name: 'Nadia Rahman · Bank Pesisir', reason: 'Bank offline for maintenance', retryable: true },
        { name: 'Teuku Rahmat · Kencana Syariah', reason: 'Account closed · ask for a new one', retryable: false },
        { name: 'Marthen Wanggai · Bank Sagara', reason: 'Timed out at the bank', retryable: true },
      ],
    },
  }),
  retry({
    id: 'respond-retry-upload',
    size: '2x1',
    domain: 'media',
    surface: 'muted',
    name: 'Upload stopped',
    props: {
      eyebrow: 'Upload · Ruang Kerja ep. 41',
      title: 'Upload stopped at 62%',
      reason: 'The connection dropped. 1.1 of 1.8 GB is safe.',
      ok: 'Uploaded, ready for review',
      action: 'Resume',
      resumeFrom: 0.62,
    },
  }),
  retry({
    id: 'respond-retry-sync',
    size: '1x1',
    domain: 'agri',
    name: 'Sync failed',
    props: {
      eyebrow: 'Block C',
      title: 'Sync failed',
      reason: '3 soil sensors did not report since 06:00 WIB.',
      ok: 'Synced 3 sensors',
      layout: 'square',
    },
  }),

  /* Backoff timer */
  backoff({
    id: 'respond-backoff-catalogue',
    size: '2x1',
    domain: 'commerce',
    surface: 'dark',
    name: 'Rate limited',
    props: {
      eyebrow: 'Catalogue sync · storefront',
      title: 'Rate limited · 1,204 products waiting',
      wait: 8,
      attempt: 3,
      succeedOn: 5,
      done: 'Synced 1,204 products',
      action: 'Retry now',
    },
  }),
  backoff({
    id: 'respond-backoff-otp',
    size: '1x1',
    domain: 'security',
    name: 'Resend code',
    hint: 'Wait for the clock, then resend; each resend waits longer',
    props: {
      eyebrow: 'Sign-in code',
      title: 'New code by SMS',
      mode: 'cooldown',
      wait: 45,
      uses: 3,
      done: 'Code sent',
      action: 'Resend',
      layout: 'square',
    },
  }),
  backoff({
    id: 'respond-backoff-pin',
    size: '1x1',
    domain: 'banking',
    surface: 'muted',
    name: 'PIN locked',
    hint: 'Wait for the clock, then try again',
    props: {
      eyebrow: 'Arunika mobile',
      title: 'Locked after 3 tries',
      mode: 'cooldown',
      wait: 30,
      once: true,
      done: 'Unlocked',
      action: 'Try again',
      layout: 'square',
    },
  }),
  backoff({
    id: 'respond-backoff-gateway',
    size: '1x1',
    domain: 'energy',
    name: 'Reconnecting',
    props: {
      eyebrow: 'Meter gateway GW-07',
      title: 'Reconnecting',
      wait: 4,
      attempt: 2,
      succeedOn: 4,
      done: 'Online · 214 meters',
      action: 'Retry now',
      pixel: true,
      layout: 'square',
    },
  }),

  /* Battery critical */
  battery({
    id: 'respond-battery-drone',
    size: '1x2',
    domain: 'agri',
    name: 'Drone battery',
    props: {
      eyebrow: 'Drone SD-07',
      level: 9,
      minutes: 4,
      drain: 15,
      detail: 'Over block C, 1.4 km from base',
      action: 'Return to base',
      done: 'Lands in 3 min',
      doneWord: 'Returning',
      undo: 'Resume spraying',
      layout: 'tall',
    },
  }),
  battery({
    id: 'respond-battery-ups',
    size: '2x1',
    domain: 'devops',
    surface: 'dark',
    name: 'UPS on battery',
    props: {
      eyebrow: 'UPS rack B · DC Cikarang',
      level: 23,
      minutes: 6,
      drain: 8,
      detail: 'Mains lost at 14:01 WIB; the genset did not start.',
      action: 'Shut down in order',
      done: '8 hosts shutting down in order',
      doneWord: 'Shutting down',
      undo: 'Cancel',
      layout: 'row',
    },
  }),
  battery({
    id: 'respond-battery-bus',
    size: '1x1',
    domain: 'transit',
    name: 'E-bus battery',
    props: { eyebrow: 'E-bus 7C-12', level: 11, minutes: 18, drain: 20, action: 'Send to depot', done: 'Off to Pulogadung depot', doneWord: 'To depot' },
  }),
  battery({
    id: 'respond-battery-radio',
    size: '1x1',
    domain: 'defense',
    surface: 'dark',
    name: 'Radio battery',
    props: { eyebrow: 'Radio · ELANG 2', level: 7, minutes: 25, drain: 30, action: 'Low power mode', done: 'Low power, about 2 h', doneWord: 'Saving' },
  }),

  /* Deadline soon */
  deadline({
    id: 'respond-deadline-stnk',
    size: '2x1',
    domain: 'civic',
    name: 'Vehicle tax due',
    props: {
      eyebrow: 'Vehicle tax · B 1924 KZT',
      day: 7,
      month: 'Nov',
      days: 2,
      title: 'Annual vehicle tax due Saturday',
      figure: 'Rp 3.412.000',
      detail: 'A 2% fine a month starts after 7 Nov.',
      action: 'Pay now',
      done: 'Paid. The e-receipt is in your email.',
      snooze: 'Remind me Friday',
      snoozed: 'Reminder set for Fri 6 Nov, 09:00 WIB.',
    },
  }),
  deadline({
    id: 'respond-deadline-card',
    size: '1x1',
    domain: 'banking',
    surface: 'brand',
    name: 'Card bill due',
    props: {
      eyebrow: 'Arunika card',
      day: 8,
      month: 'Nov',
      days: 3,
      title: 'Card bill',
      figure: 'Rp 6.240.500',
      action: 'Pay in full',
      done: 'Paid in full.',
      layout: 'square',
    },
  }),
  deadline({
    id: 'respond-deadline-contract',
    size: '1x1',
    domain: 'workspace',
    surface: 'muted',
    name: 'Notice period ends',
    props: {
      eyebrow: 'Office lease',
      day: 7,
      month: 'Nov',
      days: 2,
      title: 'Notice to PT Graha Niaga',
      action: 'Send notice',
      done: 'Notice sent to PT Graha Niaga.',
      layout: 'square',
    },
  }),
  deadline({
    id: 'respond-deadline-medical',
    size: '1x1',
    domain: 'aerospace',
    name: 'Medical expires',
    props: {
      eyebrow: 'Capt. Dimas Pratama',
      day: 7,
      month: 'Nov',
      days: 2,
      title: 'Class 1 medical',
      action: 'Book a check',
      done: 'Booked Fri 6 Nov, 08:00 WIB.',
      layout: 'square',
    },
  }),

  /* Double-booked */
  conflict({
    id: 'respond-conflict-meetings',
    size: '2x2',
    domain: 'workspace',
    props: {
      eyebrow: 'Thu 12 Nov · your calendar',
      options: [
        { id: 'qr', title: 'Quarterly review', who: 'Dewi Anggraini · 6 people', from: 840, to: 900 },
        { id: 'crit', title: 'Design crit', who: 'Rina Hartono · 4 people', from: 870, to: 930 },
      ],
      other: 'The other is declined with a note',
      after: 'declined with a note',
    },
  }),
  conflict({
    id: 'respond-conflict-theatre',
    size: '2x2',
    domain: 'health',
    name: 'Theatre clash',
    props: {
      eyebrow: 'OR 3 · Fri 6 Nov',
      options: [
        { id: 'appx', title: 'Appendectomy', who: 'dr. Yoga P. · 90 min', from: 540, to: 630 },
        { id: 'knee', title: 'Knee arthroscopy', who: 'dr. Grace L. · 2 h', from: 600, to: 720 },
      ],
      other: 'The other moves to OR 5',
      after: 'moved to OR 5',
    },
  }),
  conflict({
    id: 'respond-conflict-dock',
    size: '3x2',
    domain: 'logistics',
    surface: 'muted',
    name: 'Dock door clash',
    props: {
      eyebrow: 'Dock door 4 · Gudang B',
      options: [
        { id: 'in', title: 'B 9012 UXR · inbound', who: 'PT Samudra Kargo · 18 pallets', from: 780, to: 825 },
        { id: 'out', title: 'L 8812 UA · outbound', who: 'PT Nusantara Logistik · 22 pallets', from: 810, to: 855 },
      ],
      other: 'The other goes to door 6, free all afternoon',
      after: 'moved to door 6',
      layout: 'wide',
    },
  }),

  /* Left the fence */
  geofence({
    id: 'respond-geofence-truck',
    size: '2x2',
    domain: 'logistics',
    props: {
      eyebrow: 'Truck B 9012 UXR',
      title: 'Left the Cikarang depot with no trip planned',
      zone: 'Depot',
      distance: 1.2,
      rate: 0.02,
      since: 260,
      speed: '42 km/h',
      primary: 'Call driver',
      who: 'Fikri Ramadhan',
      secondary: 'Mark as planned',
      seed: 'respond-truck',
    },
  }),
  geofence({
    id: 'respond-geofence-cattle',
    size: '2x2',
    domain: 'agri',
    surface: 'muted',
    name: 'Out of the paddock',
    props: {
      eyebrow: 'Collar 0412 · paddock 3',
      title: 'Cow 0412 is outside the paddock fence',
      zone: 'Paddock 3',
      distance: 0.3,
      rate: 0.002,
      since: 900,
      speed: '2 km/h',
      primary: 'Call herder',
      who: 'Ahmad Fauzi',
      secondary: 'Mark as moved',
      seed: 'respond-cattle',
    },
  }),
  geofence({
    id: 'respond-geofence-patrol',
    size: '3x2',
    domain: 'defense',
    surface: 'dark',
    name: 'Left the sector',
    props: {
      eyebrow: 'KAL-07 · patrol boat',
      title: 'Left sector 7 heading south-east with no tasking on file',
      zone: 'Sector 7',
      distance: 2.4,
      rate: 0.01,
      unit: 'NM',
      since: 540,
      speed: '18 kn',
      primary: 'Call on channel 16',
      who: 'KAL-07 bridge',
      secondary: 'Mark as tasked',
      seed: 'respond-patrol',
      layout: 'wide',
    },
  }),

  /* Emergency stop */
  estop({
    id: 'respond-estop-conveyor',
    size: '1x1',
    domain: 'logistics',
    props: { machine: 'Conveyor C3', reading: 1.2, unit: 'm/s' },
  }),
  estop({
    id: 'respond-estop-escalator',
    size: '1x2',
    domain: 'transit',
    name: 'Escalator stop',
    props: { machine: 'Escalator E4 · Sudirman', reading: 0.5, unit: 'm/s', layout: 'tall' },
  }),
  estop({
    id: 'respond-estop-pump',
    size: '2x2',
    domain: 'energy',
    surface: 'dark',
    name: 'Pump station stop',
    props: {
      machine: 'Pump P2 · Muara Karang',
      reading: 1840,
      decimals: 0,
      unit: 'rpm',
      readingLabel: 'Shaft speed',
      checks: ['Guard door closed', 'Suction 1.4 bar', 'Seal water on'],
      layout: 'panel',
    },
  }),
  estop({
    id: 'respond-estop-rig',
    size: '1x1',
    domain: 'audio',
    surface: 'dark',
    name: 'Rig motors stop',
    props: { machine: 'Rig · stage A', reading: 0.3, unit: 'm/s' },
  }),

  /* Automatic in… */
  auto({
    id: 'respond-auto-failover',
    size: '2x1',
    domain: 'devops',
    surface: 'signal',
    name: 'Automatic failover',
    props: {
      eyebrow: 'Failover · ap-southeast-3',
      title: 'Failing over to ap-southeast-1',
      reason: 'Health checks failing in 3 of 3 zones.',
      seconds: 30,
      now: 'Fail over now',
      done: 'ap-southeast-1 is primary',
      stopped: 'ap-southeast-3 stays primary',
      undo: 'Fail back',
    },
  }),
  auto({
    id: 'respond-auto-spillway',
    size: '2x2',
    domain: 'energy',
    name: 'Spillway opening',
    props: {
      eyebrow: 'Jatiluhur dam · gate 2',
      title: 'Spillway gate 2 opens to 40 cm',
      reason: 'The reservoir is over its flood rule. Villages downstream were warned at 13:40 WIB.',
      seconds: 300,
      cancel: 'Hold 30 min',
      now: 'Open now',
      done: 'Gate 2 open at 40 cm',
      stopped: 'Held for 30 min',
      undo: 'Close gate',
      pixel: true,
      layout: 'panel',
      readings: [
        { label: 'Level', value: '107.6', unit: 'm' },
        { label: 'Inflow', value: '1,240', unit: 'm³/s' },
      ],
    },
  }),
  auto({
    id: 'respond-auto-unpaid',
    size: '2x1',
    domain: 'commerce',
    name: 'Order lapses',
    props: {
      eyebrow: 'Order TK-48219 · Rp 1.249.000',
      title: 'Cancels unless the buyer pays',
      reason: 'Stock is held until then.',
      seconds: 599,
      cancel: 'Hold 24 h',
      now: 'Cancel now',
      done: 'Cancelled, stock released',
      stopped: 'Held for 24 h more',
      undo: 'Restore order',
    },
  }),
  auto({
    id: 'respond-auto-doorlock',
    size: '1x1',
    domain: 'home',
    surface: 'muted',
    name: 'Door locks itself',
    props: {
      eyebrow: 'Front door',
      title: 'Locks by itself',
      seconds: 30,
      cancel: 'Keep open',
      now: 'Lock now',
      done: 'Locked',
      stopped: 'Kept open',
      undo: 'Unlock',
      layout: 'square',
    },
  }),

  /* Inline field error */
  field({
    id: 'respond-field-account',
    size: '2x1',
    domain: 'banking',
    name: 'Account number error',
    props: { label: 'Account number at Bank Pesisir', initial: '0721 4408 1', check: 'account' },
  }),
  field({
    id: 'respond-field-plate',
    size: '2x1',
    domain: 'civic',
    surface: 'muted',
    name: 'Plate format error',
    props: { label: 'Plate number', initial: 'B1924KZT', check: 'plate' },
  }),
  field({
    id: 'respond-field-cron',
    size: '2x1',
    domain: 'devops',
    surface: 'dark',
    name: 'Schedule error',
    props: { label: 'Backup schedule (cron)', initial: '0 25 * * *', check: 'cron' },
  }),
  field({
    id: 'respond-field-token',
    size: '2x1',
    domain: 'rapi',
    name: 'Unknown token',
    props: { label: 'Colour token', initial: '--r-brand-glow', check: 'token' },
  }),

  /* Are you safe? */
  safety({
    id: 'respond-safety-quake',
    size: '2x2',
    domain: 'civic',
    name: 'Earthquake check-in',
    props: {
      eyebrow: 'Earthquake · 14:02 WIB',
      word: 'M5.8',
      title: 'Strong shaking in Garut and Bandung. Stay out of damaged buildings.',
      team: 18,
      answered: 9,
      helpText: 'Lina Wijaya, your floor warden, knows. Stay where you are.',
      names: ['Ayu Lestari', 'Rizky Pratama', 'Sari Wulandari', 'Kevin Tan', 'Dewi Anggraini', 'Fajar Nugroho', 'Rina Hartono', 'Andika Saputra', 'Putri Maharani', 'Maya Kartika', 'Arjun Mehta', 'Grace Liu', 'Daniel Okafor', 'Sofia Marques', 'Hendra Wijaya'],
    },
  }),
  safety({
    id: 'respond-safety-gas',
    size: '2x2',
    domain: 'energy',
    surface: 'dark',
    name: 'Muster check',
    props: {
      eyebrow: 'Compressor house B · Cilegon',
      word: 'Gas',
      title: 'H₂S detected. Go to muster point 2, upwind.',
      question: 'Are you at the muster point?',
      safe: 'At muster 2',
      help: 'I can’t get out',
      team: 38,
      answered: 24,
      helpText: 'The rescue team is coming to compressor house B. Stay low.',
      names: ['Teuku Rahmat', 'Yoga Pranata', 'Bima Prasetyo', 'Marthen Wanggai', 'Andi Makkasau', 'Wahyu Setiawan', 'Ahmad Fauzi', 'Hendra Wijaya'],
    },
  }),
  safety({
    id: 'respond-safety-fire',
    size: '2x1',
    domain: 'workspace',
    name: 'Evacuation check',
    props: {
      eyebrow: 'Menara Lentera · floor 12',
      word: 'Evacuate',
      title: 'Fire alarm on floor 12',
      safe: 'I’m out',
      team: 26,
      answered: 14,
      helpText: 'Wardens know where you are.',
      layout: 'row',
    },
  }),

  /* Nothing needs you */
  empty({
    id: 'respond-empty-alerts',
    size: '2x2',
    domain: 'devops',
    surface: 'brand',
    props: {
      title: 'Nothing needs you',
      body: 'No open alerts since 11:20 WIB. Kevin Tan takes over on-call at 19:00.',
      icon: 'check',
      action: 'Hand over early',
      done: 'Handed over to Kevin Tan',
      lines: true,
    },
  }),
  empty({
    id: 'respond-empty-pickups',
    size: '2x2',
    domain: 'logistics',
    name: 'No pickups waiting',
    props: {
      title: 'No pickups waiting',
      body: 'All 48 pickups for today have a driver. The 9 for tomorrow morning do not yet.',
      icon: 'truck',
      action: 'Assign tomorrow’s 9',
      done: '9 pickups to 3 drivers',
    },
  }),
  empty({
    id: 'respond-empty-approvals',
    size: '2x2',
    domain: 'workspace',
    surface: 'muted',
    name: 'No approvals waiting',
    props: {
      title: 'No approvals waiting on you',
      body: 'Two requests you sent are still with Dewi Anggraini, the oldest since Monday.',
      icon: 'inbox',
      action: 'Nudge Dewi',
      done: 'Nudged Dewi Anggraini',
    },
  }),
]

/* ── Rhythm: sizes, surfaces and domains alternate; no pattern sits next to itself ───── */

const order = [
  'alarm-settlement', 'incident-auths', 'caution-grid', 'toast-archive', 'page-nurse', 'threshold-reefer',
  'wasyou-card', 'caution-radar', 'sla-shipby', 'stack-home', 'status-krl', 'field-account',
  'estop-conveyor', 'vital-spo2', 'backoff-otp', 'reroute-flood', 'deadline-medical', 'annunciator-substation',
  'toast-revoke', 'retry-autodebit', 'page-oncall', 'stock-lpg', 'incident-ledger', 'caution-door',
  'threshold-disk', 'safety-quake', 'backoff-pin', 'auto-unpaid', 'estop-escalator', 'empty-alerts',
  'wasyou-payee', 'sla-triage', 'alarm-fire', 'stack-workspace', 'battery-radio', 'threshold-pm25',
  'retry-sync', 'conflict-dock', 'toast-take', 'vital-incubator', 'geofence-truck', 'caution-smoke',
  'field-cron', 'deadline-stnk', 'incident-signal', 'estop-rig', 'stock-silo', 'reroute-ash',
  'battery-bus', 'status-qris', 'retry-webhooks', 'auto-doorlock', 'wasyou-wallet', 'annunciator-overhead',
  'page-dispatch', 'conflict-meetings', 'battery-drone', 'threshold-trafo', 'sla-ticket', 'stack-deploys',
  'caution-hyd', 'field-plate', 'vital-hr', 'empty-pickups', 'backoff-catalogue', 'alarm-bridge',
  'incident-ransom', 'stock-rice', 'estop-pump', 'toast-stop', 'deadline-card', 'page-radio',
  'retry-payroll', 'alarm-pressure', 'auto-failover', 'geofence-cattle', 'sla-complaint', 'deadline-contract',
  'annunciator-datacentre', 'vital-bp', 'safety-gas', 'field-token', 'backoff-gateway', 'stock-pharmacy',
  'battery-ups', 'status-stream', 'conflict-theatre', 'retry-upload', 'toast-shipped', 'annunciator-engine',
  'empty-approvals', 'reroute-rain', 'stack-newsroom', 'auto-spillway', 'safety-fire', 'geofence-patrol',
  'reroute-landslide', 'status-outage', 'threshold-usdidr', 'wasyou-signin',
]

const byId = new Map(all.map((entry) => [entry.id, entry]))

export const entries: MoodEntry[] = order.map((id) => byId.get(`respond-${id}`)).filter((e): e is MoodEntry => !!e)
