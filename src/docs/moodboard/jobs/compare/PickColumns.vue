<script setup lang="ts">
/**
 * Columns, pick one: a short run of square columns where the one in focus is cobalt and the rest
 * step back to context grey, read against a dashed average or target. Point at a column to
 * preview it, click to keep it; the arrow keys walk the run.
 */
import { computed, ref } from 'vue'
import { delta, fmt, focusItem, stepKeys, change, type Fmt } from './shared'

interface Reference {
  value: number
  /** Short tag on the line: "Avg", "Target". */
  label: string
  kind?: 'target' | 'average' | 'threshold'
}

const props = withDefaults(
  defineProps<{
    label: string
    unit?: string
    values: number[]
    /** Full name per column for the readout: "Thu 12 Nov". */
    names: string[]
    /** Axis text per column; empty strings are skipped. */
    ticks: string[]
    reference?: Reference
    format?: Fmt
    initial?: number
  }>(),
  { format: () => ({}) },
)

const sel = ref(props.initial ?? props.values.length - 1)
const hover = ref<number | null>(null)
const shown = computed(() => hover.value ?? sel.value)
const group = ref<HTMLElement | null>(null)

const top = computed(() => Math.max(1e-9, ...props.values, props.reference?.value ?? 0) * 1.12)
const pct = (v: number) => `${(v / top.value) * 100}%`
const refY = computed(() => (props.reference ? `${100 - (props.reference.value / top.value) * 100}%` : '0'))
const vsRef = computed(() =>
  props.reference
    ? `${delta(change(props.reference.value, props.values[shown.value]), 0)} vs ${props.reference.label.toLowerCase()} ${fmt(props.reference.value, props.format)}`
    : '',
)
const text = (v: number) => `${fmt(v, props.format)}${props.unit ? ` ${props.unit}` : ''}`

function onKey(event: KeyboardEvent) {
  const next = stepKeys(event, sel.value, props.values.length, false)
  if (next === null) return
  sel.value = next
  hover.value = null
  focusItem(group.value, next)
}
</script>

<template>
  <div class="mk cmp r-chart pick">
    <div class="mk-row mk-between">
      <span class="r-label mk-truncate">{{ label }}</span>
      <span class="pick__name">{{ names[shown] }}</span>
    </div>
    <p class="pick__figure">
      <span class="mk-fig">{{ fmt(values[shown], format) }}</span>
      <span v-if="unit" class="mk-unit">{{ unit }}</span>
      <span v-if="reference" class="pick__vs">{{ vsRef }}</span>
    </p>
    <div class="pick__plot mk-grow">
      <div
        ref="group"
        class="pick__cols"
        role="radiogroup"
        :aria-label="label"
        @keydown="onKey"
        @pointerleave="hover = null"
      >
        <button
          v-for="(v, i) in values"
          :key="i"
          type="button"
          role="radio"
          class="pick__col mk-reset"
          :class="{ 'is-on': i === sel, 'is-hover': i === hover }"
          :aria-checked="i === sel"
          :tabindex="i === sel ? 0 : -1"
          :aria-label="`${names[i]}, ${text(v)}`"
          @pointerenter="hover = i"
          @click="sel = i"
        >
          <span class="pick__bar" :style="{ height: pct(v) }" />
        </button>
      </div>
      <template v-if="reference">
        <svg class="pick__ref" aria-hidden="true">
          <g class="r-chart__ref" :class="`r-chart__ref--${reference.kind ?? 'average'}`">
            <line x1="0" x2="100%" :y1="refY" :y2="refY" />
          </g>
        </svg>
      </template>
    </div>
    <div class="pick__ticks" aria-hidden="true">
      <span v-for="(t, i) in ticks" :key="i" :class="{ 'is-on': i === shown }">{{ t }}</span>
    </div>
  </div>
</template>

<style scoped>
.pick {
  gap: 6px;
}

.pick__name {
  flex: none;
  color: var(--r-text);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.pick__figure {
  display: flex;
  align-items: baseline;
  gap: 5px;
  min-width: 0;
  white-space: nowrap;
}

.pick__figure .mk-fig {
  font-size: var(--r-text-2xl);
}

.pick__vs {
  min-width: 0;
  overflow: hidden;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  text-overflow: ellipsis;
}

.pick__plot {
  position: relative;
  min-height: 36px;
  border-bottom: 1px solid var(--r-chart-axis);
}

.pick__cols {
  position: absolute;
  inset: 0;
  display: flex;
  gap: 2px;
}

.pick__col {
  display: flex;
  flex: 1 1 0;
  align-items: flex-end;
  justify-content: center;
  min-width: 0;
  cursor: pointer;
}

.pick__bar {
  width: 100%;
  max-width: 24px;
  min-height: 1px;
  background: var(--r-chart-context);
  transition: background-color var(--r-duration-fast) var(--r-ease-out);
}

.pick__col.is-hover .pick__bar {
  background: color-mix(in srgb, var(--r-chart-1) 45%, var(--r-chart-context));
}

.pick__col.is-on .pick__bar {
  background: var(--r-chart-1);
}

.pick__col:focus-visible {
  outline-offset: 1px;
}

.pick__ref {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}

.pick__ticks {
  display: flex;
  gap: 2px;
  height: 12px;
  margin-top: -2px;
  color: var(--r-chart-label);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  line-height: 12px;
}

.pick__ticks span {
  flex: 1 1 0;
  min-width: 0;
  overflow: visible;
  text-align: center;
  white-space: nowrap;
}

.pick__ticks span.is-on {
  color: var(--r-text);
}
</style>
