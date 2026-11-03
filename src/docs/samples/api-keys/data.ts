/**
 * API keys · Lintang's keys for the 21 Strive payments API. Usage covers the 30 days to
 * 3 Nov 2026 (WIB). Snippets live here, not in the .vue file, so Vite's dependency scanner never
 * reads their import lines as real imports.
 */

export type Env = 'live' | 'test'
export type Access = 'read' | 'write'

export const resources = [
  { id: 'payments', label: 'Payments' },
  { id: 'refunds', label: 'Refunds' },
  { id: 'customers', label: 'Customers' },
  { id: 'payouts', label: 'Payouts' },
  { id: 'balance', label: 'Balance' },
  { id: 'webhooks', label: 'Webhooks' },
  { id: 'disputes', label: 'Disputes' },
] as const

export type ResourceId = (typeof resources)[number]['id']
/** "payments:write" implies read. */
export type Scope = `${ResourceId}:${Access}`

export interface ApiKey {
  id: string
  name: string
  prefix: string
  env: Env
  scopes: Scope[]
  created: string
  lastUsed: string
  lastIp: string
  /** Requests a day, oldest first. */
  daily: number[]
  expires: string | null
  state: 'active' | 'expiring' | 'revoked'
}

export const DAYS = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(Date.UTC(2026, 9, 5 + i))
  return `${d.getUTCDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getUTCMonth()]}`
})

function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 30 days that add up to `total`: weekday rhythm, payday on 25 Oct, a little noise. */
function series(total: number, seed: number, shape: 'shop' | 'batch' | 'flat' | 'ramp' | 'fade' = 'shop'): number[] {
  const rand = rng(seed)
  const raw = Array.from({ length: 30 }, (_, i) => {
    const day = new Date(Date.UTC(2026, 9, 5 + i)).getUTCDay()
    const weekend = day === 0 || day === 6
    let v = shape === 'batch' ? (weekend ? 0.35 : 1.1) : shape === 'flat' ? 1 : weekend ? 0.84 : 1.04
    if (shape === 'ramp') v *= 0.35 + (i / 29) * 1.1
    if (shape === 'fade') v *= i < 28 ? 1 : 0.25
    if (i === 20 && shape !== 'flat') v *= shape === 'batch' ? 1.9 : 1.32 // 25 Oct, payday
    if (i === 21 && shape === 'shop') v *= 1.12
    return v * (0.92 + rand() * 0.16)
  })
  const sum = raw.reduce((a, b) => a + b, 0)
  return raw.map((v) => Math.round((v / sum) * total))
}

const all = (access: Access): Scope[] => resources.map((r) => `${r.id}:${access}` as Scope)

export const initialKeys: ApiKey[] = [
  {
    id: 'k1',
    name: 'Checkout server',
    prefix: 'rk_live_7Hk2',
    env: 'live',
    scopes: ['payments:write', 'refunds:write', 'customers:read'],
    created: '14 Mar 2025',
    lastUsed: '12 s ago',
    lastIp: '203.0.113.24',
    daily: series(11_240_000, 11),
    expires: null,
    state: 'active',
  },
  {
    id: 'k2',
    name: 'Settlement worker',
    prefix: 'rk_live_Qm8d',
    env: 'live',
    scopes: ['payouts:write', 'balance:read', 'webhooks:read'],
    created: '2 Jun 2025',
    lastUsed: '1 min ago',
    lastIp: '203.0.113.31',
    daily: series(4_120_000, 23, 'batch'),
    expires: null,
    state: 'active',
  },
  {
    id: 'k3',
    name: 'Mobile backend',
    prefix: 'rk_live_3Fz9',
    env: 'live',
    scopes: ['payments:write', 'customers:write'],
    created: '21 Aug 2025',
    lastUsed: '3 min ago',
    lastIp: '203.0.113.31',
    daily: series(2_610_000, 37),
    expires: null,
    state: 'active',
  },
  {
    id: 'k4',
    name: 'Partner · Kopi Senja POS',
    prefix: 'rk_live_Vw2c',
    env: 'live',
    scopes: ['payments:write'],
    created: '17 Sep 2026',
    lastUsed: '6 min ago',
    lastIp: '198.51.100.62',
    daily: series(912_000, 41, 'ramp'),
    expires: '17 Sep 2027',
    state: 'active',
  },
  {
    id: 'k5',
    name: 'Reporting export',
    prefix: 'rk_live_Lp4x',
    env: 'live',
    scopes: all('read'),
    created: '9 Jan 2026',
    lastUsed: '2 h ago',
    lastIp: '192.0.2.18',
    daily: series(384_000, 53, 'batch'),
    expires: '9 Jan 2027',
    state: 'active',
  },
  {
    id: 'k6',
    name: 'Checkout server · old',
    prefix: 'rk_live_2Xa8',
    env: 'live',
    scopes: ['payments:write', 'refunds:write', 'customers:read'],
    created: '3 Feb 2024',
    lastUsed: '5 h ago',
    lastIp: '203.0.113.19',
    daily: series(118_000, 67, 'fade'),
    expires: 'in 18 h',
    state: 'expiring',
  },
  {
    id: 'k7',
    name: 'Staging',
    prefix: 'rk_test_9Td1',
    env: 'test',
    scopes: all('write'),
    created: '2 Feb 2025',
    lastUsed: '11 min ago',
    lastIp: '192.0.2.44',
    daily: series(1_204_000, 71, 'flat'),
    expires: null,
    state: 'active',
  },
  {
    id: 'k8',
    name: 'CI integration tests',
    prefix: 'rk_test_Hy6s',
    env: 'test',
    scopes: ['payments:write', 'refunds:write'],
    created: '30 Jul 2025',
    lastUsed: '34 min ago',
    lastIp: '198.51.100.140',
    daily: series(463_000, 83, 'batch'),
    expires: null,
    state: 'active',
  },
]

export const expiryOptions = [
  { label: 'Never', value: 'never' },
  { label: 'In 30 days', value: '30' },
  { label: 'In 90 days', value: '90' },
  { label: 'In 1 year', value: '365' },
]

export const expiryLabel: Record<string, string | null> = { never: null, '30': '3 Dec 2026', '90': '1 Feb 2027', '365': '3 Nov 2027' }

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'

/** A secret that looks like one: env prefix, then 40 characters. Shown once. */
export function makeSecret(env: Env, seed: number): string {
  const rand = rng(seed)
  let body = ''
  for (let i = 0; i < 40; i++) body += ALPHABET[Math.floor(rand() * ALPHABET.length)]
  return `rk_${env}_${body}`
}

/** "payments:write" etc. collapsed for a row: write wins over read for the same resource. */
export function scopeBadges(scopes: Scope[]): string[] {
  if (resources.every((r) => scopes.includes(`${r.id}:write` as Scope))) return ['all:write']
  if (resources.every((r) => scopes.includes(`${r.id}:read` as Scope) || scopes.includes(`${r.id}:write` as Scope))) {
    const writes = scopes.filter((s) => s.endsWith(':write'))
    return writes.length ? ['all:read', ...writes] : ['all:read']
  }
  return scopes
}

/* ── Quick start ─────────────────────────────────────────────────────────── */

export const snippets = {
  curl: [
    'curl https://api.21strive.example/v1/payments \\',
    '  -H "Authorization: Bearer $STRIVE_KEY" \\',
    '  -H "Idempotency-Key: ord-20261103-0412" \\',
    '  -d amount=125000 \\',
    '  -d currency=IDR \\',
    '  -d "method[type]=qris" \\',
    '  -d "metadata[order_id]=ORD-20261103-0412"',
    '',
    '# 201 Created',
    '# { "id": "pay_8Kq2Xw", "status": "requires_action", "amount": 125000, ... }',
  ].join('\n'),
  node: [
    '// Node 18 or later: fetch is built in, no SDK needed.',
    "const res = await fetch('https://api.21strive.example/v1/payments', {",
    "  method: 'POST',",
    '  headers: {',
    '    Authorization: `Bearer ${process.env.STRIVE_KEY}`,',
    "    'Content-Type': 'application/json',",
    "    'Idempotency-Key': 'ord-20261103-0412',",
    '  },',
    '  body: JSON.stringify({',
    '    amount: 125000,',
    "    currency: 'IDR',",
    "    method: { type: 'qris' },",
    "    metadata: { order_id: 'ORD-20261103-0412' },",
    '  }),',
    '})',
    '',
    'const payment = await res.json()',
    'console.log(payment.id, payment.status) // pay_8Kq2Xw requires_action',
  ].join('\n'),
  go: [
    'package main',
    '',
    'import (',
    '\t"bytes"',
    '\t"fmt"',
    '\t"net/http"',
    '\t"os"',
    ')',
    '',
    'func main() {',
    '\tbody := []byte(`{"amount":125000,"currency":"IDR","method":{"type":"qris"}}`)',
    '\treq, _ := http.NewRequest("POST", "https://api.21strive.example/v1/payments", bytes.NewReader(body))',
    '\treq.Header.Set("Authorization", "Bearer "+os.Getenv("STRIVE_KEY"))',
    '\treq.Header.Set("Content-Type", "application/json")',
    '\treq.Header.Set("Idempotency-Key", "ord-20261103-0412")',
    '',
    '\tres, err := http.DefaultClient.Do(req)',
    '\tif err != nil {',
    '\t\tpanic(err)',
    '\t}',
    '\tdefer res.Body.Close()',
    '\tfmt.Println(res.Status) // 201 Created',
    '}',
  ].join('\n'),
}

export const RATE_LIMIT = { used: 412, limit: 1000 }
