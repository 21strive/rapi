<script setup lang="ts">
import { computed, useId } from 'vue'
import { linearScale, monotonePath, type Point } from './utils'
import { formatNumber } from '../composables/format'

const props = withDefaults(
  defineProps<{
    values: number[]
    /** `auto` turns green when the series ends higher than it starts, red when lower. */
    color?: 'auto' | string
    height?: number
    /** Fixed width in px. Leave unset to fill the container. */
    width?: number
    area?: boolean
    strokeWidth?: number
    label?: string
  }>(),
  { color: 'auto', height: 32, area: true, strokeWidth: 1.75 },
)

const uid = useId()
const W = 100

const stroke = computed(() => {
  if (props.color !== 'auto') return props.color
  const first = props.values[0] ?? 0
  const last = props.values[props.values.length - 1] ?? 0
  return last >= first ? 'var(--r-success)' : 'var(--r-danger)'
})

const paths = computed(() => {
  const v = props.values
  if (!v.length) return { line: '', fill: '' }
  const lo = Math.min(...v)
  const hi = Math.max(...v)
  const pad = 2
  const y = linearScale(lo, hi === lo ? lo + 1 : hi, props.height - pad, pad)
  const points: Point[] = v.map((value, i) => [v.length === 1 ? W / 2 : (W * i) / (v.length - 1), y(value)])
  const line = monotonePath(points)
  const fill = `${line}L${W},${props.height}L0,${props.height}Z`
  return { line, fill }
})

const ariaLabel = computed(() => {
  if (props.label) return props.label
  const v = props.values
  if (!v.length) return 'No data'
  return `Trend from ${formatNumber(v[0])} to ${formatNumber(v[v.length - 1])}`
})
</script>

<template>
  <svg
    class="r-sparkline"
    :style="{ width: width ? `${width}px` : '100%', height: `${height}px` }"
    :viewBox="`0 0 ${W} ${height}`"
    preserveAspectRatio="none"
    role="img"
    :aria-label="ariaLabel"
  >
    <defs>
      <linearGradient :id="`${uid}-fill`" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" :style="{ stopColor: stroke, stopOpacity: 0.22 }" />
        <stop offset="100%" :style="{ stopColor: stroke, stopOpacity: 0 }" />
      </linearGradient>
    </defs>
    <path v-if="area" :d="paths.fill" :fill="`url(#${uid}-fill)`" />
    <path
      :d="paths.line"
      fill="none"
      :style="{ stroke }"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
      vector-effect="non-scaling-stroke"
    />
  </svg>
</template>

<style>
.r-sparkline {
  display: block;
  flex-shrink: 0;
  overflow: visible;
}
</style>
