<script setup lang="ts">
/**
 * A score on a scale of squares: one tap, and the word for it shows under the scale. The words at
 * the ends say what the scale means, so nobody has to ask whether 1 is good or bad. Arrow keys and
 * the number keys choose too.
 */
import { computed, ref, useId } from 'vue'
import { timeZ } from '../../kit'

const props = withDefaults(
  defineProps<{
    eyebrow: string
    question: string
    min?: number
    max?: number
    low: string
    high: string
    /** A word per value, from min to max: ["Poor", "Fair", …]. */
    words: string[]
    value?: number
    /** `upto` lights every square up to the score (stars); `one` lights only the score (pain). */
    fill?: 'upto' | 'one'
    /** A ladder from the top instead of a row (tall tiles). */
    vertical?: boolean
    /** After a score: "Logged for bed 3-07". */
    after?: string
  }>(),
  { min: 1, max: 5, fill: 'upto' },
)

const uid = useId()
const score = ref<number | null>(props.value ?? null)
const hover = ref<number | null>(null)
const at = ref<Date | null>(props.value != null ? new Date() : null)
const buttons: (HTMLButtonElement | null)[] = []

const values = computed(() => Array.from({ length: props.max - props.min + 1 }, (_, i) => props.min + i))
const shown = computed(() => hover.value ?? score.value)
const word = (v: number) => props.words[v - props.min] ?? String(v)

function set(v: number, focus = false) {
  score.value = v
  at.value = new Date()
  if (focus) buttons[v - props.min]?.focus()
}

function lit(v: number) {
  const s = shown.value
  if (s == null) return false
  return props.fill === 'upto' ? v <= s : v === s
}

function onKeydown(event: KeyboardEvent) {
  const cur = score.value ?? props.min - 1
  const back = props.vertical ? 'ArrowDown' : 'ArrowLeft'
  const fwd = props.vertical ? 'ArrowUp' : 'ArrowRight'
  let next: number | null = null
  if (event.key === fwd || (!props.vertical && event.key === 'ArrowUp') || (props.vertical && event.key === 'ArrowRight')) next = Math.min(props.max, cur + 1)
  else if (event.key === back || (!props.vertical && event.key === 'ArrowDown') || (props.vertical && event.key === 'ArrowLeft')) next = Math.max(props.min, cur <= props.min - 1 ? props.min : cur - 1)
  else if (event.key === 'Home') next = props.min
  else if (event.key === 'End') next = props.max
  else if (/^\d$/.test(event.key) && Number(event.key) >= props.min && Number(event.key) <= props.max) next = Number(event.key)
  if (next == null) return
  event.preventDefault()
  set(next, true)
}

const tabValue = computed(() => score.value ?? props.min)
const ordered = computed(() => (props.vertical ? [...values.value].reverse() : values.value))
</script>

<template>
  <div class="mk en-root rate" :class="{ 'rate--v': vertical }">
    <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
    <p :id="`${uid}-q`" class="rate__q">{{ question }}</p>

    <div
      class="rate__scale"
      :style="{ '--n': values.length }"
      role="radiogroup"
      :aria-labelledby="`${uid}-q`"
      @keydown="onKeydown"
      @pointerleave="hover = null"
    >
      <button
        v-for="v in ordered"
        :key="v"
        :ref="(el) => (buttons[v - min] = el as HTMLButtonElement | null)"
        type="button"
        role="radio"
        class="rate__sq"
        :class="{ 'is-lit': lit(v), 'is-picked': v === score }"
        :aria-checked="v === score ? 'true' : 'false'"
        :aria-label="`${v}, ${word(v)}`"
        :tabindex="v === tabValue ? 0 : -1"
        @click="set(v)"
        @pointerenter="hover = v"
      >
        <span class="rate__n">{{ v }}</span>
        <span v-if="vertical" class="rate__w">{{ word(v) }}</span>
      </button>
    </div>

    <div v-if="!vertical" class="rate__ends" aria-hidden="true">
      <span>{{ low }}</span>
      <span>{{ high }}</span>
    </div>

    <p class="rate__out mk-end" aria-live="polite">
      <template v-if="shown != null">
        <span class="rate__fig">{{ shown }}</span>
        <span class="rate__word mk-truncate">{{ word(shown) }}</span>
        <span v-if="score != null && hover == null && at" class="rate__when">{{ after ? `${after} · ` : '' }}{{ timeZ(at) }}</span>
      </template>
      <span v-else class="rate__none mk-truncate">{{ min }} is {{ low.toLowerCase() }}, {{ max }} is {{ high.toLowerCase() }}</span>
    </p>
  </div>
</template>

<style scoped>
.rate {
  gap: 6px;
}

.rate__q {
  display: -webkit-box;
  overflow: hidden;
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
  line-height: 1.35;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.rate__scale {
  display: grid;
  grid-template-columns: repeat(var(--n), minmax(0, 1fr));
  gap: 3px;
  margin-top: 2px;
}

.rate__sq {
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  max-height: 40px;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 1px solid var(--r-border-control);
  border-radius: var(--r-radius-mark);
  background: var(--r-bg-surface);
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  transition:
    background-color var(--r-duration-instant) var(--r-ease-out),
    color var(--r-duration-instant) var(--r-ease-out);
}

.rate__sq:hover {
  border-color: var(--r-text-secondary);
}

.rate__sq:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: 1px;
}

.rate__sq.is-lit {
  border-color: var(--r-brand);
  background: var(--r-brand-soft);
  color: var(--r-brand-text);
}

.rate__sq.is-picked,
.rate:not(:has(.rate__scale:hover)) .rate__sq.is-lit {
  border-color: var(--r-brand-fill);
  background: var(--r-brand-fill);
  color: var(--r-on-brand);
}

.rate__ends {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-2xs);
  line-height: 1.3;
}

.rate__out {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
  min-height: 22px;
}

.rate__fig {
  flex: none;
  font-size: var(--r-text-xl);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.rate__word {
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
}

.rate__when {
  flex: none;
  margin-left: auto;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
}

.rate__none {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

/* The ladder: highest at the top, each rung a square and its word. */
.rate--v .rate__scale {
  flex: 1 1 auto;
  grid-template-columns: 1fr;
  grid-template-rows: repeat(var(--n), minmax(0, 1fr));
  min-height: 0;
}

.rate--v .rate__sq {
  display: flex;
  justify-content: flex-start;
  gap: 10px;
  aspect-ratio: auto;
  max-height: none;
  padding: 0 10px;
}

.rate--v .rate__n {
  width: 18px;
  text-align: right;
}

.rate--v .rate__w {
  overflow: hidden;
  font-family: var(--r-font-sans);
  font-size: var(--r-text-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
