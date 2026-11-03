/*
 * Sample 08 · Access review. Selaras Bank's Q4 2026 user access certification, as seen by the
 * GRC owner on Tue 03 Nov 2026 at 05:30 UTC (12:30 WIB). Everything here is invented.
 */

/** The scenario moment. Live durations tick from here. */
export const SCENARIO_NOW = Date.UTC(2026, 10, 3, 5, 30, 0)

/* ── Certification campaign ─────────────────────────────────────────────────────────── */

export const campaign = {
  id: 'UAC-2026-Q4',
  name: 'Certification',
  started: '13 Oct 2026',
  scopeClosed: '20 Oct 2026',
  due: '28 Nov 2026',
  daysLeft: 25,
  systems: 9,
  reviewers: 14,
  total: 2140,
  approved: 1102,
  revoked: 182,
}

/** Sessions opened through jump-01 since 00:00 UTC, live ones included. */
export const sessionsToday = 23

export const steps = [
  { label: 'Scope', description: 'Systems and entitlements frozen on 20 Oct 2026' },
  { label: 'Review', description: 'Managers and system owners decide, due 28 Nov 2026' },
  { label: 'Remediate', description: 'Owners remove revoked access within 10 working days' },
  { label: 'Sign-off', description: 'CISO and external auditor sign the evidence pack' },
]

export const reviewers = [
  'Nadia Rahman',
  'Arjun Mehta',
  'Fajar Nugroho',
  'Laras Wulandari',
  'Kevin Halim',
  'Tomás Ferreira',
  'Grace Liu',
  'Yusuf Hakim',
  'Rizky Pratama',
  'Wahyu Setiawan',
  'Siti Rahayu',
  'Marcus Lee',
  'Dewi Anggraini',
  'Hana Kusuma',
]

/* ── Role × permission matrix ───────────────────────────────────────────────────────── */

export interface Permission {
  id: string
  group: string
  label: string
  description: string
}

export const permissionGroups = ['Payments', 'Customer data', 'Production', 'Security']

export const permissions: Permission[] = [
  { id: 'pay.initiate', group: 'Payments', label: 'Initiate', description: 'Create payment orders' },
  { id: 'pay.approve', group: 'Payments', label: 'Approve', description: 'Approve payment orders as checker' },
  { id: 'pay.release', group: 'Payments', label: 'High value', description: 'Release payments of Rp 1 bn and above' },
  { id: 'pii.view', group: 'Customer data', label: 'View PII', description: 'See customer names, IDs and contact details' },
  { id: 'pii.export', group: 'Customer data', label: 'Export PII', description: 'Download customer records in bulk' },
  { id: 'kyc.edit', group: 'Customer data', label: 'Edit KYC', description: 'Change identity and KYC records' },
  { id: 'prod.read', group: 'Production', label: 'Read', description: 'Read-only access to production systems' },
  { id: 'prod.write', group: 'Production', label: 'Write', description: 'Change production data and configuration' },
  { id: 'prod.breakglass', group: 'Production', label: 'Break-glass', description: 'Emergency root access, recorded' },
  { id: 'sec.keys', group: 'Security', label: 'KMS keys', description: 'Create, rotate and use encryption keys' },
  { id: 'sec.iam', group: 'Security', label: 'Manage IAM', description: 'Grant and remove access for others' },
  { id: 'sec.audit', group: 'Security', label: 'Audit log', description: 'Read the audit trail' },
]

export interface Role {
  id: string
  name: string
  members: number
  owner: string
  grants: string[]
}

export const roles: Role[] = [
  { id: 'payments-operator', name: 'Payments operator', members: 18, owner: 'Fajar Nugroho', grants: ['pay.initiate', 'pii.view'] },
  { id: 'payments-approver', name: 'Payments approver', members: 6, owner: 'Fajar Nugroho', grants: ['pay.approve', 'pay.release', 'pii.view'] },
  { id: 'treasury-dealer', name: 'Treasury dealer', members: 4, owner: 'Wahyu Setiawan', grants: ['pay.initiate', 'pay.approve', 'pay.release'] },
  { id: 'support-l1', name: 'Customer support L1', members: 64, owner: 'Laras Wulandari', grants: ['pii.view'] },
  { id: 'support-l2', name: 'Customer support L2', members: 22, owner: 'Laras Wulandari', grants: ['pii.view', 'kyc.edit'] },
  { id: 'fraud-analyst', name: 'Fraud analyst', members: 9, owner: 'Yusuf Hakim', grants: ['pii.view', 'pii.export', 'sec.audit'] },
  { id: 'data-analyst', name: 'Data analyst', members: 14, owner: 'Grace Liu', grants: ['pii.view', 'prod.read'] },
  { id: 'sre', name: 'Site reliability', members: 11, owner: 'Kevin Halim', grants: ['prod.read', 'prod.write', 'prod.breakglass', 'sec.audit'] },
  { id: 'platform-engineer', name: 'Platform engineer', members: 16, owner: 'Tomás Ferreira', grants: ['prod.read', 'prod.write', 'prod.breakglass', 'sec.keys', 'sec.iam'] },
  { id: 'security-analyst', name: 'Security analyst', members: 8, owner: 'Rizky Pratama', grants: ['prod.read', 'pii.view', 'sec.audit'] },
  { id: 'internal-auditor', name: 'Internal auditor', members: 3, owner: 'Nadia Rahman', grants: ['prod.read', 'sec.audit'] },
]

/** Separation-of-duties rules: nobody should hold both permissions of a pair. */
export interface SodRule {
  id: string
  a: string
  b: string
  label: string
  /** Fits the matrix column. */
  short: string
}

export const sodRules: SodRule[] = [
  { id: 'SOD-01', a: 'pay.initiate', b: 'pay.approve', label: 'Initiate and approve payments', short: 'Initiate + approve' },
  { id: 'SOD-02', a: 'kyc.edit', b: 'pay.approve', label: 'Edit KYC and approve payments', short: 'KYC edit + approve' },
  { id: 'SOD-03', a: 'sec.iam', b: 'prod.breakglass', label: 'Manage IAM and use break-glass', short: 'IAM + break-glass' },
]

/* ── Reviewer queue ─────────────────────────────────────────────────────────────────── */

export type Risk = 'high' | 'medium' | 'low'

export interface ReviewItem {
  id: string
  user: string
  /** Shown under the name: "Payments · Jakarta" or "Service account". */
  context: string
  entitlement: string
  system: string
  lastUsed: string
  risk: Risk
  /** Why it is in front of the reviewer. */
  reason: string
}

export const reviewQueue: ReviewItem[] = [
  {
    id: 'RV-20418',
    user: 'Hendra Wijaya',
    context: 'Payments · Jakarta',
    entitlement: 'Payments approver',
    system: 'Payments hub',
    lastUsed: '94 days ago',
    risk: 'high',
    reason: 'Dormant privileged role',
  },
  {
    id: 'RV-20431',
    user: 'Andi Kurniawan',
    context: 'Platform · Jakarta',
    entitlement: 'Break-glass',
    system: 'k8s-prod',
    lastUsed: 'Never',
    risk: 'high',
    reason: 'Granted 03 Aug 2026',
  },
  {
    id: 'RV-20447',
    user: 'terraform-ci',
    context: 'Service account',
    entitlement: 'Manage IAM',
    system: 'Identity provider',
    lastUsed: '3 hours ago',
    risk: 'high',
    reason: 'Machine identity, IAM rights',
  },
  {
    id: 'RV-20452',
    user: 'Putri Maharani',
    context: 'Customer support · Jakarta',
    entitlement: 'Export PII',
    system: 'Customer records',
    lastUsed: '12 days ago',
    risk: 'high',
    reason: 'Outside role baseline',
  },
  {
    id: 'RV-20466',
    user: 'Rahul Iyer',
    context: 'Contractor · Singapore',
    entitlement: 'Platform engineer',
    system: 'Cloud console, prod',
    lastUsed: '2 days ago',
    risk: 'medium',
    reason: 'Contract ends 30 Nov 2026',
  },
  {
    id: 'RV-20470',
    user: 'svc-ledger-sync',
    context: 'Service account',
    entitlement: 'Prod write',
    system: 'pg-ledger-prod-01',
    lastUsed: '2 hours ago',
    risk: 'medium',
    reason: 'Writes to the ledger',
  },
  {
    id: 'RV-20483',
    user: 'Clara Nguyen',
    context: 'Customer support · Singapore',
    entitlement: 'Customer support L2',
    system: 'Helpdesk',
    lastUsed: '41 days ago',
    risk: 'medium',
    reason: 'Moved team on 14 Sep 2026',
  },
  {
    id: 'RV-20495',
    user: 'Grace Liu',
    context: 'Data · Jakarta',
    entitlement: 'Data analyst',
    system: 'Warehouse',
    lastUsed: 'Today',
    risk: 'low',
    reason: 'Routine recertification',
  },
  {
    id: 'RV-20502',
    user: 'Wahyu Setiawan',
    context: 'Treasury · Jakarta',
    entitlement: 'Treasury dealer',
    system: 'Treasury desk',
    lastUsed: 'Yesterday',
    risk: 'low',
    reason: 'Routine recertification',
  },
]

/* ── Privileged sessions ────────────────────────────────────────────────────────────── */

export type SessionAccess = 'read-write' | 'break-glass' | 'read-only' | 'admin'

export interface PrivilegedSession {
  id: string
  user: string
  target: string
  tool: string
  access: SessionAccess
  ticket: string
  /** Start time, ms since epoch. */
  started: number
}

const at = (h: number, m: number, s: number) => Date.UTC(2026, 10, 3, h, m, s)

export const sessions: PrivilegedSession[] = [
  { id: 'PS-7731', user: 'Emma Schmidt', target: 'evidence-vault', tool: 'web', access: 'read-only', ticket: 'AUD-Q4-031', started: at(4, 17, 20) },
  { id: 'PS-7736', user: 'Kevin Halim', target: 'pg-ledger-prod-01', tool: 'psql', access: 'read-write', ticket: 'CHG-4471', started: at(4, 47, 50) },
  { id: 'PS-7740', user: 'Bayu Saputra', target: 'vpn-gw-02', tool: 'ssh', access: 'admin', ticket: 'INC-2093', started: at(5, 2, 33) },
  { id: 'PS-7742', user: 'Daniel Okafor', target: 'mail-relay-01', tool: 'ssh', access: 'read-write', ticket: 'INC-2094', started: at(5, 12, 9) },
  { id: 'PS-7744', user: 'Tomás Ferreira', target: 'k8s-prod-node-14', tool: 'kubectl', access: 'read-write', ticket: 'CHG-4475', started: at(5, 18, 12) },
  { id: 'PS-7745', user: 'Mei Lin Tan', target: 'siem-prod', tool: 'web', access: 'admin', ticket: 'INC-2093', started: at(5, 21, 40) },
  { id: 'PS-7747', user: 'Fajar Nugroho', target: 'payments-api-7f9c', tool: 'ssh', access: 'break-glass', ticket: 'BG-0117', started: at(5, 24, 5) },
]

/* ── MFA coverage ───────────────────────────────────────────────────────────────────── */

export interface MfaDepartment {
  name: string
  people: number
  enrolled: number
}

/** 536 people, 507 enrolled: 94.6% overall against a 95% target. */
export const mfa: MfaDepartment[] = [
  { name: 'Security', people: 22, enrolled: 22 },
  { name: 'Executive office', people: 9, enrolled: 9 },
  { name: 'Engineering', people: 148, enrolled: 147 },
  { name: 'Payments operations', people: 61, enrolled: 60 },
  { name: 'Risk & compliance', people: 29, enrolled: 28 },
  { name: 'Finance', people: 37, enrolled: 35 },
  { name: 'Customer support', people: 184, enrolled: 168 },
  { name: 'Contractors', people: 46, enrolled: 38 },
]

export const MFA_TARGET = 95
/** The LED meters read from 80% to 100%, one block per point. */
export const MFA_SCALE_FROM = 80
