<script setup lang="ts">
/**
 * "Explain this" on a small chart. The chart shows the bump; asking why is faster than opening
 * three reports, so the answer sits under the chart, with what it was read from. Days with
 * nothing to explain say so plainly instead of inventing a cause.
 */
import { computed, ref } from 'vue'
import { RButton } from '@/design-system'
import { num, rp, usePointerDrag } from '../../kit'
import Writing from './Writing.vue'
import { useReply } from './shared'

interface Note {
  title: string
  says: string
  /** What the answer was read from, in mono. */
  source: string
}

const props = withDefaults(
  defineProps<{
    label: string
    /** After the figure: "refunds", "MW", "ms". */
    unit: string
    values: number[]
    /** One per column: "3 Nov", "14:00". */
    labels: string[]
    /** Explanations, keyed by column index. */
    notes: Record<string, Note>
    format?: 'num' | 'rp'
    decimals?: number
    /** The column selected (and explained) when the tile opens. */
    initial?: number
    agent?: string
    /** A strip: the chart on the left, the answer on the right. */
    compact?: boolean
  }>(),
  { format: 'num', decimals: 0, agent: 'Simpul' },
)

const n = props.values.length
const sel = ref(props.initial ?? n - 1)
const answered = ref<number | null>(props.initial ?? null)
const { busy, reply } = useReply(700)

const max = Math.max(...props.values) * 1.08
const avg = props.values.reduce((s, v) => s + v, 0) / n
const height = (v: number) => `${(v / max) * 100}%`
const fmt = (v: number) => (props.format === 'rp' ? rp(v) : num(v, props.decimals))
const valueText = computed(() => `${props.labels[sel.value]}: ${fmt(props.values[sel.value])} ${props.unit}`)

function select(i: number) {
  const next = Math.max(0, Math.min(n - 1, i))
  if (next === sel.value) return
  sel.value = next
  answered.value = null
}

function explain() {
  const i = sel.value
  reply(() => (answered.value = i))
}

const plot = ref<HTMLElement | null>(null)
function fromX(clientX: number) {
  const box = plot.value?.getBoundingClientRect()
  if (!box) return
  select(Math.floor(((clientX - box.left) / box.width) * n))
}
const drag = usePointerDrag({
  onStart: (e) => fromX(e.clientX),
  onMove: (_, e) => fromX(e.clientX),
})

function onKeydown(event: KeyboardEvent) {
  const moves: Record<string, number> = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }
  if (event.key in moves) select(sel.value + moves[event.key])
  else if (event.key === 'Home') select(0)
  else if (event.key === 'End') select(n - 1)
  else if (event.key === 'Enter' || event.key === ' ') explain()
  else return
  event.preventDefault()
}

const note = computed(() => (answered.value == null ? null : props.notes[String(answered.value)] ?? null))
const plain = computed(() => {
  if (answered.value == null) return ''
  const v = props.values[answered.value]
  const diff = ((v - avg) / avg) * 100
  const how =
    Math.abs(diff) < 1.5 ? 'level with' : `${num(Math.abs(diff), 0)}% ${diff > 0 ? 'above' : 'below'}`
  return `${fmt(v)} ${props.unit} on ${props.labels[answered.value]}, ${how} the ${n}-day average of ${fmt(avg)}. Nothing unusual was logged that day.`
})
const ticks = computed(() => [0, Math.floor((n - 1) / 2), n - 1])
</script>

<template>
  <div class="mk explain" :class="{ 'explain--compact': compact }">
    <div class="explain__head">
      <span class="r-label mk-truncate">{{ label }}</span>
      <span class="explain__read">
        <span class="mk-fig">{{ fmt(values[sel]) }}</span>
        <span class="mk-unit">{{ unit }} · {{ labels[sel] }}</span>
      </span>
    </div>

    <div class="explain__chart">
      <div
        ref="plot"
        class="explain__plot"
        role="slider"
        tabindex="0"
        :aria-label="`${label}. Arrow keys pick a column, Enter explains it`"
        :aria-valuemin="0"
        :aria-valuemax="n - 1"
        :aria-valuenow="sel"
        :aria-valuetext="valueText"
        @pointerdown="drag.onPointerdown"
        @keydown="onKeydown"
      >
        <span
          v-for="(v, i) in values"
          :key="i"
          class="explain__col"
          :class="{ 'is-sel': i === sel, 'is-note': notes[String(i)] }"
          :style="{ height: height(v) }"
        />
        <span class="explain__avg" :style="{ bottom: height(avg) }" aria-hidden="true">
          <span>AVG {{ fmt(avg) }}</span>
        </span>
      </div>
      <div class="explain__ticks" aria-hidden="true">
        <span v-for="t in ticks" :key="t">{{ labels[t] }}</span>
      </div>
    </div>

    <div class="explain__answer" aria-live="polite">
      <Writing v-if="busy" label="Looking into it" />
      <template v-else-if="answered != null">
        <p class="explain__meta">{{ agent }} on {{ labels[answered] }}</p>
        <template v-if="note">
          <p class="explain__title">{{ note.title }}</p>
          <p class="explain__says">{{ note.says }}</p>
          <p class="explain__source mk-truncate">{{ note.source }}</p>
        </template>
        <p v-else class="explain__says">{{ plain }}</p>
      </template>
      <div v-else class="explain__ask">
        <RButton size="xs" variant="outline" @click="explain">Explain {{ labels[sel] }}</RButton>
        <span v-if="notes[String(sel)]" class="explain__flag">Something happened that day</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.explain {
  gap: 8px;
}

.explain__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.explain__read {
  display: flex;
  flex: none;
  align-items: baseline;
  gap: 4px;
}

.explain__read .mk-fig {
  font-size: var(--r-text-lg);
}

.explain__chart {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 4px;
  min-height: 56px;
}

.explain__plot {
  position: relative;
  display: flex;
  flex: 1 1 auto;
  align-items: flex-end;
  gap: 2px;
  min-height: 0;
  border-bottom: 1px solid var(--r-chart-axis);
  cursor: crosshair;
  touch-action: none;
  outline: none;
}

.explain__plot:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: 4px;
}

.explain__col {
  position: relative;
  flex: 1 1 0;
  min-width: 0;
  background: var(--r-chart-context);
  transition: background-color var(--r-duration-fast) var(--r-ease-out);
}

.explain__col.is-note::before {
  content: '';
  position: absolute;
  top: -6px;
  right: 0;
  left: 0;
  height: 2px;
  background: var(--r-text-tertiary);
}

.explain__col.is-sel {
  background: var(--r-brand);
}

.explain__avg {
  position: absolute;
  right: 0;
  left: 0;
  height: 0;
  border-top: 1px dashed var(--r-text-tertiary);
  pointer-events: none;
}

.explain__avg span {
  position: absolute;
  right: 0;
  bottom: 2px;
  padding: 0 2px;
  background: var(--r-bg-surface);
  color: var(--r-chart-label);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  line-height: 1.2;
}

.explain__ticks {
  display: flex;
  justify-content: space-between;
  color: var(--r-chart-label);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
}

.explain__answer {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: 3px;
  min-height: 72px;
  padding-top: 8px;
  border-top: 1px solid var(--r-border-subtle);
}

.explain__meta {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.explain__title {
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-semibold);
  line-height: 1.3;
}

.explain__says {
  display: -webkit-box;
  overflow: hidden;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.explain__source {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
}

.explain__ask {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

.explain__flag {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-2xs);
}

/* A strip: the chart and the answer side by side. */
.explain--compact {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  grid-template-rows: auto minmax(0, 1fr);
  column-gap: 14px;
  row-gap: 6px;
}

.explain--compact .explain__head {
  grid-column: 1 / -1;
}

.explain--compact .explain__chart {
  min-height: 0;
}

.explain--compact .explain__answer {
  min-height: 0;
  padding-top: 0;
  overflow: hidden;
  border-top: 0;
}

.explain--compact .explain__title {
  font-size: var(--r-text-xs);
}

.explain--compact .explain__says {
  -webkit-line-clamp: 3;
}

.explain--compact .explain__meta {
  display: none;
}
</style>
