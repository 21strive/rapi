<script setup lang="ts">
/**
 * The model searched the calendars and came back with three times that work. Picking one is a
 * glance and a press; the scheduling back-and-forth stays in the conversation.
 */
import { computed, ref } from 'vue'
import { RButton } from '@/design-system'
import type { Zone } from '../../kit'
import DecisionStrip from './DecisionStrip.vue'
import { holdFocus, useDecision } from './shared'

interface Slot {
  id: string
  /** "Thu 12 Nov". */
  day: string
  /** "14:00" or "09:00–11:00". */
  time: string
  /** "All four free", "Rina moves one call". */
  note?: string
  suggested?: boolean
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    title?: string
    slots: Slot[]
    zone?: Zone
    action?: string
    done?: string
    /** Who found them: "Found by Simpul in 4 calendars". */
    found?: string
    /** `row` cells side by side (2x1, 3x1) · `column` stacked (1x2). */
    layout?: 'row' | 'column'
  }>(),
  { title: undefined, zone: 'WIB', action: 'Book', done: 'Booked', found: undefined, layout: 'row' },
)

const root = ref<HTMLElement | null>(null)
const selected = ref(props.slots.find((s) => s.suggested)?.id ?? props.slots[0]?.id)
const current = computed(() => props.slots.find((s) => s.id === selected.value) ?? props.slots[0])
const { choice, at, left, decide, undo } = useDecision<string>(10)

const els: (HTMLElement | null)[] = []
function onKeydown(event: KeyboardEvent) {
  if (choice.value) return
  const i = props.slots.findIndex((s) => s.id === selected.value)
  const n = props.slots.length
  let to: number | null = null
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') to = (i + 1) % n
  else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') to = (i - 1 + n) % n
  if (to === null) return
  event.preventDefault()
  selected.value = props.slots[to].id
  els[to]?.focus()
}

function pick(id: string) {
  if (!choice.value) selected.value = id
}

function book() {
  const restore = holdFocus(root)
  decide(current.value.id)
  restore('[data-focus="undo"]')
}

function revert() {
  const restore = holdFocus(root)
  undo()
  restore('[data-focus="book"]')
}
</script>

<template>
  <div ref="root" class="mk slots">
    <div class="slots__grid" :class="`slots__grid--${layout}`">
      <div class="slots__info">
        <div class="mk-row mk-between">
          <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
          <span v-if="layout === 'row' && found" class="r-label slots__found">{{ found }}</span>
        </div>
        <p v-if="title" class="slots__title">{{ title }}</p>
        <p v-if="layout === 'column' && found" class="r-label">{{ found }}</p>
      </div>

      <div class="slots__cells" role="radiogroup" :aria-label="title ?? eyebrow" @keydown="onKeydown">
        <div
          v-for="(slot, i) in slots"
          :key="slot.id"
          :ref="(el) => (els[i] = el as HTMLElement | null)"
          class="slots__cell"
          :class="{ 'is-selected': slot.id === selected, 'is-out': choice && choice !== slot.id }"
          role="radio"
          :aria-checked="slot.id === selected ? 'true' : 'false'"
          :aria-disabled="choice ? 'true' : undefined"
          :aria-label="`${slot.day}, ${slot.time} ${zone}${slot.note ? `, ${slot.note}` : ''}${slot.suggested ? ', suggested' : ''}`"
          :tabindex="slot.id === selected ? 0 : -1"
          @click="pick(slot.id)"
        >
          <span class="r-label slots__day">{{ slot.day }}</span>
          <span class="slots__time">
            <span class="mk-fig">{{ slot.time }}</span>
            <span class="mk-unit">{{ zone }}</span>
          </span>
          <span v-if="slot.note" class="slots__note mk-truncate">{{ slot.note }}</span>
        </div>
      </div>

      <div class="slots__foot">
        <DecisionStrip v-if="choice" :at="at" :left="left" :zone="zone" :label="done" @undo="revert" />
        <RButton v-else tone="brand" size="sm" block data-focus="book" @click="book">
          {{ action }} {{ current.day }} · {{ current.time }}
        </RButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.slots {
  container-type: inline-size;
}

.slots__grid {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
}

.slots__info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.slots__found {
  flex: none;
}

.slots__title {
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.3;
}

.slots__cells {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  border-top: 1px solid var(--r-border);
  border-left: 1px solid var(--r-border);
}

.slots__grid--column .slots__cells {
  grid-auto-flow: row;
}

.slots__cell {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  padding: 6px 8px 7px;
  border-right: 1px solid var(--r-border);
  border-bottom: 1px solid var(--r-border);
  background: var(--r-bg-surface);
  cursor: pointer;
  transition: background-color var(--r-duration-fast) var(--r-ease-out);
}

.slots__cell:hover:not(.is-selected) {
  background: var(--r-bg-hover);
}

.slots__cell.is-selected {
  background: var(--r-bg-selected);
}

/* The selected slot: a 2px cobalt rule, on top in a row, on the leading edge in a column. */
.slots__cell.is-selected::before {
  content: '';
  position: absolute;
  top: -1px;
  right: 0;
  left: 0;
  height: 2px;
  background: var(--r-brand);
}
.slots__grid--column .slots__cell.is-selected::before {
  top: 0;
  right: auto;
  bottom: 0;
  left: -1px;
  width: 2px;
  height: auto;
}

.slots__cell:focus-visible {
  z-index: 1;
  outline: 2px solid var(--r-focus);
  outline-offset: -2px;
}

.slots__cell.is-out {
  color: var(--r-text-tertiary);
  cursor: default;
}

.slots__day {
  color: var(--r-text-secondary);
}

.slots__time {
  display: flex;
  align-items: baseline;
  gap: 4px;
  min-width: 0;
  white-space: nowrap;
}

.slots__time .mk-fig {
  font-size: var(--r-text-lg);
}

.slots__note {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.slots__foot {
  margin-top: auto;
}

/* A wide strip (3x1): details, the cells and the button side by side. */
@container (min-width: 460px) {
  .slots__grid--row {
    display: grid;
    grid-template-columns: minmax(0, 0.8fr) minmax(0, 2fr);
    grid-template-rows: 1fr auto;
    column-gap: 16px;
    row-gap: 8px;
  }
  .slots__grid--row .slots__info {
    grid-row: 1 / 3;
  }
  .slots__grid--row .slots__cells {
    align-self: start;
  }
  .slots__grid--row .slots__info .mk-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>
