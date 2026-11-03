<script setup lang="ts">
/**
 * 18 · Fleet operations. Depot Cikarang at 13:20 WIB: today's routes per vehicle, on-time
 * performance, exceptions to resolve, depot capacity and the vehicle list. A vehicle opens a
 * drawer with its spec and the day's stops.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Phone, Shuffle } from 'lucide-vue-next'
import {
  RAvatar,
  RBadge,
  RButton,
  RCard,
  RDialog,
  RGanttChart,
  RMeter,
  RSegmented,
  RSparkline,
  RSpecList,
  RStat,
  RStatus,
  RTable,
  RTimeline,
  RTrend,
  formatNumber,
  useToast,
  type GanttItem,
  type GanttRow,
  type SpecItem,
  type StatusTone,
  type TableColumn,
  type TimelineItem,
} from '@/design-system'
import SampleShell from '../_kit/SampleShell.vue'
import {
  DAY,
  KIND_TONE,
  NOW,
  STOP_TONE,
  TICKS,
  depot,
  depotNotes,
  exceptions as initialExceptions,
  history,
  hhmm,
  stopsOf,
  totals,
  vehicles,
  type Exception,
  type Vehicle,
} from './data'

const toast = useToast()

/* Phones get a shorter legend line in the Gantt header. */
const narrow = ref(false)
let mq: MediaQueryList | undefined
const onMedia = () => (narrow.value = !!mq?.matches)
onMounted(() => {
  mq = window.matchMedia('(max-width: 640px)')
  onMedia()
  mq.addEventListener('change', onMedia)
})
onBeforeUnmount(() => mq?.removeEventListener('change', onMedia))

/* ── Per-vehicle state at 13:20 ──────────────────────────────────────────────────── */
const view = vehicles.map((v) => {
  const stops = stopsOf(v)
  const done = stops.filter((s) => s.at <= NOW)
  const late = stops.filter((s) => s.status === 'Late')
  const failed = stops.filter((s) => s.status === 'Failed')
  const leg = v.legs.find((l) => l.start <= NOW && l.end > NOW)
  const next = stops.find((s) => s.status === 'Next')
  let status: { label: string; tone: StatusTone }
  if (late.length >= 2) status = { label: 'Running late', tone: 'signal' }
  else if (!leg) status = NOW < v.shift[0] ? { label: 'Not started', tone: 'neutral' } : { label: 'At depot', tone: 'success' }
  else if (leg.kind === 'break') status = { label: 'On break', tone: 'neutral' }
  else if (leg.kind === 'return') status = { label: 'Returning', tone: 'neutral' }
  else status = { label: 'On route', tone: 'brand' }
  const onTime = done.length ? ((done.length - late.length - failed.length) / done.length) * 100 : 100
  return { ...v, stops, done: done.length, total: stops.length, late: late.length, onTime, next, status }
})
type VehicleView = (typeof view)[number]

/* ── Routes Gantt ────────────────────────────────────────────────────────────────── */
const filter = ref<'all' | 'late'>('all')
const lateCount = view.filter((v) => v.late > 0).length
const filterOptions = [
  { label: `All vehicles ${view.length}`, value: 'all' },
  { label: `With late stops ${lateCount}`, value: 'late' },
]

function itemsOf(v: VehicleView): GanttItem[] {
  // Late arrivals cut into the leg: the orange bar runs from the planned time to the arrival.
  const marks = v.stops
    .filter((s) => s.status === 'Late' || s.status === 'Failed')
    .map((s) => ({
      start: s.status === 'Late' ? s.planned : s.at - 4,
      end: s.status === 'Late' ? s.at : s.at + 4,
      label: s.status === 'Late' ? `Stop ${s.n} late ${s.late} min` : `Stop ${s.n} failed`,
      tone: (s.status === 'Late' ? 'signal' : 'danger') as GanttItem['tone'],
    }))
  const out: GanttItem[] = []
  for (const leg of v.legs) {
    if (leg.kind === 'break') {
      out.push({ start: leg.start, end: leg.end, label: 'Break', tone: 'context', hatch: true })
      continue
    }
    const tone: GanttItem['tone'] = leg.end <= NOW || leg.kind === 'return' ? 'context' : 'brand'
    const label = leg.kind === 'return' ? 'Return' : `${leg.stops} stops`
    const inside = marks.filter((m) => m.start >= leg.start && m.start < leg.end).sort((a, b) => a.start - b.start)
    let cursor = leg.start
    let first = true
    for (const m of inside) {
      if (m.start > cursor) out.push({ start: cursor, end: m.start, label: first ? label : undefined, tone })
      first = false
      out.push(m)
      cursor = m.end
    }
    if (cursor < leg.end) out.push({ start: cursor, end: leg.end, label: first ? label : undefined, tone })
  }
  return out
}

const ganttRows = computed<GanttRow[]>(() =>
  view
    .filter((v) => filter.value === 'all' || v.late > 0)
    .map((v) => ({ id: v.id, label: v.plate, meta: `${v.driver.split(' ')[0]} · ${v.route}`, items: itemsOf(v) })),
)

/* ── KPIs ────────────────────────────────────────────────────────────────────────── */
const avg = (a: number[]) => a.slice(0, -1).reduce((s, x) => s + x, 0) / (a.length - 1)
const onTimeDelta = totals.onTime - avg(history.onTime)

/* ── Exceptions ──────────────────────────────────────────────────────────────────── */
const exceptions = ref<Exception[]>([...initialExceptions])
const resolvedCount = ref(9)
const RESOLUTION: Record<Exception['kind'], string> = {
  Late: 'Customer notified with the new arrival time',
  Failed: 'Second attempt booked for 15:30',
  Damaged: 'Replacement booked on tomorrow’s first wave',
}
function resolve(e: Exception) {
  exceptions.value = exceptions.value.filter((x) => x.id !== e.id)
  resolvedCount.value += 1
  toast.show({ title: `${e.stop.shipment} resolved`, body: `${RESOLUTION[e.kind]}. ${e.stop.customer}.`, tone: 'success' })
}

/* ── Vehicles table and drawer ───────────────────────────────────────────────────── */
const openId = ref<string | null>(null)
const drawerOpen = computed({
  get: () => openId.value != null,
  set: (v: boolean) => {
    if (!v) openId.value = null
  },
})
const current = computed(() => view.find((v) => v.id === openId.value) ?? null)

const columns: TableColumn<VehicleView>[] = [
  { key: 'plate', label: 'Vehicle', sortable: true },
  { key: 'driver', label: 'Driver', sortable: true },
  { key: 'route', label: 'Route', sortable: true },
  { key: 'done', label: 'Stops', width: '150px', sortable: true },
  { key: 'onTime', label: 'On time', numeric: true, sortable: true },
  { key: 'status', label: 'Status', sortable: true, sortValue: (r) => r.status.label },
]

const specOf = (v: Vehicle): SpecItem[] => [
  { label: 'Vehicle', value: v.type },
  { label: 'Load', value: `${formatNumber(v.loadKg)} of ${formatNumber(v.capacityKg)} kg`, mono: true },
  { label: 'Energy', value: v.energy, mono: true },
  { label: 'Odometer', value: `${formatNumber(v.odometer)} km`, mono: true },
  { label: 'Shift', value: `${hhmm(v.shift[0])} to ${hhmm(v.shift[1])} WIB`, mono: true },
  { label: 'Route', value: `${v.route} · Bekasi east`, mono: true },
]

const stopTimeline = computed<TimelineItem[]>(() =>
  (current.value?.stops ?? []).map((s) => ({
    id: s.n,
    time: hhmm(s.at),
    title: `${String(s.n).padStart(2, '0')} · ${s.customer}`,
    body: s.note ? `${s.address}. ${s.note}.` : s.address,
    meta: s.status === 'Late' ? `${s.late} min late` : s.status,
    tone: STOP_TONE[s.status],
  })),
)

function callDriver(v: VehicleView) {
  toast.show({ title: `Calling ${v.driver}`, body: `${v.phone} · ${v.plate}, route ${v.route}.`, tone: 'neutral' })
}
function reassign(v: VehicleView) {
  toast.show({ title: `${v.total - v.done} stops offered to nearby vans`, body: `From ${v.plate}. Drivers have 5 minutes to accept.`, tone: 'brand' })
  openId.value = null
}
</script>

<template>
  <SampleShell product="Fleet operations" padding="sm">
    <template #strip>
      <span class="s-fo-strip s-fo-hide-sm">Depot Cikarang · CKG-1</span>
    </template>
    <template #meta>
      <span class="s-fo-hide-sm">12 Nov 2026 · 13:20 WIB</span>
      <RStatus tone="success" size="sm" :label="`${view.length} vehicles out`" />
    </template>
    <template #header>
      <div class="s-fo-title">
        <p class="r-eyebrow">Bekasi and Cikarang · {{ view.length }} vehicles · {{ totals.stops }} stops today</p>
        <h1 class="sample-shell__title">Fleet operations</h1>
      </div>
    </template>
    <template #actions>
      <RSegmented v-model="filter" :options="filterOptions" size="sm" label="Show" />
    </template>

    <div class="s-fo">
      <!-- KPIs -->
      <div class="r-grid-ruled s-fo-kpis">
        <div class="s-fo-kpi">
          <RStat label="On time" :value="totals.onTime" :decimals="1" suffix="%" size="md">
            <template #footer>
              <RTrend :value="onTimeDelta" suffix=" pp" />
              <span class="s-fo-note">against the 13-day mean</span>
            </template>
          </RStat>
          <RSparkline :values="history.onTime" color="var(--r-chart-1)" :height="26" label="On-time rate over the last 14 working days" />
        </div>
        <div class="s-fo-kpi">
          <RStat label="Stops done" :value="totals.done" :unit="`of ${totals.stops}`" size="md">
            <template #footer><span class="s-fo-note">{{ Math.round((totals.done / totals.stops) * 100) }}% of today’s plan</span></template>
          </RStat>
          <RSparkline :values="history.stops" color="var(--r-chart-1)" :height="26" label="Stops per day over the last 14 working days" />
        </div>
        <div class="s-fo-kpi">
          <RStat label="Late stops" :value="totals.late" size="md">
            <template #footer><span class="s-fo-note">Mean {{ formatNumber(avg(history.late), { maximumFractionDigits: 1 }) }} a day</span></template>
          </RStat>
          <RSparkline :values="history.late" color="var(--r-chart-1)" :height="26" label="Late stops per day over the last 14 working days" />
        </div>
        <div class="s-fo-kpi">
          <RStat label="Failed deliveries" :value="totals.failed" size="md">
            <template #footer><span class="s-fo-note">Second attempts booked</span></template>
          </RStat>
          <RSparkline :values="history.failed" color="var(--r-chart-1)" :height="26" label="Failed deliveries per day over the last 14 working days" />
        </div>
        <div class="s-fo-kpi">
          <RStat label="Mean stop time" value="4:48" unit="min" size="md">
            <template #footer><span class="s-fo-note">{{ formatNumber(totals.km) }} km driven so far</span></template>
          </RStat>
          <RSparkline :values="history.stopTime" color="var(--r-chart-1)" :height="26" label="Mean minutes per stop over the last 14 working days" />
        </div>
      </div>

      <!-- 01 · Routes -->
      <RCard class="s-fo-routes" index="01" eyebrow="Today’s routes" title="06:00 to 20:00 WIB" :meta="narrow ? 'WIB' : 'Grey done · hatched break · orange late'" padding="sm">
        <div class="s-fo-scroll">
          <div class="s-fo-scroll__inner">
            <RGanttChart
              :rows="ganttRows"
              :domain="DAY"
              :ticks="TICKS"
              :format-tick="hhmm"
              :now="NOW"
              :row-height="32"
              :label-width="132"
              label="Routes by vehicle from 06:00 to 20:00 WIB. Delivery legs in cobalt, done legs grey, breaks hatched, late arrivals orange from the planned time to the arrival, failed stops red."
            />
          </div>
        </div>
      </RCard>

      <!-- 02 · Depot -->
      <RCard class="s-fo-depot" index="02" eyebrow="Depot capacity" meta="CKG-1" padding="sm">
        <ul class="s-fo-depot__list">
          <li v-for="d in depot" :key="d.label" class="s-fo-depot__item">
            <div class="s-fo-depot__head">
              <span class="r-label">{{ d.label }}</span>
              <span class="s-fo-mono">
                {{ d.unit === '%' ? `${d.used}%` : `${formatNumber(d.used)} of ${formatNumber(d.total)}` }}
                <span class="s-fo-dim">{{ d.unit === '%' ? 'full' : d.unit }}</span>
              </span>
            </div>
            <RMeter
              variant="segments"
              :value="(d.used / d.total) * 100"
              :count="d.total <= 16 ? d.total : 20"
              :tone="d.used / d.total >= 0.85 ? 'warning' : 'brand'"
              :height="10"
              :label="`${d.label}: ${d.used} of ${d.total} ${d.unit}`"
            />
          </li>
        </ul>
        <RSpecList :items="depotNotes" dense />
      </RCard>

      <!-- 03 · Exceptions -->
      <RCard class="s-fo-exceptions" index="03" eyebrow="Exceptions" :title="`${exceptions.length} open`" :meta="`${resolvedCount} resolved today`" padding="none">
        <ul v-if="exceptions.length" class="s-fo-exc">
          <li v-for="e in exceptions" :key="e.id" class="s-fo-exc__item">
            <div class="s-fo-exc__main">
              <div class="s-fo-exc__top">
                <RBadge :tone="KIND_TONE[e.kind]" size="sm" dot>{{ e.kind }}</RBadge>
                <span class="s-fo-mono">{{ e.stop.shipment }}</span>
                <span class="s-fo-mono s-fo-dim">{{ hhmm(e.stop.at) }}</span>
              </div>
              <p class="s-fo-exc__title">{{ e.stop.customer }}</p>
              <p class="s-fo-exc__body">{{ e.stop.note }} · {{ e.plate }}, {{ e.driver }}</p>
            </div>
            <div class="s-fo-exc__actions">
              <RButton size="xs" variant="ghost" @click="openId = e.vehicleId">Vehicle</RButton>
              <RButton size="xs" variant="outline" @click="resolve(e)">Resolve</RButton>
            </div>
          </li>
        </ul>
        <p v-else class="s-fo-empty">No open exceptions. New ones appear here as drivers report them.</p>
      </RCard>

      <!-- 04 · Vehicles -->
      <RCard class="s-fo-vehicles" index="04" eyebrow="Vehicles" :title="`${view.length} on shift`" meta="Select a row for its stops" padding="none">
        <RTable
          :columns="columns"
          :rows="view"
          row-key="id"
          density="compact"
          :selected="openId ? [openId] : []"
          caption="Vehicles on shift with route, stops done, on-time rate and status"
          @row-click="(row) => (openId = row.id)"
        >
          <template #cell-plate="{ row }">
            <button type="button" class="s-fo-plate" @click.stop="openId = row.id">{{ row.plate }}</button>
          </template>
          <template #cell-driver="{ row }">
            <span class="s-fo-driver"><RAvatar :name="row.driver" size="xs" decorative />{{ row.driver }}</span>
          </template>
          <template #cell-route="{ value }"><span class="s-fo-mono">{{ value }}</span></template>
          <template #cell-done="{ row }">
            <div class="s-fo-stops">
              <RMeter class="s-fo-stops__bar" :segments="[{ value: row.done, color: 'var(--r-chart-1)' }]" :max="row.total" :height="4" :label="`${row.done} of ${row.total} stops`" />
              <span class="s-fo-mono">{{ row.done }}/{{ row.total }}</span>
            </div>
          </template>
          <template #cell-onTime="{ row }">{{ formatNumber(row.onTime, { maximumFractionDigits: 0 }) }}%</template>
          <template #cell-status="{ row }">
            <RStatus :tone="row.status.tone" :label="row.status.label" size="sm" />
          </template>
        </RTable>
      </RCard>
    </div>

    <RDialog v-model:open="drawerOpen" side="right" size="md" :eyebrow="current ? `Route ${current.route}` : ''" :title="current?.plate">
      <div v-if="current" class="s-fo-drawer">
        <div class="s-fo-drawer__driver">
          <RAvatar :name="current.driver" size="md" />
          <div>
            <p class="s-fo-drawer__name">{{ current.driver }}</p>
            <p class="s-fo-mono s-fo-dim">{{ current.phone }}</p>
            <RStatus :tone="current.status.tone" :label="current.status.label" size="sm" />
          </div>
          <div class="s-fo-drawer__figures">
            <span class="r-label">Stops</span>
            <span class="s-fo-drawer__figure">{{ current.done }}/{{ current.total }}</span>
          </div>
          <div class="s-fo-drawer__figures">
            <span class="r-label">On time</span>
            <span class="s-fo-drawer__figure">{{ formatNumber(current.onTime, { maximumFractionDigits: 0 }) }}%</span>
          </div>
        </div>
        <RSpecList :items="specOf(current)" :columns="2" dense />
        <section>
          <h3 class="r-eyebrow s-fo-drawer__h">Stops today · {{ current.total }}</h3>
          <RTimeline :items="stopTimeline" dense />
        </section>
      </div>
      <template #footer>
        <RButton v-if="current" variant="outline" @click="callDriver(current)">
          <template #leading><Phone /></template>
          Call driver
        </RButton>
        <RButton v-if="current" tone="brand" @click="reassign(current)">
          <template #leading><Shuffle /></template>
          Offer remaining stops
        </RButton>
      </template>
    </RDialog>
  </SampleShell>
</template>

<style scoped>
.s-fo {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 12px;
}

.s-fo-strip {
  color: var(--r-text-secondary);
}

.s-fo-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.s-fo-title .r-eyebrow {
  color: var(--r-text-tertiary);
}

/* ── KPIs ──────────────────────────────────────────────────────────────── */
.s-fo-kpis {
  grid-column: 1 / -1;
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.s-fo-kpi {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 16px;
}

.s-fo-note {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

/* ── Routes and depot ──────────────────────────────────────────────────── */
.s-fo-routes {
  grid-column: span 9;
}

.s-fo-scroll {
  overflow-x: auto;
  overscroll-behavior-x: contain;
}

.s-fo-scroll__inner {
  min-width: 860px;
}

.s-fo-depot {
  grid-column: span 3;
}

.s-fo-depot__list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.s-fo-depot__item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.s-fo-depot__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.s-fo-depot .r-spec {
  margin-top: auto;
}

/* ── Exceptions ────────────────────────────────────────────────────────── */
.s-fo-exceptions {
  grid-column: span 5;
}

.s-fo-exc {
  border-top: 1px solid var(--r-border-subtle);
}

.s-fo-exc__item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--r-border-subtle);
}

.s-fo-exc__item:last-child {
  border-bottom: 0;
}

.s-fo-exc__main {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.s-fo-exc__top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 10px;
}

.s-fo-exc__title {
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-semibold);
}

.s-fo-exc__body {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.45;
}

.s-fo-exc__actions {
  display: flex;
  flex: none;
  gap: 4px;
}

.s-fo-empty {
  padding: 24px 16px;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-sm);
}

/* ── Vehicles ──────────────────────────────────────────────────────────── */
.s-fo-vehicles {
  grid-column: span 7;
}

.s-fo-plate {
  padding: 0;
  border: 0;
  background: none;
  color: var(--r-text);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-semibold);
  white-space: nowrap;
  cursor: pointer;
}

.s-fo-plate:hover {
  color: var(--r-brand-text);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.s-fo-driver {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.s-fo-stops {
  display: flex;
  align-items: center;
  gap: 10px;
}

.s-fo-stops__bar {
  flex: 1;
}

.s-fo-mono {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
}

.s-fo-dim {
  color: var(--r-text-tertiary);
}

/* ── Drawer ────────────────────────────────────────────────────────────── */
.s-fo-drawer {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.s-fo-drawer__driver {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--r-border);
}

.s-fo-drawer__name {
  margin-bottom: 2px;
  font-weight: var(--r-weight-semibold);
}

.s-fo-drawer__figures {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-left: auto;
}

.s-fo-drawer__figures + .s-fo-drawer__figures {
  margin-left: 16px;
}

.s-fo-drawer__figure {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xl);
  font-variant-numeric: tabular-nums;
}

.s-fo-drawer__h {
  margin-bottom: 10px;
  color: var(--r-text-secondary);
}

@media (max-width: 1199px) {
  .s-fo-kpis {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .s-fo-kpi:nth-child(n + 4) {
    grid-column: span 1;
  }
  .s-fo-routes,
  .s-fo-exceptions,
  .s-fo-vehicles {
    grid-column: 1 / -1;
  }
  .s-fo-depot {
    grid-column: 1 / -1;
  }
}

@media (max-width: 640px) {
  .s-fo-kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .s-fo-kpi:last-child {
    grid-column: span 2;
  }
  .s-fo-exc__item {
    flex-direction: column;
  }
  .s-fo-hide-sm {
    display: none;
  }
}
</style>
