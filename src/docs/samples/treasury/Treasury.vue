<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ArrowLeftRight, Download } from 'lucide-vue-next'
import {
  RBarList,
  RBulletChart,
  RButton,
  RCard,
  RLineChart,
  RMeter,
  RSegmented,
  RSparkline,
  RStat,
  RStatus,
  RTable,
  RTrend,
  useToast,
  type TableColumn,
  type TableSort,
} from '@/design-system'
import SampleShell from '../_kit/SampleShell.vue'
import AccountDrawer from './parts/AccountDrawer.vue'
import PaymentsDue from './parts/PaymentsDue.vue'
import TransferDialog from './parts/TransferDialog.vue'
import {
  type Account,
  type Payment,
  type Range,
  accountChange,
  accounts,
  availableChange,
  availableLiquidity,
  bankLimitShare,
  bn,
  byBank,
  businessDate,
  fixings,
  changeOver,
  clockStart,
  flows,
  fxNearest,
  fxRows,
  historyLength,
  lastFour,
  lcr,
  lcrPolicy,
  liquidity,
  minimumBuffer,
  money,
  nowWeek,
  payments as paymentSeed,
  rangeBaseline,
  ranges,
  signedBn,
  statusMeta,
  troughValue,
  troughWeek,
  undrawnFacility,
  weekLabels,
} from './data'

const { show } = useToast()

/* ── Clock: the business day runs from 10:42:18 WIB when the screen opens ───────────────── */
const elapsed = ref(0)
let timer = 0
onMounted(() => {
  const started = Date.now()
  timer = window.setInterval(() => (elapsed.value = Math.floor((Date.now() - started) / 1000)), 1000)
})
onBeforeUnmount(() => clearInterval(timer))
const clock = computed(() => {
  const t = clockStart.h * 3600 + clockStart.m * 60 + clockStart.s + elapsed.value
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(Math.floor(t / 3600) % 24)}:${pad(Math.floor(t / 60) % 60)}:${pad(t % 60)}`
})

/* ── Range ──────────────────────────────────────────────────────────────────────────────── */
const range = ref<Range>('today')
const rangeLabel = computed(() => ranges.find((r) => r.value === range.value)?.label ?? '')
const change = computed(() => changeOver(range.value))
const flow = computed(() => flows(range.value))
const available = availableLiquidity()

/* ── Accounts ───────────────────────────────────────────────────────────────────────────── */
const scope = ref<'all' | 'idr' | 'fx'>('all')
const scopeOptions = [
  { label: `All ${accounts.length}`, value: 'all' },
  { label: 'IDR', value: 'idr' },
  { label: 'FX', value: 'fx' },
]
const sort = ref<TableSort | null>(null)

const rows = computed(() =>
  accounts
    .filter((a) => scope.value === 'all' || (scope.value === 'idr') === (a.currency === 'IDR'))
    .map((a) => ({
      ...a,
      eq: a.idr / 1e9,
      delta: accountChange(a, range.value),
      week: a.history.slice(historyLength - 8).map((v) => v),
    })),
)

const columns = computed<TableColumn[]>(() => [
  { key: 'account', label: 'Account', sortable: true, sortValue: (r) => `${r.bank} ${r.name}` },
  { key: 'currency', label: 'Ccy' },
  { key: 'balance', label: 'Balance', numeric: true },
  { key: 'eq', label: 'IDR eq. bn', numeric: true, sortable: true },
  { key: 'delta', label: `Δ ${rangeLabel.value}`, numeric: true, sortable: true },
  { key: 'week', label: '7 days', width: '96px' },
  { key: 'status', label: 'Status' },
])

const drawerOpen = ref(false)
const current = ref<Account | null>(null)
const selected = computed(() => (drawerOpen.value && current.value ? [current.value.id] : []))

function openAccount(row: Record<string, unknown>) {
  current.value = accounts.find((a) => a.id === row.id) ?? null
  drawerOpen.value = true
}

/* ── Payments ───────────────────────────────────────────────────────────────────────────── */
const payments = ref<Payment[]>(paymentSeed.map((p) => ({ ...p, approvals: [...p.approvals] as [number, number] })))

function approve(payment: Payment) {
  const target = payments.value.find((p) => p.id === payment.id)
  if (!target) return
  const before = { status: target.status, approvals: [...target.approvals] as [number, number] }
  target.status = 'approved'
  target.approvals = [target.approvals[1], target.approvals[1]]
  show({
    title: 'Payment approved',
    body: `${target.id} to ${target.payee}, ${money(target.amount, target.currency)}. Releases ${target.release}.`,
    tone: 'success',
    action: {
      label: 'Undo',
      onClick: () => {
        target.status = before.status
        target.approvals = before.approvals
      },
    },
  })
}

function approveAll() {
  const open = payments.value.filter((p) => p.status === 'awaiting')
  for (const p of open) {
    p.status = 'approved'
    p.approvals = [p.approvals[1], p.approvals[1]]
  }
  show({
    title: `${open.length} payments approved`,
    body: open.map((p) => p.id).join(', '),
    tone: 'success',
  })
}

/* ── Actions ────────────────────────────────────────────────────────────────────────────── */
const transferOpen = ref(false)
const transferFrom = ref<Account | null>(null)

function newTransfer(from: Account | null = null) {
  transferFrom.value = from
  drawerOpen.value = false
  transferOpen.value = true
}

function exportCsv() {
  show({
    title: 'Export ready',
    body: `cash-position-2026-11-03-${range.value}.csv · ${accounts.length} accounts, ${payments.value.length} payments`,
  })
}

function statement(account: Account) {
  show({ title: 'Statement requested', body: `MT940 for ${account.id}, 1–3 Nov 2026. It will be in Downloads in a minute.` })
}

function submitted(summary: { ref: string; text: string }) {
  show({ title: 'Transfer sent for approval', body: `${summary.ref} · ${summary.text}` })
}

const nearestPct = Math.round((fxNearest.value / fxNearest.limit) * 100)
</script>

<template>
  <SampleShell product="Treasury">
    <template #strip>
      <span class="s-treasury-strip-ctx s-treasury-hide-sm">/ Cash position</span>
    </template>
    <template #meta>
      <span class="s-treasury-hide-sm">Tue {{ businessDate }}</span>
      <span class="s-treasury-clock">{{ clock }} WIB</span>
      <RStatus tone="signal" label="Markets open" size="sm" pulse />
    </template>

    <template #header>
      <div class="s-treasury-heading">
        <p class="r-eyebrow s-treasury-heading__eyebrow">PT Nusantara Logistik · Group treasury</p>
        <h1 class="s-treasury-heading__title">Cash position</h1>
      </div>
    </template>
    <template #actions>
      <RSegmented v-model="range" :options="ranges" size="sm" label="Range" />
      <RButton variant="outline" size="sm" @click="exportCsv">
        <template #leading><Download /></template>
        Export
      </RButton>
      <RButton tone="brand" size="sm" @click="newTransfer()">
        <template #leading><ArrowLeftRight /></template>
        New transfer
      </RButton>
    </template>

    <div class="s-treasury">
      <!-- KPI row: four ruled cells -->
      <section class="s-treasury-kpis r-grid-ruled" aria-label="Key figures">
        <div class="s-treasury-kpi">
          <RStat
            label="Total cash"
            :value="Math.round(change.now * 10) / 10"
            :decimals="1"
            unit="IDR bn"
            :trend="Math.round(change.pct * 10) / 10"
            :trend-label="rangeBaseline[range]"
          />
        </div>
        <div class="s-treasury-kpi">
          <RStat
            label="Available liquidity"
            :value="Math.round(available * 10) / 10"
            :decimals="1"
            unit="IDR bn"
            :trend="Math.round(availableChange(range) * 10) / 10"
          >
            <template #footer>
              <span class="s-treasury-kpi__note">incl. {{ bn(undrawnFacility) }} undrawn RCF</span>
            </template>
          </RStat>
        </div>
        <div class="s-treasury-kpi">
          <RStat :label="`Net flow · ${rangeLabel}`" :value="signedBn(flow.net)" unit="IDR bn">
            <template #footer>
              <span class="s-treasury-kpi__flows">
                <span><span class="r-label">In</span> {{ bn(flow.inflow) }}</span>
                <span><span class="r-label">Out</span> {{ bn(flow.outflow) }}</span>
              </span>
            </template>
          </RStat>
        </div>
        <div class="s-treasury-kpi">
          <RStat
            :label="range === 'today' ? 'Liquidity coverage' : `Liquidity coverage · ${rangeLabel} avg`"
            :value="lcr[range]"
            suffix="%"
          >
            <template #footer>
              <div class="s-treasury-kpi__meter">
                <RMeter
                  variant="segments"
                  :value="lcr[range]"
                  :max="200"
                  :count="20"
                  :height="10"
                  :label="`Liquidity coverage ${lcr[range]}% of a 200% scale, policy minimum ${lcrPolicy}%`"
                />
                <span class="s-treasury-kpi__scale"><span>0</span><span>Min {{ lcrPolicy }}</span><span>200</span></span>
              </div>
            </template>
          </RStat>
        </div>
      </section>

      <div class="s-treasury-grid">
        <!-- 13-week liquidity -->
        <RCard eyebrow="13-week liquidity" title="Total cash with a 6-week forecast" class="s-treasury-liquidity">
          <template #actions><span class="s-treasury-unit">IDR bn</span></template>
          <RLineChart
            :labels="weekLabels"
            :series="[{ name: 'Total cash', values: liquidity.map((v) => Math.round(v * 10) / 10) }]"
            :forecast-from="nowWeek"
            :now="nowWeek"
            :highlight="troughWeek"
            :references="[{ value: minimumBuffer, label: `Buffer ${bn(minimumBuffer, 0)}`, kind: 'threshold' }]"
            :min="1400"
            :height="264"
            legend
            :format="(v) => bn(v)"
            :axis-format="(v) => bn(v, 0)"
            label="Total cash by week in IDR billions: 13 weeks of actuals to W45 and a forecast to W51, against a minimum buffer of 1,600"
          />
          <dl class="s-treasury-notes">
            <div>
              <dt class="r-label">Now · W45</dt>
              <dd>{{ bn(liquidity[nowWeek]) }}</dd>
            </div>
            <div>
              <dt class="r-label">Trough · {{ weekLabels[troughWeek] }}</dt>
              <dd>{{ bn(troughValue) }} <span class="s-treasury-notes__hint">+{{ bn(troughValue - minimumBuffer) }} over buffer</span></dd>
            </div>
            <div>
              <dt class="r-label">Driver</dt>
              <dd class="s-treasury-notes__text">Corporate tax instalment and Q3 dividend, 30 Nov–4 Dec</dd>
            </div>
          </dl>
        </RCard>

        <!-- FX exposure -->
        <RCard
          eyebrow="FX exposure"
          title="Net open position against limits"
          :subtitle="`${fxNearest.ccy} at ${nearestPct}% of its USD ${fxNearest.limit}M limit`"
          class="s-treasury-fx"
        >
          <template #actions><span class="s-treasury-unit">USD M eq.</span></template>
          <RBulletChart
            :rows="fxRows"
            :format="(v) => (Number.isInteger(v) ? String(v) : v.toFixed(1))"
            label="Net open FX position by currency in USD millions equivalent, against each currency's limit"
          />
          <div class="s-treasury-fixings" role="list" aria-label="Fixing at 10:00 WIB, IDR per unit">
            <div v-for="f in fixings" :key="f.pair" class="s-treasury-fixing" role="listitem">
              <span class="r-label">{{ f.pair }}/IDR</span>
              <span class="s-treasury-fixing__rate">{{ bn(f.rate, f.digits) }}</span>
              <RTrend :value="f.change" :precision="2" variant="plain" size="sm" :icon="false" />
            </div>
          </div>
          <p class="s-treasury-fx__key">
            <span class="r-label">Key</span>
            Bar is the position, the tick is the limit. Bands mark 75% and 100% of the limit.
          </p>
        </RCard>

        <!-- Accounts -->
        <RCard
          :eyebrow="`Accounts · ${rows.length}`"
          title="Balances by account"
          subtitle="Select a row for the account datasheet."
          padding="none"
          class="s-treasury-accounts"
        >
          <template #actions>
            <RSegmented v-model="scope" :options="scopeOptions" size="sm" label="Currency" />
          </template>
          <RTable
            v-model:sort="sort"
            :columns="columns"
            :rows="rows"
            :selected="selected"
            density="compact"
            caption="Bank accounts with balances, change over the selected range and status"
            @row-click="openAccount"
          >
            <template #cell-account="{ row }">
              <div class="s-treasury-acct">
                <span class="s-treasury-acct__bank">{{ row.bank }}</span>
                <span class="s-treasury-acct__name">{{ row.name }} · <span class="r-mono">{{ lastFour(row.number) }}</span></span>
              </div>
            </template>
            <template #cell-currency="{ row }">
              <span class="r-label s-treasury-ccy">{{ row.currency }}</span>
            </template>
            <template #cell-balance="{ row }">{{ money(row.balance, row.currency) }}</template>
            <template #cell-eq="{ row }">{{ bn(row.eq, 2) }}</template>
            <template #cell-delta="{ row }">
              <span :class="row.delta < -0.005 ? 's-treasury-neg' : ''">{{ Math.abs(row.delta) < 0.005 ? '0.00' : signedBn(row.delta, 2) }}</span>
            </template>
            <template #cell-week="{ row }">
              <RSparkline
                v-if="row.vol > 0"
                :values="row.week"
                :width="72"
                :height="20"
                :end-dot="false"
                color="var(--r-chart-1)"
                :label="`${row.bank} ${row.name}, last 7 days`"
              />
              <span v-else class="r-label">Fixed</span>
            </template>
            <template #cell-status="{ row }">
              <RStatus :tone="statusMeta[row.status as Account['status']].tone" :label="statusMeta[row.status as Account['status']].label" size="sm" />
            </template>
          </RTable>
        </RCard>

        <div class="s-treasury-side">
          <PaymentsDue :payments="payments" @approve="approve" @approve-all="approveAll" />
          <RCard
            eyebrow="Counterparties"
            title="Cash by bank"
            :subtitle="`Policy cap ${bankLimitShare}% of group cash per bank`"
          >
            <template #actions><span class="s-treasury-unit">IDR bn eq.</span></template>
            <RBarList
              :items="byBank.map((b) => ({ label: `${b.bank} · ${Math.round(b.share)}%`, values: Math.round(b.value * 10) / 10 }))"
              :format="(v) => bn(v)"
              :bar-height="10"
              label="Group cash by bank in IDR billions equivalent, with each bank's share of the total"
            />
          </RCard>
        </div>
      </div>
    </div>

    <AccountDrawer
      v-model:open="drawerOpen"
      :account="current"
      :range="range"
      @statement="statement"
      @transfer="newTransfer"
    />
    <TransferDialog v-model:open="transferOpen" :from="transferFrom" @submit="submitted" />
  </SampleShell>
</template>

<style scoped>
.s-treasury {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.s-treasury-strip-ctx {
  color: var(--r-text-tertiary);
}

.s-treasury-clock {
  color: var(--r-text);
  font-variant-numeric: tabular-nums;
}

.s-treasury-heading {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.s-treasury-heading__eyebrow {
  color: var(--r-text-tertiary);
}
.s-treasury-heading__title {
  font-size: var(--r-text-xl);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-tight);
  line-height: 1.2;
}

/* KPI row */
.s-treasury-kpis {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.s-treasury-kpi {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 116px;
  padding: 16px 20px;
}
.s-treasury-kpi__note {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}
.s-treasury-kpi__flows {
  display: inline-flex;
  gap: 16px;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
}
.s-treasury-kpi__flows .r-label {
  margin-right: 4px;
}
.s-treasury-kpi__meter {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}
.s-treasury-kpi__scale {
  position: relative;
  display: flex;
  justify-content: space-between;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.s-treasury-kpi__scale span:nth-child(2) {
  position: absolute;
  left: 60%;
  transform: translateX(-50%);
}
.s-treasury-kpi :deep(.r-stat__footer) {
  width: 100%;
}

/* Grid */
.s-treasury-grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}
.s-treasury-liquidity,
.s-treasury-fx {
  align-self: stretch;
}
.s-treasury-side {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.s-treasury-notes {
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr);
  gap: 0;
  border-top: 1px solid var(--r-border-subtle);
}
.s-treasury-notes > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 24px 0 0;
}
.s-treasury-notes > div + div {
  padding-left: 24px;
  border-left: 1px solid var(--r-border-subtle);
}
.s-treasury-notes dd {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-sm);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.s-treasury-notes__hint {
  margin-left: 6px;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}
.s-treasury-notes__text {
  font-family: var(--r-font-sans) !important;
  font-size: var(--r-text-xs) !important;
  white-space: normal !important;
  color: var(--r-text-secondary);
}

.s-treasury-fixings {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  border-top: 1px solid var(--r-border-subtle);
}
.s-treasury-fixing {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  padding: 10px 8px 0 0;
}
.s-treasury-fixing + .s-treasury-fixing {
  padding-left: 10px;
  border-left: 1px solid var(--r-border-subtle);
}
.s-treasury-fixing__rate {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-sm);
  font-variant-numeric: tabular-nums;
}
.s-treasury-fixing :deep(.r-trend) {
  align-self: flex-start;
}

.s-treasury-fx__key {
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid var(--r-border-subtle);
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  line-height: 1.5;
}
.s-treasury-fx__key .r-label {
  margin-right: 6px;
}

.s-treasury-acct {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}
.s-treasury-acct__bank {
  font-weight: var(--r-weight-medium);
}
.s-treasury-acct__name {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}
.s-treasury-accounts :deep(.r-table td) {
  height: 44px;
}
.s-treasury-ccy {
  color: var(--r-text-secondary);
}
.s-treasury-neg {
  color: var(--r-text-secondary);
}

@media (max-width: 1180px) {
  .s-treasury-grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .s-treasury-kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .s-treasury-kpis {
    grid-template-columns: minmax(0, 1fr);
  }
  .s-treasury-hide-sm {
    display: none;
  }
  .s-treasury-notes {
    grid-template-columns: minmax(0, 1fr);
  }
  .s-treasury-notes > div + div {
    padding-left: 0;
    border-left: 0;
  }
}

/* Units keep their own case (IDR bn, not IDR BN), so they sit beside the card head, not in its meta. */
.s-treasury-unit {
  display: inline-block;
  padding-top: 4px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-medium);
  letter-spacing: 0.02em;
  white-space: nowrap;
}
</style>
