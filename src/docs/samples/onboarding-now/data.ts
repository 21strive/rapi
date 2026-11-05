/**
 * Sample 31, now · Workspace setup, said instead of filled in. The same new Simpul customer as the
 * Then screen (../onboarding): Sagara Freight, logistics, Surabaya, set up by Ayu Lestari on
 * Wed 18 Nov 2026 a little after 14:00 WIB. Plans, prices, regions and integrations are imported
 * from the Then screen's data, so the pair compares like for like.
 */
import { integrations } from '../onboarding/data'

export {
  ANNUAL_DISCOUNT,
  FIRST_INVOICE,
  TODAY,
  URL_HOST,
  chargeToday,
  contact,
  feePerMonth,
  integrations,
  owner,
  plans,
  regions,
  slugify,
} from '../onboarding/data'
export type { Cycle, Plan, PlanKey } from '../onboarding/data'

export const AGENT = 'Simpul'
/** The scene opens on the check, a minute after the sentence. */
export const START = '14:13'
export const ZONE = 'WIB'
/** An annual plan bought today renews on this day. */
export const RENEWS = '18 Nov 2027'
/** Invite links last seven days. */
export const INVITES_EXPIRE = 'Wed 25 Nov'
/** The address is held for a day while the draft waits. */
export const HELD_UNTIL = 'Thu 19 Nov, 14:13 WIB'

/** What the job costs a person, counted the same way on both screens. */
export interface Cost {
  value: number
  unit: string
}

/**
 * Then: the five steps, and every form control in them: company 5 (name, URL, industry, country,
 * region), team 8 (size, your role, three emails and three roles), integrations 9 switches, plan 2
 * (cycle, plan), review 1 (the terms box).
 */
export const THEN_COST: Cost[] = [
  { value: 5, unit: 'steps' },
  { value: 25, unit: 'fields' },
]

/** Now: the sentence, the one quick reply, the summary read once, the launch. */
export const NOW_COST: Cost[] = [
  { value: 1, unit: 'sentence' },
  { value: 1, unit: 'answer' },
  { value: 1, unit: 'check' },
  { value: 1, unit: 'confirm' },
]

export const costText = (list: Cost[]) => list.map((c) => `${c.value} ${c.unit}`).join(' · ')

/* ── The opening exchange ─────────────────────────────────────────────────────────── */

/** The one sentence: everything the five steps asked for, said the way a person says it. */
export const SAID =
  'Sagara Freight, logistics in Surabaya, about 30 people — invite Dimas Prasetyo as admin, Rina Wulandari and Hendrik Vos as developers; we use GitHub, Slack, error tracking and webhooks.'

/** The only thing the sentence could not tell: the person's own role. */
export const ASKED = "One thing I can't infer: what do you do on the team?"
export const ANSWERED = 'Engineering lead'
export const CHECKED = 'Here it is. Marked rows are my inference; say a change.'

/* ── People ───────────────────────────────────────────────────────────────────────── */

export type RoleKey = 'admin' | 'developer' | 'billing' | 'viewer'

export const roleNames: Record<RoleKey, string> = {
  admin: 'Admin',
  developer: 'Developer',
  billing: 'Billing',
  viewer: 'Viewer',
}

/** What a role can do, for the one question about a newcomer's role. */
export const roleWhat: Record<RoleKey, string> = {
  admin: 'can invite people and change billing',
  developer: 'can deploy and read logs',
  billing: 'sees invoices and can change the plan',
  viewer: 'can only read',
}

export interface Person {
  first: string
  last: string
  role: RoleKey
}

/** The three people in the sentence: the same invites as the Then screen. */
export const people: Person[] = [
  { first: 'Dimas', last: 'Prasetyo', role: 'admin' },
  { first: 'Rina', last: 'Wulandari', role: 'developer' },
  { first: 'Hendrik', last: 'Vos', role: 'developer' },
]

/** Not in the sentence: offered as a suggestion, so the reader meets a question with quick replies. */
export const newcomer = { first: 'Bayu', last: 'Santoso' }

/** The person's own role, as the Then screen lists them. */
export const ownRoles = [
  'Engineering lead',
  'CTO or founder',
  'Platform engineer',
  'Developer',
  'Product manager',
  'Operations',
  'Finance or billing',
]

/* ── Integrations ─────────────────────────────────────────────────────────────────── */

export type IntegrationKey = (typeof integrations)[number]['key']

/** The four the sentence named, as the Then screen has them on. */
export const SAID_ON = ['git', 'chat', 'errors', 'webhooks']

/** The tools the sentence named by product, and the two that need the person's OK at the provider. */
export const providers: Record<string, string> = { git: 'GitHub', chat: 'Slack' }
export const NEEDS_ACCESS = ['git', 'chat'] as const
export type AccessKey = (typeof NEEDS_ACCESS)[number]

/** What each provider connection does once allowed. */
export const accessWhat: Record<AccessKey, { line: string; detail: string }> = {
  git: { line: 'Deploys every push to main.', detail: 'sagara-freight · pushes to main deploy' },
  chat: { line: 'Posts deploys and incidents to #ops-deploys.', detail: '#ops-deploys · deploys and incidents' },
}
