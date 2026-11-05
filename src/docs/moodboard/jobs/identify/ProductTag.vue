<script setup lang="ts">
/**
 * A shelf tag: what it is, which pack, the price, and the barcode the till reads. Pick the pack
 * and the price, the SKU and the bars change with it. The bars are a true EAN-13 of the digits
 * under them, Indonesian prefix 899 and check digit included.
 */
import { computed, ref } from 'vue'
import { RSegmented } from '@/design-system'
import { rp } from '../../kit'
import { ean13Check, ean13Path } from './shared'

interface Pack {
  label: string
  sku: string
  /** The first twelve digits; the check digit is computed. */
  ean: string
  price: number
  /** Unit price, as the shelf law asks: "Rp 356 / g". */
  per?: string
  stock?: number
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    name: string
    maker?: string
    packs: Pack[]
    /** Quiet facts: "Roasted 2 Nov 2026", "Batch PCT26K031". */
    notes?: string[]
    /** `card` 2x2 · `row` 2x1 · `tall` 1x2. */
    layout?: 'card' | 'row' | 'tall'
  }>(),
  { notes: () => [], layout: 'card' },
)

const chosen = ref(0)
const pack = computed(() => props.packs[chosen.value])
const options = computed(() => props.packs.map((p, i) => ({ label: p.label, value: i })))
const pick = computed({
  get: () => chosen.value,
  set: (v: string | number | undefined) => (chosen.value = Number(v ?? 0)),
})

const digits = computed(() => `${pack.value.ean}${ean13Check(pack.value.ean)}`)
const bars = computed(() => ean13Path(digits.value, 46, 5))
</script>

<template>
  <div class="mk tag" :class="`tag--${layout}`">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span v-if="pack.stock != null" class="r-label">Stock {{ pack.stock }}</span>
    </div>

    <div class="tag__what">
      <p class="tag__name">{{ name }}</p>
      <p v-if="maker" class="tag__maker mk-truncate">{{ maker }}</p>
    </div>

    <RSegmented v-model="pick" :options="options" size="sm" :block="layout !== 'row'" :label="`${name}, pack`" />

    <div class="tag__price" aria-live="polite">
      <span class="tag__amount mk-fig">{{ rp(pack.price) }}</span>
      <span v-if="pack.per" class="tag__per">{{ pack.per }}</span>
    </div>

    <div class="tag__bottom mk-end">
      <svg
        class="tag__bars"
        viewBox="-10 0 115 62"
        shape-rendering="crispEdges"
        role="img"
        :aria-label="`Barcode ${digits}`"
      >
        <path :d="bars.d" />
        <text class="tag__digits" x="-9" y="60">{{ digits[0] }}</text>
        <text class="tag__digits" x="4" y="60" textLength="40" lengthAdjust="spacing">{{ digits.slice(1, 7) }}</text>
        <text class="tag__digits" x="51" y="60" textLength="40" lengthAdjust="spacing">{{ digits.slice(7) }}</text>
      </svg>
      <div class="tag__ids">
        <span class="r-label">SKU</span>
        <span class="r-mono tag__sku">{{ pack.sku }}</span>
        <span v-if="layout === 'row' && pack.per" class="tag__note">{{ pack.per }}</span>
        <span v-for="n in notes" :key="n" class="tag__note">{{ n }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tag {
  container-type: inline-size;
}

.tag__what {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.tag__name {
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.3;
}

.tag__maker {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

.tag__price {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.tag__amount {
  font-size: var(--r-text-3xl);
  white-space: nowrap;
}

.tag__per {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  white-space: nowrap;
}

.tag__bottom {
  display: flex;
  align-items: flex-end;
  gap: 14px;
  min-width: 0;
}

.tag__bars {
  flex: none;
  width: 132px;
  height: auto;
  fill: var(--r-text);
}

.tag--card .tag__bars {
  width: 172px;
}

.tag__digits {
  font-family: var(--r-font-mono);
  font-size: 9px;
}

.tag__ids {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  padding-bottom: 2px;
}

.tag__sku {
  overflow: hidden;
  font-size: var(--r-text-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag__note {
  overflow: hidden;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-2xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 2x1: the words on the left, the bars on the right */
.tag--row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-rows: auto auto 1fr auto;
  column-gap: 16px;
  row-gap: 4px;
}

.tag--row > .mk-row {
  grid-column: 1 / -1;
}

.tag--row .tag__what {
  grid-column: 1;
}

.tag--row :deep(.r-segmented) {
  grid-column: 1;
  grid-row: 4;
  justify-self: start;
}

.tag--row .tag__price {
  grid-column: 1;
  grid-row: 3;
  align-self: end;
  justify-content: flex-start;
  overflow: hidden;
}

.tag--row .tag__per {
  display: none;
}

.tag--row .tag__amount {
  font-size: var(--r-text-2xl);
}

.tag--row .tag__bottom {
  grid-column: 2;
  grid-row: 2 / 5;
  flex-direction: column;
  align-items: stretch;
  gap: 4px;
  margin: 0;
}

.tag--row .tag__bars {
  width: 110px;
}

.tag--row .tag__ids {
  max-width: 110px;
}

.tag--row .tag__ids > .r-label {
  display: none;
}

/* 1x2: one column, the price large, the bars at the foot */
.tag--tall .tag__price {
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding-top: 4px;
}

.tag--tall .tag__bottom {
  flex-direction: column;
  align-items: stretch;
  gap: 6px;
}

.tag--tall .tag__bars {
  width: 100%;
}
</style>
