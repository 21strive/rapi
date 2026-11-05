<script setup lang="ts">
/**
 * An order book that moves: asks above, bids below, depth drawn behind each level and the spread in
 * the middle. Pick a level, with the pointer or the arrow keys, to set a limit price at it; picking
 * an ask buys there, a bid sells.
 */
import { computed, ref, shallowRef, useId, watch } from 'vue'
import { ArrowDown, ArrowUp } from 'lucide-vue-next'
import { RButton, RStatus } from '@/design-system'
import { num, seeded, signed, time, useTick, type Zone } from '../../kit'
import { stepKey } from './shared'

const props = withDefaults(
  defineProps<{
    label: string
    /** Mid price when the tile opens. */
    mid: number
    /** Price step between levels. */
    step: number
    /** Levels shown on each side. */
    levels?: number
    /** Typical size at a level. */
    size: number
    sizeUnit: string
    decimals?: number
    sizeDecimals?: number
    seed: string
    zone?: Zone
  }>(),
  { levels: 5, decimals: 0, sizeDecimals: 1, zone: 'WIB' },
)

const uid = useId()
const rnd = seeded(props.seed)
const mid = ref(props.mid)
const sizes = () => Array.from({ length: props.levels }, (_, i) => props.size * (0.4 + rnd() * 0.9) * (1 + i * 0.25))
const askSizes = shallowRef(sizes())
const bidSizes = shallowRef(sizes())
const last = ref({ price: props.mid + props.step / 2, side: 'buy' as 'buy' | 'sell', at: new Date(), change: 0 })

const tick = useTick(1000)
watch(tick, () => {
  const r = rnd()
  if (r < 0.18) mid.value += props.step
  else if (r < 0.36) mid.value -= props.step
  const wobble = (list: number[]) => list.map((v, i) => Math.max(props.size * 0.1, v * (0.8 + rnd() * 0.4) + (rnd() < 0.1 ? props.size * (i + 1) * 0.3 : 0)))
  askSizes.value = wobble(askSizes.value)
  bidSizes.value = wobble(bidSizes.value)
  const side = rnd() < 0.5 ? 'buy' : 'sell'
  const price = side === 'buy' ? bestAsk.value : bestBid.value
  last.value = { price, side, at: new Date(), change: price - last.value.price }
})

const half = computed(() => props.step / 2)
const bestAsk = computed(() => mid.value + half.value)
const bestBid = computed(() => mid.value - half.value)

interface Level {
  key: string
  side: 'ask' | 'bid'
  price: number
  size: number
  total: number
}
const asks = computed<Level[]>(() => {
  let total = 0
  return askSizes.value
    .map((size, i) => {
      total += size
      return { key: `a${i}`, side: 'ask' as const, price: bestAsk.value + i * props.step, size, total }
    })
    .reverse()
})
const bids = computed<Level[]>(() => {
  let total = 0
  return bidSizes.value.map((size, i) => {
    total += size
    return { key: `b${i}`, side: 'bid' as const, price: bestBid.value - i * props.step, size, total }
  })
})
const all = computed(() => [...asks.value, ...bids.value])
const deepest = computed(() => Math.max(asks.value[0]?.total ?? 1, bids.value[bids.value.length - 1]?.total ?? 1))

const limit = ref<{ side: 'ask' | 'bid'; price: number } | null>(null)
const cursor = ref<number | null>(null)
function pick(level: Level) {
  limit.value = { side: level.side, price: level.price }
}
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    limit.value = null
    cursor.value = null
    return
  }
  if ((event.key === 'Enter' || event.key === ' ') && cursor.value != null) {
    event.preventDefault()
    pick(all.value[cursor.value])
    return
  }
  const next = stepKey(event, cursor.value ?? props.levels - 1, all.value.length)
  if (next != null) cursor.value = next
}
const isLimit = (l: Level) => limit.value != null && limit.value.price === l.price && limit.value.side === l.side
const p = (v: number) => num(v, props.decimals)
</script>

<template>
  <div class="mk book">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ label }}</span>
      <RStatus tone="signal" pulse size="sm" label="Live" />
    </div>

    <div class="book__last">
      <span class="mk-fig">{{ p(last.price) }}</span>
      <span class="book__move" :class="last.change > 0 ? 'is-up' : last.change < 0 ? 'is-down' : ''">
        <ArrowUp v-if="last.change > 0" :size="14" aria-hidden="true" />
        <ArrowDown v-else-if="last.change < 0" :size="14" aria-hidden="true" />
        {{ last.change ? signed(last.change, decimals, '') : 'unchanged' }}
      </span>
      <span class="book__when">{{ last.side === 'buy' ? 'Bought' : 'Sold' }} {{ time(last.at, zone, true) }}</span>
    </div>

    <div
      class="book__table mk-grow"
      role="listbox"
      tabindex="0"
      :aria-label="`${label} levels. Arrow keys move, Enter sets a limit, Escape clears it.`"
      :aria-activedescendant="cursor != null ? `${uid}-${all[cursor].key}` : undefined"
      @keydown="onKeydown"
      @blur="cursor = null"
    >
      <p class="book__head" aria-hidden="true">
        <span>Price</span>
        <span>Size {{ sizeUnit }}</span>
        <span>Total</span>
      </p>
      <p
        v-for="(l, i) in asks"
        :id="`${uid}-${l.key}`"
        :key="l.key"
        role="option"
        class="book__row is-ask"
        :class="{ 'is-cursor': cursor === i, 'is-limit': isLimit(l) }"
        :aria-selected="isLimit(l)"
        @click="pick(l)"
      >
        <span>{{ p(l.price) }}</span>
        <span>{{ num(l.size, sizeDecimals) }}</span>
        <span>{{ num(l.total, sizeDecimals) }}</span>
        <span class="book__depth" :style="{ width: `${(l.total / deepest) * 100}%` }" />
      </p>
      <p class="book__spread" aria-hidden="true">
        <span>Ask above · bid below</span>
        <span>Spread {{ p(step) }}</span>
      </p>
      <p
        v-for="(l, i) in bids"
        :id="`${uid}-${l.key}`"
        :key="l.key"
        role="option"
        class="book__row is-bid"
        :class="{ 'is-cursor': cursor === i + asks.length, 'is-limit': isLimit(l) }"
        :aria-selected="isLimit(l)"
        @click="pick(l)"
      >
        <span>{{ p(l.price) }}</span>
        <span>{{ num(l.size, sizeDecimals) }}</span>
        <span>{{ num(l.total, sizeDecimals) }}</span>
        <span class="book__depth" :style="{ width: `${(l.total / deepest) * 100}%` }" />
      </p>
    </div>

    <div class="mk-row mk-between book__foot">
      <p v-if="limit" class="book__limit mk-truncate">
        Limit {{ limit.side === 'ask' ? 'buy' : 'sell' }} at <strong>{{ p(limit.price) }}</strong>
      </p>
      <p v-else class="book__hint mk-truncate">Pick a level to set a limit</p>
      <RButton v-if="limit" size="xs" variant="ghost" @click="limit = null">Clear</RButton>
    </div>
  </div>
</template>

<style scoped>
.book {
  gap: 8px;
}

.book__last {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
}

.book__last .mk-fig {
  font-size: var(--r-text-2xl);
}

.book__move {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
}

.book__move.is-up {
  color: var(--r-success-text);
}

.book__move.is-down {
  color: var(--r-danger-text);
}

.book__move svg {
  align-self: center;
}

.book__when {
  margin-left: auto;
  overflow: hidden;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book__table {
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
  outline: none;
}

.book__table:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: 2px;
}

.book__head,
.book__row,
.book__spread {
  display: grid;
  flex: none;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
  font-family: var(--r-font-mono);
  font-variant-numeric: tabular-nums;
}

.book__head {
  padding: 0 6px 4px;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.book__head span:not(:first-child),
.book__row span:not(:first-child):not(.book__depth) {
  text-align: right;
}

.book__row {
  position: relative;
  padding: 1px 6px;
  cursor: pointer;
  font-size: var(--r-text-2xs);
  line-height: 16px;
}

.book__row > span {
  position: relative;
  z-index: 1;
}

.book__row > .book__depth {
  position: absolute;
  z-index: 0;
  top: 1px;
  right: 0;
  bottom: 1px;
}

.book__row.is-ask .book__depth {
  background: color-mix(in srgb, var(--r-div-neg) 16%, transparent);
}

.book__row.is-bid .book__depth {
  background: color-mix(in srgb, var(--r-div-pos) 16%, transparent);
}

.book__row:hover,
.book__row.is-cursor {
  outline: 1px solid var(--r-border-strong);
  outline-offset: -1px;
}

.book__row.is-limit {
  outline: 2px solid var(--r-brand);
  outline-offset: -2px;
  font-weight: var(--r-weight-semibold);
}

.book__spread {
  grid-template-columns: 1fr auto;
  margin: 3px 0;
  padding: 3px 6px;
  border-top: 1px solid var(--r-border-subtle);
  border-bottom: 1px solid var(--r-border-subtle);
  color: var(--r-text-tertiary);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.book__foot {
  flex: none;
  min-height: 24px;
}

.book__limit,
.book__hint {
  font-size: var(--r-text-xs);
}

.book__hint {
  color: var(--r-text-tertiary);
}

.book__limit strong {
  font-family: var(--r-font-mono);
  font-weight: var(--r-weight-semibold);
}
</style>
