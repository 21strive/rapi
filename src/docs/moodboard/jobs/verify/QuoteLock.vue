<script setup lang="ts">
/**
 * A price held for a set time is a promise with a clock, so the clock is on the record: when it was
 * locked, how long is left, and what the price did once the hold ran out. The hold drains on the
 * board's clock; a new lock is one press, a release is another.
 */
import { computed, ref } from 'vue'
import { RButton, RStatus } from '@/design-system'
import { clock } from '../../kit'
import { stamp, useCountdown } from './shared'

interface Line {
  label: string
  value: string
}

interface Quote {
  rate: string
  /** Against the previous quote: "+0.3%". */
  move?: string
  lines?: Line[]
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    /** The first quote; later ones come from `next`, in turn. */
    quote: Quote
    next?: Quote[]
    /** Unit after the rate: "IDR per SGD". */
    unit?: string
    seconds: number
    /** When the first hold started: "14:02:11 WIB". */
    lockedAt?: string
    pixel?: boolean
    /** row 2x1 · mini 1x1 · card 2x2. */
    layout?: 'row' | 'mini' | 'card'
  }>(),
  { next: () => [], layout: 'row', lockedAt: '' },
)

const all = computed(() => [props.quote, ...props.next])
const index = ref(0)
const q = computed(() => all.value[index.value % all.value.length])
const at = ref(props.lockedAt)
const state = ref<'held' | 'expired' | 'released'>('held')

const { left, start, stop } = useCountdown(props.seconds, () => {
  if (state.value === 'held') state.value = 'expired'
})
start()

function lock() {
  index.value++
  at.value = stamp()
  state.value = 'held'
  start()
}

function release() {
  stop()
  state.value = 'released'
}

const segments = computed(() => (props.layout === 'mini' ? 10 : 15))
const lit = computed(() => (state.value === 'held' ? Math.ceil((left.value / props.seconds) * segments.value) : 0))
const remaining = computed(() => (props.seconds >= 120 ? clock(left.value) : `${left.value} s`))

const status = computed(() =>
  state.value === 'held'
    ? { tone: 'success' as const, label: 'Locked' }
    : state.value === 'expired'
      ? { tone: 'warning' as const, label: 'Expired' }
      : { tone: 'neutral' as const, label: 'Released' },
)
</script>

<template>
  <div class="mk quote" :class="[`quote--${layout}`, { 'quote--pixel': pixel }]">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <RStatus :tone="status.tone" :label="status.label" size="sm" />
    </div>

    <div class="quote__main">
      <p class="quote__rate" :class="{ 'is-stale': state !== 'held' }">
        <span class="mk-fig">{{ q.rate }}</span>
        <span v-if="unit" class="mk-unit">{{ unit }}</span>
      </p>
      <dl v-if="q.lines && layout !== 'mini'" class="quote__lines">
        <div v-for="l in q.lines" :key="l.label" class="quote__line">
          <dt>{{ l.label }}</dt>
          <dd>{{ l.value }}</dd>
        </div>
      </dl>
    </div>

    <div class="quote__hold mk-end">
      <div class="quote__bar" aria-hidden="true">
        <span v-for="i in segments" :key="i" :class="{ 'is-on': i <= lit }" />
      </div>
      <p class="quote__when" aria-live="polite">
        <template v-if="state === 'held'">
          <span class="quote__left">{{ remaining }}</span>
          <span v-if="layout !== 'mini'" class="quote__at">held{{ at ? ` since ${at}` : '' }}</span>
        </template>
        <template v-else-if="state === 'expired'">
          {{ all[(index + 1) % all.length].move ? `Price now moved ${all[(index + 1) % all.length].move}` : 'Hold ran out' }}
        </template>
        <template v-else>Released. No price is held.</template>
      </p>
    </div>

    <RButton
      :size="layout === 'mini' ? 'xs' : 'sm'"
      :tone="state === 'held' ? 'neutral' : 'brand'"
      :variant="state === 'held' ? 'ghost' : 'solid'"
      :block="layout === 'mini'"
      class="quote__btn"
      @click="state === 'held' ? release() : lock()"
    >
      {{ state === 'held' ? 'Release hold' : 'Lock new price' }}
    </RButton>
  </div>
</template>

<style scoped>
.quote {
  gap: 8px;
  container-type: inline-size;
}

.quote__main {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.quote__rate {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}

.quote__rate .mk-fig {
  overflow: hidden;
  font-size: var(--r-text-2xl);
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color var(--r-duration-fast) var(--r-ease-out);
}

.quote__rate.is-stale .mk-fig {
  color: var(--r-text-tertiary);
}

.quote__lines {
  display: grid;
  border-top: 1px solid var(--r-border-subtle);
}

.quote__line {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 4px 0;
  border-bottom: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-xs);
}

.quote__line dt {
  color: var(--r-text-tertiary);
}

.quote__line dd {
  margin: 0;
  font-variant-numeric: tabular-nums;
}

.quote__hold {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.quote__bar {
  display: flex;
  gap: 2px;
  height: 6px;
}

.quote__bar span {
  flex: 1;
  background: var(--r-bg-track);
}

.quote__bar span.is-on {
  background: var(--r-text);
}

.quote__when {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
  overflow: hidden;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  white-space: nowrap;
}

.quote__left {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
  font-variant-numeric: tabular-nums;
  color: var(--r-text);
}

.quote__at {
  overflow: hidden;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  text-overflow: ellipsis;
}

.quote__btn {
  flex: none;
}

/* Row 2x1: rate on the left, terms on the right, the hold under both. */
.quote--row .quote__main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
  align-items: start;
  gap: 14px;
}
.quote--row .quote__rate {
  flex-direction: column;
  gap: 2px;
}
.quote--row .quote__lines {
  border-top: 0;
}
.quote--row .quote__line {
  padding: 2px 0;
}
.quote--row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-rows: auto minmax(0, 1fr) auto;
  column-gap: 10px;
}
.quote--row > :first-child,
.quote--row .quote__main {
  grid-column: 1 / -1;
}
.quote--row .quote__hold {
  align-self: end;
}
.quote--row .quote__btn {
  align-self: end;
}

/* Mini 1x1: a rupiah price needs the room; its unit goes under it. */
.quote--mini .quote__rate {
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
}
.quote--mini:not(.quote--pixel) .quote__rate .mk-fig {
  font-size: var(--r-text-xl);
}

/* Card 2x2: bigger figure. */
.quote--card .quote__rate .mk-fig {
  font-size: var(--r-text-3xl);
}

.quote--pixel .quote__rate .mk-fig {
  font-family: var(--r-font-pixel);
  font-weight: 400;
  letter-spacing: 0.02em;
}
</style>
