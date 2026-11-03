/**
 * Sample 31 · Workspace setup. A new Simpul customer, Sagara Freight (logistics, Surabaya),
 * set up by Ayu Lestari on Wed 18 Nov 2026, 14:20 WIB. Every figure on the screen comes from here.
 */
import type { Component } from 'vue'
import {
  Activity,
  BellRing,
  Bug,
  Database,
  GitBranch,
  KeyRound,
  ListChecks,
  MessageSquare,
  Webhook,
} from 'lucide-vue-next'
import type { RadioOption, SelectOption } from '@/design-system'

export const TODAY = 'Wed 18 Nov 2026'
export const TODAY_SHORT = '18 Nov 2026'
export const NOW = '14:20 WIB'
export const URL_HOST = 'simpul.app/'

export const owner = {
  name: 'Ayu Lestari',
  email: 'ayu.lestari@sagarafreight.co.id',
  domain: 'sagarafreight.co.id',
}

export const contact = {
  name: 'Galih Saputra',
  role: 'Solutions engineer, Simpul',
  reply: 'Replies in about 2 h · 09:00–18:00 WIB',
  slot: 'Thu 19 Nov, 10:00 WIB',
}

export type StepKey = 'company' | 'team' | 'integrations' | 'plan' | 'review'

export interface SetupStep {
  key: StepKey
  label: string
  /** Shown under the label in the vertical steps. */
  description: string
  /** Card title and the sentence under it. */
  title: string
  lead: string
}

export const steps: SetupStep[] = [
  {
    key: 'company',
    label: 'Company',
    description: 'Name, address and data region',
    title: 'Company',
    lead: 'How the workspace is named, where it lives and which region holds its data.',
  },
  {
    key: 'team',
    label: 'Team',
    description: 'Team size, your role, invites',
    title: 'Team',
    lead: 'Who will build and run services here, and what you do on the team.',
  },
  {
    key: 'integrations',
    label: 'Integrations',
    description: 'Connect the tools you use',
    title: 'Integrations',
    lead: 'Turn on what you use today. Each one asks for its credentials after setup.',
  },
  {
    key: 'plan',
    label: 'Plan',
    description: 'Platform fee and billing cycle',
    title: 'Plan',
    lead: 'The platform fee covers the quotas below. Usage above them is metered monthly.',
  },
  {
    key: 'review',
    label: 'Review',
    description: 'Check everything, then create',
    title: 'Review and create',
    lead: 'Check the details. Name, plan and integrations can change later; the data region cannot.',
  },
]

export const industries: SelectOption[] = [
  { label: 'Logistics & transport', value: 'logistics' },
  { label: 'Financial services', value: 'finance' },
  { label: 'Retail & e-commerce', value: 'retail' },
  { label: 'Healthcare', value: 'health' },
  { label: 'Manufacturing', value: 'manufacturing' },
  { label: 'Media & entertainment', value: 'media' },
  { label: 'Public sector', value: 'public' },
  { label: 'Education', value: 'education' },
  { label: 'Other', value: 'other' },
]

export const countries: SelectOption[] = [
  { label: 'Indonesia', value: 'ID' },
  { label: 'Singapore', value: 'SG' },
  { label: 'Malaysia', value: 'MY' },
  { label: 'Philippines', value: 'PH' },
  { label: 'Vietnam', value: 'VN' },
  { label: 'Thailand', value: 'TH' },
  { label: 'Australia', value: 'AU' },
  { label: 'Netherlands', value: 'NL' },
  { label: 'Germany', value: 'DE' },
  { label: 'United States', value: 'US' },
]

export const regions: RadioOption[] = [
  { label: 'Jakarta · JKT-1', value: 'jkt-1', description: 'About 9 ms from Surabaya. Data stays in Indonesia.' },
  { label: 'Singapore · SIN-1', value: 'sin-1', description: 'About 24 ms from Surabaya. Three availability zones.' },
  { label: 'Frankfurt · FRA-1', value: 'fra-1', description: 'About 210 ms from Surabaya. For EU data residency.' },
]

export const teamSizes: RadioOption[] = [
  { label: '1–10', value: '1-10', description: 'One team' },
  { label: '11–50', value: '11-50', description: 'A few product teams' },
  { label: '51–200', value: '51-200', description: 'Shared platform' },
  { label: '201+', value: '201+', description: 'Platform group, audits' },
]

export const ownRoles: SelectOption[] = [
  { label: 'Engineering lead', value: 'eng-lead' },
  { label: 'CTO or founder', value: 'cto' },
  { label: 'Platform engineer', value: 'platform' },
  { label: 'Developer', value: 'developer' },
  { label: 'Product manager', value: 'product' },
  { label: 'Operations', value: 'ops' },
  { label: 'Finance or billing', value: 'finance' },
]

export const inviteRoles: SelectOption[] = [
  { label: 'Admin', value: 'admin' },
  { label: 'Developer', value: 'developer' },
  { label: 'Billing', value: 'billing' },
  { label: 'Viewer', value: 'viewer' },
]

export const initialInvites = [
  { email: 'dimas.prasetyo@sagarafreight.co.id', role: 'admin' },
  { email: 'rina.wulandari@sagarafreight.co.id', role: 'developer' },
  { email: 'hendrik.vos@sagarafreight.co.id', role: 'developer' },
]

export interface Integration {
  key: string
  name: string
  description: string
  icon: Component
  /** Shown as a mono line when the tile is on. */
  detail: string
  /** Only on this plan and up. */
  requires?: 'business'
}

export const integrations: Integration[] = [
  { key: 'git', name: 'Git repository', description: 'Build and deploy on every push to a branch.', icon: GitBranch, detail: 'Deploys from main' },
  { key: 'chat', name: 'Chat alerts', description: 'Post deploys and incidents to a team channel.', icon: MessageSquare, detail: '#ops-deploys' },
  { key: 'issues', name: 'Issue tracker', description: 'Link each deploy to the issues it closes.', icon: ListChecks, detail: 'Links by issue key' },
  { key: 'errors', name: 'Error tracking', description: 'Group runtime errors by release and region.', icon: Bug, detail: 'Grouped by release' },
  { key: 'storage', name: 'Object storage', description: 'Mount a bucket for build artefacts and logs.', icon: Database, detail: 'Artefacts kept 30 days' },
  {
    key: 'saml',
    name: 'Identity provider (SAML)',
    description: 'Single sign-on and provisioning for members.',
    icon: KeyRound,
    detail: 'SAML 2.0 · SCIM',
    requires: 'business',
  },
  { key: 'webhooks', name: 'Webhooks', description: 'Signed events to your own endpoints.', icon: Webhook, detail: 'HMAC SHA-256' },
  { key: 'status', name: 'Status page', description: 'Publish uptime and incidents for customers.', icon: Activity, detail: 'status.sagarafreight.co.id' },
  { key: 'paging', name: 'On-call paging', description: 'Page the engineer on call when a check fails.', icon: BellRing, detail: 'Escalates after 5 min' },
]

export const initialIntegrations: Record<string, boolean> = {
  git: true,
  chat: true,
  issues: false,
  errors: true,
  storage: false,
  saml: false,
  webhooks: true,
  status: false,
  paging: false,
}

export type PlanKey = 'team' | 'scale' | 'business'
export type Cycle = 'monthly' | 'annual'

export interface Plan {
  key: PlanKey
  name: string
  /** Platform fee per month, billed monthly, USD. */
  monthly: number
  fit: string
  requests: string
  storage: string
  seats: number
  buildMinutes: number
  logs: string
  sso: string
  support: string
}

export const plans: Plan[] = [
  {
    key: 'team',
    name: 'Team',
    monthly: 120,
    fit: 'Up to 10 people',
    requests: '10M',
    storage: '250 GB',
    seats: 10,
    buildMinutes: 2000,
    logs: '7 days',
    sso: 'Not included',
    support: 'Email, next business day',
  },
  {
    key: 'scale',
    name: 'Scale',
    monthly: 400,
    fit: 'Up to 25 people',
    requests: '50M',
    storage: '1 TB',
    seats: 25,
    buildMinutes: 6000,
    logs: '30 days',
    sso: 'Not included',
    support: '8 h response',
  },
  {
    key: 'business',
    name: 'Business',
    monthly: 1200,
    fit: 'Up to 75 people',
    requests: '200M',
    storage: '5 TB',
    seats: 75,
    buildMinutes: 25000,
    logs: '90 days',
    sso: 'SAML and SCIM',
    support: '2 h response, 24/7',
  },
]

export const ANNUAL_DISCOUNT = 0.15
/** 18–30 Nov, the rest of the first monthly cycle. */
export const PRORATED_DAYS = 13
export const CYCLE_DAYS = 30
export const FIRST_INVOICE = '1 Dec 2026'

/** Platform fee per month on a cycle. */
export const feePerMonth = (plan: Plan, cycle: Cycle) =>
  cycle === 'annual' ? Math.round(plan.monthly * (1 - ANNUAL_DISCOUNT)) : plan.monthly

/** What the first charge is: the prorated rest of November, or a year up front. */
export const chargeToday = (plan: Plan, cycle: Cycle) =>
  cycle === 'annual' ? feePerMonth(plan, cycle) * 12 : (plan.monthly * PRORATED_DAYS) / CYCLE_DAYS

/** "Sagara Freight" → "sagara-freight". */
export function slugify(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '')
}

export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,38})[a-z0-9]$/
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
