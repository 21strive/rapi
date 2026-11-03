<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  Calendar,
  ChevronDown,
  Compass,
  Copy,
  Download,
  MoreHorizontal,
  RotateCcw,
  Search,
  Settings,
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
  RStatus,
  RSupergraphic,
  RTable,
  RTabs,
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
import ExampleStrip from './parts/ExampleStrip.vue'
import AppMark from './parts/AppMark.vue'
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
  // Identity colours stay with their series when the other one is hidden.
  const all = [
    { name: 'Sales', values: sales, color: 'var(--r-chart-1)' },
    { name: 'Insight', values: insight, color: 'var(--r-chart-2)' },
  ]
  if (mode.value === 'sales') return [all[0]]
  if (mode.value === 'insight') return [all[1]]
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
    body: 'Revenue, insight and balance for the dates you picked. The cobalt panel is the one to watch.',
    placement: 'bottom',
    mediaTone: 'brand',
  },
  {
    target: '#sales-summary',
    title: 'Sales over time',
    body: 'Each column is half a month. Hover a column, or focus the chart and use the arrow keys, to read the numbers.',
    placement: 'bottom',
    mediaTone: 'brand',
  },
  {
    target: '#sales-category',
    title: 'Where sales come from',
    body: 'Hover a part of the arc and its share shows up in the middle.',
    placement: 'left',
    mediaTone: 'brand',
  },
  {
    target: '#sales-transactions',
    title: 'Recent transactions',
    body: 'The latest orders and how they were paid. Click a column header to sort.',
    placement: 'top',
    mediaTone: 'brand',
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
    <ExampleStrip>
      <span>Arus</span>
      <span class="ex-strip__sep">/</span>
      <span>Commerce</span>
      <span class="ex-strip__sep ex-strip__wide">/</span>
      <span class="ex-strip__wide">Sales overview</span>
      <template #end>
        <span class="ex-strip__wide">{{ formatDay(range.from) }} – {{ formatDay(range.to) }}</span>
        <RStatus tone="success" size="sm" label="Synced 14:02 WIB" />
      </template>
    </ExampleStrip>

    <header class="sales__bar">
      <a class="sales__brand" href="#/examples/sales" aria-label="Arus, sales overview">
        <AppMark glyph="arus" />
        <span>Arus</span>
      </a>
      <RTabs v-model="section" :items="sections" label="Sections" class="sales__tabs" />
      <div class="sales__icons">
        <RIconButton label="Search" variant="ghost">
          <Search />
        </RIconButton>
        <RIconButton label="Notifications, 3 unread" variant="ghost" dot>
          <Bell />
        </RIconButton>
        <RAvatar name="Nadia Putri" size="md" status="online" />
      </div>
    </header>

    <main class="sales__page" aria-labelledby="sales-title">
      <div class="sales__head">
        <div class="sales__heading">
          <p class="sales__eyebrow"><span class="r-index" aria-hidden="true">01</span> Commerce · Jakarta store</p>
          <h1 id="sales-title" class="sales__title">Sales overview</h1>
          <p class="sales__subtitle">How the shop did between {{ formatDay(range.from) }} and {{ formatDay(range.to) }}.</p>
        </div>
        <div class="sales__head-actions">
          <RButton variant="outline" @click="startTour">
            <template #leading><Compass /></template>
            Take the tour
          </RButton>
          <RButton @click="exportData">
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
        <div class="sales__views">
          <RSegmented v-model="view" :options="views" size="sm" label="View" />
        </div>
        <div class="sales__dates">
          <span class="sales__dates-label" aria-hidden="true">Range</span>
          <RPopover v-model:open="rangeOpen" placement="bottom-end" label="Date range" width="320px">
            <template #trigger>
              <RIconButton label="Change date range" size="sm" @click="draftRange = { ...range }">
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
          <RChip size="sm" @click="openRange">{{ formatDay(range.from) }}</RChip>
          <span class="sales__dates-arrow" aria-hidden="true">→</span>
          <RChip size="sm" @click="openRange">{{ formatDay(range.to) }}</RChip>
          <RPopover v-model:open="rangeMenuOpen" kind="menu" placement="bottom-end">
            <template #trigger>
              <RIconButton label="More date options" size="sm" variant="ghost">
                <MoreHorizontal />
              </RIconButton>
            </template>
            <RMenu :items="rangeMenu" label="Date options" @close="rangeMenuOpen = false" />
          </RPopover>
        </div>
      </div>

      <RCard v-if="unbuilt" class="sales__unbuilt" padding="lg">
        <RSupergraphic variant="construction" anchor="bottom-right" />
        <div class="sales__unbuilt-body">
          <p class="r-eyebrow">Not in this example</p>
          <h2 class="sales__unbuilt-title">{{ unbuilt }} is not built</h2>
          <p class="sales__unbuilt-text">
            Overview with the Summary view is fully built. Everything else is here to show the navigation.
          </p>
          <div>
            <RButton @click="backToOverview">
              Back to overview
              <template #trailing><ArrowRight /></template>
            </RButton>
          </div>
        </div>
      </RCard>

      <div v-else class="sales__board">
        <section id="sales-kpis" class="sales__grid sales__grid--kpis" aria-label="Key numbers">
          <RCard variant="brand" class="sales__kpi">
            <template #header>
              <h2 class="sales__panel-title"><span class="r-index" aria-hidden="true">02</span>Overall revenue</h2>
            </template>
            <template #actions>
              <RIconButton label="Open revenue report" variant="soft" size="sm">
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

          <RCard class="sales__kpi">
            <template #header>
              <h2 class="sales__panel-title"><span class="r-index" aria-hidden="true">03</span>Total insight</h2>
            </template>
            <template #actions>
              <RIconButton label="Open insight report" size="sm">
                <ArrowUpRight />
              </RIconButton>
            </template>
            <div class="sales__kpi-body">
              <RStat :value="kpis.insight.value" size="xl" :trend="kpis.insight.trend" trend-label="than last month" animate />
              <div class="sales__kpi-spark">
                <span class="sales__meta">Last 15 weeks</span>
                <RSparkline :values="insightWave" color="var(--r-chart-2)" :height="36" label="Insight, last 15 weeks" />
              </div>
            </div>
          </RCard>

          <RCard class="sales__kpi sales__balance">
            <template #header>
              <h2 class="sales__panel-title"><span class="r-index" aria-hidden="true">04</span>Finance balance</h2>
            </template>
            <template #actions>
              <RPopover v-model:open="balanceMenuOpen" kind="menu" placement="bottom-end">
                <template #trigger>
                  <RIconButton label="Finance balance options" size="sm">
                    <MoreHorizontal />
                  </RIconButton>
                </template>
                <RMenu :items="balanceMenu" label="Finance balance" @close="balanceMenuOpen = false" />
              </RPopover>
            </template>
            <RStat :value="balanceText" size="lg" />
            <RMeter
              :segments="kpis.balance.segments"
              :height="24"
              legend
              :format="(v) => formatCurrency(v)"
              label="Balance split: profit 54%, total earning 25%, total target 21%"
            />
          </RCard>
        </section>

        <!-- Reading order: the wide column top to bottom, then the narrow one. -->
        <section class="sales__grid sales__grid--main" aria-label="Sales and orders">
          <RCard id="sales-summary" class="sales__summary">
            <template #header>
              <h2 class="sales__panel-title"><span class="r-index" aria-hidden="true">05</span>Sales summary</h2>
              <p class="sales__panel-sub">
                {{ formatCompact(chartTotal) }} in {{ yearLabel.toLowerCase() }}, counted twice a month
              </p>
            </template>
            <template #actions>
              <RPopover v-model:open="yearOpen" kind="menu" placement="bottom-end">
                <template #trigger>
                  <RButton variant="outline" size="sm">
                    {{ yearLabel }}
                    <template #trailing><ChevronDown /></template>
                  </RButton>
                </template>
                <RMenu :items="yearItems" label="Year" @close="yearOpen = false" />
              </RPopover>
              <RPopover v-model:open="modeOpen" kind="menu" placement="bottom-end">
                <template #trigger>
                  <RButton variant="outline" size="sm" class="sales__hide-sm">
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
                <span class="sales__swatch" :style="{ background: s.color }" />
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

          <RCard id="sales-transactions" class="sales__transactions" padding="none">
            <template #header>
              <h2 class="sales__panel-title"><span class="r-index" aria-hidden="true">07</span>Recent transactions</h2>
              <p class="sales__panel-sub">The last 48 hours</p>
            </template>
            <template #actions>
              <RButton variant="ghost" size="sm">
                View all
                <template #trailing><ArrowRight /></template>
              </RButton>
            </template>
            <RTable v-model:sort="sort" :columns="columns" :rows="transactions" row-key="id" caption="Recent transactions">
              <template #cell-customer="{ row }">
                <span class="sales__customer">
                  <RAvatar :name="row.customer" size="sm" decorative />
                  <span>
                    <span class="sales__customer-name">{{ row.customer }}</span>
                    <span class="sales__customer-email">{{ row.email }}</span>
                  </span>
                </span>
              </template>
              <template #cell-date="{ value }">
                <span class="sales__date">{{ formatDay(value, false) }}</span>
              </template>
              <template #cell-amount="{ value }">{{ money(value) }}</template>
              <template #cell-status="{ value }">
                <RBadge :tone="statusTone[value as PaymentStatus]" dot>{{ value }}</RBadge>
              </template>
            </RTable>
          </RCard>

          <RCard id="sales-category" class="sales__category">
            <template #header>
              <h2 class="sales__panel-title"><span class="r-index" aria-hidden="true">06</span>Sales category</h2>
            </template>
            <template #actions>
              <RIconButton label="Open category report" size="sm">
                <ArrowUpRight />
              </RIconButton>
            </template>
            <RRadialGauge :segments="categories" caption="Product sales" label="Product sales by category" />
            <template #footer>
              <p class="sales__note">
                <RTrend :value="12.2" />
                <span>2,921 more items sold than last month</span>
              </p>
            </template>
          </RCard>

          <RCard class="sales__orders">
            <template #header>
              <h2 class="sales__panel-title"><span class="r-index" aria-hidden="true">08</span>Orders by hour</h2>
              <p class="sales__panel-sub">Last four weeks, all channels</p>
            </template>
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
      </div>
    </main>

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
  padding-bottom: 112px;
  background: var(--r-bg-canvas);
  color: var(--r-text);
}

/* ── Header bar: brand, sections as tabs on the bar's bottom rule, account ───── */
.sales__bar {
  display: flex;
  align-items: center;
  gap: 32px;
  height: 56px;
  padding: 0 24px;
  border-bottom: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}

.sales__brand {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 10px;
  color: var(--r-text);
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-tight);
  text-decoration: none;
}

/* The tab list's own bottom rule lands on the bar's rule. */
.sales__tabs {
  flex: 1;
  align-self: flex-end;
  margin-bottom: -1px;
}

.sales__icons {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 4px;
}
.sales__icons .r-avatar {
  margin-left: 8px;
}

/* ── Page ───────────────────────────────────────────────────────────────── */
.sales__page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1440px;
  margin: 0 auto;
  padding: 32px 24px 0;
}

.sales__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px 24px;
}

.sales__heading {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.sales__eyebrow {
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.sales__title {
  font-size: clamp(32px, 4.2vw, 48px);
  font-weight: var(--r-weight-semibold);
  line-height: 1;
  letter-spacing: var(--r-tracking-display);
}

.sales__subtitle {
  max-width: 56ch;
  color: var(--r-text-secondary);
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
  gap: 12px 16px;
  padding-top: 16px;
  border-top: 1px solid var(--r-border);
}

.sales__views {
  min-width: 0;
  max-width: 100%;
  overflow-x: auto;
  scrollbar-width: none;
}
.sales__views::-webkit-scrollbar {
  display: none;
}

.sales__dates-label,
.sales__meta {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-medium);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}
.sales__dates-label {
  margin-right: 4px;
}
.sales__dates-arrow {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
}

.sales__range {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.sales__range-title {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
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

/* ── The board: panels butt against each other on 1px rules ─────────────── */
.sales__board {
  display: flex;
  flex-direction: column;
}

/* Every cell is pulled 1px up and left, so neighbouring borders overlap into one rule. */
.sales__grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  padding: 1px 0 0 1px;
}
.sales__grid + .sales__grid {
  margin-top: -1px;
}
.sales__grid > .r-card {
  margin: -1px 0 0 -1px;
}

.sales__kpi {
  grid-column: span 2;
  justify-content: space-between;
  min-height: 200px;
}
.sales__summary {
  grid-area: 1 / 1 / span 1 / span 4;
}
.sales__transactions {
  grid-area: 2 / 1 / span 1 / span 4;
}
.sales__category {
  grid-area: 1 / 5 / span 1 / span 2;
}
.sales__orders {
  grid-area: 2 / 5 / span 1 / span 2;
}

.sales__panel-title {
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  line-height: 1.4;
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.sales__panel-sub {
  margin-top: 6px;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-sm);
}

.sales__kpi-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sales__kpi-spark {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 12px;
  border-top: 1px solid var(--r-border-subtle);
}

.sales__balance .r-stat {
  margin-top: -4px;
}

.sales__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 20px;
  margin-top: -4px;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-medium);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}
.sales__legend li {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.sales__swatch {
  width: 8px;
  height: 8px;
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
  gap: 8px 10px;
  width: 100%;
  padding-top: 14px;
  border-top: 1px solid var(--r-border-subtle);
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
}

.sales__transactions {
  overflow: hidden;
}

.sales__peaks {
  display: grid;
  grid-template-columns: 1fr 1fr;
  margin: auto 0 0;
  border-top: 1px solid var(--r-border);
}
.sales__peaks > div {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 0 0;
}
.sales__peaks > div + div {
  padding-left: 16px;
  border-left: 1px solid var(--r-border);
}
.sales__peaks dt {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-medium);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}
.sales__peaks dd {
  margin: 0;
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
  font-variant-numeric: tabular-nums;
}

.sales__customer {
  display: flex;
  align-items: center;
  gap: 10px;
}
.sales__customer > span:last-child {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}
.sales__customer-name {
  font-weight: var(--r-weight-medium);
}
.sales__customer-email {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-sm);
}
.sales__date {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
  text-transform: uppercase;
}

/* ── Views that are not built ───────────────────────────────────────────── */
.sales__unbuilt {
  min-height: 320px;
  overflow: hidden;
}
.sales__unbuilt-body {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  max-width: 520px;
}
.sales__unbuilt-title {
  font-size: var(--r-text-2xl);
  font-weight: var(--r-weight-semibold);
  line-height: 1.2;
  letter-spacing: var(--r-tracking-tight);
}
.sales__unbuilt-text {
  margin-bottom: 8px;
  color: var(--r-text-secondary);
  line-height: 1.6;
}

/* ── Narrower screens ───────────────────────────────────────────────────── */
@media (max-width: 1180px) {
  .sales__kpi,
  .sales__category,
  .sales__orders {
    grid-area: auto / auto / auto / span 3;
  }
  .sales__balance,
  .sales__summary,
  .sales__transactions {
    grid-area: auto / auto / auto / span 6;
  }
}

@media (max-width: 860px) {
  .sales__bar {
    flex-wrap: wrap;
    gap: 0 16px;
    height: auto;
    padding-top: 10px;
  }
  .sales__icons {
    margin-left: auto;
  }
  .sales__tabs {
    order: 3;
    flex-basis: 100%;
    margin-top: 6px;
  }
}

@media (max-width: 680px) {
  .sales__bar {
    padding-right: 16px;
    padding-left: 16px;
  }
  .sales__page {
    gap: 20px;
    padding: 24px 16px 0;
  }
  .sales__kpi,
  .sales__category,
  .sales__orders {
    grid-area: auto / auto / auto / span 6;
  }
  .sales__kpi {
    min-height: 0;
  }
  .sales__hide-sm {
    display: none;
  }
  .sales__dates-label {
    display: none;
  }
}
</style>
