<script setup lang="ts">
/**
 * Share of the whole: one bar of square parts in their identity colours, never a pie. Pick a part
 * to read it while the rest step back to grey; switch the period and the parts slide to their new
 * widths, so a shift in the mix is seen, not computed.
 */
import { computed, ref } from 'vue'
import { delta, fmt, slot, type Fmt } from './shared'
import Keys from './Keys.vue'

interface Period {
  key: string
  label: string
  parts: number[]
}

const props = withDefaults(
  defineProps<{
    label: string
    names: string[]
    periods: Period[]
    unit?: string
    format?: Fmt
    /** 1x1 layout: the chosen part as a figure, the legend as a small grid. */
    compact?: boolean
  }>(),
  { format: () => ({}) },
)

const period = ref(props.periods[props.periods.length - 1].key)
const current = computed(() => props.periods.find((p) => p.key === period.value) ?? props.periods[0])
const before = computed(() => {
  const i = props.periods.findIndex((p) => p.key === period.value)
  return props.periods.length > 1 ? props.periods[i === 0 ? 1 : i - 1] : null
})

const total = (p: Period) => p.parts.reduce((a, b) => a + b, 0)
const share = (p: Period, i: number) => (p.parts[i] / Math.max(1e-9, total(p))) * 100
const shares = computed(() => props.names.map((_, i) => share(current.value, i)))
const largest = computed(() => shares.value.indexOf(Math.max(...shares.value)))

const focus = ref<number | null>(props.compact ? largest.value : null)
const shown = computed(() => focus.value ?? (props.compact ? largest.value : null))

function pick(i: number) {
  focus.value = focus.value === i && !props.compact ? null : i
}

const pct = (v: number) => `${fmt(v, { kind: 'pct', decimals: v < 10 ? 1 : 0 })}`
const keyOptions = computed(() => props.periods.map((p) => ({ value: p.key, label: p.label })))
const shift = computed(() => {
  if (shown.value == null || !before.value) return ''
  return `${delta(shares.value[shown.value] - share(before.value, shown.value), 1, ' pp')} vs ${before.value.label}`
})
</script>

<template>
  <div class="mk cmp r-chart share" :class="{ 'is-compact': compact }" :style="{ '--cols': names.length <= 4 ? 2 : 3 }">
    <div class="mk-row mk-between">
      <span class="r-label mk-truncate">{{ label }}</span>
      <Keys v-if="periods.length > 1 && !compact" v-model="period" :options="keyOptions" :label="`${label} period`" />
    </div>
    <div class="share__bar" aria-hidden="true">
      <span
        v-for="(n, i) in names"
        :key="n"
        class="share__part"
        :class="{ 'is-dim': shown != null && shown !== i }"
        :style="{ flexGrow: shares[i], '--part': slot(i) }"
        @click="pick(i)"
      />
    </div>

    <p v-if="compact && shown != null" class="share__figure">
      <span class="mk-fig">{{ pct(shares[shown]) }}</span>
      <span class="share__of mk-truncate">{{ names[shown] }}</span>
    </p>

    <div class="share__legend" role="group" :aria-label="`Parts of ${label}`">
      <button
        v-for="(n, i) in names"
        :key="n"
        type="button"
        class="share__key mk-reset"
        :class="{ 'is-dim': shown != null && shown !== i }"
        :aria-pressed="shown === i"
        :aria-label="`${n}, ${pct(shares[i])}`"
        @click="pick(i)"
      >
        <span class="share__swatch" :style="{ '--part': slot(i) }" />
        <span class="share__name">{{ n }}</span>
        <span v-if="!compact" class="share__pct">{{ pct(shares[i]) }}</span>
      </button>
    </div>

    <p v-if="!compact" class="share__readout mk-end">
      <template v-if="shown != null">
        <span class="share__strong">{{ names[shown] }}</span>
        {{ fmt(current.parts[shown], format) }}{{ unit ? ` ${unit}` : '' }}
        <span v-if="shift" class="share__shift">{{ shift }}</span>
      </template>
      <template v-else>
        <span class="share__strong">Total</span>
        {{ fmt(total(current), format) }}{{ unit ? ` ${unit}` : '' }}
        <span class="share__shift">Pick a part to compare it</span>
      </template>
    </p>
    <p v-else-if="shift" class="share__shift share__shift--compact mk-end">{{ shift }}</p>
  </div>
</template>

<style scoped>
.share {
  gap: 8px;
}

.share__bar {
  display: flex;
  flex: none;
  gap: 2px;
  height: 18px;
}

.share.is-compact .share__bar {
  height: 12px;
}

.share__part {
  flex-basis: 0;
  min-width: 2px;
  background: var(--part);
  cursor: pointer;
  transition:
    flex-grow var(--r-duration-slow) var(--r-ease-out),
    background-color var(--r-duration-fast) var(--r-ease-out);
}

.share__part.is-dim {
  background: var(--r-chart-context);
}

.share__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 12px;
}

.share.is-compact .share__legend {
  display: grid;
  grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
  gap: 2px 6px;
}

.share__key {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  height: 20px;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  white-space: nowrap;
  cursor: pointer;
  transition: color var(--r-duration-fast) var(--r-ease-out);
}

.share__key:hover,
.share__key[aria-pressed='true'] {
  color: var(--r-text);
}

.share__key.is-dim {
  color: var(--r-text-tertiary);
}

.share__swatch {
  flex: none;
  width: 8px;
  height: 8px;
  background: var(--part);
}

.share__key.is-dim .share__swatch {
  background: var(--r-chart-context);
}

.share__name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.share.is-compact .share__name {
  font-size: var(--r-text-2xs);
}

.share.is-compact .share__key {
  gap: 4px;
}

.share__pct {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
}

.share__figure {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}

.share__figure .mk-fig {
  font-size: var(--r-text-2xl);
}

.share__of {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

.share__readout {
  min-width: 0;
  overflow: hidden;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.share__strong {
  margin-right: 4px;
  color: var(--r-text);
  font-family: var(--r-font-sans);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-semibold);
}

.share__shift {
  margin-left: 6px;
  color: var(--r-text-tertiary);
}

.share__shift--compact {
  margin: 0;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
}
</style>
