<script setup lang="ts">
/**
 * An expiry as a number of days, for each link of a chain: a certificate and its issuers, a
 * licence and the permits that hang on it. The keys under the figure step through the chain; the
 * word beside the figure says whether it is valid, due for renewal or expired.
 */
import { computed, nextTick, ref } from 'vue'
import { RStatus } from '@/design-system'
import { num } from '../../kit'
import { arrowMove } from './shared'

interface Item {
  /** The key's label: "Leaf", "Int", "Root", "STR". */
  key: string
  subject: string
  days: number
  /** "05 Dec 2026". */
  until: string
  issuer?: string
}

const props = withDefaults(
  defineProps<{
    items: Item[]
    eyebrow?: string
    /** Days under which it reads "Renew soon". */
    warnAt?: number
    pixel?: boolean
    /** square 1x1 · wide 2x1. */
    layout?: 'square' | 'wide'
  }>(),
  { warnAt: 30, layout: 'square' },
)

const index = ref(0)
const item = computed(() => props.items[index.value] ?? props.items[0])
const keys: (HTMLElement | null)[] = []

function onKeydown(event: KeyboardEvent, i: number) {
  const next = arrowMove(event, i, props.items.length, 'horizontal')
  if (next === null) return
  event.preventDefault()
  index.value = next
  nextTick(() => keys[next]?.focus())
}

const status = computed(() => {
  const d = item.value.days
  if (d <= 0) return { tone: 'danger' as const, label: 'Expired' }
  if (d <= props.warnAt) return { tone: 'warning' as const, label: 'Renew soon' }
  return { tone: 'success' as const, label: 'Valid' }
})

const figure = computed(() => (item.value.days <= 0 ? '0' : num(item.value.days)))
const unit = computed(() => (item.value.days === 1 ? 'day' : 'days'))
</script>

<template>
  <div class="mk cert" :class="[`cert--${layout}`, { 'cert--pixel': pixel }]">
    <div class="cert__head">
      <p v-if="layout === 'wide' && eyebrow" class="r-eyebrow mk-truncate">{{ eyebrow }}</p>
      <p class="cert__subject mk-truncate">{{ item.subject }}</p>
    </div>

    <div class="cert__body">
      <p class="cert__figure" aria-live="polite">
        <span class="mk-fig">{{ figure }}</span>
        <span class="mk-unit">{{ unit }}</span>
      </p>
      <div class="cert__facts">
        <RStatus :tone="status.tone" :label="status.label" size="sm" />
        <span class="cert__until">to {{ item.until }}</span>
        <span v-if="layout === 'wide' && item.issuer" class="cert__issuer mk-truncate">{{ item.issuer }}</span>
      </div>
    </div>

    <div class="cert__keys mk-end" role="radiogroup" :aria-label="eyebrow ? `${eyebrow}: which one` : 'Which link of the chain'">
      <button
        v-for="(it, i) in items"
        :key="it.key"
        :ref="(el) => (keys[i] = el as HTMLElement | null)"
        type="button"
        role="radio"
        class="cert__key"
        :class="{ 'is-on': i === index }"
        :aria-checked="i === index"
        :aria-label="`${it.subject}, ${it.days} days`"
        :tabindex="i === index ? 0 : -1"
        @click="index = i"
        @keydown="onKeydown($event, i)"
      >
        {{ it.key }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.cert {
  gap: 6px;
}

.cert__head {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.cert__subject {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
}

.cert__body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.cert__figure {
  display: flex;
  align-items: baseline;
  gap: 5px;
}

.cert__figure .mk-fig {
  font-size: var(--r-text-3xl);
}

.cert__facts {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.cert__until {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  white-space: nowrap;
}

.cert__issuer {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

/* The keys under the figure: one per link; the lit key is the one shown. */
.cert__keys {
  display: grid;
  grid-auto-columns: minmax(0, 1fr);
  grid-auto-flow: column;
  gap: 2px;
}

.cert__key {
  position: relative;
  height: 24px;
  min-width: 0;
  margin: 0;
  padding: 0 4px;
  overflow: hidden;
  border: 1px solid var(--r-border-strong);
  background: var(--r-bg-surface);
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.04em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background-color var(--r-duration-fast) var(--r-ease-out),
    color var(--r-duration-fast) var(--r-ease-out);
}

.cert__key:hover {
  background: var(--r-bg-hover);
  color: var(--r-text);
}

.cert__key.is-on {
  border-color: var(--r-ink);
  background: var(--r-ink);
  color: var(--r-on-ink);
}

.cert__key:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: 1px;
}

/* Square: the facts sit on one line under the figure. */
.cert--square .cert__facts {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px 8px;
}

/* Wide: figure on the left, the facts beside it. */
.cert--wide .cert__body {
  flex-direction: row;
  align-items: flex-end;
  gap: 16px;
}
.cert--wide .cert__figure .mk-fig {
  font-size: var(--r-text-4xl);
}

.cert--pixel .cert__figure .mk-fig {
  font-family: var(--r-font-pixel);
  font-weight: 400;
  letter-spacing: 0.02em;
}
</style>
