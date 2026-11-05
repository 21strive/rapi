<script setup lang="ts">
/**
 * A figure with its recent shape: the number a person checks first, the change, and a sparkline.
 * The period keys swap the window; hovering the line reads any point.
 */
import { computed, ref } from 'vue'
import { RSegmented, RSparkline, RTrend } from '@/design-system'
import { idr, num, rp, usd } from '../../kit'

interface Period {
  id: string
  label: string
  values: number[]
  /** The change over the period, in percent. */
  delta: number
}

const props = withDefaults(
  defineProps<{
    label: string
    unit?: string
    periods: Period[]
    format?: 'num' | 'rp' | 'idr' | 'usd' | 'pct'
    decimals?: number
    /** Lower is better (latency, cost, churn): a drop reads as good. */
    invert?: boolean
    /** Quiet line under the figure. */
    note?: string
  }>(),
  { format: 'num', decimals: 0 },
)

const period = ref(props.periods[props.periods.length - 1]?.id)
const current = computed(() => props.periods.find((p) => p.id === period.value) ?? props.periods[0])
const last = computed(() => current.value.values[current.value.values.length - 1] ?? 0)

const hovered = ref<number | null>(null)
const shownValue = computed(() => (hovered.value == null ? last.value : current.value.values[hovered.value]))
function onMove(event: PointerEvent) {
  const box = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const n = current.value.values.length
  hovered.value = Math.max(0, Math.min(n - 1, Math.round(((event.clientX - box.left) / box.width) * (n - 1))))
}

const text = computed(() => {
  const v = shownValue.value
  switch (props.format) {
    case 'rp':
      return rp(v)
    case 'idr':
      return idr(v)
    case 'usd':
      return usd(v, props.decimals)
    case 'pct':
      return `${num(v, props.decimals)}%`
    default:
      return num(v, props.decimals)
  }
})

const options = computed(() => props.periods.map((p) => ({ label: p.label, value: p.id })))
</script>

<template>
  <div class="mk fig-spark">
    <div class="mk-row mk-between">
      <span class="r-label mk-truncate">{{ label }}</span>
      <RTrend :value="current.delta" :invert="invert" size="sm" />
    </div>
    <p class="fig-spark__figure">
      <span class="mk-fig">{{ text }}</span>
      <span v-if="unit" class="mk-unit">{{ unit }}</span>
    </p>
    <p v-if="note" class="fig-spark__note">{{ hovered == null ? note : `Point ${hovered + 1} of ${current.values.length}` }}</p>
    <div class="fig-spark__line mk-grow" @pointermove="onMove" @pointerleave="hovered = null">
      <RSparkline
        :values="current.values"
        :invert="invert"
        :height="40"
        area
        :label="`${label}, ${current.label}`"
      />
    </div>
    <RSegmented v-if="periods.length > 1" v-model="period" :options="options" size="sm" block :label="`${label} period`" />
  </div>
</template>

<style scoped>
.fig-spark__figure {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}

.fig-spark__figure .mk-fig {
  overflow: hidden;
  font-size: var(--r-text-3xl);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fig-spark__note {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.fig-spark__line {
  display: flex;
  align-items: flex-end;
  min-height: 32px;
  cursor: crosshair;
}

.fig-spark__line > * {
  width: 100%;
}
</style>
