<script setup lang="ts">
/**
 * 13 · Launch telemetry. Strive-1, flight 21S-07, a rideshare to sun-synchronous orbit.
 * One clock drives the screen: readouts, the trajectory, the event list and the phase chart
 * all read the same mission time, so they agree every second.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Flag } from 'lucide-vue-next'
import {
  RButton,
  RCard,
  RDialog,
  RGanttChart,
  RLineChart,
  RReadout,
  RSegmented,
  RSpecList,
  RStatus,
  RSwitch,
  RTimeline,
  formatNumber,
  useToast,
  type GanttItem,
  type GanttRow,
  type StatusTone,
} from '@/design-system'
import SampleShell from '../_kit/SampleShell.vue'
import {
  START_T,
  WINDOW,
  SAMPLE_STEP,
  missionClock,
  mmss,
  utcAt,
  stage1At,
  stage2At,
  sampleTimes,
  sampleLabels,
  quantities,
  timelineAt,
  nextEvent,
  phaseRows,
  phaseTicks,
  phaseOf,
  subsystems,
  type Quantity,
  type StageState,
  type Subsystem,
} from './data'

const toast = useToast()

/* ── The clock · one tick a second. Freeze holds the panels while time keeps running. ── */
const live = ref(START_T)
const frozenAt = ref<number | null>(null)
const t = computed(() => frozenAt.value ?? live.value)
const frozen = computed({
  get: () => frozenAt.value != null,
  set: (on: boolean) => (frozenAt.value = on ? live.value : null),
})

let timer: number | undefined
/* Phones get a smaller clock and fewer ticks on the phase chart. */
const narrow = ref(false)
let mq: MediaQueryList | undefined
const onMedia = () => (narrow.value = !!mq?.matches)
onMounted(() => {
  timer = window.setInterval(() => (live.value += 1), 1000)
  mq = window.matchMedia('(max-width: 560px)')
  onMedia()
  mq.addEventListener('change', onMedia)
})
onBeforeUnmount(() => {
  window.clearInterval(timer)
  mq?.removeEventListener('change', onMedia)
})

const next = computed(() => nextEvent(t.value))

/* ── Stage telemetry ─────────────────────────────────────────────────────────────── */
function stage1Phase(s: number): { label: string; tone: StatusTone } {
  if (s < 148) return { label: 'Ascent', tone: 'brand' }
  if (s < 170) return { label: 'Coast', tone: 'neutral' }
  if (s < 218) return { label: 'Boostback', tone: 'brand' }
  if (s < 386) return { label: 'Coast', tone: 'neutral' }
  if (s < 408) return { label: 'Entry burn', tone: 'brand' }
  if (s < 466) return { label: 'Descent', tone: 'neutral' }
  if (s < 482) return { label: 'Landing burn', tone: 'brand' }
  return { label: 'Landed', tone: 'success' }
}

function stage2Phase(s: number): { label: string; tone: StatusTone } {
  if (s < 151) return { label: 'Ascent', tone: 'brand' }
  if (s < 159) return { label: 'Coast', tone: 'neutral' }
  if (s < 524) return { label: 'SES-1 burn', tone: 'brand' }
  return { label: 'Coast', tone: 'neutral' }
}

const readoutsOf = (s: StageState) => [
  { label: 'Altitude', value: s.altitude, unit: 'km', decimals: 1 },
  { label: 'Velocity', value: s.velocity, unit: 'm/s', decimals: 0 },
  { label: 'Downrange', value: s.downrange, unit: 'km', decimals: 1 },
  { label: 'Acceleration', value: s.acceleration, unit: 'g', decimals: 2 },
]

const stages = computed(() => [
  { id: 's1', name: 'S1 · Booster', serial: 'B1021', phase: stage1Phase(t.value), readouts: readoutsOf(stage1At(t.value)) },
  { id: 's2', name: 'S2 · Upper stage', serial: 'S2-07', phase: stage2Phase(t.value), readouts: readoutsOf(stage2At(t.value)) },
])

const s2BurnSeconds = computed(() => Math.min(365, Math.max(0, Math.floor(t.value) - 159)))

/* ── Trajectory ──────────────────────────────────────────────────────────────────── */
const quantity = ref<Quantity>('altitude')
const quantityOptions = (Object.keys(quantities) as Quantity[]).map((q) => ({ label: quantities[q].label, value: q }))
const q = computed(() => quantities[quantity.value])
const nowIndex = computed(() => Math.min(sampleTimes.length - 1, Math.floor(Math.min(t.value, WINDOW) / SAMPLE_STEP)))

const trajectory = computed(() => {
  const key = quantity.value
  return [
    { name: 'Stage 1', values: sampleTimes.map((s) => stage1At(s)[key]), color: 'var(--r-chart-context)' },
    { name: 'Stage 2', values: sampleTimes.map((s) => stage2At(s)[key]), color: 'var(--r-chart-1)' },
  ]
})
const formatQ = (v: number) => `${formatNumber(v, { maximumFractionDigits: q.value.decimals })} ${q.value.unit}`
const trajectoryLabel = computed(
  () => `${q.value.title} for both stages, flown up to ${missionClock(t.value)} and planned after, in ${q.value.unit}`,
)

/* ── Events and phases ───────────────────────────────────────────────────────────── */
const timeline = computed(() => timelineAt(t.value))

// Done phases are grey, planned ones hatched. A phase in progress is split at now: the flown
// part solid cobalt, the rest hatched and labelled, so the label stays readable as it shrinks.
const ganttRows = computed<GanttRow[]>(() =>
  phaseRows.map((row) => ({
    id: row.id,
    label: row.label,
    meta: row.meta,
    items: row.items.flatMap<GanttItem>((item) => {
      if (item.milestone) return [{ start: item.start, end: item.start, label: item.label, milestone: true }]
      const phase = phaseOf(item.start, item.end, t.value)
      if (phase === 'done') return [{ start: item.start, end: item.end, label: item.label, tone: 'context' }]
      if (phase === 'upcoming') return [{ start: item.start, end: item.end, label: item.label, hatch: true }]
      return [
        { start: item.start, end: t.value, tone: 'brand' },
        { start: t.value, end: item.end, label: item.label, hatch: true },
      ]
    }),
  })),
)
const formatTick = (v: number) => `T+${mmss(v)}`

/* ── Subsystems ──────────────────────────────────────────────────────────────────── */
const watchCount = computed(() => subsystems.filter((s) => s.tone === 'warning' || s.tone === 'danger').length)
const openId = ref<string | null>(null)
const drawerOpen = computed({
  get: () => openId.value != null,
  set: (v: boolean) => {
    if (!v) openId.value = null
  },
})
const current = computed<Subsystem | null>(() => subsystems.find((s) => s.id === openId.value) ?? null)
const currentIndex = computed(() => String(subsystems.findIndex((s) => s.id === openId.value) + 1).padStart(2, '0'))
const acknowledged = ref<string[]>([])

function acknowledge(s: Subsystem) {
  acknowledged.value = [...acknowledged.value, s.id]
  toast.show({ title: `${s.name} watch acknowledged`, body: `Logged by FLIGHT at ${missionClock(t.value)}.`, tone: 'neutral' })
  openId.value = null
}

/* ── Markers ─────────────────────────────────────────────────────────────────────── */
const markers = ref(3)
function markEvent() {
  markers.value += 1
  toast.show({
    title: `Marker M-${String(markers.value).padStart(2, '0')} logged`,
    body: `${missionClock(t.value)} · ${utcAt(t.value)} UTC, on both telemetry streams.`,
    tone: 'brand',
  })
}
</script>

<template>
  <SampleShell product="Launch control" padding="sm">
    <template #strip>
      <span class="s-mc-strip s-mc-hide-sm">Flight 21S-07 · Rideshare</span>
    </template>
    <template #meta>
      <span class="s-mc-hide-sm">Strive-1 · LC-2 Sumba</span>
      <span class="s-mc-hide-sm">12 Nov 2026 · {{ utcAt(live) }} UTC</span>
      <RStatus tone="success" size="sm" label="Range go" />
    </template>
    <template #header>
      <div class="s-mc-title">
        <p class="r-eyebrow">Strive-1 · 21S-07 Rideshare · SSO 97.5°</p>
        <h1 class="sample-shell__title">Launch telemetry</h1>
      </div>
    </template>
    <template #actions>
      <span v-if="frozen" class="s-mc-frozen r-label">Display frozen at {{ missionClock(t) }}</span>
      <RSwitch v-model="frozen" size="sm" label="Freeze display" />
      <RButton variant="outline" size="sm" @click="markEvent">
        <template #leading><Flag /></template>
        Mark event
      </RButton>
    </template>

    <div class="s-mc">
      <!-- 01 · Mission clock -->
      <RCard class="s-mc-clock" padding="sm" marks>
        <RReadout label="01 · Mission clock" :value="missionClock(t)" font="pixel" :size="narrow ? 'lg' : 'xl'" ghost tone="signal">
          <template #meta>T-0 07:10:00 UTC</template>
        </RReadout>
        <div class="s-mc-clock__next">
          <RReadout label="Next event" :value="next ? next.title : 'None'" size="sm" />
          <RReadout label="Countdown" :value="next ? `T−${mmss(next.t - t)}` : '—'" size="sm" />
          <RReadout label="S2 burn" :value="s2BurnSeconds" unit="of 365 s" size="sm" />
        </div>
      </RCard>

      <!-- 02 · Stage telemetry -->
      <RCard class="s-mc-tlm-card" index="02" eyebrow="Stage telemetry" meta="Filtered" padding="sm" marks>
        <div class="s-mc-tlm">
          <div v-for="stage in stages" :key="stage.id" class="s-mc-tlm__row">
            <div class="s-mc-tlm__stage">
              <p class="s-mc-tlm__name">{{ stage.name }} <span class="r-label">{{ stage.serial }}</span></p>
              <RStatus :tone="stage.phase.tone" :label="stage.phase.label" size="sm" />
            </div>
            <div v-for="r in stage.readouts" :key="r.label" class="s-mc-tlm__cell">
              <RReadout :label="r.label" :value="r.value" :decimals="r.decimals" :unit="r.unit" size="sm" />
            </div>
          </div>
        </div>
      </RCard>

      <!-- 03 · Subsystems -->
      <section class="s-mc-lamps" aria-labelledby="s-mc-lamps-title">
        <header class="s-mc-lamps__head">
          <p class="s-mc-lamps__kicker"><span class="r-index">03</span><span id="s-mc-lamps-title" class="r-eyebrow">Subsystems</span></p>
          <span class="r-label">{{ subsystems.length - watchCount }} nominal · {{ watchCount }} watch</span>
        </header>
        <button
          v-for="s in subsystems"
          :key="s.id"
          type="button"
          class="s-mc-lamp"
          :class="{ 'is-watch': s.tone === 'warning' && !acknowledged.includes(s.id) }"
          :aria-label="`${s.name}: ${s.status}. Open channels`"
          @click="openId = s.id"
        >
          <span class="s-mc-lamp__name">{{ s.name }}</span>
          <RStatus :tone="s.tone" :label="s.status" size="sm" />
        </button>
      </section>

      <!-- 04 · Trajectory -->
      <RCard class="s-mc-chart" index="04" eyebrow="Trajectory" :title="q.title" padding="sm" marks>
        <template #actions>
          <RSegmented v-model="quantity" :options="quantityOptions" size="sm" label="Quantity" />
        </template>
        <RLineChart
          :labels="sampleLabels"
          :series="trajectory"
          :height="176"
          :now="nowIndex"
          :forecast-from="nowIndex"
          :references="q.reference ? [q.reference] : []"
          :y-unit="q.unit"
          :format="formatQ"
          :label="trajectoryLabel"
        />
      </RCard>

      <!-- 05 · Flight events -->
      <RCard
        class="s-mc-events"
        index="05"
        eyebrow="Flight events"
        :meta="`${timeline.filter((e) => e.tone === 'success').length} of ${timeline.length} confirmed`"
        padding="sm"
        marks
      >
        <RTimeline :items="timeline" dense />
      </RCard>

      <!-- 06 · Sequence -->
      <RCard
        class="s-mc-gantt"
        index="06"
        eyebrow="Sequence · flight phases"
        :meta="narrow ? 'Hatched planned' : 'Grey flown · cobalt active · hatched planned'"
        padding="sm"
        marks
      >
        <RGanttChart
          :rows="ganttRows"
          :domain="[0, WINDOW]"
          :ticks="narrow ? [0, 300, 600] : phaseTicks"
          :format-tick="formatTick"
          :now="Math.min(t, WINDOW)"
          :row-height="28"
          :label-width="136"
          label="Flight phases by vehicle from liftoff to T+00:10:00. Flown phases in grey, active in cobalt, planned hatched."
        />
      </RCard>
    </div>

    <RDialog
      v-model:open="drawerOpen"
      side="right"
      size="sm"
      :eyebrow="current ? `Subsystem ${currentIndex} · ${current.owner}` : ''"
      :title="current?.name"
    >
      <div v-if="current" class="s-mc-drawer">
        <div class="s-mc-drawer__status">
          <RStatus :tone="current.tone" :label="current.status" />
          <span class="s-mc-drawer__detail">{{ current.detail }}</span>
        </div>
        <section>
          <h3 class="r-eyebrow s-mc-drawer__h">Channels at {{ missionClock(t) }}</h3>
          <RSpecList :items="current.channels" dense />
        </section>
        <section v-if="current.log.length">
          <h3 class="r-eyebrow s-mc-drawer__h">Log</h3>
          <RTimeline :items="current.log" dense />
        </section>
      </div>
      <template #footer="{ close }">
        <RButton variant="ghost" @click="close">Close</RButton>
        <RButton
          v-if="current && current.tone === 'warning'"
          :disabled="acknowledged.includes(current.id)"
          @click="acknowledge(current)"
        >
          {{ acknowledged.includes(current.id) ? 'Acknowledged' : 'Acknowledge watch' }}
        </RButton>
      </template>
    </RDialog>
  </SampleShell>
</template>

<style scoped>
.s-mc {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 12px;
}

.s-mc-strip {
  color: var(--r-text-secondary);
}

.s-mc-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.s-mc-title .r-eyebrow {
  color: var(--r-text-tertiary);
}

.s-mc-frozen {
  color: var(--r-warning-text);
}

/* ── 01 Clock ──────────────────────────────────────────────────────────── */
.s-mc-clock {
  grid-column: span 5;
}

.s-mc-clock__next {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--r-border-subtle);
}

/* ── 02 Telemetry ──────────────────────────────────────────────────────── */
.s-mc-tlm-card {
  grid-column: span 7;
}

.s-mc-tlm {
  display: grid;
  border-top: 1px solid var(--r-border-subtle);
}

.s-mc-tlm__row {
  display: grid;
  grid-template-columns: 168px repeat(4, minmax(0, 1fr));
  border-bottom: 1px solid var(--r-border-subtle);
}

.s-mc-tlm__row:last-child {
  border-bottom: 0;
}

.s-mc-tlm__stage {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 12px 12px 12px 0;
}

.s-mc-tlm__name {
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
}

.s-mc-tlm__name .r-label {
  margin-left: 4px;
}

.s-mc-tlm__stage .r-status {
  margin-top: 4px;
}

.s-mc-tlm__cell {
  min-width: 0;
  padding: 12px;
  border-left: 1px solid var(--r-border-subtle);
}

/* ── 03 Lamps · one annunciator row ───────────────────────────────────── */
.s-mc-lamps {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: 172px repeat(12, minmax(0, 1fr));
  border: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}

.s-mc-lamps__head {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  min-width: 0;
  padding: 8px 12px;
}

.s-mc-lamps__kicker {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.s-mc-lamps__kicker .r-eyebrow {
  color: var(--r-text-secondary);
}

.s-mc-lamp {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 6px;
  min-width: 0;
  padding: 10px;
  border: 0;
  border-left: 1px solid var(--r-border-subtle);
  background: none;
  color: var(--r-text);
  text-align: left;
  transition: background-color var(--r-duration-fast) var(--r-ease-out);
}

.s-mc-lamp:hover {
  background: var(--r-bg-hover);
}

.s-mc-lamp:focus-visible {
  outline-offset: -2px;
}

.s-mc-lamp.is-watch {
  background: var(--r-warning-soft);
}

.s-mc-lamp__name {
  max-width: 100%;
  overflow: hidden;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.06em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

/* ── 04–06 ─────────────────────────────────────────────────────────────── */
.s-mc-chart {
  grid-column: span 8;
}

.s-mc-events {
  grid-column: span 4;
  grid-row: span 2;
}

.s-mc-gantt {
  grid-column: span 8;
}

/* ── Drawer ────────────────────────────────────────────────────────────── */
.s-mc-drawer {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.s-mc-drawer__status {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
}

.s-mc-drawer__detail {
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
}

.s-mc-drawer__h {
  margin-bottom: 8px;
  color: var(--r-text-secondary);
}

/* ── Responsive ────────────────────────────────────────────────────────── */
@media (max-width: 1279px) {
  .s-mc-lamps {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
  .s-mc-lamps__head {
    grid-column: 1 / -1;
    flex-direction: row;
    align-items: baseline;
    justify-content: space-between;
    border-bottom: 1px solid var(--r-border-subtle);
  }
  .s-mc-lamp:nth-of-type(6n + 1) {
    border-left: 0;
  }
  .s-mc-lamp:nth-of-type(n + 7) {
    border-top: 1px solid var(--r-border-subtle);
  }
}

@media (max-width: 1099px) {
  .s-mc-clock,
  .s-mc-tlm-card,
  .s-mc-chart,
  .s-mc-events,
  .s-mc-gantt {
    grid-column: 1 / -1;
    grid-row: auto;
  }
}

@media (max-width: 720px) {
  .s-mc-tlm__row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .s-mc-tlm__stage {
    grid-column: 1 / -1;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 10px;
    padding: 10px 0 2px;
  }
  .s-mc-tlm__stage .r-status {
    margin: 0 0 0 auto;
  }
  .s-mc-tlm__cell {
    padding: 10px 12px 10px 0;
    border-left: 0;
  }
  .s-mc-tlm__cell:nth-child(odd) {
    padding-left: 12px;
    border-left: 1px solid var(--r-border-subtle);
  }
  .s-mc-lamps {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .s-mc-lamp:nth-of-type(n) {
    border-top: 1px solid var(--r-border-subtle);
    border-left: 1px solid var(--r-border-subtle);
  }
  .s-mc-lamp:nth-of-type(3n + 1) {
    border-left: 0;
  }
  .s-mc-lamp:nth-of-type(-n + 3) {
    border-top: 0;
  }
  .s-mc-clock__next {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .s-mc-hide-sm {
    display: none;
  }
}
</style>
