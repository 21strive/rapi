import { archetype, walk } from '../../kit'
import type { MoodEntry } from '../../types'
import AgentQuestion from './AgentQuestion.vue'
import ApproveReject from './ApproveReject.vue'
import BatchApprove from './BatchApprove.vue'
import CounterOffer from './CounterOffer.vue'
import CoveredSwitch from './CoveredSwitch.vue'
import EscalateClose from './EscalateClose.vue'
import GoNoGo from './GoNoGo.vue'
import GrantAccess from './GrantAccess.vue'
import HoldConfirm from './HoldConfirm.vue'
import HoldKey from './HoldKey.vue'
import InviteReply from './InviteReply.vue'
import MethodCommit from './MethodCommit.vue'
import OptionCards from './OptionCards.vue'
import PlanPicker from './PlanPicker.vue'
import PromoteRollback from './PromoteRollback.vue'
import RankTop from './RankTop.vue'
import RefundDecision from './RefundDecision.vue'
import ReviewDeck from './ReviewDeck.vue'
import ShiftSwap from './ShiftSwap.vue'
import SlideConfirm from './SlideConfirm.vue'
import SlotPick from './SlotPick.vue'
import Triage from './Triage.vue'
import TypedConfirm from './TypedConfirm.vue'
import VoteTally from './VoteTally.vue'

const hold = archetype(HoldConfirm, {
  name: 'Hold to release',
  hint: 'Press and hold the button, or hold Space; undo for ten seconds after',
  why: 'The model can prepare a payment run; only a person should release it, with one deliberate gesture.',
  tags: ['approve', 'hold', 'confirm', 'commit'],
})

const holds: MoodEntry[] = [
  hold({
    id: 'decide-hold-payroll',
    size: '2x2',
    domain: 'banking',
    props: {
      eyebrow: 'Payroll · October',
      title: 'Release salaries to 312 people',
      figure: 'Rp 4.812.500.000',
      lines: [
        { label: 'From', value: 'Arunika Bank ···· 2207' },
        { label: 'Value date', value: '25 Nov 2026' },
      ],
      prepared: 'Prepared by Simpul from the October roster. Two changes since September.',
      action: 'Hold to release',
      done: 'Released',
    },
  }),
  hold({
    id: 'decide-hold-firmware',
    size: '2x2',
    domain: 'energy',
    name: 'Hold to roll out',
    props: {
      eyebrow: 'Smart meters · Bali',
      title: 'Roll firmware 4.12 out to 1,240 meters',
      lines: [
        { label: 'Wave', value: '1 of 3 · Denpasar' },
        { label: 'Rollback', value: 'Automatic below 98% health' },
        { label: 'Window', value: '01:00–03:00 WITA' },
      ],
      action: 'Hold to roll out',
      done: 'Rolling out',
    },
  }),
  hold({
    id: 'decide-hold-arm',
    size: '2x2',
    domain: 'aerospace',
    surface: 'dark',
    name: 'Hold to arm',
    props: {
      eyebrow: 'Static fire · Stand 2',
      title: 'Arm stage 2 ignition',
      lines: [
        { label: 'Range', value: 'Clear, 4 of 4 stations GO' },
        { label: 'Count', value: 'T−00:04:00 hold', mono: true },
      ],
      action: 'Hold to arm',
      done: 'Armed',
      tone: 'signal',
      holdMs: 2000,
      undoFor: 30,
    },
  }),
  hold({
    id: 'decide-hold-delete',
    size: '2x2',
    domain: 'devops',
    name: 'Hold to delete',
    props: {
      eyebrow: 'Environments',
      title: 'Delete 3 preview environments idle for 30 days',
      lines: [
        { label: 'Saves', value: 'USD 412 a month' },
        { label: 'Includes', value: 'pr-1841, pr-1856, pr-1902', mono: true },
      ],
      action: 'Hold to delete',
      done: 'Deleted',
      tone: 'danger',
    },
  }),
]

/* ── Approve or send back ──────────────────────────────────────────────────────────── */
const approve = archetype(ApproveReject, {
  name: 'Approve or send back',
  hint: 'Approve, or reject and pick a reason; undo for ten seconds after',
  why: 'The model checks a request against the rules; only a person says yes, and a no needs a reason, not an essay.',
  tags: ['approve', 'reject', 'reason', 'request', 'review'],
})

const approves: MoodEntry[] = [
  approve({
    id: 'decide-approve-expense',
    size: '2x2',
    domain: 'workspace',
    props: {
      eyebrow: 'Expense claim · EXP-20418',
      requester: { name: 'Kevin Tan', role: 'Backend engineer' },
      title: 'Client dinner with PT Graha Niaga, Surabaya',
      figure: 'Rp 1.840.000',
      lines: [
        { label: 'Receipt', value: 'Matches the card charge' },
        { label: 'Policy', value: 'Under the Rp 2.000.000 cap' },
      ],
      note: 'Checked by Simpul against the travel policy and the card statement.',
      reasons: ['Duplicate', 'Over policy', 'Missing guests', 'Wrong project'],
    },
  }),
  approve({
    id: 'decide-approve-auth',
    size: '2x2',
    domain: 'health',
    surface: 'dark',
    name: 'Authorise or send back',
    props: {
      eyebrow: 'Prior authorisation · PA-7712',
      requester: { name: 'Arif Santoso', role: 'Orthopaedic surgeon' },
      title: 'MRI of the lumbar spine for patient RM-0048-221',
      lines: [
        { label: 'Indication', value: 'Radicular pain, 8 weeks' },
        { label: 'Guideline', value: 'Meets 3 of 3 criteria' },
        { label: 'Slot', value: 'Mon 9 Nov · 10:30 WIB' },
      ],
      note: 'Prepared by Simpul from the referral letter and the last two visits.',
      reasons: ['Physio first', 'Missing X-ray', 'Not covered'],
      approveLabel: 'Authorise',
      done: 'Authorised',
    },
  }),
  approve({
    id: 'decide-approve-permit',
    size: '3x2',
    domain: 'civic',
    name: 'Approve a permit',
    props: {
      eyebrow: 'Building permit · PBG-3374-0912',
      requester: { name: 'Yohanes Kurniawan', role: 'Applicant' },
      title: 'Three-storey shophouse, Jl. Pemuda 112, Semarang',
      lines: [
        { label: 'Zoning', value: 'K-2 commercial · allowed' },
        { label: 'Floor area', value: '412 m² of 450 m² allowed' },
        { label: 'Setback', value: '4.0 m · the rule is 4.0 m' },
        { label: 'Documents', value: '6 of 6 present' },
      ],
      note: 'Checked by Simpul against the city zoning plan. The setback sits exactly on the limit.',
      reasons: ['Setback', 'Incomplete documents', 'Zoning', 'Site visit first'],
      approveLabel: 'Approve permit',
    },
  }),
  approve({
    id: 'decide-approve-return',
    size: '2x1',
    domain: 'commerce',
    surface: 'muted',
    name: 'Approve a return',
    props: {
      eyebrow: 'Return · RB-20418',
      title: 'Running shoes, size 42',
      figure: 'Rp 689.000',
      reasons: ['Worn', 'Past 30 days', 'No photo'],
      approveLabel: 'Approve return',
      compact: true,
    },
  }),
  approve({
    id: 'decide-approve-firewall',
    size: '2x2',
    domain: 'security',
    name: 'Approve an exception',
    props: {
      eyebrow: 'Firewall exception · FW-219',
      requester: { name: 'Andika Saputra', role: 'Data engineer' },
      title: 'Let 10.20.0.0/16 reach ledger on port 5432 for 7 days',
      lines: [
        { label: 'Ticket', value: 'DATA-1184', mono: true },
        { label: 'Role', value: 'Read-only' },
        { label: 'Expires', value: '12 Nov 2026 · 23:59 WIB' },
      ],
      reasons: ['Too broad', 'Use the bastion', 'No ticket'],
    },
  }),
  approve({
    id: 'decide-approve-waiver',
    size: '2x2',
    domain: 'logistics',
    name: 'Approve a waiver',
    props: {
      eyebrow: 'Detention waiver · DW-0381',
      requester: { name: 'Lina Wijaya', role: 'Operations manager' },
      title: 'Waive 3 days of container detention for PT Samudra Kargo',
      figure: 'USD 1,240',
      impact: { label: 'Q4 waiver budget', spent: 6400, adds: 1240, max: 10000, text: 'USD 7,640 of 10,000' },
      note: 'Port congestion at Tanjung Perak caused the delay; the terminal log is attached.',
      reasons: ['Customer caused it', 'Over budget', 'Ask finance'],
      approveLabel: 'Waive the fee',
      done: 'Waived',
    },
  }),
]

/* ── Slide to confirm ──────────────────────────────────────────────────────────────── */
const slide = archetype(SlideConfirm, {
  name: 'Slide to confirm',
  hint: 'Drag the thumb to the end, or focus it and press End; let go early and it returns',
  why: 'A slide cannot happen by accident, and it is still over in a second.',
  tags: ['slide', 'drag', 'confirm', 'commit'],
})

const slides: MoodEntry[] = [
  slide({
    id: 'decide-slide-transfer',
    size: '2x1',
    domain: 'payments',
    surface: 'brand',
    name: 'Slide to send',
    props: {
      eyebrow: 'Transfer',
      meta: 'BI-FAST',
      title: 'Toko Kelontong Bu Ratna',
      figure: 'Rp 2.450.000',
      sub: 'Bank Pesisir ···· 0912 · fee Rp 2.500',
      action: 'Slide to send',
      done: 'Sent',
      tone: 'neutral',
    },
  }),
  slide({
    id: 'decide-slide-door',
    size: '1x1',
    domain: 'home',
    surface: 'muted',
    name: 'Slide to unlock',
    props: {
      eyebrow: 'Front door',
      title: 'Let the courier in',
      action: 'Unlock',
      done: 'Open',
      tone: 'neutral',
    },
  }),
  slide({
    id: 'decide-slide-dispatch',
    size: '3x1',
    domain: 'transit',
    surface: 'dark',
    name: 'Slide to dispatch',
    props: {
      eyebrow: 'Manggarai · Platform 6',
      meta: 'KRL 1742',
      title: 'Dispatch to Bogor',
      readouts: [
        { label: 'Doors', value: 'Closed' },
        { label: 'Signal', value: 'Green' },
        { label: 'Load', value: '86%' },
      ],
      action: 'Slide to dispatch',
      done: 'Departed',
      layout: 'row',
    },
  }),
  slide({
    id: 'decide-slide-breaker',
    size: '4x1',
    domain: 'energy',
    name: 'Slide to close a breaker',
    props: {
      eyebrow: 'Gardu Induk Kemang · Feeder 7',
      meta: 'CB-7',
      title: 'Close breaker CB-7 and energise the feeder',
      readouts: [
        { label: 'Bus', value: '20.1 kV' },
        { label: 'Load', value: '412 A' },
        { label: 'Earth switch', value: 'Open' },
        { label: 'Permit', value: 'PTW-0912 closed' },
      ],
      action: 'Slide to close',
      done: 'Closed',
      tone: 'neutral',
      layout: 'row',
    },
  }),
  slide({
    id: 'decide-slide-hangar',
    size: '1x1',
    domain: 'aerospace',
    surface: 'muted',
    name: 'Slide to open',
    props: {
      eyebrow: 'Hangar 3',
      title: 'Open the doors for the tow',
      action: 'Open',
      done: 'Opening',
      tone: 'neutral',
    },
  }),
  slide({
    id: 'decide-slide-irrigation',
    size: '2x1',
    domain: 'agri',
    surface: 'muted',
    name: 'Slide to start',
    props: {
      eyebrow: 'Block C · drip line',
      meta: '45 min',
      title: 'Start irrigation',
      figure: '2,700 L',
      sub: 'Soil moisture 18% · rain unlikely before 17:00 WIB',
      action: 'Slide to start',
      done: 'Running',
    },
  }),
]

/* ── Choose one of two ─────────────────────────────────────────────────────────────── */
const options = archetype(OptionCards, {
  name: 'Choose one of two',
  hint: 'Pick a card with a click or the arrow keys, then press the button',
  why: 'Two options with their numbers side by side are judged at a look; a paragraph comparing them is not.',
  tags: ['choose', 'compare', 'option', 'a/b', 'suggested'],
})

const choices: MoodEntry[] = [
  options({
    id: 'decide-options-freight',
    size: '2x2',
    domain: 'logistics',
    props: {
      eyebrow: 'Shipment · JKT → UPG · 1.2 t',
      title: 'How should it travel?',
      options: [
        { id: 'sea', label: 'Sea', figure: '5 days', lines: ['Rp 4.200.000', 'Arrives Tue 10 Nov'], action: 'Book sea freight', done: 'Sea booked', suggested: true },
        { id: 'air', label: 'Air', figure: '1 day', lines: ['Rp 18.900.000', 'Arrives Fri 6 Nov'], action: 'Book air freight', done: 'Air booked' },
      ],
      why: 'Simpul suggests sea: it lands before the 12 Nov deadline for 78% less.',
    },
  }),
  options({
    id: 'decide-options-peak',
    size: '2x2',
    domain: 'energy',
    surface: 'dark',
    name: 'Choose a source',
    props: {
      eyebrow: 'Evening peak · 18:00–22:00 WITA',
      title: 'Cover the 1.4 MW shortfall from',
      options: [
        { id: 'grid', label: 'Grid', figure: 'IDR 9.5 M', lines: ['Rp 1.699 per kWh', 'Nothing burned on site'], action: 'Buy from the grid', done: 'Grid ordered', suggested: true },
        { id: 'genset', label: 'Genset', figure: 'IDR 12.1 M', lines: ['410 L of diesel', '1.1 t of CO₂'], action: 'Start the genset', done: 'Genset at 18:00' },
      ],
      why: 'Simpul suggests the grid: IDR 2.6 M cheaper and no fuel run to the site.',
      zone: 'WITA',
    },
  }),
  options({
    id: 'decide-options-rate',
    size: '4x2',
    domain: 'banking',
    name: 'Choose a rate',
    props: {
      eyebrow: 'Working capital · IDR 12 bn · 36 months',
      title: 'Which rate should the facility carry?',
      options: [
        { id: 'fixed', label: 'Fixed', figure: '6.25%', lines: ['IDR 366 M a month', 'Same for 36 months'], action: 'Take the fixed rate', done: 'Fixed taken', suggested: true },
        { id: 'float', label: 'Floating', figure: '5.40%', lines: ['JIBOR + 1.80%', 'IDR 361 M a month today'], action: 'Take the floating rate', done: 'Floating taken' },
        { id: 'mixed', label: 'Fixed 12 m', figure: '5.75%', lines: ['Then JIBOR + 1.80%', 'IDR 363 M a month today'], action: 'Fix it for 12 months', done: 'Fixed 12 m taken' },
      ],
      why: 'Simpul suggests fixed: the cuts are priced in already, and the budget assumes a flat cost.',
    },
  }),
  options({
    id: 'decide-options-publish',
    size: '2x1',
    domain: 'media',
    surface: 'muted',
    name: 'Publish now or later',
    props: {
      eyebrow: 'Story · Gayo coffee harvest',
      options: [
        { id: 'now', label: 'Now', figure: '14:05', lines: ['Homepage slot 2'], action: 'Publish now', done: 'Published' },
        { id: 'embargo', label: 'Embargo', figure: '06:00', lines: ['With the newsletter'], action: 'Schedule for 06:00 WIB', done: 'Scheduled', suggested: true },
      ],
      compact: true,
    },
  }),
  options({
    id: 'decide-options-trip',
    size: '2x2',
    domain: 'transit',
    name: 'Train or plane',
    props: {
      eyebrow: 'Trip · Jakarta → Surabaya · Mon 9 Nov',
      title: 'Train or plane?',
      options: [
        { id: 'train', label: 'Train', figure: '8 h 20', lines: ['Rp 520.000 · executive', 'Gambir 08:00'], action: 'Book the train', done: 'Train booked', suggested: true },
        { id: 'plane', label: 'Plane', figure: '1 h 30', lines: ['Rp 1.240.000 · Nusa Air', 'CGK 09:15 → SUB 10:45'], action: 'Book the flight', done: 'Flight booked' },
      ],
      why: 'Simpul suggests the train: door to door it is two hours longer, and you can work on board.',
    },
  }),
]

/* ── Type the name ─────────────────────────────────────────────────────────────────── */
const typed = archetype(TypedConfirm, {
  name: 'Type the name to confirm',
  hint: 'Type the exact name to unlock the button, then press Enter',
  why: 'For what cannot be taken back, typing the name proves a person read which one it is.',
  tags: ['destructive', 'delete', 'type', 'confirm'],
})

const typeds: MoodEntry[] = [
  typed({
    id: 'decide-typed-database',
    size: '2x2',
    domain: 'devops',
    props: {
      eyebrow: 'Databases · ap-southeast-3',
      title: 'Delete ledger-staging and its backups',
      name: 'ledger-staging',
      lines: [
        { label: 'Tables', value: '48' },
        { label: 'Size', value: '12.4 GB' },
        { label: 'Read by', value: '3 services' },
        { label: 'Last write', value: '31 Oct 2026' },
      ],
      action: 'Delete database',
      done: 'Deleted',
    },
  }),
  typed({
    id: 'decide-typed-keys',
    size: '2x1',
    domain: 'security',
    name: 'Type to revoke',
    props: {
      eyebrow: 'API keys · Kopra Labs',
      title: 'Revoke all 14 keys now',
      name: 'kopra-labs',
      action: 'Revoke',
      done: 'Revoked',
      compact: true,
    },
  }),
  typed({
    id: 'decide-typed-merchant',
    size: '2x1',
    domain: 'payments',
    name: 'Type to stop payouts',
    props: {
      eyebrow: 'Merchant payouts',
      title: 'Stop every payout to TOKO-88213',
      name: 'TOKO-88213',
      action: 'Stop',
      done: 'Stopped',
      compact: true,
    },
  }),
  typed({
    id: 'decide-typed-workspace',
    size: '2x2',
    domain: 'workspace',
    surface: 'muted',
    props: {
      eyebrow: 'Workspace · Sesi',
      title: 'Delete the Sesi Ops workspace for everyone',
      name: 'sesi-ops',
      lines: [
        { label: 'Members', value: '23' },
        { label: 'Documents', value: '1,284' },
        { label: 'Export', value: 'Ready, 2.1 GB' },
      ],
      action: 'Delete workspace',
      done: 'Deleted',
    },
  }),
]

/* ── Answer the agent ──────────────────────────────────────────────────────────────── */
const question = archetype(AgentQuestion, {
  name: 'Answer the agent',
  hint: 'Answer with a key; change the answer for ten seconds after',
  why: 'The model did the work and needs one word; a key answers faster than a reply.',
  tags: ['agent', 'question', 'yes', 'no', 'reply', 'conversation'],
})

const questions: MoodEntry[] = [
  question({
    id: 'decide-ask-restock',
    size: '1x1',
    domain: 'commerce',
    props: {
      asked: '14:02 WIB',
      question: 'Kopi Lereng 250 g runs out Sunday. Order 40 more?',
      yes: 'Order',
      no: 'Skip',
      afterYes: 'Ordered 40 for Rp 2.360.000.',
      afterNo: 'Skipped. I will ask again Friday.',
      layout: 'small',
    },
  }),
  question({
    id: 'decide-ask-skylight',
    size: '1x1',
    domain: 'home',
    surface: 'dark',
    props: {
      from: 'Rumah',
      asked: '15:31 WIB',
      question: 'Rain from 16:00. Close the skylight?',
      yes: 'Close',
      no: 'Leave',
      afterYes: 'Closing. Shut in 40 s.',
      afterNo: 'Left open until you say.',
      layout: 'small',
    },
  }),
  question({
    id: 'decide-ask-late',
    size: '2x1',
    domain: 'logistics',
    props: {
      asked: '14:02 WIB',
      question: 'Truck B 9124 UXT is 40 min late for PT Graha Niaga. Send them the new ETA, 15:40 WIB?',
      yes: 'Send',
      no: 'Not now',
      afterYes: 'Sent to the receiving dock at Cikarang. They confirmed bay 4.',
      afterNo: 'Not sent. I will tell you if it slips further.',
      layout: 'wide',
    },
  }),
  question({
    id: 'decide-ask-drip',
    size: '2x1',
    domain: 'agri',
    surface: 'muted',
    props: {
      asked: '09:12 WIB',
      question: 'Soil moisture in Block B is down to 18%. Start the drip for 30 minutes?',
      yes: 'Start',
      no: 'Wait',
      afterYes: 'Drip on in Block B until 09:43 WIB.',
      afterNo: 'Waiting. Rain is 40% likely at 16:00.',
      layout: 'wide',
    },
  }),
  question({
    id: 'decide-ask-discount',
    size: '2x2',
    domain: 'payments',
    props: {
      asked: '14:02 WIB',
      question: 'PT Tirta Baja gives 2% off if paid by Friday. Pay Rp 15.680.000 today instead of Rp 16.000.000 on 30 Nov?',
      facts: [
        { label: 'Saves', value: 'Rp 320.000' },
        { label: 'Cash after', value: 'Rp 412.600.000' },
        { label: 'Buffer of Rp 250.000.000', value: 'Kept' },
      ],
      yes: 'Pay today',
      no: 'Pay on 30 Nov',
      afterYes: 'Paid at 14:03 WIB. Reference TRX-2611-0412.',
      afterNo: 'Scheduled for 30 Nov, without the discount.',
    },
  }),
  question({
    id: 'decide-ask-loudness',
    size: '1x1',
    domain: 'audio',
    surface: 'muted',
    props: {
      from: 'Racik',
      asked: '22:40 WIB',
      question: 'The master is −9 LUFS. Normalise to −14 for streaming?',
      yes: 'Normalise',
      no: 'Keep',
      afterYes: 'Rendered at −14.0 LUFS, peak −1.0 dBTP.',
      afterNo: 'Kept at −9 LUFS.',
      layout: 'small',
    },
  }),
]

/* ── Approve a batch ───────────────────────────────────────────────────────────────── */
const batch = archetype(BatchApprove, {
  name: 'Approve a batch',
  hint: 'Untick what should wait, then approve the rest in one press',
  why: 'Ten approvals become one: the model ticks what passed its checks, and a person signs the total.',
  tags: ['batch', 'approve', 'checklist', 'bulk'],
})

const batches: MoodEntry[] = [
  batch({
    id: 'decide-batch-payouts',
    size: '2x2',
    domain: 'payments',
    props: {
      eyebrow: 'Vendor payouts · Fri 6 Nov',
      items: [
        { id: 'tb', label: 'PT Tirta Baja', amount: 16000000 },
        { id: 'kk', label: 'PT Kurir Kilat', amount: 4320000 },
        { id: 'gn', label: 'PT Graha Niaga', amount: 21700000, flag: 'Bank account changed on 4 Nov' },
        { id: 'rc', label: 'CV Rotan Cirebon', amount: 2150000 },
        { id: 'kl', label: 'PT Kopi Lereng', amount: 1950000 },
      ],
    },
  }),
  batch({
    id: 'decide-batch-deps',
    size: '3x2',
    domain: 'devops',
    surface: 'dark',
    name: 'Merge a batch',
    props: {
      eyebrow: 'Dependency updates · web-checkout',
      verb: 'Merge',
      done: 'merged',
      format: 'none',
      items: [
        { id: 'ui', label: '@kopra/ui', sub: '4.2.0 → 4.2.1', status: { tone: 'success', label: 'Checks pass' } },
        { id: 'date', label: 'date-kit', sub: '2.8.3 → 2.8.5', status: { tone: 'success', label: 'Checks pass' } },
        { id: 'schema', label: 'schema-guard', sub: '3.4.0 → 4.0.0', status: { tone: 'warning', label: 'Major' }, flag: 'Major version: three breaking changes in the notes' },
        { id: 'retry', label: 'http-retry', sub: '1.12.0 → 1.13.1', status: { tone: 'success', label: 'Checks pass' } },
        { id: 'img', label: 'img-resize', sub: '0.34.1 → 0.34.4', status: { tone: 'danger', label: 'Checks fail' }, disabled: true },
      ],
      note: 'Prepared by Simpul. The failing one waits for a fix upstream.',
    },
  }),
  batch({
    id: 'decide-batch-timesheets',
    size: '2x2',
    domain: 'workspace',
    surface: 'muted',
    name: 'Approve timesheets',
    props: {
      eyebrow: 'Timesheets · week 45',
      format: 'hours',
      items: [
        { id: 'rina', label: 'Rina Hartono', amount: 40 },
        { id: 'kevin', label: 'Kevin Tan', amount: 42.5 },
        { id: 'andika', label: 'Andika Saputra', amount: 51, flag: 'Over 48 h with no overtime request' },
        { id: 'putri', label: 'Putri Maharani', amount: 38 },
      ],
    },
  }),
  batch({
    id: 'decide-batch-refunds',
    size: '2x3',
    domain: 'commerce',
    name: 'Approve refunds',
    props: {
      eyebrow: 'Refunds under Rp 500.000 · today',
      items: [
        { id: '18', label: 'Rice cooker 1.8 L', sub: 'RB-20418', amount: 349000 },
        { id: '22', label: 'Batik shirt, M', sub: 'RB-20422', amount: 285000 },
        { id: '31', label: 'Phone case', sub: 'RB-20431', amount: 89000 },
        { id: '33', label: 'Kopi Lereng 1 kg', sub: 'RB-20433', amount: 210000, flag: 'Third refund this month for this buyer' },
        { id: '40', label: 'Rattan basket', sub: 'RB-20440', amount: 175000 },
        { id: '47', label: 'LED desk lamp', sub: 'RB-20447', amount: 329000 },
        { id: '51', label: 'Sambal, set of 3', sub: 'RB-20451', amount: 96000 },
      ],
      note: 'Prepared by Simpul: all seven have photos and a courier return scan.',
    },
  }),
  batch({
    id: 'decide-batch-labs',
    size: '2x2',
    domain: 'health',
    surface: 'muted',
    name: 'Sign off results',
    props: {
      eyebrow: 'Lab results · Ward 3 · 07:00 round',
      verb: 'Sign off',
      done: 'signed off',
      format: 'none',
      items: [
        { id: 'b4', label: 'Bed 4 · Full blood count', status: { tone: 'success', label: 'Normal' } },
        { id: 'b7', label: 'Bed 7 · Electrolytes', status: { tone: 'success', label: 'Normal' } },
        { id: 'b9', label: 'Bed 9 · Potassium', sub: '6.1 mmol/L', status: { tone: 'danger', label: 'High' }, flag: 'Held for the doctor on call' },
        { id: 'b12', label: 'Bed 12 · Glucose', status: { tone: 'success', label: 'Normal' } },
        { id: 'b15', label: 'Bed 15 · CRP', sub: '11 mg/L', status: { tone: 'warning', label: 'Borderline' } },
      ],
    },
  }),
]

/* ── Grant access for a while ──────────────────────────────────────────────────────── */
const grant = archetype(GrantAccess, {
  name: 'Grant access for a while',
  hint: 'Pick how long, then grant or deny; a grant can be revoked while it runs',
  why: 'Access is a yes with an end time; the person sets both in one press and the model keeps the audit trail.',
  tags: ['access', 'grant', 'deny', 'permission', 'expiry'],
})

const grants: MoodEntry[] = [
  grant({
    id: 'decide-grant-ledger',
    size: '2x2',
    domain: 'security',
    props: {
      eyebrow: 'Access request · prod-ledger',
      who: { name: 'Rizky Pratama', role: 'Site reliability engineer' },
      what: 'Write access to prod-ledger',
      reason: 'INC-2291: the 14:00 settlement batch is stuck and needs a manual retry.',
      spans: [
        { label: '30 min', minutes: 30 },
        { label: '1 h', minutes: 60 },
        { label: '4 h', minutes: 240 },
      ],
      suggested: 1,
    },
  }),
  grant({
    id: 'decide-grant-record',
    size: '2x2',
    domain: 'health',
    surface: 'dark',
    name: 'Break-glass access',
    props: {
      eyebrow: 'Break-glass · patient record',
      who: { name: 'Nadia Rahman', role: 'Clinical nurse, Ward 3' },
      what: 'Full record of RM-0048-221',
      reason: 'Arrived unconscious at the emergency room, bed 2. Allergies unknown.',
      spans: [
        { label: '1 h', minutes: 60 },
        { label: 'Shift, 8 h', minutes: 480 },
      ],
      grantLabel: 'Open for',
    },
  }),
  grant({
    id: 'decide-grant-bastion',
    size: '2x1',
    domain: 'devops',
    props: {
      eyebrow: 'SSH · bastion-jkt-02',
      who: { name: 'Kevin Tan', role: 'Backend engineer' },
      what: 'Shell on bastion-jkt-02',
      spans: [
        { label: '1 h', minutes: 60 },
        { label: '4 h', minutes: 240 },
      ],
      compact: true,
    },
  }),
  grant({
    id: 'decide-grant-cleaner',
    size: '2x1',
    domain: 'home',
    surface: 'muted',
    name: 'Let someone in',
    props: {
      eyebrow: 'Front door · smart lock',
      who: { name: 'Sri Wahyuni', role: 'Cleaner' },
      what: 'A door code for today',
      spans: [
        { label: 'Once', minutes: 0 },
        { label: '3 h', minutes: 180 },
      ],
      suggested: 1,
      grantLabel: 'Allow',
      compact: true,
    },
  }),
]

/* ── Go/no-go poll ─────────────────────────────────────────────────────────────────── */
const poll = archetype(GoNoGo, {
  name: 'Go/no-go poll',
  hint: 'Start the poll, let the stations report, then make your call',
  why: 'Every station and the verdict read in one look; the person makes the one call that is theirs.',
  tags: ['poll', 'go', 'no-go', 'stations', 'launch', 'lamp'],
})

const polls: MoodEntry[] = [
  poll({
    id: 'decide-poll-launch',
    size: '1x3',
    domain: 'aerospace',
    surface: 'dark',
    name: 'Launch poll',
    props: {
      eyebrow: 'Launch poll',
      title: 'Nusa-2 from Pad B at T−15:00',
      stations: [
        { label: 'Range', answer: 'go' },
        { label: 'Weather', answer: 'go' },
        { label: 'Propulsion', answer: 'go' },
        { label: 'Avionics', answer: 'go' },
        { label: 'Telemetry', answer: 'go' },
        { label: 'Recovery', answer: 'go' },
      ],
      mine: 'Flight',
      go: 'Go for launch',
      zone: 'WIT',
    },
  }),
  poll({
    id: 'decide-poll-range',
    size: '2x2',
    domain: 'defense',
    surface: 'dark',
    name: 'Range clearance poll',
    props: {
      eyebrow: 'Range clearance · Range 3, Situbondo',
      title: 'Firing window 10:00–11:30 WIB',
      stations: [
        { label: 'Airspace', answer: 'go' },
        { label: 'Sea surface', answer: 'nogo', note: 'fishing boat in sector 4' },
        { label: 'Observers', answer: 'go' },
        { label: 'Target crew', answer: 'go' },
      ],
      mine: 'Range safety',
      go: 'Clear to fire',
    },
  }),
  poll({
    id: 'decide-poll-broadcast',
    size: '4x1',
    domain: 'media',
    name: 'Go-live poll',
    props: {
      eyebrow: 'Go live · Evening news 19:00 WIB',
      stations: [
        { label: 'Cam 1', answer: 'go' },
        { label: 'Cam 2', answer: 'go' },
        { label: 'Cam 3', answer: 'go' },
        { label: 'Audio', answer: 'go' },
        { label: 'Graphics', answer: 'go' },
        { label: 'Stream', answer: 'go' },
      ],
      mine: 'Director',
      go: 'On air at 19:00',
      layout: 'row',
    },
  }),
  poll({
    id: 'decide-poll-switching',
    size: '1x2',
    domain: 'energy',
    name: 'Switching poll',
    props: {
      eyebrow: 'Order SO-14/7',
      title: 'Gardu Induk Cawang',
      stations: [
        { label: 'Isolated', answer: 'go' },
        { label: 'Earthed', answer: 'go' },
        { label: 'Permit', answer: 'go' },
        { label: 'Crew clear', answer: 'go' },
      ],
      mine: 'Control',
      go: 'Proceed',
    },
  }),
  poll({
    id: 'decide-poll-release',
    size: '1x1',
    domain: 'devops',
    surface: 'muted',
    name: 'Release call',
    props: {
      eyebrow: 'Release 2026.11',
      stations: [
        { label: 'Backend', answer: 'go' },
        { label: 'Web', answer: 'go' },
        { label: 'Mobile', answer: 'go' },
        { label: 'Data', answer: 'go' },
        { label: 'Support', answer: 'go' },
      ],
      mine: 'Release lead',
      go: 'Release',
      layout: 'mine',
    },
  }),
]

/* ── Triage in one press ───────────────────────────────────────────────────────────── */
const triage = archetype(Triage, {
  name: 'Triage in one press',
  hint: 'Press a level, or its number key while the keys have focus; undo for ten seconds',
  why: 'The model reads the report and suggests a level; the person who owns the queue sets it with one press.',
  tags: ['triage', 'priority', 'p1', 'severity', 'route'],
})

const triages: MoodEntry[] = [
  triage({
    id: 'decide-triage-incident',
    size: '1x1',
    domain: 'devops',
    name: 'Set a priority',
    props: {
      eyebrow: 'INC-4471',
      title: 'payments-core 5xx at 2.1% for 6 min',
      levels: [
        { id: 'p1', label: 'P1', sub: '15 min', then: 'paged the Platform on-call' },
        { id: 'p2', label: 'P2', sub: '4 h', then: 'queued for Platform today' },
        { id: 'p3', label: 'P3', sub: 'sprint', then: 'added to the backlog' },
      ],
      suggested: 'p1',
      compact: true,
    },
  }),
  triage({
    id: 'decide-triage-pothole',
    size: '2x1',
    domain: 'civic',
    props: {
      eyebrow: 'Report LP-20931 · reported 3 times',
      title: 'Pothole on Jl. Ahmad Yani km 7, Pontianak',
      detail: '40 cm across, left lane, by the market entrance',
      levels: [
        { id: 'p1', label: 'P1', sub: '48 h', then: 'Crew 4 sent, fixed by Sat 7 Nov' },
        { id: 'p2', label: 'P2', sub: '7 days', then: 'Scheduled for Thu 12 Nov' },
        { id: 'p3', label: 'P3', sub: '30 days', then: 'Added to the December patching round' },
      ],
      suggested: 'p2',
    },
  }),
  triage({
    id: 'decide-triage-er',
    size: '2x1',
    domain: 'health',
    surface: 'dark',
    name: 'Triage a patient',
    props: {
      eyebrow: 'Emergency · walk-in 14:02 WIB',
      title: 'Male, 54, chest pain for 30 minutes',
      detail: 'BP 150/95 · HR 104 · SpO₂ 96%',
      levels: [
        { id: 'red', label: 'Immediate', tone: 'danger', then: 'To resus bay 1, ECG now' },
        { id: 'yellow', label: 'Urgent', tone: 'warning', then: 'Seen within 30 minutes' },
        { id: 'green', label: 'Minor', tone: 'success', then: 'Waiting area, about 2 h' },
      ],
      suggested: 'red',
    },
  }),
  triage({
    id: 'decide-triage-vessel',
    size: '1x1',
    domain: 'defense',
    surface: 'dark',
    name: 'Triage a contact',
    props: {
      eyebrow: 'Track T-0412 · 12 NM',
      title: 'Vessel with its beacon off, north of Natuna',
      levels: [
        { id: 'p1', label: 'P1', then: 'patrol boat KRI-2 sent' },
        { id: 'p2', label: 'P2', then: 'shadowed on radar' },
        { id: 'p3', label: 'P3', then: 'logged for the morning' },
      ],
      suggested: 'p2',
      compact: true,
    },
  }),
  triage({
    id: 'decide-triage-ticket',
    size: '1x1',
    domain: 'commerce',
    surface: 'muted',
    name: 'Triage a ticket',
    props: {
      eyebrow: 'Ticket #88213',
      title: 'Charged twice for one order',
      levels: [
        { id: 'p1', label: 'P1', then: 'refund team paged' },
        { id: 'p2', label: 'P2', then: 'answer within 4 h' },
        { id: 'p3', label: 'P3', then: 'answer within 2 days' },
      ],
      suggested: 'p2',
      compact: true,
    },
  }),
]

/* ── Pick a time ───────────────────────────────────────────────────────────────────── */
const slots = archetype(SlotPick, {
  name: 'Pick a time',
  hint: 'Pick a slot with a click or the arrow keys, then book it',
  why: 'The model searched the calendars; choosing one of three times is a look, not a thread of messages.',
  tags: ['schedule', 'time', 'slot', 'calendar', 'book'],
})

const times: MoodEntry[] = [
  slots({
    id: 'decide-slots-meeting',
    size: '2x1',
    domain: 'workspace',
    props: {
      eyebrow: 'Meet Rina Hartono · 45 min',
      found: '4 calendars',
      slots: [
        { id: 'a', day: 'Thu 12 Nov', time: '14:00', note: 'All four free', suggested: true },
        { id: 'b', day: 'Fri 13 Nov', time: '09:30', note: 'Moves one call' },
        { id: 'c', day: 'Mon 16 Nov', time: '11:00', note: 'All four free' },
      ],
    },
  }),
  slots({
    id: 'decide-slots-doctor',
    size: '1x2',
    domain: 'health',
    name: 'Book a check-up',
    props: {
      eyebrow: 'Klinik Kemang',
      title: 'Skin check-up with dr. Maya Gunawan',
      found: 'Found by Simpul',
      layout: 'column',
      slots: [
        { id: 'a', day: 'Sat 7 Nov', time: '09:00', note: 'Near home' },
        { id: 'b', day: 'Tue 10 Nov', time: '16:30', note: 'After work', suggested: true },
        { id: 'c', day: 'Thu 12 Nov', time: '08:00', note: 'First of the day' },
      ],
    },
  }),
  slots({
    id: 'decide-slots-delivery',
    size: '4x1',
    domain: 'logistics',
    surface: 'dark',
    name: 'Pick a drop window',
    props: {
      eyebrow: 'Delivery · 12 t of cement',
      title: 'Drop window at Cileungsi',
      action: 'Confirm',
      done: 'Confirmed',
      slots: [
        { id: 'a', day: 'Mon 9 Nov', time: '06:00', note: 'Truck 82% full', suggested: true },
        { id: 'b', day: 'Mon 9 Nov', time: '13:00', note: 'Toll traffic' },
        { id: 'c', day: 'Tue 10 Nov', time: '06:00', note: 'Shares a truck' },
      ],
    },
  }),
  slots({
    id: 'decide-slots-service',
    size: '2x1',
    domain: 'home',
    surface: 'muted',
    name: 'Pick a visit',
    props: {
      eyebrow: 'AC service · 2 units',
      found: 'From the installer',
      slots: [
        { id: 'a', day: 'Sat 7 Nov', time: '09:00', note: 'Two hours' },
        { id: 'b', day: 'Sat 7 Nov', time: '13:00', note: 'Two hours', suggested: true },
        { id: 'c', day: 'Sun 8 Nov', time: '10:00', note: 'Rp 50.000 extra' },
      ],
    },
  }),
]

/* ── Refund, part or deny ──────────────────────────────────────────────────────────── */
const refund = archetype(RefundDecision, {
  name: 'Refund, part or deny',
  hint: 'Choose full, partial or deny, step the amount, then press the button',
  why: 'A refund is a judgement with a number; the model proposes both and the person settles them in one place.',
  tags: ['refund', 'partial', 'deny', 'amount', 'support'],
})

const refunds: MoodEntry[] = [
  refund({
    id: 'decide-refund-cooker',
    size: '2x2',
    domain: 'commerce',
    props: {
      eyebrow: 'Refund · order RB-20418',
      title: 'Rice cooker 1.8 L arrived dented',
      paid: 649000,
      via: 'Bank Pesisir card ···· 4471',
      suggested: { mode: 'partial', amount: 195000, why: 'Simpul suggests 30%: the dent is cosmetic and the cooker works, which the policy covers with a partial refund.' },
      reasons: ['Damaged by buyer', 'Past 30 days', 'No photos'],
    },
  }),
  refund({
    id: 'decide-refund-train',
    size: '2x2',
    domain: 'transit',
    props: {
      eyebrow: 'Refund · ticket KA-77120',
      title: 'Train 112 to Malang arrived 95 min late',
      paid: 410000,
      via: 'Virtual account',
      step: 10000,
      suggested: { mode: 'full', why: 'Simpul suggests full: delays over 60 minutes are refunded in full under the passenger policy.' },
      reasons: ['Travelled anyway', 'Claimed too late', 'Not the passenger'],
    },
  }),
  refund({
    id: 'decide-refund-plan',
    size: '2x2',
    domain: 'media',
    surface: 'muted',
    props: {
      eyebrow: 'Refund · subscription S-40412',
      title: 'Annual plan cancelled after two months',
      paid: 599000,
      via: 'Card ···· 0381',
      step: 1000,
      suggested: { mode: 'partial', amount: 499000, why: 'Simpul suggests prorating: ten of twelve months are unused.' },
      reasons: ['Inside the terms', 'Promo price', 'Chargeback open'],
    },
  }),
]

/* ── Counter-offer ─────────────────────────────────────────────────────────────────── */
const counter = archetype(CounterOffer, {
  name: 'Counter-offer',
  hint: 'Step your counter with the keys or arrows, then send it or accept the ask',
  why: 'A counter is a number and a yes; a stepper and a worked-out total replace a negotiation by email.',
  tags: ['offer', 'counter', 'price', 'negotiate', 'stepper'],
})

const counters: MoodEntry[] = [
  counter({
    id: 'decide-counter-coffee',
    size: '2x2',
    domain: 'agri',
    props: {
      eyebrow: 'Offer · Arabica Gayo, grade 1',
      from: 'Koperasi Tani Sumber Rejeki',
      asks: 118000,
      unit: '/kg',
      qty: 2000,
      qtyUnit: 'kg',
      context: 'Last season Rp 104.000, market today Rp 112.500. Simpul starts you at Rp 113.000.',
      start: 113000,
      step: 500,
      min: 100000,
    },
  }),
  counter({
    id: 'decide-counter-freight',
    size: '2x1',
    domain: 'logistics',
    props: {
      eyebrow: 'Freight · SUB → UPG · 20 ft',
      from: 'PT Samudra Kargo',
      asks: 7800000,
      start: 7400000,
      step: 50000,
      min: 6500000,
      compact: true,
    },
  }),
  counter({
    id: 'decide-counter-rattan',
    size: '2x1',
    domain: 'commerce',
    surface: 'muted',
    props: {
      eyebrow: 'Wholesale · 500 baskets',
      from: 'CV Rotan Cirebon',
      asks: 142000,
      unit: '/unit',
      start: 131000,
      step: 1000,
      min: 110000,
      compact: true,
    },
  }),
  counter({
    id: 'decide-counter-solar',
    size: '2x2',
    domain: 'energy',
    surface: 'muted',
    props: {
      eyebrow: 'Rooftop solar lease · 25 years',
      from: 'PT Sagara Daya',
      asks: 0.074,
      unit: '/kWh',
      context: 'Grid tariff today USD 0.083. Three similar leases signed at USD 0.066–0.072.',
      start: 0.069,
      step: 0.001,
      min: 0.06,
      currency: 'usd',
      decimals: 3,
    },
  }),
]

/* ── Choose how, then commit ───────────────────────────────────────────────────────── */
const method = archetype(MethodCommit, {
  name: 'Choose how, then commit',
  hint: 'Pick the method, then press the button that names it',
  why: 'How it happens is part of the decision; the model picks the usual way and the button says exactly what will run.',
  tags: ['method', 'merge', 'transfer', 'deploy', 'release'],
})

const methods: MoodEntry[] = [
  method({
    id: 'decide-method-merge',
    size: '2x2',
    domain: 'devops',
    name: 'Merge method',
    props: {
      eyebrow: 'Pull request #1841 · payments-core',
      title: 'Retry settlement on a gateway timeout',
      facts: [{ text: '14/14 checks', tone: 'success' }, { text: '2 approvals', tone: 'success' }, { text: '6 commits' }],
      methods: [
        { id: 'merge', label: 'Merge commit', description: 'Keeps all 6 commits and a merge commit', action: 'Merge pull request', done: 'Merged' },
        { id: 'squash', label: 'Squash', description: 'One commit on main', action: 'Squash and merge', done: 'Squashed', suggested: true },
        { id: 'rebase', label: 'Rebase', description: 'Six commits, linear history', action: 'Rebase and merge', done: 'Rebased' },
      ],
    },
  }),
  method({
    id: 'decide-method-rail',
    size: '2x2',
    domain: 'payments',
    surface: 'dark',
    name: 'Choose the rail',
    props: {
      eyebrow: 'Transfer · PT Merapi Semen',
      title: 'Rp 480.000.000 for invoice INV-2611-118',
      facts: [{ text: 'Bank Lestari Jaya ···· 7781' }, { text: 'Due today' }],
      methods: [
        { id: 'bifast', label: 'BI-FAST', description: 'Over the Rp 250.000.000 limit', disabled: true, action: 'Send by BI-FAST', done: 'Sent' },
        { id: 'rtgs', label: 'RTGS', description: 'Rp 25.000 · lands within the hour', action: 'Send by RTGS', done: 'Sent by RTGS', suggested: true },
        { id: 'skn', label: 'SKN', description: 'Rp 2.900 · next clearing at 15:30', action: 'Queue for SKN', done: 'Queued' },
      ],
    },
  }),
  method({
    id: 'decide-method-deploy',
    size: '3x1',
    domain: 'devops',
    surface: 'dark',
    name: 'Deploy strategy',
    props: {
      eyebrow: 'Deploy · api-gateway',
      title: 'v4.12.0 to ap-southeast-3',
      facts: [{ text: 'Soaked 24 h in staging', tone: 'success' }],
      picker: 'segmented',
      layout: 'row',
      methods: [
        { id: 'canary', label: 'Canary 5%', action: 'Start the canary', done: 'Canary at 5%', suggested: true },
        { id: 'bluegreen', label: 'Blue-green', action: 'Deploy blue-green', done: 'Green is live' },
        { id: 'all', label: 'All at once', action: 'Deploy to all', done: 'Deployed' },
      ],
    },
  }),
  method({
    id: 'decide-method-release',
    size: '2x2',
    domain: 'rapi',
    surface: 'brand',
    name: 'Release the language',
    props: {
      eyebrow: 'Rapi · release',
      title: 'Publish Rapi 0.2.1 to the registry',
      facts: [{ text: '3 token fixes' }, { text: '0 prop changes' }, { text: 'Visual diff 0 px' }],
      notes: ['--r-signal-text is darker on dark panels', 'RStatus stops blinking for reduced motion', 'RKbd glyphs sit on the baseline'],
      picker: 'segmented',
      tone: 'neutral',
      methods: [
        { id: 'patch', label: 'Patch', action: 'Publish 0.2.1', done: '0.2.1 is out', suggested: true },
        { id: 'minor', label: 'Minor', action: 'Publish 0.3.0', done: '0.3.0 is out' },
        { id: 'next', label: 'Next tag', action: 'Publish 0.2.1-next.1', done: 'Tagged next' },
      ],
      why: 'Simpul suggests a patch: no component changed its props.',
    },
  }),
]

/* ── Hold key ──────────────────────────────────────────────────────────────────────── */
const key = archetype(HoldKey, {
  name: 'Hold key',
  hint: 'Press and hold the key, or hold Space; let go early and the LEDs go dark',
  why: 'Holding is deliberate enough for a door, a vault or a microphone, and still takes only a second.',
  tags: ['hold', 'key', 'led', 'commit', 'instrument'],
})

const keys: MoodEntry[] = [
  key({
    id: 'decide-key-garage',
    size: '1x1',
    domain: 'home',
    props: { eyebrow: 'Garage · Bintaro', before: 'Closed', action: 'Hold to open', detail: 'Courier at the gate', done: 'Open', doneTone: 'warning' },
  }),
  key({
    id: 'decide-key-doors',
    size: '1x1',
    domain: 'transit',
    surface: 'dark',
    name: 'Release the doors',
    props: { eyebrow: 'KRL 1742 · car 4', before: 'Locked', action: 'Hold to release doors', detail: 'Platform 6, Manggarai', done: 'Released' },
  }),
  key({
    id: 'decide-key-vault',
    size: '1x1',
    domain: 'banking',
    surface: 'muted',
    name: 'Open the vault',
    props: { eyebrow: 'Vault · KCP Medan', before: 'Time lock', action: 'Hold to open', detail: 'Second key: Butet S.', done: 'Open', doneTone: 'warning', holdMs: 1500, zone: 'WIB' },
  }),
  key({
    id: 'decide-key-onair',
    size: '1x1',
    domain: 'audio',
    name: 'Hold to go on air',
    props: { eyebrow: 'Lentera FM', before: 'Standby', action: 'Hold to go on air', detail: 'Studio 2, mic 1', done: 'On air', tone: 'signal', doneTone: 'signal' },
  }),
  key({
    id: 'decide-key-barrier',
    size: '1x1',
    domain: 'defense',
    name: 'Hold to raise',
    props: { eyebrow: 'North gate 2', before: 'Down', action: 'Hold to raise', detail: 'Convoy of 3, cleared', done: 'Raised', doneTone: 'warning' },
  }),
]

/* ── Covered switch ────────────────────────────────────────────────────────────────── */
const guard = archetype(CoveredSwitch, {
  name: 'Covered switch',
  hint: 'Lift the guard, then flip the switch; closing the guard puts it back to safe',
  why: 'Two separate moves for what must never happen by accident; the guard says so before any text does.',
  tags: ['switch', 'guard', 'arm', 'safety', 'instrument'],
})

const guards: MoodEntry[] = [
  guard({
    id: 'decide-guard-pyro',
    size: '1x2',
    domain: 'aerospace',
    surface: 'dark',
    props: {
      eyebrow: 'Stage separation',
      label: 'Pyro arm',
      readouts: [
        { label: 'Bus A', value: '28.1 V' },
        { label: 'Bus B', value: '28.0 V' },
        { label: 'Continuity', value: '4 of 4' },
      ],
      zone: 'WIT',
    },
  }),
  guard({
    id: 'decide-guard-master',
    size: '1x1',
    domain: 'defense',
    surface: 'dark',
    props: { eyebrow: 'Station 3', label: 'Master arm' },
  }),
  guard({
    id: 'decide-guard-shed',
    size: '1x2',
    domain: 'energy',
    name: 'Covered load shed',
    props: {
      eyebrow: 'Zone B · 1.2 MW',
      label: 'Load shed',
      onWord: 'Shed',
      offWord: 'Normal',
      onState: 'Shedding',
      readouts: [
        { label: 'Frequency', value: '49.71 Hz' },
        { label: 'Reserve', value: '38 MW' },
        { label: 'Feeders', value: '7, 9, 12' },
      ],
    },
  }),
  guard({
    id: 'decide-guard-phantom',
    size: '1x1',
    domain: 'audio',
    surface: 'muted',
    name: 'Phantom power',
    props: { eyebrow: 'Inputs 1–4', label: '+48 V phantom', onWord: 'On', offWord: 'Off', onState: '+48 V' },
  }),
  guard({
    id: 'decide-guard-kill',
    size: '1x1',
    domain: 'commerce',
    name: 'Kill switch',
    props: { eyebrow: 'Promo engine', label: 'Kill switch', onWord: 'Kill', offWord: 'Run', onState: 'Killed' },
  }),
]

/* ── Vote with the tally in view ───────────────────────────────────────────────────── */
const vote = archetype(VoteTally, {
  name: 'Vote with the tally in view',
  hint: 'Press an option to vote, another to move your vote, the same one to take it back',
  why: 'A vote is one press, and the tally beside it shows where things stand before yours is added.',
  tags: ['vote', 'poll', 'tally', 'live'],
})

const votes: MoodEntry[] = [
  vote({
    id: 'decide-vote-drain',
    size: '2x2',
    domain: 'civic',
    props: {
      eyebrow: 'RT 05 · Kelurahan Menteng',
      question: 'Spend Rp 4.500.000 from the kas RT on the Gang Melati drain?',
      options: [
        { id: 'yes', label: 'Yes', votes: 19 },
        { id: 'no', label: 'No', votes: 6 },
        { id: 'abstain', label: 'Abstain', votes: 2 },
      ],
      electorate: 38,
      closes: '20:00 WIB',
      seed: 'decide-vote-drain',
    },
  }),
  vote({
    id: 'decide-vote-offsite',
    size: '2x1',
    domain: 'workspace',
    surface: 'muted',
    props: {
      eyebrow: 'Offsite · Q1 2027',
      question: 'Where do we go?',
      options: [
        { id: 'yk', label: 'Yogyakarta', votes: 14 },
        { id: 'bd', label: 'Bandung', votes: 9 },
        { id: 'bl', label: 'Bali', votes: 11 },
      ],
      electorate: 58,
      closes: 'Fri 17:00',
      layout: 'cells',
      seed: 'decide-vote-offsite',
    },
  }),
  vote({
    id: 'decide-vote-lead',
    size: '1x1',
    domain: 'media',
    surface: 'dark',
    name: 'Pick the lead',
    props: {
      eyebrow: 'Front page · 18:00',
      question: 'Tonight’s lead story',
      options: [
        { id: 'flood', label: 'Floods', votes: 4 },
        { id: 'budget', label: 'Budget', votes: 3 },
      ],
      electorate: 9,
      closes: '17:45',
      layout: 'cells',
      seed: 'decide-vote-lead',
    },
  }),
  vote({
    id: 'decide-vote-urea',
    size: '1x1',
    domain: 'agri',
    surface: 'muted',
    name: 'Co-op vote',
    props: {
      eyebrow: 'Koperasi Tani',
      question: 'Buy 40 t of urea now?',
      options: [
        { id: 'yes', label: 'Yes', votes: 23 },
        { id: 'no', label: 'No', votes: 11 },
      ],
      electorate: 61,
      closes: 'Sat',
      layout: 'cells',
      seed: 'decide-vote-urea',
    },
  }),
]

/* ── Answer an invitation ──────────────────────────────────────────────────────────── */
const invite = archetype(InviteReply, {
  name: 'Answer an invitation',
  hint: 'Press going, maybe or can’t; press another to change the answer',
  why: 'The date, the place and three keys: a reply takes one press, and the host knows straight away.',
  tags: ['invite', 'rsvp', 'calendar', 'reply'],
})

const invites: MoodEntry[] = [
  invite({
    id: 'decide-invite-review',
    size: '2x1',
    domain: 'workspace',
    props: {
      eyebrow: 'Quarterly review',
      title: 'Q4 numbers with the board',
      month: 'Nov',
      day: '12',
      weekday: 'Thu',
      when: '10:00–11:30 WIB',
      where: 'Ruang Rapat 3',
      host: 'Ayu Lestari',
      going: 18,
      invited: 25,
    },
  }),
  invite({
    id: 'decide-invite-cleanup',
    size: '1x1',
    domain: 'civic',
    name: 'Answer the invite',
    props: {
      eyebrow: 'Kerja bakti',
      title: 'Clean the drains',
      month: 'Nov',
      day: '8',
      weekday: 'Sun',
      when: 'Sun 07:00 WIB',
      host: 'Pak RT',
      going: 24,
      invited: 41,
      replies: [
        { id: 'yes', label: 'Join', going: true },
        { id: 'no', label: 'Can’t' },
      ],
      compact: true,
    },
  }),
  invite({
    id: 'decide-invite-frr',
    size: '2x1',
    domain: 'aerospace',
    surface: 'dark',
    props: {
      eyebrow: 'Readiness review',
      title: 'Nusa-2, go or no-go for Pad B',
      month: 'Nov',
      day: '9',
      weekday: 'Mon',
      when: '08:00–10:00 WIT',
      where: 'Biak control, room 2',
      host: 'Bima Prasetyo',
      going: 11,
      invited: 14,
      zone: 'WIT',
    },
  }),
]

/* ── Swap a shift ──────────────────────────────────────────────────────────────────── */
const swap = archetype(ShiftSwap, {
  name: 'Swap a shift',
  hint: 'Accept or decline; undo for ten seconds after',
  why: 'Two shifts side by side, drawn on the clock, compare at a look; the roster changes on one press.',
  tags: ['shift', 'roster', 'swap', 'accept', 'decline'],
})

const swaps: MoodEntry[] = [
  swap({
    id: 'decide-swap-ward',
    size: '2x1',
    domain: 'health',
    props: {
      eyebrow: 'Shift swap · Ward 3',
      who: 'Rahma',
      theirs: { day: 'Sat 14 Nov', from: 22, to: 6, label: 'Night' },
      yours: { day: 'Mon 16 Nov', from: 14, to: 22, label: 'Late' },
    },
  }),
  swap({
    id: 'decide-swap-driver',
    size: '2x1',
    domain: 'transit',
    surface: 'dark',
    props: {
      eyebrow: 'Roster · Depo Bukit Duri',
      who: 'Wahyu',
      theirs: { day: 'Fri 13 Nov', from: 4, to: 12, label: 'Early' },
      yours: { day: 'Sun 15 Nov', from: 12, to: 20, label: 'Day' },
    },
  }),
  swap({
    id: 'decide-swap-soc',
    size: '1x1',
    domain: 'security',
    props: {
      eyebrow: 'SOC · swap',
      who: 'Fajar',
      theirs: { day: 'Sat 14', from: 22, to: 6, label: 'Night' },
      yours: { day: 'Tue 17', from: 14, to: 22, label: 'Late' },
      compact: true,
    },
  }),
]

/* ── Rank by hand ──────────────────────────────────────────────────────────────────── */
const rank = archetype(RankTop, {
  name: 'Rank by hand',
  hint: 'Drag rows across the line, or press Space on a row and move it with the arrow keys',
  why: 'Order is spatial: dragging a row above the line says it faster than a numbered reply.',
  tags: ['rank', 'order', 'drag', 'priority', 'sort'],
})

const ranks: MoodEntry[] = [
  rank({
    id: 'decide-rank-musrenbang',
    size: '1x3',
    domain: 'civic',
    props: {
      eyebrow: 'Musrenbang 2027',
      title: 'Fund the top three',
      items: ['Drainage', 'Street lights', 'Posyandu roof', 'Road repair', 'Reading corner', 'Field fence'],
      cut: 'Funded above the line',
      note: 'Drafted by Simpul from 214 resident votes.',
    },
  }),
  rank({
    id: 'decide-rank-roadmap',
    size: '2x2',
    domain: 'workspace',
    surface: 'muted',
    props: {
      eyebrow: 'Roadmap · Q1 2027',
      title: 'Pick the three bets for Q1',
      items: ['Offline mode for Sesi', 'Bulk invoices in Racik', 'E-invoice export', 'Single sign-on for Simpul', 'Usage-based billing'],
      cut: 'Staffed above the line',
    },
  }),
  rank({
    id: 'decide-rank-frontpage',
    size: '1x2',
    domain: 'media',
    props: {
      eyebrow: 'Front page · 06:00',
      title: 'Order the top stories',
      items: ['Bekasi floods', 'Rupiah 15,740', 'Gayo harvest', 'MRT phase 3'],
      cut: 'Above the fold',
      action: 'Send to layout',
      done: 'Sent',
    },
  }),
]

/* ── Pick a plan ───────────────────────────────────────────────────────────────────── */
const plan = archetype(PlanPicker, {
  name: 'Pick a plan',
  hint: 'Pick a card with a click or the arrow keys, then press the button',
  why: 'Plans differ by a price and a line; ruled cards side by side beat a comparison in prose.',
  tags: ['plan', 'tier', 'radio', 'cards', 'subscription'],
})

const plans: MoodEntry[] = [
  plan({
    id: 'decide-plan-power',
    size: '2x2',
    domain: 'home',
    props: {
      eyebrow: 'Power connection · Rumah Bintaro',
      plans: [
        { id: '2200', label: '2,200 VA', price: 'Rp 640.000 a month', detail: 'trips when the heat pump starts', current: true },
        { id: '3500', label: '3,500 VA', price: 'Rp 690.000 a month', detail: 'fits the heat pump', suggested: true, terms: 'From 1 Dec 2026 · one-off fee Rp 1.185.000' },
        { id: '5500', label: '5,500 VA', price: 'Rp 760.000 a month', detail: 'room for an EV charger', terms: 'From 1 Dec 2026 · one-off fee Rp 1.910.000' },
      ],
    },
  }),
  plan({
    id: 'decide-plan-deposit',
    size: '1x3',
    domain: 'banking',
    surface: 'muted',
    name: 'Pick a term',
    props: {
      eyebrow: 'Deposit · IDR 5 bn',
      title: 'Place it for',
      verb: 'Take',
      done: 'Placed',
      priceLine: true,
      plans: [
        { id: '1m', label: '1 month', price: '4.25%', detail: 'IDR 17.7 M interest' },
        { id: '3m', label: '3 months', price: '4.75%', detail: 'IDR 59.4 M interest', suggested: true, terms: 'Matures 5 Feb 2027' },
        { id: '6m', label: '6 months', price: '5.00%', detail: 'IDR 125 M interest' },
        { id: '12m', label: '12 months', price: '5.25%', detail: 'IDR 262.5 M interest' },
      ],
    },
  }),
  plan({
    id: 'decide-plan-library',
    size: '3x2',
    domain: 'audio',
    surface: 'muted',
    props: {
      eyebrow: 'Racik · sample library',
      title: 'Choose a plan for the studio',
      columns: 3,
      priceLine: true,
      plans: [
        { id: 'solo', label: 'Solo', price: 'Rp 89.000 a month', detail: 'One seat\n200 GB of stems\nPersonal licence', current: true },
        { id: 'studio', label: 'Studio', price: 'Rp 249.000 a month', detail: 'Five seats\n2 TB, shared kits\nCommercial licence', suggested: true, terms: 'Starts today · Rp 186.000 for the rest of November' },
        { id: 'label', label: 'Label', price: 'Rp 990.000 a month', detail: '25 seats\n10 TB and stems\nBroadcast licence', terms: 'Starts today · Rp 742.000 for the rest of November' },
      ],
    },
  }),
]

/* ── Close or escalate ─────────────────────────────────────────────────────────────── */
const escalate = archetype(EscalateClose, {
  name: 'Close or escalate',
  hint: 'Close in one press, or escalate and pick to whom; undo for ten seconds',
  why: 'The model did the digging; the person decides where the case goes, with the evidence in one look.',
  tags: ['case', 'escalate', 'close', 'triage', 'findings'],
})

const cases: MoodEntry[] = [
  escalate({
    id: 'decide-case-travel',
    size: '2x2',
    domain: 'security',
    surface: 'dark',
    props: {
      eyebrow: 'Alert SOC-88412',
      title: 'Sari Wulandari signed in from Frankfurt 40 min after Jakarta',
      findings: [
        { text: 'The Frankfurt address is the company VPN exit', tone: 'success' },
        { text: 'MFA passed on her registered phone', tone: 'success' },
        { text: 'Same laptop as this morning', tone: 'success' },
      ],
      verdict: 'Simpul reads it as benign: a VPN exit node.',
      closeLabel: 'Close as benign',
      targets: ['SOC L2', 'Identity team', 'Incident lead'],
    },
  }),
  escalate({
    id: 'decide-case-dispute',
    size: '2x1',
    domain: 'banking',
    props: {
      eyebrow: 'Dispute · card ···· 4471',
      title: 'Rp 1.250.000 in Bangkok, now recognised',
      closeLabel: 'Close it',
      targets: ['Chargebacks', 'Fraud', 'Branch'],
      compact: true,
    },
  }),
  escalate({
    id: 'decide-case-light',
    size: '2x1',
    domain: 'civic',
    surface: 'muted',
    props: {
      eyebrow: 'Complaint · LP-20877',
      title: 'Street light out on Jl. Diponegoro for three weeks',
      closeLabel: 'Close, fixed 4 Nov',
      targets: ['Public works', 'Power utility', 'Lurah'],
      compact: true,
    },
  }),
]

/* ── One card at a time ────────────────────────────────────────────────────────────── */
const deck = archetype(ReviewDeck, {
  name: 'One card at a time',
  hint: 'Keep or skip with the keys or the arrow keys; Backspace takes the last one back',
  why: 'A flagged pile clears fastest one card at a time, with two keys and nothing else on screen.',
  tags: ['review', 'queue', 'keep', 'skip', 'cards'],
})

const decks: MoodEntry[] = [
  deck({
    id: 'decide-deck-rust',
    size: '2x2',
    domain: 'agri',
    surface: 'dark',
    props: {
      eyebrow: 'Drone survey · Kebun Sidikalang',
      keepLabel: 'Visit',
      skipLabel: 'Dismiss',
      kept: 'Visit',
      skipped: 'Dismissed',
      items: [
        {
          id: '14',
          label: 'Plot 14 · 3.2 ha',
          title: 'Leaf rust suspected on 41 trees',
          facts: [
            { label: 'Confidence', value: '0.82' },
            { label: 'Where', value: 'North slope, rows 12–19' },
            { label: 'Flown', value: '07:40 WIB today' },
          ],
        },
        {
          id: '9',
          label: 'Plot 9 · 2.1 ha',
          title: 'Yellowing along the drip line',
          facts: [
            { label: 'Confidence', value: '0.64' },
            { label: 'Likely', value: 'Water stress, not disease' },
            { label: 'Flown', value: '07:52 WIB today' },
          ],
        },
        {
          id: '22',
          label: 'Plot 22 · 4.0 ha',
          title: 'Gap in the canopy, 6 trees down',
          facts: [
            { label: 'Confidence', value: '0.91' },
            { label: 'Cause', value: 'Storm on 2 Nov' },
            { label: 'Flown', value: '08:05 WIB today' },
          ],
        },
        {
          id: '3',
          label: 'Plot 3 · 1.4 ha',
          title: 'Berry borer traps full',
          facts: [
            { label: 'Confidence', value: '0.77' },
            { label: 'Traps', value: '9 of 12 over the line' },
            { label: 'Flown', value: '08:11 WIB today' },
          ],
        },
        {
          id: '17',
          label: 'Plot 17 · 2.8 ha',
          title: 'Weeds above 40 cm',
          facts: [
            { label: 'Confidence', value: '0.70' },
            { label: 'Last cut', value: '12 Oct' },
            { label: 'Flown', value: '08:20 WIB today' },
          ],
        },
      ],
    },
  }),
  deck({
    id: 'decide-deck-spending',
    size: '1x2',
    domain: 'banking',
    name: 'Check categories',
    props: {
      eyebrow: 'Spending · October',
      keepLabel: 'Keep',
      skipLabel: 'Change',
      kept: 'Kept',
      skipped: 'Change',
      items: [
        { id: '1', label: '3 Nov · Rp 48.000', title: 'Taxi to the airport', meta: 'Filed under Travel' },
        { id: '2', label: '3 Nov · Rp 312.000', title: 'Toko Kelontong Bu Ratna', meta: 'Filed under Groceries' },
        { id: '3', label: '2 Nov · Rp 1.150.000', title: 'Klinik Kemang', meta: 'Filed under Health' },
        { id: '4', label: '1 Nov · Rp 89.000', title: 'Racik subscription', meta: 'Filed under Work' },
      ],
    },
  }),
  deck({
    id: 'decide-deck-access',
    size: '4x2',
    domain: 'security',
    name: 'Access review',
    props: {
      eyebrow: 'Access review · Q4 · ledger',
      keepLabel: 'Keep',
      skipLabel: 'Remove',
      kept: 'Kept',
      skipped: 'Removed',
      items: [
        {
          id: 'kt',
          label: 'Kevin Tan · Platform',
          title: 'ledger-admin',
          meta: 'On the on-call rota, so admin is expected.',
          facts: [
            { label: 'Granted', value: '14 Feb 2026 by Rizky Pratama' },
            { label: 'Last used', value: '2 days ago' },
            { label: 'Simpul', value: 'Keep' },
          ],
        },
        {
          id: 'as',
          label: 'Andika Saputra · Data',
          title: 'ledger-read',
          meta: 'Moved to the warehouse project in August.',
          facts: [
            { label: 'Granted', value: '3 Mar 2026 by Dewi Anggraini' },
            { label: 'Last used', value: '94 days ago' },
            { label: 'Simpul', value: 'Remove' },
          ],
        },
        {
          id: 'sw',
          label: 'Sari Wulandari · Finance',
          title: 'ledger-write',
          meta: 'Runs the daily payment batches.',
          facts: [
            { label: 'Granted', value: '9 Jan 2026 by Ayu Lestari' },
            { label: 'Last used', value: 'Today, 09:14 WIB' },
            { label: 'Simpul', value: 'Keep' },
          ],
        },
        {
          id: 'gl',
          label: 'Grace Liu · Markets',
          title: 'ledger-read',
          meta: 'Asked for it once for a quarter-end report.',
          facts: [
            { label: 'Granted', value: '20 May 2026 by Dewi Anggraini' },
            { label: 'Last used', value: 'Never' },
            { label: 'Simpul', value: 'Remove' },
          ],
        },
        {
          id: 'sm',
          label: 'Sofia Marques · Partnerships',
          title: 'ledger-admin',
          meta: 'Left the team on 30 Oct.',
          facts: [
            { label: 'Granted', value: '2 Jun 2025 by Rizky Pratama' },
            { label: 'Last used', value: '41 days ago' },
            { label: 'Simpul', value: 'Remove' },
          ],
        },
        {
          id: 'do',
          label: 'Daniel Okafor · Infrastructure',
          title: 'ledger-read',
          meta: 'Watches replication lag on the ledger hosts.',
          facts: [
            { label: 'Granted', value: '11 Apr 2026 by Kevin Tan' },
            { label: 'Last used', value: '3 hours ago' },
            { label: 'Simpul', value: 'Keep' },
          ],
        },
      ],
    },
  }),
]

/* ── Ship it or take it back ───────────────────────────────────────────────────────── */
const promote = archetype(PromoteRollback, {
  name: 'Ship it or take it back',
  hint: 'Read the table, then roll back or promote; undo for ten seconds',
  why: 'Before and after in a ruled table is the whole argument; the verdict is one of two keys.',
  tags: ['experiment', 'canary', 'a/b', 'promote', 'rollback'],
})

const priceDays = ['23 Oct', '24 Oct', '25 Oct', '26 Oct', '27 Oct', '28 Oct', '29 Oct', '30 Oct', '31 Oct', '1 Nov', '2 Nov', '3 Nov', '4 Nov', '5 Nov']

const promotes: MoodEntry[] = [
  promote({
    id: 'decide-promote-canary',
    size: '2x2',
    domain: 'devops',
    surface: 'dark',
    name: 'Promote a canary',
    props: {
      eyebrow: 'Canary · api-gateway v4.12.0 · 5%',
      aLabel: 'Base',
      bLabel: 'Canary',
      metrics: [
        { label: 'Errors', a: '0.24%', b: '0.21%', delta: '−0.03 pp', verdict: 'better' },
        { label: 'p95', a: '176 ms', b: '182 ms', delta: '+6 ms', verdict: 'within' },
        { label: 'CPU', a: '41%', b: '43%', delta: '+2 pp', verdict: 'within' },
      ],
      note: 'Simpul: inside every guardrail for 45 minutes.',
      back: 'Roll back',
      ship: 'Promote to 100%',
      shipDone: 'Promoted',
    },
  }),
  promote({
    id: 'decide-promote-headline',
    size: '3x2',
    domain: 'media',
    name: 'Pick the headline',
    props: {
      eyebrow: 'Headline test · Gayo harvest · 48,210 readers',
      title: 'B: Why a kilo of Gayo coffee now costs Rp 118.000',
      aLabel: 'A',
      bLabel: 'B',
      metrics: [
        { label: 'Click-through', a: '3.1%', b: '4.5%', delta: '+1.4 pp', verdict: 'better' },
        { label: 'Read time', a: '2:41', b: '2:12', delta: '−0:29', verdict: 'worse' },
        { label: 'Shares', a: '212', b: '340', delta: '+60%', verdict: 'better' },
        { label: 'Unsubscribes', a: '14', b: '15', delta: '+1', verdict: 'within' },
      ],
      note: 'B wins the click and loses half a minute of reading. Simpul leans B.',
      back: 'Keep A',
      ship: 'Ship B',
      backDone: 'Kept A',
      shipDone: 'B is live',
    },
  }),
  promote({
    id: 'decide-promote-price',
    size: '4x2',
    domain: 'commerce',
    surface: 'muted',
    name: 'Settle a price test',
    props: {
      eyebrow: 'Price test · Kopi Lereng 250 g · 14 days',
      aLabel: 'Rp 89.000',
      bLabel: 'Rp 99.000',
      metrics: [
        { label: 'Conversion', a: '4.2%', b: '3.9%', delta: '−0.3 pp', verdict: 'worse' },
        { label: 'Revenue a visit', a: 'Rp 3.740', b: 'Rp 3.860', delta: '+3.2%', verdict: 'better' },
        { label: 'Orders', a: '1,284', b: '1,191', delta: '−7.2%', verdict: 'worse' },
        { label: 'Gross margin', a: 'IDR 41.2 M', b: 'IDR 49.6 M', delta: '+20.4%', verdict: 'better' },
      ],
      trend: {
        label: 'Daily conversion at each price, in percent',
        labels: priceDays,
        a: walk('decide-price-a', 14, 4.2, 0.05, { decimals: 2 }),
        b: walk('decide-price-b', 14, 3.9, 0.05, { decimals: 2 }),
        unit: '%',
      },
      note: 'Fewer orders, more margin. Simpul suggests shipping Rp 99.000.',
      back: 'Keep Rp 89.000',
      ship: 'Ship Rp 99.000',
      backDone: 'Kept Rp 89.000',
      shipDone: 'Rp 99.000 live',
    },
  }),
]

const all: MoodEntry[] = [
  ...holds,
  ...approves,
  ...slides,
  ...choices,
  ...typeds,
  ...questions,
  ...batches,
  ...grants,
  ...polls,
  ...triages,
  ...times,
  ...refunds,
  ...counters,
  ...methods,
  ...keys,
  ...guards,
  ...votes,
  ...invites,
  ...swaps,
  ...ranks,
  ...plans,
  ...cases,
  ...decks,
  ...promotes,
]

/**
 * Board order. Worked out so that neighbours on the grid differ in size, panel, pattern and
 * domain, dark islands never touch, and the 296 cells close flush at eight columns.
 */
const order = [
  'decide-hold-payroll',
  'decide-approve-waiver',
  'decide-triage-vessel',
  'decide-plan-library',
  'decide-method-release',
  'decide-poll-switching',
  'decide-slots-meeting',
  'decide-options-trip',
  'decide-typed-database',
  'decide-approve-return',
  'decide-invite-review',
  'decide-deck-rust',
  'decide-batch-labs',
  'decide-counter-freight',
  'decide-promote-headline',
  'decide-approve-permit',
  'decide-case-travel',
  'decide-vote-lead',
  'decide-grant-cleaner',
  'decide-counter-rattan',
  'decide-ask-loudness',
  'decide-poll-launch',
  'decide-options-publish',
  'decide-key-vault',
  'decide-swap-ward',
  'decide-refund-train',
  'decide-batch-refunds',
  'decide-rank-roadmap',
  'decide-counter-coffee',
  'decide-promote-canary',
  'decide-slide-dispatch',
  'decide-deck-access',
  'decide-ask-skylight',
  'decide-counter-solar',
  'decide-triage-incident',
  'decide-vote-offsite',
  'decide-plan-power',
  'decide-guard-master',
  'decide-slide-breaker',
  'decide-approve-auth',
  'decide-typed-keys',
  'decide-refund-plan',
  'decide-vote-drain',
  'decide-batch-payouts',
  'decide-swap-soc',
  'decide-slide-door',
  'decide-method-deploy',
  'decide-key-barrier',
  'decide-rank-musrenbang',
  'decide-guard-pyro',
  'decide-promote-price',
  'decide-typed-merchant',
  'decide-triage-er',
  'decide-hold-delete',
  'decide-vote-urea',
  'decide-guard-phantom',
  'decide-method-rail',
  'decide-rank-frontpage',
  'decide-case-dispute',
  'decide-batch-timesheets',
  'decide-slide-transfer',
  'decide-options-rate',
  'decide-hold-firmware',
  'decide-grant-record',
  'decide-slots-service',
  'decide-ask-restock',
  'decide-deck-spending',
  'decide-invite-cleanup',
  'decide-batch-deps',
  'decide-guard-shed',
  'decide-poll-broadcast',
  'decide-slots-delivery',
  'decide-typed-workspace',
  'decide-key-onair',
  'decide-ask-drip',
  'decide-method-merge',
  'decide-slide-hangar',
  'decide-approve-firewall',
  'decide-poll-range',
  'decide-guard-kill',
  'decide-slide-irrigation',
  'decide-refund-cooker',
  'decide-plan-deposit',
  'decide-options-freight',
  'decide-triage-pothole',
  'decide-key-doors',
  'decide-slots-doctor',
  'decide-swap-driver',
  'decide-ask-late',
  'decide-hold-arm',
  'decide-approve-expense',
  'decide-grant-bastion',
  'decide-options-peak',
  'decide-poll-release',
  'decide-triage-ticket',
  'decide-ask-discount',
  'decide-grant-ledger',
  'decide-case-light',
  'decide-invite-frr',
  'decide-key-garage',
]

const byId = new Map(all.map((entry) => [entry.id, entry]))
export const entries: MoodEntry[] = order.flatMap((id) => byId.get(id) ?? [])
