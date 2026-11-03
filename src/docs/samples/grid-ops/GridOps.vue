<script setup lang="ts">
/**
 * 17 · Grid operations. The Nusa Grid control room at 14:00: load against the day-ahead and
 * intraday forecasts, the hourly generation mix, system frequency, reserves, curtailments and
 * substations. The region switch re-points every panel at another system.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  RBulletChart,
  RButton,
  RCard,
  RColumnChart,
  RDial,
  RLineChart,
  RMeter,
  RSegmented,
  RSpecList,
  RStat,
  RStatus,
  RTable,
  RTimeline,
  formatNumber,
  useToast,
  type TableColumn,
  type TableSort,
  type TimelineItem,
} from '@/design-system'
import SampleShell from '../_kit/SampleShell.vue'
import { NOW_INDEX, SUB_TONE, halfHourLabels, profiles, regionOptions, regions, type RegionId, type Substation } from './data'

const toast = useToast()

const regionId = ref<RegionId>('jb')
const region = computed(() => regions.find((r) => r.id === regionId.value) ?? regions[0])
const p = computed(() => profiles(region.value))

const gw = (v: number) => `${formatNumber(v, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} GW`
const gw1 = (v: number) => formatNumber(v, { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/* ── Load ────────────────────────────────────────────────────────────────────────── */
const loadNow = computed(() => p.value.actual[NOW_INDEX] as number)
const vsDayAhead = computed(() => ((loadNow.value / p.value.dayAhead[NOW_INDEX] - 1) * 100))
const peak = computed(() => {
  let best = NOW_INDEX
  p.value.intraday.forEach((v, i) => {
    if (i > NOW_INDEX && v > p.value.intraday[best]) best = i
  })
  return { value: p.value.intraday[best], at: halfHourLabels[best] }
})
const loadSeries = computed(() => [
  { name: 'Load, then intraday forecast', values: p.value.intraday, color: 'var(--r-chart-1)' },
  { name: 'Day-ahead forecast', values: p.value.dayAhead, color: 'var(--r-chart-context)' },
])
const loadMin = computed(() => Math.floor((Math.min(...p.value.dayAhead) * 0.9) / (region.value.peak > 10 ? 5 : region.value.peak > 5 ? 1 : 0.5)) * (region.value.peak > 10 ? 5 : region.value.peak > 5 ? 1 : 0.5))
const loadRefs = computed(() => [
  { value: region.value.capacity, label: `Available ${gw1(region.value.capacity)} GW`, kind: 'threshold' as const },
  { value: peak.value.value, label: `Peak ${gw1(peak.value.value)} GW at ${peak.value.at}`, kind: 'average' as const },
])

/* ── Mix ─────────────────────────────────────────────────────────────────────────── */
const renewablesNow = computed(() => {
  const last = Object.fromEntries(p.value.mix.map((s) => [s.name, s.values[s.values.length - 1]]))
  const total = Object.values(last).reduce((a, b) => a + b, 0)
  return { share: ((last.Solar + last.Wind + last.Hydro) / total) * 100, solar: last.Solar }
})

/* ── Frequency · a reading every 1.5 s ───────────────────────────────────────────── */
const hz = ref(region.value.frequency)
let timer: number | undefined
let step = 0
function sample() {
  step += 1
  const base = region.value.frequency
  const wobble = Math.sin(step * 1.7) * 0.006 + Math.sin(step * 0.43) * 0.009
  hz.value = Math.round((base + wobble) * 1000) / 1000
}
onMounted(() => (timer = window.setInterval(sample, 1500)))
onBeforeUnmount(() => window.clearInterval(timer))
watch(regionId, () => (hz.value = region.value.frequency))

const freqZone = computed(() => {
  const d = Math.abs(hz.value - 50)
  return d <= 0.05 ? { label: 'Within deadband', tone: 'success' as const } : d <= 0.15 ? { label: 'Outside deadband', tone: 'warning' as const } : { label: 'Emergency band', tone: 'danger' as const }
})
const freqSpecs = computed(() => [
  { label: 'Rate of change', value: region.value.rocof, mono: true },
  { label: 'System inertia', value: region.value.inertia, mono: true },
  { label: 'Deadband', value: '49.95 to 50.05 Hz', mono: true },
])

/* ── Reserves ────────────────────────────────────────────────────────────────────── */
const spinning = computed(() => region.value.reserves[0])

/* ── Curtailments · per region, with a release that sticks ───────────────────────── */
const released = ref<Record<string, string>>({})
const events = computed<TimelineItem[]>(() =>
  region.value.curtailments.map((c) =>
    c.active && released.value[region.value.id]
      ? { ...c, meta: `RELEASED ${released.value[region.value.id]}`, tone: 'success' }
      : { id: c.id, time: c.time, title: c.title, body: c.body, meta: c.meta, tone: c.tone },
  ),
)
const active = computed(() => (released.value[region.value.id] ? null : region.value.curtailments.find((c) => c.active) ?? null))
function release() {
  const c = active.value
  if (!c) return
  released.value = { ...released.value, [region.value.id]: '14:02' }
  const source = c.title.split(' ')[0]
  toast.show({
    title: `${c.mw} MW released`,
    body: `${region.value.name}: ${source} back to full output. Watch ${(c.body ?? '').split(',')[0]}.`,
    tone: 'success',
  })
}

/* ── Substations ─────────────────────────────────────────────────────────────────── */
const sort = ref<TableSort | null>({ key: 'status', direction: 'asc' })
const SEVERITY: Record<Substation['status'], number> = { Outage: 0, Alarm: 1, Maintenance: 2, Normal: 3 }
const columns: TableColumn<Substation>[] = [
  { key: 'name', label: 'Substation', sortable: true },
  { key: 'kv', label: 'Voltage', numeric: true, sortable: true, format: (v: number) => `${v} kV` },
  { key: 'loadMw', label: 'Load MW', numeric: true, sortable: true, format: (v: number) => formatNumber(v) },
  { key: 'transformer', label: 'Transformer loading', sortable: true, width: '220px' },
  { key: 'status', label: 'Status', sortable: true, sortValue: (r) => SEVERITY[r.status] },
  { key: 'note', label: 'Note' },
]
const counts = computed(() => {
  const s = region.value.substations
  return { alarm: s.filter((x) => x.status === 'Alarm').length, outage: s.filter((x) => x.status === 'Outage').length }
})
</script>

<template>
  <SampleShell product="Nusa Grid · control centre" padding="sm">
    <template #strip>
      <span class="s-go-strip s-go-hide-sm">{{ region.name }} system</span>
    </template>
    <template #meta>
      <span class="s-go-hide-sm">12 Nov 2026 · 14:00 {{ region.zone }}</span>
      <RStatus :tone="freqZone.tone" size="sm" :label="freqZone.label" />
    </template>
    <template #header>
      <div class="s-go-title">
        <p class="r-eyebrow">{{ region.name }} · {{ regions.find((r) => r.id === regionId)?.substations.length }} substations shown · {{ region.zone }}</p>
        <h1 class="sample-shell__title">Grid operations</h1>
      </div>
    </template>
    <template #actions>
      <RSegmented v-model="regionId" :options="regionOptions" size="sm" label="Region" />
    </template>

    <div class="s-go">
      <!-- KPIs -->
      <div class="r-grid-ruled s-go-kpis">
        <div class="s-go-kpi">
          <RStat label="Load now" :value="loadNow" :decimals="2" unit="GW" size="md">
            <template #footer><span class="s-go-note">{{ vsDayAhead >= 0 ? '+' : '−' }}{{ formatNumber(Math.abs(vsDayAhead), { maximumFractionDigits: 1 }) }}% against day-ahead</span></template>
          </RStat>
        </div>
        <div class="s-go-kpi">
          <RStat label="Evening peak" :value="peak.value" :decimals="1" unit="GW" size="md">
            <template #footer><span class="s-go-note">At {{ peak.at }} · {{ gw1(region.capacity - peak.value) }} GW to spare</span></template>
          </RStat>
        </div>
        <div class="s-go-kpi">
          <RStat label="Renewables now" :value="renewablesNow.share" :decimals="1" suffix="%" size="md">
            <template #footer><span class="s-go-note">Solar {{ gw(renewablesNow.solar) }}</span></template>
          </RStat>
        </div>
        <div class="s-go-kpi">
          <RStat label="Spinning reserve" :value="spinning.value" unit="MW" size="md">
            <template #footer>
              <RStatus
                :tone="spinning.value >= (spinning.target ?? 0) ? 'success' : 'warning'"
                size="sm"
                :label="spinning.value >= (spinning.target ?? 0) ? 'Above target' : `Below target ${formatNumber(spinning.target ?? 0)}`"
              />
            </template>
          </RStat>
        </div>
        <div class="s-go-kpi">
          <RStat label="Curtailed today" :value="region.curtailedMwh" unit="MWh" size="md">
            <template #footer><span class="s-go-note">{{ active ? `1 active · ${active.mw} MW` : 'None active' }}</span></template>
          </RStat>
        </div>
      </div>

      <!-- 01 · Load -->
      <RCard class="s-go-load" index="01" eyebrow="System load" :title="`${region.name}, today`" :meta="`Half-hourly · ${region.zone}`" padding="sm">
        <RLineChart
          :labels="halfHourLabels"
          :series="loadSeries"
          :height="246"
          :now="NOW_INDEX"
          :forecast-from="NOW_INDEX"
          :min="loadMin"
          :references="loadRefs"
          y-unit="GW"
          :format="gw"
          :label="`${region.name} load today against the day-ahead forecast, metered to 14:00 and forecast after, with available capacity and the forecast peak`"
        />
      </RCard>

      <!-- 02 · Frequency -->
      <RCard class="s-go-freq" index="02" eyebrow="System frequency" meta="Live" padding="sm">
        <div class="s-go-freq__body">
          <RDial
            :value="hz"
            :min="49.8"
            :max="50.2"
            :major-step="0.1"
            unit="Hz"
            :size="168"
            :format="(v) => v.toFixed(2)"
            :zones="[
              { from: 49.8, to: 49.85, level: 'critical' },
              { from: 49.85, to: 49.95, level: 'warning' },
              { from: 49.95, to: 50.05, level: 'good' },
              { from: 50.05, to: 50.15, level: 'warning' },
              { from: 50.15, to: 50.2, level: 'critical' },
            ]"
            :label="`${region.name} frequency`"
          />
          <RSpecList :items="freqSpecs" dense />
        </div>
      </RCard>

      <!-- 03 · Generation mix -->
      <RCard class="s-go-mix" index="03" eyebrow="Generation mix" title="Last 24 hours" meta="Hourly · GW" padding="sm">
        <RColumnChart
          :labels="p.mixLabels"
          :series="p.mix"
          :height="190"
          y-unit="GW"
          :format="(v) => `${gw1(v)} GW`"
          :label="`${region.name} generation by source for each hour from 15:00 yesterday to 14:00 today, stacked from the base: coal, gas, hydro, wind, solar`"
        />
      </RCard>

      <!-- 04 · Reserves -->
      <RCard class="s-go-reserve" index="04" eyebrow="Reserve margin" meta="MW" padding="sm">
        <RBulletChart :rows="region.reserves" :format="(v) => formatNumber(Math.round(v))" :label="`${region.name} reserves against targets in megawatts: spinning, fast start, cold standby`" />
      </RCard>

      <!-- 05 · Curtailment -->
      <RCard class="s-go-curtail" index="05" eyebrow="Curtailment" padding="sm">
        <template v-if="active" #actions>
          <RButton size="xs" variant="outline" @click="release">Release {{ active.mw }} MW</RButton>
        </template>
        <RTimeline :items="events" dense />
      </RCard>

      <!-- 06 · Substations -->
      <RCard
        class="s-go-subs"
        index="06"
        eyebrow="Substations"
        :title="`${counts.outage} outage, ${counts.alarm} alarm`"
        meta="By severity"
        padding="none"
      >
        <RTable v-model:sort="sort" :columns="columns" :rows="region.substations" row-key="id" density="compact" :caption="`${region.name} substations`">
          <template #cell-name="{ row }"><span class="s-go-name">{{ row.name }}</span></template>
          <template #cell-transformer="{ row }">
            <div class="s-go-trafo">
              <RMeter
                class="s-go-trafo__bar"
                :segments="[{ value: row.transformer, color: row.transformer >= 90 ? 'var(--r-status-warning)' : 'var(--r-chart-1)' }]"
                :max="100"
                :height="6"
                :label="`${row.transformer}% loaded`"
              />
              <span class="s-go-mono">{{ row.transformer }}%</span>
            </div>
          </template>
          <template #cell-status="{ row }">
            <RStatus :tone="SUB_TONE[row.status as Substation['status']]" :label="row.status" size="sm" :pulse="row.status === 'Outage'" />
          </template>
          <template #cell-note="{ value }"><span class="s-go-dim">{{ value }}</span></template>
        </RTable>
      </RCard>
    </div>
  </SampleShell>
</template>

<style scoped>
.s-go {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 12px;
}

.s-go-strip {
  color: var(--r-text-secondary);
}

.s-go-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.s-go-title .r-eyebrow {
  color: var(--r-text-tertiary);
}

.s-go-kpis {
  grid-column: 1 / -1;
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.s-go-kpi {
  padding: 12px 16px;
}

.s-go-note {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.s-go-load {
  grid-column: span 9;
}

.s-go-freq {
  grid-column: span 3;
}

.s-go-freq__body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.s-go-freq__body .r-spec {
  align-self: stretch;
}

.s-go-mix {
  grid-column: span 6;
}

.s-go-reserve {
  grid-column: span 3;
}

.s-go-curtail {
  grid-column: span 3;
}

.s-go-subs {
  grid-column: 1 / -1;
}

.s-go-name {
  font-weight: var(--r-weight-medium);
}

.s-go-trafo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.s-go-trafo__bar {
  flex: 1;
}

.s-go-mono {
  min-width: 34px;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  text-align: right;
}

.s-go-dim {
  color: var(--r-text-secondary);
}

@media (max-width: 1199px) {
  .s-go-kpis {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .s-go-kpi:last-child {
    grid-column: span 2;
  }
  .s-go-load,
  .s-go-mix {
    grid-column: 1 / -1;
  }
  .s-go-freq,
  .s-go-reserve,
  .s-go-curtail {
    grid-column: span 6;
  }
  .s-go-freq {
    grid-column: 1 / -1;
  }
  .s-go-freq__body {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
  }
  .s-go-freq__body .r-spec {
    flex: 1 1 240px;
    align-self: center;
  }
}

@media (max-width: 640px) {
  .s-go-kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .s-go-reserve,
  .s-go-curtail {
    grid-column: 1 / -1;
  }
  .s-go-hide-sm {
    display: none;
  }
}
</style>
