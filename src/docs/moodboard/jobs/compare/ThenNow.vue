<script setup lang="ts">
/**
 * Then and now: a few periods as square columns, the change from the first to the last, and the
 * figure of the column in focus. Pick a column to read it; the others step back to context grey.
 */
import { computed, ref } from 'vue'
import { RTrend } from '@/design-system'
import { change, fmt, focusItem, stepKeys, type Fmt } from './shared'

interface Point {
  label: string
  value: number
}

const props = withDefaults(
  defineProps<{
    label: string
    unit?: string
    /** Oldest first. Two for a before and after, up to six for a run of periods. */
    points: Point[]
    format?: Fmt
    /** Lower is better (wait, cost, time): a drop reads as good. */
    invert?: boolean
  }>(),
  { format: () => ({}) },
)

const sel = ref(props.points.length - 1)
const group = ref<HTMLElement | null>(null)
const max = computed(() => Math.max(1e-9, ...props.points.map((p) => p.value)))
const trend = computed(() => change(props.points[0]?.value ?? 0, props.points[props.points.length - 1]?.value ?? 0))
const current = computed(() => props.points[sel.value])
const text = (p: Point) => `${fmt(p.value, props.format)}${props.unit ? ` ${props.unit}` : ''}`

function onKey(event: KeyboardEvent) {
  const next = stepKeys(event, sel.value, props.points.length)
  if (next === null) return
  sel.value = next
  focusItem(group.value, next)
}
</script>

<template>
  <div class="mk cmp r-chart then-now">
    <span class="r-label mk-truncate">{{ label }}</span>
    <div class="then-now__figure">
      <p class="then-now__value">
        <span class="mk-fig">{{ fmt(current.value, format) }}</span>
        <span v-if="unit" class="mk-unit">{{ unit }}</span>
      </p>
      <RTrend :value="trend" :invert="invert" size="sm" icon />
    </div>
    <div
      ref="group"
      class="then-now__cols mk-grow"
      role="radiogroup"
      :aria-label="`${label} by period`"
      @keydown="onKey"
    >
      <button
        v-for="(p, i) in points"
        :key="p.label"
        type="button"
        role="radio"
        class="then-now__col mk-reset"
        :class="{ 'is-on': i === sel }"
        :aria-checked="i === sel"
        :tabindex="i === sel ? 0 : -1"
        :aria-label="`${p.label}, ${text(p)}`"
        @click="sel = i"
      >
        <span class="then-now__track">
          <span class="then-now__bar" :style="{ height: `${(p.value / max) * 100}%` }" />
        </span>
        <span class="then-now__tick">{{ p.label }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.then-now {
  gap: 6px;
}

.then-now__figure {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  min-width: 0;
}

.then-now__value {
  display: flex;
  align-items: baseline;
  gap: 4px;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
}

.then-now__value .mk-fig {
  overflow: hidden;
  font-size: var(--r-text-2xl);
  text-overflow: ellipsis;
}

.then-now__cols {
  display: flex;
  min-height: 44px;
}

.then-now__col {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  align-items: stretch;
  min-width: 0;
  cursor: pointer;
}

.then-now__track {
  position: relative;
  display: flex;
  flex: 1 1 auto;
  align-items: flex-end;
  justify-content: center;
  border-bottom: 1px solid var(--r-chart-axis);
}

.then-now__bar {
  width: min(24px, 70%);
  min-height: 2px;
  background: var(--r-chart-context);
  transition: background-color var(--r-duration-fast) var(--r-ease-out);
}

.then-now__col:hover .then-now__bar {
  background: color-mix(in srgb, var(--r-chart-1) 45%, var(--r-chart-context));
}

.then-now__col.is-on .then-now__bar {
  background: var(--r-chart-1);
}

.then-now__tick {
  padding-top: 4px;
  color: var(--r-chart-label);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-align: center;
  text-transform: uppercase;
}

.then-now__col.is-on .then-now__tick {
  color: var(--r-text);
}
</style>
