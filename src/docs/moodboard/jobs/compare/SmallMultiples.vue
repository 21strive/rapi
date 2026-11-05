<script setup lang="ts">
/**
 * Four panels, one scale: the same measure for a few places, each in its own small panel. On a
 * shared scale the panels compare amounts; on their own scales they compare shapes. The switch
 * is the point of the tile. Press a panel to keep it in cobalt while the others go grey.
 */
import { computed, ref } from 'vue'
import { fmt, type Fmt } from './shared'
import Keys from './Keys.vue'

interface Panel {
  name: string
  values: number[]
}

const props = withDefaults(
  defineProps<{
    label: string
    unit?: string
    panels: Panel[]
    format?: Fmt
    /** First and last x label: "1 Oct", "31 Oct". */
    range: [string, string]
    /** Columns of panels. */
    cols?: number
    /** Floor and ceiling of the shared scale; default the data's own. */
    min?: number
    max?: number
    /** Show each panel's y range under its line. */
    ranges?: boolean
  }>(),
  { format: () => ({}), cols: 2, ranges: true },
)

const scale = ref('shared')
const scaleOptions = [
  { value: 'shared', label: 'Shared' },
  { value: 'own', label: 'Own' },
]
const focus = ref<number | null>(null)

const all = computed(() => props.panels.flatMap((p) => p.values))
const shared = computed(() => ({ lo: props.min ?? Math.min(...all.value), hi: props.max ?? Math.max(...all.value) }))

const lines = computed(() =>
  props.panels.map((p) => {
    const own = { lo: Math.min(...p.values), hi: Math.max(...p.values) }
    const pad = (own.hi - own.lo) * 0.1 || 1
    const d = scale.value === 'shared' ? shared.value : { lo: own.lo - pad, hi: own.hi + pad }
    const span = d.hi - d.lo || 1
    const n = p.values.length
    const pts = p.values.map((v, i) => `${(i / (n - 1)) * 100},${40 - ((v - d.lo) / span) * 40}`)
    return {
      d: `M${pts.join('L')}`,
      last: p.values[n - 1],
      lo: d.lo,
      hi: d.hi,
    }
  }),
)

function press(i: number) {
  focus.value = focus.value === i ? null : i
}
</script>

<template>
  <div class="mk cmp r-chart multiples">
    <div class="mk-row mk-between">
      <span class="r-label mk-truncate">{{ label }}</span>
      <Keys v-model="scale" :options="scaleOptions" label="Scale" />
    </div>
    <div class="multiples__grid mk-grow" :style="{ '--cols': cols }">
      <button
        v-for="(p, i) in panels"
        :key="p.name"
        type="button"
        class="multiples__panel mk-reset"
        :class="{ 'is-dim': focus != null && focus !== i, 'is-on': focus === i }"
        :aria-pressed="focus === i"
        :aria-label="`${p.name}, now ${fmt(lines[i].last, format)}${unit ? ` ${unit}` : ''}, from ${range[0]} to ${range[1]}`"
        @click="press(i)"
      >
        <span class="multiples__head">
          <span class="multiples__name">{{ p.name }}</span>
          <span class="multiples__last">{{ fmt(lines[i].last, format) }}</span>
        </span>
        <svg class="multiples__svg" viewBox="0 -2 100 44" preserveAspectRatio="none" aria-hidden="true">
          <line class="multiples__base" x1="0" x2="100" y1="40" y2="40" />
          <path class="multiples__line" :d="lines[i].d" />
        </svg>
        <span v-if="ranges" class="multiples__range">
          {{ fmt(lines[i].lo, format) }}–{{ fmt(lines[i].hi, format) }}{{ unit ? ` ${unit}` : '' }}
        </span>
      </button>
    </div>
    <p class="multiples__x" aria-hidden="true">
      <span>{{ range[0] }}</span>
      <span>{{ scale === 'shared' ? 'Same scale in every panel' : 'Each panel on its own scale' }}</span>
      <span>{{ range[1] }}</span>
    </p>
  </div>
</template>

<style scoped>
.multiples {
  gap: 6px;
}

.multiples__grid {
  display: grid;
  grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
  grid-auto-rows: minmax(0, 1fr);
  gap: 1px;
  border: 1px solid var(--r-border-subtle);
  background: var(--r-border-subtle);
}

.multiples__panel {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  min-height: 0;
  padding: 6px 8px 5px;
  background: var(--r-chart-surface);
  cursor: pointer;
  transition: background-color var(--r-duration-fast) var(--r-ease-out);
}

.multiples__panel:hover {
  background: color-mix(in srgb, var(--r-bg-hover) 70%, var(--r-chart-surface));
}

.multiples__panel:focus-visible {
  outline-offset: -2px;
}

.multiples__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 6px;
  min-width: 0;
}

.multiples__name {
  overflow: hidden;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.04em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.multiples__panel.is-on .multiples__name {
  color: var(--r-text);
}

.multiples__last {
  flex: none;
  color: var(--r-text);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
}

.multiples__svg {
  flex: 1 1 0;
  width: 100%;
  height: auto;
  min-height: 10px;
  overflow: visible;
}

.multiples__base {
  stroke: var(--r-chart-axis);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
  shape-rendering: crispEdges;
}

.multiples__line {
  fill: none;
  stroke: var(--r-chart-1);
  stroke-width: 2;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
  transition:
    stroke var(--r-duration-fast) var(--r-ease-out),
    d var(--r-duration-slow) var(--r-ease-out);
}

.multiples__panel.is-dim .multiples__line {
  stroke: var(--r-chart-context);
}

.multiples__range {
  overflow: hidden;
  color: var(--r-chart-label);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.multiples__x {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  color: var(--r-chart-label);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  white-space: nowrap;
}

.multiples__x span:nth-child(2) {
  min-width: 0;
  overflow: hidden;
  color: var(--r-text-tertiary);
  text-overflow: ellipsis;
}
</style>
