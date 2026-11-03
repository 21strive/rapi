<script setup lang="ts">
import { computed, watch } from 'vue'
import { Minus, Plus } from 'lucide-vue-next'
import { RButton, RIconButton, RInput, RKbd, RSegmented, RSlider, RSpecList, type SpecItem } from '@/design-system'
import { LOT, feeRate, idr, lots, price } from '../data'

const side = defineModel<'buy' | 'sell'>('side', { required: true })
const limit = defineModel<string | number | null>('price', { required: true })
const quantity = defineModel<string | number | null>('lots', { required: true })

const props = defineProps<{
  ticker: string
  last: number
  tick: number
  buyingPower: number
  /** Lots held, the most you can sell. */
  held: number
}>()

const emit = defineEmits<{ submit: [order: { side: 'buy' | 'sell'; type: 'Limit' | 'Market'; price: number; lots: number }] }>()

const type = defineModel<'Limit' | 'Market'>('type', { default: 'Limit' })
const share = defineModel<number>('share', { default: 25 })

const sideOptions = [
  { label: 'Buy', value: 'buy' },
  { label: 'Sell', value: 'sell' },
]
const typeOptions = [
  { label: 'Limit', value: 'Limit' },
  { label: 'Market', value: 'Market' },
]

const px = computed(() => (type.value === 'Market' ? props.last : Number(String(limit.value ?? '').replace(/[^\d]/g, '')) || 0))
const qty = computed(() => Number(String(quantity.value ?? '').replace(/[^\d]/g, '')) || 0)
const value = computed(() => px.value * qty.value * LOT)
const fee = computed(() => value.value * feeRate[side.value])
const total = computed(() => (side.value === 'buy' ? value.value + fee.value : value.value - fee.value))

const offTick = computed(() => type.value === 'Limit' && px.value > 0 && px.value % props.tick !== 0)
const tooMuch = computed(() => (side.value === 'buy' ? total.value > props.buyingPower : qty.value > props.held))
const valid = computed(() => qty.value > 0 && px.value > 0 && !offTick.value && !tooMuch.value)

/** The slider sizes the order: a share of buying power for buys, of the position for sells. */
function sizeFromShare(pct: number) {
  if (side.value === 'sell') {
    quantity.value = String(Math.floor((props.held * pct) / 100))
    return
  }
  const perLot = px.value * LOT * (1 + feeRate.buy)
  quantity.value = String(perLot ? Math.floor((props.buyingPower * pct) / 100 / perLot) : 0)
}
watch(share, (pct) => sizeFromShare(pct))
watch([side, () => props.ticker], () => sizeFromShare(share.value))

function nudge(steps: number) {
  if (type.value === 'Market') return
  const base = px.value || props.last
  limit.value = String(Math.max(props.tick, Math.round(base / props.tick) * props.tick + steps * props.tick))
}

function onPriceKey(event: KeyboardEvent) {
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    event.preventDefault()
    nudge((event.key === 'ArrowUp' ? 1 : -1) * (event.shiftKey ? 5 : 1))
  }
}

const summary = computed<SpecItem[]>(() => [
  { label: 'Order value', value: idr(value.value), mono: true },
  { label: side.value === 'buy' ? 'Fee 0.15%' : 'Fee and tax 0.25%', value: idr(fee.value), mono: true },
  { label: side.value === 'buy' ? 'Total debit' : 'Net proceeds', value: idr(total.value), mono: true },
  side.value === 'buy'
    ? {
        label: 'Buying power after',
        value: idr(Math.max(0, props.buyingPower - total.value)),
        mono: true,
        tone: tooMuch.value ? 'danger' : undefined,
      }
    : { label: 'Position after', value: `${lots(Math.max(0, props.held - qty.value))} lots`, mono: true, tone: tooMuch.value ? 'danger' : undefined },
])

function submit() {
  if (!valid.value) return
  emit('submit', { side: side.value, type: type.value, price: px.value, lots: qty.value })
}

defineExpose({ submit })
</script>

<template>
  <form class="s-tt-ticket" :aria-label="`Order ticket for ${ticker}`" @submit.prevent="submit">
    <div class="s-tt-ticket__pair">
      <RSegmented v-model="side" :options="sideOptions" variant="pill" block label="Side" />
      <RSegmented v-model="type" :options="typeOptions" block label="Order type" />
    </div>

    <div class="s-tt-ticket__pair">
      <RInput
        :model-value="type === 'Market' ? 'Market' : limit"
        label="Price"
        inputmode="numeric"
        :disabled="type === 'Market'"
        :error="offTick ? `Tick is ${tick}` : undefined"
        class="s-tt-ticket__input"
        @update:model-value="(v) => (limit = v)"
        @keydown="onPriceKey"
      >
        <template #trailing>
          <span class="s-tt-ticket__steppers">
            <RIconButton label="Lower by one tick" variant="ghost" size="xs" :disabled="type === 'Market'" @click="nudge(-1)"><Minus /></RIconButton>
            <RIconButton label="Raise by one tick" variant="ghost" size="xs" :disabled="type === 'Market'" @click="nudge(1)"><Plus /></RIconButton>
          </span>
        </template>
      </RInput>
      <RInput
        v-model="quantity"
        label="Lots"
        inputmode="numeric"
        class="s-tt-ticket__input"
        :error="tooMuch ? (side === 'buy' ? 'Over buying power' : `You hold ${lots(held)}`) : undefined"
      >
        <template #trailing><span class="s-tt-ticket__unit">× {{ LOT }}</span></template>
      </RInput>
    </div>

    <RSlider
      v-model="share"
      :label="side === 'buy' ? 'Share of buying power' : 'Share of position'"
      :min="0"
      :max="100"
      :step="5"
      unit="%"
      :marks="[
        { value: 0, label: '0' },
        { value: 25, label: '25' },
        { value: 50, label: '50' },
        { value: 75, label: '75' },
        { value: 100, label: '100' },
      ]"
      :format="(v) => `${v}%`"
    />

    <RSpecList :items="summary" :columns="2" layout="stack" dense />

    <RButton type="submit" size="lg" block :tone="side === 'buy' ? 'brand' : 'danger'" :disabled="!valid">
      {{ side === 'buy' ? 'Buy' : 'Sell' }} {{ qty ? `${lots(qty)} lots` : '' }} {{ ticker }}
      <span v-if="type === 'Limit' && px" class="s-tt-ticket__at">@ {{ price(px) }}</span>
    </RButton>

    <ul class="s-tt-ticket__keys" aria-label="Keyboard shortcuts">
      <li><RKbd :keys="['B']" size="sm" /> Buy</li>
      <li><RKbd :keys="['S']" size="sm" /> Sell</li>
      <li><RKbd :keys="['up']" size="sm" /><RKbd :keys="['down']" size="sm" /> Tick</li>
      <li><RKbd :keys="['enter']" size="sm" /> Send</li>
    </ul>
  </form>
</template>

<style scoped>
.s-tt-ticket {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
}

.s-tt-ticket__pair {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 8px;
  align-items: start;
}

.s-tt-ticket__input :deep(input) {
  font-family: var(--r-font-mono);
  font-variant-numeric: tabular-nums;
}

.s-tt-ticket__steppers {
  display: inline-flex;
  gap: 2px;
  margin-right: -4px;
}

.s-tt-ticket__unit {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.s-tt-ticket__at {
  margin-left: 4px;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  opacity: 0.86;
}

.s-tt-ticket__keys {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
  padding-top: 8px;
  border-top: 1px solid var(--r-border-subtle);
  color: var(--r-text-tertiary);
  font-size: var(--r-text-2xs);
}
.s-tt-ticket__keys li {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>
