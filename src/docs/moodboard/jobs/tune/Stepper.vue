<script setup lang="ts">
/**
 * A stepper for small counts and set points: minus, the value, plus, and what the value means.
 * Press a key once for one step, hold it to run (it speeds up); the value itself is a spin
 * button, so arrows, Page keys, Home and End work on it. Some steppers only allow certain
 * values (a train runs 8, 10 or 12 cars) and skip straight between them. Pips show a count at a
 * glance when it is a count of things.
 */
import { computed, ref, useId } from 'vue'
import { Minus, Plus } from 'lucide-vue-next'
import { RIconButton } from '@/design-system'
import { num } from '../../kit'
import { clamp, decimalsOf, useRepeat } from './shared'

interface Say {
  text: string
  word?: string
  tone?: 'success' | 'warning' | 'danger'
}

const props = withDefaults(
  defineProps<{
    label: string
    value: number
    min?: number
    max?: number
    step?: number
    /** Only these values; the keys skip between them. */
    allowed?: number[]
    unit?: string
    format?: (v: number) => string
    note?: (v: number) => Say | string
    /** Draw one square per unit, lit up to the value (counts of things). */
    pips?: boolean
    /** Lay the value and keys out in a row (wide tiles). */
    wide?: boolean
  }>(),
  { min: 0, max: 100, step: 1, pips: false, wide: false },
)

const id = useId()
const value = ref(props.value)
const lo = computed(() => (props.allowed ? props.allowed[0] : props.min))
const hi = computed(() => (props.allowed ? props.allowed[props.allowed.length - 1] : props.max))

function by(steps: number) {
  if (props.allowed) {
    const i = props.allowed.indexOf(value.value)
    value.value = props.allowed[clamp(i + Math.sign(steps) * Math.max(1, Math.abs(steps) >= 10 ? props.allowed.length : 1), 0, props.allowed.length - 1)]
    return
  }
  const d = decimalsOf(props.step)
  value.value = Number(clamp(value.value + steps * props.step, props.min, props.max).toFixed(d))
}

const down = useRepeat(() => by(-1))
const up = useRepeat(() => by(1))

function onKeydown(event: KeyboardEvent) {
  const keys: Record<string, () => void> = {
    ArrowUp: () => by(1),
    ArrowRight: () => by(1),
    ArrowDown: () => by(-1),
    ArrowLeft: () => by(-1),
    PageUp: () => by(10),
    PageDown: () => by(-10),
    Home: () => (value.value = lo.value),
    End: () => (value.value = hi.value),
  }
  const fn = keys[event.key]
  if (!fn) return
  event.preventDefault()
  fn()
}

const text = computed(() => (props.format ? props.format(value.value) : num(value.value, decimalsOf(props.step))))
const said = computed<Say | null>(() => {
  const s = props.note?.(value.value)
  if (!s) return null
  return typeof s === 'string' ? { text: s } : s
})
const pipCount = computed(() => (props.pips ? hi.value : 0))
</script>

<template>
  <div class="mk stepper" :class="{ 'stepper--wide': wide }">
    <p :id="`${id}-label`" class="r-label mk-truncate">{{ label }}</p>

    <div class="stepper__row">
      <RIconButton label="Decrease" size="md" variant="outline" class="stepper__key" :disabled="value <= lo" v-bind="down">
        <Minus aria-hidden="true" />
      </RIconButton>
      <p
        class="stepper__value"
        role="spinbutton"
        tabindex="0"
        :aria-labelledby="`${id}-label`"
        :aria-valuemin="lo"
        :aria-valuemax="hi"
        :aria-valuenow="value"
        :aria-valuetext="[text, unit].filter(Boolean).join(' ')"
        @keydown="onKeydown"
      >
        <span class="mk-fig">{{ text }}</span>
        <span v-if="unit" class="mk-unit">{{ unit }}</span>
      </p>
      <RIconButton label="Increase" size="md" variant="outline" class="stepper__key" :disabled="value >= hi" v-bind="up">
        <Plus aria-hidden="true" />
      </RIconButton>
    </div>

    <div v-if="pipCount" class="stepper__pips" aria-hidden="true">
      <span v-for="n in pipCount" :key="n" class="stepper__pip" :class="{ 'is-on': n <= value }" />
    </div>

    <p v-if="said" class="stepper__note mk-end" aria-live="polite">
      <span class="stepper__text">{{ said.text }}</span>
      <span v-if="said.word" class="stepper__word" :class="`is-${said.tone}`">{{ said.word }}</span>
    </p>
  </div>
</template>

<style scoped>
.stepper {
  gap: 8px;
}

.stepper__row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
}

.stepper__key {
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.stepper__value {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
  min-width: 0;
  padding: 2px 0;
  white-space: nowrap;
  cursor: ns-resize;
}
.stepper__value:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: 2px;
}
.stepper__value .mk-fig {
  font-size: var(--r-text-3xl);
}

.stepper__pips {
  display: flex;
  gap: 2px;
  height: 10px;
}
.stepper__pip {
  flex: 1 1 0;
  min-width: 2px;
  background: var(--r-chart-track);
  transition: background-color var(--r-duration-fast) var(--r-ease-out);
}
.stepper__pip.is-on {
  background: var(--r-ink);
}

.stepper__note {
  display: flex;
  flex-direction: column;
  gap: 2px;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.35;
}
.stepper__word {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.stepper__word.is-success {
  color: var(--r-success-text);
}
.stepper__word.is-warning {
  color: var(--r-warning-text);
}
.stepper__word.is-danger {
  color: var(--r-danger-text);
}

/* Wide: the value on the left, large, the keys together on the right. */
.stepper--wide .stepper__row {
  grid-template-columns: minmax(0, 1fr) auto auto;
}
.stepper--wide .stepper__value {
  order: -1;
  justify-content: flex-start;
}
.stepper--wide .stepper__value .mk-fig {
  font-size: var(--r-text-4xl);
}
.stepper--wide .stepper__note {
  flex-direction: row;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}
</style>
