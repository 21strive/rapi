/**
 * Deployments · project lintang-app on 21 Strive Deploy. Times are UTC; the screen's clock reads
 * 03 Nov 2026 04:47 UTC. Production is 7f3c2a1, deployed 2 Nov 08:08 UTC (its cache purge shows
 * up in the edge analytics sample at 15:10 WIB).
 */

export type DeployStatus = 'ready' | 'failed' | 'building' | 'canceled'
export type StepId = 'install' | 'build' | 'test' | 'deploy' | 'verify'

export const STEP_LABELS: Record<StepId, string> = {
  install: 'Install',
  build: 'Build',
  test: 'Test',
  deploy: 'Deploy',
  verify: 'Verify',
}
export const STEP_ORDER: StepId[] = ['install', 'build', 'test', 'deploy', 'verify']

export interface StepRun {
  /** Seconds, when the step finished. */
  seconds?: number
  state: 'complete' | 'current' | 'upcoming' | 'error'
  note?: string
}

export interface Deployment {
  id: string
  sha: string
  message: string
  branch: string
  author: string
  status: DeployStatus
  target: 'production' | 'preview'
  /** Started at, UTC. */
  started: string
  age: string
  /** Seconds. */
  duration: number
  url: string
  steps: Record<StepId, StepRun>
  log: string[]
  /** 1-based lines to highlight in the log. */
  errorLines?: number[]
}

export const PROJECT = {
  name: 'lintang-app',
  team: 'Lintang',
  repo: 'git.lintang.example/lintang/app',
  productionBranch: 'main',
  domain: 'app.lintang.example',
  framework: 'Static site + edge functions',
}

const ok = (seconds: number, note?: string): StepRun => ({ state: 'complete', seconds, note })
const fmtDuration = (s: number) => (s >= 60 ? `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s` : `${s}s`)
export { fmtDuration }

/* ── Logs ─────────────────────────────────────────────────────────────────── */

const failedLog = [
  '04:31:02.114  Cloning git.lintang.example/lintang/app (branch feat/fx-quote-cache, commit a41c9e2)',
  '04:31:03.870  Cloned in 1.7 s · restored build cache from dpl_6Hn3vPd (412 MB)',
  '04:31:04.002  Running "npm ci"',
  '04:31:19.441  added 1,284 packages, audited 1,285 in 15.4 s',
  '04:31:19.512  Running "npm run build"',
  '04:31:20.031  > lintang-app@4.18.0 build',
  '04:31:20.032  > tsc -b && bundle --mode production',
  '04:31:41.208  2,316 modules transformed',
  '04:31:44.920  dist/assets/app.b51e07.js       214.60 kB  gzip  68.12 kB',
  '04:31:44.921  dist/assets/vendor.91d0e4.js    342.18 kB  gzip 109.47 kB',
  '04:31:44.923  dist/index.html                   1.92 kB',
  '04:31:45.007  Build completed in 25.5 s',
  '04:31:45.112  Running "npm test -- --run"',
  '04:31:46.380   PASS  src/money/idr.spec.ts (18 tests) 41 ms',
  '04:31:47.912   PASS  src/settlements/batch.spec.ts (12 tests) 88 ms',
  '04:31:49.101   FAIL  src/fx/quotes.spec.ts > serves a cached quote for at most 30 s',
  "04:31:49.102         AssertionError: expected 'HIT' to be 'MISS' after 31 s",
  '04:31:49.102           at src/fx/quotes.spec.ts:57:32',
  '04:31:49.240   PASS  src/webhooks/sign.spec.ts (9 tests) 22 ms',
  '04:31:50.016  Test files  1 failed | 23 passed (24)',
  '04:31:50.017       Tests  1 failed | 311 passed (312)',
  '04:31:50.130  Error: Command "npm test -- --run" exited with 1',
  '04:31:50.244  Deployment failed at Test after 48 s. Deploy and Verify were skipped.',
]

const productionLog = [
  '08:06:12.402  Cloning git.lintang.example/lintang/app (branch main, commit 7f3c2a1)',
  '08:06:13.951  Cloned in 1.5 s · restored build cache from dpl_4Ry7mNc (409 MB)',
  '08:06:14.020  Running "npm ci"',
  '08:06:29.880  added 1,281 packages, audited 1,282 in 15.8 s',
  '08:06:29.944  Running "npm run build"',
  '08:06:52.170  2,311 modules transformed',
  '08:06:55.612  dist/assets/app.7f3c2a.js       213.98 kB  gzip  67.90 kB',
  '08:06:55.613  dist/assets/vendor.91d0e4.js    342.18 kB  gzip 109.47 kB',
  '08:06:55.701  Build completed in 25.7 s',
  '08:06:55.790  Running "npm test -- --run"',
  '08:07:01.904  Test files  24 passed (24)',
  '08:07:01.905       Tests  311 passed (311)',
  '08:07:02.010  Deploying to the edge: 1,904 static files, 3 edge functions',
  '08:07:05.122  Uploaded 18.2 MB in 3.1 s (1,612 files unchanged)',
  '08:07:05.480  Preview URL lintang-app-6hn3vpd.deploy.21strive.example',
  '08:07:49.215  Verify  GET /healthz 200 from CGK in 38 ms',
  '08:07:49.640  Verify  GET /healthz 200 from SIN in 52 ms',
  '08:07:50.102  Verify  GET / 200, 61 KB, first byte 84 ms',
  '08:08:01.330  Promoted to production: app.lintang.example',
  '08:10:02.006  Purged edge cache for app.lintang.example (zone lintang.example)',
  '08:10:02.120  Deployment ready in 1m 52s',
]

export const buildingScript = [
  '04:45:31.208  Cloning git.lintang.example/lintang/app (branch fix/webhook-retry, commit c2d8f10)',
  '04:45:32.770  Cloned in 1.6 s · restored build cache from dpl_6Hn3vPd (412 MB)',
  '04:45:32.851  Running "npm ci"',
  '04:45:48.090  added 1,284 packages, audited 1,285 in 15.2 s',
  '04:45:48.162  Running "npm run build"',
  '04:45:48.690  > lintang-app@4.18.1 build',
  '04:45:48.691  > tsc -b && bundle --mode production',
  // Lines from here are streamed while the screen is open.
  '04:46:10.402  2,318 modules transformed',
  '04:46:13.810  dist/assets/app.c2d8f1.js       215.02 kB  gzip  68.31 kB',
  '04:46:13.902  Build completed in 25.7 s',
  '04:46:14.010  Running "npm test -- --run"',
  '04:46:20.118  Test files  24 passed (24)',
  '04:46:20.119       Tests  314 passed (314)',
  '04:46:20.230  Deploying to the edge: 1,906 static files, 3 edge functions',
  '04:46:23.401  Uploaded 18.3 MB in 3.0 s (1,630 files unchanged)',
  '04:46:23.712  Preview URL lintang-app-8fq2klm.deploy.21strive.example',
  '04:46:31.006  Verify  GET /healthz 200 from CGK in 36 ms',
  '04:46:31.420  Verify  GET /healthz 200 from SIN in 49 ms',
  '04:46:31.900  Deployment ready in 1m 01s',
]
/** How many script lines are already written when the screen opens. */
export const BUILDING_START = 7
/** Which step each script line belongs to (index into STEP_ORDER), for the live run. */
export const BUILDING_STEP_AT = [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4]

const shortLog = (lines: string[]) => lines

/* ── History ──────────────────────────────────────────────────────────────── */

export const deployments: Deployment[] = [
  {
    id: 'dpl_8Fq2kLm',
    sha: 'c2d8f10',
    message: 'Retry webhook deliveries with jitter',
    branch: 'fix/webhook-retry',
    author: 'Kevin Tan',
    status: 'building',
    target: 'preview',
    started: '04:45 UTC',
    age: '2 min ago',
    duration: 52,
    url: 'lintang-app-8fq2klm.deploy.21strive.example',
    steps: {
      install: ok(17),
      build: { state: 'current', note: 'Bundling' },
      test: { state: 'upcoming' },
      deploy: { state: 'upcoming' },
      verify: { state: 'upcoming' },
    },
    log: buildingScript.slice(0, BUILDING_START),
  },
  {
    id: 'dpl_7Zx9wRt',
    sha: 'a41c9e2',
    message: 'Cache FX quotes at the edge for 30 s',
    branch: 'feat/fx-quote-cache',
    author: 'Dimas Pratama',
    status: 'failed',
    target: 'preview',
    started: '04:31 UTC',
    age: '16 min ago',
    duration: 48,
    url: 'lintang-app-7zx9wrt.deploy.21strive.example',
    steps: {
      install: ok(17),
      build: ok(26),
      test: { state: 'error', seconds: 5, note: '1 of 312 tests failed' },
      deploy: { state: 'upcoming', note: 'Skipped' },
      verify: { state: 'upcoming', note: 'Skipped' },
    },
    log: failedLog,
    errorLines: [16, 17, 18],
  },
  {
    id: 'dpl_6Hn3vPd',
    sha: '7f3c2a1',
    message: 'Show settlement batch totals in IDR',
    branch: 'main',
    author: 'Sari Wulandari',
    status: 'ready',
    target: 'production',
    started: '2 Nov 08:06 UTC',
    age: '20 h ago',
    duration: 112,
    url: 'lintang-app-6hn3vpd.deploy.21strive.example',
    steps: { install: ok(17), build: ok(26), test: ok(6), deploy: ok(4), verify: ok(59, 'Promoted, cache purged') },
    log: productionLog,
  },
  {
    id: 'dpl_5Kd8sQa',
    sha: 'e93b0d4',
    message: 'Fix rounding of IDR amounts under Rp 1.000',
    branch: 'fix/idr-rounding',
    author: 'Sari Wulandari',
    status: 'ready',
    target: 'preview',
    started: '2 Nov 06:40 UTC',
    age: '22 h ago',
    duration: 108,
    url: 'lintang-app-5kd8sqa.deploy.21strive.example',
    steps: { install: ok(16), build: ok(25), test: ok(6), deploy: ok(4), verify: ok(57) },
    log: shortLog(productionLog.map((l) => l.replace('7f3c2a1', 'e93b0d4').replace('branch main', 'branch fix/idr-rounding').replace(/^08:/, '06:'))).slice(0, 18),
  },
  {
    id: 'dpl_4Ry7mNc',
    sha: '5d8e21b',
    message: 'Merchant onboarding: KTP upload step',
    branch: 'main',
    author: 'Ayu Lestari',
    status: 'ready',
    target: 'production',
    started: '31 Oct 09:22 UTC',
    age: '3 d ago',
    duration: 123,
    url: 'lintang-app-4ry7mnc.deploy.21strive.example',
    steps: { install: ok(18), build: ok(28), test: ok(7), deploy: ok(4), verify: ok(66) },
    log: productionLog.map((l) => l.replace('7f3c2a1', '5d8e21b').replace('app.7f3c2a', 'app.5d8e21').replace(/^08:/, '09:')),
  },
  {
    id: 'dpl_3Pw5jXe',
    sha: '0c7f9a3',
    message: 'Bump edge runtime to 22.11',
    branch: 'chore/runtime-22',
    author: 'Kevin Tan',
    status: 'canceled',
    target: 'preview',
    started: '30 Oct 14:10 UTC',
    age: '4 d ago',
    duration: 41,
    url: 'lintang-app-3pw5jxe.deploy.21strive.example',
    steps: {
      install: ok(19),
      build: { state: 'error', seconds: 22, note: 'Canceled by Kevin Tan' },
      test: { state: 'upcoming' },
      deploy: { state: 'upcoming' },
      verify: { state: 'upcoming' },
    },
    log: [
      '14:10:03.551  Cloning git.lintang.example/lintang/app (branch chore/runtime-22, commit 0c7f9a3)',
      '14:10:05.102  Cloned in 1.5 s · no build cache for runtime 22.11',
      '14:10:05.200  Running "npm ci"',
      '14:10:24.317  added 1,284 packages, audited 1,285 in 19.1 s',
      '14:10:24.390  Running "npm run build"',
      '14:10:46.012  Canceled by Kevin Tan: superseded by dpl_2Mt4hVb',
    ],
    errorLines: [6],
  },
  {
    id: 'dpl_2Mt4hVb',
    sha: 'b81e6f2',
    message: 'Payouts table: sticky header and totals row',
    branch: 'main',
    author: 'Dimas Pratama',
    status: 'ready',
    target: 'production',
    started: '29 Oct 03:55 UTC',
    age: '5 d ago',
    duration: 117,
    url: 'lintang-app-2mt4hvb.deploy.21strive.example',
    steps: { install: ok(17), build: ok(27), test: ok(6), deploy: ok(4), verify: ok(63) },
    log: productionLog.map((l) => l.replace('7f3c2a1', 'b81e6f2').replace('app.7f3c2a', 'app.b81e6f').replace(/^08:/, '03:')),
  },
  {
    id: 'dpl_1Lq3gUa',
    sha: '44a0c1e',
    message: 'Poll QR charge status every 3 s',
    branch: 'feat/qr-polling',
    author: 'Rina Hartono',
    status: 'ready',
    target: 'preview',
    started: '28 Oct 11:30 UTC',
    age: '6 d ago',
    duration: 130,
    url: 'lintang-app-1lq3gua.deploy.21strive.example',
    steps: { install: ok(18), build: ok(29), test: ok(8), deploy: ok(5), verify: ok(70) },
    log: productionLog.map((l) => l.replace('7f3c2a1', '44a0c1e').replace('branch main', 'branch feat/qr-polling').replace(/^08:/, '11:')).slice(0, 18),
  },
]

/** The production deployment before the current one, the rollback target. */
export const INITIAL_PRODUCTION = 'dpl_6Hn3vPd'

/* ── Environment, runtime logs and settings ──────────────────────────────── */

export const environment = [
  { label: 'Region', value: 'Jakarta · jkt1, failover sin1' },
  { label: 'Runtime', value: 'Node 22.11 · edge functions' },
  { label: 'Build command', value: 'npm run build', mono: true },
  { label: 'Output', value: 'dist', mono: true },
  { label: 'Edge functions', value: '3 · 128 MB · 10 s limit' },
  { label: 'Variables', value: '14, of which 5 secret' },
  { label: 'Build cache', value: 'Restored · 412 MB' },
]

export const runtimeLogs = [
  { id: 'q1', time: '04:47:12.408', level: 'info', method: 'GET', path: '/api/session', status: 200, ms: 18, region: 'jkt1' },
  { id: 'q2', time: '04:47:12.391', level: 'info', method: 'GET', path: '/v1/fx/quotes?pair=USDIDR', status: 200, ms: 6, region: 'jkt1' },
  { id: 'q3', time: '04:47:11.954', level: 'warn', method: 'POST', path: '/api/webhooks/settlement', status: 429, ms: 3, region: 'sin1' },
  { id: 'q4', time: '04:47:11.602', level: 'info', method: 'GET', path: '/api/payouts?page=2', status: 200, ms: 142, region: 'jkt1' },
  { id: 'q5', time: '04:47:10.877', level: 'error', method: 'POST', path: '/api/webhooks/settlement', status: 502, ms: 10_004, region: 'jkt1' },
  { id: 'q6', time: '04:47:10.115', level: 'info', method: 'GET', path: '/api/merchants/MR-20931', status: 200, ms: 64, region: 'jkt1' },
  { id: 'q7', time: '04:47:09.730', level: 'info', method: 'GET', path: '/api/session', status: 200, ms: 15, region: 'sin1' },
  { id: 'q8', time: '04:47:09.212', level: 'warn', method: 'GET', path: '/api/settlements/export.csv', status: 200, ms: 2_870, region: 'jkt1' },
]

export const envVars = [
  { id: 'v1', key: 'API_BASE_URL', value: 'https://api.lintang.example', secret: false, targets: ['Production', 'Preview'] },
  { id: 'v2', key: 'SETTLEMENT_WEBHOOK_SECRET', value: 'whsec_4Qd9…', secret: true, targets: ['Production'] },
  { id: 'v3', key: 'FX_QUOTE_TTL_SECONDS', value: '30', secret: false, targets: ['Production', 'Preview'] },
  { id: 'v4', key: 'SESSION_SIGNING_KEY', value: 'sk_9fA2…', secret: true, targets: ['Production', 'Preview'] },
  { id: 'v5', key: 'SENTINEL_DSN', value: 'https://ingest.lintang.example/4', secret: false, targets: ['Production'] },
  { id: 'v6', key: 'PAYOUTS_PAGE_SIZE', value: '50', secret: false, targets: ['Production', 'Preview'] },
]

export const nodeVersions = [
  { label: 'Node 22.x', value: '22' },
  { label: 'Node 20.x', value: '20' },
]
