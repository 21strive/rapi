<script setup lang="ts">
/**
 * Open, high, low, close: the library candlestick chart with a range switch and the volume strip
 * on its own band. The readout compares the last close with the first open of the range.
 */
import { computed, ref } from 'vue'
import { RCandlestickChart, RSwitch, useElementSize, type CandlePoint } from '@/design-system'
import { num } from '../../kit'
import { change, delta } from './shared'
import Keys from './Keys.vue'

interface Range {
  key: string
  label: string
  data: CandlePoint[]
}

const props = withDefaults(
  defineProps<{
    label: string
    unit?: string
    ranges: Range[]
    decimals?: number
  }>(),
  { decimals: 2 },
)

const key = ref(props.ranges[0].key)
const range = computed(() => props.ranges.find((r) => r.key === key.value) ?? props.ranges[0])
const options = computed(() => props.ranges.map((r) => ({ value: r.key, label: r.label })))
const volume = ref(true)

const first = computed(() => range.value.data[0])
const last = computed(() => range.value.data[range.value.data.length - 1])
const high = computed(() => Math.max(...range.value.data.map((d) => d.high)))
const low = computed(() => Math.min(...range.value.data.map((d) => d.low)))

const plot = ref<HTMLElement | null>(null)
const { height } = useElementSize(plot)
const priceText = (v: number) => num(v, props.decimals)
</script>

<template>
  <div class="mk cmp candles">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ label }}</span>
      <Keys v-model="key" :options="options" label="Range" />
    </div>
    <div class="candles__read">
      <p class="candles__price">
        <span class="mk-fig">{{ priceText(last.close) }}</span>
        <span v-if="unit" class="mk-unit">{{ unit }}</span>
        <span class="candles__delta">{{ delta(change(first.open, last.close), 2) }}</span>
      </p>
      <RSwitch v-model="volume" size="sm" label="Volume" />
    </div>
    <p class="candles__range">
      <span>High {{ priceText(high) }}</span>
      <span>Low {{ priceText(low) }}</span>
      <span>{{ range.data.length }} candles</span>
    </p>
    <div ref="plot" class="candles__plot">
      <RCandlestickChart
        v-if="height > 90"
        :data="range.data"
        :height="Math.floor(height)"
        :volume="volume"
        :format="priceText"
        :label="`${label}, ${range.label} candles${unit ? `, ${unit}` : ''}`"
      />
    </div>
  </div>
</template>

<style scoped>
.candles {
  gap: 6px;
}

.candles__read {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.candles__price {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
  white-space: nowrap;
}

.candles__price .mk-fig {
  font-size: var(--r-text-xl);
}

.candles__delta {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
}

.candles__range {
  display: flex;
  gap: 12px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  white-space: nowrap;
}

.candles__plot {
  flex: 1 1 0;
  min-height: 0;
}
</style>
