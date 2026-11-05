<script setup lang="ts">
/**
 * A bank of identical things (cameras, pumps, sensors) as a ruled grid of lamps. The odd one out
 * is visible from across the room; pressing a cell, or arrowing to it, says what is wrong with it.
 * The tile opens on the first cell that needs a look.
 */
import { computed } from 'vue'
import { RStatus } from '@/design-system'
import { lampOf, toneOf, useRoving, type Cell, type Level } from './shared'

const props = withDefaults(
  defineProps<{
    label: string
    cells: Cell[]
    cols: number
    /** Words for each level, in mono caps on screen. */
    words?: Partial<Record<Level, string>>
    /** Print the id in each cell; off for small cells that only hold a lamp. */
    ids?: boolean
  }>(),
  { words: () => ({}), ids: true },
)

const WORDS: Record<Level, string> = { good: 'OK', warning: 'Warning', serious: 'Serious', critical: 'Down', off: 'Off' }
const wordOf = (l: Level) => props.words[l] ?? WORDS[l]

const first = Math.max(0, props.cells.findIndex((c) => c.level !== 'good'))
const roving = useRoving({ count: () => props.cells.length, cols: () => props.cols, initial: first })
const cell = computed(() => props.cells[roving.active.value] ?? props.cells[0])

const ORDER: Level[] = ['critical', 'serious', 'warning', 'off', 'good']
const counts = computed(() =>
  ORDER.map((l) => ({ level: l, n: props.cells.filter((c) => c.level === l).length })).filter((c) => c.n > 0),
)
</script>

<template>
  <div class="mk matrix">
    <div class="matrix__head">
      <span class="r-label mk-truncate">{{ label }}</span>
      <span class="matrix__counts">
        <RStatus v-for="c in counts" :key="c.level" size="sm" :tone="toneOf(c.level)" :label="`${c.n} ${wordOf(c.level)}`" />
      </span>
    </div>
    <div
      class="matrix__grid mk-grow"
      :class="{ 'is-bare': !ids }"
      :style="{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }"
      role="radiogroup"
      :aria-label="label"
      @keydown="roving.onKeydown"
    >
      <button
        v-for="(c, i) in cells"
        :key="c.id"
        :ref="roving.bind(i)"
        type="button"
        role="radio"
        class="matrix__cell mk-reset"
        :class="{ 'is-on': i === roving.active.value }"
        :aria-checked="i === roving.active.value"
        :aria-label="`${c.id}, ${wordOf(c.level)}`"
        :tabindex="i === roving.active.value ? 0 : -1"
        @click="roving.go(i)"
      >
        <span class="matrix__lamp" :style="{ background: lampOf(c.level) }" aria-hidden="true" />
        <span v-if="ids" class="matrix__id" aria-hidden="true">{{ c.id }}</span>
      </button>
    </div>
    <p class="matrix__detail" aria-live="polite">
      <span class="matrix__detail-id">{{ cell.id }}</span>
      <RStatus class="keep" size="sm" :tone="toneOf(cell.level)" :label="wordOf(cell.level)" />
      <span class="matrix__note mk-truncate">{{ cell.note }}</span>
    </p>
  </div>
</template>

<style scoped>
.matrix {
  container-type: inline-size;
}

.matrix__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 4px 12px;
  min-width: 0;
}

.matrix__head > .r-label {
  flex: 1 1 auto;
  max-width: 100%;
}

.matrix__counts {
  display: flex;
  flex: none;
  gap: 10px;
}

@container (max-width: 300px) {
  .matrix__head {
    flex-direction: column;
    align-items: flex-start;
  }

  .matrix__detail {
    flex-wrap: wrap;
    row-gap: 2px;
  }

  .matrix__note {
    flex-basis: 100%;
  }
}

.matrix__grid {
  display: grid;
  grid-auto-rows: minmax(0, 1fr);
  border-top: 1px solid var(--r-border-subtle);
  border-left: 1px solid var(--r-border-subtle);
}

.matrix__cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  gap: 4px;
  min-width: 0;
  min-height: 0;
  padding: 6px;
  border-right: 1px solid var(--r-border-subtle);
  border-bottom: 1px solid var(--r-border-subtle);
  cursor: pointer;
  transition: background-color var(--r-duration-fast) var(--r-ease-out);
}

.matrix__grid.is-bare .matrix__cell {
  align-items: center;
  justify-content: center;
  padding: 0;
}

.matrix__cell:hover {
  background: var(--r-bg-hover);
}

.matrix__cell.is-on {
  background: var(--r-bg-selected);
  box-shadow: inset 0 0 0 2px var(--r-brand);
}

.matrix__cell:focus-visible {
  outline-offset: -2px;
}

.matrix__lamp {
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: var(--r-radius-round);
}

.matrix__id {
  max-width: 100%;
  overflow: hidden;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
  line-height: 1;
  text-overflow: clip;
  white-space: nowrap;
}

.matrix__cell.is-on .matrix__id {
  color: var(--r-text);
}

.matrix__detail {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  min-height: 16px;
  font-size: var(--r-text-xs);
}

.matrix__detail-id {
  flex: none;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
}

.matrix__note {
  color: var(--r-text-tertiary);
}

/* The status word stays whole; the label beside it truncates instead. */
.keep {
  flex: none;
}
</style>
