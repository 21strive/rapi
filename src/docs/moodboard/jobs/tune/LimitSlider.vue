<script setup lang="ts">
/**
 * A limit and what it costs: the library's RSlider with labelled marks, and under it the
 * consequence the value has right now (the travel time, the share of orders, the approver it
 * needs), recomputed on every step. Drag the thumb or use the arrow keys; double-click puts it back.
 */
import { computed, ref } from 'vue'
import { RBadge, RSlider } from '@/design-system'
import type { SliderMark } from '@/design-system'

interface Figure {
  label: string
  value: string
  unit?: string
}
interface Say {
  text: string
  /** A mono caps tag at the right, e.g. "Second approver". */
  badge?: string
  tone?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger'
}

const props = withDefaults(
  defineProps<{
    label: string
    min: number
    max: number
    step: number
    value: number
    unit?: string
    marks?: SliderMark[]
    format?: (v: number) => string
    figure: (v: number) => Figure
    say: (v: number) => Say
  }>(),
  { marks: () => [] },
)

const value = ref(props.value)
const fig = computed(() => props.figure(value.value))
const said = computed(() => props.say(value.value))
</script>

<template>
  <div class="mk limit" @dblclick="value = props.value">
    <RSlider
      v-model="value"
      :label="label"
      :min="min"
      :max="max"
      :step="step"
      :marks="marks.length ? marks : undefined"
      :unit="unit"
      :format="format"
    />
    <div class="limit__out mk-end">
      <div class="limit__figure">
        <span class="r-label">{{ fig.label }}</span>
        <p>
          <span class="mk-fig">{{ fig.value }}</span>
          <span v-if="fig.unit" class="mk-unit">{{ fig.unit }}</span>
        </p>
      </div>
      <div class="limit__say" aria-live="polite">
        <RBadge v-if="said.badge" :tone="said.tone ?? 'neutral'" size="sm" dot>{{ said.badge }}</RBadge>
        <p class="limit__text">{{ said.text }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.limit {
  gap: 6px;
}

.limit__out {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: end;
  gap: 16px;
  padding-top: 8px;
  border-top: 1px solid var(--r-border-subtle);
}

.limit__figure {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.limit__figure p {
  display: flex;
  align-items: baseline;
  gap: 4px;
  white-space: nowrap;
}
.limit__figure .mk-fig {
  font-size: var(--r-text-xl);
}

.limit__say {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  min-width: 0;
  text-align: right;
}

.limit__text {
  max-width: 100%;
  overflow: hidden;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
