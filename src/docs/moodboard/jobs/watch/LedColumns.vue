<script setup lang="ts">
/**
 * A dot-matrix display, as on a hardware instrument. `scroll` pushes a new column in from the right
 * every tick, the newest in orange; run the pointer along it to read a column. `spectrum` shows
 * bands with peak dots that hold and fall. The key in the corner switches what is shown.
 */
import { computed, ref, shallowRef, watch } from 'vue'
import { RButton, RStatus } from '@/design-system'
import { num, reducedMotion, seeded, useTick } from '../../kit'
import { clamp, columnAt, useElementSize } from './shared'

interface Metric {
  label: string
  unit: string
  base: number
  vol?: number
  decimals?: number
  /** Top of the matrix, in the metric's unit. */
  max: number
}

const props = withDefaults(
  defineProps<{
    label: string
    metrics: Metric[]
    kind?: 'scroll' | 'spectrum'
    /** Dot rows. */
    rows?: number
    seed: string
    ms?: number
  }>(),
  { kind: 'scroll', rows: 8, ms: 1000 },
)

const COLS = 40
const rnd = seeded(props.seed)
const which = ref(0)
const metric = computed(() => props.metrics[which.value])

const walk = (m: Metric, last: number) => clamp(last + (rnd() - 0.5) * 2 * (m.vol ?? 0.15) * m.base + (m.base - last) * 0.25, 0, m.max)
const histories = shallowRef(
  props.metrics.map((m) => {
    let v = m.base
    return Array.from({ length: COLS }, () => (v = walk(m, v)))
  }),
)
const peaks = shallowRef(Array.from({ length: COLS }, () => 0))
const holdPeaks = ref(true)

const tick = useTick(props.kind === 'spectrum' && !reducedMotion() ? 140 : props.ms)
watch(tick, () => {
  if (props.kind === 'spectrum') {
    const m = props.metrics[which.value]
    const fresh = Array.from({ length: COLS }, (_, i) => {
      const shape = Math.exp(-i / 18) * 0.85 + 0.15
      return clamp(m.max * shape * (0.35 + rnd() * 0.5), 0, m.max)
    })
    histories.value = histories.value.map((h, k) => (k === which.value ? fresh : h))
    peaks.value = peaks.value.map((p, i) => Math.max(fresh[i], p - m.max * 0.04))
    return
  }
  histories.value = props.metrics.map((m, k) => {
    const h = histories.value[k]
    return [...h.slice(1), walk(m, h[h.length - 1])]
  })
})

const box = ref<HTMLElement | null>(null)
const { width, height } = useElementSize(box)
const GAP = 2
const dot = computed(() => Math.max(3, Math.floor((height.value - GAP * (props.rows - 1)) / props.rows)))
const cols = computed(() => clamp(Math.floor((width.value + GAP) / (dot.value + GAP)), 1, COLS))
const shown = computed(() => histories.value[which.value].slice(props.kind === 'spectrum' ? 0 : COLS - cols.value).slice(0, cols.value))

const paths = computed(() => {
  const d = dot.value
  const step = d + GAP
  const n = shown.value.length
  let off = ''
  let on = ''
  let now = ''
  let peak = ''
  const sq = (c: number, r: number) => `M${c * step} ${(props.rows - 1 - r) * step}h${d}v${d}h${-d}Z`
  shown.value.forEach((v, c) => {
    const lit = Math.round((v / metric.value.max) * props.rows)
    for (let r = 0; r < props.rows; r++) {
      if (r < lit) {
        if (props.kind === 'scroll' && c === n - 1) now += sq(c, r)
        else on += sq(c, r)
      } else off += sq(c, r)
    }
    if (props.kind === 'spectrum' && holdPeaks.value) {
      const pr = Math.min(props.rows - 1, Math.round((peaks.value[c] / metric.value.max) * props.rows) - 1)
      if (pr >= lit) peak += sq(c, pr)
    }
  })
  return { off, on, now, peak }
})

const hovered = ref<number | null>(null)
const reading = computed(() => (hovered.value == null ? shown.value[shown.value.length - 1] : shown.value[hovered.value]))
/** A spectrum reads as the loudest band against full scale, in dBFS. */
const loudest = computed(() => 20 * Math.log10(Math.max(1e-3, Math.max(...shown.value)) / metric.value.max))
function onMove(event: PointerEvent) {
  if (props.kind === 'scroll') hovered.value = columnAt(event, shown.value.length)
}
function cycle() {
  which.value = (which.value + 1) % props.metrics.length
}
</script>

<template>
  <div class="mk dots">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ label }}</span>
      <RButton v-if="metrics.length > 1" size="xs" variant="outline" :aria-label="`Showing ${metric.label}. Show ${metrics[(which + 1) % metrics.length].label}`" @click="cycle">
        {{ metric.label }}
      </RButton>
      <RButton v-else-if="kind === 'spectrum'" size="xs" :variant="holdPeaks ? 'solid' : 'outline'" :aria-pressed="holdPeaks" @click="holdPeaks = !holdPeaks">Peaks</RButton>
    </div>

    <p class="dots__read">
      <span class="mk-fig">{{ kind === 'spectrum' ? num(loudest, 1) : num(reading, metric.decimals ?? 0) }}</span>
      <span class="mk-unit">{{ kind === 'spectrum' ? 'dBFS' : metric.unit }}</span>
      <RStatus v-if="hovered != null" size="sm" :label="`${shown.length - 1 - hovered} s ago`" class="dots__when" />
      <RStatus v-else-if="kind === 'scroll'" tone="signal" pulse size="sm" label="Live" class="dots__when" />
    </p>

    <div ref="box" class="dots__matrix mk-grow" @pointermove="onMove" @pointerleave="hovered = null">
      <svg :width="width" :height="height" aria-hidden="true">
        <path class="dots__off" :d="paths.off" />
        <path class="dots__on" :d="paths.on" />
        <path class="dots__now" :d="paths.now" />
        <path class="dots__peak" :d="paths.peak" />
        <rect
          v-if="hovered != null"
          class="dots__cursor"
          :x="hovered * (dot + 2) - 1"
          y="0"
          :width="dot + 2"
          :height="height"
        />
      </svg>
    </div>
  </div>
</template>

<style scoped>
.dots {
  gap: 6px;
}

.dots__read {
  display: flex;
  align-items: baseline;
  gap: 4px;
  min-width: 0;
}

.dots__read .mk-fig {
  font-size: var(--r-text-2xl);
}

.dots__when {
  margin-left: auto;
}

.dots__matrix {
  min-height: 24px;
  cursor: crosshair;
}

.dots__matrix svg {
  display: block;
}

.dots__off {
  fill: var(--r-bg-track);
}

.dots__on {
  fill: var(--r-text);
}

.dots__now {
  fill: var(--r-chart-now);
}

.dots__peak {
  fill: var(--r-chart-now);
}

.dots__cursor {
  fill: none;
  stroke: var(--r-chart-axis);
  stroke-width: 1;
}
</style>
