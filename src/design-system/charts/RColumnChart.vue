<script setup lang="ts">
import { computed, onMounted, ref, useId } from 'vue'
import { useChartFocus } from './utils'
import { formatNumber } from '../composables/format'

const props = withDefaults(
  defineProps<{
    labels: string[]
    values: number[]
    max?: number
    /** A short tick per column (or one for all) marking the goal. */
    targets?: number[] | number
    /** The column drawn in full colour; the rest are soft. Leave unset for all solid. */
    highlight?: number | null
    color?: string
    height?: number
    format?: (value: number) => string
    label: string
  }>(),
  { max: 100, color: 'var(--r-chart-4)', height: 220, highlight: null },
)

const uid = useId()
const fmt = (v: number) => (props.format ? props.format(v) : `${formatNumber(v, { maximumFractionDigits: 1 })}%`)

const targetAt = (i: number) => (Array.isArray(props.targets) ? props.targets[i] : props.targets)

const columns = computed(() =>
  props.values.map((value, i) => {
    const pct = Math.min(1, Math.max(0, value / props.max))
    const target = targetAt(i)
    return {
      label: props.labels[i],
      value,
      height: pct * 100,
      target: target == null ? null : Math.min(1, Math.max(0, target / props.max)) * 100,
      solid: props.highlight == null || props.highlight === i,
    }
  }),
)

const focus = useChartFocus(
  () => props.values.length,
  (i) => {
    const t = targetAt(i)
    return `${props.labels[i]}: ${fmt(props.values[i])}${t == null ? '' : `, target ${fmt(t)}`}`
  },
)

const grown = ref(false)
onMounted(() => requestAnimationFrame(() => (grown.value = true)))
</script>

<template>
  <figure
    class="r-chart r-columns"
    :class="{ 'is-grown': grown }"
    tabindex="0"
    :aria-describedby="`${uid}-hint`"
    @keydown="focus.onKeydown"
    @blur="focus.onBlur"
  >
    <div class="r-columns__plot" role="img" :aria-label="label" :style="{ height: `${height}px` }">
      <div
        v-for="(c, i) in columns"
        :key="i"
        class="r-columns__column"
        :class="{ 'is-active': focus.active.value === i }"
        @pointerenter="focus.onPointer(i)"
        @pointerleave="focus.onPointer(null)"
      >
        <div class="r-columns__track">
          <div
            class="r-columns__bar"
            :class="{ 'is-solid': c.solid }"
            :style="{ height: grown ? `${c.height}%` : '0%', '--r-col': color, transitionDelay: `${i * 70}ms` }"
          >
            <span class="r-columns__value">{{ fmt(c.value) }}</span>
          </div>
          <span v-if="c.target != null" class="r-columns__target" :style="{ bottom: `${c.target}%` }" />
        </div>
        <span class="r-columns__label">{{ c.label }}</span>
      </div>
    </div>
    <table class="r-sr-only">
      <caption>{{ label }}</caption>
      <tbody>
        <tr v-for="(c, i) in columns" :key="i">
          <th scope="row">{{ c.label }}</th>
          <td>{{ fmt(c.value) }}</td>
        </tr>
      </tbody>
    </table>
    <span :id="`${uid}-hint`" hidden>Use the arrow keys to read each column.</span>
    <span class="r-sr-only" aria-live="polite">{{ focus.announce.value }}</span>
  </figure>
</template>

<style>
.r-columns__plot {
  display: flex;
  gap: 8px;
}

.r-columns__column {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.r-columns__track {
  position: relative;
  flex: 1;
  overflow: hidden;
  border-radius: var(--r-radius-lg);
  background-color: color-mix(in srgb, var(--r-chart-track) 60%, transparent);
  background-image: repeating-linear-gradient(
    -45deg,
    var(--r-chart-grid) 0 1px,
    transparent 1px 9px
  );
}

.r-columns__bar {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  border-radius: var(--r-radius-lg);
  background: color-mix(in srgb, var(--r-col) 26%, var(--r-bg-surface));
  transition: height var(--r-duration-slower) var(--r-ease-out);
}
.r-columns__bar.is-solid {
  background: var(--r-col);
}

.r-columns__value {
  position: absolute;
  top: 10px;
  left: 12px;
  color: var(--r-text);
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
}
/* Dark ink on a saturated bar reads in both themes. */
.r-columns__bar.is-solid .r-columns__value {
  color: #0c0e12;
}

.r-columns__target {
  position: absolute;
  left: 50%;
  width: 34%;
  height: 2px;
  margin-bottom: -1px;
  border-radius: 2px;
  background: var(--r-text);
  transform: translateX(-50%);
}

.r-columns__label {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  text-align: center;
  transition: color var(--r-duration-fast) var(--r-ease-out);
}

.r-columns__column.is-active .r-columns__label {
  color: var(--r-text);
}
.r-columns__column.is-active .r-columns__track {
  box-shadow: inset 0 0 0 1.5px var(--r-border-strong);
}
</style>
