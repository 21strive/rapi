<script setup lang="ts">
/**
 * A reading over its limit, live. The line shows how it got there and the dashed limit it
 * crossed; the lamp blinks while it is out of range and nobody has muted it. Mute holds the alarm
 * for a fixed time and says until when; it comes back by itself.
 */
import { computed, ref, watch } from 'vue'
import { BellOff } from 'lucide-vue-next'
import { RButton, RStatus } from '@/design-system'
import { num, signed, useTick, walk } from '../../kit'
import { later, mmss, span, useCountdown, useFocusKeeper } from './shared'

const props = withDefaults(
  defineProps<{
    label: string
    sub?: string
    unit: string
    limit: number
    /** Breach when the value is above the limit (temperature, disk) or below it (pressure). */
    below?: boolean
    /** The word on the lamp while out of range: "Above limit". */
    word?: string
    tone?: 'warning' | 'danger'
    /** Shapes the live series. */
    seed: string
    start: number
    /** Step of the walk as a share of the start value. */
    vol?: number
    /** Clamp of the walk, so the reading stays near its limit. */
    min: number
    max: number
    decimals?: number
    /** Minutes a mute lasts. */
    mute?: number
    /** Seconds it has been out of range when the tile appears. */
    outFor?: number
    /** `row` for 2x1, `panel` for 2x2. */
    layout?: 'row' | 'panel'
  }>(),
  { below: false, word: 'Above limit', tone: 'warning', vol: 0.02, decimals: 1, mute: 15, outFor: 0, layout: 'row' },
)

const N = 36
const series = walk(props.seed, 480, props.start, props.vol, { min: props.min, max: props.max, decimals: props.decimals })
const tick = useTick(1500)
const offset = computed(() => tick.value % (series.length - N))
const values = computed(() => series.slice(offset.value, offset.value + N))
const value = computed(() => values.value[values.value.length - 1] ?? props.start)
const out = computed(() => (props.below ? value.value < props.limit : value.value > props.limit))

/* How long it has been out of range: counts on the same clock as the line. */
const outSeconds = ref(props.outFor)
watch(tick, () => {
  outSeconds.value = out.value ? outSeconds.value + 1.5 : 0
})

const mutedUntil = ref<string | null>(null)
const muteClock = useCountdown(props.mute * 60, { onDone: () => (mutedUntil.value = null) })
const muteLeft = muteClock.left
const { bind, keep } = useFocusKeeper()

function muteNow() {
  keep('[data-focus="unmute"]')
  mutedUntil.value = later(props.mute)
  muteClock.start()
}

function unmute() {
  keep('[data-focus="mute"]')
  mutedUntil.value = null
  muteClock.stop()
}

const status = computed(() => {
  if (!out.value) return { tone: 'success' as const, label: 'In range', pulse: false }
  if (mutedUntil.value) return { tone: 'neutral' as const, label: 'Muted', pulse: false }
  return { tone: props.tone, label: props.word, pulse: true }
})

const fmt = (v: number) => num(v, props.decimals)
const delta = computed(() => signed(value.value - props.limit, props.decimals, ''))

/* Plot: a fixed frame around the limit so the dashed line never moves. */
const lo = Math.min(props.min, props.limit)
const hi = Math.max(props.max, props.limit)
const pad = (hi - lo) * 0.12
const y = (v: number) => 100 - ((v - (lo - pad)) / (hi - lo + pad * 2)) * 100
const points = computed(() => values.value.map((v, i) => `${(i / (N - 1)) * 100},${y(v).toFixed(2)}`).join(' '))
const limitY = y(props.limit)
const nowY = computed(() => y(value.value))
const band = props.below ? { top: limitY, height: 100 - limitY } : { top: 0, height: limitY }
</script>

<template>
  <div :ref="bind" class="mk thr" :class="[`thr--${layout}`, `thr--${tone}`]">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ label }}</span>
      <RStatus :tone="status.tone" :label="status.label" :pulse="status.pulse" size="sm" class="thr__status" />
    </div>

    <div class="thr__body">
      <div class="thr__read">
        <p class="thr__figure">
          <span class="mk-fig">{{ fmt(value) }}</span>
          <span class="mk-unit">{{ unit }}</span>
        </p>
        <p class="thr__delta">
          <template v-if="out">{{ delta }} {{ unit }} {{ below ? 'under' : 'over' }} · {{ span(outSeconds) }}</template>
          <template v-else>Limit {{ fmt(limit) }} {{ unit }}</template>
        </p>
        <p v-if="sub && layout === 'panel'" class="thr__sub">{{ sub }}</p>
      </div>

      <div class="thr__plot" role="img" :aria-label="`${label}: ${fmt(value)} ${unit}, limit ${fmt(limit)} ${unit}`">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <rect class="thr__band" x="0" :y="band.top" width="100" :height="band.height" />
          <line class="thr__limit" x1="0" x2="100" :y1="limitY" :y2="limitY" />
          <polyline class="thr__line" :points="points" />
        </svg>
        <span class="thr__now" :style="{ top: `${nowY}%` }" aria-hidden="true" />
        <span class="thr__tag" :style="{ top: `${limitY}%` }" aria-hidden="true">Limit {{ fmt(limit) }}</span>
      </div>
    </div>

    <div class="thr__foot">
      <RButton v-if="!mutedUntil" size="sm" variant="outline" data-focus="mute" @click="muteNow">
        <template #leading><BellOff :size="14" aria-hidden="true" /></template>
        Mute {{ mute }} min
      </RButton>
      <template v-else>
        <span class="thr__muted">Muted until {{ mutedUntil }} · {{ mmss(muteLeft) }}</span>
        <RButton size="sm" variant="ghost" data-focus="unmute" @click="unmute">Unmute</RButton>
      </template>
    </div>
  </div>
</template>

<style scoped>
.thr {
  gap: 8px;
}

.thr__status {
  flex: none;
}

.thr__body {
  display: grid;
  flex: 1 1 auto;
  min-height: 0;
  gap: 12px;
}

.thr--row .thr__body {
  grid-template-columns: auto minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
  align-items: stretch;
}

.thr--panel .thr__body {
  grid-template-rows: auto minmax(0, 1fr);
}

.thr__read {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.thr__figure {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.thr__figure .mk-fig {
  font-size: var(--r-text-2xl);
}

.thr--panel .thr__figure .mk-fig {
  font-size: var(--r-text-3xl);
}

.thr__delta,
.thr__muted {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.thr__sub {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.thr__plot {
  position: relative;
  min-width: 0;
  min-height: 36px;
  border-bottom: 1px solid var(--r-chart-axis);
}

.thr__plot svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.thr__band {
  fill: color-mix(in srgb, var(--r-status-warning) 12%, transparent);
}

.thr--danger .thr__band {
  fill: color-mix(in srgb, var(--r-status-critical) 9%, transparent);
}

.thr__limit {
  stroke: var(--r-chart-ink);
  stroke-width: 1;
  stroke-dasharray: 4 3;
  vector-effect: non-scaling-stroke;
}

.thr__line {
  fill: none;
  stroke: var(--r-chart-1);
  stroke-width: 2;
  stroke-linejoin: miter;
  vector-effect: non-scaling-stroke;
}

/* The live end of the line: the "now" point, ringed in the surface. */
.thr__now {
  position: absolute;
  right: -4px;
  width: 8px;
  height: 8px;
  border-radius: var(--r-radius-round);
  background: var(--r-chart-now);
  box-shadow: 0 0 0 2px var(--r-chart-surface);
  transform: translateY(-50%);
}

.thr__tag {
  position: absolute;
  left: 0;
  padding: 0 4px 0 0;
  background: var(--r-chart-surface);
  color: var(--r-chart-label);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  line-height: 1;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  transform: translateY(-130%);
}

.thr__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: var(--r-control-sm);
}

.thr__muted {
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
