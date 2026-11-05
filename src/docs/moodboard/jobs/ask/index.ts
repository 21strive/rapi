import { archetype } from '../../kit'
import type { MoodEntry } from '../../types'
import SentenceFilter from './SentenceFilter.vue'
import { variantsA } from './variants-a'
import { variantsB } from './variants-b'
import { variantsC } from './variants-c'
import { variantsD } from './variants-d'
import { variantsE } from './variants-e'

const sentence = archetype(SentenceFilter, {
  name: 'Sentence filter',
  hint: 'Type a sentence and press Enter, or pick an example; remove a chip to widen',
  why: 'A sentence replaces the filter builder; the chips stay so a person can check what was understood.',
  tags: ['filter', 'search', 'sentence', 'conversation', 'chips'],
})

const lead: MoodEntry[] = [
  sentence({
    id: 'ask-sentence-invoices',
    size: '2x2',
    domain: 'commerce',
    props: {
      noun: 'invoices',
      total: 1204,
      initial: 'Unpaid invoices over 50 million from Surabaya',
      terms: [
        { match: 'unpaid|belum (di)?bayar|outstanding', chip: 'Status · unpaid', keep: 0.31 },
        { match: 'overdue|lewat|jatuh tempo', chip: 'Status · overdue', keep: 0.12 },
        { match: '(over|above|lebih dari|>)\\s*(rp\\s*)?50', chip: 'Amount > Rp 50.000.000', keep: 0.22 },
        { match: 'surabaya', chip: 'City · Surabaya', keep: 0.18 },
        { match: 'jakarta', chip: 'City · Jakarta', keep: 0.34 },
        { match: 'this month|bulan ini', chip: 'Issued · this month', keep: 0.4 },
      ],
      suggestions: ['Overdue invoices in Jakarta this month', 'Tagihan belum dibayar di Surabaya'],
    },
  }),
  sentence({
    id: 'ask-sentence-alerts',
    size: '3x2',
    domain: 'security',
    surface: 'dark',
    props: {
      noun: 'alerts',
      total: 8932,
      initial: 'Critical alerts on payment hosts since midnight',
      terms: [
        { match: 'critical|kritis|p1', chip: 'Severity · critical', keep: 0.04 },
        { match: 'high|tinggi|p2', chip: 'Severity · high', keep: 0.11 },
        { match: 'payment|pembayaran', chip: 'Hosts · payments-*', keep: 0.16 },
        { match: 'midnight|tengah malam|today|hari ini', chip: 'Since · 00:00 WIB', keep: 0.27 },
        { match: 'unassigned|belum ditangani', chip: 'Owner · nobody', keep: 0.38 },
        { match: 'login|sign.?in|masuk', chip: 'Type · sign-in', keep: 0.21 },
      ],
      suggestions: ['High alerts nobody has picked up', 'Login alerts today'],
    },
  }),
  sentence({
    id: 'ask-sentence-shipments',
    size: '2x2',
    domain: 'logistics',
    props: {
      noun: 'shipments',
      total: 3410,
      initial: 'Late shipments to Makassar by sea',
      terms: [
        { match: 'late|terlambat|delayed', chip: 'ETA · late', keep: 0.09 },
        { match: 'makassar', chip: 'To · Makassar', keep: 0.14 },
        { match: 'sea|laut|ship|kapal', chip: 'Mode · sea', keep: 0.46 },
        { match: 'air|udara|plane', chip: 'Mode · air', keep: 0.21 },
        { match: 'cold|dingin|frozen', chip: 'Cargo · cold chain', keep: 0.12 },
      ],
      suggestions: ['Cold chain by air this week', 'Pengiriman terlambat lewat laut'],
    },
  }),
]

/**
 * Board order, for rhythm: sizes, surfaces, domains and patterns alternate, so neighbours differ
 * and the dense grid packs small tiles between large ones.
 */
const order = [
  'ask-sentence-invoices',
  'ask-why-electricity',
  'ask-chat-reserve',
  'ask-steps-rollback',
  'ask-clarify-rina',
  'ask-voice-contact',
  'ask-ghost-note',
  'ask-figure-sweep',
  'ask-translate-label',
  'ask-draft-email',
  'ask-explain-load',
  'ask-draft-transfer',
  'ask-thread-incident',
  'ask-clarify-refill',
  'ask-rate-yield',
  'ask-fields-booking',
  'ask-cli-home',
  'ask-why-output',
  'ask-tool-refund',
  'ask-digest-shift',
  'ask-schedule-meeting',
  'ask-voice-spray',
  'ask-rate-track',
  'ask-form-shipment',
  'ask-memory-clinic',
  'ask-why-charge',
  'ask-cited-abort',
  'ask-replies-buyer',
  'ask-options-headline',
  'ask-clarify-lights',
  'ask-sentence-alerts',
  'ask-handoff-nurse',
  'ask-explain-refunds',
  'ask-ghost-commit',
  'ask-translate-buyer',
  'ask-rate-eta',
  'ask-tool-door',
  'ask-chat-fertiliser',
  'ask-steps-master',
  'ask-draft-notice',
  'ask-figure-plant',
  'ask-memory-currency',
  'ask-cli-kubectl',
  'ask-thread-ops',
  'ask-why-cloud',
  'ask-digest-fields',
  'ask-rule-transfer',
  'ask-translate-platform',
  'ask-schedule-dentist',
  'ask-form-fault',
  'ask-replies-manager',
  'ask-options-product',
  'ask-why-subscribers',
  'ask-fields-flight',
  'ask-tool-uplink',
  'ask-explain-air',
  'ask-memory-limit',
  'ask-voice-handover',
  'ask-cli-firewall',
  'ask-steps-recon',
  'ask-rate-summary',
  'ask-thread-supplier',
  'ask-replies-courier',
  'ask-chat-train',
  'ask-voice-meter',
  'ask-clarify-truck',
  'ask-ghost-transfer',
  'ask-why-commute',
  'ask-rule-irrigate',
  'ask-translate-notice',
  'ask-handoff-dispute',
  'ask-steps-rebook',
  'ask-cli-antenna',
  'ask-digest-store',
  'ask-tool-reminders',
  'ask-figure-beds',
  'ask-options-button',
  'ask-draft-status',
  'ask-handoff-permit',
  'ask-form-leave',
  'ask-handoff-parcel',
  'ask-tool-sql',
  'ask-rule-porch',
  'ask-cited-returns',
  'ask-steps-contain',
  'ask-schedule-studio',
  'ask-clarify-train',
  'ask-explain-readers',
  'ask-ghost-subject',
  'ask-digest-cash',
  'ask-cited-leave',
  'ask-thread-reports',
  'ask-rule-pager',
  'ask-replies-driver',
  'ask-fields-transfer',
  'ask-options-sms',
  'ask-schedule-service',
  'ask-fields-claim',
  'ask-memory-ac',
  'ask-sentence-shipments',
]

const byId = new Map([...lead, ...variantsA, ...variantsB, ...variantsC, ...variantsD, ...variantsE].map((e) => [e.id, e]))

export const entries: MoodEntry[] = order.map((id) => {
  const entry = byId.get(id)
  if (!entry) throw new Error(`ask: no entry ${id}`)
  return entry
})
