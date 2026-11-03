<script setup lang="ts">
import { computed } from 'vue'
import { linearPath, linearScale, monotonePath, stepPath, type Point } from './utils'
import { formatNumber } from '../composables/format'

const props = withDefaults(
  defineProps<{
    values: number[]
    /** `auto` uses the success colour when the series ends higher than it starts, danger when lower.
     *  Pass `invert` when lower is better. Any CSS colour works too. */
    color?: 'auto' | string
    invert?: boolean
    height?: number
    /** Fixed width in px. Leave unset to fill the container. */
    width?: number
    /** Flat 8% fill under the line. */
    area?: boolean
    curve?: 'linear' | 'step' | 'monotone'
    /** A dot on the last value. */
    endDot?: boolean
    strokeWidth?: number
    label?: string
  }>(),
  { color: 'auto', height: 28, area: false, curve: 'linear', endDot: true, strokeWidth: 1.5 },
)

const W = 100

const stroke = computed(() => {
  if (props.color !== 'auto') return props.color
  const first = props.values[0] ?? 0
  const last = props.values[props.values.length - 1] ?? 0
  const up = last >= first
  return up !== props.invert ? 'var(--r-success)' : 'var(--r-danger)'
})

const geometry = computed(() => {
  const v = props.values
  if (!v.length) return { line: '', fill: '', end: null as Point | null }
  const lo = Math.min(...v)
  const hi = Math.max(...v)
  const pad = 3
  const y = linearScale(lo, hi === lo ? lo + 1 : hi, props.height - pad, pad)
  const points: Point[] = v.map((value, i) => [v.length === 1 ? W / 2 : (W * i) / (v.length - 1), y(value)])
  const draw = props.curve === 'step' ? stepPath : props.curve === 'monotone' ? monotonePath : linearPath
  const line = draw(points)
  const fill = `${line}L${W},${props.height}L0,${props.height}Z`
  return { line, fill, end: points[points.length - 1] }
})

const ariaLabel = computed(() => {
  if (props.label) return props.label
  const v = props.values
  if (!v.length) return 'No data'
  return `Trend from ${formatNumber(v[0])} to ${formatNumber(v[v.length - 1])}`
})
</script>

<template>
  <span
    class="r-sparkline"
    :style="{ width: width ? `${width}px` : '100%', height: `${height}px` }"
    role="img"
    :aria-label="ariaLabel"
  >
    <svg :viewBox="`0 0 ${W} ${height}`" preserveAspectRatio="none" aria-hidden="true">
      <path v-if="area" :d="geometry.fill" class="r-sparkline__area" :style="{ fill: stroke }" />
      <path
        :d="geometry.line"
        fill="none"
        :style="{ stroke }"
        :stroke-width="strokeWidth"
        stroke-linejoin="round"
        vector-effect="non-scaling-stroke"
      />
    </svg>
    <!-- The end dot lives outside the stretched SVG so it stays round. -->
    <span
      v-if="endDot && geometry.end"
      class="r-sparkline__dot"
      :style="{ left: `${geometry.end[0]}%`, top: `${geometry.end[1]}px`, background: stroke }"
    />
  </span>
</template>

<style>
.r-sparkline {
  position: relative;
  display: block;
  flex-shrink: 0;
}

.r-sparkline svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.r-sparkline__area {
  opacity: 0.08;
}

.r-sparkline__dot {
  position: absolute;
  width: 7px;
  height: 7px;
  margin: -3.5px 0 0 -3.5px;
  border: 1.5px solid var(--r-chart-surface);
  border-radius: var(--r-radius-round);
  box-sizing: border-box;
}
</style>
