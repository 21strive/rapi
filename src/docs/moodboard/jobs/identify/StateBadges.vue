<script setup lang="ts">
/**
 * The state of things as mono caps tags: PAID, IN REVIEW, P1. Each tag carries a word, never a
 * colour alone. Press a tag to move it along its workflow, or use the arrow keys on it to step
 * forward and back.
 */
import { computed, ref } from 'vue'
import { RBadge, type Tone } from '@/design-system'

interface State {
  id: string
  label: string
  tone: Tone
  variant?: 'soft' | 'solid' | 'outline'
  /** What this state means for the person: "Respond in 15 min". */
  note?: string
}

interface Item {
  id: string
  title: string
  /** Quiet second line or column: a customer, a route. */
  meta?: string
  /** Right-aligned figure for the table layout. */
  amount?: string
  /** Date or time column for the table layout. */
  due?: string
  state: string
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    /** Mono caps at the right of the eyebrow. */
    subject?: string
    /** The workflow, in order. */
    states: State[]
    items: Item[]
    /** Column heads for the table layout. */
    heads?: [string, string, string, string]
    /** `list` 2x2 or 2x1 · `single` 1x1 · `table` 3x2 · `tall` 1x3. */
    layout?: 'list' | 'single' | 'table' | 'tall'
  }>(),
  { layout: 'list' },
)

const current = ref<Record<string, string>>(Object.fromEntries(props.items.map((i) => [i.id, i.state])))
const last = ref<string | null>(null)
const stateOf = (item: Item) => props.states.find((s) => s.id === current.value[item.id]) ?? props.states[0]

function move(item: Item, by: number) {
  const n = props.states.length
  const k = props.states.findIndex((s) => s.id === current.value[item.id])
  current.value = { ...current.value, [item.id]: props.states[(k + by + n) % n].id }
  last.value = item.id
}

function onKeydown(event: KeyboardEvent, item: Item) {
  if (event.key === 'ArrowRight' || event.key === 'ArrowUp') move(item, 1)
  else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') move(item, -1)
  else return
  event.preventDefault()
}

const summary = computed(() =>
  props.states
    .map((s) => ({ s, n: props.items.filter((i) => current.value[i.id] === s.id).length }))
    .filter((x) => x.n)
    .map((x) => `${x.n} ${x.s.label.toLowerCase()}`)
    .join(' · '),
)
const said = computed(() => {
  const item = props.items.find((i) => i.id === last.value)
  if (!item) return summary.value
  const s = stateOf(item)
  return `${item.id} is now ${s.label.toLowerCase()}${s.note ? `. ${s.note}` : ''}`
})
const single = computed(() => props.items[0])
</script>

<template>
  <!-- 1x1: one item, one tag -->
  <div v-if="layout === 'single'" class="mk sb sb--single">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ single.id }}</span>
      <span v-if="subject" class="r-label">{{ subject }}</span>
    </div>
    <p class="sb__title sb__title--single">{{ single.title }}</p>
    <button
      type="button"
      class="sb__tag mk-reset"
      :aria-label="`${single.id} ${eyebrow.toLowerCase()} ${stateOf(single).label}. Press to change`"
      @click="move(single, 1)"
      @keydown="onKeydown($event, single)"
    >
      <RBadge :tone="stateOf(single).tone" :variant="stateOf(single).variant ?? 'soft'">{{ stateOf(single).label }}</RBadge>
    </button>
    <p class="sb__note mk-end" aria-live="polite">{{ stateOf(single).note }}</p>
  </div>

  <!-- 3x2: a small table with a status column -->
  <div v-else-if="layout === 'table'" class="mk sb sb--table">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span v-if="subject" class="r-label">{{ subject }}</span>
    </div>
    <div class="sb__grid" role="table" :aria-label="eyebrow">
      <div class="sb__head" role="row">
        <span v-for="(h, k) in heads" :key="h" role="columnheader" :class="{ 'is-num': k === 2, 'sb__col-due': k === 3 }">{{ h }}</span>
        <span role="columnheader">Status</span>
      </div>
      <div v-for="item in items" :key="item.id" class="sb__row" :class="{ 'is-last': last === item.id }" role="row">
        <span role="cell" class="r-mono sb__id">{{ item.id }}</span>
        <span role="cell" class="mk-truncate">{{ item.meta }}</span>
        <span role="cell" class="is-num r-mono">{{ item.amount }}</span>
        <span role="cell" class="r-mono sb__col-due">{{ item.due }}</span>
        <span role="cell">
          <button
            type="button"
            class="sb__tag mk-reset"
            :aria-label="`${item.id} ${stateOf(item).label}. Press to change`"
            @click="move(item, 1)"
            @keydown="onKeydown($event, item)"
          >
            <RBadge :tone="stateOf(item).tone" :variant="stateOf(item).variant ?? 'soft'" size="sm">{{ stateOf(item).label }}</RBadge>
          </button>
        </span>
      </div>
    </div>
    <p class="sb__note mk-end" aria-live="polite">{{ said }}</p>
  </div>

  <!-- 2x1, 2x2 and 1x3: rows with a tag each -->
  <div v-else class="mk sb" :class="`sb--${layout}`">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span v-if="subject" class="r-label mk-truncate">{{ subject }}</span>
    </div>
    <ul class="sb__list">
      <li v-for="item in items" :key="item.id" class="sb__item" :class="{ 'is-last': last === item.id }">
        <span class="sb__text">
          <span class="sb__title mk-truncate">{{ item.title }}</span>
          <span v-if="item.meta" class="sb__meta mk-truncate">{{ item.meta }}</span>
        </span>
        <button
          type="button"
          class="sb__tag mk-reset"
          :aria-label="`${item.title}: ${stateOf(item).label}. Press to change`"
          @click="move(item, 1)"
          @keydown="onKeydown($event, item)"
        >
          <RBadge :tone="stateOf(item).tone" :variant="stateOf(item).variant ?? 'soft'" size="sm">{{ stateOf(item).label }}</RBadge>
        </button>
      </li>
    </ul>
    <p class="sb__note mk-end" aria-live="polite">{{ said }}</p>
  </div>
</template>

<style scoped>
.sb {
  gap: 6px;
  container-type: inline-size;
}

.sb__tag {
  display: inline-flex;
  flex: none;
  padding: 2px;
  margin: -2px;
  cursor: pointer;
}

.sb__tag:hover :deep(.r-badge) {
  outline: 1px solid var(--r-border-strong);
  outline-offset: 1px;
}

.sb__title {
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
}

.sb__title--single {
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  line-height: 1.3;
}

.sb--single .sb__tag {
  align-self: flex-start;
  margin-top: 4px;
}

.sb--single .sb__tag :deep(.r-badge) {
  height: 28px;
  padding: 0 10px;
  font-size: var(--r-text-sm);
}

.sb__note {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

.sb__list {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-top: 1px solid var(--r-border-subtle);
}

.sb__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 38px;
  padding: 4px 2px 4px 6px;
  border-bottom: 1px solid var(--r-border-subtle);
  border-left: 2px solid transparent;
}

.sb--tall .sb__item {
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 4px;
  min-height: 60px;
}

.sb--tall .sb__text {
  width: 100%;
}

.sb__item.is-last {
  border-left-color: var(--r-brand);
  background: var(--r-bg-selected);
}

.sb__text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.sb__meta {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

/* Table */
.sb__grid {
  display: flex;
  flex-direction: column;
  min-width: 0;
  font-size: var(--r-text-xs);
}

.sb__head,
.sb__row {
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr) minmax(0, 0.9fr) 48px 100px;
  align-items: center;
  gap: 10px;
}

.sb__head {
  padding-bottom: 6px;
  border-bottom: 1px solid var(--r-border);
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.sb__row {
  min-height: 36px;
  border-bottom: 1px solid var(--r-border-subtle);
  border-left: 2px solid transparent;
}

.sb__head {
  border-left: 2px solid transparent;
}

.sb__row.is-last {
  border-left-color: var(--r-brand);
  background: var(--r-bg-selected);
}

.sb__id {
  padding-left: 6px;
  color: var(--r-text-secondary);
}

.is-num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

@container (max-width: 440px) {
  .sb__head,
  .sb__row {
    grid-template-columns: 96px minmax(0, 1fr) 90px;
  }
  .sb__head > :nth-child(2),
  .sb__row > :nth-child(2),
  .sb__col-due {
    display: none;
  }
}
</style>
