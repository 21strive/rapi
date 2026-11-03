<script setup lang="ts">
// STUB — API contract for Rapi 0.2. Keep these props, emits and slots; replace the template.
import type { GanttRow } from '../types'

/** Rows of bars on a time axis: schedules, passes, mission phases. A signal-orange "now" line. */
withDefaults(
  defineProps<{
    rows: GanttRow[]
    label: string
    /** [start, end] of the axis in the same units as the items (minutes, hours, epoch ms…). */
    domain: [number, number]
    /** Tick positions; defaults to 6 even ticks. */
    ticks?: number[]
    formatTick?: (value: number) => string
    now?: number
    rowHeight?: number
    labelWidth?: number
  }>(),
  { rowHeight: 32, labelWidth: 160 },
)
</script>

<template>
  <div class="r-stub" data-stub="RGanttChart">RGanttChart</div>
</template>
