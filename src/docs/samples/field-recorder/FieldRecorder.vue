<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { Circle, Download, Flag, Pause, Play, Square } from 'lucide-vue-next'
import {
  RButton,
  RCard,
  RDotMatrixChart,
  RKbd,
  RKnob,
  RMeter,
  RReadout,
  RSegmented,
  RSelect,
  RStatus,
  RSwitch,
  RTable,
  formatNumber,
  isEditable,
  prefersReducedMotion,
  useToast,
  withMinus,
} from '@/design-system'
import type { TableColumn } from '@/design-system'
import SampleShell from '../_kit/SampleShell.vue'
import LevelMeter from './parts/LevelMeter.vue'
import {
  bytesPerSecond,
  channels as initialChannels,
  clock,
  device,
  inputs,
  makeWave,
  minutes,
  rollingElapsed,
  session,
  takes as initialTakes,
  timecode,
  type InputId,
  type Take,
} from './data'

const toast = useToast()

/* ── Inputs: what each source sounds like at its reference gain ─────────────────────── */
const PROFILES: Record<InputId, { name: string; floor: number; calls: number; gainRef: number }> = {
  'mic-l': { name: 'XY left', floor: -40, calls: 1, gainRef: 38 },
  'mic-r': { name: 'XY right', floor: -41, calls: 0.9, gainRef: 38 },
  'xlr-1': { name: 'Hydrophone', floor: -33, calls: 0.15, gainRef: 52 },
  'xlr-2': { name: 'Shotgun', floor: -43, calls: 1.25, gainRef: 44 },
  line: { name: 'Line in', floor: -120, calls: 0, gainRef: 20 },
  usb: { name: 'USB return', floor: -120, calls: 0, gainRef: 20 },
}
const inputOptions = inputs.map((i) => ({ label: i.label, value: i.value }))
const phantomCapable = (id: InputId) => inputs.find((i) => i.value === id)?.phantom ?? false

const strips = reactive(initialChannels.map((c) => ({ ...c })))

function onInput(i: number, value: string | number | null | undefined) {
  const id = value as InputId
  const strip = strips[i]
  strip.input = id
  strip.name = PROFILES[id].name
  strip.gainRef = PROFILES[id].gainRef
  if (!phantomCapable(id)) strip.phantom = false
}

/** A condenser on XLR goes silent without phantom power. */
const silent = (i: number) => {
  const s = strips[i]
  return PROFILES[s.input].floor < -100 || (phantomCapable(s.input) && !s.phantom)
}

const anySolo = computed(() => strips.some((s) => s.solo))

/* ── Transport ─────────────────────────────────────────────────────────────────────── */
type Mode = 'recording' | 'playing' | 'stopped'
const mode = ref<Mode>('recording')
const rate = ref<48 | 96>(48)
const takes = ref<Take[]>(initialTakes.map((t) => ({ ...t })))
const selectedId = ref('T08')
const rollingId = ref<string | null>('T08')
const elapsed = ref(rollingElapsed)
const position = ref(0)
/** Time of day, seconds after midnight WIB. */
const now = ref(6 * 3600 + 43 * 60 + 43 + 7 / 25)
const freeBytes = ref(device.freeGb * 1e9)

const selected = computed(() => takes.value.find((t) => t.id === selectedId.value) ?? takes.value[0])
const rolling = computed(() => takes.value.find((t) => t.id === rollingId.value) ?? null)
const isLive = computed(() => mode.value === 'recording' && selected.value.id === rollingId.value)

const lengthOf = (t: Take) => (t.duration ?? (t.id === rollingId.value ? elapsed.value : 0))

const counter = computed(() => {
  if (mode.value === 'recording' && rolling.value) return timecode(elapsed.value)
  return timecode(position.value)
})
const counterLabel = computed(() =>
  mode.value === 'recording' && rolling.value ? `${rolling.value.name} · elapsed` : `${selected.value.name} · position`,
)

function record() {
  if (mode.value === 'recording') return
  const number = takes.value.length + 1
  const take: Take = {
    id: `T${String(number).padStart(2, '0')}`,
    name: `Take ${String(number).padStart(2, '0')}`,
    start: Math.floor(now.value),
    duration: null,
    peak: -60,
    marks: 0,
    rate: rate.value,
    seed: number,
  }
  takes.value = [take, ...takes.value]
  rollingId.value = take.id
  selectedId.value = take.id
  elapsed.value = 0
  position.value = 0
  recorded.value = []
  peakSeen.fill(-60)
  colPeak = 0
  liveCol.value = 0
  mode.value = 'recording'
}

function stop() {
  if (mode.value === 'recording' && rolling.value) {
    const take = rolling.value
    take.duration = Math.round(elapsed.value)
    take.peak = Math.max(take.peak, ...peakSeen)
    finished.set(take.id, [...recorded.value, Math.max(colPeak, 8)])
    rollingId.value = null
    position.value = 0
    mode.value = 'stopped'
    toast.show({
      title: `${take.name} saved`,
      body: `${minutes(take.duration)} · ${formatNumber(sizeMb(take))} MB · ${take.marks} markers`,
      tone: 'success',
    })
    return
  }
  mode.value = 'stopped'
  position.value = 0
}

function togglePlay() {
  if (mode.value === 'recording') return
  if (mode.value === 'playing') {
    mode.value = 'stopped'
    return
  }
  if (position.value >= lengthOf(selected.value) - 0.5) position.value = 0
  mode.value = 'playing'
}

function mark() {
  const take = mode.value === 'recording' ? rolling.value : selected.value
  if (!take) return
  take.marks += 1
  const at = mode.value === 'recording' ? elapsed.value : position.value
  toast.show({ title: `Marker ${take.marks} on ${take.name}`, body: `At ${timecode(at)}`, duration: 3000 })
}

function selectTake(row: Record<string, unknown>) {
  const id = String(row.id)
  if (id === selectedId.value) return
  if (mode.value === 'playing') mode.value = 'stopped'
  selectedId.value = id
  position.value = 0
}

/* ── Levels: a dawn chorus over insects and water ──────────────────────────────────── */
const levels = reactive(strips.map((s) => s.floor))
const peaks = reactive(strips.map((s) => s.floor))
const clipAt = reactive(strips.map(() => -99))
const peakAge = strips.map(() => 0)
const peakSeen = strips.map(() => -60)
let burst = 0
let burstHeight = 0

function stepLevels(dt: number, reduced: boolean) {
  if (burst <= 0 && Math.random() < dt * 0.8) {
    burst = 0.3 + Math.random() * 1.1
    burstHeight = 14 + Math.random() * 17
  }
  burst -= dt
  const calling = burst > 0
  strips.forEach((s, i) => {
    const profile = PROFILES[s.input]
    let target = -120
    if (!silent(i)) {
      const swell = s.input === 'xlr-1' ? Math.sin(now.value * 1.4) * 4 : 0
      const call = calling ? burstHeight * profile.calls * (0.75 + Math.random() * 0.35) : 0
      target = profile.floor + (s.gain - profile.gainRef) + (Math.random() - 0.5) * 5 + call + swell
    }
    target = Math.min(0, target)
    // Ballistics: instant rise, a 24 dB/s fall. Under reduced motion each reading stands alone.
    const prev = levels[i]
    levels[i] = reduced || target > prev ? target : Math.max(target, prev - 24 * dt)
    if (levels[i] >= peaks[i] || peakAge[i] > 2.5) {
      peaks[i] = levels[i]
      peakAge[i] = 0
    } else peakAge[i] += dt
    if (levels[i] >= -1) clipAt[i] = now.value
    if (mode.value === 'recording') peakSeen[i] = Math.max(peakSeen[i], levels[i])
  })
}

const status = (i: number) => {
  if (now.value - clipAt[i] < 2) return { tone: 'danger' as const, label: 'Clip' }
  if (silent(i)) return { tone: 'neutral' as const, label: 'No input' }
  return { tone: 'success' as const, label: 'Signal' }
}

const dbfs = (v: number) => (v <= -60 ? '−∞' : withMinus(v.toFixed(1)))

/* ── Waveform: 96 columns ─────────────────────────────────────────────────────────── */
const COLUMNS = 96
const LIVE_SECONDS = 10
/** Columns already on the card for the rolling take: 76 full columns of 10 s. */
const recorded = ref<number[]>(makeWave(8, Math.floor(rollingElapsed / LIVE_SECONDS)))
const finished = new Map<string, number[]>()
let colPeak = 0
const liveCol = ref(30)

function resample(values: number[], n: number) {
  if (!values.length) return Array.from({ length: n }, () => 0)
  return Array.from({ length: n }, (_, i) => {
    const a = Math.floor((i * values.length) / n)
    const b = Math.max(a + 1, Math.floor(((i + 1) * values.length) / n))
    return Math.max(...values.slice(a, b))
  })
}

const wave = computed(() => {
  const take = selected.value
  if (take.id === rollingId.value) return null
  return finished.get(take.id) ? resample(finished.get(take.id)!, COLUMNS) : makeWave(take.seed, COLUMNS)
})

const waveSeconds = computed(() => (wave.value ? lengthOf(selected.value) / COLUMNS : LIVE_SECONDS))
const waveLabels = computed(() => Array.from({ length: COLUMNS }, (_, i) => minutes(i * waveSeconds.value)))
/** Ticks on whole minutes: every 2 minutes for long takes, every minute for short ones. */
const waveTicks = computed(() => {
  const per = waveSeconds.value
  const total = per * COLUMNS
  const step = (total > 600 ? 2 : 1) * 60
  let next = 0
  return waveLabels.value.map((_, i) => {
    if (i * per + 1e-6 < next) return ''
    const at = next
    next += step
    return minutes(at)
  })
})

const waveSeries = computed(() => {
  if (!wave.value) {
    const done = recorded.value
    const at = done.length
    return [
      { name: 'Recorded', values: Array.from({ length: COLUMNS }, (_, i) => (i < at ? done[i] : 0)) },
      {
        name: 'Recording now',
        values: Array.from({ length: COLUMNS }, (_, i) => (i === at && mode.value === 'recording' ? liveCol.value : 0)),
        color: 'var(--r-chart-now)',
      },
    ]
  }
  const played = Math.floor(position.value / waveSeconds.value)
  const playing = mode.value === 'playing' || position.value > 0
  return [
    { name: 'Played', values: wave.value.map((v, i) => (playing && i <= played ? v : 0)) },
    { name: 'Not played', values: wave.value.map((v, i) => (playing && i <= played ? 0 : v)), color: 'var(--r-chart-context)' },
  ]
})

const axisDb = (v: number) => (v >= 60 ? '0' : withMinus(String(v - 60)))
const tipDb = (v: number) => (v <= 0 ? '—' : `${withMinus(String(v - 60))} dBFS`)

/* ── Storage and battery ──────────────────────────────────────────────────────────── */
const sizeMb = (t: Take) => Math.round((lengthOf(t) * bytesPerSecond(t.rate)) / 1e6)
const sessionGb = computed(() => takes.value.reduce((sum, t) => sum + sizeMb(t), 0) / 1000)
const freeGb = computed(() => freeBytes.value / 1e9)
const timeLeft = computed(() => {
  const seconds = freeBytes.value / bytesPerSecond(rate.value)
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return { h, m, text: `${h} h ${String(m).padStart(2, '0')} min` }
})
/** What the card held before this screen opened, minus this session: everything else on it. */
const initialSessionGb =
  initialTakes.reduce((sum, t) => sum + Math.round(((t.duration ?? rollingElapsed) * bytesPerSecond(t.rate)) / 1e6), 0) / 1000
const otherGb = device.cardGb - device.freeGb - initialSessionGb
const storageSegments = computed(() => [
  { label: 'This session', value: sessionGb.value, color: 'var(--r-chart-1)' },
  { label: 'Other files', value: otherGb, color: 'var(--r-chart-context)' },
])

const rateOptions = computed(() => [
  { label: '48 kHz', value: 48, disabled: mode.value === 'recording' },
  { label: '96 kHz', value: 96, disabled: mode.value === 'recording' },
])

function onRate(value: string | number | undefined) {
  rate.value = value === 96 ? 96 : 48
  toast.show({
    title: `Next take at ${rate.value} kHz`,
    body: `${timeLeft.value.text} of recording left on the card.`,
    duration: 3000,
  })
}

function exportSession() {
  const done = takes.value.filter((t) => t.duration != null)
  toast.show({
    title: 'Export started',
    body: `${done.length} takes · ${formatNumber(sessionGb.value, { maximumFractionDigits: 2 })} GB to Files › Field › ${session.id}`,
  })
}

/* ── Takes table ──────────────────────────────────────────────────────────────────── */
const takeColumns: TableColumn[] = [
  { key: 'name', label: 'Take' },
  { key: 'start', label: 'Start WIB' },
  { key: 'length', label: 'Length', numeric: true },
  { key: 'peak', label: 'Peak dBFS', numeric: true },
  { key: 'size', label: 'Size MB', numeric: true },
]
const takeRows = computed(() =>
  takes.value.map((t) => ({
    id: t.id,
    name: t.name,
    live: t.id === rollingId.value,
    marks: t.marks,
    start: clock(t.start),
    length: minutes(lengthOf(t)),
    peak: t.id === rollingId.value ? dbfs(Math.max(t.peak, ...peakSeen)) : withMinus(t.peak.toFixed(1)),
    size: formatNumber(sizeMb(t)),
  })),
)

/* ── Clock ────────────────────────────────────────────────────────────────────────── */
let timer: number | undefined
let last = 0
let meterRest = 0
let colRest = 0
let reduced = false

function tick() {
  const t = performance.now()
  const dt = Math.min(1.5, (t - last) / 1000)
  last = t
  now.value += dt
  if (mode.value === 'recording' && rolling.value) {
    elapsed.value += dt
    freeBytes.value -= dt * bytesPerSecond(rolling.value.rate)
  }
  if (mode.value === 'playing') {
    position.value = Math.min(position.value + dt, lengthOf(selected.value))
    if (position.value >= lengthOf(selected.value)) mode.value = 'stopped'
  }
  meterRest += dt
  if (reduced || meterRest >= 0.08) {
    stepLevels(meterRest, reduced)
    meterRest = 0
    colPeak = Math.max(colPeak, levels[0] + 60, levels[1] + 60)
  }
  colRest += dt
  if (mode.value === 'recording' && (reduced || colRest >= 0.25)) {
    colRest = 0
    liveCol.value = Math.round(Math.max(8, Math.min(58, colPeak)))
    const full = Math.floor(elapsed.value / LIVE_SECONDS)
    if (full > recorded.value.length) {
      recorded.value = [...recorded.value, liveCol.value]
      colPeak = 0
    }
  }
}

/** The pixel counter drops a size on phones so eleven digits fit. */
const narrow = ref(false)
let narrowQuery: MediaQueryList | undefined
const onNarrow = () => (narrow.value = !!narrowQuery?.matches)

function onKeydown(event: KeyboardEvent) {
  if (event.metaKey || event.ctrlKey || event.altKey || isEditable(event.target)) return
  const target = event.target as HTMLElement | null
  const onControl = !!target?.closest('button, a, [role="slider"], [role="radio"], [role="switch"], [tabindex]')
  const key = event.key.toLowerCase()
  if (key === 'r') record()
  else if (key === 's') stop()
  else if (key === 'm') mark()
  else if (key === ' ' && !onControl) togglePlay()
  else return
  event.preventDefault()
}

onMounted(() => {
  reduced = prefersReducedMotion()
  narrowQuery = window.matchMedia('(max-width: 560px)')
  onNarrow()
  narrowQuery.addEventListener('change', onNarrow)
  last = performance.now()
  stepLevels(1, true)
  timer = window.setInterval(tick, reduced ? 1000 : 40)
  window.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  window.clearInterval(timer)
  window.removeEventListener('keydown', onKeydown)
  narrowQuery?.removeEventListener('change', onNarrow)
})
</script>

<template>
  <SampleShell class="s-fr-shell" :product="`${device.model} field recorder`" padding="none">
    <template #strip>
      <span class="s-fr-strip-muted">{{ session.id }}</span>
    </template>
    <template #meta>
      <span class="s-fr-hide-sm">SN {{ device.serial }} · FW {{ device.firmware }} · {{ formatNumber(device.tempC, { maximumFractionDigits: 1 }) }} °C</span>
      <span class="s-fr-hide-sm">USB-C</span>
      <span>{{ clock(now) }} WIB</span>
    </template>
    <template #header>
      <div class="s-fr-heading">
        <span class="r-eyebrow s-fr-eyebrow">Session {{ session.id }} · {{ session.date }}<span class="s-fr-hide-sm"> · {{ session.coords }}</span></span>
        <h1 class="s-fr-title">{{ session.name }}</h1>
      </div>
    </template>
    <template #actions>
      <RSegmented :model-value="rate" :options="rateOptions" size="sm" label="Sample rate for the next take" @update:model-value="onRate" />
      <RButton variant="outline" size="sm" @click="exportSession">
        <template #leading><Download /></template>
        Export session
      </RButton>
    </template>

    <div class="s-fr">
      <!-- 01 Transport -->
      <RCard class="s-fr-transport" index="01" eyebrow="Transport" marks padding="md">
        <template #actions>
          <RStatus v-if="mode === 'recording'" tone="signal" label="Rec" pulse shape="square" />
          <RStatus v-else-if="mode === 'playing'" tone="brand" label="Play" shape="square" />
          <RStatus v-else tone="neutral" label="Standby" shape="square" />
        </template>
        <RReadout
          :label="counterLabel"
          :value="counter"
          font="pixel"
          :size="narrow ? 'lg' : 'xl'"
          ghost
          :tone="mode === 'recording' ? 'signal' : undefined"
          class="s-fr-counter"
        >
          <template #meta>25 FPS</template>
        </RReadout>
        <dl class="s-fr-facts">
          <div><dt>Time of day</dt><dd>{{ clock(now) }} WIB</dd></div>
          <div><dt>Format</dt><dd>WAV · 32-bit float · {{ rolling ? rolling.rate : rate }} kHz</dd></div>
          <div><dt>Started</dt><dd>{{ clock((rolling ?? selected).start) }}</dd></div>
        </dl>
        <div class="s-fr-keys" role="group" aria-label="Transport">
          <RButton
            tone="signal"
            :aria-pressed="mode === 'recording'"
            aria-keyshortcuts="R"
            class="s-fr-key"
            @click="record"
          >
            <template #leading><Circle class="s-fr-rec-icon" /></template>
            {{ mode === 'recording' ? 'Recording' : 'Record' }}
            <template #trailing><RKbd :keys="['R']" size="sm" class="s-fr-kbd" /></template>
          </RButton>
          <RButton
            variant="outline"
            :disabled="mode === 'recording'"
            :aria-pressed="mode === 'playing'"
            aria-keyshortcuts="Space"
            class="s-fr-key"
            @click="togglePlay"
          >
            <template #leading><Pause v-if="mode === 'playing'" /><Play v-else /></template>
            {{ mode === 'playing' ? 'Pause' : 'Play' }}
          </RButton>
          <RButton variant="outline" aria-keyshortcuts="S" class="s-fr-key" @click="stop">
            <template #leading><Square /></template>
            Stop
            <template #trailing><RKbd :keys="['S']" size="sm" class="s-fr-kbd" /></template>
          </RButton>
          <RButton variant="ghost" aria-keyshortcuts="M" class="s-fr-key" @click="mark">
            <template #leading><Flag /></template>
            Marker
          </RButton>
        </div>
      </RCard>

      <!-- 02 Waveform -->
      <RCard
        class="s-fr-wave"
        index="02"
        eyebrow="Waveform"
        :title="selected.name"
        :meta="isLive ? `10 s a column · ${minutes(elapsed)} of 16:00` : `${minutes(lengthOf(selected))} · peak ${withMinus(selected.peak.toFixed(1))} dBFS`"
        padding="md"
      >
        <template #actions>
          <RStatus v-if="isLive" tone="signal" label="Live" pulse />
        </template>
        <RDotMatrixChart
          :labels="waveLabels"
          :ticks="waveTicks"
          :series="waveSeries"
          :max="60"
          :y-ticks="3"
          :height="168"
          shape="pixel"
          :axis-format="axisDb"
          :format="tipDb"
          :label="`Peak level of ${selected.name} over time, dBFS`"
        />
      </RCard>

      <!-- 03 Channels -->
      <section class="s-fr-channels" aria-labelledby="s-fr-channels-title">
        <header class="s-fr-section-head">
          <p class="s-fr-kicker"><span class="r-index">03</span><span id="s-fr-channels-title" class="r-eyebrow">Channels</span></p>
          <span class="r-label">Gain · level · monitor</span>
        </header>
        <div class="s-fr-strips">
          <article v-for="(s, i) in strips" :key="s.index" class="s-fr-strip" :aria-label="`Channel ${s.index}, ${s.name}`">
            <div class="s-fr-strip__head">
              <span class="s-fr-strip__index">{{ s.index }}</span>
              <span class="s-fr-strip__name">{{ s.name }}</span>
              <RStatus :tone="status(i).tone" :label="status(i).label" size="sm" class="s-fr-strip__status" />
            </div>
            <RSelect
              :model-value="s.input"
              :options="inputOptions"
              size="sm"
              :aria-label="`Input for channel ${s.index}`"
              @update:model-value="(v) => onInput(i, v)"
            />
            <div class="s-fr-strip__knob">
              <RKnob v-model="s.gain" label="Gain" :min="0" :max="64" :detents="17" unit="dB" tone="neutral" />
            </div>
            <LevelMeter :level="levels[i]" :label="`Channel ${s.index} level`" />
            <div class="s-fr-strip__read">
              <span><b>{{ dbfs(levels[i]) }}</b> dBFS</span>
              <span>PK <b>{{ dbfs(peaks[i]) }}</b></span>
            </div>
            <div class="s-fr-strip__toggles">
              <RButton
                size="xs"
                :variant="s.mute ? 'solid' : 'outline'"
                :aria-pressed="s.mute"
                :aria-label="`Mute ${s.name} in headphones`"
                class="s-fr-ms"
                @click="s.mute = !s.mute"
                >M</RButton
              >
              <RButton
                size="xs"
                :tone="s.solo ? 'brand' : 'neutral'"
                :variant="s.solo ? 'solid' : 'outline'"
                :aria-pressed="s.solo"
                :aria-label="`Solo ${s.name} in headphones`"
                class="s-fr-ms"
                @click="s.solo = !s.solo"
                >S</RButton
              >
              <RSwitch
                v-model="s.phantom"
                size="sm"
                :disabled="!phantomCapable(s.input)"
                :aria-label="`48 volt phantom power for channel ${s.index}`"
                label="48V"
              />
            </div>
            <p class="s-fr-strip__mon">
              {{ s.mute ? 'Muted in headphones' : anySolo && !s.solo ? 'Not in solo mix' : s.solo ? 'Solo in headphones' : 'In headphone mix' }}
            </p>
          </article>
        </div>
      </section>

      <div class="s-fr-side">
        <!-- 04 Takes -->
        <RCard class="s-fr-takes" index="04" eyebrow="Takes" :meta="`${takes.length} takes · ${formatNumber(sessionGb, { maximumFractionDigits: 2 })} GB`" padding="none">
          <RTable
            :columns="takeColumns"
            :rows="takeRows"
            :selected="[selectedId]"
            density="compact"
            caption="Takes in this session. Choose a row to show its waveform."
            max-height="226px"
            sticky-header
            @row-click="selectTake"
          >
            <template #cell-name="{ row }">
              <span class="s-fr-take">
                <span class="s-fr-take__name">{{ row.name }}</span>
                <RStatus v-if="row.live" tone="signal" label="Rec" size="sm" pulse />
                <span v-else-if="row.marks" class="s-fr-take__marks">{{ row.marks }} mk</span>
              </span>
            </template>
          </RTable>
        </RCard>

        <!-- 05 Device -->
        <section class="s-fr-device r-grid-ruled" aria-label="Device">
          <div class="s-fr-cell">
            <RReadout label="Battery" :value="device.battery" unit="%" tone="success" size="sm" />
            <RMeter variant="segments" :value="device.battery" :count="10" tone="brand" :height="8" :label="`Battery ${device.battery}%`" />
            <p class="s-fr-sub">{{ Math.floor(device.batteryMinutes / 60) }} h {{ device.batteryMinutes % 60 }} min left</p>
          </div>
          <div class="s-fr-cell">
            <RReadout label="Card free" :value="formatNumber(freeGb, { minimumFractionDigits: 1, maximumFractionDigits: 1 })" unit="GB" size="sm" />
            <RMeter :segments="storageSegments" :max="device.cardGb" :height="8" label="SD card: this session, other files and free space" />
            <p class="s-fr-sub">of {{ device.cardGb }} GB SD</p>
          </div>
          <div class="s-fr-cell">
            <RReadout label="Time left" :value="`${timeLeft.h}:${String(timeLeft.m).padStart(2, '0')}`" unit="h:mm" size="sm" />
            <RMeter variant="segments" :value="Math.min(100, (timeLeft.h / 24) * 100)" :count="10" tone="brand" :height="8" label="Recording time left, of 24 hours" />
            <p class="s-fr-sub">at {{ rate }} kHz · 4 ch</p>
          </div>
        </section>
      </div>
    </div>
  </SampleShell>
</template>

<style scoped>
/* A light grey canvas, like the body of the recorder; panels sit on it in white. */
.s-fr-shell {
  background: var(--r-bg-muted);
}
:global([data-theme='dark']) .s-fr-shell {
  background: var(--r-bg-canvas);
}

.s-fr {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 16px;
  padding: 24px;
}

.s-fr-strip-muted {
  color: var(--r-text-tertiary);
}

.s-fr-heading {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.s-fr-eyebrow {
  color: var(--r-text-tertiary);
}
.s-fr-title {
  font-size: var(--r-text-xl);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-tight);
  line-height: 1.2;
}

/* ── 01 Transport ─────────────────────────────────────────────────────────── */
.s-fr-transport {
  grid-column: span 5;
}
.s-fr-counter {
  padding: 4px 0 2px;
}
.s-fr-facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, auto));
  justify-content: start;
  gap: 4px 24px;
  margin: 0;
}
.s-fr-facts div {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.s-fr-facts dt {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.s-fr-facts dd {
  margin: 0;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.s-fr-keys {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: auto;
}
.s-fr-kbd {
  margin-left: 4px;
}
.s-fr-rec-icon {
  fill: currentColor;
}

/* ── 02 Waveform ──────────────────────────────────────────────────────────── */
.s-fr-wave {
  grid-column: span 7;
}

/* ── 03 Channels ──────────────────────────────────────────────────────────── */
.s-fr-channels {
  grid-column: span 8;
  display: flex;
  flex-direction: column;
  min-width: 0;
  border: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}
.s-fr-section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px 12px;
  border-bottom: 1px solid var(--r-border);
}
.s-fr-kicker {
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.s-fr-kicker .r-eyebrow {
  color: var(--r-text-secondary);
}
.s-fr-strips {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  flex: 1;
}
.s-fr-strip {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  padding: 14px 16px 16px;
  border-right: 1px solid var(--r-border-subtle);
}
.s-fr-strip:last-child {
  border-right: 0;
}
.s-fr-strip__head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 8px;
  min-width: 0;
}
.s-fr-strip__index {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xl);
  font-weight: var(--r-weight-medium);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.s-fr-strip__name {
  overflow: hidden;
  min-width: 0;
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-semibold);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.s-fr-strip__status {
  margin-left: auto;
}
.s-fr-strip__knob {
  display: flex;
  justify-content: center;
  padding: 2px 0;
}
.s-fr-strip__read {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.s-fr-strip__read b {
  color: var(--r-text);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
}
.s-fr-strip__toggles {
  display: flex;
  align-items: center;
  gap: 6px;
}
.s-fr-ms {
  width: 28px;
  font-family: var(--r-font-mono);
}
.s-fr-strip__toggles :deep(.r-switch) {
  margin-left: auto;
}
.s-fr-strip__mon {
  margin-top: -4px;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

/* ── 04 Takes + 05 Device ─────────────────────────────────────────────────── */
.s-fr-side {
  grid-column: span 4;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}
.s-fr-takes {
  flex: 1;
  gap: 12px;
}
.s-fr-take {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.s-fr-take__name {
  font-weight: var(--r-weight-medium);
}
.s-fr-take__marks {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

/* ── 05 Device ────────────────────────────────────────────────────────────── */
.s-fr-device {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.s-fr-cell {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px 14px;
}
.s-fr-sub {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

@media (max-width: 1279px) {
  .s-fr-transport,
  .s-fr-wave {
    grid-column: 1 / -1;
  }
  .s-fr-channels,
  .s-fr-side {
    grid-column: 1 / -1;
  }
}

@media (max-width: 767px) {
  .s-fr {
    gap: 12px;
    padding: 16px;
  }
  .s-fr-strips {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .s-fr-strip:nth-child(2n) {
    border-right: 0;
  }
  .s-fr-strip:nth-child(-n + 2) {
    border-bottom: 1px solid var(--r-border-subtle);
  }
  .s-fr-facts {
    grid-template-columns: repeat(2, minmax(0, auto));
  }
  .s-fr-hide-sm {
    display: none;
  }
}

@media (max-width: 420px) {
  .s-fr-strip {
    padding: 12px;
  }
}
</style>
