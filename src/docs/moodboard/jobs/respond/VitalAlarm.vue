<script setup lang="ts">
/**
 * A bedside alarm: the vital sign past its limit, its live trace, and the one action a nurse takes
 * on the way to the bed, which is to silence the sound for two minutes. Silencing never hides the
 * alarm: the figure stays red and the lamp keeps blinking until the reading is back in range.
 */
import { computed, ref } from 'vue'
import { Volume2, VolumeX } from 'lucide-vue-next'
import { RButton, RStatus } from '@/design-system'
import { num, seeded, useTick } from '../../kit'
import { later, mmss, useCountdown, useFocusKeeper } from './shared'

interface Extra {
  label: string
  value: string
  unit: string
}

const props = withDefaults(
  defineProps<{
    /** Mono caps: "ICU 2 · Bed 12". */
    bed: string
    patient?: string
    /** The vital: "SpO₂". */
    label: string
    unit: string
    value: number
    decimals?: number
    /** Alarm limit, and whether the alarm is under it (SpO₂, BP) or over it (HR, temperature). */
    limit: number
    below?: boolean
    word: string
    tone?: 'danger' | 'warning'
    /** Shape of the trace. */
    wave?: 'pleth' | 'ecg' | 'resp'
    seed: string
    /** Seconds a silence lasts. */
    silence?: number
    extra?: Extra[]
    /** Geist Pixel for the figure, the monitor's own digits. */
    pixel?: boolean
    /** `panel` 2x2 · `tall` 1x2 · `row` 2x1. */
    layout?: 'panel' | 'tall' | 'row'
  }>(),
  { decimals: 0, below: false, tone: 'danger', wave: 'pleth', silence: 120, extra: () => [], pixel: false, layout: 'panel' },
)

/* One beat of each wave, in straight segments, 0 (bottom) to 1 (top). */
const SHAPES: Record<string, number[]> = {
  pleth: [0.18, 0.5, 0.86, 0.95, 0.8, 0.62, 0.5, 0.56, 0.5, 0.4, 0.31, 0.24, 0.2, 0.18],
  ecg: [0.32, 0.32, 0.38, 0.32, 0.3, 0.95, 0.08, 0.34, 0.32, 0.32, 0.44, 0.48, 0.38, 0.32, 0.32, 0.32],
  resp: [0.3, 0.42, 0.56, 0.68, 0.76, 0.8, 0.76, 0.66, 0.54, 0.42, 0.33, 0.28, 0.26, 0.26, 0.28, 0.3],
}

const rnd = seeded(props.seed)
const shape = SHAPES[props.wave]
const samples = Array.from({ length: 160 }, (_, i) => shape[i % shape.length] * (0.9 + rnd() * 0.12))
/* The reading wanders by one step of its last digit: 148 → 147, 38.1 → 38.2. */
const jitter = Array.from({ length: 64 }, () => Math.round((rnd() - 0.5) * 2.4) / 10 ** props.decimals)

const WINDOW = 56
const fast = useTick(140)
const slow = useTick(2000)
const points = computed(() => {
  const start = fast.value % (samples.length - WINDOW)
  return samples
    .slice(start, start + WINDOW)
    .map((v, i) => `${((i / (WINDOW - 1)) * 100).toFixed(2)},${(100 - v * 92 - 4).toFixed(2)}`)
    .join(' ')
})
const reading = computed(() => props.value + jitter[slow.value % jitter.length])

const silencedUntil = ref<string | null>(null)
const silence = useCountdown(props.silence, { onDone: () => (silencedUntil.value = null) })
const left = silence.left
const { bind, keep } = useFocusKeeper()

function silenceNow() {
  keep('[data-focus="resume"]')
  silencedUntil.value = later(props.silence / 60)
  silence.start()
}

function resume() {
  keep('[data-focus="silence"]')
  silencedUntil.value = null
  silence.stop()
}

const silenceFor = props.silence >= 60 ? `${props.silence / 60} min` : `${props.silence} s`
const limitText = computed(() => `${props.below ? 'Low' : 'High'} limit ${num(props.limit, props.decimals)}`)
</script>

<template>
  <div :ref="bind" class="mk vital" :class="`vital--${layout}`">
    <div class="vital__head">
      <span class="r-eyebrow mk-truncate">{{ bed }}</span>
      <RStatus :tone="tone" :label="word" pulse size="sm" class="vital__status" />
    </div>

    <div class="vital__main">
      <div class="vital__read" :class="`r-tone-${tone}`">
        <p class="vital__label">
          <span>{{ label }}</span>
          <span class="vital__limit">{{ limitText }}</span>
        </p>
        <p class="vital__figure">
          <span class="mk-fig" :class="{ 'r-pixel': pixel }">{{ num(reading, decimals) }}</span>
          <span class="mk-unit">{{ unit }}</span>
        </p>
        <p v-if="patient && layout !== 'row'" class="vital__patient">{{ patient }}</p>
      </div>

      <div class="vital__trace" aria-hidden="true">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline :points="points" />
        </svg>
      </div>

      <dl v-if="extra.length && layout === 'panel'" class="vital__extra">
        <div v-for="x in extra" :key="x.label">
          <dt class="r-label">{{ x.label }}</dt>
          <dd><span class="vital__x">{{ x.value }}</span> <span class="mk-unit">{{ x.unit }}</span></dd>
        </div>
      </dl>
    </div>

    <p class="r-sr-only" aria-live="polite">{{ silencedUntil ? `Sound silenced until ${silencedUntil}` : '' }}</p>
    <div class="vital__foot">
      <span class="vital__audio" :class="{ 'is-off': silencedUntil }">
        <component :is="silencedUntil ? VolumeX : Volume2" :size="14" aria-hidden="true" />
        {{ silencedUntil ? `Silenced · ${mmss(left)}` : 'Sounding' }}
      </span>
      <RButton v-if="!silencedUntil" size="sm" data-focus="silence" @click="silenceNow">Silence {{ silenceFor }}</RButton>
      <RButton v-else size="sm" variant="ghost" data-focus="resume" @click="resume">Sound on</RButton>
    </div>
  </div>
</template>

<style scoped>
.vital {
  gap: 8px;
}

.vital__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.vital__status {
  flex: none;
}

.vital__main {
  display: grid;
  flex: 1 1 auto;
  min-height: 0;
  gap: 8px 12px;
}

.vital--panel .vital__main {
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto minmax(0, 1fr) auto;
}

.vital--row .vital__main {
  grid-template-columns: auto minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
}

.vital--tall .vital__main {
  grid-template-rows: auto minmax(0, 1fr);
}

.vital__label {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.04em;
}

.vital__limit {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-medium);
  text-transform: uppercase;
}

.vital--row .vital__limit {
  display: none;
}

.vital__figure {
  display: flex;
  align-items: baseline;
  gap: 4px;
  color: var(--tone-text);
}

.vital__figure .mk-fig {
  font-size: var(--r-text-4xl);
}

.vital--row .vital__figure .mk-fig {
  font-size: var(--r-text-3xl);
}

.vital__figure .r-pixel {
  font-weight: 400;
  letter-spacing: 0.02em;
}

.vital__patient {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.vital__trace {
  position: relative;
  min-width: 0;
  min-height: 40px;
  border-top: 1px solid var(--r-chart-grid);
  border-bottom: 1px solid var(--r-chart-grid);
}

.vital__trace svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.vital__trace polyline {
  fill: none;
  stroke: var(--r-chart-1);
  stroke-width: 1.5;
  stroke-linejoin: miter;
  vector-effect: non-scaling-stroke;
}

.vital__extra {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
}

.vital__extra dd {
  margin: 2px 0 0;
}

.vital__x {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-lg);
  font-variant-numeric: tabular-nums;
}

.vital__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.vital--tall .vital__foot > :last-child {
  flex: 1 1 100%;
}

.vital__audio {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--r-text);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-variant-numeric: tabular-nums;
}

.vital__audio.is-off {
  color: var(--r-text-tertiary);
}
</style>
