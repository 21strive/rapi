<script setup lang="ts">
import { computed, useAttrs, useId } from 'vue'
import { formatNumber, withMinus } from '../composables/format'
import type { SliderMark } from '../types'

/** A range slider with tick marks and a mono value readout. Square thumb. */
defineOptions({ inheritAttrs: false })
const model = defineModel<number>({ default: 0 })

// class and style dress the wrapper; aria-*, name and events go to the native input.
const attrs = useAttrs()
const rootAttrs = computed(() => ({ class: attrs.class, style: attrs.style }))
const inputAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs
  return rest
})
const props = withDefaults(
  defineProps<{
    label: string
    min?: number
    max?: number
    step?: number
    /** `true` draws a tick per step (up to 40); an array draws labelled marks. */
    marks?: boolean | SliderMark[]
    unit?: string
    showValue?: boolean
    disabled?: boolean
    format?: (value: number) => string
  }>(),
  { min: 0, max: 100, step: 1, showValue: true },
)

const id = useId()
const span = computed(() => Math.max(props.max - props.min, Number.EPSILON))
const fraction = (value: number) => Math.min(1, Math.max(0, (value - props.min) / span.value))

/** Decimals of the step, so 0.1 steps read 2.5 and not 2.4999999. */
const stepDecimals = computed(() => {
  const text = String(props.step)
  const at = text.indexOf('.')
  return at < 0 ? 0 : text.length - at - 1
})

const valueText = computed(() => {
  const v = Number(model.value ?? props.min)
  if (props.format) return props.format(v)
  return withMinus(formatNumber(v, { minimumFractionDigits: stepDecimals.value, maximumFractionDigits: stepDecimals.value }))
})
const ariaValueText = computed(() => (props.unit ? `${valueText.value} ${props.unit}` : valueText.value))

const fill = computed(() => fraction(Number(model.value ?? props.min)))

interface Tick {
  key: string
  at: number
  label?: string
  edge?: 'start' | 'end'
}

const ticks = computed<Tick[]>(() => {
  const { marks, min, max, step } = props
  if (!marks) return []
  if (Array.isArray(marks)) {
    return marks
      .filter((m) => m.value >= min && m.value <= max)
      .map((m) => {
        const at = fraction(m.value)
        return { key: `m${m.value}`, at, label: m.label, edge: at <= 0.02 ? 'start' : at >= 0.98 ? 'end' : undefined }
      })
  }
  // One tick per step while that stays readable; past 40 steps, a tick every tenth of the range.
  const steps = step > 0 ? Math.round((max - min) / step) : 0
  const count = steps > 0 && steps <= 40 ? steps : 10
  return Array.from({ length: count + 1 }, (_, i) => ({ key: `t${i}`, at: i / count }))
})

const labelled = computed(() => ticks.value.some((t) => t.label))

function onInput(event: Event) {
  model.value = Number((event.target as HTMLInputElement).value)
}
</script>

<template>
  <div
    class="r-slider"
    :class="[{ 'is-disabled': disabled, 'has-labels': labelled }, rootAttrs.class]"
    :style="[{ '--r-slider-fill': fill }, rootAttrs.style as any]"
  >
    <div class="r-slider__head">
      <label class="r-slider__label" :for="id">{{ label }}</label>
      <span v-if="showValue" class="r-slider__value" aria-hidden="true">
        <span class="r-slider__number">{{ valueText }}</span>
        <span v-if="unit" class="r-slider__unit">{{ unit }}</span>
      </span>
    </div>
    <div class="r-slider__control">
      <span class="r-slider__track" aria-hidden="true">
        <span class="r-slider__fill" />
      </span>
      <input
        :id="id"
        class="r-slider__input"
        type="range"
        :min="min"
        :max="max"
        :step="step"
        :value="model"
        :disabled="disabled"
        :aria-valuetext="ariaValueText"
        v-bind="inputAttrs"
        @input="onInput"
      />
    </div>
    <div v-if="ticks.length" class="r-slider__ticks" aria-hidden="true">
      <span
        v-for="tick in ticks"
        :key="tick.key"
        class="r-slider__tick"
        :class="{ 'is-labelled': !!tick.label }"
        :style="{ '--at': tick.at }"
      />
      <template v-if="labelled">
        <span
          v-for="tick in ticks.filter((t) => t.label)"
          :key="`${tick.key}-label`"
          class="r-slider__mark"
          :class="tick.edge ? `is-${tick.edge}` : null"
          :style="{ '--at': tick.at }"
        >
          {{ tick.label }}
        </span>
      </template>
    </div>
  </div>
</template>

<style>
.r-slider {
  /* The thumb's centre runs from half a thumb in from each end, so marks and fill use that inset. */
  --r-slider-thumb: 14px;
  --r-slider-inset: calc(var(--r-slider-thumb) / 2);
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.r-slider__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
}

.r-slider__label {
  min-width: 0;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
  line-height: 1.3;
}

.r-slider__value {
  display: inline-flex;
  flex: none;
  align-items: baseline;
  gap: 4px;
  font-family: var(--r-font-mono);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.r-slider__number {
  color: var(--r-text);
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
}
.r-slider__unit {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-medium);
  letter-spacing: 0.08em;
  /* Units keep their own case: ms is not Ms, µg is not MG. */
  text-transform: none;
}

.r-slider__control {
  position: relative;
  height: 20px;
  margin-top: 6px;
}

/* The drawn track: 2px, with the filled part in cobalt up to the thumb's centre. */
.r-slider__track {
  position: absolute;
  top: 9px;
  right: 0;
  left: 0;
  height: 2px;
  background: var(--r-border-strong);
  pointer-events: none;
}
.r-slider__fill {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: calc(var(--r-slider-inset) + var(--r-slider-fill) * (100% - var(--r-slider-thumb)));
  background: var(--r-brand);
}

/* The native range input on top: transparent track, square thumb. Keyboard comes free. */
.r-slider__input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 20px;
  margin: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
}
.r-slider__input:focus-visible {
  outline: none;
}

.r-slider__input::-webkit-slider-runnable-track {
  height: 20px;
  border: 0;
  background: transparent;
}
.r-slider__input::-moz-range-track {
  height: 20px;
  border: 0;
  background: transparent;
}

.r-slider__input::-webkit-slider-thumb {
  box-sizing: border-box;
  width: var(--r-slider-thumb);
  height: var(--r-slider-thumb);
  margin-top: 3px;
  border: 1px solid var(--r-text);
  border-radius: 0;
  background: var(--r-bg-surface);
  -webkit-appearance: none;
  appearance: none;
  transition:
    background-color var(--r-duration-fast) var(--r-ease-out),
    box-shadow var(--r-duration-fast) var(--r-ease-out);
}
.r-slider__input::-moz-range-thumb {
  box-sizing: border-box;
  width: var(--r-slider-thumb);
  height: var(--r-slider-thumb);
  border: 1px solid var(--r-text);
  border-radius: 0;
  background: var(--r-bg-surface);
  transition:
    background-color var(--r-duration-fast) var(--r-ease-out),
    box-shadow var(--r-duration-fast) var(--r-ease-out);
}

.r-slider__input:hover::-webkit-slider-thumb {
  background: var(--r-bg-hover);
}
.r-slider__input:hover::-moz-range-thumb {
  background: var(--r-bg-hover);
}
.r-slider__input:active::-webkit-slider-thumb {
  background: var(--r-bg-pressed);
}
.r-slider__input:active::-moz-range-thumb {
  background: var(--r-bg-pressed);
}

.r-slider__input:focus-visible::-webkit-slider-thumb {
  box-shadow: var(--r-focus-ring);
}
.r-slider__input:focus-visible::-moz-range-thumb {
  box-shadow: var(--r-focus-ring);
}

/* ── Ticks and labelled marks ──────────────────────────────────────────── */
.r-slider__ticks {
  position: relative;
  height: 6px;
  margin-top: 2px;
}
.r-slider.has-labels .r-slider__ticks {
  height: 24px;
}

.r-slider__tick {
  position: absolute;
  top: 0;
  left: calc(var(--r-slider-inset) + var(--at) * (100% - var(--r-slider-thumb)));
  width: 1px;
  height: 4px;
  margin-left: -0.5px;
  background: var(--r-border-strong);
}
.r-slider__tick.is-labelled {
  height: 6px;
  background: var(--r-text-tertiary);
}

.r-slider__mark {
  position: absolute;
  top: 9px;
  left: calc(var(--r-slider-inset) + var(--at) * (100% - var(--r-slider-thumb)));
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
  line-height: 14px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
  transform: translateX(-50%);
}
.r-slider__mark.is-start {
  transform: translateX(calc(var(--r-slider-inset) * -1));
}
.r-slider__mark.is-end {
  transform: translateX(calc(-100% + var(--r-slider-inset)));
}

/* ── Disabled ──────────────────────────────────────────────────────────── */
.r-slider.is-disabled .r-slider__label,
.r-slider.is-disabled .r-slider__number {
  color: var(--r-text-disabled);
}
.r-slider.is-disabled .r-slider__track {
  background: var(--r-border);
}
.r-slider.is-disabled .r-slider__fill {
  background: var(--r-text-disabled);
}
.r-slider.is-disabled .r-slider__input {
  cursor: not-allowed;
}
.r-slider.is-disabled .r-slider__input::-webkit-slider-thumb {
  border-color: var(--r-text-disabled);
  background: var(--r-bg-muted);
}
.r-slider.is-disabled .r-slider__input::-moz-range-thumb {
  border-color: var(--r-text-disabled);
  background: var(--r-bg-muted);
}
</style>
