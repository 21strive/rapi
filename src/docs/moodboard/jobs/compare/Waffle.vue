<script setup lang="ts">
/**
 * Out of a hundred: a share drawn as a hundred squares, filling from the bottom row up, for two
 * groups. Pick a group to light its squares. The squares between the two groups stay marked, a
 * lighter cobalt when the chosen group reaches them and hollow when it falls short, so the gap can
 * be counted.
 */
import { computed, ref } from 'vue'
import { num, reducedMotion } from '../../kit'
import { focusItem, stepKeys } from './shared'

interface Group {
  /** Short key on the button: a year, an airport code, a day. */
  key: string
  /** Full name for the screen reader: "Jakarta hub". */
  name: string
  value: number
}

const props = withDefaults(
  defineProps<{
    label: string
    /** What a square counts, for the screen reader: "deliveries on time". */
    noun: string
    groups: Group[]
    initial?: number
  }>(),
  { initial: 0 },
)

const sel = ref(props.initial)
const group = ref<HTMLElement | null>(null)
const still = reducedMotion()

const chosen = computed(() => Math.round(props.groups[sel.value]?.value ?? 0))
const other = computed(() => Math.round(props.groups[sel.value === 0 ? 1 : 0]?.value ?? 0))
const lo = computed(() => Math.min(chosen.value, other.value))
const hi = computed(() => Math.max(chosen.value, other.value))
const gap = computed(() => chosen.value - other.value)
const otherKey = computed(() => props.groups[sel.value === 0 ? 1 : 0]?.key ?? '')

// Fill from the bottom-left, row by row, like a glass filling up.
const cells = Array.from({ length: 100 }, (_, i) => ({ i, x: (i % 10) * 10, y: (9 - Math.floor(i / 10)) * 10 }))

function state(i: number) {
  if (i < lo.value) return 'is-on'
  if (i < hi.value) return chosen.value > other.value ? 'is-on is-gap' : 'is-gap'
  return ''
}

function onKey(event: KeyboardEvent) {
  const next = stepKeys(event, sel.value, props.groups.length)
  if (next === null) return
  sel.value = next
  focusItem(group.value, next)
}
</script>

<template>
  <div class="mk cmp r-chart waffle">
    <span class="r-label mk-truncate">{{ label }}</span>
    <div class="waffle__body mk-grow">
      <div ref="group" class="waffle__groups" role="radiogroup" :aria-label="label" @keydown="onKey">
        <button
          v-for="(g, i) in groups"
          :key="g.key"
          type="button"
          role="radio"
          class="waffle__group mk-reset"
          :class="{ 'is-on': i === sel }"
          :aria-checked="i === sel"
          :tabindex="i === sel ? 0 : -1"
          :aria-label="`${g.name}: ${num(g.value)} of 100 ${noun}`"
          @click="sel = i"
        >
          <span class="waffle__key">{{ g.key }}</span>
          <span class="waffle__value mk-fig">{{ num(g.value) }}</span>
        </button>
        <span class="waffle__gap" aria-hidden="true">
          <span>{{ gap > 0 ? '+' : gap < 0 ? '−' : '±' }}{{ Math.abs(gap) }}</span>
          <span class="waffle__vs">vs {{ otherKey }}</span>
        </span>
      </div>
      <svg class="waffle__grid" viewBox="-1 -1 100 100" aria-hidden="true">
        <rect
          v-for="c in cells"
          :key="c.i"
          :x="c.x"
          :y="c.y"
          width="8"
          height="8"
          class="waffle__cell"
          :class="state(c.i)"
          :style="still ? undefined : { transitionDelay: `${c.i * 2}ms` }"
        />
      </svg>
    </div>
  </div>
</template>

<style scoped>
.waffle {
  gap: 8px;
}

.waffle__body {
  display: flex;
  gap: 10px;
  align-items: stretch;
}

.waffle__groups {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.waffle__group {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 3px 0 3px 7px;
  border-left: 2px solid var(--r-border);
  cursor: pointer;
  transition: border-color var(--r-duration-fast) var(--r-ease-out);
}

.waffle__group:hover {
  border-left-color: var(--r-border-strong);
}

.waffle__group.is-on {
  border-left-color: var(--cmp-select);
}

.waffle__key {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.waffle__value {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xl);
}

.waffle__group.is-on .waffle__key,
.waffle__group.is-on .waffle__value {
  color: var(--r-text);
}

.waffle__gap {
  display: flex;
  flex-direction: column;
  margin-top: auto;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.waffle__vs {
  color: var(--r-text-tertiary);
}

.waffle__grid {
  flex: none;
  height: 100%;
  max-width: 68%;
  aspect-ratio: 1;
}

.waffle__cell {
  fill: var(--r-chart-track);
  stroke: transparent;
  stroke-width: 1;
  transition:
    fill var(--r-duration-fast) var(--r-ease-out),
    stroke var(--r-duration-fast) var(--r-ease-out);
}

.waffle__cell.is-on {
  fill: var(--r-chart-1);
}

/* The squares between the two groups: a lighter cobalt when the chosen group reaches them,
   hollow with an ink edge when it falls short of the other. */
.waffle__cell.is-on.is-gap {
  fill: color-mix(in srgb, var(--r-chart-1) 45%, var(--r-chart-surface));
}

.waffle__cell.is-gap:not(.is-on) {
  fill: transparent;
  stroke: var(--r-chart-ink);
}
</style>
