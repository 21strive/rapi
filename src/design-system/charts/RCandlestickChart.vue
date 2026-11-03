<script setup lang="ts">
// STUB — API contract for Rapi 0.2. Keep these props, emits and slots; replace the template.
import type { CandlePoint, ChartReference } from '../types'

/** OHLC candles with an optional volume strip. Up = cobalt, down = orange (the diverging pair). */
withDefaults(
  defineProps<{
    data: CandlePoint[]
    label: string
    height?: number
    /** Volume strip under the candles, on its own axis band (never a second y-scale on the plot). */
    volume?: boolean
    references?: ChartReference[]
    format?: (value: number) => string
  }>(),
  { height: 320, volume: true },
)
</script>

<template>
  <div class="r-stub" data-stub="RCandlestickChart">RCandlestickChart</div>
</template>
