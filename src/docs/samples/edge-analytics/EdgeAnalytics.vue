<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Download, Plus, RotateCcw } from 'lucide-vue-next'
import {
  RBarList,
  RButton,
  RCard,
  RChip,
  RColumnChart,
  RHeatmap,
  RLineChart,
  RMenu,
  RPopover,
  RReadout,
  RSegmented,
  RSelect,
  RSparkline,
  RStat,
  RStatus,
  RTabs,
  RTrend,
  formatCompact,
  formatNumber,
  useElementSize,
  useToast,
  type MenuItem,
} from '@/design-system'
import SampleShell from '../_kit/SampleShell.vue'
import {
  NOW_LABEL,
  bytes,
  filterDefs,
  rangeWords,
  ranges,
  scaled,
  slice,
  zones,
  type FilterId,
  type RangeId,
  type ZoneId,
} from './data'

const { show } = useToast()

/* ── Filter row: one slice for the whole screen ─────────────────────────── */
const range = ref<RangeId>('24h')
const zone = ref<ZoneId>('lintang')
const active = ref<FilterId[]>(['bots', 'health'])
const addOpen = ref(false)

const s = computed(() => slice(range.value, zone.value, active.value))
const words = computed(() => rangeWords[range.value])
const zoneName = computed(() => zones.find((z) => z.value === zone.value)?.label ?? '')

const activeDefs = computed(() => filterDefs.filter((f) => active.value.includes(f.id)))

function addFilter(id: FilterId) {
  const def = filterDefs.find((f) => f.id === id)!
  const others = active.value.filter((a) => filterDefs.find((f) => f.id === a)!.group !== def.group)
  active.value = [...others, id]
}

function removeFilter(id: FilterId) {
  active.value = active.value.filter((a) => a !== id)
}

const addItems = computed<MenuItem[]>(() => {
  const groups: [string, FilterId[]][] = [
    ['Traffic', ['bots', 'health']],
    ['Method', ['get', 'post']],
    ['Country', ['id', 'sg']],
  ]
  const items: MenuItem[] = []
  for (const [heading, ids] of groups) {
    const free = ids.filter((id) => !active.value.includes(id))
    if (!free.length) continue
    if (items.length) items.push({ divider: true })
    items.push({ heading: true, label: heading })
    for (const id of free) {
      const def = filterDefs.find((f) => f.id === id)!
      items.push({ id, label: `${def.field} ${def.value}`, onSelect: () => addFilter(id) })
    }
  }
  return items
})

/* ── KPI row ─────────────────────────────────────────────────────────────── */
const change = (cur: number, prev: number) => (prev ? ((cur - prev) / prev) * 100 : 0)

const kpis = computed(() => {
  const t = s.value.totals
  const p = s.value.previous
  const req = scaled(t.requests)
  const bw = bytes(t.bandwidth)
  const thr = scaled(t.threats, 1)
  return [
    {
      id: 'requests',
      label: 'Requests',
      value: req.value,
      decimals: 2,
      suffix: req.suffix,
      unit: '',
      trend: change(t.requests, p.requests),
      trendSuffix: '%',
      previous: scaled(p.requests).text,
      invert: false,
      spark: s.value.requests,
      sparkLabel: `Requests per ${words.value.bucket}, ${words.value.span}`,
    },
    {
      id: 'bandwidth',
      label: 'Bandwidth',
      value: bw.value,
      decimals: 2,
      suffix: '',
      unit: bw.unit,
      trend: change(t.bandwidth, p.bandwidth),
      trendSuffix: '%',
      previous: bytes(p.bandwidth).text,
      invert: false,
      spark: s.value.bandwidth,
      sparkLabel: `Bandwidth per ${words.value.bucket}, ${words.value.span}`,
    },
    {
      id: 'ratio',
      label: 'Cache hit ratio',
      value: t.ratio,
      decimals: 1,
      suffix: '%',
      unit: '',
      trend: t.ratio - p.ratio,
      trendSuffix: ' pp',
      previous: `${formatNumber(p.ratio, { maximumFractionDigits: 1, minimumFractionDigits: 1 })}%`,
      invert: false,
      spark: s.value.ratio,
      sparkLabel: `Cache hit ratio per ${words.value.bucket}, ${words.value.span}`,
    },
    {
      id: 'threats',
      label: 'Threats blocked',
      value: thr.value,
      decimals: 1,
      suffix: thr.suffix,
      unit: '',
      trend: change(t.threats, p.threats),
      trendSuffix: '%',
      previous: scaled(p.threats, 1).text,
      invert: true,
      spark: s.value.threats,
      sparkLabel: `Threats blocked per ${words.value.bucket}, ${words.value.span}`,
    },
  ]
})

/* ── Charts ──────────────────────────────────────────────────────────────── */
const compact = (v: number) => formatCompact(v, { maximumFractionDigits: 1 })
const whole = (v: number) => formatNumber(Math.round(v))

const requestSeries = computed(() => [
  { name: 'Cached', values: s.value.cached.map(Math.round), color: 'var(--r-chart-1)', area: true },
  { name: 'Uncached', values: s.value.uncached.map(Math.round), color: 'var(--r-chart-context)' },
])

const peak = computed(() => {
  const r = s.value.requests
  let i = 0
  r.forEach((v, k) => {
    if (v > r[i]) i = k
  })
  return { value: r[i], label: s.value.labels[i] }
})

type TopTab = 'paths' | 'countries' | 'agents'
const topTab = ref<TopTab>('paths')
const topTabs = computed(() => [
  { label: 'Paths', value: 'paths', count: s.value.counts.paths },
  { label: 'Countries', value: 'countries', count: s.value.counts.countries },
  { label: 'User agents', value: 'agents', count: s.value.counts.agents },
])
const topItems = computed(() =>
  topTab.value === 'paths' ? s.value.topPaths : topTab.value === 'countries' ? s.value.topCountries : s.value.topAgents,
)
const topLabel = computed(
  () => `Top ${topTab.value === 'agents' ? 'user agents' : topTab.value} by requests, ${zoneName.value}, ${words.value.span}`,
)

/* The heatmap names every column; under ~520px two-hour blocks keep the hour labels apart. */
const heatBox = ref<HTMLElement | null>(null)
const { width: heatWidth } = useElementSize(heatBox)
const heat = computed(() => {
  const h = s.value.heat
  if (!heatWidth.value || heatWidth.value >= 520) return h
  return {
    ...h,
    cols: h.cols.filter((_, i) => i % 2 === 0),
    values: h.values.map((row) => row.filter((_, i) => i % 2 === 0).map((v, i) => (v + row[i * 2 + 1]) / 2)),
  }
})

/* ── Live readout: the current hour's rate, sampled once a second ───────── */
const tick = ref(0)
let timer: number | undefined
onMounted(() => {
  timer = window.setInterval(() => (tick.value += 1), 1000)
})
onBeforeUnmount(() => clearInterval(timer))
const rpsLive = computed(() => {
  const wobble = Math.sin(tick.value * 1.7) * 0.035 + Math.sin(tick.value * 0.61) * 0.025
  return Math.round(s.value.rps * (1 + wobble))
})

function exportCsv() {
  const rows = s.value.labels.length
  show({
    title: 'Export ready',
    body: `analytics-${zone.value}-${range.value}.csv · ${rows} rows, ${activeDefs.value.length} filters applied.`,
    tone: 'success',
  })
}
</script>

<template>
  <SampleShell product="Edge" padding="none">
    <template #strip>
      <span class="s-edge-analytics__path">/ Lintang / Analytics</span>
    </template>
    <template #meta>
      <span class="s-edge-analytics__wide">Updated {{ NOW_LABEL }}</span>
      <span class="s-edge-analytics__narrow">11:47 WIB</span>
    </template>
    <template #header>
      <div class="s-edge-analytics__title">
        <p class="r-eyebrow">Account · Lintang</p>
        <h1 class="r-h3">Traffic analytics</h1>
      </div>
    </template>
    <template #actions>
      <div class="s-edge-analytics__live">
        <RStatus tone="signal" pulse size="sm" label="Live" />
        <RReadout
          label="Edge requests"
          :value="rpsLive"
          unit="req/s"
          font="pixel"
          size="sm"
          align="right"
          class="s-edge-analytics__readout"
        />
      </div>
      <RButton variant="outline" size="sm" @click="exportCsv">
        <template #leading><Download /></template>
        Export CSV
      </RButton>
    </template>

    <div class="s-edge-analytics__filters" role="group" aria-label="Filters">
      <RSegmented v-model="range" :options="ranges" size="sm" label="Time range" />
      <RSelect v-model="zone" :options="zones" size="sm" aria-label="Zone" class="s-edge-analytics__zone" />
      <span class="s-edge-analytics__rule" aria-hidden="true" />
      <RChip
        v-for="f in activeDefs"
        :key="f.id"
        size="sm"
        removable
        :remove-label="`Remove filter ${f.field} ${f.value}`"
        @remove="removeFilter(f.id)"
      >
        <span class="s-edge-analytics__chip-field">{{ f.field }}</span> {{ f.value }}
      </RChip>
      <RPopover v-if="addItems.length" v-model:open="addOpen" kind="menu" placement="bottom-start">
        <template #trigger>
          <RChip variant="dashed" size="sm">
            <template #leading><Plus /></template>
            Add filter
          </RChip>
        </template>
        <RMenu :items="addItems" label="Add filter" @close="addOpen = false" />
      </RPopover>
      <RButton v-if="active.length" variant="ghost" size="xs" @click="active = []">
        <template #leading><RotateCcw /></template>
        Clear
      </RButton>
      <span class="s-edge-analytics__compare r-label">Compared with the {{ words.previous }}</span>
    </div>

    <div class="s-edge-analytics__body">
      <section class="s-edge-analytics__kpis r-grid-ruled" aria-label="Key figures">
        <div v-for="(k, i) in kpis" :key="k.id" class="s-edge-analytics__kpi">
          <span class="r-index">{{ String(i + 1).padStart(2, '0') }}</span>
          <RStat :label="k.label" :value="k.value" :decimals="k.decimals" :suffix="k.suffix" :unit="k.unit" size="md">
            <template #footer>
              <RTrend :value="k.trend" :suffix="k.trendSuffix" :invert="k.invert" size="sm" />
              <span class="r-label">from {{ k.previous }}</span>
            </template>
          </RStat>
          <RSparkline :values="k.spark" color="var(--r-chart-1)" :height="34" :end-dot="true" :label="k.sparkLabel" />
        </div>
      </section>

      <div class="s-edge-analytics__row s-edge-analytics__row--a">
        <RCard
          index="05"
          eyebrow="Requests"
          title="Cached and uncached"
          :subtitle="`Peak ${compact(peak.value)} requests at ${peak.label}`"
          :meta="`Per ${words.bucket} · WIB`"
          class="s-edge-analytics__card"
        >
          <RLineChart
            :labels="s.labels"
            :series="requestSeries"
            :now="range === '24h' ? s.labels.length - 1 : null"
            :format="compact"
            y-unit="req"
            end-labels
            :height="236"
            :label="`Cached and uncached requests per ${words.bucket}, ${zoneName}, ${words.span}`"
          />
        </RCard>

        <RCard
          index="06"
          eyebrow="Top traffic"
          title="Where requests go"
          :subtitle="`${compact(s.totals.requests)} requests, ${words.span}`"
          class="s-edge-analytics__card"
        >
          <RTabs v-model="topTab" :items="topTabs" size="sm" label="Top traffic by">
            <div class="s-edge-analytics__top">
              <RBarList :items="topItems" :format="compact" :bar-height="10" :label="topLabel" />
            </div>
          </RTabs>
        </RCard>
      </div>

      <div class="s-edge-analytics__row s-edge-analytics__row--b">
        <RCard
          index="07"
          eyebrow="Responses"
          title="Status codes"
          :subtitle="`5xx rate ${formatNumber(s.totals.s5, { maximumFractionDigits: 2 })}%, peak ${formatNumber(s.peak5xx.rate, { maximumFractionDigits: 1 })}% at ${s.peak5xx.label}`"
          :meta="`Per ${words.bucket} · WIB`"
          class="s-edge-analytics__card"
        >
          <RColumnChart
            :labels="s.columnLabels"
            :series="s.status"
            :show-values="false"
            :format="whole"
            :axis-format="compact"
            y-unit="req"
            :height="232"
            :label="`Responses by status class per ${words.bucket}, ${zoneName}, ${words.span}`"
          />
        </RCard>

        <RCard
          index="08"
          eyebrow="Rhythm"
          title="Traffic by weekday and hour"
          subtitle="Average requests an hour"
          :meta="`${s.heat.span} · WIB`"
          class="s-edge-analytics__card"
        >
          <div ref="heatBox">
            <RHeatmap
              :rows="heat.rows"
              :cols="heat.cols"
              :values="heat.values"
              :format="(v: number) => `${compact(v)} req/h`"
              :cell-height="26"
              :label="`Average requests an hour by weekday and WIB hour, ${zoneName}, ${s.heat.span.toLowerCase()}`"
            />
          </div>
        </RCard>
      </div>
    </div>
  </SampleShell>
</template>

<style scoped>
.s-edge-analytics__path {
  color: var(--r-text-tertiary);
}
.s-edge-analytics__narrow {
  display: none;
}

.s-edge-analytics__title {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.s-edge-analytics__title .r-eyebrow {
  color: var(--r-text-tertiary);
}

.s-edge-analytics__live {
  display: inline-flex;
  align-items: center;
  gap: 16px;
  padding-right: 16px;
  margin-right: 4px;
  border-right: 1px solid var(--r-border);
}

/* One filter row above everything it scopes; it stays under the strip while the page scrolls. */
.s-edge-analytics__filters {
  position: sticky;
  top: 32px;
  z-index: var(--r-z-sticky);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-height: 48px;
  padding: 8px 24px;
  border-bottom: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}
.s-edge-analytics__zone {
  width: 200px;
}
.s-edge-analytics__rule {
  width: 1px;
  height: 20px;
  margin: 0 4px;
  background: var(--r-border);
}
.s-edge-analytics__chip-field {
  color: var(--r-text-tertiary);
}
.s-edge-analytics__compare {
  margin-left: auto;
}

.s-edge-analytics__body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px 24px 32px;
}

.s-edge-analytics__kpis {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.s-edge-analytics__kpi {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(96px, 40%);
  align-items: end;
  gap: 16px;
  padding: 16px 20px 16px;
}
.s-edge-analytics__kpi .r-index {
  position: absolute;
  top: 8px;
  right: 10px;
}

.s-edge-analytics__row {
  display: grid;
  gap: 16px;
}
.s-edge-analytics__row--a {
  grid-template-columns: minmax(0, 8fr) minmax(0, 4fr);
}
.s-edge-analytics__row--b {
  grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
}

.s-edge-analytics__top {
  padding-top: 14px;
}

@media (max-width: 1199px) {
  .s-edge-analytics__row--a,
  .s-edge-analytics__row--b {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 899px) {
  .s-edge-analytics__kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .s-edge-analytics__compare {
    width: 100%;
    margin-left: 0;
  }
}

@media (max-width: 640px) {
  .s-edge-analytics__path,
  .s-edge-analytics__wide,
  .s-edge-analytics__rule {
    display: none;
  }
  .s-edge-analytics__narrow {
    display: inline;
  }
  .s-edge-analytics__filters {
    position: static;
    padding: 8px 16px;
  }
  .s-edge-analytics__body {
    padding: 16px 16px 96px;
  }
  .s-edge-analytics__kpi {
    grid-template-columns: minmax(0, 1fr);
    gap: 10px;
    padding: 14px 14px 12px;
  }
  .s-edge-analytics__zone {
    width: auto;
    flex: 1 1 160px;
  }
  .s-edge-analytics__live {
    display: none;
  }
}
</style>
