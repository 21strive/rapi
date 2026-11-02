<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  Calendar,
  ChevronDown,
  Copy,
  Download,
  LayoutDashboard,
  MoreHorizontal,
  RotateCcw,
  Search,
  Settings,
  Sparkles,
} from 'lucide-vue-next'
import {
  RAvatar,
  RBadge,
  RButton,
  RCard,
  RChip,
  RDotMatrixChart,
  RHeatmap,
  RIconButton,
  RInput,
  RMenu,
  RMeter,
  RPopover,
  RRadialGauge,
  RSegmented,
  RSparkline,
  RStat,
  RTable,
  RTour,
  RTrend,
  formatCompact,
  formatCurrency,
  type MenuItem,
  type TableColumn,
  type TableSort,
  type Tone,
  type TourStep,
} from '@/design-system'
import TourArt from './parts/TourArt.vue'
import {
  categories,
  heatmapDays,
  heatmapHours,
  heatmapOrders,
  kpis,
  summaryInsight,
  summaryLabels,
  summarySales,
  summaryTicks,
  transactions,
  type PaymentStatus,
} from './data/sales'

/* ── Navigation ─────────────────────────────────────────────────────────── */
const section = ref('overview')
const sections = [
  { label: 'Overview', value: 'overview' },
  { label: 'Performance', value: 'performance' },
  { label: 'Activity', value: 'activity' },
  { label: 'Product', value: 'product' },
  { label: 'Task', value: 'task' },
]

const view = ref('summary')
const views = [
  { label: 'Summary', value: 'summary' },
  { label: 'Insight', value: 'insight' },
  { label: 'Service', value: 'service' },
  { label: 'Analytic', value: 'analytic' },
  { label: 'Target', value: 'target' },
]

const unbuilt = computed(() => {
  if (section.value !== 'overview') return sections.find((s) => s.value === section.value)?.label
  if (view.value !== 'summary') return views.find((v) => v.value === view.value)?.label
  return null
})

function backToOverview() {
  section.value = 'overview'
  view.value = 'summary'
}

/* ── Display settings ───────────────────────────────────────────────────── */
const settingsOpen = ref(false)
const showCents = ref(false)
const compactBalance = ref(false)
const settingsItems = computed<MenuItem[]>(() => [
  { heading: true, label: 'Numbers' },
  {
    id: 'cents',
    label: 'Show cents on revenue',
    checked: showCents.value,
    keepOpen: true,
    onSelect: () => (showCents.value = !showCents.value),
  },
  {
    id: 'compact',
    label: 'Short balance (9.4M)',
    checked: compactBalance.value,
    keepOpen: true,
    onSelect: () => (compactBalance.value = !compactBalance.value),
  },
])

/* ── Date range ─────────────────────────────────────────────────────────── */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const formatDay = (iso: string, withYear = true) => {
  const [y, m, d] = iso.split('-').map(Number)
  return withYear ? `${d} ${MONTHS[m - 1]} ${y}` : `${d} ${MONTHS[m - 1]}`
}

const rangeOpen = ref(false)
const range = ref({ from: '2025-06-01', to: '2026-06-15' })
const draftRange = ref({ ...range.value })
const rangeError = computed(() => (draftRange.value.from > draftRange.value.to ? 'The start date is after the end date.' : ''))

function openRange() {
  draftRange.value = { ...range.value }
  rangeOpen.value = true
}

function applyRange() {
  if (rangeError.value || !draftRange.value.from || !draftRange.value.to) return
  range.value = { ...draftRange.value }
  rangeOpen.value = false
}

const rangeMenuOpen = ref(false)
const compare = ref(true)
const weekends = ref(true)
const rangeMenu = computed<MenuItem[]>(() => [
  {
    id: 'compare',
    label: 'Compare with last period',
    checked: compare.value,
    keepOpen: true,
    onSelect: () => (compare.value = !compare.value),
  },
  {
    id: 'weekends',
    label: 'Include weekends',
    checked: weekends.value,
    keepOpen: true,
    onSelect: () => (weekends.value = !weekends.value),
  },
  { divider: true },
  {
    id: 'reset',
    label: 'Reset range',
    icon: RotateCcw,
    onSelect: () => (range.value = { from: '2025-06-01', to: '2026-06-15' }),
  },
])

/* ── Sales summary ──────────────────────────────────────────────────────── */
const year = ref<'this' | 'last'>('this')
const yearOpen = ref(false)
const yearLabel = computed(() => (year.value === 'this' ? 'This year' : 'Last year'))
const yearItems = computed<MenuItem[]>(() => [
  { id: 'this', label: 'This year', checked: year.value === 'this', onSelect: () => (year.value = 'this') },
  { id: 'last', label: 'Last year', checked: year.value === 'last', onSelect: () => (year.value = 'last') },
])

const mode = ref<'both' | 'sales' | 'insight'>('both')
const modeOpen = ref(false)
const modeLabel = computed(() => ({ both: 'Summary', sales: 'Sales only', insight: 'Insight only' })[mode.value])
const modeItems = computed<MenuItem[]>(() => [
  { id: 'both', label: 'Sales and insight', checked: mode.value === 'both', onSelect: () => (mode.value = 'both') },
  { id: 'sales', label: 'Sales only', checked: mode.value === 'sales', onSelect: () => (mode.value = 'sales') },
  { id: 'insight', label: 'Insight only', checked: mode.value === 'insight', onSelect: () => (mode.value = 'insight') },
])

// Last year: the same shape, about a fifth lower and a little flatter.
const lastYear = (values: number[]) => values.map((v, i) => Math.round((v * (0.74 + ((i * 7) % 10) / 100)) / 100) * 100)

const chartSeries = computed(() => {
  const sales = year.value === 'this' ? summarySales : lastYear(summarySales)
  const insight = year.value === 'this' ? summaryInsight : lastYear(summaryInsight)
  const all = [
    { name: 'Sales', values: sales },
    { name: 'Insight', values: insight, color: 'var(--r-chart-1-soft)' },
  ]
  if (mode.value === 'sales') return [all[0]]
  if (mode.value === 'insight') return [{ ...all[1], color: 'var(--r-chart-1)' }]
  return all
})

// On a phone, a label for every month collides; show the quarters instead.
const narrow = ref(false)
let narrowQuery: MediaQueryList | null = null
const onNarrow = (event: MediaQueryListEvent) => (narrow.value = event.matches)
onMounted(() => {
  narrowQuery = window.matchMedia('(max-width: 640px)')
  narrow.value = narrowQuery.matches
  narrowQuery.addEventListener('change', onNarrow)
})
onBeforeUnmount(() => narrowQuery?.removeEventListener('change', onNarrow))
const chartTicks = computed(() => (narrow.value ? summaryTicks.map((t, i) => (i % 6 === 0 ? t : '')) : summaryTicks))

const chartTotal = computed(() =>
  chartSeries.value.reduce((sum, s) => sum + s.values.reduce((a, b) => a + (b ?? 0), 0), 0),
)

const cardMenuOpen = ref(false)
const copied = ref(false)
const cardMenu: MenuItem[] = [
  { id: 'csv', label: 'Download as CSV', icon: Download, onSelect: () => downloadSummary() },
  {
    id: 'link',
    label: 'Copy link to this chart',
    icon: Copy,
    onSelect: () => {
      navigator.clipboard?.writeText(`${location.href.split('#')[0]}#/examples/sales`).catch(() => {})
      copied.value = true
      window.setTimeout(() => (copied.value = false), 1800)
    },
  },
]

function download(name: string, rows: (string | number)[][]) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const link = Object.assign(document.createElement('a'), { href: url, download: name })
  link.click()
  URL.revokeObjectURL(url)
}

function downloadSummary() {
  download('sales-summary.csv', [
    ['Period', ...chartSeries.value.map((s) => s.name)],
    ...summaryLabels.map((label, i) => [label, ...chartSeries.value.map((s) => s.values[i] ?? 0)]),
  ])
}

function exportData() {
  download('transactions.csv', [
    ['Invoice', 'Customer', 'Email', 'Product', 'Date', 'Amount', 'Status'],
    ...transactions.map((t) => [t.id, t.customer, t.email, t.product, t.date, t.amount, t.status]),
  ])
}

/* ── KPI cards ──────────────────────────────────────────────────────────── */
const revenueValue = computed(() => (showCents.value ? kpis.revenue.value + 0.43 : kpis.revenue.value))
const balanceText = computed(() =>
  compactBalance.value
    ? `$${formatCompact(kpis.balance.value, { maximumFractionDigits: 1 })}`
    : formatCurrency(kpis.balance.value),
)
const insightWave = [30, 34, 31, 38, 35, 44, 40, 47, 42, 39, 45, 41, 48, 44, 50]

const balanceMenuOpen = ref(false)
const balanceMenu: MenuItem[] = [
  { id: 'statement', label: 'Open statement', icon: ArrowUpRight },
  { id: 'targets', label: 'Edit targets', icon: Settings },
]

/* ── Transactions ───────────────────────────────────────────────────────── */
const sort = ref<TableSort | null>({ key: 'date', direction: 'desc' })
const columns: TableColumn[] = [
  { key: 'customer', label: 'Customer', sortable: true },
  { key: 'product', label: 'Product' },
  { key: 'date', label: 'Date', sortable: true },
  { key: 'amount', label: 'Amount', numeric: true, sortable: true },
  { key: 'status', label: 'Status', sortable: true },
]
const statusTone: Record<PaymentStatus, Tone> = {
  Paid: 'success',
  Pending: 'warning',
  Refunded: 'neutral',
  Failed: 'danger',
}
const peaks = computed(() => {
  const cells = heatmapOrders.flatMap((row, r) => row.map((orders, c) => ({ orders, label: `${heatmapDays[c]} ${heatmapHours[r]}` })))
  const sorted = [...cells].sort((a, b) => b.orders - a.orders)
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  return { busiest: `${first.label}, ${first.orders} orders`, quietest: `${last.label}, ${last.orders} orders` }
})

const money = (v: number) => formatCurrency(v, 'USD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/* ── Tour ───────────────────────────────────────────────────────────────── */
const tourOpen = ref(false)
const tourStep = ref(0)
const tourArt = ['kpi', 'chart', 'gauge', 'table'] as const
const steps: TourStep[] = [
  {
    target: '#sales-kpis',
    title: 'Your headline numbers',
    body: 'Revenue, insight and balance for the dates you picked. The blue card is the one to watch.',
    placement: 'bottom',
    mediaTone: 'brand',
  },
  {
    target: '#sales-summary',
    title: 'Sales over time',
    body: 'Each column is half a month. Hover a column, or focus the chart and use the arrow keys, to read the numbers.',
    placement: 'bottom',
    mediaTone: 'violet',
  },
  {
    target: '#sales-category',
    title: 'Where sales come from',
    body: 'Hover a part of the arc and its share shows up in the middle.',
    placement: 'left',
    mediaTone: 'sky',
  },
  {
    target: '#sales-transactions',
    title: 'Recent transactions',
    body: 'The latest orders and how they were paid. Click a column header to sort.',
    placement: 'top',
    mediaTone: 'success',
  },
]

// Each step swaps the coachmark, which drops focus; hand it to the new step's main button.
watch(tourStep, () => {
  if (!tourOpen.value) return
  nextTick(() =>
    requestAnimationFrame(() =>
      document.querySelector<HTMLElement>('.r-tour .r-coachmark .r-button--solid')?.focus({ preventScroll: true }),
    ),
  )
})

function startTour() {
  backToOverview()
  tourStep.value = 0
  tourOpen.value = true
}
</script>

<template>
  <div class="sales">
    <div class="sales__inner">
      <header class="sales__topbar">
        <a class="sales__brand" href="#/examples/sales" aria-label="Arus, sales overview">
          <svg class="sales__logo" viewBox="0 0 32 32" aria-hidden="true">
            <rect width="32" height="32" rx="10" />
            <path d="M9 20.5c2.6-6.4 5.5-9.5 8.2-9.5 3.2 0 2.3 8.6 5.8 9.6" />
          </svg>
          <span>Arus</span>
        </a>
        <div class="sales__nav">
          <RSegmented v-model="section" :options="sections" variant="pill" label="Sections" class="sales__pills" />
        </div>
        <div class="sales__icons">
          <RIconButton label="Search">
            <Search />
          </RIconButton>
          <RIconButton label="Notifications, 3 unread" dot>
            <Bell />
          </RIconButton>
          <RAvatar name="Nadia Putri" size="lg" status="online" />
        </div>
      </header>

      <main class="sales__page" aria-labelledby="sales-title">
      <div class="sales__head">
        <div>
          <h1 id="sales-title" class="sales__title">Sales overview</h1>
          <p class="sales__subtitle">How the shop did between {{ formatDay(range.from) }} and {{ formatDay(range.to) }}.</p>
        </div>
        <div class="sales__head-actions">
          <RButton variant="soft" tone="brand" shape="pill" @click="startTour">
            <template #leading><Sparkles /></template>
            Take the tour
          </RButton>
          <RButton variant="outline" shape="pill" @click="exportData">
            <template #leading><Download /></template>
            Export data
          </RButton>
          <RPopover v-model:open="settingsOpen" kind="menu" placement="bottom-end">
            <template #trigger>
              <RIconButton label="Display settings">
                <Settings />
              </RIconButton>
            </template>
            <RMenu :items="settingsItems" label="Display settings" @close="settingsOpen = false" />
          </RPopover>
        </div>
      </div>

      <div class="sales__subrow">
        <div class="sales__nav sales__nav--sub">
          <RSegmented v-model="view" :options="views" variant="pill" size="sm" label="View" class="sales__pills" />
        </div>
        <div class="sales__dates">
          <RPopover v-model:open="rangeOpen" placement="bottom-end" label="Date range" width="320px">
            <template #trigger>
              <RIconButton label="Change date range" @click="draftRange = { ...range }">
                <Calendar />
              </RIconButton>
            </template>
            <form class="sales__range" @submit.prevent="applyRange">
              <p class="sales__range-title">Date range</p>
              <div class="sales__range-fields">
                <RInput v-model="draftRange.from" type="date" label="From" />
                <RInput v-model="draftRange.to" type="date" label="To" />
              </div>
              <p v-if="rangeError" class="sales__range-error" role="alert">{{ rangeError }}</p>
              <div class="sales__range-actions">
                <RButton variant="ghost" size="sm" @click="rangeOpen = false">Cancel</RButton>
                <RButton type="submit" size="sm" :disabled="!!rangeError">Apply</RButton>
              </div>
            </form>
          </RPopover>
          <RChip @click="openRange">{{ formatDay(range.from) }}</RChip>
          <RChip @click="openRange">{{ formatDay(range.to) }}</RChip>
          <RPopover v-model:open="rangeMenuOpen" kind="menu" placement="bottom-end">
            <template #trigger>
              <RIconButton label="More date options">
                <MoreHorizontal />
              </RIconButton>
            </template>
            <RMenu :items="rangeMenu" label="Date options" @close="rangeMenuOpen = false" />
          </RPopover>
        </div>
      </div>

      <RCard v-if="unbuilt" class="sales__unbuilt" padding="lg">
        <LayoutDashboard class="sales__unbuilt-icon" />
        <h2 class="sales__card-title">{{ unbuilt }} is not part of this example</h2>
        <p class="sales__unbuilt-text">Overview with the Summary view is fully built. Everything else is here to show the navigation.</p>
        <div>
          <RButton @click="backToOverview">
            Back to overview
            <template #trailing><ArrowRight /></template>
          </RButton>
        </div>
      </RCard>

      <template v-else>
        <section id="sales-kpis" class="sales__kpis" aria-label="Key numbers">
          <RCard variant="brand">
            <template #header><h2 class="sales__card-title">Overall revenue</h2></template>
            <template #actions>
              <RIconButton label="Open revenue report" variant="soft">
                <ArrowUpRight />
              </RIconButton>
            </template>
            <RStat
              :value="revenueValue"
              prefix="$"
              size="xl"
              :decimals="showCents ? 2 : 0"
              muted-decimals
              :trend="kpis.revenue.trend"
              trend-label="than last month"
              animate
            />
          </RCard>

          <RCard class="sales__insight">
            <div class="sales__insight-wave" aria-hidden="true">
              <RSparkline :values="insightWave" color="var(--r-danger)" :height="96" :stroke-width="1.5" />
            </div>
            <template #header><h2 class="sales__card-title">Total insight</h2></template>
            <template #actions>
              <RIconButton label="Open insight report">
                <ArrowUpRight />
              </RIconButton>
            </template>
            <RStat :value="kpis.insight.value" size="xl" :trend="kpis.insight.trend" trend-label="than last month" animate />
          </RCard>

          <RCard class="sales__balance">
            <template #header><h2 class="sales__card-title">Finance balance</h2></template>
            <template #actions>
              <RPopover v-model:open="balanceMenuOpen" kind="menu" placement="bottom-end">
                <template #trigger>
                  <RIconButton label="Finance balance options">
                    <MoreHorizontal />
                  </RIconButton>
                </template>
                <RMenu :items="balanceMenu" label="Finance balance" @close="balanceMenuOpen = false" />
              </RPopover>
            </template>
            <RStat :value="balanceText" size="lg" />
            <RMeter
              :segments="kpis.balance.segments"
              gradient
              :height="40"
              legend
              :format="(v) => formatCurrency(v)"
              label="Balance split: profit 54%, total earning 25%, total target 21%"
            />
          </RCard>
        </section>

        <section class="sales__main">
          <RCard id="sales-summary" class="sales__summary">
            <template #header>
              <h2 class="sales__card-title">Sales summary</h2>
              <p class="sales__card-sub">
                {{ formatCompact(chartTotal) }} in {{ yearLabel.toLowerCase() }}, counted twice a month
              </p>
            </template>
            <template #actions>
              <RPopover v-model:open="yearOpen" kind="menu" placement="bottom-end">
                <template #trigger>
                  <RButton variant="outline" size="sm" shape="pill">
                    {{ yearLabel }}
                    <template #trailing><ChevronDown /></template>
                  </RButton>
                </template>
                <RMenu :items="yearItems" label="Year" @close="yearOpen = false" />
              </RPopover>
              <RPopover v-model:open="modeOpen" kind="menu" placement="bottom-end">
                <template #trigger>
                  <RButton variant="outline" size="sm" shape="pill" class="sales__hide-sm">
                    {{ modeLabel }}
                    <template #trailing><ChevronDown /></template>
                  </RButton>
                </template>
                <RMenu :items="modeItems" label="Series" @close="modeOpen = false" />
              </RPopover>
              <RPopover v-model:open="cardMenuOpen" kind="menu" placement="bottom-end">
                <template #trigger>
                  <RIconButton label="More options for sales summary" size="sm">
                    <MoreHorizontal />
                  </RIconButton>
                </template>
                <RMenu :items="cardMenu" label="Sales summary" @close="cardMenuOpen = false" />
              </RPopover>
            </template>
            <ul class="sales__legend" aria-hidden="true">
              <li v-for="s in chartSeries" :key="s.name">
                <span class="sales__legend-dot" :style="{ background: s.color ?? 'var(--r-chart-1)' }" />
                {{ s.name }}
              </li>
              <li v-if="copied" class="sales__copied">Link copied</li>
            </ul>
            <RDotMatrixChart
              :labels="summaryLabels"
              :ticks="chartTicks"
              :series="chartSeries"
              :height="300"
              :max="100000"
              label="Sales and insight, counted twice a month"
            />
          </RCard>

          <RCard id="sales-category" class="sales__category">
            <template #header><h2 class="sales__card-title">Sales category</h2></template>
            <template #actions>
              <RIconButton label="Open category report">
                <ArrowUpRight />
              </RIconButton>
            </template>
            <RRadialGauge :segments="categories" caption="Product sales" label="Product sales by category" />
            <template #footer>
              <p class="sales__note">
                <RTrend :value="12.2" />
                <span>You sold 2,921 items compared to last month</span>
              </p>
            </template>
          </RCard>
        </section>

        <section class="sales__bottom">
          <RCard id="sales-transactions" class="sales__transactions" padding="none">
            <template #header>
              <h2 class="sales__card-title">Recent transactions</h2>
              <p class="sales__card-sub">The last 48 hours</p>
            </template>
            <template #actions>
              <RButton variant="outline" size="sm" shape="pill">
                View all
                <template #trailing><ArrowRight /></template>
              </RButton>
            </template>
            <RTable v-model:sort="sort" :columns="columns" :rows="transactions" row-key="id" caption="Recent transactions">
              <template #cell-customer="{ row }">
                <span class="sales__customer">
                  <RAvatar :name="row.customer" size="md" decorative />
                  <span>
                    <span class="sales__customer-name">{{ row.customer }}</span>
                    <span class="sales__customer-email">{{ row.email }}</span>
                  </span>
                </span>
              </template>
              <template #cell-date="{ value }">
                <span class="sales__muted">{{ formatDay(value, false) }}</span>
              </template>
              <template #cell-amount="{ value }">{{ money(value) }}</template>
              <template #cell-status="{ value }">
                <RBadge :tone="statusTone[value as PaymentStatus]" dot>{{ value }}</RBadge>
              </template>
            </RTable>
          </RCard>

          <RCard class="sales__orders" title="Orders by hour" subtitle="Last four weeks, all channels" title-as="h2">
            <RHeatmap
              :rows="heatmapHours"
              :cols="heatmapDays"
              :values="heatmapOrders"
              :cell-height="30"
              label="Orders by time of day and weekday"
            />
            <dl class="sales__peaks">
              <div>
                <dt>Busiest</dt>
                <dd>{{ peaks.busiest }}</dd>
              </div>
              <div>
                <dt>Quietest</dt>
                <dd>{{ peaks.quietest }}</dd>
              </div>
            </dl>
          </RCard>
        </section>
      </template>
      </main>
    </div>

    <RTour v-model:open="tourOpen" v-model:step="tourStep" :steps="steps">
      <template #media="{ index }">
        <TourArt :variant="tourArt[index]" />
      </template>
    </RTour>
  </div>
</template>

<style>
.sales {
  min-height: 100dvh;
  padding: 24px 32px 112px;
  background: var(--r-bg-canvas);
}

.sales__inner,
.sales__page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.sales__inner {
  max-width: 1400px;
  margin: 0 auto;
}

/* Top bar */
.sales__topbar {
  display: flex;
  align-items: center;
  gap: 24px;
}

.sales__brand {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 10px;
  color: var(--r-text);
  font-size: var(--r-text-xl);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-tight);
  text-decoration: none;
}

.sales__logo {
  width: 32px;
  height: 32px;
}
.sales__logo rect {
  fill: var(--r-ink);
}
.sales__logo path {
  fill: none;
  stroke: var(--r-on-ink);
  stroke-width: 2.6;
  stroke-linecap: round;
}

.sales__nav {
  display: flex;
  flex: 1;
  justify-content: center;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;
}
.sales__nav::-webkit-scrollbar {
  display: none;
}
.sales__nav--sub {
  flex: 1 1 320px;
  justify-content: flex-start;
}
.sales__pills.r-segmented--pill {
  flex-wrap: nowrap;
  padding: 3px;
}

.sales__icons {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
}

/* Heading */
.sales__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.sales__title {
  font-size: clamp(30px, 4.2vw, 46px);
  font-weight: var(--r-weight-semibold);
  line-height: 1.04;
  letter-spacing: var(--r-tracking-tighter);
}

.sales__subtitle {
  margin-top: 8px;
  color: var(--r-text-tertiary);
}

.sales__head-actions,
.sales__dates {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.sales__subrow {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.sales__range {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.sales__range-title {
  font-weight: var(--r-weight-semibold);
}
.sales__range-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.sales__range-error {
  color: var(--r-danger-text);
  font-size: var(--r-text-xs);
}
.sales__range-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* Cards */
.sales__card-title {
  font-size: var(--r-text-xl);
  font-weight: var(--r-weight-semibold);
  line-height: 1.3;
  letter-spacing: var(--r-tracking-snug);
}

.sales__card-sub {
  margin-top: 2px;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-sm);
}

.sales__kpis {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.sales__kpis .r-card {
  justify-content: space-between;
  min-height: 210px;
}

.sales__insight {
  overflow: hidden;
}
.sales__insight-wave {
  position: absolute;
  z-index: -1;
  right: 0;
  bottom: 22px;
  left: 56%;
  opacity: 0.3;
  pointer-events: none;
}

.sales__balance .r-stat {
  margin-top: -4px;
}

.sales__main,
.sales__bottom {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: 16px;
}

.sales__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 18px;
  margin-top: -4px;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}
.sales__legend li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.sales__legend-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}
.sales__copied {
  margin-left: auto;
  color: var(--r-success-text);
}

.sales__category {
  justify-content: space-between;
}
.sales__category .r-gauge {
  margin-top: 8px;
}

.sales__note {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 8px 14px 8px 8px;
  border: 1px solid var(--r-border);
  border-radius: var(--r-radius-full);
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
  text-align: center;
}

.sales__transactions {
  overflow: hidden;
}

.sales__peaks {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin: auto 0 0;
}
.sales__peaks > div {
  padding: 12px 14px;
  border-radius: var(--r-radius-lg);
  background: var(--r-bg-muted);
}
.sales__peaks dt {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}
.sales__peaks dd {
  margin: 2px 0 0;
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
  font-variant-numeric: tabular-nums;
}

.sales__customer {
  display: flex;
  align-items: center;
  gap: 12px;
}
.sales__customer > span:last-child {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}
.sales__customer-name {
  font-weight: var(--r-weight-medium);
}
.sales__customer-email,
.sales__muted {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-sm);
}

.sales__unbuilt {
  align-items: flex-start;
  max-width: 560px;
}
.sales__unbuilt-icon {
  width: 28px;
  height: 28px;
  color: var(--r-brand);
}
.sales__unbuilt-text {
  color: var(--r-text-secondary);
  line-height: 1.6;
}

@media (max-width: 1180px) {
  .sales__kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .sales__balance {
    grid-column: span 2;
  }
  .sales__main,
  .sales__bottom {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 860px) {
  .sales__topbar {
    flex-wrap: wrap;
    gap: 16px;
  }
  .sales__topbar > .sales__nav {
    order: 3;
    flex-basis: 100%;
    justify-content: flex-start;
  }
  .sales__icons {
    margin-left: auto;
  }
}

@media (max-width: 680px) {
  .sales {
    padding: 16px 16px 112px;
  }
  .sales__inner {
    gap: 20px;
  }
  .sales__kpis {
    grid-template-columns: minmax(0, 1fr);
  }
  .sales__balance {
    grid-column: auto;
  }
  .sales__kpis .r-card {
    min-height: 0;
  }
  .sales__hide-sm {
    display: none;
  }
  .sales__card-title {
    font-size: var(--r-text-lg);
  }
}
</style>
