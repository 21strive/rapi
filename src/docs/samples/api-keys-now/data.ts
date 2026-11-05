/**
 * API keys, now · Lintang's keys for the 21 Strive payments API, read from the Then screen's own
 * data so the pair compares like for like: the same eight keys, scopes, addresses and 30 days of
 * requests (to 3 Nov 2026, WIB). What this file adds is what Simpul reads to infer a key: which
 * resources a job really used, the office network saved on the account, the webhook events, and
 * the snippets it writes for one job. Snippets live here, not in a .vue file, so Vite's dependency
 * scanner never reads their import lines as real imports.
 */
import {
  DAYS,
  RATE_LIMIT,
  initialKeys,
  makeSecret,
  resources,
  scopeBadges,
  type ApiKey,
  type Env,
  type ResourceId,
  type Scope,
} from '../api-keys/data'

export { DAYS, RATE_LIMIT, makeSecret, resources, scopeBadges }
export type { ApiKey, Env, ResourceId, Scope }

/** The Then screen's moment: 3 Nov 2026, 11:47 WIB. */
export const SCENE = { date: '3 Nov 2026', start: '11:47', zone: 'WIB', api: '2026-10-01' }

export const AGENT = 'Simpul'
/** The person at the desk: Lintang's platform lead. */
export const PERSON = 'Dimas Prakoso'

/**
 * What the create-key job costs on each screen, counted the same way.
 * Then: the dialog's two steps (form, then the secret), and the 17 fields on the form a person has
 * to set or decide (name, expiry, environment, 7 resources × read and write; the two "all" column
 * shortcuts are not counted). Now: one sentence, one check read, two presses (create, then "I have
 * stored it", the same acknowledgement the Then's secret step asks for).
 */
export const COST = {
  then: [
    { value: 2, unit: 'steps' },
    { value: 17, unit: 'fields' },
  ],
  now: [
    { value: 1, unit: 'sentence' },
    { value: 1, unit: 'check' },
    { value: 2, unit: 'confirms' },
  ],
}

/* ── Keys ──────────────────────────────────────────────────────────────────────────── */

export type Tone = 'success' | 'warning' | 'danger' | 'neutral'

export interface DeskKey extends ApiKey {
  /** The team that looks after it: "tim data" finds the data team's key. */
  team: string
  /** Addresses the key works from; null: any. */
  allow: string[] | null
  /** A lamp and a word when the key is not simply in use. */
  flag?: { tone: Tone; label: string }
}

const teams: Record<string, string> = {
  k1: 'Payments',
  k2: 'Finance',
  k3: 'Mobile',
  k4: 'Partners',
  k5: 'Data',
  k6: 'Payments',
  k7: 'Platform',
  k8: 'Platform',
}

/** A fresh copy of the Then screen's keys, as the desk opens. */
export function startKeys(): DeskKey[] {
  return initialKeys.map((k) => ({
    ...k,
    scopes: [...k.scopes],
    daily: [...k.daily],
    team: teams[k.id] ?? 'Platform',
    allow: null,
    flag: k.state === 'expiring' ? { tone: 'warning', label: `Stops ${k.expires}` } : undefined,
  }))
}

export const resourceLabel = Object.fromEntries(resources.map((r) => [r.id, r.label])) as Record<ResourceId, string>
export const resourceIds = resources.map((r) => r.id) as ResourceId[]

/** Words a person uses for each resource, English and Indonesian. */
export const resourceWords: Record<ResourceId, string> = {
  payments: 'payments?|pembayaran',
  refunds: 'refunds?|pengembalian',
  customers: 'customers?|pelanggan|nasabah',
  payouts: 'payouts?|pencairan|settlements?',
  balance: 'balances?|saldo',
  webhooks: 'webhooks?',
  disputes: 'disputes?|sengketa|chargebacks?',
}

/* ── What the nightly reporting job really did ─────────────────────────────────────── */

/**
 * Requests by Reporting export (rk_live_Lp4x) in the 30 days, by resource. They add up to the
 * Then screen's 383,997 for that key. Nothing touched customers, webhooks or disputes.
 */
export const reportingUse: Record<ResourceId, number> = {
  payments: 271_880,
  refunds: 21_512,
  payouts: 82_694,
  balance: 7_911,
  customers: 0,
  webhooks: 0,
  disputes: 0,
}

/** The calls behind each count, for "why does it need …?". */
export const reportingCalls: Partial<Record<ResourceId, { calls: string; last: string; why: string }>> = {
  payments: {
    calls: 'GET /v1/payments · /v1/payments/{id}',
    last: '09:46 WIB today',
    why: 'Every row of the report is a payment: the 01:00 run lists the day’s payments and reads each one for its fees.',
  },
  refunds: {
    calls: 'GET /v1/refunds',
    last: '01:44 WIB today',
    why: 'The report nets refunds off each day’s sales, so the 01:00 run lists the day’s refunds.',
  },
  payouts: {
    calls: 'GET /v1/payouts · /v1/payouts/{id}/items',
    last: '09:47 WIB today',
    why: 'The report matches each payout to the payments it settled. A short re-run at 09:45 on weekdays reads the payouts that settled overnight.',
  },
  balance: {
    calls: 'GET /v1/balance/transactions',
    last: '01:53 WIB today',
    why: 'The closing balance on the last page comes from the day’s balance transactions.',
  },
}

/** Where the job runs from: the only address Reporting export was used from in 30 days. */
export const JOB_IP = '192.0.2.18'

/** The office network saved on the account ("IP kantor"). */
export const OFFICE = { name: 'the Jakarta office network', cidr: '192.0.2.0/26' }

/* ── The payment webhook endpoint ──────────────────────────────────────────────────── */

export const WEBHOOK = {
  url: 'hooks.lintang.example/strive',
  events: 'payment.succeeded, payment.failed, refund.succeeded',
  /** The server that answers the webhooks and calls the API back: outside the office network. */
  ip: '203.0.113.24',
}

/** Events delivered to the live endpoint in the 30 days, by the resource they name. */
export const webhookUse: Record<ResourceId, number> = {
  payments: 1_226_615,
  refunds: 13_092,
  payouts: 0,
  balance: 0,
  customers: 0,
  webhooks: 0,
  disputes: 0,
}

/* ── Dates and times the conversation can land on ─────────────────────────────────── */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** A date `days` after today, 3 Nov 2026: 90 → "1 Feb 2027", as the Then screen's select spells it. */
export function dateIn(days: number): string {
  const d = new Date(Date.UTC(2026, 10, 3 + days))
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

/** When each key was last used, as a WIB time today (the Then screen says "2 h ago"). */
export const lastAt: Record<string, string> = {
  k1: '11:47',
  k2: '11:46',
  k3: '11:44',
  k4: '11:41',
  k5: '09:47',
  k6: '06:47',
  k7: '11:36',
  k8: '11:13',
}

/** What stops working the moment a key is revoked, in one line. */
export const whatStops: Record<string, string> = {
  k1: 'Every checkout payment: the server at 203.0.113.24 signs each one with it.',
  k2: 'Payouts: Settlement worker sends them from 203.0.113.31.',
  k3: 'Card and QRIS payments from the Lintang app.',
  k4: 'Every sale at Kopi Senja’s tills: their POS charges through it.',
  k5: 'Tonight’s 01:00 export and the 09:45 re-run, unless they move to a new key first.',
  k6: 'The one server still on the old secret, 203.0.113.19.',
  k7: 'Test payments from Staging, 192.0.2.44.',
  k8: 'The integration tests in CI, from 198.51.100.140.',
}

/* ── Snippets for one job ──────────────────────────────────────────────────────────── */

export type Lang = 'curl' | 'node' | 'go'

/**
 * The first request for the nightly export: yesterday's payments, 100 a page. Yesterday in WIB, as
 * UTC: 2 Nov 00:00 WIB is 1 Nov 17:00 UTC. Every line fits the thread's card (45 characters).
 */
export function snippet(lang: Lang, prefix: string | null): { code: string; title: string; language: string } {
  const key = prefix ? `${prefix}…` : 'the new key'
  if (lang === 'node')
    return {
      title: 'nightly-export.mjs',
      language: 'js',
      code: [
        `// STRIVE_KEY: ${key}`,
        "const api = 'https://api.21strive.example/v1'",
        'const q = new URLSearchParams({',
        "  'created[gte]': '2026-11-01T17:00:00Z',",
        "  'created[lt]': '2026-11-02T17:00:00Z',",
        "  limit: '100',",
        '})',
        'const key = process.env.STRIVE_KEY',
        'const url = `${api}/payments?${q}`',
        'const res = await fetch(url, {',
        "  headers: { Authorization: 'Bearer ' + key },",
        '})',
        'const page = await res.json()',
        '// 100 true: more pages to read',
        'console.log(page.data.length, page.has_more)',
      ].join('\n'),
    }
  if (lang === 'go')
    return {
      title: 'main.go',
      language: 'go',
      code: [
        `// STRIVE_KEY: ${key}`,
        'base := "https://api.21strive.example/v1"',
        'q := url.Values{}',
        'q.Set("created[gte]", "2026-11-01T17:00:00Z")',
        'q.Set("created[lt]", "2026-11-02T17:00:00Z")',
        'q.Set("limit", "100")',
        '',
        'req, _ := http.NewRequest("GET",',
        '\tbase+"/payments?"+q.Encode(), nil)',
        'req.Header.Set("Authorization",',
        '\t"Bearer "+os.Getenv("STRIVE_KEY"))',
        'res, err := http.DefaultClient.Do(req)',
        'if err != nil {',
        '\tpanic(err)',
        '}',
        'fmt.Println(res.Status) // 200 OK',
      ].join('\n'),
    }
  return {
    title: 'Yesterday’s payments',
    language: 'bash',
    code: [
      `# STRIVE_KEY: ${key}`,
      'API=https://api.21strive.example/v1',
      'curl -G "$API/payments" \\',
      '  -H "Authorization: Bearer $STRIVE_KEY" \\',
      '  -d "created[gte]=2026-11-01T17:00:00Z" \\',
      '  -d "created[lt]=2026-11-02T17:00:00Z" \\',
      '  -d limit=100',
      '',
      '# 200 OK',
      '# { "data": [{ "id": "pay_8Kq2Xw",',
      '#     "amount": 125000, ... }],',
      '#   "has_more": true }',
    ].join('\n'),
  }
}
