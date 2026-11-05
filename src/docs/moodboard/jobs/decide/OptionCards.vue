<script setup lang="ts">
/**
 * Two (or three) ways to do the same thing, side by side, with the numbers that tell them apart.
 * The model's pick is already selected and says why; the person can switch, and the one button
 * names exactly what it will do.
 */
import { computed, ref } from 'vue'
import { RBadge, RButton } from '@/design-system'
import type { Zone } from '../../kit'
import DecisionStrip from './DecisionStrip.vue'
import { holdFocus, useDecision } from './shared'

interface Option {
  id: string
  /** Mono caps: "Sea". */
  label: string
  /** The figure that separates them: "5 days". */
  figure: string
  lines: string[]
  /** The button while this one is selected: "Book sea freight". */
  action: string
  /** The outcome: "Sea booked". */
  done: string
  suggested?: boolean
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    title?: string
    options: Option[]
    /** Why the model suggests its pick, one line. */
    why?: string
    zone?: Zone
    compact?: boolean
  }>(),
  { title: undefined, why: undefined, zone: 'WIB' },
)

const root = ref<HTMLElement | null>(null)
const selected = ref(props.options.find((o) => o.suggested)?.id ?? props.options[0]?.id)
const current = computed(() => props.options.find((o) => o.id === selected.value) ?? props.options[0])
const { choice, at, left, decide, undo } = useDecision<string>(10)
const chosen = computed(() => props.options.find((o) => o.id === choice.value))

const optionEls: (HTMLElement | null)[] = []
function onKeydown(event: KeyboardEvent) {
  if (choice.value) return
  const i = props.options.findIndex((o) => o.id === selected.value)
  const n = props.options.length
  let to: number | null = null
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') to = (i + 1) % n
  else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') to = (i - 1 + n) % n
  else if (event.key === 'Home') to = 0
  else if (event.key === 'End') to = n - 1
  if (to === null) return
  event.preventDefault()
  selected.value = props.options[to].id
  optionEls[to]?.focus()
}

function select(id: string) {
  if (!choice.value) selected.value = id
}

function commit() {
  const restore = holdFocus(root)
  decide(current.value.id)
  restore('[data-focus="undo"]')
}

function revert() {
  const restore = holdFocus(root)
  undo()
  restore('[data-focus="commit"]')
}
</script>

<template>
  <div ref="root" class="mk opt" :class="{ 'opt--compact': compact }">
    <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
    <p v-if="title && !compact" class="opt__title">{{ title }}</p>

    <div
      class="opt__cards"
      role="radiogroup"
      :aria-label="title ?? eyebrow"
      :style="{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }"
      @keydown="onKeydown"
    >
      <div
        v-for="(option, i) in options"
        :key="option.id"
        :ref="(el) => (optionEls[i] = el as HTMLElement | null)"
        class="opt__card"
        :class="{ 'is-selected': option.id === selected, 'is-out': choice && choice !== option.id }"
        role="radio"
        :aria-checked="option.id === selected ? 'true' : 'false'"
        :aria-disabled="choice ? 'true' : undefined"
        :tabindex="option.id === selected ? 0 : -1"
        @click="select(option.id)"
      >
        <span class="opt__head">
          <span class="r-label opt__label">{{ option.label }}</span>
          <RBadge v-if="option.suggested && !compact" tone="brand" size="sm">Suggested</RBadge>
          <span class="opt__radio" aria-hidden="true" />
        </span>
        <span class="opt__figure mk-fig">{{ option.figure }}</span>
        <span v-for="line in compact ? option.lines.slice(0, 1) : option.lines" :key="line" class="opt__line mk-truncate">
          {{ line }}
        </span>
      </div>
    </div>

    <p v-if="why && !compact && !choice" class="opt__why">{{ why }}</p>

    <div class="opt__foot mk-end">
      <DecisionStrip
        v-if="choice"
        :at="at"
        :left="left"
        :zone="zone"
        :label="chosen?.done"
        :size="compact ? 'md' : 'lg'"
        @undo="revert"
      />
      <RButton v-else tone="brand" block :size="compact ? 'sm' : 'lg'" data-focus="commit" @click="commit">
        {{ current.action }}
      </RButton>
    </div>
  </div>
</template>

<style scoped>
.opt {
  gap: 8px;
}

.opt__title {
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.3;
}

.opt__cards {
  display: grid;
  border-top: 1px solid var(--r-border);
  border-left: 1px solid var(--r-border);
}

.opt__card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding: 10px 10px 10px;
  border-right: 1px solid var(--r-border);
  border-bottom: 1px solid var(--r-border);
  background: var(--r-bg-surface);
  cursor: pointer;
  transition: background-color var(--r-duration-fast) var(--r-ease-out);
}

.opt__card:hover:not(.is-selected) {
  background: var(--r-bg-hover);
}

/* The selected option: the selection colour and a 2px cobalt rule across its top edge. */
.opt__card.is-selected {
  background: var(--r-bg-selected);
}
.opt__card.is-selected::before {
  content: '';
  position: absolute;
  top: -1px;
  right: 0;
  left: 0;
  height: 2px;
  background: var(--r-brand);
}

.opt__card:focus-visible {
  z-index: 1;
  outline: 2px solid var(--r-focus);
  outline-offset: -2px;
}

.opt__card.is-out {
  color: var(--r-text-tertiary);
  cursor: default;
}

.opt__head {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.opt__label {
  flex: 1 1 auto;
  min-width: 0;
  color: var(--r-text-secondary);
}

.opt__radio {
  flex: none;
  width: 12px;
  height: 12px;
  border: 1px solid var(--r-border-control);
  border-radius: var(--r-radius-round);
  background: var(--r-bg-surface);
}
.is-selected .opt__radio {
  border: 4px solid var(--r-brand);
}

.opt__figure {
  margin-top: 2px;
  font-size: var(--r-text-2xl);
}

.opt__line {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
}

.opt__card.is-out .opt__line {
  color: var(--r-text-tertiary);
}

.opt__why {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

.opt--compact .opt__card {
  padding: 6px 8px 7px;
  gap: 2px;
}

.opt--compact .opt__figure {
  margin-top: 0;
  font-size: var(--r-text-lg);
}
</style>
