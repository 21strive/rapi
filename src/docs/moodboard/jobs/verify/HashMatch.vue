<script setup lang="ts">
/**
 * Two long strings compared the way people actually compare them: in groups. Compare runs the
 * check group by group; the arrow keys (or the pointer) walk a cursor across both rows at once and
 * the line under them reads the pair out. The verdict is a word, never only a colour.
 */
import { computed, ref } from 'vue'
import { RButton, RStatus } from '@/design-system'
import { arrowMove, stamp, useSequence } from './shared'

const props = withDefaults(
  defineProps<{
    eyebrow: string
    /** "SHA-256", "CRC-32", "Seal no.". */
    algo: string
    expected: string
    actual: string
    group?: number
    expectedLabel?: string
    actualLabel?: string
    /** What the verdict means here: { match: 'Safe to install', mismatch: 'Do not install' }. */
    consequence?: { match: string; mismatch: string }
    checkedAt?: string
    /** block 2x2 · line 3x1/2x1 · seal 1x1. */
    layout?: 'block' | 'line' | 'seal'
    /** Geist Pixel figures, for an instrument readout. */
    pixel?: boolean
  }>(),
  { group: 8, expectedLabel: 'Expected', actualLabel: 'Computed', layout: 'block', checkedAt: '' },
)

function chunk(text: string, size: number) {
  const out: string[] = []
  for (let i = 0; i < text.length; i += size) out.push(text.slice(i, i + size))
  return out
}

const exp = computed(() => chunk(props.expected, props.group))
const act = computed(() => chunk(props.actual, props.group))
const rows = computed(() => [
  { key: 'exp', label: props.expectedLabel, groups: exp.value },
  { key: 'act', label: props.actualLabel, groups: act.value },
])
const same = computed(() => exp.value.map((g, i) => g === act.value[i]))
const differs = computed(() => same.value.flatMap((ok, i) => (ok ? [] : [i + 1])))
const match = computed(() => differs.value.length === 0 && props.expected.length === props.actual.length)

const { step, running, run } = useSequence()
const checked = ref(props.checkedAt)
const cursor = ref<number | null>(null)

function compare() {
  if (running.value) return
  cursor.value = null
  run(exp.value.length, props.layout === 'seal' ? 220 : 130, () => {
    checked.value = stamp()
  })
}

const state = (i: number) => {
  if (running.value) return i < step.value ? (same.value[i] ? 'same' : 'diff') : i === step.value ? 'now' : 'wait'
  return same.value[i] ? 'same' : 'diff'
}

function onKeydown(event: KeyboardEvent) {
  const next = arrowMove(event, cursor.value ?? -1, exp.value.length, 'horizontal')
  if (next === null) return
  event.preventDefault()
  cursor.value = Math.max(0, next)
}

const reading = computed(() => {
  if (running.value) return `Comparing group ${Math.min(step.value + 1, exp.value.length)} of ${exp.value.length}`
  if (cursor.value === null) return differs.value.length ? `Group ${differs.value.join(', ')} differ${differs.value.length === 1 ? 's' : ''}` : `${exp.value.length} of ${exp.value.length} groups the same`
  const i = cursor.value
  return `Group ${i + 1}: ${exp.value[i]} · ${act.value[i] ?? '—'} · ${same.value[i] ? 'same' : 'differs'}`
})

const foot = computed(() => {
  if (props.layout === 'seal') return props.algo
  if (props.layout === 'line') return cursor.value === null && !running.value && checked.value ? `${reading.value} · checked ${checked.value}` : reading.value
  return checked.value ? `Checked ${checked.value}` : props.algo
})

const verdict = computed(() =>
  running.value
    ? { tone: 'neutral' as const, label: 'Checking' }
    : match.value
      ? { tone: 'success' as const, label: 'Match' }
      : { tone: 'danger' as const, label: 'Mismatch' },
)
</script>

<template>
  <div class="mk hash" :class="[`hash--${layout}`, { 'hash--pixel': pixel }]">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span v-if="layout === 'block'" class="r-label hash__algo">{{ algo }}</span>
      <RStatus v-else :tone="verdict.tone" :label="verdict.label" size="sm" />
    </div>

    <div
      class="hash__pair"
      tabindex="0"
      role="group"
      :aria-label="`${algo}: ${expectedLabel} and ${actualLabel}, in groups. Arrow keys read each pair.`"
      @keydown="onKeydown"
      @pointerleave="cursor = null"
    >
      <div v-for="row in rows" :key="row.key" class="hash__row">
        <span class="hash__label">{{ row.label }}</span>
        <span class="hash__groups">
          <span
            v-for="(g, i) in row.groups"
            :key="i"
            class="hash__g"
            :class="[`is-${state(i)}`, { 'is-cursor': cursor === i }]"
            @pointerenter="cursor = i"
          >{{ g }}</span>
        </span>
      </div>
    </div>

    <p v-if="layout === 'block'" class="hash__reading mk-truncate" aria-live="polite">{{ reading }}</p>

    <div v-if="layout === 'block'" class="hash__verdict">
      <RStatus :tone="verdict.tone" :label="verdict.label" />
      <span v-if="consequence && !running" class="hash__means">{{ match ? consequence.match : consequence.mismatch }}</span>
    </div>

    <div class="mk-row mk-between mk-end hash__foot">
      <span class="hash__when" :aria-live="layout === 'line' ? 'polite' : undefined">{{ foot }}</span>
      <RButton :size="layout === 'block' ? 'sm' : 'xs'" variant="outline" :aria-busy="running" @click="compare">
        {{ running ? 'Comparing' : 'Compare' }}
      </RButton>
    </div>
  </div>
</template>

<style scoped>
.hash {
  gap: 8px;
  container-type: inline-size;
}

.hash__algo {
  flex: none;
}

.hash__pair {
  display: flex;
  flex-direction: column;
  gap: 6px;
  outline: none;
}

.hash__pair:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: 3px;
}

.hash__row {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.hash__label {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.hash__groups {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 6px;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  letter-spacing: 0.02em;
  line-height: 16px;
}

.hash__g {
  padding: 0 1px;
  border-bottom: 1px solid transparent;
  color: var(--r-text);
  transition:
    color var(--r-duration-instant) var(--r-ease-out),
    background-color var(--r-duration-instant) var(--r-ease-out);
}

.hash__g.is-wait {
  color: var(--r-text-disabled);
}

.hash__g.is-now {
  background: var(--r-bg-pressed);
}

.hash__g.is-diff {
  border-bottom-color: var(--r-danger);
  color: var(--r-danger-text);
}

.hash__g.is-cursor {
  background: var(--r-bg-selected);
  box-shadow: 0 0 0 1px var(--r-brand);
}

.hash__reading {
  flex: none;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
}

.hash__verdict {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hash__means {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

.hash__foot {
  gap: 8px;
}

.hash__when {
  min-width: 0;
  overflow: hidden;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Line: one hash per line. A long hash takes the full width under its label; a short pixel
   code sits beside its label like an instrument readout. */
.hash--line .hash__groups {
  flex-wrap: nowrap;
  gap: 6px;
}
.hash--line.hash--pixel .hash__row {
  flex-direction: row;
  align-items: baseline;
  gap: 10px;
}
.hash--line.hash--pixel .hash__label {
  flex: none;
  width: 72px;
}
@container (max-width: 470px) {
  .hash--line .hash__row {
    flex-direction: row;
    align-items: baseline;
    gap: 8px;
  }
  .hash--line .hash__label {
    flex: none;
  }
  .hash--line .hash__groups {
    flex-wrap: wrap;
    font-size: var(--r-text-3xs);
  }
}

/* Pixel: an instrument readout of a short code. */
.hash--pixel .hash__groups {
  gap: 10px;
  font-family: var(--r-font-pixel);
  font-size: var(--r-text-lg);
  letter-spacing: 0.04em;
  line-height: 1.2;
}

/* Seal: two short numbers, label above each. */
.hash--seal .hash__groups {
  font-size: var(--r-text-sm);
  gap: 6px;
}
.hash--seal .hash__reading {
  display: none;
}
</style>
