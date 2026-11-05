<script setup lang="ts">
/**
 * Stock about to run out, with the reorder already worked out: how many are left, when they run
 * out at today's pace, and an order of the usual size one press away. The quantity can be nudged
 * first; the order can be cancelled while it is still a draft at the supplier.
 */
import { computed, ref } from 'vue'
import { Minus, Plus } from 'lucide-vue-next'
import { RButton, RIconButton, RStatus } from '@/design-system'
import { num } from '../../kit'
import { roughly, stamp, useFocusKeeper } from './shared'

const props = withDefaults(
  defineProps<{
    item: string
    /** Mono id: "SKU 8992-0412". */
    sku?: string
    left: number
    unit: string
    /** Used per day at the current pace. */
    perDay: number
    /** Where the reorder line sits, and what full means, in the same unit. */
    reorderAt: number
    capacity: number
    /** Suggested order and its step. */
    qty: number
    step?: number
    supplier?: string
    arrives: string
    word?: string
    tone?: 'warning' | 'danger'
    decimals?: number
    /** `row` 2x1 · `panel` 2x2 · `silo` 1x2 · `mini` 1x1. */
    layout?: 'row' | 'panel' | 'silo' | 'mini'
  }>(),
  { step: 1, word: 'Low', tone: 'warning', decimals: 0, layout: 'row' },
)

const qty = ref(props.qty)
const ordered = ref<{ qty: number; at: string } | null>(null)
const { bind, keep } = useFocusKeeper()

const SEGMENTS = 16
const fill = computed(() => Math.min(1, props.left / props.capacity))
const lit = computed(() => Math.max(1, Math.round(fill.value * SEGMENTS)))
const line = computed(() => props.reorderAt / props.capacity)
const runsOut = computed(() => roughly((props.left / props.perDay) * 86400))

function order() {
  keep('[data-focus="cancel"]')
  ordered.value = { qty: qty.value, at: stamp() }
}

function cancel() {
  keep('[data-focus="order"]')
  ordered.value = null
}

function nudge(by: number) {
  qty.value = Math.max(props.step, qty.value + by * props.step)
}

const fmt = (v: number) => num(v, Number.isInteger(v) ? 0 : props.decimals)
const wide = computed(() => props.layout === 'row' || props.layout === 'panel')
</script>

<template>
  <div :ref="bind" class="mk stock" :class="`stock--${layout}`">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ layout === 'mini' ? item : (sku ?? item) }}</span>
      <RStatus :tone="ordered ? 'neutral' : tone" :label="ordered ? 'Ordered' : word" size="sm" class="stock__status" />
    </div>

    <div class="stock__body">
      <!-- The silo draws its level upright; the others draw it as a row of blocks. -->
      <div
        v-if="layout === 'silo'"
        class="stock__silo"
        :class="`r-tone-${tone}`"
        role="img"
        :aria-label="`${fmt(left)} ${unit} of ${fmt(capacity)}, reorder at ${fmt(reorderAt)}`"
      >
        <span class="stock__level" :style="{ height: `${fill * 100}%` }" />
        <span class="stock__line" :style="{ bottom: `${line * 100}%` }"><span>Reorder</span></span>
      </div>

      <div class="stock__read">
        <p v-if="layout !== 'mini'" class="stock__item">{{ item }}</p>
        <p class="stock__figure">
          <span class="mk-fig">{{ fmt(left) }}</span>
          <span class="mk-unit">{{ unit }} left</span>
        </p>
        <p class="stock__pace">{{ wide ? `Runs out in about ${runsOut} at ${fmt(perDay)} a day` : `Lasts about ${runsOut}` }}</p>
      </div>
    </div>

    <div
      v-if="layout === 'row' || layout === 'panel'"
      class="stock__meter"
      :class="`r-tone-${tone}`"
      role="img"
      :aria-label="`${fmt(left)} of ${fmt(capacity)} ${unit}, reorder at ${fmt(reorderAt)}`"
    >
      <span v-for="i in SEGMENTS" :key="i" :class="{ 'is-on': i <= lit }" />
      <span class="stock__tick" :style="{ left: `${line * 100}%` }" />
    </div>

    <dl v-if="layout === 'panel' && supplier" class="stock__lines">
      <div>
        <dt>Supplier</dt>
        <dd>{{ supplier }}</dd>
      </div>
      <div>
        <dt>Arrives</dt>
        <dd>{{ arrives }}, if ordered by 15:00</dd>
      </div>
    </dl>

    <div class="stock__foot mk-end">
      <template v-if="!ordered">
        <div v-if="layout === 'panel' || layout === 'silo'" class="stock__qty">
          <RIconButton label="Fewer" size="sm" variant="outline" :disabled="qty <= step" @click="nudge(-1)"><Minus :size="14" /></RIconButton>
          <span class="stock__n" aria-live="polite">{{ fmt(qty) }} <span class="mk-unit">{{ unit }}</span></span>
          <RIconButton label="More" size="sm" variant="outline" @click="nudge(1)"><Plus :size="14" /></RIconButton>
        </div>
        <RButton size="sm" tone="brand" data-focus="order" @click="order">
          {{ layout === 'mini' || layout === 'silo' ? `Order ${fmt(qty)}` : `Reorder ${fmt(qty)} ${unit}` }}
        </RButton>
      </template>
      <template v-else>
        <p class="stock__done" aria-live="polite">
          <template v-if="wide">
            {{ fmt(ordered.qty) }} {{ unit }} ordered {{ ordered.at }}<template v-if="supplier"> from {{ supplier }}</template>. Arrives {{ arrives }}.
          </template>
          <template v-else>Ordered {{ fmt(ordered.qty) }} · arrives {{ arrives }}</template>
        </p>
        <RButton size="sm" variant="ghost" data-focus="cancel" @click="cancel">Cancel</RButton>
      </template>
    </div>
  </div>
</template>

<style scoped>
.stock {
  gap: 8px;
}

.stock__status {
  flex: none;
}

.stock__body {
  display: flex;
  gap: 12px;
  min-width: 0;
  min-height: 0;
}

.stock--silo .stock__body {
  flex: 1 1 auto;
  flex-direction: column;
}

.stock__read {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.stock__item {
  overflow: hidden;
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stock--panel .stock__item,
.stock--silo .stock__item,
.stock--mini .stock__item {
  white-space: normal;
}

.stock__figure {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.stock__figure .mk-fig {
  font-size: var(--r-text-2xl);
}

.stock--panel .stock__figure .mk-fig {
  font-size: var(--r-text-3xl);
}

.stock__pace {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

.stock__meter {
  position: relative;
  display: grid;
  grid-template-columns: repeat(16, 1fr);
  gap: 2px;
  height: 10px;
}

.stock__meter span {
  background: var(--r-bg-track);
}

.stock__meter span.is-on {
  background: var(--tone-lamp);
}

/* The reorder point: a short ink tick through the blocks. */
.stock__meter .stock__tick {
  position: absolute;
  top: -3px;
  bottom: -3px;
  width: 2px;
  background: var(--r-chart-ink);
  transform: translateX(-1px);
}

.stock__silo {
  position: relative;
  flex: 1 1 auto;
  min-height: 60px;
  border: 1px solid var(--r-border-strong);
  border-top: 0;
  background: var(--r-bg-muted);
}

.stock__level {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  background: var(--tone-lamp);
}

.stock__line {
  position: absolute;
  right: 0;
  left: 0;
  border-top: 1px dashed var(--r-chart-ink);
}

.stock__line span {
  position: absolute;
  right: 4px;
  bottom: 2px;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.stock__lines {
  display: grid;
  margin: 4px 0 0;
  border-top: 1px solid var(--r-border-subtle);
}

.stock__lines > div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 5px 0;
  border-bottom: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-xs);
}

.stock__lines dt {
  color: var(--r-text-tertiary);
}

.stock__lines dd {
  overflow: hidden;
  margin: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stock__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.stock--mini .stock__foot > *,
.stock--silo .stock__foot > * {
  flex: 1 1 100%;
}

.stock__qty {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stock--silo .stock__qty {
  justify-content: space-between;
}

.stock__n {
  min-width: 56px;
  font-variant-numeric: tabular-nums;
  font-weight: var(--r-weight-semibold);
  text-align: center;
}

.stock__done {
  flex: 1 1 0;
  min-width: 0;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}
</style>
