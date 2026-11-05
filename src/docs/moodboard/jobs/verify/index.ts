/**
 * Chapter 07 · Verify — proof a person can check. Receipts, audit lines, versions, checks, seals
 * and undo: records a person can read, compare and reverse once a model has done the work.
 * Variants are declared per pattern below; `order` at the end sets the rhythm of the chapter.
 */
import { archetype } from '../../kit'
import type { MoodEntry } from '../../types'
import AgentLedger from './AgentLedger.vue'
import AuditEntry from './AuditEntry.vue'
import BuildAttest from './BuildAttest.vue'
import CertDays from './CertDays.vue'
import CheckGrid from './CheckGrid.vue'
import Checklist from './Checklist.vue'
import Consent from './Consent.vue'
import Custody from './Custody.vue'
import DeliveryProof from './DeliveryProof.vue'
import HashMatch from './HashMatch.vue'
import KycCheck from './KycCheck.vue'
import PaymentTrail from './PaymentTrail.vue'
import PolicyChecks from './PolicyChecks.vue'
import Provenance from './Provenance.vue'
import QuoteLock from './QuoteLock.vue'
import ReadReceipts from './ReadReceipts.vue'
import Receipt from './Receipt.vue'
import Reconcile from './Reconcile.vue'
import RestoreTest from './RestoreTest.vue'
import SessionList from './SessionList.vue'
import SignatureSeal from './SignatureSeal.vue'
import TextDiff from './TextDiff.vue'
import TwoKey from './TwoKey.vue'
import UndoWindow from './UndoWindow.vue'
import VersionHistory from './VersionHistory.vue'

/* ── Patterns ──────────────────────────────────────────────────────────────────────── */

const receipt = archetype(Receipt, {
  name: 'Receipt',
  hint: 'Copy the reference; open the details for the fee lines',
  why: 'A receipt is the record both sides point to; a reference that copies cleanly settles a dispute faster than a chat.',
  tags: ['receipt', 'reference', 'copy', 'payment', 'proof'],
})

const audit = archetype(AuditEntry, {
  name: 'Audit line',
  hint: 'Show the change to read each field before and after',
  why: 'Who changed what, and when, is a fact to read and check, not a question to ask a model.',
  tags: ['audit', 'log', 'diff', 'who', 'history'],
})

const undo = archetype(UndoWindow, {
  name: 'Undo window',
  hint: 'Press Undo before the bar runs out; Redo or Run again to repeat',
  why: 'A change that can be taken back for a few seconds lets people act quickly without a confirm dialog.',
  tags: ['undo', 'reverse', 'countdown', 'window'],
})

const versions = archetype(VersionHistory, {
  name: 'Version history',
  hint: 'Arrow through the versions, restore one, then undo the restore if you like',
  why: 'Restoring the right version needs the list in view; nobody remembers which afternoon the good one was.',
  tags: ['versions', 'history', 'restore', 'undo'],
})

const hash = archetype(HashMatch, {
  name: 'Checksum match',
  hint: 'Compare runs group by group; arrow keys or the pointer read each pair',
  why: 'Long strings are checked by eye in groups; a word for the verdict beats reading sixty-four characters.',
  tags: ['hash', 'checksum', 'integrity', 'compare', 'match'],
})

const seal = archetype(SignatureSeal, {
  name: 'Signature check',
  hint: 'Press the seal to turn it over to the signer, key and time',
  why: 'Whether a file is what its signer signed is a yes or no a person needs before trusting it.',
  tags: ['signature', 'signed', 'seal', 'certificate', 'trust'],
})

const twoKey = archetype(TwoKey, {
  name: 'Two-person rule',
  hint: 'Hold the second slot (or Space) to approve; withdraw while the window is open',
  why: 'Some actions need two people; seeing who signed first, and when, keeps the second check honest.',
  tags: ['approval', 'two-person', 'dual control', 'hold'],
})

const diff = archetype(TextDiff, {
  name: 'Text diff',
  hint: 'Accept or revert each change; Undo puts it back up for review',
  why: 'A change is trusted when the old and new lines sit side by side and each can be kept or put back.',
  tags: ['diff', 'compare', 'accept', 'revert', 'changes'],
})

const trail = archetype(PaymentTrail, {
  name: 'Payment trail',
  hint: 'Arrow or click along the stages to read each record',
  why: 'Where a payment is, and since when, is quicker to see on its path than to ask support.',
  tags: ['payment', 'status', 'stages', 'trail', 'timeline'],
})

const cert = archetype(CertDays, {
  name: 'Days left',
  hint: 'Step through the chain with the keys under the figure',
  why: 'An expiry is a number of days; seeing it count down beats remembering to ask before it lapses.',
  tags: ['certificate', 'expiry', 'licence', 'days', 'renew'],
})

const sessions = archetype(SessionList, {
  name: 'Signed-in devices',
  hint: 'Sign out one device, or all others; undo for a few seconds after',
  why: 'A device you don’t recognise is spotted in a list at a look, and signed out with one press.',
  tags: ['sessions', 'devices', 'sign out', 'revoke', 'security'],
})

const prov = archetype(Provenance, {
  name: 'Where this number comes from',
  hint: 'Open a source to read it; Recompute checks the figure again',
  why: 'A figure is trusted when its sources and their age are one press away, not buried in a data team’s chat.',
  tags: ['provenance', 'lineage', 'sources', 'freshness', 'figure'],
})

const check = archetype(Checklist, {
  name: 'Checklist',
  hint: 'Tick each item with a press or Space; Reset to start again',
  why: 'Ticking each item is the check itself; a summary sentence would skip the step that matters.',
  tags: ['checklist', 'tick', 'verify', 'sign off'],
})

const recon = archetype(Reconcile, {
  name: 'Reconciliation',
  hint: 'Match exact pairs, book a difference or flag a line; undo any of it',
  why: 'Matching two records is side-by-side work; the odd line out is seen faster than it is described.',
  tags: ['reconcile', 'match', 'ledger', 'difference', 'table'],
})

const kyc = archetype(KycCheck, {
  name: 'Identity check',
  hint: 'Show a masked value for five seconds (it is logged); read each verdict',
  why: 'Each verdict sits next to its masked value, so a reviewer checks the exceptions instead of rereading everything.',
  tags: ['kyc', 'identity', 'masked', 'privacy', 'verdict'],
})

const pod = archetype(DeliveryProof, {
  name: 'Proof of delivery',
  hint: 'Switch between signature, photo and location with the keys',
  why: 'A signature, a photo frame and a pin settle “it never arrived” in one look.',
  tags: ['delivery', 'proof', 'signature', 'photo', 'location'],
})

const policy = archetype(PolicyChecks, {
  name: 'Policy checks',
  hint: 'Open a check to read why; the switch hides what passed',
  why: 'Pass and fail in words, failures first, tells a person exactly what to fix.',
  tags: ['policy', 'compliance', 'pass', 'fail', 'rules'],
})

const restore = archetype(RestoreTest, {
  name: 'Restore test',
  hint: 'Run a restore drill and watch each step pass',
  why: 'A backup only counts once a restore has been proven; the date of the last good test is the fact to check.',
  tags: ['backup', 'restore', 'drill', 'recovery'],
})

const quote = archetype(QuoteLock, {
  name: 'Locked price',
  hint: 'Watch the hold run down; release it, or lock a new price when it lapses',
  why: 'A price held for thirty seconds is a promise with a clock; showing the clock is what makes it fair.',
  tags: ['quote', 'rate', 'lock', 'countdown', 'price'],
})

const custody = archetype(Custody, {
  name: 'Chain of custody',
  hint: 'Open a handoff to read its seal and conditions',
  why: 'Every handoff with a name, a time and the same seal number is what makes the object trustworthy at the end.',
  tags: ['custody', 'handoff', 'seal', 'chain', 'traceability'],
})

const consent = archetype(Consent, {
  name: 'Consent record',
  hint: 'Turn the switch off to revoke; the record keeps both entries',
  why: 'What you agreed to, with whom and until when, is a record to read and revoke, not a policy to recall.',
  tags: ['consent', 'privacy', 'revoke', 'data sharing'],
})

const seen = archetype(ReadReceipts, {
  name: 'Read receipts',
  hint: 'Arrow across the squares to read who saw it and when; remind the rest',
  why: 'Who has seen a notice is a list of names and times; the rest can be nudged without asking around.',
  tags: ['read', 'seen', 'acknowledge', 'remind', 'notice'],
})

const attest = archetype(BuildAttest, {
  name: 'Build provenance',
  hint: 'Arrow through the claims to read the evidence; Verify checks them again',
  why: 'Where a binary came from is a short list of claims a person can check before it ships.',
  tags: ['build', 'attestation', 'signed', 'supply chain', 'sbom'],
})

const agent = archetype(AgentLedger, {
  name: 'Done on your behalf',
  hint: 'Revert any action, or all of them; put a line back',
  why: 'When a model acts for you, the list of what it did, each line reversible, is how you stay in charge.',
  tags: ['agent', 'simpul', 'revert', 'actions', 'record'],
})

const bit = archetype(CheckGrid, {
  name: 'Self-test',
  hint: 'Arrow across the grid to read each cell; Run tests again',
  why: 'A grid of named checks shows the one that failed at a look; the line under it says which, in words.',
  tags: ['self-test', 'bit', 'diagnostics', 'grid', 'instrument'],
})

/* ── Variants ──────────────────────────────────────────────────────────────────────── */

const all: MoodEntry[] = []

/* Receipts */
all.push(
  receipt({
    id: 'verify-receipt-bifast',
    size: '2x2',
    domain: 'payments',
    name: 'Transfer receipt',
    props: {
      eyebrow: 'BI-FAST transfer',
      status: { tone: 'success', label: 'Settled' },
      amount: 'Rp 2.450.000',
      party: 'To Sari Wulandari',
      partySub: 'Bank Sagara ···· 4471',
      reference: '20261112BSGR0219384471',
      when: '12 Nov 2026 · 14:02:11 WIB',
      lines: [
        { label: 'Fee', value: 'Rp 2.500' },
        { label: 'Total debited', value: 'Rp 2.452.500' },
        { label: 'From', value: 'Arunika Bank ···· 2207' },
      ],
      note: 'Credited to the payee at 14:02:20 WIB. Quote the reference if either bank asks.',
    },
  }),
  receipt({
    id: 'verify-receipt-qris',
    size: '1x2',
    domain: 'commerce',
    name: 'QRIS slip',
    props: {
      eyebrow: 'QRIS payment',
      status: { tone: 'success', label: 'Paid' },
      amount: 'Rp 38.000',
      party: 'Kopi Lereng',
      partySub: 'Jl. Braga 21, Bandung',
      referenceLabel: 'RRN',
      reference: '231106441872',
      layout: 'slip',
      lines: [
        { label: 'Terminal', value: 'KL-BDG-02', mono: true },
        { label: 'Acquirer', value: 'Bank Pesisir' },
        { label: 'Time', value: '12 Nov · 08:14 WIB', mono: true },
      ],
    },
  }),
  receipt({
    id: 'verify-receipt-tax',
    size: '2x2',
    domain: 'civic',
    surface: 'muted',
    name: 'Tax receipt',
    props: {
      eyebrow: 'Tax payment · PPh 21',
      status: { tone: 'success', label: 'Validated' },
      amount: 'Rp 18.420.000',
      party: 'Tax period October 2026',
      partySub: 'NPWP 09.•••.•••.•-•••.000',
      referenceLabel: 'NTPN',
      reference: 'A7F29C041BD8E615',
      when: '10 Nov 2026 · 09:41 WIB',
      lines: [
        { label: 'Billing code', value: '1204 2611 0941 207', mono: true },
        { label: 'Paid through', value: 'Arunika Bank' },
        { label: 'Payer', value: 'PT Kopi Lereng' },
      ],
      note: 'The NTPN is the state’s proof of receipt. Quote it on the annual return.',
    },
  }),
  receipt({
    id: 'verify-receipt-swift',
    size: '3x1',
    domain: 'banking',
    surface: 'dark',
    name: 'Wire receipt',
    props: {
      eyebrow: 'Outgoing wire · USD',
      status: { tone: 'success', label: 'Credited' },
      amount: 'USD 48,200.00',
      party: 'To PT Samudra Kargo (SG)',
      partySub: 'Bank Lestari Jaya Singapore ···· 0918',
      referenceLabel: 'UETR',
      reference: '6f1c2a9e-4b7d-4e21-9a3f-2d8e51c07b44',
      when: '11 Nov 2026 · 16:20 SGT',
      layout: 'strip',
    },
  }),
  receipt({
    id: 'verify-receipt-topup',
    size: '1x1',
    domain: 'transit',
    name: 'Top-up receipt',
    props: {
      eyebrow: 'Card top-up',
      status: { tone: 'success', label: 'Done' },
      amount: 'Rp 100.000',
      party: 'Transit card ···· 8812',
      reference: 'TU-8812-0419',
      layout: 'mini',
    },
  }),
)

/* Audit lines */
all.push(
  audit({
    id: 'verify-audit-limit',
    size: '2x1',
    domain: 'banking',
    props: {
      actor: 'Dewi Anggraini',
      role: 'Head of risk',
      action: 'Raised the daily transfer limit for Toko Kelontong Bu Ratna until the end of the month',
      time: '14:02:11 WIB',
      eventId: 'evt_7Q2M9KX4',
      via: 'Console',
      result: { tone: 'success', label: 'Applied' },
      changes: [
        { field: 'Daily limit', before: 'Rp 50.000.000', after: 'Rp 100.000.000' },
        { field: 'Expires', before: 'never', after: '30 Nov 2026' },
      ],
    },
  }),
  audit({
    id: 'verify-audit-role',
    size: '3x1',
    domain: 'security',
    surface: 'dark',
    name: 'Access grant line',
    props: {
      actor: 'Kevin Tan',
      role: 'Backend engineer',
      action: 'Granted prod-admin on ledger to Arjun Mehta for four hours, ticket SEC-4471',
      time: '09:14:52 WIB',
      eventId: 'evt_3LX0P1RZ',
      via: 'CLI',
      result: { tone: 'warning', label: 'Elevated' },
      changes: [
        { field: 'Role', before: 'viewer', after: 'prod-admin' },
        { field: 'Expires', before: 'none', after: '13:15 WIB' },
        { field: 'Ticket', before: 'none', after: 'SEC-4471' },
      ],
    },
  }),
  audit({
    id: 'verify-audit-dose',
    size: '2x1',
    domain: 'health',
    surface: 'muted',
    name: 'Order change line',
    props: {
      actor: 'Nadia Rahman',
      role: 'Clinical nurse',
      action: 'Amended the paracetamol order for bed 12 after the ward round, co-signed by dr. Hana Lubis',
      time: '06:40 WIB',
      eventId: 'MAR-20261112-0412',
      via: 'Ward tablet',
      result: { tone: 'success', label: 'Co-signed' },
      changes: [
        { field: 'Dose', before: '500 mg', after: '1,000 mg' },
        { field: 'Interval', before: 'every 8 h', after: 'every 6 h' },
      ],
    },
  }),
  audit({
    id: 'verify-audit-parcel',
    size: '2x1',
    domain: 'civic',
    name: 'Land record line',
    props: {
      actor: 'Rahmat Hidayat',
      role: 'Land surveyor',
      action: 'Corrected the boundary of parcel 12.04.0812.00417 after the field survey',
      time: '11 Nov · 15:30 WIB',
      eventId: 'LR-2026-0812-417',
      via: 'Survey app',
      result: { tone: 'success', label: 'Recorded' },
      changes: [
        { field: 'Area', before: '412 m²', after: '398 m²' },
        { field: 'Survey', before: 'GU 1187/2009', after: 'GU 2207/2026' },
      ],
    },
  }),
)

/* Undo windows */
all.push(
  undo({
    id: 'verify-undo-archive',
    size: '2x1',
    domain: 'workspace',
    props: {
      eyebrow: 'Mail · inbox',
      did: 'Moved 14 emails from PT Graha Niaga to Archive',
      undone: 'All 14 emails are back in the inbox, unread as before.',
      kept: 'Archived. Find them under Archive · Graha Niaga.',
      seconds: 10,
      at: '14:02 WIB',
    },
  }),
  undo({
    id: 'verify-undo-detour',
    size: '1x1',
    domain: 'transit',
    name: 'Undo detour',
    props: {
      eyebrow: 'Route 6H',
      did: 'Detour set: 4 stops skipped',
      undone: 'Route 6H runs its normal stops.',
      kept: 'Detour live on the signs.',
      seconds: 15,
      compact: true,
    },
  }),
  undo({
    id: 'verify-undo-publish',
    size: '2x1',
    domain: 'media',
    surface: 'dark',
    name: 'Undo publish',
    props: {
      eyebrow: 'Newsroom · web',
      did: 'Published “Banjir rob di Muara Angke mulai surut”',
      undone: 'Back to draft. The page was live for a few seconds and had no readers.',
      kept: 'Live on the site and queued for the morning newsletter.',
      undoLabel: 'Unpublish',
      seconds: 30,
      at: '06:41 WIB',
    },
  }),
  undo({
    id: 'verify-undo-price',
    size: '2x1',
    domain: 'commerce',
    surface: 'muted',
    name: 'Undo repricing',
    props: {
      eyebrow: 'Catalogue · 312 products',
      did: 'Raised prices on 312 products by 5%',
      undone: 'Prices are back to this morning’s list.',
      kept: 'New prices are live in the shop and the marketplace feed.',
      seconds: 30,
      at: '10:15 WIB',
    },
  }),
  undo({
    id: 'verify-undo-away',
    size: '1x1',
    domain: 'home',
    surface: 'muted',
    name: 'Undo away mode',
    props: {
      eyebrow: 'Home · Jl. Kemang',
      did: 'Away mode: lights and AC off',
      undone: 'Everything is as it was.',
      kept: 'Away mode stays on.',
      seconds: 8,
      compact: true,
    },
  }),
)

/* Version histories */
all.push(
  versions({
    id: 'verify-versions-memo',
    size: '2x2',
    domain: 'workspace',
    props: {
      eyebrow: 'Q4 budget memo',
      versions: [
        { id: 'v12', who: 'Ayu Lestari', when: '14:02', note: 'Tightened the travel line', delta: '+4 −9' },
        { id: 'v11', who: 'Simpul, draft', when: '11:30', note: 'Summary from the finance thread', delta: '+38 −0' },
        { id: 'v10', who: 'Rina Hartono', when: 'Yesterday', note: 'Added the hiring plan', delta: '+22 −2' },
        { id: 'v9', who: 'Ayu Lestari', when: '10 Nov', note: 'Numbers from the October close', delta: '+61 −14' },
        { id: 'v8', who: 'Dewi Anggraini', when: '09 Nov', note: 'Risk notes', delta: '+9 −0' },
      ],
    },
  }),
  versions({
    id: 'verify-versions-config',
    size: '3x2',
    domain: 'devops',
    surface: 'dark',
    name: 'Config versions',
    props: {
      eyebrow: 'rate-limits.yaml · api-gateway',
      layout: 'split',
      versions: [
        {
          id: 'v42',
          who: 'Rizky Pratama',
          when: '14:02',
          note: 'Raise checkout burst',
          delta: '2 keys',
          changes: [
            { key: 'checkout.burst', before: '200', after: '400' },
            { key: 'checkout.window', before: '10s', after: '5s' },
          ],
        },
        {
          id: 'v41',
          who: 'Kevin Tan',
          when: '11:20',
          note: 'Lower the search limit per address',
          delta: '1 key',
          changes: [{ key: 'search.per_ip', before: '120/min', after: '60/min' }],
        },
        {
          id: 'v40',
          who: 'release-pipeline',
          when: 'Yesterday',
          note: 'Add the partner tier',
          delta: '3 keys',
          changes: [
            { key: 'tiers.partner', before: 'none', after: 'added' },
            { key: 'tiers.partner.rps', before: 'none', after: '800' },
            { key: 'tiers.partner.burst', before: 'none', after: '1,600' },
          ],
        },
        {
          id: 'v39',
          who: 'Arjun Mehta',
          when: '09 Nov',
          note: 'Exempt health checks',
          delta: '1 key',
          changes: [{ key: 'exempt.paths', before: '/status', after: '/status, /healthz' }],
        },
        {
          id: 'v38',
          who: 'Rizky Pratama',
          when: '06 Nov',
          note: 'Limits for Q4',
          delta: '12 keys',
          changes: [{ key: 'default.rps', before: '300', after: '500' }],
        },
      ],
    },
  }),
  versions({
    id: 'verify-versions-article',
    size: '2x2',
    domain: 'media',
    surface: 'muted',
    name: 'Article versions',
    props: {
      eyebrow: 'Harga cabai naik 40% di Pasar Induk',
      versions: [
        { id: 'v7', who: 'Laras Wulandari', when: '06:12', note: 'Copy edit for the morning push', delta: '−112 words' },
        { id: 'v6', who: 'Simpul, suggested', when: '05:58', note: 'Shorter headline', delta: '1 line' },
        { id: 'v5', who: 'Laras Wulandari', when: '05:40', note: 'Quote from a trader in Kramat Jati', delta: '+64 words' },
        { id: 'v4', who: 'Desk editor', when: '05:21', note: 'Price source checked', delta: '+12 words' },
        { id: 'v3', who: 'Laras Wulandari', when: '04:55', note: 'First filing', delta: '612 words' },
      ],
    },
  }),
  versions({
    id: 'verify-versions-preset',
    size: '1x2',
    domain: 'audio',
    surface: 'dark',
    name: 'Preset versions',
    props: {
      eyebrow: 'Monsun Pad',
      layout: 'narrow',
      versions: [
        { id: 'v6', who: 'You', when: '22:41', note: 'Cutoff 2.4 kHz' },
        { id: 'v5', who: 'You', when: '22:30', note: 'Release 1.8 s' },
        { id: 'v4', who: 'Dimas', when: 'Tue', note: 'Detune +7 cents' },
        { id: 'v3', who: 'Dimas', when: 'Mon', note: 'Chorus off' },
        { id: 'v2', who: 'Factory', when: '01 Nov', note: 'As shipped' },
      ],
    },
  }),
)

/* Checksums */
all.push(
  hash({
    id: 'verify-hash-release',
    size: '3x1',
    domain: 'devops',
    name: 'Package checksum',
    props: {
      eyebrow: 'rapi-0.2.4.tgz',
      algo: 'SHA-256',
      expected: 'e3b9c4a17f2d8e05b6a1c93f4d72e8106bd59a2c7f31e4b8a9d06c5f2e17b84a',
      actual: 'e3b9c4a17f2d8e05b6a1c93f4d72e8106bd59a2c7f31e4b8a9d06c5f2e17b84a',
      expectedLabel: 'Published',
      actualLabel: 'Downloaded',
      checkedAt: '14:02:11 WIB',
      layout: 'line',
    },
  }),
  hash({
    id: 'verify-hash-firmware',
    size: '2x2',
    domain: 'security',
    surface: 'dark',
    name: 'Firmware checksum',
    props: {
      eyebrow: 'gw-edge-3.8.1.bin',
      algo: 'SHA-256',
      expected: '7c41e09b3fa2d6c85e17b04a9d3c2f68e1b5a7d09c4f2e83b6a1d5c79e04f2b1',
      actual: '7c41e09b3fa2d6c85e17b04a9d3c2f68e1b5a3d09c4f7e83b6a1d5c79e04f2b1',
      expectedLabel: 'Vendor manifest',
      actualLabel: 'On the device',
      consequence: { match: 'Safe to flash.', mismatch: 'Do not flash. The image is quarantined.' },
      checkedAt: '14:02 WIB',
      layout: 'block',
    },
  }),
  hash({
    id: 'verify-hash-obc',
    size: '2x1',
    domain: 'aerospace',
    surface: 'dark',
    name: 'Upload readback',
    props: {
      eyebrow: 'OBC load 7 · flight software',
      algo: 'CRC-32',
      expected: '9F3A61C2',
      actual: '9F3A61C2',
      group: 4,
      expectedLabel: 'Uplinked',
      actualLabel: 'Readback',
      checkedAt: '03:14:09 UTC',
      layout: 'line',
      pixel: true,
    },
  }),
  hash({
    id: 'verify-hash-seal',
    size: '1x1',
    domain: 'logistics',
    name: 'Seal number check',
    props: {
      eyebrow: 'Door seal',
      algo: 'Seal no.',
      expected: '4417209318',
      actual: '4417209318',
      group: 4,
      expectedLabel: 'Manifest',
      actualLabel: 'On the door',
      layout: 'seal',
    },
  }),
)

/* Signature checks */
all.push(
  seal({
    id: 'verify-seal-permit',
    size: '1x1',
    domain: 'civic',
    name: 'Permit signature',
    props: {
      doc: 'PBG 3273-2026-0412',
      verdict: 'valid',
      signer: 'Bandung permits office',
      signedAt: '11 Nov · 09:14 WIB',
      details: [
        { label: 'Signed by', value: 'Ir. Wening Pratiwi' },
        { label: 'Key', value: '7F:2A:91:C4 … 0B', mono: true },
        { label: 'Issuer', value: 'Nusantara Sign CA' },
      ],
    },
  }),
  seal({
    id: 'verify-seal-commit',
    size: '1x1',
    domain: 'devops',
    surface: 'dark',
    name: 'Signed commit',
    props: {
      doc: 'commit a3f9c2e',
      verdict: 'valid',
      word: 'Signed',
      signer: 'Kevin Tan',
      signedAt: '12 Nov · 13:58 WIB',
      details: [
        { label: 'Key', value: 'SHA256:q8VfT2…3kE', mono: true },
        { label: 'Repository', value: 'payments-core' },
        { label: 'Matches', value: 'Team keyring, key 2' },
      ],
    },
  }),
  seal({
    id: 'verify-seal-rx',
    size: '1x1',
    domain: 'health',
    surface: 'muted',
    name: 'Prescription signature',
    props: {
      doc: 'Rx R/0412',
      verdict: 'expired',
      word: 'Cert expired',
      signer: 'dr. Hana Lubis, Sp.PD',
      signedAt: '12 Nov · 08:20 WIB',
      details: [
        { label: 'At signing', value: 'Valid, timestamped' },
        { label: 'Cert expired', value: '12 Nov 2026 · 12:00 WIB' },
        { label: 'Licence', value: 'SIP 446/2207', mono: true },
      ],
    },
  }),
  seal({
    id: 'verify-seal-contract',
    size: '1x1',
    domain: 'workspace',
    name: 'Contract signature',
    props: {
      doc: 'Lease_Cikarang.pdf',
      verdict: 'invalid',
      word: 'Altered',
      signer: 'Lina Wijaya',
      signedAt: '03 Nov · 16:40 WIB',
      details: [
        { label: 'Changed', value: 'Page 4, after signing' },
        { label: 'Hash at signing', value: 'a91f…07c2', mono: true },
        { label: 'Hash now', value: 'a91f…5e18', mono: true },
      ],
    },
  }),
  seal({
    id: 'verify-seal-photo',
    size: '1x1',
    domain: 'media',
    surface: 'brand',
    name: 'Content credentials',
    props: {
      doc: 'IMG_2207.jpg',
      verdict: 'valid',
      word: 'Original',
      signer: 'Laras Wulandari',
      signedAt: '12 Nov · 07:12 WIB',
      details: [
        { label: 'Captured on', value: 'Field camera 2' },
        { label: 'Edits', value: 'Crop only' },
        { label: 'Manifest', value: '3 assertions, signed', mono: true },
      ],
    },
  }),
)

/* Two-person rule */
all.push(
  twoKey({
    id: 'verify-twokey-wire',
    size: '2x2',
    domain: 'banking',
    name: 'Second approval',
    props: {
      eyebrow: 'Treasury · outgoing wire',
      title: 'Wire to PT Samudra Kargo, Singapore',
      figure: 'USD 1,200,000.00',
      first: { name: 'Ayu Lestari', role: 'Treasury lead', at: '14:01:48 WIB', method: 'Security key' },
      you: 'Grace Liu',
      done: 'Released',
      note: 'Releases on the second approval.',
    },
  }),
  twoKey({
    id: 'verify-twokey-migrate',
    size: '2x1',
    domain: 'devops',
    name: 'Second approval',
    props: {
      eyebrow: 'ledger-prod',
      title: 'Run migration 0042_split_entries',
      first: { name: 'Rizky Pratama', at: '13:58 WIB' },
      you: 'Kevin Tan',
      done: 'Running',
      layout: 'row',
    },
  }),
  twoKey({
    id: 'verify-twokey-cosign',
    size: '1x2',
    domain: 'health',
    surface: 'muted',
    name: 'Second nurse check',
    props: {
      eyebrow: 'Bed 4',
      title: 'Morphine 5 mg IV',
      first: { name: 'Nadia Rahman', role: 'Clinical nurse', at: '14:02 WIB', method: 'Badge' },
      you: 'Sari Dewi',
      action: 'Hold to co-sign',
      done: 'Given',
      note: 'Two nurses check every controlled drug.',
      layout: 'stack',
    },
  }),
  twoKey({
    id: 'verify-twokey-keyload',
    size: '2x2',
    domain: 'defense',
    surface: 'dark',
    name: 'Two-key turn',
    props: {
      eyebrow: 'Crypto room · net ALPHA-4',
      title: 'Load key material for period 11',
      first: { name: 'Lettu Andi Saputra', at: '14:00:12 WIB' },
      you: 'Serka Dimas',
      action: 'Hold to turn key B',
      done: 'Loaded',
      holdMs: 1600,
      look: 'keys',
    },
  }),
)

/* Text diffs */
all.push(
  diff({
    id: 'verify-diff-clause',
    size: '3x2',
    domain: 'workspace',
    name: 'Contract changes',
    props: {
      eyebrow: 'Supply agreement · PT Tirta Baja',
      by: 'Changes from their legal team, 11 Nov',
      hunks: [
        {
          id: 'c42',
          label: 'Clause 4.2 · payment terms',
          before: ['Payment is due 30 days after the invoice date.'],
          after: ['Payment is due 45 days after the invoice date.'],
        },
        {
          id: 'c71',
          label: 'Clause 7.1 · late fee',
          before: ['A late fee of 2% per month applies.'],
          after: ['A late fee of 1.5% per month applies, capped at 6%.'],
        },
        {
          id: 'c93',
          label: 'Clause 9.3 · disputes',
          before: ['Disputes go to the Central Jakarta District Court.'],
          after: ['Disputes go to arbitration in Jakarta.'],
        },
      ],
    },
  }),
  diff({
    id: 'verify-diff-config',
    size: '3x2',
    domain: 'devops',
    surface: 'dark',
    name: 'Config diff',
    props: {
      eyebrow: 'deploy/payments-core.yaml',
      by: 'Rizky Pratama · PR 1907',
      mono: true,
      hunks: [
        { id: 'l12', label: 'line 12', before: ['  replicas: 3'], after: ['  replicas: 5'] },
        { id: 'l31', label: 'line 31', before: ['  timeout: 30s'], after: ['  timeout: 10s', '  retries: 2'] },
        {
          id: 'l44',
          label: 'line 44',
          before: ['  image: payments-core:2026.11.05'],
          after: ['  image: payments-core:2026.11.12'],
        },
      ],
    },
  }),
  diff({
    id: 'verify-diff-headline',
    size: '2x2',
    domain: 'media',
    name: 'Headline edit',
    props: {
      eyebrow: 'Headline and lede',
      by: 'Suggested by Simpul',
      hunks: [
        {
          id: 'h',
          label: 'Headline',
          before: ['Harga cabai melonjak tajam di Jakarta'],
          after: ['Harga cabai naik 40% di Pasar Induk Kramat Jati'],
        },
        {
          id: 'l',
          label: 'Lede',
          before: ['Pedagang mengeluhkan harga yang terus naik.'],
          after: ['Cabai rawit dijual Rp 98.000 per kilo, naik dari Rp 70.000 pekan lalu.'],
        },
      ],
    },
  }),
  diff({
    id: 'verify-diff-listing',
    size: '2x2',
    domain: 'commerce',
    surface: 'muted',
    name: 'Listing edit',
    props: {
      eyebrow: 'Listing · Kopi Arabika Gayo',
      by: 'Suggested by Simpul from the supplier sheet',
      hunks: [
        {
          id: 't',
          label: 'Title',
          before: ['KOPI GAYO 250gr ORIGINAL TERLARIS'],
          after: ['Kopi Arabika Gayo, biji sangrai, 250 g'],
        },
        { id: 'w', label: 'Net weight', before: ['200 g'], after: ['250 g'] },
      ],
    },
  }),
)

/* Payment trails */
all.push(
  trail({
    id: 'verify-trail-bifast',
    size: '3x1',
    domain: 'payments',
    props: {
      eyebrow: 'BI-FAST',
      amount: 'Rp 2.450.000',
      reference: 'BIF-0219384471',
      status: { tone: 'success', label: 'Settled in 10 s' },
      stages: [
        { label: 'Created', at: '14:02:01', state: 'done', detail: 'In the app by you, from Arunika Bank ···· 2207.' },
        { label: 'Screened', at: '14:02:03', state: 'done', detail: 'risk-engine scored 12 of 100; no hits on 3 lists.' },
        { label: 'Sent', at: '14:02:04', state: 'done', detail: 'Handed to the switch as message BF2611120219.' },
        { label: 'Settled', at: '14:02:11', state: 'done', detail: 'Credited to Sari Wulandari at Bank Sagara.' },
      ],
    },
  }),
  trail({
    id: 'verify-trail-swift',
    size: '4x1',
    domain: 'banking',
    surface: 'dark',
    name: 'Wire on hold',
    props: {
      eyebrow: 'Outgoing wire',
      amount: 'USD 48,200.00',
      reference: 'UETR 6f1c2a9e…7b44',
      status: { tone: 'warning', label: 'On hold' },
      stages: [
        { label: 'Created', at: '09:10 WIB', state: 'done', detail: 'Entered by Ayu Lestari, approved by Grace Liu.' },
        {
          label: 'Screened',
          at: '09:12 WIB',
          state: 'held',
          detail: 'The payee name is 82% similar to an entry on a sanctions list. With Maya Kartika, compliance.',
        },
        { label: 'Sent', state: 'todo', detail: 'Goes to the correspondent bank once compliance clears it.' },
        { label: 'Credited', state: 'todo', detail: 'Same day if cleared before 15:00 SGT.' },
      ],
    },
  }),
  trail({
    id: 'verify-trail-payout',
    size: '3x1',
    domain: 'commerce',
    surface: 'muted',
    name: 'Seller payout trail',
    props: {
      eyebrow: 'Seller payout',
      amount: 'Rp 7.812.400',
      reference: 'PO-1112-0412',
      status: { tone: 'brand', label: 'In transit' },
      stages: [
        { label: 'Delivered', at: '09:40', state: 'done', detail: 'The buyer confirmed receipt of order 88412.' },
        { label: 'Released', at: '10:02', state: 'done', detail: 'Escrow released after the 20-minute window.' },
        { label: 'Sent', at: '10:05', state: 'current', detail: 'Batch 14 to Bank Pesisir, expected by 15:00 WIB.' },
        { label: 'Settled', state: 'todo', detail: 'Arrives in Toko Kelontong Bu Ratna ···· 0412.' },
      ],
    },
  }),
  trail({
    id: 'verify-trail-cod',
    size: '2x1',
    domain: 'logistics',
    name: 'Cash on delivery trail',
    props: {
      eyebrow: 'COD remittance',
      amount: 'Rp 1.240.000',
      reference: 'COD-KK-2207',
      status: { tone: 'danger', label: 'Returned' },
      stages: [
        { label: 'Collected', at: '11:20', state: 'done', detail: 'Cash collected by Fikri Ramadhan from the buyer in Rungkut.' },
        { label: 'Hub', at: '13:05', state: 'done', detail: 'Counted at the Surabaya hub: Rp 1.240.000.' },
        { label: 'Paid out', state: 'failed', detail: 'Returned by the bank: the account name does not match the merchant.' },
      ],
    },
  }),
)

/* Days left */
all.push(
  cert({
    id: 'verify-cert-api',
    size: '1x1',
    domain: 'devops',
    name: 'Certificate days',
    props: {
      items: [
        { key: 'Leaf', subject: 'api.simpul.id', days: 23, until: '05 Dec 2026', issuer: 'Nusa Trust R3' },
        { key: 'Int', subject: 'Nusa Trust R3', days: 412, until: '29 Dec 2027', issuer: 'Nusa Trust Root X1' },
        { key: 'Root', subject: 'Nusa Trust Root X1', days: 3105, until: '14 May 2035' },
      ],
    },
  }),
  cert({
    id: 'verify-cert-mtls',
    size: '1x1',
    domain: 'security',
    surface: 'dark',
    name: 'Client cert days',
    props: {
      pixel: true,
      warnAt: 14,
      items: [
        { key: 'Client', subject: 'settlement-link client', days: 4, until: '16 Nov 2026' },
        { key: 'CA', subject: 'Bank Sagara partner CA', days: 611, until: '15 Jul 2028' },
      ],
    },
  }),
  cert({
    id: 'verify-cert-str',
    size: '2x1',
    domain: 'health',
    name: 'Licence days',
    props: {
      eyebrow: 'dr. Hana Lubis, Sp.PD',
      layout: 'wide',
      items: [
        { key: 'STR', subject: 'Registration · STR', days: 1590, until: '21 Mar 2031', issuer: 'Medical council' },
        { key: 'SIP', subject: 'Practice licence · RS Cempaka', days: 212, until: '12 Jun 2027', issuer: 'City health office' },
        { key: 'BLS', subject: 'Life support course', days: 18, until: '30 Nov 2026', issuer: 'Hospital training unit' },
      ],
    },
  }),
  cert({
    id: 'verify-cert-calib',
    size: '1x1',
    domain: 'energy',
    surface: 'muted',
    name: 'Calibration days',
    props: {
      warnAt: 14,
      items: [
        { key: 'GD-07', subject: 'Gas detector GD-07', days: 9, until: '21 Nov 2026' },
        { key: 'M-3312', subject: 'Revenue meter M-3312', days: 140, until: '01 Apr 2027' },
        { key: '87T', subject: 'Relay 87T test', days: 61, until: '12 Jan 2027' },
      ],
    },
  }),
)

/* Signed-in devices */
all.push(
  sessions({
    id: 'verify-sessions-bank',
    size: '2x2',
    domain: 'banking',
    name: 'Trusted devices',
    props: {
      eyebrow: 'Mobile banking · trusted devices',
      action: 'Remove',
      actioned: 'Removed',
      devices: [
        { id: 'p1', kind: 'phone', name: 'Ayu’s phone', place: 'Jakarta', seen: 'Now', current: true },
        { id: 't1', kind: 'tablet', name: 'Home tablet', place: 'Surabaya', seen: '3 days ago' },
        { id: 'p0', kind: 'phone', name: 'Old phone', place: 'Medan', seen: '41 days ago', note: 'unused 30 days' },
        { id: 'w1', kind: 'browser', name: 'Laptop browser', place: 'Bandung', seen: '12 Oct' },
      ],
    },
  }),
  sessions({
    id: 'verify-sessions-sso',
    size: '3x2',
    domain: 'workspace',
    surface: 'muted',
    name: 'Sign-in sessions',
    props: {
      eyebrow: 'Sesi · sign-ins for Rina Hartono',
      layout: 'table',
      allAction: 'Sign out all others',
      devices: [
        { id: 's1', kind: 'laptop', name: 'Laptop', place: 'Jakarta', ip: '10.20.4.17', seen: 'Now', current: true },
        { id: 's2', kind: 'browser', name: 'Desktop browser', place: 'Yogyakarta', ip: '203.0.113.42', seen: '09:12 WIB' },
        { id: 's3', kind: 'phone', name: 'Phone app', place: 'Denpasar', ip: '198.51.100.7', seen: 'Yesterday' },
        { id: 's4', kind: 'tablet', name: 'Tablet app', place: 'Bandung', ip: '198.51.100.23', seen: '07 Nov' },
        { id: 's5', kind: 'browser', name: 'Shared PC, room 3', place: 'Singapore', ip: '192.0.2.88', seen: '05 Nov' },
      ],
    },
  }),
  sessions({
    id: 'verify-sessions-lock',
    size: '2x2',
    domain: 'home',
    name: 'Door keys',
    props: {
      eyebrow: 'Front door · digital keys',
      action: 'Remove',
      actioned: 'Removed',
      devices: [
        { id: 'k0', kind: 'phone', name: 'Your phone', place: 'Owner', seen: 'Now', current: true },
        { id: 'k1', kind: 'phone', name: 'Rina’s phone', place: 'Family', seen: 'any time' },
        { id: 'k2', kind: 'person', name: 'Mbak Sri, cleaner', place: 'Mon and Thu', seen: '08:00–12:00' },
        { id: 'k3', kind: 'key', name: 'Guest code 4471', place: 'Guest', seen: 'until 14 Nov, 12:00' },
      ],
    },
  }),
  sessions({
    id: 'verify-sessions-keys',
    size: '2x1',
    domain: 'security',
    surface: 'dark',
    name: 'Security keys',
    props: {
      eyebrow: 'Security keys · Fajar Nugroho',
      action: 'Revoke',
      actioned: 'Revoked',
      devices: [
        { id: 'h1', kind: 'key', name: 'Kunci 5C, NFC', place: 'Added 02 Mar 2026', seen: 'used 14:02 today' },
        { id: 'h2', kind: 'key', name: 'Kunci Bio', place: 'Added 18 Aug 2025', seen: 'last used 63 days ago' },
      ],
    },
  }),
)

/* Provenance */
all.push(
  prov({
    id: 'verify-prov-cash',
    size: '3x2',
    domain: 'banking',
    props: {
      label: 'Cash position',
      value: 'IDR 4.82 tn',
      asOf: '14:02 WIB',
      layout: 'split',
      sources: [
        {
          id: 'ledger.gl_entries',
          kind: 'table',
          size: '1,204,511 rows',
          fresh: '14:02',
          note: 'Closing balances of 14 operating accounts, posted entries only.',
        },
        {
          id: 'ledger.accounts',
          kind: 'table',
          size: '14 accounts',
          fresh: '14:02',
          note: 'Account list with currency; 2 dormant accounts left out by rule R-7.',
        },
        {
          id: 'fx.fixings',
          kind: 'feed',
          size: '3 currencies',
          fresh: '14:00',
          note: 'USD and SGD fixings from the treasury feed, taken at 14:00 WIB.',
        },
      ],
      transform: 'Sum of closing balances, USD and SGD converted at the 14:00 fixings',
      result: '0 rows differ',
    },
  }),
  prov({
    id: 'verify-prov-yield',
    size: '2x2',
    domain: 'agri',
    surface: 'muted',
    name: 'Forecast sources',
    props: {
      label: 'Yield forecast · Block C',
      value: '6.1',
      unit: 't/ha',
      asOf: '12:00 WIB',
      sources: [
        {
          id: 'probes.block_c',
          kind: 'feed',
          size: '14 probes',
          fresh: '09:12',
          state: 'stale',
          note: 'Probe C-07 has been silent since 09:12; the model uses its last reading.',
        },
        { id: 'rain.daily', kind: 'feed', size: '31 days', fresh: '12:00', note: 'Daily rainfall from the regional weather service.' },
        { id: 'model.yield_v3', kind: 'model', size: 'trained 01 Nov', fresh: '01 Nov', note: 'Trained on six seasons of Block C harvest records.' },
      ],
      transform: 'Model run on 13 live probes and the rainfall series',
      result: 'within 0.1 t/ha',
    },
  }),
  prov({
    id: 'verify-prov-turnout',
    size: '1x2',
    domain: 'civic',
    name: 'Turnout sources',
    props: {
      label: 'Turnout · Coblong',
      value: '78.4%',
      asOf: '19:40 WIB',
      layout: 'narrow',
      sources: [
        { id: 'tally.forms', kind: 'form', size: '409 of 412', fresh: '19:38', note: 'Tally forms scanned from 409 polling stations; 3 are on the way.' },
        { id: 'voters.list', kind: 'table', size: '186,204', fresh: 'Sep', note: 'Final voter list, September revision.' },
        { id: 'count.app', kind: 'feed', size: '412 stations', fresh: '19:40', note: 'Counts entered by station officers, checked against the forms.' },
      ],
      transform: 'Votes cast over registered voters',
      result: 'same to 0.1 pp',
    },
  }),
  prov({
    id: 'verify-prov-load',
    size: '2x2',
    domain: 'energy',
    surface: 'dark',
    name: 'Load sources',
    props: {
      label: 'System load · Bali',
      value: '1,021',
      unit: 'MW',
      asOf: '14:02:05 WITA',
      sources: [
        { id: 'scada.points', kind: 'feed', size: '212 points', fresh: '14:02:05', note: 'Telemetry from 212 measuring points in 38 substations.' },
        { id: 'estimator', kind: 'model', size: 'run 8842', fresh: '14:02:00', note: 'The state estimator fills in 6 points that report by exception.' },
        { id: 'outage.feeder3', kind: 'manual', size: '1 flag', fresh: '13:40', note: 'Feeder 3 out for maintenance, entered by Yoga Pranata.' },
      ],
      transform: 'Sum of estimated injections, less losses',
      result: 'within 2 MW',
    },
  }),
)

/* Checklists */
all.push(
  check({
    id: 'verify-check-preflight',
    size: '1x3',
    domain: 'aerospace',
    surface: 'dark',
    name: 'Before start checklist',
    props: {
      eyebrow: 'PK-NAR',
      by: 'FO Dimas',
      look: 'aviation',
      items: [
        { label: 'Parking brake', response: 'Set' },
        { label: 'Fuel 2,400 kg', response: 'Checked' },
        { label: 'Doors', response: 'Closed' },
        { label: 'Beacon', response: 'On' },
        { label: 'Seat belt sign', response: 'On' },
        { label: 'Transponder', response: 'TA/RA' },
        { label: 'Flight controls', response: 'Free' },
      ],
    },
  }),
  check({
    id: 'verify-check-surgery',
    size: '2x2',
    domain: 'health',
    name: 'Surgical sign in',
    props: {
      eyebrow: 'Theatre 2 · sign in',
      by: 'Nadia R.',
      preset: 2,
      items: [
        { label: 'Patient identity and procedure confirmed' },
        { label: 'Site marked' },
        { label: 'Consent signed' },
        { label: 'Allergies checked: none known' },
        { label: 'Pulse oximeter on and working' },
      ],
    },
  }),
  check({
    id: 'verify-check-release',
    size: '2x2',
    domain: 'devops',
    surface: 'muted',
    name: 'Release checklist',
    props: {
      eyebrow: 'Release 2026.11.12',
      by: 'Rizky',
      items: [
        { label: 'Changelog reviewed' },
        { label: 'Migration dry run passed on staging' },
        { label: 'Rollback tested' },
        { label: 'On-call knows the window' },
        { label: 'Status page note drafted' },
      ],
    },
  }),
  check({
    id: 'verify-check-loto',
    size: '1x2',
    domain: 'energy',
    name: 'Lockout checklist',
    props: {
      eyebrow: 'Feeder 7',
      by: 'Teuku R.',
      look: 'aviation',
      items: [
        { label: 'Breaker', response: 'Open' },
        { label: 'Lock', response: 'On' },
        { label: 'Tag', response: 'Hung' },
        { label: 'Test dead', response: '0 V' },
        { label: 'Earth', response: 'On' },
      ],
    },
  }),
)

/* Reconciliations */
all.push(
  recon({
    id: 'verify-recon-bank',
    size: '4x2',
    domain: 'banking',
    name: 'Bank reconciliation',
    props: {
      eyebrow: 'Arunika Bank ···· 2207 against the ledger · 12 Nov',
      leftLabel: 'Bank statement',
      rightLabel: 'Ledger',
      rows: [
        {
          id: 'r1',
          left: { key: '12 Nov', text: 'TRF PT SINAR ARMADA', amount: '48.200.000' },
          right: { key: 'INV-2207', text: 'Sinar Armada, October freight', amount: '48.200.000' },
        },
        {
          id: 'r2',
          left: { key: '12 Nov', text: 'QRIS SETTLE 1107', amount: '3.412.500' },
          right: { key: 'QR-1107', text: 'QRIS sales 07 Nov', amount: '3.415.000' },
          diff: '−2.500',
          reason: 'QRIS fee of 0.07%, not booked yet',
        },
        {
          id: 'r3',
          left: { key: '12 Nov', text: 'TRF PT GRAHA NIAGA', amount: '12.000.000' },
          right: { key: 'INV-2190', text: 'Graha Niaga, deposit', amount: '12.000.000' },
        },
        { id: 'r4', left: { key: '12 Nov', text: 'BIAYA ADM', amount: '−15.000' }, right: null },
        {
          id: 'r5',
          left: { key: '11 Nov', text: 'TRF KOPRA LABS', amount: '7.500.000' },
          right: { key: 'INV-2212', text: 'Kopra Labs, licence', amount: '7.500.000' },
        },
      ],
    },
  }),
  recon({
    id: 'verify-recon-payout',
    size: '3x2',
    domain: 'commerce',
    surface: 'muted',
    name: 'Payout reconciliation',
    props: {
      eyebrow: 'Marketplace payout 0412 against orders',
      leftLabel: 'Payout',
      rightLabel: 'Orders',
      rows: [
        {
          id: 'p1',
          left: { key: 'ORD-88412', text: 'Kopi Gayo 250 g × 2', amount: '169.000' },
          right: { key: '88412', text: '2 × Rp 84.500', amount: '169.000' },
        },
        {
          id: 'p2',
          left: { key: 'ORD-88419', text: 'Gula Aren 1 kg', amount: '41.580' },
          right: { key: '88419', text: 'Rp 42.000 less fee', amount: '42.000' },
          diff: '−420',
          reason: 'marketplace fee of 1%, per the October rate card',
        },
        {
          id: 'p3',
          left: { key: 'ORD-88427', text: 'Teh Melati × 3', amount: '87.000' },
          right: { key: '88427', text: '3 × Rp 29.000', amount: '87.000' },
        },
        { id: 'p4', left: { key: 'ADJ-0412', text: 'Shipping subsidy', amount: '12.000' }, right: null },
        {
          id: 'p5',
          left: { key: 'ORD-88431', text: 'Kopi Gayo 250 g', amount: '84.500' },
          right: { key: '88431', text: '1 × Rp 84.500', amount: '84.500' },
        },
      ],
    },
  }),
  recon({
    id: 'verify-recon-ballot',
    size: '2x2',
    domain: 'civic',
    name: 'Tally check',
    props: {
      eyebrow: 'TPS 017 · Kelurahan Dago',
      look: 'tally',
      nameLabel: 'Candidate',
      leftLabel: 'Form',
      rightLabel: 'App',
      rows: [
        { id: 'b1', left: { text: 'Pair 01', amount: '212' }, right: { text: 'Pair 01', amount: '212' } },
        {
          id: 'b2',
          left: { text: 'Pair 02', amount: '187' },
          right: { text: 'Pair 02', amount: '178' },
          diff: '−9',
          reason: 'the app is 9 short; recount or correct the entry',
        },
        { id: 'b3', left: { text: 'Pair 03', amount: '96' }, right: { text: 'Pair 03', amount: '96' } },
        { id: 'b4', left: { text: 'Invalid ballots', amount: '11' }, right: { text: 'Invalid', amount: '11' } },
      ],
    },
  }),
)

/* Identity checks. Every number here is invented and masked by default. */
all.push(
  kyc({
    id: 'verify-kyc-account',
    size: '2x2',
    domain: 'banking',
    name: 'Account opening check',
    props: {
      eyebrow: 'Account opening · KYC-88412',
      subject: 'Siti Rahmawati',
      fields: [
        { label: 'NIK', masked: '3171 •••• •••• 0042', full: '3171 0654 0894 0042', verdict: 'match' },
        { label: 'Name', masked: 'SITI RAHMAWATI', verdict: 'match' },
        { label: 'Born', masked: '•• ••• 1994', full: '14 Aug 1994', verdict: 'match' },
        { label: 'Face', masked: 'Selfie and ID photo', verdict: 'match', score: '94%' },
        {
          label: 'Address',
          masked: 'Jl. Cempaka •••, Jakarta Pusat',
          full: 'Jl. Cempaka Putih Tengah 17, Jakarta Pusat',
          verdict: 'partial',
          note: 'RT/RW 004/007 here, 004/008 in the civil registry.',
        },
      ],
    },
  }),
  kyc({
    id: 'verify-kyc-merchant',
    size: '3x1',
    domain: 'payments',
    surface: 'muted',
    name: 'Merchant check',
    props: {
      eyebrow: 'Merchant onboarding · CV Rotan Cirebon',
      layout: 'strip',
      fields: [
        { label: 'Owner NIK', masked: '3209 •••• •••• 0718', full: '3209 1212 0378 0718', verdict: 'match' },
        { label: 'NPWP', masked: '09.•••.•••.•-•••.000', full: '09.254.381.7-426.000', verdict: 'match' },
        {
          label: 'Account name',
          masked: 'ROTAN CIREBON CV',
          verdict: 'partial',
          score: '88%',
          note: 'same words as the deed, in another order',
        },
      ],
    },
  }),
  kyc({
    id: 'verify-kyc-patient',
    size: '2x1',
    domain: 'health',
    name: 'Patient identity check',
    props: {
      eyebrow: 'Bed 12 · Wahyu S.',
      fields: [
        { label: 'JKN no.', masked: '0001 •••• ••• 31', full: '0001 4472 108 31', verdict: 'match' },
        { label: 'Wristband', masked: 'MRN 00-41-22', verdict: 'match' },
      ],
    },
  }),
  kyc({
    id: 'verify-kyc-driver',
    size: '2x2',
    domain: 'transit',
    surface: 'dark',
    name: 'Driver check',
    props: {
      eyebrow: 'Driver onboarding · DRV-2207',
      subject: 'Andika Saputra',
      fields: [
        { label: 'Licence', masked: '•••• •••• 2207', full: '1208 9411 2207', verdict: 'match' },
        { label: 'Face', masked: 'Live check', verdict: 'match', score: '91%' },
        { label: 'Plate', masked: 'B 1924 KZT', verdict: 'match' },
        {
          label: 'Reg. card',
          masked: 'STNK ••• 4471',
          full: 'STNK 0912 4471',
          verdict: 'mismatch',
          note: 'Expired 02 Nov 2026. Ask for the renewed card.',
        },
      ],
    },
  }),
)

/* Proof of delivery */
all.push(
  pod({
    id: 'verify-pod-parcel',
    size: '2x2',
    domain: 'logistics',
    props: {
      eyebrow: 'AWB KK-2207-4418-90',
      to: 'Ibu Ratna',
      at: '14:02 WIB',
      place: 'Jl. Dago 112, Bandung',
      signature:
        'M18 52 C24 30 34 22 36 34 S26 58 24 50 S40 28 50 36 S56 52 62 42 S70 30 74 40 S78 54 86 44 C92 36 96 38 98 46 S108 50 114 40 S122 32 128 42 S136 52 146 38 C152 30 160 30 170 34 M30 63 C70 57 120 61 176 55',
      scene: 'door',
      photoCaption: 'Photo 1 of 2 · parcel at the front door',
      lat: '−6.8862',
      lng: '107.6100',
      distance: 18,
    },
  }),
  pod({
    id: 'verify-pod-pharmacy',
    size: '2x2',
    domain: 'health',
    surface: 'muted',
    name: 'Medicine delivery proof',
    props: {
      eyebrow: 'Rx 0412 · insulin pens',
      to: 'Pak Hendra',
      at: '10:41 WIB',
      place: 'Jl. Kaliurang km 5, Yogyakarta',
      signature:
        'M22 56 L30 26 L34 50 C40 40 46 38 50 44 S46 54 54 50 C62 46 64 36 70 40 S72 54 80 50 C86 46 90 30 96 26 C98 40 96 52 104 50 S116 38 122 44 S126 54 136 46 S150 40 168 44',
      scene: 'cooler',
      photoCaption: 'Photo 1 of 1 · cool box sealed',
      lat: '−7.7520',
      lng: '110.3833',
      distance: 9,
      facts: [{ label: 'Cold chain', value: '4.1 °C held' }],
    },
  }),
  pod({
    id: 'verify-pod-fertiliser',
    size: '3x2',
    domain: 'agri',
    name: 'Farm delivery proof',
    props: {
      eyebrow: 'DO 1187 · urea, 40 sacks',
      to: 'Ahmad Fauzi',
      at: '09:15 WIB',
      place: 'Koperasi Tani Sumber Rejeki, Garut',
      signature:
        'M16 30 L44 28 M28 28 L24 56 M26 42 L40 41 C48 40 50 52 56 50 S62 40 66 44 S64 56 72 52 C80 46 82 40 88 42 S90 54 98 52 S108 38 114 46 S120 56 128 48 C136 40 150 42 180 38',
      scene: 'sacks',
      photoCaption: 'Photo 2 of 3 · sacks counted in the store',
      lat: '−7.2279',
      lng: '107.9087',
      distance: 64,
      radius: 100,
      layout: 'wide',
      facts: [
        { label: 'Weighbridge', value: '2,000 kg' },
        { label: 'Sacks', value: '40 of 40' },
      ],
    },
  }),
)

/* Policy checks */
all.push(
  policy({
    id: 'verify-policy-iac',
    size: '2x2',
    domain: 'devops',
    surface: 'dark',
    name: 'Plan checks',
    props: {
      eyebrow: 'payments-core plan',
      checks: [
        { name: 'Storage buckets are private', result: 'pass', rule: 'STO-01', detail: 'All 4 buckets block public reads.' },
        { name: 'Encryption at rest', result: 'pass', rule: 'ENC-02', detail: 'Disks and the ledger database use the platform key ring.' },
        {
          name: 'No admin port open to the internet',
          result: 'fail',
          rule: 'NET-22',
          detail: 'Port 22 is open to 0.0.0.0/0 on sg-ledger-admin. Limit it to the bastion.',
        },
        { name: 'Owner tag on every resource', result: 'warn', rule: 'TAG-03', detail: '2 new resources have no owner tag.' },
        { name: 'Deletion protection on databases', result: 'pass', rule: 'DB-05', detail: 'ledger-prod and ledger-replica are protected.' },
        { name: 'Backups kept 14 days', result: 'pass', rule: 'BAK-14', detail: 'Daily snapshots, kept 14 days, copied to ap-southeast-1.' },
      ],
    },
  }),
  policy({
    id: 'verify-policy-screening',
    size: '2x1',
    domain: 'payments',
    name: 'Payment screening',
    props: {
      eyebrow: 'Screening · TRX 88412',
      layout: 'compact',
      checks: [
        { name: 'Sanctions lists', result: 'pass', detail: 'No match on 3 lists, checked 14:02:03 WIB.' },
        { name: 'Daily limit', result: 'warn', detail: 'This payment uses 92% of today’s limit.' },
        { name: 'Velocity', result: 'pass', detail: '4 payments in the last hour, under the limit of 10.' },
      ],
    },
  }),
  policy({
    id: 'verify-policy-permit',
    size: '2x2',
    domain: 'civic',
    name: 'Permit rules',
    props: {
      eyebrow: 'Permit · Jl. Riau 41',
      checks: [
        { name: 'Building coverage 58%, limit 60%', result: 'pass', rule: 'KDB', detail: 'Footprint 290 m² on a 500 m² plot.' },
        { name: 'Floor area ratio 2.4, limit 2.4', result: 'pass', rule: 'KLB', detail: '1,200 m² of floor on 500 m², right at the limit.' },
        {
          name: 'Setback 4.5 m, needs 5.0 m',
          result: 'fail',
          rule: 'GSB',
          detail: 'The front wall stands 0.5 m inside the setback line from Jl. Riau.',
        },
        { name: 'Height 4 floors, limit 4', result: 'pass', rule: 'TB', detail: 'Roof at 15.8 m.' },
        { name: 'Green area 22%, needs 20%', result: 'pass', rule: 'KDH', detail: '110 m² of open soil and planting.' },
      ],
    },
  }),
  policy({
    id: 'verify-policy-meds',
    size: '1x2',
    domain: 'health',
    surface: 'muted',
    name: 'Order checks',
    props: {
      eyebrow: 'Bed 7',
      layout: 'narrow',
      checks: [
        { name: 'Allergies', result: 'pass', detail: 'No known allergies on record.' },
        { name: 'Warfarin with aspirin', result: 'warn', detail: 'Bleeding risk. Check INR before the next dose.' },
        { name: 'Dose range', result: 'pass', detail: 'Within range for 64 kg.' },
        { name: 'Kidney function', result: 'pass', detail: 'eGFR 78, no change needed.' },
        { name: 'Duplicate therapy', result: 'pass', detail: 'No second anticoagulant on the chart.' },
      ],
    },
  }),
)

/* Restore tests */
all.push(
  restore({
    id: 'verify-restore-ledger',
    size: '2x2',
    domain: 'devops',
    surface: 'dark',
    name: 'Database restore test',
    props: {
      eyebrow: 'ledger-prod',
      backupAt: '14:00 WIB',
      size: '412 GB',
      lastTest: '4 days ago',
      steps: [
        { label: 'Fetch snapshot', result: 'snap-1112-1400' },
        { label: 'Restore to sandbox', result: 'restore-sbx-07' },
        { label: 'Compare row counts', result: '18,204,551, same' },
        { label: 'Checksum tables', result: '212 of 212' },
      ],
    },
  }),
  restore({
    id: 'verify-restore-emr',
    size: '2x1',
    domain: 'health',
    name: 'Records restore test',
    props: {
      eyebrow: 'RS Cempaka records',
      backupAt: '02:00 WIB',
      size: '1.8 TB',
      lastTest: '9 days ago',
      layout: 'row',
      steps: [
        { label: 'Snapshot', result: 'ok' },
        { label: 'Restore', result: 'ok' },
        { label: 'Open 20', result: '20 of 20' },
        { label: 'Compare', result: 'same' },
      ],
    },
  }),
  restore({
    id: 'verify-restore-drive',
    size: '2x1',
    domain: 'workspace',
    surface: 'muted',
    name: 'Drive restore test',
    props: {
      eyebrow: 'Finance drive',
      backupAt: '13:00 WIB',
      size: '86 GB',
      lastTest: '2 days ago',
      layout: 'row',
      steps: [
        { label: 'Snapshot', result: 'ok' },
        { label: 'Restore', result: 'ok' },
        { label: '50 files', result: '50 of 50' },
        { label: 'Hashes', result: 'same' },
      ],
    },
  }),
  restore({
    id: 'verify-restore-nas',
    size: '1x1',
    domain: 'home',
    name: 'Photo backup test',
    props: {
      eyebrow: 'Photos NAS',
      backupAt: '03:00',
      size: '1.2 TB',
      lastTest: '31 days ago',
      overdue: true,
      layout: 'mini',
      steps: [
        { label: 'Snapshot', result: 'ok' },
        { label: 'Restore', result: 'ok' },
        { label: 'Open 10 photos', result: '10 of 10' },
      ],
    },
  }),
)

/* Locked prices */
all.push(
  quote({
    id: 'verify-quote-remit',
    size: '2x1',
    domain: 'payments',
    name: 'Locked rate',
    props: {
      eyebrow: 'SGD to IDR · remittance',
      unit: 'IDR per SGD',
      seconds: 30,
      lockedAt: '14:02:11 WIB',
      quote: {
        rate: '11,842.50',
        lines: [
          { label: 'You send', value: 'SGD 1,000.00' },
          { label: 'Fee', value: 'SGD 4.00' },
          { label: 'They get', value: 'Rp 11.795.130' },
        ],
      },
      next: [
        {
          rate: '11,836.90',
          move: '−0.05%',
          lines: [
            { label: 'You send', value: 'SGD 1,000.00' },
            { label: 'Fee', value: 'SGD 4.00' },
            { label: 'They get', value: 'Rp 11.789.552' },
          ],
        },
        {
          rate: '11,851.20',
          move: '+0.12%',
          lines: [
            { label: 'You send', value: 'SGD 1,000.00' },
            { label: 'Fee', value: 'SGD 4.00' },
            { label: 'They get', value: 'Rp 11.803.795' },
          ],
        },
      ],
    },
  }),
  quote({
    id: 'verify-quote-fx',
    size: '1x1',
    domain: 'banking',
    surface: 'dark',
    name: 'Desk rate hold',
    props: {
      eyebrow: 'USD/IDR',
      seconds: 20,
      pixel: true,
      layout: 'mini',
      quote: { rate: '15,842' },
      next: [
        { rate: '15,851', move: '+0.06%' },
        { rate: '15,838', move: '−0.08%' },
      ],
    },
  }),
  quote({
    id: 'verify-quote-freight',
    size: '2x2',
    domain: 'logistics',
    name: 'Freight quote hold',
    props: {
      eyebrow: 'Sea freight · Surabaya to Makassar',
      unit: 'per 20 ft',
      seconds: 900,
      lockedAt: '13:55 WIB',
      layout: 'card',
      quote: {
        rate: 'Rp 14.200.000',
        lines: [
          { label: 'Vessel', value: 'KM Sagara Jaya, 14 Nov' },
          { label: 'Port to port', value: '3 days' },
          { label: 'Includes', value: 'Handling at both ports' },
        ],
      },
      next: [
        {
          rate: 'Rp 14.650.000',
          move: '+3.2%',
          lines: [
            { label: 'Vessel', value: 'KM Sagara Jaya, 14 Nov' },
            { label: 'Port to port', value: '3 days' },
            { label: 'Includes', value: 'Handling at both ports' },
          ],
        },
      ],
    },
  }),
  quote({
    id: 'verify-quote-gold',
    size: '1x1',
    domain: 'commerce',
    name: 'Gold price hold',
    props: {
      eyebrow: 'Gold',
      unit: 'per g',
      seconds: 60,
      layout: 'mini',
      quote: { rate: 'Rp 1.412.000' },
      next: [{ rate: 'Rp 1.415.500', move: '+0.25%' }],
    },
  }),
)

/* Chains of custody */
all.push(
  custody({
    id: 'verify-custody-specimen',
    size: '1x2',
    domain: 'health',
    name: 'Sample custody',
    props: {
      eyebrow: 'Lab chain',
      item: 'Blood sample 0412-B',
      handoffs: [
        { who: 'Nadia Rahman', role: 'Clinical nurse, Ward 3', at: '07:12', place: 'Ward 3', seal: '5512', sealOk: true, note: 'Two tubes, labelled at the bedside.' },
        { who: 'Fikri R.', role: 'Courier', at: '07:40', place: 'Cool bag', seal: '5512', sealOk: true, note: 'Carried at 4 °C.' },
        { who: 'Lab reception', at: '08:05', place: 'Central lab', seal: '5512', sealOk: true, note: 'Seal opened by Clara Siahaan.' },
        { who: 'Analyser 2', at: '08:22', place: 'Haematology', note: 'Result released at 09:10.' },
      ],
    },
  }),
  custody({
    id: 'verify-custody-container',
    size: '2x2',
    domain: 'logistics',
    name: 'Container custody',
    props: {
      eyebrow: 'Tanjung Priok to Makassar',
      item: 'TGHU 441720 9 · 20 ft',
      opened: 0,
      handoffs: [
        { who: 'Depot Cakung', at: '09 Nov 10:20', place: 'Jakarta', seal: 'ID-4417 2093', sealOk: true, note: 'Sealed after loading 1,240 cartons.' },
        { who: 'Tanjung Priok gate', at: '09 Nov 17:42', place: 'Terminal 3', seal: 'ID-4417 2093', sealOk: true, note: 'Gate in; scan clear.' },
        { who: 'KM Sagara Jaya', at: '10 Nov 02:10', place: 'Bay 14', seal: 'ID-4417 2093', sealOk: true, note: 'Loaded on board.' },
        { who: 'Makassar port', at: '12 Nov 08:30', place: 'Makassar', seal: 'ID-4417 2093', sealOk: true, note: 'Discharged; seal checked by Marthen Wanggai.' },
      ],
    },
  }),
  custody({
    id: 'verify-custody-evidence',
    size: '1x2',
    domain: 'civic',
    surface: 'muted',
    name: 'Evidence custody',
    props: {
      eyebrow: 'Evidence',
      item: 'Bag B-2207 · phone',
      handoffs: [
        { who: 'Bripka R. Hidayat', at: '03 Nov 21:40', place: 'Seized', seal: '77802', sealOk: true, note: 'Bagged and sealed at the scene.' },
        { who: 'Forensic lab', at: '04 Nov 09:15', seal: '77802', sealOk: true, note: 'Image taken; its hash is in the case file.' },
        { who: 'Property room', at: '07 Nov 16:20', seal: '77810', sealOk: false, note: 'Resealed by the lab under a new number, 77810. Both numbers are on the form.' },
      ],
    },
  }),
  custody({
    id: 'verify-custody-pouch',
    size: '1x3',
    domain: 'defense',
    surface: 'dark',
    name: 'Courier custody',
    props: {
      eyebrow: 'Courier',
      item: 'Pouch 17/XI',
      handoffs: [
        { who: 'Registry, HQ', at: '05 Nov 08:00', place: 'Jakarta', seal: 'P-3301', sealOk: true, note: 'Packed and sealed by the registry clerk.' },
        { who: 'Kapten Yusuf H.', at: '05 Nov 08:20', place: 'Courier', seal: 'P-3301', sealOk: true, note: 'Signed out for hand carry.' },
        { who: 'Halim air base', at: '05 Nov 10:05', place: 'Flight NA-17', seal: 'P-3301', sealOk: true, note: 'Seal checked at boarding.' },
        { who: 'Ops room, Makassar', at: '05 Nov 13:40', place: 'Signed in', seal: 'P-3301', sealOk: true, note: 'Seal checked on arrival.' },
        { who: 'Kolonel Bima P.', at: '05 Nov 14:02', place: 'Opened', note: 'Contents checked against the list: 4 of 4.' },
      ],
    },
  }),
)

/* Consent records */
all.push(
  consent({
    id: 'verify-consent-records',
    size: '2x1',
    domain: 'health',
    name: 'Record sharing consent',
    props: {
      reference: 'CNS-7F2A-0412',
      who: 'Klinik Pratama Cempaka',
      what: 'read your lab results from RS Harapan',
      since: '02 Nov 2026',
      until: '02 Feb 2027',
    },
  }),
  consent({
    id: 'verify-consent-openbank',
    size: '2x2',
    domain: 'banking',
    name: 'Account access consent',
    props: {
      reference: 'OB-2207-KOPRA',
      who: 'Kopra Labs budgeting app',
      what: 'read two of your Arunika Bank accounts',
      since: '01 Oct 2026',
      until: '30 Dec 2026',
      layout: 'card',
      scopes: [
        { label: 'Balances', on: true },
        { label: 'Transactions, 12 months', on: true },
        { label: 'Account holder name', on: true },
        { label: 'Start payments', on: false },
      ],
    },
  }),
  consent({
    id: 'verify-consent-camera',
    size: '1x1',
    domain: 'home',
    name: 'Camera consent',
    props: {
      reference: 'CNS-CAM-18',
      who: 'Estate security',
      what: 'see clips from your doorbell',
      since: '18 Oct 2026',
      layout: 'mini',
    },
  }),
  consent({
    id: 'verify-consent-voice',
    size: '1x1',
    domain: 'audio',
    surface: 'muted',
    name: 'Voice consent',
    props: {
      reference: 'VOX-0812',
      who: 'Dubbing library',
      what: 'use your voice in Indonesian dubs',
      since: '12 Aug 2026',
      layout: 'mini',
    },
  }),
)

/* Read receipts */
all.push(
  seen({
    id: 'verify-seen-memo',
    size: '1x1',
    domain: 'workspace',
    surface: 'brand',
    name: 'Policy read receipts',
    props: {
      eyebrow: 'Travel policy v4',
      people: [
        { name: 'Ayu Lestari', seen: '09:12' },
        { name: 'Kevin Tan', seen: '09:40' },
        { name: 'Rina Hartono', seen: '11:02' },
        { name: 'Dimas Pratama' },
        { name: 'Sofia Marques' },
      ],
    },
  }),
  seen({
    id: 'verify-seen-handover',
    size: '2x1',
    domain: 'health',
    name: 'Handover read receipts',
    props: {
      eyebrow: 'Night handover · Ward 3',
      verb: 'read',
      layout: 'row',
      people: [
        { name: 'Nadia Rahman', seen: '06:58' },
        { name: 'Sari Dewi', seen: '07:01' },
        { name: 'Lia Kusuma', seen: '07:03' },
        { name: 'Rudi Hartanto', seen: '07:10' },
        { name: 'Tika Amalia' },
        { name: 'Yohana Sitompul' },
      ],
    },
  }),
  seen({
    id: 'verify-seen-orders',
    size: '2x1',
    domain: 'defense',
    surface: 'dark',
    name: 'Order acknowledgements',
    props: {
      eyebrow: 'Order 117/XI · movement',
      verb: 'acknowledged',
      layout: 'row',
      people: [
        { name: 'Elang 1', seen: '14:02' },
        { name: 'Elang 2', seen: '14:04' },
        { name: 'Rajawali', seen: '14:05' },
        { name: 'Merpati', seen: '14:11' },
        { name: 'Kakatua' },
        { name: 'Jalak' },
      ],
    },
  }),
  seen({
    id: 'verify-seen-evac',
    size: '1x1',
    domain: 'civic',
    name: 'Notice read receipts',
    props: {
      eyebrow: 'Flood notice',
      cols: 6,
      people: [
        { name: 'RT 01', seen: '05:40' },
        { name: 'RT 02', seen: '05:41' },
        { name: 'RT 03', seen: '05:44' },
        { name: 'RT 04' },
        { name: 'RT 05', seen: '05:52' },
        { name: 'RT 06', seen: '05:58' },
        { name: 'RT 07', seen: '06:03' },
        { name: 'RT 08' },
        { name: 'RT 09', seen: '06:10' },
        { name: 'RT 10', seen: '06:12' },
        { name: 'RT 11' },
        { name: 'RT 12', seen: '06:20' },
      ],
    },
  }),
)

/* Build provenance */
all.push(
  attest({
    id: 'verify-attest-image',
    size: '2x2',
    domain: 'devops',
    surface: 'dark',
    name: 'Image provenance',
    props: {
      eyebrow: 'payments-core:2026.11.12',
      digest: 'sha256:4e7a91c03bd2f6a85e19c7d40b2a3f6e8d1c95a07b3e4f2d6c8a1b9e0f5d7c3a',
      verifiedAt: '14:02:11 WIB',
      claims: [
        {
          label: 'Source',
          value: 'pay/core @ a3f9c2e',
          word: 'Signed',
          ok: true,
          evidence: 'Commit a3f9c2e is signed by Kevin Tan with SSH key 2, which is on the team keyring.',
        },
        { label: 'Builder', value: 'ci-runner-07', word: 'Hermetic', ok: true, evidence: 'Built with the network off; every input is pinned by digest.' },
        { label: 'Inputs', value: '412 packages', word: '0 critical', ok: true, evidence: 'The SBOM lists 412 packages: 0 critical, 2 low advisories, both accepted.' },
        { label: 'Rebuild', value: '2 of 2 builds', word: 'Identical', ok: true, evidence: 'A second builder produced the same digest, byte for byte.' },
      ],
    },
  }),
  attest({
    id: 'verify-attest-flight',
    size: '2x2',
    domain: 'aerospace',
    name: 'Flight software provenance',
    props: {
      eyebrow: 'Lintang-2 FSW 4.1.0',
      digest: 'sha256:9c0de44a1f7b3e28c5d90a6b1e47f3c2d8a59e01b6c7f4a3e2d1c0b9a8f7e6d5',
      claims: [
        { label: 'Source', value: 'tag fsw-4.1.0', word: 'Signed', ok: true, evidence: 'The tag is signed by Andi Makkasau with ground key 2.' },
        { label: 'Compiler', value: 'kit Q-7', word: 'Qualified', ok: true, evidence: 'Compiler and flags match the qualified kit used for 4.0.' },
        { label: 'Tests', value: '1,204 of 1,204', word: 'Passed', ok: true, evidence: 'Unit and hardware-in-the-loop tests on the engineering model.' },
        {
          label: 'Analysis',
          value: '2 rule breaks',
          word: 'Clean',
          ok: false,
          evidence: 'Static analysis found 2 breaks of required coding rules in the attitude module. A waiver is needed before upload.',
        },
      ],
    },
  }),
  attest({
    id: 'verify-attest-mixer',
    size: '2x1',
    domain: 'audio',
    name: 'Firmware provenance',
    props: {
      eyebrow: 'Desk firmware 4.2.1',
      digest: 'sha256:1b7e40c9a2d35f8e06c4b91a7d2e3f5c8a09b6d1e4f7a2c3b5d8e0f1a9c6b4d2',
      layout: 'row',
      claims: [
        { label: 'Signature', value: 'vendor key 2026', word: 'Signed', ok: true, evidence: 'Signed with the vendor key listed on the support page.' },
        { label: 'Notes', value: 'release 4.2.1', word: 'Same', ok: true, evidence: 'Version, size and date match the release notes.' },
        { label: 'Downgrade', value: 'blocked below 4.1', word: 'On', ok: true, evidence: 'The desk refuses firmware older than 4.1.' },
      ],
    },
  }),
)

/* Done on your behalf */
all.push(
  agent({
    id: 'verify-agent-inbox',
    size: '3x2',
    domain: 'workspace',
    name: 'Done during a meeting',
    props: {
      eyebrow: 'Simpul · during your 09:00 meeting',
      note: 'Nothing was sent in your name.',
      actions: [
        { at: '09:04', text: 'Filed 12 receipts under Finance, November', scope: 'Mail › Finance/November' },
        { at: '09:11', text: 'Declined “Vendor demo”; it clashed with board prep', scope: 'Calendar · Thu 10:00' },
        { at: '09:20', text: 'Drafted 3 replies for you to check', scope: 'Mail › Drafts', revertLabel: 'Delete drafts' },
        { at: '09:32', text: 'Moved the budget memo review to Thursday 10:00', scope: 'Calendar' },
        { at: '09:41', text: 'Unsubscribed you from 2 newsletters', scope: 'Mail' },
      ],
    },
  }),
  agent({
    id: 'verify-agent-prices',
    size: '3x1',
    domain: 'commerce',
    name: 'Repricing record',
    props: {
      eyebrow: 'Simpul · repricing run 06:00',
      layout: 'strip',
      actions: [
        { at: '06:01', text: 'Kopi Gayo 250 g to Rp 84.500, level with the lowest seller' },
        { at: '06:02', text: 'Paused the 11.11 ad set; it reached its daily cap' },
        { at: '06:04', text: 'Marked Gula Aren 1 kg back in stock' },
      ],
    },
  }),
  agent({
    id: 'verify-agent-bills',
    size: '2x2',
    domain: 'banking',
    surface: 'muted',
    name: 'Money moved for you',
    props: {
      eyebrow: 'Simpul · this week',
      note: 'Payments over Rp 500.000 still wait for you.',
      actions: [
        { at: 'Mon', text: 'Paid electricity, Rp 412.300', scope: 'Meter 5521 •••• 0412', final: true },
        { at: 'Tue', text: 'Moved Rp 2.000.000 to Savings', scope: '···· 2207 › ···· 9918' },
        { at: 'Wed', text: 'Sorted 18 transactions into categories', scope: 'Budget' },
        { at: 'Thu', text: 'Cancelled an unused subscription, Rp 54.900 a month', scope: 'Card ···· 4471', revertLabel: 'Resubscribe' },
      ],
    },
  }),
  agent({
    id: 'verify-agent-scale',
    size: '2x2',
    domain: 'devops',
    name: 'Done on call',
    props: {
      eyebrow: 'Simpul · 02:00–06:00',
      note: 'Anything customer-facing paged a person.',
      actions: [
        { at: '02:14', text: 'Scaled payments-core from 6 to 9 pods', scope: 'ap-southeast-3' },
        { at: '02:31', text: 'Restarted 2 pods stuck on node-14', scope: 'payments-core' },
        { at: '03:05', text: 'Rotated the notifications webhook secret', scope: 'notifications', revertLabel: 'Restore old' },
        { at: '05:40', text: 'Wrote incident note INC-2207', scope: 'Incidents', final: true },
      ],
    },
  }),
)

/* Self-tests */
all.push(
  bit({
    id: 'verify-bit-radar',
    size: '1x1',
    domain: 'defense',
    surface: 'dark',
    name: 'Radar self-test',
    props: {
      eyebrow: 'Radar unit 3',
      cols: 6,
      pixel: true,
      tests: [
        { code: 'PSU', name: 'Power supply', result: 'pass' },
        { code: 'TX1', name: 'Transmitter 1', result: 'pass' },
        { code: 'TX2', name: 'Transmitter 2', result: 'pass' },
        { code: 'RX1', name: 'Receiver 1', result: 'pass' },
        { code: 'RX2', name: 'Receiver 2 noise floor high', result: 'warn' },
        { code: 'LO', name: 'Local oscillator', result: 'pass' },
        { code: 'ADC', name: 'Converters', result: 'pass' },
        { code: 'DSP', name: 'Signal processor', result: 'pass' },
        { code: 'CLG', name: 'Cooling', result: 'pass' },
        { code: 'ANT', name: 'Antenna drive', result: 'pass' },
        { code: 'NAV', name: 'Heading reference', result: 'pass' },
        { code: 'NET', name: 'Data link', result: 'pass' },
      ],
    },
  }),
  bit({
    id: 'verify-bit-ci',
    size: '1x1',
    domain: 'devops',
    name: 'Pull request checks',
    props: {
      eyebrow: 'PR 1907',
      cols: 6,
      tests: [
        { code: 'LNT', name: 'Lint', result: 'pass' },
        { code: 'TYP', name: 'Type check', result: 'pass' },
        { code: 'UNI', name: 'Unit tests', result: 'pass' },
        { code: 'E2E', name: 'Checkout test timed out', result: 'fail' },
        { code: 'BLD', name: 'Build', result: 'pass' },
        { code: 'SBM', name: 'SBOM', result: 'pass' },
        { code: 'LIC', name: 'Licences', result: 'pass' },
        { code: 'SEC', name: 'Secret scan', result: 'pass' },
        { code: 'SIZ', name: 'Bundle size', result: 'pass' },
        { code: 'A11', name: 'Accessibility', result: 'pass' },
        { code: 'PRF', name: 'Performance', result: 'pass' },
        { code: 'DEP', name: 'Dependencies', result: 'pass' },
      ],
    },
  }),
  bit({
    id: 'verify-bit-relay',
    size: '2x1',
    domain: 'energy',
    surface: 'dark',
    name: 'Relay self-test',
    props: {
      eyebrow: 'Relay 87T · GI Nusa Dua',
      cols: 8,
      layout: 'row',
      lastRun: 'Last run automatic, 06:00 WITA',
      tests: [
        { code: 'CT1', name: 'Current input 1', result: 'pass' },
        { code: 'CT2', name: 'Current input 2', result: 'pass' },
        { code: 'CT3', name: 'Current input 3', result: 'pass' },
        { code: 'VT1', name: 'Voltage input 1', result: 'pass' },
        { code: 'VT2', name: 'Voltage input 2', result: 'pass' },
        { code: 'TRP', name: 'Trip circuit', result: 'pass' },
        { code: 'CB', name: 'Breaker status', result: 'pass' },
        { code: 'DC', name: 'DC supply', result: 'pass' },
        { code: 'CPU', name: 'Processor', result: 'pass' },
        { code: 'RAM', name: 'Memory', result: 'pass' },
        { code: 'ROM', name: 'Settings store', result: 'pass' },
        { code: 'CLK', name: 'Clock', result: 'pass' },
        { code: 'COM', name: 'Station bus', result: 'pass' },
        { code: 'GPS', name: 'Time sync drifting 4 ms', result: 'warn' },
        { code: 'IRG', name: 'Time code input', result: 'pass' },
        { code: 'HMI', name: 'Front panel', result: 'pass' },
      ],
    },
  }),
  bit({
    id: 'verify-bit-doors',
    size: '1x1',
    domain: 'transit',
    surface: 'muted',
    name: 'Door self-test',
    props: {
      eyebrow: 'Set 12 doors',
      cols: 6,
      tests: [
        { code: 'D1L', name: 'Door 1 left', result: 'pass' },
        { code: 'D2L', name: 'Door 2 left', result: 'pass' },
        { code: 'D3L', name: 'Door 3 left', result: 'pass' },
        { code: 'D4L', name: 'Door 4 left', result: 'pass' },
        { code: 'D5L', name: 'Door 5 left', result: 'pass' },
        { code: 'D6L', name: 'Door 6 left', result: 'pass' },
        { code: 'D1R', name: 'Door 1 right', result: 'pass' },
        { code: 'D2R', name: 'Door 2 right', result: 'pass' },
        { code: 'D3R', name: 'Door 3 right', result: 'pass' },
        { code: 'D4R', name: 'Door 4 right, sensor slow 1.8 s', result: 'fail' },
        { code: 'D5R', name: 'Door 5 right', result: 'pass' },
        { code: 'D6R', name: 'Door 6 right', result: 'pass' },
      ],
    },
  }),
)

/* ── Order: neighbours differ in size, surface, domain and pattern ───────────────────── */

const order = [
  'verify-receipt-bifast',
  'verify-seal-commit',
  'verify-audit-limit',
  'verify-cert-calib',
  'verify-undo-archive',
  'verify-hash-firmware',
  'verify-seen-memo',
  'verify-trail-bifast',
  'verify-custody-specimen',
  'verify-kyc-account',
  'verify-bit-ci',
  'verify-diff-clause',
  'verify-undo-detour',
  'verify-policy-screening',
  'verify-twokey-keyload',
  'verify-receipt-qris',
  'verify-seal-rx',
  'verify-prov-cash',
  'verify-consent-camera',
  'verify-audit-role',
  'verify-versions-memo',
  'verify-hash-obc',
  'verify-check-loto',
  'verify-restore-emr',
  'verify-quote-gold',

  'verify-agent-scale',
  'verify-seen-evac',
  'verify-trail-swift',
  'verify-pod-pharmacy',
  'verify-cert-mtls',
  'verify-undo-price',
  'verify-recon-ballot',
  'verify-seal-contract',
  'verify-sessions-keys',
  'verify-custody-container',
  'verify-kyc-patient',
  'verify-bit-radar',
  'verify-diff-headline',
  'verify-receipt-topup',
  'verify-attest-mixer',
  'verify-check-preflight',
  'verify-policy-permit',
  'verify-consent-voice',
  'verify-hash-release',
  'verify-twokey-cosign',
  'verify-prov-load',
  'verify-quote-remit',
  'verify-seal-photo',
  'verify-sessions-sso',
  'verify-cert-api',

  'verify-recon-bank',
  'verify-bit-doors',
  'verify-audit-parcel',
  'verify-attest-image',
  'verify-kyc-merchant',
  'verify-quote-freight',
  'verify-seal-permit',
  'verify-undo-publish',
  'verify-policy-meds',
  'verify-versions-config',
  'verify-restore-nas',
  'verify-consent-records',
  'verify-twokey-wire',
  'verify-bit-relay',
  'verify-hash-seal',
  'verify-agent-bills',
  'verify-cert-str',
  'verify-custody-pouch',
  'verify-diff-listing',
  'verify-quote-fx',
  'verify-pod-fertiliser',
  'verify-seen-handover',
  'verify-undo-away',
  'verify-policy-iac',
  'verify-trail-payout',

  'verify-sessions-lock',
  'verify-versions-preset',
  'verify-twokey-migrate',
  'verify-receipt-tax',
  'verify-seen-orders',
  'verify-check-surgery',
  'verify-restore-drive',
  'verify-kyc-driver',
  'verify-audit-dose',
  'verify-agent-inbox',
  'verify-trail-cod',
  'verify-prov-yield',
  'verify-receipt-swift',
  'verify-custody-evidence',
  'verify-attest-flight',
  'verify-consent-openbank',
  'verify-restore-ledger',
  'verify-prov-turnout',
  'verify-recon-payout',
  'verify-sessions-bank',
  'verify-check-release',
  'verify-pod-parcel',
  'verify-diff-config',
  'verify-agent-prices',
  'verify-versions-article',
]

const byId = new Map(all.map((entry) => [entry.id, entry]))

export const entries: MoodEntry[] = order.map((id) => {
  const entry = byId.get(id)
  if (!entry) throw new Error(`verify: no variant called ${id}`)
  return entry
})

if (import.meta.env.DEV && (byId.size !== all.length || order.length !== all.length)) {
  console.warn(`[moodboard] verify declares ${all.length} variants but orders ${order.length}`)
}
