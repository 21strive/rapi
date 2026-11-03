<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  Activity,
  BookOpen,
  Copy,
  EllipsisVertical,
  Gauge,
  KeyRound,
  LayoutGrid,
  ListFilter,
  Plus,
  RefreshCw,
  Trash2,
  Webhook,
} from 'lucide-vue-next'
import {
  RBadge,
  RButton,
  RCard,
  RCodeBlock,
  RDialog,
  RIconButton,
  RInput,
  RLineChart,
  RMenu,
  RMeter,
  RNavItem,
  RPopover,
  RRadioGroup,
  RReadout,
  RSegmented,
  RSelect,
  RSparkline,
  RStat,
  RStatus,
  RTable,
  RTabs,
  RTrend,
  formatCompact,
  formatNumber,
  useToast,
  type MenuItem,
  type TableColumn,
} from '@/design-system'
import SampleShell from '../_kit/SampleShell.vue'
import CreateKeyDialog from './parts/CreateKeyDialog.vue'
import SecretPanel from './parts/SecretPanel.vue'
import { DAYS, RATE_LIMIT, initialKeys, makeSecret, scopeBadges, snippets, type ApiKey, type Env, type Scope } from './data'

const { show } = useToast()

const keys = ref<ApiKey[]>(initialKeys.map((k) => ({ ...k })))
const envFilter = ref<'all' | Env>('all')
const selectedId = ref('k1')

const total = (k: ApiKey) => k.daily.reduce((a, b) => a + b, 0)
const compact = (v: number) => formatCompact(v, { maximumFractionDigits: 1 })

/* ── Sidebar ─────────────────────────────────────────────────────────────── */
const nav = [
  { label: 'Overview', icon: LayoutGrid },
  { label: 'API keys', icon: KeyRound, active: true },
  { label: 'Webhooks', icon: Webhook },
  { label: 'Events', icon: Activity },
  { label: 'Request logs', icon: ListFilter },
  { label: 'Rate limits', icon: Gauge },
]

/* ── Summary ─────────────────────────────────────────────────────────────── */
const activeKeys = computed(() => keys.value.filter((k) => k.state !== 'revoked'))
const liveTotal = computed(() => keys.value.filter((k) => k.env === 'live').reduce((s, k) => s + total(k), 0))

/* ── Table ───────────────────────────────────────────────────────────────── */
const envOptions = [
  { label: 'All', value: 'all' },
  { label: 'Live', value: 'live' },
  { label: 'Test', value: 'test' },
]
const visible = computed(() => keys.value.filter((k) => envFilter.value === 'all' || k.env === envFilter.value))

const columns: TableColumn[] = [
  { key: 'name', label: 'Name' },
  { key: 'prefix', label: 'Key', width: '156px' },
  { key: 'scopes', label: 'Scopes' },
  { key: 'env', label: 'Env', width: '68px' },
  { key: 'created', label: 'Created', width: '108px' },
  { key: 'lastUsed', label: 'Last used', width: '136px' },
  { key: 'usage', label: '30 days', width: '164px', align: 'right' },
  { key: 'actions', label: 'Actions', width: '48px', align: 'right' },
]

async function copyPrefix(k: ApiKey) {
  try {
    await navigator.clipboard?.writeText(k.prefix)
  } catch {
    /* clipboard blocked */
  }
  show({ title: 'Key prefix copied', body: `${k.prefix}… · the full secret is never shown again`, tone: 'neutral', duration: 2600 })
}

const menuFor = ref<string | null>(null)
function rowMenu(k: ApiKey): MenuItem[] {
  const off = k.state === 'revoked'
  return [
    { id: 'usage', label: 'Show usage', icon: Activity, disabled: off, onSelect: () => (selectedId.value = k.id) },
    { id: 'copy', label: 'Copy key prefix', icon: Copy, onSelect: () => void copyPrefix(k) },
    { id: 'roll', label: 'Roll key', icon: RefreshCw, description: 'New secret, old one expires later', disabled: off || k.state === 'expiring', onSelect: () => askRoll(k) },
    { divider: true },
    { id: 'revoke', label: 'Revoke key', icon: Trash2, danger: true, disabled: off, onSelect: () => askRevoke(k) },
  ]
}

/* ── Usage chart: the selected key in cobalt, the others in context grey ── */
const chartKeys = computed(() => visible.value.filter((k) => k.state !== 'revoked'))
watch(chartKeys, (list) => {
  if (!list.some((k) => k.id === selectedId.value) && list[0]) selectedId.value = list[0].id
})
const selected = computed(() => chartKeys.value.find((k) => k.id === selectedId.value) ?? chartKeys.value[0])
const keyOptions = computed(() => chartKeys.value.map((k) => ({ label: `${k.name} · ${k.prefix}`, value: k.id })))
const usageSeries = computed(() => {
  const others = chartKeys.value.filter((k) => k.id !== selected.value?.id)
  const list = others.map((k) => ({ name: k.name, values: k.daily, color: 'var(--r-chart-context)' }))
  if (selected.value) list.push({ name: selected.value.name, values: selected.value.daily, color: 'var(--r-chart-1)' })
  return list
})
const peakDay = computed(() => {
  const d = selected.value?.daily ?? []
  let i = 0
  d.forEach((v, k) => {
    if (v > d[i]) i = k
  })
  return i
})

/* ── Quick start ─────────────────────────────────────────────────────────── */
const lang = ref<'curl' | 'node' | 'go'>('curl')
const langs = [
  { label: 'curl', value: 'curl' },
  { label: 'Node', value: 'node' },
  { label: 'Go', value: 'go' },
]
const langMeta = { curl: { title: 'Create a QRIS payment', language: 'bash' }, node: { title: 'create-payment.mjs', language: 'js' }, go: { title: 'main.go', language: 'go' } }

/* ── Create ──────────────────────────────────────────────────────────────── */
const createOpen = ref(false)
let nextId = 9
function onCreate(k: { name: string; env: Env; scopes: Scope[]; expires: string | null; secret: string }) {
  const id = `k${nextId++}`
  keys.value = [
    {
      id,
      name: k.name,
      prefix: k.secret.slice(0, 12),
      env: k.env,
      scopes: k.scopes,
      created: '3 Nov 2026',
      lastUsed: 'Never',
      lastIp: '—',
      daily: new Array(30).fill(0),
      expires: k.expires,
      state: 'active',
    },
    ...keys.value,
  ]
  show({ title: 'Key created', body: `${k.name} · ${k.secret.slice(0, 12)}… · ${k.env}`, tone: 'success' })
}

/* ── Roll ────────────────────────────────────────────────────────────────── */
const rollOpen = ref(false)
const rollTarget = ref<ApiKey | null>(null)
const rollGrace = ref('24h')
const rollSecret = ref('')
const graceOptions = [
  { label: 'Now', value: 'now', description: 'Requests with the old key fail at once.' },
  { label: 'In 1 hour', value: '1h', description: 'Enough for one deploy.' },
  { label: 'In 24 hours', value: '24h', description: 'Recommended: time for every server to pick up the new secret.' },
]
const graceText: Record<string, string> = { now: 'now', '1h': 'in 1 h', '24h': 'in 24 h' }
let rollSeed = 101

function askRoll(k: ApiKey) {
  rollTarget.value = k
  rollGrace.value = '24h'
  rollSecret.value = ''
  rollOpen.value = true
}

function roll() {
  const k = rollTarget.value
  if (!k) return
  rollSeed += 17
  const secret = makeSecret(k.env, rollSeed)
  rollSecret.value = secret
  const fresh: ApiKey = { ...k, id: `k${nextId++}`, prefix: secret.slice(0, 12), created: '3 Nov 2026', lastUsed: 'Never', lastIp: '—', daily: new Array(30).fill(0), state: 'active' }
  keys.value = keys.value.flatMap((x) =>
    x.id === k.id
      ? [
          fresh,
          { ...x, name: `${x.name} · old`, state: rollGrace.value === 'now' ? 'revoked' : 'expiring', expires: graceText[rollGrace.value] },
        ]
      : [x],
  )
  show({ title: 'Key rolled', body: `${k.name}: the old secret ${k.prefix}… stops working ${graceText[rollGrace.value]}.`, tone: 'success' })
}

const rollSummary = computed(() =>
  rollTarget.value
    ? [
        { label: 'Key', value: rollTarget.value.name },
        { label: 'New prefix', value: rollSecret.value.slice(0, 12), mono: true },
        { label: 'Old secret', value: `${rollTarget.value.prefix}… stops ${graceText[rollGrace.value]}`, tone: 'warning' as const },
      ]
    : [],
)

/* ── Revoke ──────────────────────────────────────────────────────────────── */
const revokeOpen = ref(false)
const revokeTarget = ref<ApiKey | null>(null)
const confirmText = ref('')
function askRevoke(k: ApiKey) {
  revokeTarget.value = k
  confirmText.value = ''
  revokeOpen.value = true
}
function revoke(close: () => void) {
  const k = revokeTarget.value
  if (!k || confirmText.value.trim() !== k.name) return
  keys.value = keys.value.map((x) => (x.id === k.id ? { ...x, state: 'revoked', expires: 'Revoked' } : x))
  close()
  show({ title: 'Key revoked', body: `${k.name} · requests with ${k.prefix}… now get 401.`, tone: 'danger' })
}
</script>

<template>
  <SampleShell product="Developers" :sidebar-width="216">
    <template #strip>
      <span class="s-api-keys__path">/ Lintang / API keys</span>
    </template>
    <template #meta>
      <span class="s-api-keys__wide">API version 2026-10-01 · 11:47 WIB</span>
      <span class="s-api-keys__narrow">11:47 WIB</span>
    </template>

    <template #sidebar>
      <div class="s-api-keys__acct">
        <span class="r-label">Account</span>
        <span class="s-api-keys__acct-name">Lintang</span>
        <span class="r-caption r-text-tertiary">acct_4Lq92Tn</span>
      </div>
      <nav class="s-api-keys__nav" aria-label="Developers">
        <RNavItem v-for="item in nav" :key="item.label" as="button" type="button" :label="item.label" :icon="item.icon" :active="item.active" />
      </nav>
      <div class="s-api-keys__docs">
        <BookOpen />
        <span>API reference · version 2026-10-01</span>
      </div>
    </template>

    <template #header>
      <div class="s-api-keys__title">
        <p class="r-eyebrow">Developers · Lintang</p>
        <h1 class="r-h3">API keys</h1>
      </div>
    </template>
    <template #actions>
      <RButton tone="brand" size="sm" @click="createOpen = true">
        <template #leading><Plus /></template>
        Create key
      </RButton>
    </template>

    <div class="s-api-keys">
      <section class="s-api-keys__summary r-grid-ruled" aria-label="Summary">
        <div class="s-api-keys__cell">
          <span class="r-index">01</span>
          <RStat label="Active keys" :value="activeKeys.length" size="md">
            <template #footer>
              <span class="r-caption r-text-tertiary">
                {{ activeKeys.filter((k) => k.env === 'live').length }} live · {{ activeKeys.filter((k) => k.env === 'test').length }} test
              </span>
            </template>
          </RStat>
        </div>
        <div class="s-api-keys__cell">
          <span class="r-index">02</span>
          <RStat label="Live requests · 30 days" :value="liveTotal / 1e6" :decimals="2" suffix="M" size="md">
            <template #footer>
              <RTrend :value="6.2" size="sm" />
              <span class="r-caption r-text-tertiary">vs the 30 days before</span>
            </template>
          </RStat>
        </div>
        <div class="s-api-keys__cell">
          <span class="r-index">03</span>
          <RStat label="Error rate · 30 days" :value="0.21" :decimals="2" suffix="%" size="md">
            <template #footer>
              <RTrend :value="-0.04" :precision="2" suffix=" pp" invert size="sm" />
              <span class="r-caption r-text-tertiary">mostly 429s from Settlement worker</span>
            </template>
          </RStat>
        </div>
        <div class="s-api-keys__cell s-api-keys__cell--limit">
          <span class="r-index">04</span>
          <RReadout label="Live rate · now" :value="RATE_LIMIT.used" unit="of 1,000 req/s" font="pixel" size="md" />
          <RMeter variant="segments" :value="RATE_LIMIT.used" :max="RATE_LIMIT.limit" :count="20" :height="10" tone="brand" label="412 of 1,000 requests a second used" />
        </div>
      </section>

      <RCard index="05" eyebrow="Keys" title="Secret keys" :meta="`${visible.length} shown`" padding="none" class="s-api-keys__keys">
        <template #actions>
          <RSegmented v-model="envFilter" :options="envOptions" size="sm" label="Environment" />
        </template>
        <RTable :columns="columns" :rows="visible" :selected="[selectedId]" caption="Secret keys" @row-click="(row) => row.state !== 'revoked' && (selectedId = row.id)">
          <template #header-actions><span class="r-sr-only">Actions</span></template>
          <template #cell-name="{ row }">
            <span class="s-api-keys__name" :class="{ 'is-revoked': row.state === 'revoked' }">
              <span class="s-api-keys__name-text">{{ row.name }}</span>
              <RStatus v-if="row.state === 'expiring'" tone="warning" size="sm" :label="`Expires ${row.expires}`" />
              <RStatus v-else-if="row.state === 'revoked'" tone="neutral" size="sm" label="Revoked" />
            </span>
          </template>
          <template #cell-prefix="{ row }">
            <span class="s-api-keys__prefix">
              <span class="r-mono" :class="{ 'r-text-tertiary': row.state === 'revoked' }">{{ row.prefix }}…</span>
              <RIconButton :label="`Copy prefix of ${row.name}`" variant="ghost" size="xs" @click.stop="copyPrefix(row as ApiKey)"><Copy /></RIconButton>
            </span>
          </template>
          <template #cell-scopes="{ row }">
            <span class="s-api-keys__scopes">
              <RBadge v-for="s in scopeBadges(row.scopes).slice(0, 2)" :key="s" size="sm" :tone="s.endsWith(':write') ? 'brand' : 'neutral'" variant="outline">{{ s }}</RBadge>
              <span v-if="scopeBadges(row.scopes).length > 2" class="r-label" :title="row.scopes.join(', ')">+{{ scopeBadges(row.scopes).length - 2 }}</span>
            </span>
          </template>
          <template #cell-env="{ row }">
            <RBadge size="sm" :tone="row.env === 'live' ? 'signal' : 'neutral'" :variant="row.env === 'live' ? 'soft' : 'outline'">{{ row.env }}</RBadge>
          </template>
          <template #cell-created="{ value }"><span class="r-text-secondary">{{ value }}</span></template>
          <template #cell-lastUsed="{ row }">
            <span class="s-api-keys__used">
              <span>{{ row.lastUsed }}</span>
              <span class="r-mono r-text-tertiary">{{ row.lastIp }}</span>
            </span>
          </template>
          <template #cell-usage="{ row }">
            <span class="s-api-keys__usage">
              <RSparkline :values="row.daily" :width="80" :height="22" :color="row.id === selectedId ? 'var(--r-chart-1)' : 'var(--r-chart-context)'" :end-dot="row.id === selectedId" :label="`${row.name}, requests a day for 30 days`" />
              <span class="r-mono">{{ compact((row as ApiKey).daily.reduce((a: number, b: number) => a + b, 0)) }}</span>
            </span>
          </template>
          <template #cell-actions="{ row }">
            <span @click.stop>
              <RPopover :open="menuFor === row.id" kind="menu" placement="bottom-end" @update:open="(o: boolean) => (menuFor = o ? row.id : null)">
                <template #trigger>
                  <RIconButton :label="`Actions for ${row.name}`" variant="ghost" size="xs"><EllipsisVertical /></RIconButton>
                </template>
                <RMenu :items="rowMenu(row as ApiKey)" :label="`Actions for ${row.name}`" @close="menuFor = null" />
              </RPopover>
            </span>
          </template>
        </RTable>
      </RCard>

      <div class="s-api-keys__row">
        <RCard index="06" eyebrow="Usage" title="Requests a day by key" :subtitle="selected ? `${selected.name}: ${formatNumber(total(selected))} requests in 30 days, peak on ${DAYS[peakDay]}` : ''" class="s-api-keys__usage-card">
          <template #actions>
            <RSelect v-model="selectedId" :options="keyOptions" size="sm" aria-label="Key to highlight" class="s-api-keys__key-pick" />
          </template>
          <div class="s-api-keys__legend" aria-hidden="true">
            <span><i class="s-api-keys__swatch is-brand" />{{ selected?.name }}</span>
            <span><i class="s-api-keys__swatch" />Other {{ envFilter === 'all' ? '' : envFilter }} keys</span>
          </div>
          <RLineChart
            :labels="DAYS"
            :series="usageSeries"
            :legend="false"
            :highlight="null"
            :format="(v: number) => formatNumber(v)"
            :axis-format="compact"
            y-unit="req/day"
            :height="232"
            :label="`Requests a day for 30 days, ${selected?.name} highlighted against the other keys`"
          />
        </RCard>

        <RCard index="07" eyebrow="Quick start" title="Make your first request" subtitle="Export the key as STRIVE_KEY, then create a payment in the test environment." class="s-api-keys__start">
          <RTabs v-model="lang" :items="langs" size="sm" label="Language">
            <div class="s-api-keys__code">
              <RCodeBlock :code="snippets[lang]" :title="langMeta[lang].title" :language="langMeta[lang].language" line-numbers max-height="300px" />
            </div>
          </RTabs>
        </RCard>
      </div>
    </div>

    <CreateKeyDialog v-model:open="createOpen" @create="onCreate" />

    <RDialog v-model:open="rollOpen" :eyebrow="rollSecret ? 'Key rolled' : 'Roll key'" :title="rollTarget?.name" size="md" :dismissible="!rollSecret">
      <div v-if="!rollSecret" class="s-api-keys__roll">
        <p class="r-body-sm r-text-secondary">
          A new secret replaces {{ rollTarget?.prefix }}… with the same name and permissions. Choose when the old secret stops working.
        </p>
        <RRadioGroup v-model="rollGrace" :options="graceOptions" label="Old secret stops working" />
      </div>
      <SecretPanel v-else :secret="rollSecret" :summary="rollSummary" />
      <template #footer="{ close }">
        <template v-if="!rollSecret">
          <RButton variant="outline" @click="close">Cancel</RButton>
          <RButton tone="brand" @click="roll">
            <template #leading><RefreshCw /></template>
            Roll key
          </RButton>
        </template>
        <RButton v-else tone="brand" @click="close">I have stored the secret</RButton>
      </template>
    </RDialog>

    <RDialog v-model:open="revokeOpen" eyebrow="Revoke key" :title="`Revoke ${revokeTarget?.name}?`" size="sm">
      <div class="s-api-keys__revoke">
        <p class="r-body-sm r-text-secondary">
          Every request signed with <span class="r-mono">{{ revokeTarget?.prefix }}…</span> gets 401 from the moment you confirm.
          This cannot be undone; create a new key if you need one.
        </p>
        <RInput v-model="confirmText" :label="`Type ${revokeTarget?.name} to confirm`" autocomplete="off" />
      </div>
      <template #footer="{ close }">
        <RButton variant="outline" @click="close">Cancel</RButton>
        <RButton tone="danger" :disabled="confirmText.trim() !== revokeTarget?.name" @click="revoke(close)">
          <template #leading><Trash2 /></template>
          Revoke key
        </RButton>
      </template>
    </RDialog>
  </SampleShell>
</template>

<style scoped>
.s-api-keys__path {
  color: var(--r-text-tertiary);
}
.s-api-keys__narrow {
  display: none;
}

/* Sidebar */
.s-api-keys__acct {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px 8px 14px;
  border-bottom: 1px solid var(--r-border);
}
.s-api-keys__acct-name {
  font-weight: var(--r-weight-semibold);
}
.s-api-keys__nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.s-api-keys__docs {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: auto;
  padding: 12px 8px 0;
  border-top: 1px solid var(--r-border);
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}
.s-api-keys__docs svg {
  width: 14px;
  height: 14px;
  margin-top: 1px;
}

.s-api-keys__title {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.s-api-keys__title .r-eyebrow {
  color: var(--r-text-tertiary);
}

.s-api-keys {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.s-api-keys__summary {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.s-api-keys__cell {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 10px;
  padding: 16px 20px;
}
.s-api-keys__cell > .r-index {
  position: absolute;
  top: 8px;
  right: 10px;
}

.s-api-keys__keys {
  gap: 0;
}
.s-api-keys__keys :deep(.r-card__header) {
  padding-bottom: 14px;
}
.s-api-keys__name {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
  font-weight: var(--r-weight-medium);
  line-height: 1.25;
}
.s-api-keys__name.is-revoked {
  color: var(--r-text-tertiary);
  font-weight: var(--r-weight-regular);
}
.s-api-keys__prefix,
.s-api-keys__scopes,
.s-api-keys__usage {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.s-api-keys__usage {
  gap: 10px;
}
.s-api-keys__usage .r-mono {
  min-width: 44px;
  text-align: right;
}
.s-api-keys__used {
  display: inline-flex;
  flex-direction: column;
  line-height: 1.25;
}
.s-api-keys__used .r-mono {
  font-size: var(--r-text-3xs);
}

.s-api-keys__row {
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
  gap: 16px;
}
.s-api-keys__key-pick {
  width: 260px;
}
.s-api-keys__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 18px;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}
.s-api-keys__legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.s-api-keys__swatch {
  display: inline-block;
  width: 12px;
  height: 2px;
  background: var(--r-chart-context);
}
.s-api-keys__swatch.is-brand {
  background: var(--r-chart-1);
}
.s-api-keys__code {
  padding-top: 14px;
}

.s-api-keys__roll,
.s-api-keys__revoke {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (max-width: 1199px) {
  .s-api-keys__row {
    grid-template-columns: minmax(0, 1fr);
  }
  .s-api-keys__summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .s-api-keys__path,
  .s-api-keys__wide {
    display: none;
  }
  .s-api-keys__narrow {
    display: inline;
  }
  .s-api-keys__key-pick {
    width: 100%;
  }
  .s-api-keys__cell {
    padding: 14px;
  }
}

@media (max-width: 560px) {
  .s-api-keys__summary {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
