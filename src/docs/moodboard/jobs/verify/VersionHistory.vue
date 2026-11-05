<script setup lang="ts">
/**
 * The versions of one thing, newest first. A person walks the list with the arrow keys, reads what
 * each version changed, and restores one. Restoring never rewrites history: it adds a new version
 * on top that says where it came from, and the restore itself can be undone.
 */
import { computed, nextTick, ref } from 'vue'
import { ArrowRight, History } from 'lucide-vue-next'
import { RBadge, RButton } from '@/design-system'
import { arrowMove, stamp } from './shared'

interface Change {
  key: string
  before: string
  after: string
}

interface Version {
  id: string
  who: string
  when: string
  note: string
  /** "+12 −3" lines, words or keys. */
  delta?: string
  /** What this version changed against the one before it (split layout). */
  changes?: Change[]
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    versions: Version[]
    /** list 2x2 · split 3x2 (with what changed) · narrow 1x2. */
    layout?: 'list' | 'split' | 'narrow'
    rows?: number
  }>(),
  { layout: 'list', rows: 5 },
)

const list = ref<Version[]>(props.versions.map((v) => ({ ...v })))
const selected = ref(Math.min(1, list.value.length - 1))
const restored = ref<{ from: string; as: string; at: string } | null>(null)
const items: (HTMLElement | null)[] = []

const visible = computed(() => list.value.slice(0, props.rows))
const current = computed(() => visible.value[selected.value])

function nextId(id: string) {
  const n = Number(id.replace(/\D+/g, ''))
  return Number.isFinite(n) ? `v${n + 1}` : `${id}+1`
}

function select(i: number, focus = false) {
  selected.value = i
  if (focus) nextTick(() => items[i]?.focus())
}

function onKeydown(event: KeyboardEvent, i: number) {
  const next = arrowMove(event, i, visible.value.length, 'vertical')
  if (next === null) return
  event.preventDefault()
  select(next, true)
}

function restore() {
  const from = current.value
  if (!from || selected.value === 0) return
  const as = nextId(list.value[0].id)
  const at = stamp('WIB', false)
  list.value.unshift({
    id: as,
    who: 'You',
    when: at,
    note: `Restored from ${from.id}`,
    changes: from.changes,
  })
  restored.value = { from: from.id, as, at }
  selected.value = 0
}

function undoRestore() {
  if (!restored.value) return
  list.value.shift()
  selected.value = Math.max(0, list.value.findIndex((v) => v.id === restored.value?.from))
  restored.value = null
}
</script>

<template>
  <div class="mk versions" :class="`versions--${layout}`">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span class="versions__count"><History :size="12" aria-hidden="true" />{{ list.length }}</span>
    </div>

    <div class="versions__main mk-grow">
      <ul class="versions__list" role="listbox" :aria-label="`Versions of ${eyebrow}`">
        <li
          v-for="(v, i) in visible"
          :key="v.id"
          :ref="(el) => (items[i] = el as HTMLElement | null)"
          role="option"
          class="versions__row"
          :class="{ 'is-selected': i === selected }"
          :aria-selected="i === selected"
          :tabindex="i === selected ? 0 : -1"
          @click="select(i)"
          @keydown="onKeydown($event, i)"
        >
          <span class="versions__line">
            <span class="versions__id">{{ v.id }}</span>
            <span class="versions__note mk-truncate">{{ v.note }}</span>
            <RBadge v-if="i === 0" size="sm" variant="outline" class="versions__current">Current</RBadge>
          </span>
          <span class="versions__meta mk-truncate">
            {{ v.who }} · {{ v.when }}<template v-if="v.delta"> · {{ v.delta }}</template>
          </span>
        </li>
      </ul>

      <section v-if="layout === 'split'" class="versions__pane" aria-live="polite">
        <p class="r-label">{{ current?.id }} changed</p>
        <dl v-if="current?.changes?.length" class="versions__changes">
          <div v-for="c in current.changes" :key="c.key" class="versions__change">
            <dt class="mk-truncate">{{ c.key }}</dt>
            <dd>
              <span class="versions__before">{{ c.before }}</span>
              <ArrowRight :size="12" aria-hidden="true" />
              <span class="versions__after">{{ c.after }}</span>
            </dd>
          </div>
        </dl>
        <p v-else class="versions__empty">No field changes recorded.</p>
      </section>
    </div>

    <div class="versions__foot">
      <p v-if="restored" class="versions__done" aria-live="polite">
        Restored {{ restored.from }} as {{ restored.as }} · {{ restored.at }}
      </p>
      <div class="mk-row versions__actions">
        <RButton
          size="sm"
          :tone="restored ? 'neutral' : 'brand'"
          :variant="restored ? 'ghost' : 'solid'"
          :block="layout === 'narrow'"
          :disabled="!restored && selected === 0"
          @click="restored ? undoRestore() : restore()"
        >
          {{ restored ? 'Undo restore' : selected === 0 ? 'This is current' : `Restore ${current?.id}` }}
        </RButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.versions {
  gap: 8px;
  container-type: inline-size;
}

.versions__count {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 4px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
}

.versions__main {
  display: flex;
  gap: 12px;
  overflow: hidden;
}

.versions__list {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  min-width: 0;
  border-top: 1px solid var(--r-border-subtle);
}

.versions__row {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 5px 8px 5px 10px;
  position: relative;
  border-bottom: 1px solid var(--r-border-subtle);
  cursor: pointer;
  transition: background-color var(--r-duration-fast) var(--r-ease-out);
}

.versions__row:hover {
  background: var(--r-bg-hover);
}

.versions__row.is-selected {
  background: var(--r-bg-selected);
}

/* The selected row carries a 2px cobalt rule on its leading edge, as in a Rapi table. */
.versions__row.is-selected::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 2px;
  background: var(--r-brand);
}

.versions__row:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: -2px;
}

.versions__line {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: var(--r-text-sm);
}

.versions__id {
  flex: none;
  min-width: 26px;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
}

.versions__note {
  flex: 1 1 auto;
}

.versions__current {
  flex: none;
}

.versions__meta {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.versions__pane {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  padding-left: 12px;
  border-left: 1px solid var(--r-border-subtle);
}

.versions__changes {
  display: grid;
}

.versions__change {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 5px 0;
  border-bottom: 1px solid var(--r-border-subtle);
}

.versions__change dt {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
}

.versions__change dd {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
}

.versions__before {
  color: var(--r-text-tertiary);
  text-decoration: line-through;
}

.versions__after {
  font-weight: var(--r-weight-medium);
}

.versions__empty {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.versions__foot {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: 6px;
}

.versions__done {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
}

.versions__actions {
  justify-content: flex-end;
}

/* Narrow: one column, ids and times only on the first line. */
.versions--narrow .versions__line {
  font-size: var(--r-text-xs);
}
.versions--narrow .versions__current {
  display: none;
}
.versions--narrow .versions__row {
  padding: 4px 6px 4px 8px;
}
.versions--narrow .versions__actions {
  justify-content: stretch;
}
/* On a phone the split keeps the list and the restore; the change pane gives way. */
@container (max-width: 440px) {
  .versions__pane {
    display: none;
  }
}
</style>
