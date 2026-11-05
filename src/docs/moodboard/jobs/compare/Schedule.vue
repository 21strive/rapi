<script setup lang="ts">
/**
 * Side by side in time: the library Gantt chart, rows of windows on one clock with the orange NOW
 * line, hatching for what is only planned. Click a window, or step to it with the arrow keys and
 * press Enter, to read it against now.
 */
import { computed, ref } from 'vue'
import { RGanttChart, useElementSize, type GanttItem, type GanttRow } from '@/design-system'
import { pad } from '../../kit'

const props = withDefaults(
  defineProps<{
    label: string
    /** "UTC", "WIB". */
    zone: string
    rows: GanttRow[]
    /** Minutes after midnight. */
    domain: [number, number]
    ticks?: number[]
    now?: number
    labelWidth?: number
    /** Index of the row and item read first. */
    initial?: [number, number]
  }>(),
  { labelWidth: 120, initial: () => [0, 0] },
)

const clock = (m: number) => `${pad(Math.floor(m / 60) % 24)}:${pad(Math.round(m) % 60)}`
const picked = ref<{ row: GanttRow; item: GanttItem }>({
  row: props.rows[props.initial[0]],
  item: props.rows[props.initial[0]].items[props.initial[1]],
})

const relation = computed(() => {
  const { item } = picked.value
  if (props.now == null) return ''
  const end = item.milestone ? item.start : item.end
  if (props.now < item.start) return `in ${clockSpan(item.start - props.now)}`
  if (props.now > end) return `${clockSpan(props.now - end)} ago`
  return 'now'
})
function clockSpan(m: number) {
  const h = Math.floor(m / 60)
  const min = Math.round(m % 60)
  return h ? `${h} h ${pad(min)} min` : `${min} min`
}

const plot = ref<HTMLElement | null>(null)
const { width, height } = useElementSize(plot)

/* The chart anchors its first and last tick to the edges but spaces them as if centred, so an
   end label needs about 50px to its neighbour; below that, every other tick. */
const shownTicks = computed(() => {
  if (!props.ticks) return undefined
  const labels = width.value < 520 ? Math.min(props.labelWidth, 110) : props.labelWidth
  const per = (width.value - labels - 8) / Math.max(1, props.ticks.length - 1)
  return per < 50 ? props.ticks.filter((_, i) => i % 2 === 0) : props.ticks
})
const rowHeight = computed(() => Math.max(26, Math.min(props.rows.length <= 3 ? 64 : 48, Math.floor((height.value - 28) / props.rows.length))))
</script>

<template>
  <div class="mk cmp schedule">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ label }}</span>
      <span v-if="now != null" class="schedule__now">Now {{ clock(now) }} {{ zone }}</span>
    </div>
    <p class="schedule__read" aria-live="polite">
      <span class="schedule__strong">{{ picked.row.label }}</span>
      <span>{{ picked.item.label ?? 'Window' }}{{ picked.item.hatch ? ' · planned' : '' }}</span>
      <span>
        {{ clock(picked.item.start) }}{{ picked.item.milestone ? '' : `–${clock(picked.item.end)}` }} {{ zone }}
      </span>
      <span v-if="relation" class="schedule__rel">{{ relation }}</span>
    </p>
    <div ref="plot" class="schedule__plot">
      <RGanttChart
        v-if="height > 80"
        :rows="rows"
        :domain="domain"
        :ticks="shownTicks"
        :now="now"
        :format-tick="clock"
        :row-height="rowHeight"
        :label-width="labelWidth"
        :label="`${label}, ${zone}`"
        @select="(row: GanttRow, item: GanttItem) => (picked = { row, item })"
      />
    </div>
  </div>
</template>

<style scoped>
.schedule {
  gap: 8px;
}

.schedule__now {
  flex: none;
  color: var(--r-signal-text);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.schedule__read {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
  overflow: hidden;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.schedule__strong {
  color: var(--r-text);
  font-family: var(--r-font-sans);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-semibold);
}

.schedule__rel {
  color: var(--r-text);
  font-weight: var(--r-weight-semibold);
}

.schedule__plot {
  flex: 1 1 0;
  min-height: 0;
}
</style>
