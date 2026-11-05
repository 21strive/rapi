<script setup lang="ts">
/**
 * Who is here: a stack of faces that reads in one look, and names on demand. Point at a face or
 * move along the stack with the arrow keys to read who it is; the last key pages through the
 * rest. The list layout picks one person and shows what they are doing there.
 */
import { computed, ref } from 'vue'
import { RotateCcw } from 'lucide-vue-next'
import { RAvatar, RStatus, type AvatarStatus } from '@/design-system'

interface Member {
  name: string
  /** What they are doing here: "Slide 4", "Incident commander". */
  note?: string
  presence?: AvatarStatus
  /** Joined, for the list layout: "13:41 WIB". */
  since?: string
  /** Where they are, for the list layout. */
  place?: string
  /** Speaking or typing right now: the one live lamp. */
  live?: string
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    title: string
    people: Member[]
    /** Faces shown per page. */
    max?: number
    /** Quiet summary when nobody is pointed at: "2 typing". */
    summary?: string
    /** `row` 2x1 · `mini` 1x1 · `list` 3x2. */
    layout?: 'row' | 'mini' | 'list'
  }>(),
  { max: 4, layout: 'row' },
)

/* ── Stack: paging and reading ─────────────────────────────────────────────────────── */
const page = ref(0)
const pages = computed(() => Math.ceil(props.people.length / props.max))
const start = computed(() => page.value * props.max)
const shown = computed(() => props.people.slice(start.value, start.value + props.max))
const after = computed(() => props.people.length - (start.value + shown.value.length))
const active = ref<number | null>(null)
const keys = ref<(HTMLButtonElement | null)[]>([])
const focusAt = ref(0)

function nextPage() {
  page.value = (page.value + 1) % pages.value
  active.value = null
}

function onKeydown(event: KeyboardEvent) {
  const count = shown.value.length + (pages.value > 1 ? 1 : 0)
  let i = focusAt.value
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') i = (i + 1) % count
  else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') i = (i - 1 + count) % count
  else if (event.key === 'Home') i = 0
  else if (event.key === 'End') i = count - 1
  else return
  event.preventDefault()
  focusAt.value = i
  active.value = i < shown.value.length ? i : null
  keys.value[i]?.focus()
}

function onFocus(i: number) {
  focusAt.value = i
  active.value = i < shown.value.length ? i : null
}

function onLeave(event: FocusEvent | PointerEvent) {
  const next = (event as FocusEvent).relatedTarget as Node | null
  if (event.type === 'focusout' && next && (event.currentTarget as HTMLElement).contains(next)) return
  active.value = null
}

const reading = computed(() => {
  if (active.value == null) return null
  return shown.value[active.value] ?? null
})
const idle = computed(() => {
  const n = props.people.length
  const range = pages.value > 1 ? `${start.value + 1}–${start.value + shown.value.length} of ${n}` : `${n} people`
  return props.summary ? `${range} · ${props.summary}` : range
})

/* ── List: one person picked ───────────────────────────────────────────────────────── */
const picked = ref(0)
const rows = ref<(HTMLButtonElement | null)[]>([])
function onListKey(event: KeyboardEvent) {
  const n = props.people.length
  let i = picked.value
  if (event.key === 'ArrowDown' || event.key === 'ArrowRight') i = (i + 1) % n
  else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') i = (i - 1 + n) % n
  else if (event.key === 'Home') i = 0
  else if (event.key === 'End') i = n - 1
  else return
  event.preventDefault()
  picked.value = i
  rows.value[i]?.focus()
}
const person = computed(() => props.people[picked.value])
const tones = { online: 'success', away: 'warning', busy: 'danger', offline: 'neutral' } as const
const words = { online: 'On the call', away: 'Stepped away', busy: 'Do not disturb', offline: 'Left' } as const
</script>

<template>
  <div v-if="layout !== 'list'" class="mk stack" :class="`stack--${layout}`">
    <div class="stack__head">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <p class="stack__title mk-truncate">{{ title }}</p>
    </div>
    <p v-if="layout === 'mini'" class="stack__count">
      <span class="mk-fig">{{ people.length }}</span>
      <span class="mk-unit">people</span>
    </p>
    <div
      class="stack__faces"
      role="toolbar"
      :aria-label="`${title}: ${people.length} people`"
      @keydown="onKeydown"
      @focusout="onLeave"
      @pointerleave="onLeave"
    >
      <button
        v-for="(p, i) in shown"
        :key="p.name"
        :ref="(el) => (keys[i] = el as HTMLButtonElement | null)"
        type="button"
        class="stack__face mk-reset"
        :class="{ 'is-active': active === i }"
        :tabindex="focusAt === i ? 0 : -1"
        :aria-label="p.note ? `${p.name}, ${p.note}` : p.name"
        @pointerenter="active = i"
        @focus="onFocus(i)"
        @click="active = i"
      >
        <RAvatar :name="p.name" :size="layout === 'mini' ? 'sm' : 'md'" :status="p.presence" ring decorative />
      </button>
      <button
        v-if="pages > 1"
        :ref="(el) => (keys[shown.length] = el as HTMLButtonElement | null)"
        type="button"
        class="stack__more mk-reset"
        :class="`stack__more--${layout}`"
        :tabindex="focusAt === shown.length ? 0 : -1"
        :aria-label="after > 0 ? `Show the next ${Math.min(after, max)} of ${after} more` : 'Back to the first people'"
        @focus="onFocus(shown.length)"
        @click="nextPage"
      >
        <template v-if="after > 0">+{{ after }}</template>
        <RotateCcw v-else :size="14" aria-hidden="true" />
      </button>
    </div>
    <p class="stack__reader mk-truncate" aria-live="polite">
      <template v-if="reading">
        <span class="stack__name">{{ reading.name }}</span>
        <span v-if="reading.note" class="stack__note"> · {{ reading.note }}</span>
      </template>
      <span v-else class="stack__idle">{{ idle }}</span>
    </p>
  </div>

  <div v-else class="mk stack stack--list">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span class="r-label">{{ people.length }} on the bridge</span>
    </div>
    <p class="stack__title stack__title--lg mk-truncate">{{ title }}</p>
    <div class="stack__split mk-grow">
      <div class="stack__list" role="radiogroup" :aria-label="`${title}: people`" @keydown="onListKey">
        <button
          v-for="(p, i) in people"
          :key="p.name"
          :ref="(el) => (rows[i] = el as HTMLButtonElement | null)"
          type="button"
          role="radio"
          class="stack__row mk-reset"
          :class="{ 'is-picked': picked === i }"
          :aria-checked="picked === i"
          :tabindex="picked === i ? 0 : -1"
          @click="picked = i"
        >
          <RAvatar :name="p.name" size="xs" decorative />
          <span class="stack__row-name mk-truncate">{{ p.name }}</span>
          <span class="stack__row-note mk-truncate">{{ p.note }}</span>
        </button>
      </div>
      <div v-if="person" class="stack__detail" aria-live="polite">
        <RAvatar :name="person.name" size="xl" :status="person.presence" decorative />
        <p class="stack__detail-name">{{ person.name }}</p>
        <p class="stack__detail-role">{{ person.note }}</p>
        <dl class="stack__facts">
          <div v-if="person.since"><dt class="r-label">Joined</dt><dd class="r-mono">{{ person.since }}</dd></div>
          <div v-if="person.place"><dt class="r-label">From</dt><dd>{{ person.place }}</dd></div>
        </dl>
        <RStatus v-if="person.live" class="mk-end" tone="signal" :label="person.live" pulse size="sm" />
        <RStatus
          v-else-if="person.presence"
          class="mk-end"
          :tone="tones[person.presence]"
          :label="words[person.presence]"
          size="sm"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.stack__head {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.stack__title {
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.3;
}

.stack__title--lg {
  margin-top: -4px;
  font-size: var(--r-text-lg);
}

.stack__count {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.stack__count .mk-fig {
  font-size: var(--r-text-2xl);
}

.stack__faces {
  display: flex;
  align-items: center;
  margin-top: auto;
  padding-left: 2px;
}

.stack__face {
  position: relative;
  display: inline-flex;
  margin-right: 4px;
  cursor: pointer;
  transition: transform var(--r-duration-fast) var(--r-ease-out);
}

.stack--mini .stack__face {
  margin-right: 3px;
}

.stack__face.is-active {
  z-index: 2;
  transform: translateY(-3px);
}

.stack__face:focus-visible {
  z-index: 3;
}

.stack__more {
  position: relative;
  display: inline-grid;
  place-items: center;
  min-width: 32px;
  height: 32px;
  margin-left: 4px;
  padding: 0 6px;
  border: 1px solid var(--r-border-strong);
  background: var(--r-bg-surface);
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
  cursor: pointer;
}

.stack__more--mini {
  min-width: 24px;
  height: 24px;
  margin-left: 2px;
  font-size: var(--r-text-3xs);
}

.stack__more:hover {
  background: var(--r-bg-hover);
  color: var(--r-text);
}

.stack__reader {
  min-height: 18px;
  font-size: var(--r-text-xs);
  line-height: 18px;
}

.stack__name {
  font-weight: var(--r-weight-semibold);
}

.stack__note,
.stack__idle {
  color: var(--r-text-tertiary);
}

/* List: the bridge roster and the one person picked */
.stack--list {
  gap: 6px;
  container-type: inline-size;
}

.stack__split {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
  border-top: 1px solid var(--r-border);
}

.stack__list {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: auto;
}

.stack__row {
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr) minmax(0, 1.1fr);
  align-items: center;
  gap: 8px;
  min-height: 27px;
  padding: 0 8px 0 6px;
  border-bottom: 1px solid var(--r-border-subtle);
  border-left: 2px solid transparent;
  font-size: var(--r-text-xs);
  cursor: pointer;
}

.stack__row:hover {
  background: var(--r-bg-hover);
}

.stack__row.is-picked {
  border-left-color: var(--r-brand);
  background: var(--r-bg-selected);
}

.stack__row-name {
  font-weight: var(--r-weight-medium);
}

.stack__row-note {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.stack__detail {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding: 12px 0 0 14px;
  border-left: 1px solid var(--r-border);
}

.stack__detail-name {
  margin-top: 6px;
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
}

.stack__detail-role {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

.stack__facts {
  display: grid;
  gap: 2px;
  margin-top: 6px;
  font-size: var(--r-text-xs);
}

.stack__facts div {
  display: flex;
  gap: 8px;
}

.stack__facts dt {
  width: 44px;
  flex: none;
}

.stack__facts dd {
  margin: 0;
  min-width: 0;
}

@container (max-width: 400px) {
  .stack__split {
    grid-template-columns: minmax(0, 1fr);
  }
  .stack__detail {
    display: none;
  }
}
</style>
