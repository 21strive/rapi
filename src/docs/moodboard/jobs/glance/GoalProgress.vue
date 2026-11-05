<script setup lang="ts">
/**
 * Progress against a goal, a quota or a budget: the figure, the bar, and a pace mark that says
 * where a steady run would be today, so "are we going to make it?" reads at once. The keys flip
 * the figure between what is done and what is left.
 */
import { computed, ref } from 'vue'
import { RSegmented, RStatus } from '@/design-system'
import { idr, num, rp } from '../../kit'

const props = withDefaults(
  defineProps<{
    label: string
    done: number
    target: number
    format?: 'rp' | 'idr' | 'num'
    /** Unit after the figure for `num`: "t", "GB", "days". */
    unit?: string
    decimals?: number
    /** Where a steady pace puts `done` today. */
    pace?: number
    /** Spending against a budget: ahead of pace is bad. */
    invert?: boolean
    /** "by 31 Mar 2027". */
    due?: string
    note?: string
    /** Words for the two figures: done and left. */
    words?: [string, string]
    /** Open on what is left. */
    startLeft?: boolean
    /** The goal split into parts, each with its own small bar. */
    parts?: { label: string; done: number; target: number }[]
  }>(),
  { format: 'num', decimals: 0, invert: false, words: () => ['Done', 'Left'], startLeft: false, parts: () => [] },
)

const side = ref<'done' | 'left'>(props.startLeft ? 'left' : 'done')
const left = computed(() => Math.max(0, props.target - props.done))
const share = computed(() => Math.min(1, props.done / props.target))
const paceAt = computed(() => (props.pace == null ? null : Math.min(1, props.pace / props.target)))

const money = (v: number) =>
  props.format === 'rp' ? rp(v) : props.format === 'idr' ? idr(v) : num(v, props.decimals)
const figure = computed(() => money(side.value === 'done' ? props.done : left.value))
/* A figure with its unit, when the unit is a word: "12 days", "455 t". */
const withUnit = (v: number) => (props.format === 'num' && props.unit ? `${money(v)} ${props.unit}` : money(v))

const state = computed(() => {
  if (props.pace == null) return null
  const ratio = props.done / Math.max(1e-9, props.pace)
  if (props.invert) {
    return ratio > 1.03
      ? { tone: 'warning' as const, word: 'Over pace' }
      : { tone: 'success' as const, word: 'Within pace' }
  }
  if (ratio >= 1.03) return { tone: 'success' as const, word: 'Ahead' }
  if (ratio >= 0.97) return { tone: 'success' as const, word: 'On pace' }
  return { tone: 'warning' as const, word: 'Behind' }
})

const options = computed(() => [
  { label: props.words[0], value: 'done' },
  { label: props.words[1], value: 'left' },
])
</script>

<template>
  <div class="mk goal">
    <div class="mk-row mk-between">
      <span class="r-label mk-truncate">{{ label }}</span>
      <RStatus v-if="state" class="keep" size="sm" :tone="state.tone" :label="state.word" />
    </div>
    <div class="goal__read" aria-live="polite">
      <p class="goal__figure">
        <span class="mk-fig">{{ figure }}</span>
        <span v-if="format === 'num' && unit" class="mk-unit">{{ unit }}</span>
      </p>
      <p class="goal__of">
        {{ side === 'done' ? words[0] : words[1] }} · of {{ withUnit(target) }}
      </p>
      <p v-if="due || note" class="goal__sub">
        <template v-if="due">{{ due }}</template><template v-if="due && note"> · </template><template v-if="note">{{ note }}</template>
      </p>
    </div>
    <div class="goal__bar" role="img" :aria-label="`${num(share * 100)}% of the goal`">
      <span class="goal__fill" :style="{ width: `${share * 100}%` }" />
      <span v-if="paceAt != null" class="goal__pace" :class="{ 'is-late': paceAt > 0.8 }" :style="{ left: `${paceAt * 100}%` }">
        <span class="goal__pace-label">Pace</span>
      </span>
    </div>
    <ul v-if="parts.length" class="goal__parts">
      <li v-for="p in parts" :key="p.label">
        <span class="goal__part-label mk-truncate">{{ p.label }}</span>
        <span class="goal__part-bar" aria-hidden="true">
          <span :style="{ width: `${Math.min(100, (p.done / p.target) * 100)}%` }" />
        </span>
        <span class="goal__part-value">
          {{ withUnit(side === 'done' ? p.done : Math.max(0, p.target - p.done)) }}
        </span>
      </li>
    </ul>
    <div class="goal__foot mk-end">
      <span class="goal__note mk-truncate">
        {{ num(share * 100) }}%<template v-if="due"> · {{ due }}</template><template v-if="note"> · {{ note }}</template>
      </span>
      <RSegmented v-model="side" :options="options" size="sm" :label="`${label}, figure`" />
    </div>
  </div>
</template>

<style scoped>
.goal {
  container-type: inline-size;
  gap: 8px;
}

.goal__read {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.goal__figure {
  display: flex;
  align-items: baseline;
  gap: 4px;
  min-width: 0;
}

.goal__figure .mk-fig {
  overflow: hidden;
  font-size: var(--r-text-2xl);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.goal__of {
  overflow: hidden;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.goal__sub {
  display: none;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

.goal__bar {
  position: relative;
  height: 10px;
  margin-top: 12px;
  background: var(--r-chart-track);
}

.goal__fill {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  background: var(--r-chart-1);
}

/* Pace: a dashed rule through the bar, labelled above it. */
.goal__pace {
  position: absolute;
  top: -12px;
  bottom: -4px;
  width: 0;
  border-left: 1px dashed var(--r-chart-ink);
}

.goal__pace-label {
  position: absolute;
  top: -3px;
  left: 4px;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
  line-height: 1;
  text-transform: uppercase;
  white-space: nowrap;
}

.goal__parts {
  display: grid;
  margin-top: 6px;
  border-top: 1px solid var(--r-border-subtle);
}

.goal__parts li {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr) 64px;
  align-items: center;
  gap: 10px;
  padding: 5px 0;
  border-bottom: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-xs);
}

.goal__part-label {
  color: var(--r-text-secondary);
}

.goal__part-bar {
  height: 6px;
  background: var(--r-chart-track);
}

.goal__part-bar span {
  display: block;
  height: 100%;
  background: var(--r-chart-1);
}

.goal__part-value {
  font-variant-numeric: tabular-nums;
  text-align: right;
  white-space: nowrap;
}

.goal__pace.is-late .goal__pace-label {
  right: 4px;
  left: auto;
}

.goal__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 6px 12px;
  min-width: 0;
}

.goal__note {
  flex: 1 1 0;
  min-width: 0;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

/* One module wide: the keys take the full width, the note steps aside. */
@container (max-width: 240px) {
  .goal {
    gap: 6px;
  }

  .goal__foot {
    flex-direction: column;
    align-items: stretch;
  }

  .goal__note {
    display: none;
  }

  .goal__sub {
    display: block;
  }
}

/* The status word stays whole; the label beside it truncates instead. */
.keep {
  flex: none;
}
</style>
