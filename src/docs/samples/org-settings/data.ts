/**
 * Sample 29 · Organization settings. Simpul is 21 Strive's developer platform; Kopra Labs is the
 * customer organization. Everything on the screen reads from here, so counts line up.
 * "Now" is Wed 18 Nov 2026, 14:20 WIB (07:20 UTC).
 */
import type { RadioOption, SelectOption, SliderMark, SpecItem, TimelineItem } from '@/design-system'

export type Role = 'owner' | 'admin' | 'developer' | 'billing' | 'viewer'
export type MemberStatus = 'active' | 'invited' | 'suspended'
export type Channel = 'email' | 'inapp' | 'webhook'
export type SectionId = 'general' | 'members' | 'security' | 'notifications' | 'danger'

export interface Member {
  id: string
  name: string
  email: string
  role: Role
  status: MemberStatus
  /** null while the invite is pending. */
  twoFactor: boolean | null
  /** Already formatted: "14:18 WIB", "17 Nov 2026", "Invited 16 Nov". */
  lastActive: string
}

export const org = {
  name: 'Kopra Labs',
  legalName: 'PT Kopra Labs Indonesia',
  slug: 'kopra-labs',
  id: 'org_7f3k2q9m',
  domain: 'kopralabs.io',
  description:
    'Freight visibility for island logistics. We run the tracking API and carrier dashboard used by 140 shipping lines across Indonesia and Singapore.',
  timezone: 'Asia/Jakarta',
  locale: 'en-GB',
  region: 'jkt-1',
  plan: 'Scale',
  planPrice: 'USD 400 / month',
  renews: '1 Dec 2026',
  seats: 25,
  created: '14 Mar 2024',
  owner: 'Raka Wibisono',
}

/** Minutes since midnight UTC for "now" (07:20 UTC = 14:20 WIB). */
export const NOW_UTC_MINUTES = 7 * 60 + 20

/** What deleting the organization takes with it. */
export const footprint = {
  projects: 12,
  deployments: 1284,
  domains: 9,
  apiKeys: 23,
  storage: '612 GB',
}

export const roleOptions: SelectOption[] = [
  { label: 'Admin', value: 'admin' },
  { label: 'Developer', value: 'developer' },
  { label: 'Billing', value: 'billing' },
  { label: 'Viewer', value: 'viewer' },
]

export const ownerRoleOptions: SelectOption[] = [{ label: 'Owner', value: 'owner' }]

export const roleLabel: Record<Role, string> = {
  owner: 'Owner',
  admin: 'Admin',
  developer: 'Developer',
  billing: 'Billing',
  viewer: 'Viewer',
}

export const members: Member[] = [
  { id: 'm01', name: 'Raka Wibisono', email: 'raka.wibisono@kopralabs.io', role: 'owner', status: 'active', twoFactor: true, lastActive: '14:18 WIB' },
  { id: 'm02', name: 'Sekar Ayuningtyas', email: 'sekar@kopralabs.io', role: 'admin', status: 'active', twoFactor: true, lastActive: '13:52 WIB' },
  { id: 'm03', name: 'Daniel Okafor', email: 'daniel.okafor@kopralabs.io', role: 'admin', status: 'active', twoFactor: true, lastActive: '11:04 WIB' },
  { id: 'm04', name: 'Putri Maharani', email: 'putri.maharani@kopralabs.io', role: 'developer', status: 'active', twoFactor: true, lastActive: '14:02 WIB' },
  { id: 'm05', name: 'Hendra Gunawan', email: 'hendra@kopralabs.io', role: 'developer', status: 'active', twoFactor: false, lastActive: '17 Nov 2026' },
  { id: 'm06', name: 'Mei Ling Tan', email: 'meiling.tan@kopralabs.io', role: 'developer', status: 'active', twoFactor: true, lastActive: '16 Nov 2026' },
  { id: 'm07', name: 'Arif Rahman', email: 'arif.rahman@kopralabs.io', role: 'developer', status: 'active', twoFactor: false, lastActive: '09:41 WIB' },
  { id: 'm08', name: 'Lukas Brandt', email: 'lukas.brandt@kopralabs.io', role: 'developer', status: 'active', twoFactor: true, lastActive: '12 Nov 2026' },
  { id: 'm09', name: 'Ketut Ardana', email: 'ketut.ardana@kopralabs.io', role: 'developer', status: 'active', twoFactor: true, lastActive: '15 Nov 2026' },
  { id: 'm10', name: 'Nadia Kusuma', email: 'nadia.kusuma@kopralabs.io', role: 'billing', status: 'active', twoFactor: true, lastActive: '3 Nov 2026' },
  { id: 'm11', name: 'Yusuf Hakim', email: 'yusuf.hakim@kopralabs.io', role: 'viewer', status: 'active', twoFactor: false, lastActive: '28 Oct 2026' },
  { id: 'm12', name: 'Clara Mendes', email: 'clara.mendes@kopralabs.io', role: 'developer', status: 'invited', twoFactor: null, lastActive: 'Invited 16 Nov' },
  { id: 'm13', name: 'Tomás Rivera', email: 'tomas.rivera@kopralabs.io', role: 'viewer', status: 'invited', twoFactor: null, lastActive: 'Invited 17 Nov' },
  { id: 'm14', name: 'Bima Saputra', email: 'bima.saputra@kopralabs.io', role: 'developer', status: 'suspended', twoFactor: false, lastActive: '2 Sep 2026' },
]

export interface TimezoneOption extends SelectOption {
  value: string
  abbr: string
  /** Offset from UTC in minutes on 18 Nov 2026. */
  offset: number
}

export const timezones: TimezoneOption[] = [
  { label: 'Asia/Jakarta · WIB · UTC+07:00', value: 'Asia/Jakarta', abbr: 'WIB', offset: 420 },
  { label: 'Asia/Makassar · WITA · UTC+08:00', value: 'Asia/Makassar', abbr: 'WITA', offset: 480 },
  { label: 'Asia/Jayapura · WIT · UTC+09:00', value: 'Asia/Jayapura', abbr: 'WIT', offset: 540 },
  { label: 'Asia/Singapore · SGT · UTC+08:00', value: 'Asia/Singapore', abbr: 'SGT', offset: 480 },
  { label: 'Asia/Kuala Lumpur · MYT · UTC+08:00', value: 'Asia/Kuala_Lumpur', abbr: 'MYT', offset: 480 },
  { label: 'UTC · UTC+00:00', value: 'UTC', abbr: 'UTC', offset: 0 },
  { label: 'Europe/Amsterdam · CET · UTC+01:00', value: 'Europe/Amsterdam', abbr: 'CET', offset: 60 },
  { label: 'America/Los Angeles · PST · UTC−08:00', value: 'America/Los_Angeles', abbr: 'PST', offset: -480 },
]

export const locales: SelectOption[] = [
  { label: 'English (UK)', value: 'en-GB' },
  { label: 'English (US)', value: 'en-US' },
  { label: 'Bahasa Indonesia', value: 'id-ID' },
  { label: 'Nederlands', value: 'nl-NL' },
]

export const regions: SelectOption[] = [
  { label: 'Jakarta · JKT-1', value: 'jkt-1' },
  { label: 'Singapore · SIN-1', value: 'sin-1' },
  { label: 'Frankfurt · FRA-1', value: 'fra-1' },
  { label: 'Virginia · IAD-1', value: 'iad-1' },
]

export const sessionOptions: RadioOption[] = [
  { label: '8 hours', value: '8h', description: 'Sign in every working day' },
  { label: '24 hours', value: '24h', description: 'Default for new organizations' },
  { label: '7 days', value: '7d', description: 'Fewer prompts on trusted laptops' },
  { label: '30 days', value: '30d', description: 'Avoid on shared devices' },
]

export const sessionLabel: Record<string, string> = { '8h': '8 hours', '24h': '24 hours', '7d': '7 days', '30d': '30 days' }

export const passwordMarks: SliderMark[] = [8, 12, 16, 24, 32].map((value) => ({ value, label: String(value) }))

/** The identity provider connected on 12 Nov. No vendor: Kopra Labs runs its own directory. */
export const identityProvider: SpecItem[] = [
  { label: 'Provider', value: 'Kopra Labs Directory · SAML 2.0' },
  { label: 'Entity ID', value: 'https://idp.kopralabs.io/saml/metadata', mono: true },
  { label: 'Sign-in URL', value: 'https://idp.kopralabs.io/sso/simpul', mono: true },
  { label: 'Verified domain', value: 'kopralabs.io', mono: true, tone: 'success', hint: 'DNS TXT record checked 12 Nov 2026' },
  { label: 'Certificate', value: 'SHA-256 · expires 14 Mar 2027', mono: true },
  { label: 'Last test sign-in', value: '17 Nov 2026 16:42 WIB', hint: 'Passed · Sekar Ayuningtyas' },
]

export interface NotificationEvent {
  id: string
  label: string
  description: string
  /** Channels that cannot be turned off. */
  locked?: Channel[]
}

export const notificationEvents: NotificationEvent[] = [
  { id: 'deploy-failed', label: 'Deployment failed', description: 'A production build or start-up fails' },
  { id: 'usage-80', label: 'Usage over 80% of a quota', description: 'Requests, storage, seats or build minutes' },
  { id: 'invoice', label: 'Invoice issued', description: 'Monthly invoice and payment receipts' },
  { id: 'member-joined', label: 'New member joined', description: 'An invitation is accepted' },
  { id: 'security', label: 'Security alert', description: 'New sign-in location, key leaked, policy change', locked: ['email'] },
  { id: 'weekly', label: 'Weekly usage report', description: 'Sent on Mondays at 09:00 in the org timezone' },
]

export const channels: { key: Channel; label: string }[] = [
  { key: 'email', label: 'Email' },
  { key: 'inapp', label: 'In-app' },
  { key: 'webhook', label: 'Webhook' },
]

export const notificationDefaults: Record<string, Channel[]> = {
  'deploy-failed': ['email', 'inapp', 'webhook'],
  'usage-80': ['email', 'inapp'],
  invoice: ['email'],
  'member-joined': ['inapp'],
  security: ['email', 'inapp', 'webhook'],
  weekly: ['email'],
}

export const digestOptions: SelectOption[] = [
  { label: 'Daily at 09:00', value: 'daily' },
  { label: 'Weekly, Monday 09:00', value: 'weekly' },
  { label: 'Off', value: 'off' },
]

/** The audit trail behind the "Recent changes" rail, newest first. */
export const auditTrail: TimelineItem[] = [
  { id: 'a6', time: '17 Nov 16:42', title: 'SAML test sign-in passed', meta: 'Sekar A.', tone: 'success' },
  { id: 'a5', time: '17 Nov 09:15', title: 'Tomás Rivera invited as Viewer', meta: 'Daniel O.' },
  { id: 'a4', time: '16 Nov 15:30', title: 'Clara Mendes invited as Developer', meta: 'Daniel O.' },
  { id: 'a3', time: '12 Nov 10:05', title: 'Two-factor required for all members', meta: 'Raka W.', tone: 'brand' },
  { id: 'a2', time: '12 Nov 10:02', title: 'Identity provider connected', meta: 'Sekar A.' },
  { id: 'a1', time: '2 Sep 11:20', title: 'Bima Saputra suspended', meta: 'Sekar A.', tone: 'danger' },
]
