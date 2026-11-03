<script setup lang="ts">
import { computed } from 'vue'
import { Check, X } from 'lucide-vue-next'
import type { StepItem } from '../types'

/** Progress through a sequence: wizard steps, a pipeline, a launch sequence. Indexed 01, 02, 03. */
const props = withDefaults(
  defineProps<{
    items: StepItem[]
    /** Index of the current step (0-based). Steps before it are complete. */
    current?: number
    orientation?: 'horizontal' | 'vertical'
    size?: 'sm' | 'md'
  }>(),
  { current: 0, orientation: 'horizontal', size: 'md' },
)

type Status = NonNullable<StepItem['status']>

const STATUS_TEXT: Record<Status, string> = {
  complete: 'Complete',
  current: 'Current step',
  upcoming: 'Not started',
  error: 'Error',
}

const steps = computed(() =>
  props.items.map((item, index) => {
    const status: Status =
      item.status ?? (index < props.current ? 'complete' : index === props.current ? 'current' : 'upcoming')
    return { item, index, status, number: String(index + 1).padStart(2, '0') }
  }),
)
</script>

<template>
  <ol class="r-steps" :class="[`r-steps--${orientation}`, `r-steps--${size}`]" role="list">
    <li
      v-for="step in steps"
      :key="`${step.index}-${step.item.label}`"
      class="r-steps__item"
      :class="`is-${step.status}`"
      :aria-current="step.status === 'current' ? 'step' : undefined"
    >
      <span class="r-steps__marker" aria-hidden="true">
        <Check v-if="step.status === 'complete'" class="r-steps__icon" />
        <X v-else-if="step.status === 'error'" class="r-steps__icon" />
        <template v-else>{{ step.number }}</template>
      </span>
      <span class="r-steps__text">
        <span class="r-steps__label">
          <span class="r-sr-only">Step {{ step.number }}: </span>{{ step.item.label }}<span class="r-sr-only">, {{ STATUS_TEXT[step.status] }}</span>
        </span>
        <span
          v-if="step.item.description"
          class="r-steps__description"
          :class="{ 'r-sr-only': orientation === 'horizontal' }"
        >
          {{ step.item.description }}
        </span>
      </span>
      <span class="r-steps__connector" aria-hidden="true" />
    </li>
  </ol>
</template>

<style>
.r-steps {
  --r-steps-marker: 24px;
  --r-steps-gap: 10px;
  display: flex;
  min-width: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

.r-steps--sm {
  --r-steps-marker: 20px;
  --r-steps-gap: 8px;
}

.r-steps__item {
  position: relative;
  display: flex;
  min-width: 0;
}

/* ── Marker: a square with the running number ──────────────────────────── */
.r-steps__marker {
  display: inline-grid;
  flex: none;
  place-items: center;
  width: var(--r-steps-marker);
  height: var(--r-steps-marker);
  border: 1px solid var(--r-border-strong);
  border-radius: var(--r-radius-mark);
  background: var(--r-bg-surface);
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-medium);
  font-variant-numeric: tabular-nums;
  line-height: 1;
  letter-spacing: 0.02em;
  transition:
    background-color var(--r-duration-base) var(--r-ease-out),
    border-color var(--r-duration-base) var(--r-ease-out),
    color var(--r-duration-base) var(--r-ease-out);
}
.r-steps--sm .r-steps__marker {
  font-size: var(--r-text-3xs);
}

.r-steps__icon {
  width: 14px;
  height: 14px;
  stroke-width: 2;
}
.r-steps--sm .r-steps__icon {
  width: 12px;
  height: 12px;
}

.r-steps__item.is-complete .r-steps__marker {
  border-color: var(--r-ink);
  background: var(--r-ink);
  color: var(--r-on-ink);
}

.r-steps__item.is-current .r-steps__marker {
  border-color: var(--r-brand);
  color: var(--r-brand-text);
  font-weight: var(--r-weight-semibold);
}

.r-steps__item.is-error .r-steps__marker {
  border-color: var(--r-danger);
  background: var(--r-danger);
  color: var(--r-on-danger);
}

/* ── Text ──────────────────────────────────────────────────────────────── */
.r-steps__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

/* An 18px line, padded so the first line sits on the marker's centre and a wrapped label
   stays tight. */
.r-steps__label {
  padding-top: calc((var(--r-steps-marker) - 18px) / 2);
  color: var(--r-text);
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
  line-height: 18px;
}
.r-steps--sm .r-steps__label {
  font-size: var(--r-text-xs);
}

.r-steps__item.is-upcoming .r-steps__label {
  color: var(--r-text-secondary);
}
.r-steps__item.is-error .r-steps__label {
  color: var(--r-danger-text);
}

.r-steps__description {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  line-height: 18px;
}

/* ── Connector: a 1px rule, ink once the step before it is done ────────── */
.r-steps__connector {
  flex: 1 1 auto;
  background: var(--r-border-strong);
}
.r-steps__item.is-complete .r-steps__connector {
  background: var(--r-ink);
}
.r-steps__item:last-child .r-steps__connector {
  display: none;
}

/* Horizontal: [01] Label ──── [02] Label ──── [03] Label */
.r-steps--horizontal {
  flex-direction: row;
  align-items: flex-start;
}
/* Items take the width of their label; the rules between them take what is left. */
.r-steps--horizontal .r-steps__item {
  flex: 1 1 auto;
  align-items: flex-start;
  gap: var(--r-steps-gap);
}
.r-steps--horizontal .r-steps__item:last-child {
  flex: 0 1 auto;
}
/* Labels wrap rather than truncate when the row is tight: a step name is never cut off. */
.r-steps--horizontal .r-steps__text {
  flex: 0 1 auto;
  min-width: auto;
}
.r-steps--horizontal .r-steps__connector {
  flex: 1 1 16px;
  min-width: 16px;
  height: 1px;
  margin: calc(var(--r-steps-marker) / 2) var(--r-steps-gap) 0 0;
}

/* Phones: a horizontal row keeps only the current step's label on screen. The others stay in
   the page for screen readers. */
@media (max-width: 560px) {
  .r-steps--horizontal .r-steps__item {
    gap: 6px;
  }
  .r-steps--horizontal .r-steps__item:not(.is-current) .r-steps__text {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  .r-steps--horizontal .r-steps__connector {
    flex-basis: 8px;
    min-width: 8px;
    margin-right: 6px;
  }
}

/* Vertical: markers in a column on a 1px rail, descriptions under the labels. */
.r-steps--vertical {
  flex-direction: column;
}
.r-steps--vertical .r-steps__item {
  gap: 12px;
  padding-bottom: 20px;
}
.r-steps--vertical .r-steps__item:last-child {
  padding-bottom: 0;
}
.r-steps--vertical .r-steps__connector {
  position: absolute;
  top: calc(var(--r-steps-marker) + 4px);
  bottom: 4px;
  left: calc(var(--r-steps-marker) / 2 - 0.5px);
  width: 1px;
}
</style>
