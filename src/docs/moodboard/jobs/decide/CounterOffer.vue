<script setup lang="ts">
/**
 * Someone names a price; the person accepts it or counters. The model starts the counter where
 * the market and last season suggest; the stepper moves it, and the difference from the ask and
 * the total are worked out as it moves, so nobody does sums in their head.
 */
import { computed, ref } from 'vue'
import { RButton, RStatus, type StatusTone } from '@/design-system'
import { num, rp, signed, type Zone } from '../../kit'
import AmountStepper from './AmountStepper.vue'
import DecisionStrip from './DecisionStrip.vue'
import { holdFocus, useDecision } from './shared'

const props = withDefaults(
  defineProps<{
    eyebrow: string
    /** Who asks: "Koperasi Tani Sumber Rejeki". */
    from: string
    asks: number
    /** The price unit, its own case: "/kg". */
    unit?: string
    /** For the total: 2000 and "kg". */
    qty?: number
    qtyUnit?: string
    /** What the model weighed: "Last season Rp 104.000 · market Rp 112.500". */
    context?: string
    /** Where the counter starts. */
    start: number
    step: number
    min: number
    currency?: 'rp' | 'usd'
    decimals?: number
    zone?: Zone
    compact?: boolean
  }>(),
  { unit: undefined, qty: undefined, qtyUnit: undefined, context: undefined, currency: 'rp', decimals: 0, zone: 'WIB' },
)

const root = ref<HTMLElement | null>(null)
const counter = ref(props.start)
const { choice, at, left, decide, undo } = useDecision<'accepted' | 'countered'>(10)

const money = (v: number) => (props.currency === 'rp' ? rp(v) : `USD ${num(v, props.decimals)}`)
const delta = computed(() => signed(((counter.value - props.asks) / props.asks) * 100))
const total = computed(() => (props.qty ? money(counter.value * props.qty) : null))
const same = computed(() => counter.value >= props.asks)

function accept() {
  const restore = holdFocus(root)
  counter.value = props.asks
  decide('accepted')
  restore('[data-focus="undo"]')
}

function send() {
  if (same.value) return accept()
  const restore = holdFocus(root)
  decide('countered')
  restore('[data-focus="undo"]')
}

function revert() {
  const restore = holdFocus(root)
  undo()
  restore('[data-focus="stepper"]')
}

const status = computed<{ tone: StatusTone; label: string }>(() => {
  if (choice.value === 'accepted') return { tone: 'success', label: 'Accepted' }
  if (choice.value === 'countered') return { tone: 'brand', label: 'Countered' }
  return { tone: 'warning', label: 'Needs you' }
})
</script>

<template>
  <div ref="root" class="mk counter" :class="{ 'counter--compact': compact }">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <RStatus v-if="!compact" :tone="status.tone" :label="status.label" size="sm" />
      <span v-else class="r-label counter__asks">Asks {{ money(asks) }}{{ unit ?? '' }}</span>
    </div>

    <template v-if="!compact">
      <p class="counter__from mk-truncate">{{ from }} asks</p>
      <p class="counter__ask">
        <span class="mk-fig">{{ money(asks) }}</span>
        <span v-if="unit" class="mk-unit">{{ unit }}</span>
      </p>
      <p v-if="context" class="counter__context">{{ context }}</p>
    </template>

    <div class="counter__mine mk-end">
      <div v-if="!compact" class="mk-row mk-between">
        <span class="r-label">Your counter</span>
        <span class="counter__delta">{{ delta }} on the ask</span>
      </div>
      <template v-if="!choice">
        <div class="counter__line">
          <AmountStepper
            v-model="counter"
            class="counter__stepper"
            label="Your counter"
            :min="min"
            :max="asks"
            :step="step"
            :format="money"
            :unit="unit"
          />
          <span v-if="compact" class="counter__delta">{{ delta }}</span>
        </div>
        <p v-if="total && !compact" class="counter__total">Total {{ total }} for {{ num(qty ?? 0) }} {{ qtyUnit }}</p>
        <div class="counter__keys">
          <RButton variant="outline" size="sm" @click="accept">Accept the ask</RButton>
          <RButton tone="brand" size="sm" @click="send">{{ same ? 'Accept' : 'Send counter' }}</RButton>
        </div>
      </template>
      <template v-else>
        <p class="counter__sent">
          <span class="mk-fig">{{ money(counter) }}</span><span v-if="unit" class="mk-unit">{{ unit }}</span>
          <span class="counter__to mk-truncate">{{ choice === 'accepted' ? 'accepted' : `sent to ${from}` }}</span>
        </p>
        <DecisionStrip
          :at="at"
          :left="choice === 'countered' ? 0 : left"
          :persistent="choice === 'countered'"
          :undo-label="choice === 'countered' ? 'Withdraw' : 'Undo'"
          :label="compact ? status.label : undefined"
          :tone="status.tone"
          :zone="zone"
          @undo="revert"
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
.counter {
  gap: 6px;
}

.counter__asks {
  flex: none;
  text-transform: none;
  letter-spacing: 0;
}

.counter__from {
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
}

.counter__ask {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.counter__ask .mk-fig {
  font-size: var(--r-text-2xl);
}

.counter__context {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

.counter__mine {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 8px;
  border-top: 1px solid var(--r-border-subtle);
}

.counter__line {
  display: flex;
  align-items: center;
  gap: 10px;
}

.counter__stepper {
  flex: 1 1 auto;
}

.counter__delta {
  flex: none;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
}

.counter__total {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
}

.counter__keys {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.counter__sent {
  display: flex;
  align-items: baseline;
  gap: 4px;
  min-width: 0;
}

.counter__sent .mk-fig {
  font-size: var(--r-text-lg);
}

.counter__to {
  margin-left: 4px;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

.counter--compact .counter__mine {
  padding-top: 0;
  border-top: 0;
}
/* The status word in the header never gives way to the eyebrow. */
.mk-row > .r-status {
  flex: none;
}
</style>
