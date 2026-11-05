/**
 * 09 Enter: the few fields worth a field. 25 patterns, 100 tiles, ordered so that neighbours differ
 * in size, surface and domain. The variants live in tiles-a.ts and tiles-b.ts; this file only sets
 * the order.
 */
import type { MoodEntry } from '../../types'
import './enter.css'
import { tilesA } from './tiles-a'
import { tilesB } from './tiles-b'

const ORDER = [
  'amount-transfer', 'keys-go', 'phone-courier', 'code-token', 'colour-calendar', 'date-clinic', 'otp-transfer', 'unit-wind',
  'qty-tickets', 'sign-pod', 'auto-airport', 'rate-take', 'tags-labels', 'keypad-fuel', 'email-brief', 'search-shipments',
  'time-dose', 'lookup-account', 'scan-qris', 'colour-project', 'range-quiet', 'pin-dropoff', 'unit-bpm', 'pass-vault',
  'date-stay', 'qty-dispense', 'otp-pair', 'note-sms', 'scan-asset', 'email-invoice', 'seat-plane', 'keys-pad',
  'amount-topup', 'code-alarm', 'tags-allergy', 'rate-service', 'note-commit', 'auto-district', 'time-irrigate', 'rate-pain',
  'sign-permit', 'colour-route', 'phone-receipt', 'search-logs', 'qty-pick', 'pass-export', 'auto-station', 'date-spray',
  'unit-temp', 'email-status', 'keypad-pos', 'otp-handover', 'drop-statement', 'pin-flood', 'keys-ptt', 'tags-samples',
  'seat-cinema', 'colour-avatar', 'lookup-meter', 'sign-consent', 'unit-mils', 'time-depart', 'code-locker', 'search-docs',
  'qty-seed', 'drop-firmware', 'phone-emergency', 'drop-invoice', 'seat-train', 'keys-mute', 'scan-parcel', 'amount-invoice',
  'pin-plot', 'otp-email', 'auto-drug', 'rate-delivery', 'email-invite', 'range-maint', 'unit-fx', 'search-patients',
  'time-pickup', 'pass-wifi', 'phone-flood', 'scan-wristband', 'tags-recipients', 'unit-weight', 'note-berita', 'code-gate',
  'pin-lz', 'amount-price', 'lookup-container', 'note-handover', 'keypad-toll', 'seat-desk', 'drop-stems', 'sign-handover',
  'range-shift', 'lookup-plate', 'date-value', 'otp-device',
]

const byId = new Map([...tilesA, ...tilesB].map((e) => [e.id, e]))

export const entries: MoodEntry[] = ORDER.map((key) => {
  const entry = byId.get(`enter-${key}`)
  if (!entry) throw new Error(`enter: no tile enter-${key}`)
  return entry
})
