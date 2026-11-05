<script setup lang="ts">
/**
 * What the model did on your behalf, as a ledger: each action with its time and its scope, each one
 * reversible on its own. A reverted line stays on the record, struck through, with the time it was
 * reverted and a way to put it back.
 */
import { computed, ref } from 'vue'
import { RButton } from '@/design-system'
import { focusAfter, stamp } from './shared'

interface Action {
  at: string
  text: string
  /** What it touched, mono: "Finance/November", "payments-core". */
  scope?: string
  /** The button's word, when "Revert" is not the right one: "Delete drafts". */
  revertLabel?: string
  /** Some actions cannot be taken back, like a note already filed. */
  final?: boolean
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    actions: Action[]
    /** A plain sentence under the list: what the model did not do. */
    note?: string
    /** list 2x2/3x2 · strip 3x1. */
    layout?: 'list' | 'strip'
  }>(),
  { layout: 'list' },
)

const reverted = ref<Record<number, string>>({})
const root = ref<HTMLElement | null>(null)
/* Lines reverted together by "Revert all", so the same button can put them back. */
const batch = ref<number[]>([])

function revert(i: number) {
  reverted.value = { ...reverted.value, [i]: stamp('WIB', false) }
  focusAfter(root.value, `[data-row="${i}"] .ledger__redo`)
}

function restore(i: number) {
  const next = { ...reverted.value }
  delete next[i]
  reverted.value = next
  batch.value = batch.value.filter((b) => b !== i)
  focusAfter(root.value, `[data-row="${i}"] .r-button`)
}

const open = computed(() => props.actions.map((a, i) => (!a.final && !reverted.value[i] ? i : -1)).filter((i) => i >= 0))
const count = computed(() => Object.keys(reverted.value).length)

function revertAll() {
  const next = { ...reverted.value }
  if (batch.value.length) {
    for (const i of batch.value) delete next[i]
    batch.value = []
  } else {
    const at = stamp('WIB', false)
    batch.value = [...open.value]
    for (const i of batch.value) next[i] = at
  }
  reverted.value = next
}
</script>

<template>
  <div ref="root" class="mk ledger" :class="`ledger--${layout}`">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span class="ledger__count">{{ actions.length }} actions<template v-if="count"> · {{ count }} reverted</template></span>
    </div>

    <ol class="ledger__list mk-grow">
      <li v-for="(a, i) in actions" :key="i" class="ledger__item" :data-row="i" :class="{ 'is-reverted': reverted[i] }">
        <span class="ledger__at">{{ a.at }}</span>
        <span class="ledger__body">
          <span class="ledger__text">{{ a.text }}</span>
          <span v-if="a.scope" class="ledger__scope mk-truncate">{{ a.scope }}</span>
        </span>
        <span class="ledger__act">
          <template v-if="reverted[i]">
            <span class="ledger__word">Reverted {{ reverted[i] }}</span>
            <button type="button" class="ledger__redo mk-reset" :aria-label="`Put back: ${a.text}`" @click="restore(i)">Put back</button>
          </template>
          <span v-else-if="a.final" class="ledger__word ledger__word--final">On record</span>
          <RButton v-else size="xs" variant="outline" :aria-label="`${a.revertLabel ?? 'Revert'}: ${a.text}`" @click="revert(i)">
            {{ a.revertLabel ?? 'Revert' }}
          </RButton>
        </span>
      </li>
    </ol>

    <div v-if="layout === 'list'" class="ledger__foot">
      <span class="ledger__note mk-truncate">{{ note }}</span>
      <RButton size="xs" variant="ghost" :disabled="!batch.length && !open.length" @click="revertAll">
        {{ batch.length ? 'Put all back' : 'Revert all' }}
      </RButton>
    </div>
  </div>
</template>

<style scoped>
.ledger {
  gap: 8px;
}

.ledger__count {
  flex: none;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
}

.ledger__list {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-top: 1px solid var(--r-border-subtle);
}

.ledger__item {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  min-height: 38px;
  padding: 4px 0;
  border-bottom: 1px solid var(--r-border-subtle);
}

.ledger__at {
  align-self: start;
  padding-top: 2px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
}

.ledger__body {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.ledger__text {
  display: -webkit-box;
  overflow: hidden;
  font-size: var(--r-text-sm);
  line-height: var(--r-leading-snug);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.ledger__scope {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
}

.ledger__item.is-reverted .ledger__text {
  color: var(--r-text-tertiary);
  text-decoration: line-through;
}

.ledger__act {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.ledger__word {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
}

.ledger__word--final {
  color: var(--r-text-tertiary);
}

.ledger__redo {
  color: var(--r-brand-text);
  font-size: var(--r-text-xs);
  cursor: pointer;
}
.ledger__redo:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.ledger__foot {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.ledger__note {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

/* Strip: the actions stand side by side, each a ruled column. */
.ledger--strip .ledger__list {
  display: grid;
  grid-auto-columns: minmax(0, 1fr);
  grid-auto-flow: column;
  border-top: 0;
  border-left: 1px solid var(--r-border-subtle);
}
.ledger--strip .ledger__item {
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto minmax(0, 1fr) auto;
  align-items: start;
  gap: 4px;
  padding: 0 10px;
  border-right: 1px solid var(--r-border-subtle);
  border-bottom: 0;
}
.ledger--strip .ledger__act {
  align-items: flex-start;
}
.ledger--strip .ledger__text {
  -webkit-line-clamp: 3;
}
.ledger--strip .ledger__scope {
  display: none;
}
</style>
