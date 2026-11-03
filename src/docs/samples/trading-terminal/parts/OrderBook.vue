<script setup lang="ts">
import { computed } from 'vue'
import { RMeter } from '@/design-system'
import { type Level, lots, price } from '../data'

const props = withDefaults(defineProps<{ bids: Level[]; asks: Level[]; depth?: number }>(), { depth: 8 })
const emit = defineEmits<{ pick: [price: number, side: 'buy' | 'sell'] }>()

/** Cumulative lots from the touch outwards; the bar is the depth up to that level. */
function withTotals(levels: Level[]) {
  let running = 0
  return levels.slice(0, props.depth).map((l) => ({ ...l, total: (running += l.lots) }))
}

const bidRows = computed(() => withTotals(props.bids))
/** Asks print best-last, so the touch sits on the spread row. */
const askRows = computed(() => withTotals(props.asks).reverse())
const maxTotal = computed(() => Math.max(bidRows.value[bidRows.value.length - 1]?.total ?? 1, askRows.value[0]?.total ?? 1))

const spread = computed(() => {
  const ask = props.asks[0]?.price ?? 0
  const bid = props.bids[0]?.price ?? 0
  const mid = (ask + bid) / 2
  return { abs: ask - bid, bps: mid ? ((ask - bid) / mid) * 10000 : 0 }
})

const bidLots = computed(() => bidRows.value.reduce((s, l) => s + l.lots, 0))
const askLots = computed(() => askRows.value.reduce((s, l) => s + l.lots, 0))
const imbalance = computed(() => (bidLots.value / Math.max(1, bidLots.value + askLots.value)) * 100)
</script>

<template>
  <div class="s-tt-book">
    <div class="s-tt-book__head" aria-hidden="true">
      <span>Price</span>
      <span class="is-right">Lots</span>
      <span class="is-right">Total</span>
      <span>Depth</span>
    </div>
    <div class="s-tt-book__side" role="group" aria-label="Asks, highest first">
      <button
        v-for="l in askRows"
        :key="`a${l.price}`"
        type="button"
        class="s-tt-book__row is-ask"
        :aria-label="`Ask ${price(l.price)}, ${lots(l.lots)} lots, ${l.orders} orders. Use this price to buy.`"
        @click="emit('pick', l.price, 'buy')"
      >
        <span class="s-tt-book__price">{{ price(l.price) }}</span>
        <span class="is-right">{{ lots(l.lots) }}</span>
        <span class="is-right s-tt-book__total">{{ lots(l.total) }}</span>
        <RMeter
          :segments="[{ value: l.total, color: 'var(--r-div-neg)' }]"
          :max="maxTotal"
          :height="6"
          :label="`Depth to ${price(l.price)}: ${lots(l.total)} lots`"
        />
      </button>
    </div>
    <div class="s-tt-book__spread">
      <span class="r-label">Spread</span>
      <span class="s-tt-book__spread-value">{{ price(spread.abs) }} · {{ spread.bps.toFixed(1) }} bps</span>
    </div>
    <div class="s-tt-book__side" role="group" aria-label="Bids, highest first">
      <button
        v-for="l in bidRows"
        :key="`b${l.price}`"
        type="button"
        class="s-tt-book__row is-bid"
        :aria-label="`Bid ${price(l.price)}, ${lots(l.lots)} lots, ${l.orders} orders. Use this price to sell.`"
        @click="emit('pick', l.price, 'sell')"
      >
        <span class="s-tt-book__price">{{ price(l.price) }}</span>
        <span class="is-right">{{ lots(l.lots) }}</span>
        <span class="is-right s-tt-book__total">{{ lots(l.total) }}</span>
        <RMeter
          :segments="[{ value: l.total, color: 'var(--r-div-pos)' }]"
          :max="maxTotal"
          :height="6"
          :label="`Depth to ${price(l.price)}: ${lots(l.total)} lots`"
        />
      </button>
    </div>
    <div class="s-tt-book__foot">
      <span class="r-label">Bid {{ Math.round(imbalance) }}%</span>
      <RMeter
        :segments="[
          { value: bidLots, color: 'var(--r-div-pos)', label: 'Bids' },
          { value: askLots, color: 'var(--r-div-neg)', label: 'Asks' },
        ]"
        :height="4"
        :label="`Book imbalance: bids ${Math.round(imbalance)}%, asks ${100 - Math.round(imbalance)}% of the ${depth} levels shown`"
      />
      <span class="r-label">{{ 100 - Math.round(imbalance) }}% Ask</span>
    </div>
  </div>
</template>

<style scoped>
.s-tt-book {
  display: flex;
  flex-direction: column;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
}

.s-tt-book__head,
.s-tt-book__row {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr) minmax(0, 1fr) 56px;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
}

.s-tt-book__head {
  height: 24px;
  border-bottom: 1px solid var(--r-border-subtle);
  color: var(--r-text-tertiary);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.is-right {
  text-align: right;
}

.s-tt-book__row {
  height: 21px;
  border: 0;
  background: none;
  color: var(--r-text);
  font: inherit;
  cursor: pointer;
}
.s-tt-book__row:hover {
  background: var(--r-bg-hover);
}
.s-tt-book__row:focus-visible {
  outline-offset: -2px;
}

.is-ask .s-tt-book__price {
  color: var(--r-signal-text);
}
.is-bid .s-tt-book__price {
  color: var(--r-brand-text);
}

.s-tt-book__total {
  color: var(--r-text-tertiary);
}

.s-tt-book__spread {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 26px;
  margin: 2px 0;
  padding: 0 12px;
  border-top: 1px solid var(--r-border-subtle);
  border-bottom: 1px solid var(--r-border-subtle);
  background: var(--r-bg-muted);
}

.s-tt-book__spread-value {
  color: var(--r-text-secondary);
}

.s-tt-book__foot {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  height: 28px;
  margin-top: 4px;
  padding: 0 12px;
  border-top: 1px solid var(--r-border-subtle);
}
</style>
