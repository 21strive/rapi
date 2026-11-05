<script setup lang="ts">
/**
 * A queue as counts by severity, with how long the oldest has waited, because "how bad, and how
 * late?" is the whole question. Press a severity, or arrow to it, to see its oldest item.
 */
import { computed } from 'vue'
import { RStatus } from '@/design-system'
import { num } from '../../kit'
import { lampOf, toneOf, useRoving, type Level } from './shared'

interface Bucket {
  id: string
  /** "P1", "1". */
  label: string
  /** "Critical", "Resuscitation". */
  word: string
  level: Level
  count: number
  /** How long the oldest has waited: "42 min". */
  oldest?: string
  /** The oldest item itself: "Ransomware note on fs-02". */
  item?: string
  /** Who has it, if anyone. */
  who?: string
}

const props = withDefaults(
  defineProps<{
    label: string
    /** Plural noun: "alerts", "patients". */
    noun: string
    buckets: Bucket[]
    layout?: 'row' | 'list'
    /** Word for the oldest age: "oldest", "longest wait". */
    oldestWord?: string
  }>(),
  { layout: 'row', oldestWord: 'Oldest' },
)

const first = Math.max(0, props.buckets.findIndex((b) => b.count > 0))
const roving = useRoving({ count: () => props.buckets.length, initial: first })
const bucket = computed(() => props.buckets[roving.active.value] ?? props.buckets[0])
const total = computed(() => props.buckets.reduce((s, b) => s + b.count, 0))
</script>

<template>
  <div class="mk queue" :class="`queue--${layout}`">
    <div class="mk-row mk-between">
      <span class="r-label mk-truncate">{{ label }}</span>
      <span class="r-label queue__total"><b>{{ num(total) }}</b> {{ noun }}</span>
    </div>
    <div
      class="queue__cells"
      :class="{ 'mk-grow': layout === 'list' }"
      :style="layout === 'row' ? { gridTemplateColumns: `repeat(${buckets.length}, minmax(0, 1fr))` } : undefined"
      role="radiogroup"
      :aria-label="`${label} by severity`"
      @keydown="roving.onKeydown"
    >
      <button
        v-for="(b, i) in buckets"
        :key="b.id"
        :ref="roving.bind(i)"
        type="button"
        role="radio"
        class="queue__cell mk-reset"
        :class="{ 'is-on': i === roving.active.value, 'is-empty': !b.count }"
        :aria-checked="i === roving.active.value"
        :aria-label="`${b.label} ${b.word}: ${b.count} ${noun}${b.oldest ? `, ${oldestWord.toLowerCase()} ${b.oldest}` : ''}`"
        :tabindex="i === roving.active.value ? 0 : -1"
        @click="roving.go(i)"
      >
        <span class="queue__name">
          <span class="queue__lamp" :style="{ background: lampOf(b.level) }" />
          <span class="queue__id">{{ b.label }}</span>
          <span class="queue__word mk-truncate">{{ b.word }}</span>
        </span>
        <span class="queue__count mk-fig">{{ num(b.count) }}</span>
        <span class="queue__age mk-truncate">{{ b.count ? b.oldest : '—' }}</span>
      </button>
    </div>
    <p class="queue__detail" aria-live="polite">
      <template v-if="bucket.count && bucket.item">
        <RStatus class="keep" size="sm" :tone="toneOf(bucket.level)" :label="`${oldestWord} ${bucket.label}`" />
        <span class="queue__item mk-truncate">{{ bucket.item }}<template v-if="bucket.who"> · {{ bucket.who }}</template></span>
        <span class="queue__when">{{ bucket.oldest }}</span>
      </template>
      <span v-else class="queue__item">Queue clear at {{ bucket.label }} · {{ bucket.word.toLowerCase() }}</span>
    </p>
  </div>
</template>

<style scoped>
.queue__total {
  flex: none;
}

.queue__total b {
  color: var(--r-text);
  font-weight: var(--r-weight-semibold);
}

.queue__cells {
  display: grid;
  border-top: 1px solid var(--r-border);
  border-left: 1px solid var(--r-border);
}

.queue__cell {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding: 6px 10px;
  border-right: 1px solid var(--r-border);
  border-bottom: 1px solid var(--r-border);
  cursor: pointer;
  transition: background-color var(--r-duration-fast) var(--r-ease-out);
}

.queue__cell:hover {
  background: var(--r-bg-hover);
}

.queue__cell.is-on {
  background: var(--r-bg-selected);
}

.queue__cell.is-on::before {
  content: '';
  position: absolute;
  top: -1px;
  right: -1px;
  left: -1px;
  height: 2px;
  background: var(--r-brand);
}

.queue__cell:focus-visible {
  outline-offset: -2px;
}

.queue__name {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.queue__lamp {
  flex: none;
  width: 6px;
  height: 6px;
  border-radius: var(--r-radius-round);
}

.queue__id {
  flex: none;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.04em;
}

.queue__word {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.queue__count {
  font-size: var(--r-text-2xl);
}

.queue__cell.is-empty .queue__count {
  color: var(--r-text-tertiary);
}

.queue__age {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
}

.queue__detail {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  min-height: 16px;
  margin-top: auto;
  font-size: var(--r-text-xs);
}

.queue__item {
  flex: 1 1 auto;
  min-width: 0;
  color: var(--r-text-secondary);
}

.queue__when {
  flex: none;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
}

/* List: one row per severity, count and age to the right. */
.queue--list .queue__cells {
  grid-auto-rows: minmax(0, 1fr);
}

.queue--list .queue__cell {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 48px 64px;
  align-items: center;
  gap: 8px;
}

.queue--list .queue__cell.is-on::before {
  top: -1px;
  right: auto;
  bottom: -1px;
  left: -1px;
  width: 2px;
  height: auto;
}

.queue--list .queue__count {
  font-size: var(--r-text-xl);
  text-align: right;
}

.queue--list .queue__age {
  text-align: right;
}

/* The status word stays whole; the label beside it truncates instead. */
.keep {
  flex: none;
}
</style>
