<script setup lang="ts">
/**
 * Who has seen a notice, one square per person: filled once they have, with the time. The arrow
 * keys (or the pointer) read each square out; Remind nudges everyone who has not, and the record
 * says when.
 */
import { computed, nextTick, ref } from 'vue'
import { RButton, initialsOf } from '@/design-system'
import { arrowMove, stamp } from './shared'

interface Person {
  name: string
  /** "11:02 WIB" once seen. */
  seen?: string
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    people: Person[]
    /** "seen", "acknowledged". */
    verb?: string
    /** mini 1x1 · row 2x1. */
    layout?: 'mini' | 'row'
    /** Squares per row in the grid. */
    cols?: number
  }>(),
  { verb: 'seen', layout: 'mini' },
)

const cursor = ref<number | null>(null)
const reminded = ref('')
const squares: (HTMLElement | null)[] = []

const seen = computed(() => props.people.filter((p) => p.seen).length)
const missing = computed(() => props.people.length - seen.value)
const columns = computed(() => props.cols ?? props.people.length)
const initials = computed(() => props.people.length <= (props.layout === 'row' ? 8 : 6))

function onKeydown(event: KeyboardEvent, i: number) {
  const next = arrowMove(event, i, props.people.length, 'grid', columns.value)
  if (next === null) return
  event.preventDefault()
  cursor.value = next
  nextTick(() => squares[next]?.focus())
}

const reading = computed(() => {
  if (cursor.value === null) {
    return reminded.value ? `Reminded ${missing.value} · ${reminded.value}` : `${missing.value} not yet ${props.verb}`
  }
  const p = props.people[cursor.value]
  return p.seen ? `${p.name} · ${props.verb} ${p.seen}` : `${p.name} · not yet${reminded.value ? ', reminded' : ''}`
})
</script>

<template>
  <div class="mk seen" :class="`seen--${layout}`">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span class="seen__count"><span class="mk-fig">{{ seen }}</span><span class="mk-unit">/{{ people.length }}</span></span>
    </div>

    <div class="seen__grid" role="group" :aria-label="`${seen} of ${people.length} ${verb}`" :style="{ '--cols': columns }">
      <button
        v-for="(p, i) in people"
        :key="p.name"
        :ref="(el) => (squares[i] = el as HTMLElement | null)"
        type="button"
        class="seen__sq"
        :class="{ 'is-seen': p.seen, 'is-cursor': cursor === i, 'is-reminded': !p.seen && reminded }"
        :tabindex="(cursor ?? 0) === i ? 0 : -1"
        :aria-label="p.seen ? `${p.name}, ${verb} ${p.seen}` : `${p.name}, not yet ${verb}`"
        @click="cursor = i"
        @focus="cursor = i"
        @pointerenter="cursor = i"
        @keydown="onKeydown($event, i)"
      >
        <span v-if="initials" aria-hidden="true">{{ initialsOf(p.name) }}</span>
      </button>
    </div>

    <div class="seen__foot mk-end">
      <p class="seen__reading mk-truncate" aria-live="polite">{{ reading }}</p>
      <RButton
        :size="layout === 'mini' ? 'xs' : 'sm'"
        variant="outline"
        :disabled="!missing"
        @click="reminded = stamp('WIB', false)"
      >
        {{ reminded ? 'Remind again' : `Remind ${missing}` }}
      </RButton>
    </div>
  </div>
</template>

<style scoped>
.seen {
  gap: 8px;
}

.seen__count {
  display: inline-flex;
  flex: none;
  align-items: baseline;
}

.seen__count .mk-fig {
  font-size: var(--r-text-lg);
}

.seen__grid {
  display: grid;
  grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
  gap: 3px;
  max-width: 100%;
}

.seen__sq {
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 1px solid var(--r-border-strong);
  background: transparent;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  cursor: pointer;
}

.seen__sq.is-seen {
  border-color: var(--r-ink);
  background: var(--r-ink);
  color: var(--r-on-ink);
}

.seen__sq.is-reminded {
  border-color: var(--r-brand-text);
  color: var(--r-brand-text);
}

/* The square being read: a second rule around it, quieter than the focus ring. */
.seen__sq.is-cursor {
  box-shadow: 0 0 0 1px var(--r-text);
}

.seen__sq:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: 1px;
}

.seen__foot {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 6px;
}

.seen__reading {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

.seen--mini .seen__grid {
  max-height: 64px;
}

/* Row: squares stay at a readable size, the button sits beside the reading. */
.seen--row .seen__grid {
  grid-template-columns: repeat(var(--cols), 36px);
}
.seen--row .seen__sq {
  font-size: var(--r-text-2xs);
}
.seen--row .seen__foot {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}
</style>
