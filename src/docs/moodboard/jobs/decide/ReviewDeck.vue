<script setup lang="ts">
/**
 * A pile the model flagged, decided one card at a time: keep or skip, with the arrow keys or the
 * two keys under the card. Progress is a row of squares; the last decision can be taken back.
 * A wide tile keeps the log of what was decided beside the card.
 */
import { computed, ref } from 'vue'
import { ArrowLeft, ArrowRight } from 'lucide-vue-next'
import { RButton } from '@/design-system'
import { holdFocus } from './shared'

interface Item {
  id: string
  /** Mono caps over the card: "Plot 14 · 3.2 ha". */
  label: string
  title: string
  meta?: string
  /** A few label/value pairs for a larger card. */
  facts?: { label: string; value: string }[]
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    items: Item[]
    keepLabel?: string
    skipLabel?: string
    /** Past tense for the log: "Sent", "Dismissed". */
    kept?: string
    skipped?: string
  }>(),
  { keepLabel: 'Keep', skipLabel: 'Skip', kept: 'Kept', skipped: 'Skipped' },
)

const root = ref<HTMLElement | null>(null)
const card = ref<HTMLElement | null>(null)
const verdicts = ref<('keep' | 'skip')[]>([])
const index = computed(() => verdicts.value.length)
const current = computed(() => props.items[index.value])
const keptCount = computed(() => verdicts.value.filter((v) => v === 'keep').length)

function judge(v: 'keep' | 'skip') {
  if (!current.value) return
  const restore = holdFocus(root)
  verdicts.value = [...verdicts.value, v]
  // The keys give way to "Back one" after the last card; keep focus on the card.
  if (!current.value) restore('.deck__card')
}

function back() {
  verdicts.value = verdicts.value.slice(0, -1)
  card.value?.focus()
}

function again() {
  verdicts.value = []
  card.value?.focus()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowRight') judge('keep')
  else if (event.key === 'ArrowLeft') judge('skip')
  else if (event.key === 'Backspace' && index.value) back()
  else return
  event.preventDefault()
}

const log = computed(() =>
  verdicts.value.map((v, i) => ({ item: props.items[i], v })).reverse(),
)
</script>

<template>
  <div ref="root" class="mk deck">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span class="r-label deck__count">{{ Math.min(index + 1, items.length) }}/{{ items.length }}</span>
    </div>

    <div class="deck__body">
      <div class="deck__main">
        <div
          ref="card"
          class="deck__card"
          :class="{ 'is-done': !current }"
          tabindex="0"
          :aria-label="current ? `${current.label}: ${current.title}. Right arrow to ${keepLabel.toLowerCase()}, left arrow to ${skipLabel.toLowerCase()}` : 'All reviewed'"
          @keydown="onKeydown"
        >
          <template v-if="current">
            <span class="r-label mk-truncate">{{ current.label }}</span>
            <span class="deck__title">{{ current.title }}</span>
            <span v-if="current.meta" class="deck__meta">{{ current.meta }}</span>
            <dl v-if="current.facts?.length" class="deck__facts">
              <div v-for="f in current.facts" :key="f.label">
                <dt>{{ f.label }}</dt>
                <dd>{{ f.value }}</dd>
              </div>
            </dl>
          </template>
          <template v-else>
            <span class="r-label">All {{ items.length }} reviewed</span>
            <span class="deck__title">{{ kept }} {{ keptCount }}, {{ skipped.toLowerCase() }} {{ items.length - keptCount }}</span>
          </template>
        </div>

        <ol class="deck__progress" aria-hidden="true">
          <li
            v-for="(item, i) in items"
            :key="item.id"
            :class="{ 'is-keep': verdicts[i] === 'keep', 'is-skip': verdicts[i] === 'skip', 'is-now': i === index }"
          />
        </ol>

        <div v-if="current" class="deck__keys">
          <RButton variant="outline" size="sm" @click="judge('skip')">
            <template #leading><ArrowLeft aria-hidden="true" /></template>
            {{ skipLabel }}
          </RButton>
          <RButton tone="brand" size="sm" @click="judge('keep')">
            {{ keepLabel }}
            <template #trailing><ArrowRight aria-hidden="true" /></template>
          </RButton>
        </div>
        <div v-else class="deck__keys">
          <RButton variant="outline" size="sm" @click="back">Back one</RButton>
          <RButton variant="ghost" size="sm" @click="again">Start over</RButton>
        </div>
      </div>

      <ol class="deck__log" aria-label="Decided">
        <li v-for="entry in log" :key="entry.item.id">
          <span class="deck__log-word" :class="`is-${entry.v}`">{{ entry.v === 'keep' ? kept : skipped }}</span>
          <span class="mk-truncate">{{ entry.item.title }}</span>
        </li>
        <li v-if="!log.length" class="deck__log-empty">Nothing decided yet</li>
      </ol>
    </div>
  </div>
</template>

<style scoped>
.deck {
  container-type: inline-size;
  gap: 8px;
}

.deck__count {
  flex: none;
  font-variant-numeric: tabular-nums;
}

.deck__body {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  gap: 16px;
}

.deck__main {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

/* The card on top of the pile: two offset rules behind it say there are more. */
.deck__card {
  position: relative;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 4px;
  min-height: 0;
  margin: 0 6px 6px 0;
  padding: 10px 12px;
  border: 1px solid var(--r-border-strong);
  background: var(--r-bg-surface);
}

.deck__card::before,
.deck__card::after {
  content: '';
  position: absolute;
  z-index: -1;
  border-right: 1px solid var(--r-border);
  border-bottom: 1px solid var(--r-border);
}
.deck__card::before {
  inset: 2px -4px -4px 2px;
}
.deck__card::after {
  inset: 4px -7px -7px 4px;
  border-color: var(--r-border-subtle);
}
.deck__card.is-done::before,
.deck__card.is-done::after {
  display: none;
}

.deck__card:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: 2px;
}

.deck__main {
  isolation: isolate;
}

.deck__title {
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.3;
}

.deck__meta {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

.deck__facts {
  display: grid;
  margin: auto 0 0;
  border-top: 1px solid var(--r-border-subtle);
}

.deck__facts div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 0;
  border-bottom: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-xs);
}

.deck__facts dt {
  flex: none;
  color: var(--r-text-tertiary);
}

.deck__facts dd {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Progress: one square per card. Kept in ink, skipped as an empty frame, the current in cobalt. */
.deck__progress {
  display: flex;
  gap: 2px;
}

.deck__progress li {
  flex: 1 1 0;
  height: 6px;
  background: var(--r-bg-track);
}
.deck__progress li.is-keep {
  background: var(--r-text);
}
.deck__progress li.is-skip {
  background: none;
  box-shadow: inset 0 0 0 1px var(--r-border-strong);
}
.deck__progress li.is-now {
  background: var(--r-brand);
}

.deck__keys {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

/* The log beside the card, only when the tile is wide enough to hold both. */
.deck__log {
  display: none;
  flex: 0 0 40%;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  border-top: 1px solid var(--r-border);
}

.deck__log li {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
  padding: 5px 0;
  border-bottom: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-xs);
}

.deck__log-word {
  flex: none;
  width: 9ch;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.deck__log-word.is-skip {
  color: var(--r-text-tertiary);
}

.deck__log-empty {
  color: var(--r-text-tertiary);
}

@container (min-width: 460px) {
  .deck__log {
    display: flex;
  }
}

@container (max-width: 200px) {
  .deck__keys :deep(svg) {
    display: none;
  }
}
</style>
