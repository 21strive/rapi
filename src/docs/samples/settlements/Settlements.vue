<script setup lang="ts">
/**
 * Sample 33 · Settlements & KYC. Sesi Admin, the internal admin of 21 Strive's booking platform:
 * platform balance, settled volume per day, settlement batches by bank, the KYC review queue
 * with its review drawer, and a small error tracker.
 */
import { computed, ref, type Component } from 'vue'
import { ArrowLeftRight, Bug, Download, LayoutDashboard, ScanFace, ShieldCheck, Users, Wallet } from 'lucide-vue-next'
import {
  RAvatar,
  RBadge,
  RButton,
  RCard,
  RColumnChart,
  RNavItem,
  RReadout,
  RSegmented,
  RStatus,
  useToast,
} from '@/design-system'
import type { Tone } from '@/design-system'
import SampleShell from '../_kit/SampleShell.vue'
import BatchesCard from './parts/BatchesCard.vue'
import ErrorGroups from './parts/ErrorGroups.vue'
import KycDrawer, { type KycDecision } from './parts/KycDrawer.vue'
import KycQueue from './parts/KycQueue.vue'
import {
  DAY_COUNT,
  NOW_LABEL,
  TODAY_INDEX,
  balance,
  billions,
  count,
  days,
  initialBatches,
  initialErrors,
  initialQueue,
  isInFlight,
  millions,
  rupiah,
  rupiahDigits,
  slaOf,
  type Batch,
  type ErrorState,
  type KycApplicant,
} from './data'

const toast = useToast()

/* ── State ──────────────────────────────────────────────────────────────────────────── */

const batches = ref<Batch[]>(initialBatches.map((b) => ({ ...b })))
const queue = ref<KycApplicant[]>([...initialQueue])
const errors = ref(initialErrors.map((e) => ({ ...e })))

const range = ref<string | number>(7)
const rangeOptions = [
  { label: '7D', value: 7 },
  { label: '14D', value: 14 },
  { label: '30D', value: 30 },
]
const rangeDays = computed(() => days.slice(DAY_COUNT - Number(range.value)))
const rangeLabel = computed(() => `${range.value} days`)
const rangeBatches = computed(() => batches.value.filter((b) => b.day >= DAY_COUNT - Number(range.value)))

/* ── Balance ────────────────────────────────────────────────────────────────────────── */

const today = computed(() => batches.value.filter((b) => b.day === TODAY_INDEX))
const pending = computed(() => batches.value.filter(isInFlight))
const pendingTotal = computed(() => pending.value.reduce((sum, b) => sum + b.amount, 0))
const processing = computed(() => pending.value.filter((b) => b.status === 'PROCESSING').length)
const settledToday = computed(() => today.value.reduce((sum, b) => sum + b.settledAmount, 0))
const settledTodayBatches = computed(() => today.value.filter((b) => b.settledAmount > 0))
const payoutsToday = computed(() => today.value.reduce((sum, b) => sum + b.settledItems, 0))

// Every readout shares one LCD mask, so the digits line up on the right like an instrument.
const MASK = '8.888.888.888'

/* ── Settled per day ────────────────────────────────────────────────────────────────── */

const settledOn = (day: number) => batches.value.reduce((sum, b) => (b.day === day ? sum + b.settledAmount : sum), 0)
const chartLabels = computed(() => rangeDays.value.map((d) => d.label))
const chartValues = computed(() => rangeDays.value.map((d) => settledOn(d.index) / 1e9))
const completeDays = computed(() => rangeDays.value.filter((d) => !d.isToday))
const average = computed(
  () => completeDays.value.reduce((sum, d) => sum + settledOn(d.index), 0) / Math.max(1, completeDays.value.length) / 1e9,
)
const rangeSettled = computed(() => rangeBatches.value.reduce((sum, b) => sum + b.settledAmount, 0))
const rangePayouts = computed(() => rangeBatches.value.reduce((sum, b) => sum + b.settledItems, 0))
const formatBn = (v: number) => v.toFixed(2)

/* ── Navigation ─────────────────────────────────────────────────────────────────────── */

interface NavEntry {
  id: string
  label: string
  icon: Component
  target?: string
  badge?: number
  badgeTone?: Tone
}

const openErrors = computed(() => errors.value.filter((e) => e.state === 'OPEN').length)
const activeNav = ref('settlements')
const navOperations = computed<NavEntry[]>(() => [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, target: 's-settlements-top' },
  { id: 'balance', label: 'Platform balance', icon: Wallet, target: 's-settlements-balance' },
  { id: 'settlements', label: 'Settlements', icon: ArrowLeftRight, target: 's-settlements-batches' },
  { id: 'kyc', label: 'KYC review', icon: ScanFace, target: 's-settlements-kyc', badge: queue.value.length, badgeTone: 'neutral' },
])
const navPlatform = computed<NavEntry[]>(() => [
  { id: 'users', label: 'Users', icon: Users },
  { id: 'errors', label: 'Error groups', icon: Bug, target: 's-settlements-errors', badge: openErrors.value, badgeTone: 'danger' },
  { id: 'admins', label: 'Admins', icon: ShieldCheck },
])

function go(entry: NavEntry) {
  if (!entry.target) {
    toast.show({ title: `${entry.label} is a page of its own`, body: 'This sample covers balance, settlements, KYC and errors.' })
    return
  }
  activeNav.value = entry.id
  document.getElementById(entry.target)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/* ── Actions ────────────────────────────────────────────────────────────────────────── */

function exportCsv() {
  const first = rangeDays.value[0]
  toast.show({
    title: `Exported settlement-batches-${range.value}d.csv`,
    body: `${count(rangeBatches.value.length)} batches, ${first.label} to ${days[TODAY_INDEX].long}.`,
    tone: 'success',
  })
}

function retry(id: string) {
  const batch = batches.value.find((b) => b.id === id)
  if (!batch) return
  batch.status = 'QUEUED'
  batch.window = '15:00'
  batch.note = 'Re-queued for the 15:00 window by R. Wibowo'
  toast.show({
    title: `${batch.id} queued for 15:00 WIB`,
    body: `Bank ${batch.bank} · ${count(batch.items)} payouts · ${rupiah(batch.amount)}`,
    tone: 'success',
  })
}

/* ── KYC ────────────────────────────────────────────────────────────────────────────── */

const decided = ref({ approved: 36, rejected: 5 })
const drawerOpen = ref(false)
const activeId = ref<string | null>(null)
// From the full list, so the drawer keeps its content while it slides out after a decision.
const active = computed(() => initialQueue.find((a) => a.id === activeId.value) ?? null)

function openReview(id: string) {
  activeId.value = id
  drawerOpen.value = true
}

const bySla = (x: KycApplicant, y: KycApplicant) => slaOf(x).left - slaOf(y).left

function decide(d: KycDecision) {
  const applicant = queue.value.find((a) => a.id === d.id)
  if (!applicant) return
  const key = d.decision === 'approve' ? 'approved' : 'rejected'
  queue.value = queue.value.filter((a) => a.id !== d.id)
  decided.value[key] += 1
  drawerOpen.value = false
  const undo = {
    label: 'Undo',
    onClick: () => {
      if (queue.value.some((a) => a.id === applicant.id)) return
      queue.value = [...queue.value, applicant].sort(bySla)
      decided.value[key] -= 1
      toast.show({ title: `${applicant.business} is back in the queue` })
    },
  }
  if (d.decision === 'approve') {
    toast.show({
      title: `Approved · ${applicant.business}`,
      body: `${applicant.id}. Settlements are open for this merchant from the next window.`,
      tone: 'success',
      action: undo,
    })
  } else {
    toast.show({
      title: `Rejected · ${applicant.business}`,
      body: `${applicant.id}. ${d.reason ? `${d.reason}. ` : ''}${applicant.owner} was asked to upload again.`,
      tone: 'danger',
      action: undo,
    })
  }
}

/* ── Errors ─────────────────────────────────────────────────────────────────────────── */

function changeError(id: string, state: ErrorState) {
  const group = errors.value.find((e) => e.id === id)
  if (!group) return
  group.state = state
  const words: Record<ErrorState, string> = { OPEN: 'Reopened', RESOLVED: 'Resolved', MUTED: 'Muted for 24 hours' }
  toast.show({ title: `${words[state]} · ${group.id}`, body: group.message, tone: state === 'RESOLVED' ? 'success' : 'neutral' })
}
</script>

<template>
  <SampleShell product="Sesi admin" title="Settlements & KYC">
    <template #strip>
      <RBadge tone="signal" size="sm" dot>Production</RBadge>
    </template>
    <template #meta>
      <span class="s-settlements-strip-hide">Finance operations</span>
      <span class="s-settlements-strip-date">{{ NOW_LABEL.split(' · ')[0] }}</span>
      <span>{{ NOW_LABEL.split(' · ')[1] }}</span>
    </template>
    <template #actions>
      <RSegmented v-model="range" :options="rangeOptions" size="sm" label="Range" />
      <RButton variant="outline" size="sm" @click="exportCsv">
        <template #leading><Download /></template>
        Export CSV
      </RButton>
    </template>

    <template #sidebar>
      <nav class="s-settlements-nav" aria-label="Sesi admin">
        <p class="r-label s-settlements-nav__group">Operations</p>
        <RNavItem
          v-for="item in navOperations"
          :key="item.id"
          as="button"
          type="button"
          :label="item.label"
          :icon="item.icon"
          :badge="item.badge"
          :badge-tone="item.badgeTone"
          :active="activeNav === item.id"
          @click="go(item)"
        />
        <p class="r-label s-settlements-nav__group">Platform</p>
        <RNavItem
          v-for="item in navPlatform"
          :key="item.id"
          as="button"
          type="button"
          :label="item.label"
          :icon="item.icon"
          :badge="item.badge || undefined"
          :badge-tone="item.badgeTone"
          :active="activeNav === item.id"
          @click="go(item)"
        />
      </nav>
      <div class="s-settlements-nav__foot">
        <RAvatar name="Rahmat Wibowo" size="sm" decorative />
        <div class="s-settlements-nav__who">
          <p class="s-settlements-nav__name">Rahmat Wibowo</p>
          <p class="r-label">Finance ops · admin</p>
        </div>
      </div>
    </template>

    <div id="s-settlements-top" class="s-settlements">
      <!-- 01 · Platform balance -->
      <section id="s-settlements-balance" class="s-settlements-section" aria-labelledby="s-settlements-balance-title">
        <header class="s-settlements-section__head">
          <span class="r-index">01</span>
          <h2 id="s-settlements-balance-title" class="r-eyebrow">Platform balance</h2>
          <span class="r-label s-settlements-section__meta">Ledger · as of 14:20 WIB</span>
        </header>
        <div class="s-settlements-balance r-grid-ruled">
          <div class="s-settlements-balance__cell">
            <RReadout label="Available" :value="rupiahDigits(balance.available)" unit="IDR" :ghost="MASK" sub="Collected · not yet in a batch" />
          </div>
          <div class="s-settlements-balance__cell">
            <RReadout
              label="Pending settlement"
              :value="rupiahDigits(pendingTotal)"
              unit="IDR"
              :ghost="MASK"
              :sub="`${pending.length} batches · next window 15:00 WIB`"
            >
              <template #meta>
                <RStatus v-if="processing" tone="signal" pulse size="sm" :label="`${processing} processing`" />
              </template>
            </RReadout>
          </div>
          <div class="s-settlements-balance__cell">
            <RReadout
              label="Reserved"
              :value="rupiahDigits(balance.reserve + balance.disputes)"
              unit="IDR"
              :ghost="MASK"
              :sub="`Reserve ${millions(balance.reserve)} M · disputes ${millions(balance.disputes)} M`"
            />
          </div>
          <div class="s-settlements-balance__cell">
            <RReadout
              label="Settled today"
              :value="rupiahDigits(settledToday)"
              unit="IDR"
              :ghost="MASK"
              tone="success"
              :sub="`${settledTodayBatches.length} batches · ${count(payoutsToday)} payouts`"
            />
          </div>
        </div>
      </section>

      <div class="s-settlements-grid">
        <!-- 02 · Settled per day -->
        <RCard class="s-settlements-chart" index="02" :eyebrow="`Settled per day · ${rangeLabel}`" title="Settled volume" meta="IDR bn">
          <RColumnChart
            :labels="chartLabels"
            :values="chartValues"
            :height="266"
            :format="formatBn"
            :axis-format="(v: number) => v.toFixed(1)"
            :show-values="chartLabels.length <= 7"
            :references="chartLabels.length > 7 ? [{ value: average, label: `Avg ${average.toFixed(2)}`, kind: 'average' }] : []"
            y-unit="IDR bn"
            :label="`Settled volume per day over the last ${rangeLabel}, in IDR billions, today until 14:20 WIB`"
          />
          <dl class="s-settlements-chart__sum">
            <div>
              <dt class="r-label">Settled</dt>
              <dd>IDR {{ billions(rangeSettled) }} bn</dd>
            </div>
            <div>
              <dt class="r-label">Avg a day</dt>
              <dd>{{ average.toFixed(2) }} bn</dd>
            </div>
            <div>
              <dt class="r-label">Batches</dt>
              <dd>{{ count(rangeBatches.length) }}</dd>
            </div>
            <div>
              <dt class="r-label">Payouts</dt>
              <dd>{{ count(rangePayouts) }}</dd>
            </div>
          </dl>
        </RCard>

        <!-- 03 · Batches -->
        <BatchesCard class="s-settlements-batches-slot" :batches="rangeBatches" :range-label="rangeLabel" @retry="retry" />

        <!-- 04 · KYC queue -->
        <KycQueue
          class="s-settlements-kyc-slot"
          :queue="queue"
          :decided="decided"
          :active-id="drawerOpen ? activeId : null"
          @open="openReview"
        />

        <!-- 05 · Errors -->
        <ErrorGroups class="s-settlements-errors-slot" :groups="errors" @change="changeError" />
      </div>
    </div>

    <KycDrawer v-model:open="drawerOpen" :applicant="active" @decide="decide" />
  </SampleShell>
</template>

<style scoped>
.s-settlements {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 1600px;
}

.s-settlements-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  scroll-margin-top: 48px;
}

.s-settlements-section__head {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.s-settlements-section__meta {
  margin-left: auto;
}

/* Balance: four instrument readouts on a ruled grid. */
.s-settlements-balance {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.s-settlements-balance__cell {
  padding: 16px 18px 14px;
}

.s-settlements-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 16px;
  align-items: stretch;
}

.s-settlements-chart {
  grid-column: span 5;
}
.s-settlements-batches-slot {
  grid-column: span 7;
}
.s-settlements-kyc-slot {
  grid-column: span 7;
}
.s-settlements-errors-slot {
  grid-column: span 5;
}

.s-settlements-chart__sum {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin: auto 0 0;
  border-top: 1px solid var(--r-border);
}
.s-settlements-chart__sum > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px 0 0;
}
.s-settlements-chart__sum > div + div {
  padding-left: 12px;
  border-left: 1px solid var(--r-border-subtle);
}
.s-settlements-chart__sum dd {
  margin: 0;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-sm);
  font-variant-numeric: tabular-nums;
}

/* Sidebar */
.s-settlements-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.s-settlements-nav__group {
  padding: 12px 10px 6px;
}
.s-settlements-nav__group:first-child {
  padding-top: 0;
}

.s-settlements-nav__foot {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: auto;
  padding: 12px 10px 0;
  border-top: 1px solid var(--r-border);
}

.s-settlements-nav__who {
  min-width: 0;
}

.s-settlements-nav__name {
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
  line-height: 1.3;
}

@media (max-width: 1359px) {
  .s-settlements-balance {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .s-settlements-chart,
  .s-settlements-batches-slot,
  .s-settlements-kyc-slot,
  .s-settlements-errors-slot {
    grid-column: 1 / -1;
  }
}

@media (max-width: 720px) {
  .s-settlements-strip-hide {
    display: none;
  }
  .s-settlements-chart__sum {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .s-settlements-chart__sum > div:nth-child(3) {
    padding-left: 0;
    border-left: 0;
  }
  .s-settlements-chart__sum > div:nth-child(n + 3) {
    margin-top: 10px;
    border-top: 1px solid var(--r-border-subtle);
  }
}

@media (max-width: 480px) {
  .s-settlements-strip-date {
    display: none;
  }
}

@media (max-width: 560px) {
  .s-settlements-balance {
    grid-template-columns: minmax(0, 1fr);
  }
  .s-settlements-section__meta {
    display: none;
  }
}
</style>
