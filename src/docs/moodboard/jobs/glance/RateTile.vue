<script setup lang="ts">
/**
 * One rate, read the way the reader thinks about it. Swap turns the quote around (rupiah per
 * dollar, or dollars per million rupiah; the buy price, or the buyback), so nobody divides in
 * their head.
 */
import { computed, ref } from 'vue'
import { ArrowLeftRight } from 'lucide-vue-next'
import { RButton, RSparkline, RTrend } from '@/design-system'
import { num, rp } from '../../kit'

interface Quote {
  id: string
  /** What the figure is: "IDR per USD". */
  pair: string
  /** Short name for the swap key: "USD per IDR 1 M". */
  short: string
  value: number
  decimals?: number
  format?: 'num' | 'rp'
  /** Change today, percent. */
  delta: number
  /** Optional dealing prices. */
  buy?: number
  sell?: number
  series?: number[]
}

const props = withDefaults(
  defineProps<{
    label: string
    quotes: Quote[]
    /** "14:02 WIB · Arunika Bank". */
    asOf?: string
  }>(),
  {},
)

const at = ref(0)
const quote = computed(() => props.quotes[at.value] ?? props.quotes[0])
const other = computed(() => props.quotes[(at.value + 1) % props.quotes.length])
const fmt = (v: number) => (quote.value.format === 'rp' ? rp(v) : num(v, quote.value.decimals ?? 0))
function swap() {
  at.value = (at.value + 1) % props.quotes.length
}
</script>

<template>
  <div class="mk rate">
    <div class="mk-row mk-between">
      <span class="r-label mk-truncate">{{ label }}</span>
      <RTrend :value="quote.delta" size="sm" :precision="2" />
    </div>
    <div class="rate__body mk-grow">
      <div class="rate__read" aria-live="polite">
        <p class="rate__figure mk-fig">{{ fmt(quote.value) }}</p>
        <p class="rate__pair mk-truncate">{{ quote.pair }}</p>
        <p v-if="quote.buy != null && quote.sell != null" class="rate__deal">
          <span><span class="r-label">Buy</span> {{ fmt(quote.buy) }}</span>
          <span><span class="r-label">Sell</span> {{ fmt(quote.sell) }}</span>
        </p>
      </div>
      <div v-if="quote.series?.length" class="rate__spark">
        <RSparkline :key="quote.id" :values="quote.series" color="var(--r-chart-1)" :height="44" area :label="`${quote.pair}, last 30 days`" />
        <span class="r-label">30 days</span>
      </div>
    </div>
    <div class="rate__foot">
      <RButton variant="ghost" size="sm" @click="swap">
        <template #leading><ArrowLeftRight :size="14" /></template>
        <span class="r-sr-only">Swap to </span>{{ other.short }}
      </RButton>
      <span v-if="asOf" class="rate__asof mk-truncate">{{ asOf }}</span>
    </div>
  </div>
</template>

<style scoped>
.rate {
  container-type: inline-size;
  gap: 6px;
}

.rate__body {
  display: flex;
  align-items: stretch;
  gap: 16px;
  min-width: 0;
}

.rate__read {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.rate__figure {
  overflow: hidden;
  font-size: var(--r-text-3xl);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rate__pair {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

.rate__deal {
  display: flex;
  gap: 12px;
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.rate__deal .r-label {
  margin-right: 2px;
}

.rate__spark {
  display: flex;
  flex: 0 0 40%;
  align-self: flex-end;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.rate__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
  margin: 0 0 -4px -8px;
}

.rate__asof {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

/* One module wide: no shape, a smaller figure. */
@container (max-width: 240px) {
  .rate__spark,
  .rate__asof {
    display: none;
  }

  .rate__figure {
    font-size: var(--r-text-xl);
  }
}
</style>
