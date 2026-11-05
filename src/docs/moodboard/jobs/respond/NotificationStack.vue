<script setup lang="ts">
/**
 * A short stack of what came in, newest first. Opening a row marks it read; the cross (or Delete
 * on a focused row) dismisses it, and the last dismissal can be undone for a few seconds. When the
 * stack is empty it says so, plainly.
 */
import { computed, ref, type Component } from 'vue'
import {
  AtSign,
  BellRing,
  CalendarClock,
  CircleCheck,
  DoorOpen,
  FileClock,
  GitPullRequest,
  Newspaper,
  Package,
  ShieldAlert,
  Shirt,
  TriangleAlert,
  X,
  OctagonX,
} from 'lucide-vue-next'
import { RButton } from '@/design-system'
import { useCountdown, useFocusKeeper } from './shared'

interface Note {
  id: string
  icon: keyof typeof ICONS
  /** Colours the icon; the title carries the word. */
  tone?: 'neutral' | 'warning' | 'danger' | 'success'
  title: string
  /** Mono meta: "14:02 · #design-crit". */
  meta: string
  unread?: boolean
}

const ICONS = {
  mention: AtSign,
  review: GitPullRequest,
  calendar: CalendarClock,
  door: DoorOpen,
  smoke: ShieldAlert,
  package: Package,
  wash: Shirt,
  failed: OctagonX,
  cert: FileClock,
  check: CircleCheck,
  wire: Newspaper,
  bell: BellRing,
  warning: TriangleAlert,
} satisfies Record<string, Component>

const props = withDefaults(
  defineProps<{
    /** Mono caps above the stack: "Inbox". */
    title?: string
    items: Note[]
    /** Seconds the undo stays. */
    undoFor?: number
  }>(),
  { title: 'Notifications', undoFor: 6 },
)

const list = ref<Note[]>(props.items.map((n) => ({ ...n })))
const removed = ref<{ notes: Note[]; at: number[] } | null>(null)
const undoClock = useCountdown(props.undoFor, { onDone: () => (removed.value = null) })
const undoLeft = undoClock.left
const { bind, keep } = useFocusKeeper()

const unread = computed(() => list.value.filter((n) => n.unread).length)

function open(note: Note) {
  note.unread = false
}

function dismiss(note: Note) {
  const index = list.value.indexOf(note)
  if (index < 0) return
  const next = list.value[index + 1]?.id ?? list.value[index - 1]?.id
  keep(next ? `[data-note="${next}"]` : '[data-focus="undo"]', true)
  list.value.splice(index, 1)
  removed.value = { notes: [note], at: [index] }
  undoClock.start()
}

function clearAll() {
  keep('[data-focus="undo"]', true)
  removed.value = { notes: list.value, at: list.value.map((_, i) => i) }
  list.value = []
  undoClock.start()
}

function undo() {
  const last = removed.value
  if (!last) return
  keep(`[data-note="${last.notes[0].id}"]`, true)
  last.notes.forEach((note, i) => list.value.splice(Math.min(last.at[i], list.value.length), 0, note))
  removed.value = null
  undoClock.stop()
}

function onKey(event: KeyboardEvent, note: Note) {
  if (event.key !== 'Delete' && event.key !== 'Backspace') return
  event.preventDefault()
  dismiss(note)
}

const undoText = computed(() => {
  const r = removed.value
  if (!r) return ''
  return r.notes.length === 1 ? `Dismissed “${r.notes[0].title}”` : `Cleared ${r.notes.length}`
})
</script>

<template>
  <div :ref="bind" class="mk stack">
    <div class="mk-row mk-between stack__head">
      <span class="r-eyebrow">{{ title }}</span>
      <span class="mk-row stack__meta">
        <span class="r-label">{{ unread ? `${unread} new` : `${list.length} read` }}</span>
        <RButton v-if="list.length" size="xs" variant="ghost" @click="clearAll">Clear all</RButton>
      </span>
    </div>

    <TransitionGroup v-if="list.length" tag="ul" name="stack-row" class="stack__list">
      <li v-for="note in list" :key="note.id" class="stack__item" :class="{ 'is-unread': note.unread }">
        <button
          type="button"
          class="stack__open mk-reset"
          :data-note="note.id"
          :aria-label="`${note.title}, ${note.meta}${note.unread ? ', unread' : ''}. Delete dismisses it`"
          @click="open(note)"
          @keydown="onKey($event, note)"
        >
          <component :is="ICONS[note.icon]" :size="14" class="stack__icon" :class="`is-${note.tone ?? 'neutral'}`" aria-hidden="true" />
          <span class="stack__text">
            <span class="stack__title">{{ note.title }}</span>
            <span class="stack__time">{{ note.meta }}</span>
          </span>
          <span v-if="note.unread" class="stack__lamp" aria-hidden="true" />
        </button>
        <button type="button" class="stack__x mk-reset" :aria-label="`Dismiss ${note.title}`" @click="dismiss(note)">
          <X :size="14" aria-hidden="true" />
        </button>
      </li>
    </TransitionGroup>
    <p v-else class="stack__empty mk-grow">Nothing new. You are up to date.</p>

    <p class="r-sr-only" aria-live="polite">{{ undoText }}</p>
    <div v-if="removed" class="stack__undo" data-theme="dark">
      <span class="mk-truncate">{{ undoText }}</span>
      <RButton size="xs" variant="outline" data-focus="undo" @click="undo">Undo · {{ undoLeft }} s</RButton>
    </div>
  </div>
</template>

<style scoped>
.stack {
  container-type: inline-size;
  gap: 6px;
}

.stack__meta {
  gap: 4px;
  margin-right: -8px;
}

.stack__list {
  position: relative;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  border-top: 1px solid var(--r-border-subtle);
}

.stack__item {
  display: flex;
  align-items: stretch;
  width: 100%;
  border-bottom: 1px solid var(--r-border-subtle);
  background: var(--r-bg-surface);
}

.stack__open {
  display: flex;
  flex: 1 1 auto;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
  padding: 8px 4px 8px 0;
  cursor: pointer;
}

.stack__open:hover .stack__title {
  color: var(--r-text);
}

.stack__icon {
  margin-top: 2px;
  color: var(--r-text-tertiary);
}
.stack__icon.is-warning {
  color: var(--r-warning-text);
}
.stack__icon.is-danger {
  color: var(--r-danger-text);
}
.stack__icon.is-success {
  color: var(--r-success-text);
}

.stack__text {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.stack__title {
  display: -webkit-box;
  overflow: hidden;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.35;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.is-unread .stack__title {
  color: var(--r-text);
  font-weight: var(--r-weight-medium);
}

.stack__time {
  overflow: hidden;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Unread: a steady signal lamp, as on the library's icon buttons. Not blinking: it is new, not live. */
.stack__lamp {
  flex: none;
  width: 6px;
  height: 6px;
  margin-top: 6px;
  border-radius: var(--r-radius-round);
  background: var(--r-signal);
}

.stack__x {
  display: grid;
  flex: none;
  place-items: center;
  width: 24px;
  color: var(--r-text-tertiary);
  cursor: pointer;
}
.stack__x:hover {
  background: var(--r-bg-hover);
  color: var(--r-text);
}

.stack__empty {
  display: grid;
  place-items: center;
  padding: 12px;
  border-top: 1px solid var(--r-border-subtle);
  color: var(--r-text-tertiary);
  font-size: var(--r-text-sm);
  text-align: center;
}

.stack__undo {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 5px 5px 5px 10px;
  border: 1px solid var(--r-border-strong);
  background: var(--r-bg-raised);
  color: var(--r-text);
  font-size: var(--r-text-xs);
}

/* A narrow column drops the icons and lets titles run to three lines. */
@container (max-width: 200px) {
  .stack__icon {
    display: none;
  }

  .stack__open {
    gap: 6px;
  }

  .stack__title {
    -webkit-line-clamp: 3;
  }
}

.stack-row-leave-active {
  position: absolute;
  transition: opacity var(--r-duration-fast) var(--r-ease-out);
}

.stack-row-leave-to {
  opacity: 0;
}

.stack-row-move {
  transition: transform var(--r-duration-base) var(--r-ease-out);
}
</style>
