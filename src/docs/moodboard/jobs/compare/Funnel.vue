<script setup lang="ts">
/**
 * Where it narrows: the steps of a flow as square bars on one scale, the share kept between
 * each step, and the largest drop named in words. The other period sits behind as an outline,
 * so a step that got better or worse shows without arithmetic. Pick a step to read it.
 */
import { computed, ref } from 'vue'
import { ArrowDown } from 'lucide-vue-next'
import { fmt, focusItem, stepKeys, type Fmt } from './shared'
import Keys from './Keys.vue'

interface Period {
  key: string
  label: string
  values: number[]
}

const props = withDefaults(
  defineProps<{
    label: string
    steps: string[]
    periods: Period[]
    format?: Fmt
    /** `columns` runs the steps left to right, for wide, short tiles. */
    orientation?: 'rows' | 'columns'
  }>(),
  { format: () => ({}), orientation: 'rows' },
)

const key = ref(props.periods[props.periods.length - 1].key)
const current = computed(() => props.periods.find((p) => p.key === key.value) ?? props.periods[0])
const other = computed(() => (props.periods.length > 1 ? props.periods.find((p) => p.key !== key.value) ?? null : null))
const options = computed(() => props.periods.map((p) => ({ value: p.key, label: p.label })))

const top = computed(() => Math.max(1, ...props.periods.map((p) => p.values[0])))
const at = (v: number) => `${(v / top.value) * 100}%`
const kept = (p: Period, i: number) => (i === 0 ? 100 : (p.values[i] / Math.max(1, p.values[i - 1])) * 100)
const worst = computed(() => {
  let w = 1
  for (let i = 2; i < props.steps.length; i++) if (kept(current.value, i) < kept(current.value, w)) w = i
  return w
})

const sel = ref<number>(worst.value)
const group = ref<HTMLElement | null>(null)
const pct = (v: number) => fmt(v, { kind: 'pct', decimals: 1 })

const readout = computed(() => {
  const i = sel.value
  const v = `${fmt(current.value.values[i], props.format)}`
  if (i === 0) return { head: props.steps[0], body: `${v} started`, vs: other.value ? `${other.value.label} ${fmt(other.value.values[0], props.format)}` : '', worst: false }
  return {
    head: `${props.steps[i - 1]} → ${props.steps[i]}`,
    body: `${pct(kept(current.value, i))} kept · ${v}`,
    vs: other.value ? `${other.value.label} ${pct(kept(other.value, i))}` : '',
    worst: i === worst.value,
  }
})

function onKey(event: KeyboardEvent) {
  const next = stepKeys(event, sel.value, props.steps.length)
  if (next === null) return
  sel.value = next
  focusItem(group.value, next)
}
</script>

<template>
  <div class="mk cmp r-chart funnel" :class="`funnel--${orientation}`">
    <div class="mk-row mk-between">
      <span class="r-label mk-truncate">{{ label }}</span>
      <Keys v-if="periods.length > 1" v-model="key" :options="options" :label="`${label}: period`" />
    </div>

    <div ref="group" class="funnel__steps mk-grow" role="radiogroup" :aria-label="label" @keydown="onKey">
      <template v-for="(s, i) in steps" :key="s">
        <div v-if="i > 0 && orientation === 'rows'" class="funnel__kept" :class="{ 'is-worst': i === worst }" aria-hidden="true">
          <ArrowDown :size="12" />
          <span>{{ pct(kept(current, i)) }}</span>
          <span v-if="i === worst" class="funnel__worst">Largest drop</span>
        </div>
        <button
          type="button"
          role="radio"
          class="funnel__step mk-reset"
          :class="{ 'is-on': i === sel }"
          :aria-checked="i === sel"
          :tabindex="i === sel ? 0 : -1"
          :aria-label="`${s}: ${fmt(current.values[i], format)}${i ? `, ${pct(kept(current, i))} of the step before` : ''}${i === worst ? ', the largest drop' : ''}`"
          @click="sel = i"
        >
          <span class="funnel__head">
            <span class="funnel__name">{{ s }}</span>
            <span class="funnel__value">{{ fmt(current.values[i], format) }}</span>
          </span>
          <span class="funnel__track">
            <span v-if="other" class="funnel__ghost" :style="orientation === 'rows' ? { width: at(other.values[i]) } : { height: at(other.values[i]) }" />
            <span class="funnel__bar" :style="orientation === 'rows' ? { width: at(current.values[i]) } : { height: at(current.values[i]) }" />
          </span>
          <span v-if="orientation === 'columns' && i > 0" class="funnel__kept funnel__kept--col" :class="{ 'is-worst': i === worst }" aria-hidden="true">
            <ArrowDown v-if="i === worst" :size="10" />{{ pct(kept(current, i)) }}
          </span>
        </button>
      </template>
    </div>

    <p class="funnel__read">
      <span class="funnel__read-head">{{ readout.head }}</span>
      <span>{{ readout.body }}</span>
      <span v-if="readout.vs" class="funnel__read-vs">{{ readout.vs }}</span>
      <span v-if="readout.worst" class="funnel__read-worst">Largest drop</span>
    </p>
  </div>
</template>

<style scoped>
.funnel {
  gap: 6px;
}

.funnel__steps {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.funnel--columns .funnel__steps {
  flex-direction: row;
  gap: 2px;
}

.funnel__step {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 2px 4px;
  margin: 0 -4px;
  cursor: pointer;
  transition: background-color var(--r-duration-fast) var(--r-ease-out);
}

.funnel--columns .funnel__step {
  position: relative;
  flex: 1 1 0;
  flex-direction: column-reverse;
  justify-content: flex-start;
  min-width: 0;
  margin: 0;
  padding: 0;
}

.funnel__step:hover {
  background: var(--r-bg-hover);
}

.funnel--columns .funnel__step:hover {
  background: none;
}

.funnel__step.is-on {
  background: var(--r-bg-selected);
}

.funnel--columns .funnel__step.is-on {
  background: none;
}

.funnel__step:focus-visible {
  outline-offset: 0;
}

.funnel__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 6px;
  min-width: 0;
}

.funnel--columns .funnel__head {
  flex-direction: column;
  align-items: center;
  gap: 0;
}

.funnel__name {
  overflow: hidden;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.funnel--columns .funnel__name {
  max-width: 100%;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.funnel__step.is-on .funnel__name {
  color: var(--r-text);
}

.funnel__value {
  color: var(--r-text);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
}

.funnel__track {
  position: relative;
  height: 10px;
}

.funnel--columns .funnel__track {
  flex: 1 1 auto;
  height: auto;
  border-bottom: 1px solid var(--r-chart-axis);
}

.funnel__bar,
.funnel__ghost {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  transition:
    width var(--r-duration-base) var(--r-ease-out),
    height var(--r-duration-base) var(--r-ease-out);
}

.funnel--columns .funnel__bar,
.funnel--columns .funnel__ghost {
  top: auto;
  right: 0;
  margin: 0 auto;
  width: min(24px, 80%);
}

.funnel__bar {
  background: var(--r-chart-1);
}

.funnel__ghost {
  box-shadow: inset 0 0 0 1px var(--r-chart-ink);
}

.funnel--columns .funnel__ghost {
  margin: 0 auto;
}

.funnel__kept {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 14px;
  padding-left: 1px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
}

.funnel__kept.is-worst {
  color: var(--r-warning-text);
  font-weight: var(--r-weight-semibold);
}

.funnel__worst {
  margin-left: auto;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.funnel__kept--col {
  position: absolute;
  top: 0;
  left: -1px;
  justify-content: center;
  gap: 1px;
  width: 100%;
  padding: 0;
}

.funnel__read {
  display: flex;
  flex-wrap: wrap;
  gap: 0 6px;
  min-width: 0;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
  line-height: 1.5;
}

.funnel__read-head {
  overflow: hidden;
  color: var(--r-text);
  font-family: var(--r-font-sans);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-semibold);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.funnel__read-vs {
  color: var(--r-text-tertiary);
}

.funnel__read-worst {
  color: var(--r-warning-text);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
</style>
