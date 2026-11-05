<script setup lang="ts">
/**
 * Rank by hand. The model drafts an order; the person drags rows across the line that decides
 * what goes ahead, then submits. From the keyboard: Space picks a row up, the arrows move it,
 * Space puts it down and Escape puts it back.
 */
import { computed, nextTick, ref } from 'vue'
import { GripVertical } from 'lucide-vue-next'
import { RButton } from '@/design-system'
import { pad, usePointerDrag, type Zone } from '../../kit'
import DecisionStrip from './DecisionStrip.vue'
import { holdFocus, useDecision } from './shared'

const props = withDefaults(
  defineProps<{
    eyebrow: string
    title: string
    items: string[]
    /** How many go ahead, above the line. */
    top?: number
    /** On the line: "Funded above". */
    cut?: string
    note?: string
    action?: string
    done?: string
    zone?: Zone
  }>(),
  { top: 3, cut: 'Above the line goes ahead', note: undefined, action: 'Submit the ranking', done: 'Submitted', zone: 'WIB' },
)

const root = ref<HTMLElement | null>(null)
const order = ref([...props.items])
const said = ref('')
const { at, left, decided, decide, undo } = useDecision<true>(10)

function move(item: string, to: number) {
  const next = order.value.filter((x) => x !== item)
  next.splice(Math.max(0, Math.min(next.length, to)), 0, item)
  order.value = next
}

function announce(item: string) {
  const i = order.value.indexOf(item)
  said.value = `${item}, ${i + 1} of ${order.value.length}${i < props.top ? ', above the line' : ''}`
}

const rowEls = new Map<string, HTMLElement>()
const focusRow = (item: string | undefined) => item && nextTick(() => rowEls.get(item)?.focus())

/* Pointer: the row follows the pointer; a cobalt line shows where it lands; it moves on release. */
const dragged = ref<string | null>(null)
const dy = ref(0)
const landAt = ref(-1)
let mids: number[] = []
const { onPointerdown } = usePointerDrag({
  onStart: (event) => {
    const el = event.currentTarget as HTMLElement
    dragged.value = el.dataset.item ?? null
    mids = order.value
      .filter((x) => x !== dragged.value)
      .map((x) => {
        const r = rowEls.get(x)?.getBoundingClientRect()
        return r ? r.top + r.height / 2 : 0
      })
    landAt.value = order.value.indexOf(dragged.value ?? '')
    el.focus()
  },
  onMove: ({ totalY }, event) => {
    dy.value = totalY
    landAt.value = mids.filter((m) => m < event.clientY).length
  },
  onEnd: () => {
    const item = dragged.value
    if (item) {
      move(item, landAt.value)
      announce(item)
      focusRow(item)
    }
    dragged.value = null
    dy.value = 0
    landAt.value = -1
  },
})

/** The row the landing line is drawn above, or "end" for after the last. */
const landBefore = computed(() => {
  if (!dragged.value) return null
  const others = order.value.filter((x) => x !== dragged.value)
  const from = order.value.indexOf(dragged.value)
  if (landAt.value === from) return null
  return others[landAt.value] ?? 'end'
})

/* Keyboard. */
const held = ref<string | null>(null)
let heldFrom = 0
function onKeydown(event: KeyboardEvent, item: string) {
  if (decided.value) return
  const i = order.value.indexOf(item)
  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault()
    if (held.value) {
      held.value = null
      announce(item)
    } else {
      held.value = item
      heldFrom = i
      said.value = `${item} picked up, ${i + 1} of ${order.value.length}`
    }
  } else if (event.key === 'Escape' && held.value) {
    move(item, heldFrom)
    held.value = null
    said.value = `${item} put back`
    focusRow(item)
  } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    event.preventDefault()
    const step = event.key === 'ArrowUp' ? -1 : 1
    if (held.value) {
      move(item, i + step)
      announce(item)
      focusRow(item)
    } else focusRow(order.value[i + step])
  }
}

function submit() {
  const restore = holdFocus(root)
  held.value = null
  decide(true)
  restore('[data-focus="undo"]')
}

function revert() {
  const restore = holdFocus(root)
  undo()
  restore('[data-focus="submit"]')
}

function grab(event: PointerEvent) {
  if (!decided.value) onPointerdown(event)
}
</script>

<template>
  <div ref="root" class="mk rank">
    <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
    <p class="rank__title">{{ title }}</p>

    <ol class="rank__list" :aria-label="title">
      <template v-for="(item, i) in order" :key="item">
        <li
          :ref="(el) => (el ? rowEls.set(item, el as HTMLElement) : rowEls.delete(item))"
          class="rank__row"
          :class="{
            'is-top': i < top,
            'is-held': held === item,
            'is-dragged': dragged === item,
            'is-land': landBefore === item,
            'is-locked': decided,
          }"
          :style="dragged === item ? { transform: `translateY(${dy}px)` } : undefined"
          :data-item="item"
          tabindex="0"
          aria-roledescription="sortable row"
          :aria-label="`${i + 1}. ${item}`"
          @pointerdown="grab"
          @keydown="onKeydown($event, item)"
        >
          <span class="rank__index">{{ pad(i + 1) }}</span>
          <span class="rank__label mk-truncate">{{ item }}</span>
          <GripVertical v-if="!decided" class="rank__grip" :size="14" aria-hidden="true" />
        </li>
        <li v-if="i === top - 1" class="rank__cut r-label" aria-hidden="true">{{ cut }}</li>
      </template>
      <li v-if="landBefore === 'end'" class="rank__end" aria-hidden="true" />
    </ol>
    <p class="r-sr-only" aria-live="polite">{{ said }}</p>

    <p v-if="note && !decided" class="rank__note">{{ note }}</p>

    <div class="rank__foot mk-end">
      <DecisionStrip v-if="decided" :at="at" :left="left" :zone="zone" :label="done" @undo="revert" />
      <RButton v-else tone="brand" size="sm" block data-focus="submit" @click="submit">{{ action }}</RButton>
    </div>
  </div>
</template>

<style scoped>
.rank {
  gap: 8px;
}

.rank__title {
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.3;
}

.rank__list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* A row: running index, the item, a grip. Above the line in ink; below it, quieter. */
.rank__row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  height: 28px;
  padding: 0 6px 0 8px;
  border: 1px solid var(--r-border-subtle);
  background: var(--r-bg-surface);
  color: var(--r-text-secondary);
  cursor: grab;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.rank__row.is-top {
  border-color: var(--r-border);
  color: var(--r-text);
}

.rank__row.is-held,
.rank__row.is-dragged {
  z-index: 2;
  border-color: var(--r-brand);
  background: var(--r-bg-selected);
}

.rank__row.is-dragged {
  cursor: grabbing;
}

.rank__row.is-locked {
  cursor: default;
}

/* Where the dragged row will land: a 2px cobalt line above this row. */
.rank__row.is-land::before,
.rank__end::before {
  content: '';
  position: absolute;
  top: -3px;
  right: 0;
  left: 0;
  height: 2px;
  background: var(--r-brand);
}

.rank__end {
  position: relative;
  height: 0;
}

.rank__row:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: 1px;
}

.rank__index {
  flex: none;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
}

.rank__row.is-top .rank__index {
  color: var(--r-brand-text);
  font-weight: var(--r-weight-semibold);
}

.rank__label {
  flex: 1 1 auto;
  font-size: var(--r-text-sm);
}

.rank__grip {
  flex: none;
  color: var(--r-text-tertiary);
}

/* The line: a strong rule with its meaning in mono caps. */
.rank__cut {
  margin: 2px 0;
  padding-top: 4px;
  border-top: 1px solid var(--r-border-strong);
}

.rank__note {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}
</style>
