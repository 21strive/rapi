<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { Download } from 'lucide-vue-next'
import {
  RButton,
  RCard,
  RDial,
  RHeatmap,
  RKnob,
  RLineChart,
  RMeter,
  RReadout,
  RSegmented,
  RSelect,
  RStatus,
  RTable,
  formatNumber,
  useToast,
} from '@/design-system'
import type { DialZone, StatusTone, TableColumn } from '@/design-system'
import SampleShell from '../_kit/SampleShell.vue'
import {
  NOW,
  OUTDOOR_ID,
  defaultThresholds,
  devices,
  heatDays,
  heatFor,
  heatHours,
  trendFor,
  trendLabels,
  type Metric,
} from './data'

const toast = useToast()

const selectedId = ref('AQ4-0121')
const device = computed(() => devices.find((d) => d.id === selectedId.value) ?? devices[0])
const outdoor = devices.find((d) => d.id === OUTDOOR_ID)!
const deviceOptions = devices.map((d) => ({ label: `${d.room} · ${d.id}`, value: d.id }))

/* ── Thresholds: the knobs move the dial zones, the chart lines and every status ───── */
const t = reactive({ ...defaultThresholds })
watch(
  () => t.co2Warn,
  (warn) => {
    if (t.co2Crit < warn + 100) t.co2Crit = Math.min(2000, warn + 100)
  },
)
watch(
  () => t.co2Crit,
  (crit) => {
    if (t.co2Warn > crit - 100) t.co2Warn = Math.max(600, crit - 100)
  },
)

const zones = computed<DialZone[]>(() => [
  { from: 400, to: t.co2Warn, level: 'good' },
  { from: t.co2Warn, to: t.co2Crit, level: 'warning' },
  { from: t.co2Crit, to: 2000, level: 'critical' },
])

type Level = { tone: StatusTone; label: string }
const co2Level = (v: number | null): Level =>
  v == null
    ? { tone: 'neutral', label: 'No data' }
    : v >= t.co2Crit
      ? { tone: 'danger', label: 'Critical' }
      : v >= t.co2Warn
        ? { tone: 'warning', label: 'Warning' }
        : { tone: 'success', label: 'Good' }
const pmLevel = (v: number): Level =>
  v >= 35 ? { tone: 'danger', label: 'Critical' } : v >= t.pmWarn ? { tone: 'warning', label: 'Warning' } : { tone: 'success', label: 'Good' }
const vocLevel = (v: number): Level =>
  v >= 250 ? { tone: 'danger', label: 'Critical' } : v >= t.vocWarn ? { tone: 'warning', label: 'Warning' } : { tone: 'success', label: 'Good' }
const tempLevel = (v: number): Level => (v < 20 || v > 26 ? { tone: 'warning', label: 'Outside 20–26' } : { tone: 'success', label: 'Comfort' })
const rhLevel = (v: number): Level => (v < 30 || v > 60 ? { tone: 'warning', label: 'Outside 30–60' } : { tone: 'success', label: 'Comfort' })

/* ── Live readings: a new sample every 10 s, nudged around the room's 15-minute mean ─── */
const trend = computed(() => trendFor(device.value))
const outdoorTrend = trendFor(outdoor)
const tick = ref(0)
const wobble = (seed: number, size: number) => Math.sin(tick.value * 1.7 + seed) * size

const live = computed(() => {
  const d = device.value
  const last = trend.value[trend.value.length - 1]
  return {
    co2: d.online ? Math.round(last + 4 + wobble(1, 9)) : null,
    pm: Math.max(0.5, d.pm + wobble(2, 0.6)),
    voc: Math.round(d.voc + wobble(3, 4)),
    temp: d.temp + wobble(4, 0.1),
    rh: Math.round(d.rh + wobble(5, 0.8)),
  }
})

const fmt0 = (v: number) => formatNumber(v, { maximumFractionDigits: 0 })
const fmt1 = (v: number) => formatNumber(v, { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/* ── Trend ───────────────────────────────────────────────────────────────────────── */
const trendSeries = computed(() => [
  { name: device.value.room, values: trend.value },
  { name: 'Outdoor, rooftop', values: outdoorTrend, color: 'var(--r-chart-context)' },
])
const references = computed(() => [
  { value: t.co2Warn, label: `Warning ${fmt0(t.co2Warn)}`, kind: 'threshold' as const },
  { value: t.co2Crit, label: `Critical ${fmt0(t.co2Crit)}`, kind: 'threshold' as const },
])
const trendMax = computed(() => Math.max(1600, Math.ceil((Math.max(...trend.value, t.co2Crit) + 100) / 200) * 200))
const above = computed(() => {
  const n = trend.value.filter((v) => v >= t.co2Warn).length
  return `${Math.floor((n * 15) / 60)} h ${String((n * 15) % 60).padStart(2, '0')} min above warning`
})

/* ── Heatmap ─────────────────────────────────────────────────────────────────────── */
const metric = ref<Metric>('co2')
const metricOptions = [
  { label: 'CO₂', value: 'co2' },
  { label: 'PM2.5', value: 'pm' },
  { label: 'VOC', value: 'voc' },
]
const heat = computed(() => heatFor(device.value, metric.value))
const heatFormat = computed(() =>
  metric.value === 'co2' ? (v: number) => `${fmt0(v)} ppm` : metric.value === 'pm' ? (v: number) => `${fmt1(v)} µg/m³` : (v: number) => `VOC ${fmt0(v)}`,
)
const heatLabel = computed(
  () =>
    `${metric.value === 'co2' ? 'CO₂, ppm' : metric.value === 'pm' ? 'PM2.5, µg/m³' : 'VOC index'} by day and hour in ${device.value.room}, last seven days`,
)

/* ── Fleet ───────────────────────────────────────────────────────────────────────── */
const fleetColumns: TableColumn[] = [
  { key: 'device', label: 'Device', sortable: true, sortValue: (r) => r.room },
  { key: 'co2', label: 'CO₂ ppm', numeric: true, sortable: true, sortValue: (r) => r.co2 ?? -1 },
  { key: 'pm', label: 'PM2.5', numeric: true, sortable: true },
  { key: 'battery', label: 'Battery', sortable: true, width: '128px' },
  { key: 'seen', label: 'Last seen WIB', sortable: true },
]
const fleetRows = computed(() =>
  devices.map((d) => {
    const last = trendFor(d).at(-1) ?? null
    return {
      id: d.id,
      device: d.id,
      room: d.room,
      floor: d.floor,
      co2: d.online ? last : null,
      pm: fmt1(d.pm),
      battery: d.battery,
      seen: d.lastSeen,
      online: d.online,
    }
  }),
)
const online = devices.filter((d) => d.online).length

function exportCsv() {
  toast.show({
    title: 'CSV export ready',
    body: `${device.value.id} · 7 days · 1-minute means · ${formatNumber(7 * 24 * 60)} rows`,
  })
}

function onThresholdSaved() {
  toast.show({
    title: 'Alert thresholds saved',
    body: `CO₂ warning ${fmt0(t.co2Warn)} ppm, critical ${fmt0(t.co2Crit)} ppm, PM2.5 ${t.pmWarn} µg/m³. Applied to all ${devices.length} devices.`,
    tone: 'success',
  })
}

let timer: number | undefined
onMounted(() => {
  timer = window.setInterval(() => (tick.value += 1), 5000)
})
onBeforeUnmount(() => window.clearInterval(timer))
</script>

<template>
  <SampleShell product="AQ-4 air quality">
    <template #strip>
      <span class="s-aq-muted s-aq-hide-sm">Research building B · Bandung</span>
    </template>
    <template #meta>
      <span class="s-aq-hide-sm">{{ online }} of {{ devices.length }} online</span>
      <span class="s-aq-hide-sm">{{ NOW.day }}</span>
      <span>{{ NOW.clock }} WIB</span>
    </template>
    <template #header>
      <div class="s-aq-heading">
        <span class="r-eyebrow s-aq-eyebrow">{{ device.id }} · Floor {{ device.floor }}</span>
        <h1 class="s-aq-title">{{ device.room }}</h1>
      </div>
    </template>
    <template #actions>
      <RSelect v-model="selectedId" :options="deviceOptions" size="sm" aria-label="Device" class="s-aq-select" />
      <RButton variant="outline" size="sm" @click="exportCsv">
        <template #leading><Download /></template>
        Export CSV
      </RButton>
    </template>

    <div class="s-aq">
      <!-- 01 Readouts -->
      <section class="s-aq-readouts r-grid-ruled" aria-label="Current readings">
        <div class="s-aq-cell s-aq-cell--co2">
          <RReadout
            label="CO₂"
            :value="live.co2 == null ? '—' : fmt0(live.co2)"
            unit="ppm"
            font="pixel"
            size="lg"
            ghost="8,888"
            :tone="co2Level(live.co2).tone === 'success' ? undefined : co2Level(live.co2).tone"
          >
            <template #meta>01 · Live</template>
          </RReadout>
          <div class="s-aq-foot">
            <RStatus :tone="co2Level(live.co2).tone" :label="co2Level(live.co2).label" :pulse="device.online" size="sm" />
            <span class="s-aq-note">Outdoor {{ fmt0(outdoorTrend.at(-1) ?? 0) }}</span>
          </div>
        </div>
        <div class="s-aq-cell">
          <RReadout label="PM2.5" :value="fmt1(live.pm)" unit="µg/m³">
            <template #meta>02</template>
          </RReadout>
          <div class="s-aq-foot">
            <RStatus :tone="pmLevel(live.pm).tone" :label="pmLevel(live.pm).label" size="sm" />
            <span class="s-aq-note">Limit {{ t.pmWarn }}</span>
          </div>
        </div>
        <div class="s-aq-cell">
          <RReadout label="VOC index" :value="fmt0(live.voc)">
            <template #meta>03</template>
          </RReadout>
          <div class="s-aq-foot">
            <RStatus :tone="vocLevel(live.voc).tone" :label="vocLevel(live.voc).label" size="sm" />
            <span class="s-aq-note">100 = room average</span>
          </div>
        </div>
        <div class="s-aq-cell">
          <RReadout label="Temperature" :value="fmt1(live.temp)" unit="°C">
            <template #meta>04</template>
          </RReadout>
          <div class="s-aq-foot">
            <RStatus :tone="tempLevel(live.temp).tone" :label="tempLevel(live.temp).label" size="sm" />
          </div>
        </div>
        <div class="s-aq-cell">
          <RReadout label="Humidity" :value="fmt0(live.rh)" unit="% RH">
            <template #meta>05</template>
          </RReadout>
          <div class="s-aq-foot">
            <RStatus :tone="rhLevel(live.rh).tone" :label="rhLevel(live.rh).label" size="sm" />
          </div>
        </div>
      </section>

      <!-- 02 Dial and alert thresholds -->
      <RCard class="s-aq-dial" index="06" eyebrow="CO₂ against limits" marks padding="md">
        <template #actions>
          <RButton size="xs" variant="outline" @click="onThresholdSaved">Save limits</RButton>
        </template>
        <div class="s-aq-dial__body">
          <RDial
            :value="live.co2 ?? 400"
            :min="400"
            :max="2000"
            :major-step="400"
            :zones="zones"
            unit="ppm"
            :size="204"
            :format="fmt0"
            :label="`CO₂ in ${device.room}`"
          />
          <div class="s-aq-knobs">
            <RKnob v-model="t.co2Warn" label="Warning" :min="600" :max="1400" :step="50" unit="ppm" tone="neutral" size="sm" :format="fmt0" :detents="17" />
            <RKnob v-model="t.co2Crit" label="Critical" :min="1000" :max="2000" :step="50" unit="ppm" tone="neutral" size="sm" :format="fmt0" :detents="21" />
          </div>
        </div>
      </RCard>

      <!-- 03 Trend -->
      <RCard class="s-aq-trend" index="07" eyebrow="CO₂, last 24 hours" :meta="above" padding="md">
        <RLineChart
          :labels="trendLabels"
          :series="trendSeries"
          :references="references"
          :now="trendLabels.length - 1"
          :min="400"
          :max="trendMax"
          :y-ticks="6"
          :height="206"
          y-unit="ppm"
          end-labels
          :format="fmt0"
          :axis-format="fmt0"
          :label="`CO₂ in ${device.room} and outdoors, 15-minute means over the last 24 hours, with the warning and critical thresholds`"
        />
      </RCard>

      <!-- 04 Heatmap -->
      <RCard class="s-aq-heat" index="08" eyebrow="Last seven days" :title="metric === 'co2' ? 'CO₂ by hour' : metric === 'pm' ? 'PM2.5 by hour' : 'VOC index by hour'" padding="md">
        <template #actions>
          <RSegmented v-model="metric" :options="metricOptions" size="sm" label="Metric" />
        </template>
        <div class="s-aq-heat__scroll">
          <RHeatmap :rows="heatDays" :cols="heatHours" :values="heat" :cell-height="18" :format="heatFormat" :label="heatLabel" />
        </div>
        <p class="s-aq-note">Building closed Sat 31 Oct and Sun 01 Nov. Cleaning at 06:00 on weekdays lifts VOC.</p>
      </RCard>

      <!-- 05 Fleet -->
      <RCard class="s-aq-fleet" index="09" eyebrow="Fleet" :meta="`${online} of ${devices.length} reporting`" padding="none">
        <RTable
          :columns="fleetColumns"
          :rows="fleetRows"
          :selected="[selectedId]"
          density="compact"
          caption="AQ-4 devices in Research building B. Choose a row to show that room."
          @row-click="(row) => (selectedId = String(row.id))"
        >
          <template #cell-device="{ row }">
            <span class="s-aq-dev">
              <span class="s-aq-dev__id">{{ row.device }}</span>
              <span class="s-aq-dev__room">{{ row.room }}</span>
            </span>
          </template>
          <template #cell-co2="{ row }">
            <span class="s-aq-co2">
              <RStatus :tone="co2Level(row.co2).tone" size="sm" />
              {{ row.co2 == null ? '—' : fmt0(row.co2) }}
            </span>
          </template>
          <template #cell-battery="{ row }">
            <span class="s-aq-batt">
              <RMeter variant="segments" :value="row.battery" :count="5" :tone="row.battery < 15 ? 'danger' : 'brand'" :height="8" :label="`Battery ${row.battery}%`" />
              <span>{{ row.battery }}%</span>
            </span>
          </template>
          <template #cell-seen="{ row }">
            <span class="s-aq-seen">
              <RStatus v-if="row.online" tone="success" label="Online" size="sm" />
              <RStatus v-else tone="danger" label="Offline" size="sm" />
              <span>{{ row.seen }}</span>
            </span>
          </template>
        </RTable>
      </RCard>
    </div>
  </SampleShell>
</template>

<style scoped>
.s-aq {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 16px;
}

.s-aq-muted {
  color: var(--r-text-tertiary);
}
.s-aq-heading {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.s-aq-eyebrow {
  color: var(--r-text-tertiary);
}
.s-aq-title {
  font-size: var(--r-text-xl);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-tight);
  line-height: 1.2;
}
.s-aq-select {
  width: 260px;
}
.s-aq-note {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

/* ── Readouts ─────────────────────────────────────────────────────────────── */
.s-aq-readouts {
  grid-column: 1 / -1;
  grid-template-columns: 1.4fr repeat(4, minmax(0, 1fr));
}
.s-aq-cell {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px 14px;
}
.s-aq-foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 4px 12px;
}

/* ── Dial ─────────────────────────────────────────────────────────────────── */
.s-aq-dial {
  grid-column: span 4;
}
.s-aq-dial__body {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.s-aq-knobs {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ── Trend ────────────────────────────────────────────────────────────────── */
.s-aq-trend {
  grid-column: span 8;
}

/* ── Heatmap ──────────────────────────────────────────────────────────────── */
.s-aq-heat {
  grid-column: span 5;
}
.s-aq-heat__scroll {
  overflow-x: auto;
}
.s-aq-heat__scroll > * {
  min-width: 460px;
}

/* ── Fleet ────────────────────────────────────────────────────────────────── */
.s-aq-fleet {
  grid-column: span 7;
  gap: 12px;
}
.s-aq-dev {
  display: inline-flex;
  align-items: baseline;
  gap: 10px;
}
.s-aq-dev__id {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
}
.s-aq-dev__room {
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
}
.s-aq-co2 {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.s-aq-batt {
  display: grid;
  grid-template-columns: 56px auto;
  align-items: center;
  gap: 8px;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
}
.s-aq-seen {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
}

@media (max-width: 1279px) {
  .s-aq-readouts {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .s-aq-dial {
    grid-column: span 5;
  }
  .s-aq-trend {
    grid-column: span 7;
  }
  .s-aq-heat,
  .s-aq-fleet {
    grid-column: 1 / -1;
  }
}

@media (max-width: 900px) {
  .s-aq-dial,
  .s-aq-trend {
    grid-column: 1 / -1;
  }
}

@media (max-width: 640px) {
  .s-aq {
    gap: 12px;
  }
  .s-aq-readouts {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .s-aq-cell--co2 {
    grid-column: 1 / -1;
  }
  .s-aq-select {
    width: 100%;
  }
  .s-aq-hide-sm {
    display: none;
  }
}
</style>
