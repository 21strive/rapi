<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import type { TooltipRow } from './utils'

const props = withDefaults(
  defineProps<{
    /** Anchor point inside the chart, in px. */
    x: number
    y: number
    /** Size of the chart area the tooltip has to stay inside. */
    bounds: { width: number; height: number }
    title?: string
    rows: TooltipRow[]
    /** `top`: centred above the point. `side`: to the right, flipping left near the edge. */
    placement?: 'top' | 'side'
  }>(),
  { placement: 'side' },
)

const el = ref<HTMLElement | null>(null)
const position = ref({ left: 0, top: 0 })

function place() {
  const tip = el.value
  if (!tip) return
  const w = tip.offsetWidth
  const h = tip.offsetHeight
  let left: number
  let top: number
  if (props.placement === 'top') {
    left = props.x - w / 2
    top = props.y - h - 12
    if (top < -4) top = props.y + 14
  } else {
    left = props.x + 14
    if (left + w > props.bounds.width) left = props.x - w - 14
    top = props.y - h / 2
  }
  position.value = {
    left: Math.round(Math.min(Math.max(left, 0), Math.max(0, props.bounds.width - w))),
    top: Math.round(Math.min(Math.max(top, -4), Math.max(0, props.bounds.height - h))),
  }
}

watch(
  () => [props.x, props.y, props.title, props.rows.map((r) => r.value).join()],
  () => nextTick(place),
  { immediate: true },
)
</script>

<template>
  <div ref="el" class="r-chart-tooltip" :style="{ transform: `translate(${position.left}px, ${position.top}px)` }" aria-hidden="true">
    <div v-if="title" class="r-chart-tooltip__title">{{ title }}</div>
    <div v-for="row in rows" :key="row.label" class="r-chart-tooltip__row">
      <span v-if="row.color" class="r-chart-tooltip__dot" :style="{ background: row.color }" />
      <span class="r-chart-tooltip__label">{{ row.label }}</span>
      <span class="r-chart-tooltip__value">{{ row.value }}</span>
    </div>
  </div>
</template>

<style>
.r-chart-tooltip {
  position: absolute;
  z-index: 2;
  top: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 112px;
  padding: 8px 10px;
  border: 1px solid var(--r-border-subtle);
  border-radius: var(--r-radius-md);
  background: var(--r-bg-raised);
  box-shadow: var(--r-shadow-md);
  color: var(--r-text);
  font-size: var(--r-text-xs);
  line-height: 1.3;
  white-space: nowrap;
  pointer-events: none;
  transition: transform var(--r-duration-fast) var(--r-ease-out);
}

[data-theme='dark'] .r-chart-tooltip {
  border-color: var(--r-border);
}

/* On a coloured card, the tooltip keeps a solid surface. */
.r-card--brand .r-chart-tooltip,
.r-card--flame .r-chart-tooltip {
  border-color: transparent;
  background: #fff;
  color: #15181e;
  --r-text-tertiary: #646c7a;
}

.r-chart-tooltip__title {
  margin-bottom: 2px;
  color: var(--r-text-tertiary);
  font-weight: var(--r-weight-medium);
}

.r-chart-tooltip__row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.r-chart-tooltip__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.r-chart-tooltip__label {
  flex: 1;
  color: var(--r-text-tertiary);
}

.r-chart-tooltip__value {
  margin-left: 12px;
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
}
</style>
