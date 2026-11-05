<script setup lang="ts">
/**
 * One measure against its target: a bullet graph in a small tile. The cobalt bar is the measure,
 * the ink tick the target, the grey bands poor, fair and good; the word says which side of the
 * target it landed. Switch the period to compare month, quarter or year to date.
 */
import { computed, ref } from 'vue'
import { RStatus } from '@/design-system'
import { fmt, type Fmt } from './shared'
import Keys from './Keys.vue'

interface Period {
  key: string
  label: string
  value: number
  target: number
  /** Upper edges of the poor, fair and good bands, ascending; the last is the end of the scale. */
  ranges: number[]
  /** Last period, drawn as a thin bar inside the measure. */
  previous?: number
}

const props = withDefaults(
  defineProps<{
    label: string
    unit?: string
    periods: Period[]
    format?: Fmt
    /** For costs, latency and caps: meeting the target means staying under it. */
    lowerIsBetter?: boolean
    /** Words for met and missed: "On target", "Behind". */
    met?: string
    missed?: string
  }>(),
  { format: () => ({}), met: 'On target', missed: 'Behind' },
)

const key = ref(props.periods[props.periods.length - 1].key)
const p = computed(() => props.periods.find((x) => x.key === key.value) ?? props.periods[0])
const options = computed(() => props.periods.map((x) => ({ value: x.key, label: x.label })))

const BANDS = [
  'color-mix(in srgb, var(--r-chart-ink) 22%, var(--r-chart-surface))',
  'color-mix(in srgb, var(--r-chart-ink) 13%, var(--r-chart-surface))',
  'color-mix(in srgb, var(--r-chart-ink) 7%, var(--r-chart-surface))',
]

const max = computed(() => Math.max(p.value.ranges[p.value.ranges.length - 1], p.value.value, p.value.target))
const at = (v: number) => `${Math.min(100, Math.max(0, (v / max.value) * 100))}%`
const bands = computed(() => {
  const tones = props.lowerIsBetter ? [...BANDS].reverse() : BANDS
  let start = 0
  return p.value.ranges.map((edge, i) => {
    const band = { left: at(start), width: `${((edge - start) / max.value) * 100}%`, color: tones[Math.min(i, tones.length - 1)] }
    start = edge
    return band
  })
})
const ok = computed(() => (props.lowerIsBetter ? p.value.value <= p.value.target : p.value.value >= p.value.target))
const ofTarget = computed(() => (p.value.value / p.value.target) * 100)
const withUnit = (v: number) => `${fmt(v, props.format)}${props.unit ? ` ${props.unit}` : ''}`
</script>

<template>
  <div class="mk cmp r-chart bullet1">
    <div class="mk-row mk-between">
      <span class="r-label mk-truncate">{{ label }}</span>
      <Keys v-if="periods.length > 1" v-model="key" :options="options" :label="`${label}: period`" />
    </div>
    <div class="bullet1__head">
      <p class="bullet1__figure">
        <span class="mk-fig">{{ fmt(p.value, format) }}</span>
        <span v-if="unit" class="mk-unit">{{ unit }}</span>
      </p>
      <RStatus :tone="ok ? 'success' : lowerIsBetter ? 'danger' : 'warning'" :label="ok ? met : missed" size="sm" />
    </div>
    <div
      class="bullet1__track mk-end"
      role="img"
      :aria-label="`${label}, ${p.label}: ${withUnit(p.value)} against a target of ${withUnit(p.target)}`"
    >
      <span v-for="(b, i) in bands" :key="i" class="bullet1__band" :style="{ left: b.left, width: b.width, background: b.color }" />
      <span v-if="p.previous != null" class="bullet1__previous" :style="{ width: at(p.previous) }" />
      <span class="bullet1__measure" :style="{ width: at(p.value) }" />
      <span class="bullet1__target" :style="{ left: at(p.target) }" />
    </div>
    <div class="bullet1__ticks" aria-hidden="true">
      <span>0</span>
      <span class="bullet1__of">{{ fmt(ofTarget, { kind: 'pct' }) }} of {{ fmt(p.target, format) }}</span>
      <span>{{ fmt(max, format) }}</span>
    </div>
  </div>
</template>

<style scoped>
.bullet1 {
  gap: 6px;
}

.bullet1__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 4px 8px;
  min-width: 0;
}

.bullet1__figure {
  display: flex;
  align-items: baseline;
  gap: 4px;
  min-width: 0;
  white-space: nowrap;
}

.bullet1__figure .mk-fig {
  font-size: var(--r-text-2xl);
}

.bullet1__track {
  position: relative;
  flex: none;
  height: 18px;
}

.bullet1__band {
  position: absolute;
  top: 0;
  bottom: 0;
}

.bullet1__previous {
  position: absolute;
  top: 7px;
  left: 0;
  height: 4px;
  background: var(--r-chart-context);
}

.bullet1__measure {
  position: absolute;
  top: 5px;
  left: 0;
  height: 8px;
  background: var(--r-chart-1);
  transition: width var(--r-duration-base) var(--r-ease-out);
}

.bullet1__target {
  position: absolute;
  top: 1px;
  bottom: 1px;
  width: 2px;
  margin-left: -1px;
  background: var(--r-chart-ink);
  transition: left var(--r-duration-base) var(--r-ease-out);
}

.bullet1__ticks {
  display: flex;
  justify-content: space-between;
  gap: 6px;
  color: var(--r-chart-label);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
  line-height: 12px;
  white-space: nowrap;
}

.bullet1__of {
  min-width: 0;
  overflow: hidden;
  color: var(--r-text-secondary);
  text-overflow: ellipsis;
}
</style>
