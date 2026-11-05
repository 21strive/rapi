<script setup lang="ts">
/**
 * A built-in self-test as a grid of named cells, the way an instrument shows it. Each cell carries
 * an icon for its result and the line under the grid reads the cell under the cursor in words.
 * Arrow keys move the cursor; Run tests every cell again, one after the other.
 */
import { computed, nextTick, ref } from 'vue'
import { Check, TriangleAlert, X } from 'lucide-vue-next'
import { RButton } from '@/design-system'
import { arrowMove, stamp, useSequence, verdictWord, type Verdict } from './shared'

interface Test {
  /** Short code printed in the cell: "PSU", "TX2". */
  code: string
  name: string
  result: Exclude<Verdict, 'skip'>
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    tests: Test[]
    cols: number
    pixel?: boolean
    /** mini 1x1: icons only · row 2x1: codes in the cells. */
    layout?: 'mini' | 'row'
    /** The last automatic run, for the row layout: "Automatic, 06:00 WIB". */
    lastRun?: string
  }>(),
  { layout: 'mini', lastRun: 'Last run automatic, 06:00 WIB' },
)

const firstProblem = props.tests.findIndex((t) => t.result !== 'pass')
const cursor = ref(firstProblem >= 0 ? firstProblem : 0)
const cells: (HTMLElement | null)[] = []
const ranAt = ref('')
const { step, running, run } = useSequence()

function test() {
  if (running.value) return
  ranAt.value = ''
  run(props.tests.length, 90, () => {
    ranAt.value = stamp('WIB', false)
  })
}

function stateOf(i: number) {
  if (running.value) return i < step.value ? props.tests[i].result : i === step.value ? 'run' : 'wait'
  return props.tests[i].result
}

function onKeydown(event: KeyboardEvent, i: number) {
  const next = arrowMove(event, i, props.tests.length, 'grid', props.cols)
  if (next === null) return
  event.preventDefault()
  cursor.value = next
  nextTick(() => cells[next]?.focus())
}

const passed = computed(() => props.tests.filter((t) => t.result === 'pass').length)
const reading = computed(() => {
  if (running.value) return `Testing ${props.tests[Math.min(step.value, props.tests.length - 1)].code}`
  const t = props.tests[cursor.value]
  return props.layout === 'mini' ? `${t.name} · ${verdictWord[t.result]}` : `${t.code} · ${t.name} · ${verdictWord[t.result]}`
})
</script>

<template>
  <div class="mk grid-test" :class="[`grid-test--${layout}`, { 'grid-test--pixel': pixel }]">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span class="grid-test__sum">
        <span class="grid-test__fig">{{ running ? '··' : passed }}</span><span class="mk-unit">/{{ tests.length }}{{ layout === 'row' ? ' pass' : '' }}</span>
      </span>
    </div>

    <div class="grid-test__cells" role="group" :aria-label="`${eyebrow} self-test`" :style="{ '--cols': cols }">
      <button
        v-for="(t, i) in tests"
        :key="t.code"
        :ref="(el) => (cells[i] = el as HTMLElement | null)"
        type="button"
        class="grid-test__cell"
        :class="[`is-${stateOf(i)}`, { 'is-cursor': i === cursor }]"
        :tabindex="i === cursor ? 0 : -1"
        :aria-label="`${t.code}, ${t.name}: ${verdictWord[t.result]}`"
        @click="cursor = i"
        @focus="cursor = i"
        @pointerenter="cursor = i"
        @keydown="onKeydown($event, i)"
      >
        <span v-if="layout === 'row'" class="grid-test__code" aria-hidden="true">
          <template v-if="!running || i < step">
            <X v-if="t.result === 'fail'" :size="10" />
            <TriangleAlert v-else-if="t.result === 'warn'" :size="10" />
          </template>
          {{ t.code }}
        </span>
        <template v-else-if="!running || i < step">
          <X v-if="t.result === 'fail'" :size="12" aria-hidden="true" />
          <TriangleAlert v-else-if="t.result === 'warn'" :size="12" aria-hidden="true" />
          <Check v-else :size="12" aria-hidden="true" />
        </template>
      </button>
    </div>

    <div class="grid-test__foot mk-end">
      <p class="grid-test__reading mk-truncate" aria-live="polite">{{ reading }}</p>
      <RButton size="xs" variant="outline" :aria-busy="running" @click="test">Run</RButton>
    </div>
    <p v-if="layout === 'row'" class="grid-test__ran">{{ ranAt ? `Run by you at ${ranAt}` : lastRun }}</p>
  </div>
</template>

<style scoped>
.grid-test {
  gap: 8px;
}

.grid-test__sum {
  display: inline-flex;
  flex: none;
  align-items: baseline;
  gap: 1px;
}

.grid-test__fig {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
}

.grid-test__cells {
  display: grid;
  grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
  gap: 2px;
}

.grid-test__cell {
  display: grid;
  place-items: center;
  height: 22px;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 1px solid var(--r-border);
  background: var(--r-bg-surface);
  color: var(--r-text-tertiary);
  cursor: pointer;
  transition: background-color var(--r-duration-instant) var(--r-ease-out);
}

.grid-test__cell.is-pass {
  color: var(--r-success-text);
}

.grid-test__cell.is-warn {
  border-color: var(--r-warning-border);
  background: var(--r-warning-soft);
  color: var(--r-warning-text);
}

.grid-test__cell.is-fail {
  border-color: var(--r-danger-border);
  background: var(--r-danger-soft);
  color: var(--r-danger-text);
}

.grid-test__cell.is-run {
  border-color: var(--r-brand);
  background: var(--r-brand);
}

.grid-test__cell.is-wait {
  background: var(--r-bg-muted);
}

.grid-test__cell.is-cursor {
  box-shadow: 0 0 0 1px var(--r-text);
}

.grid-test__cell:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: 1px;
}

.grid-test__code {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.04em;
}

.grid-test__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.grid-test__reading {
  min-width: 0;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
}

/* Mini: the reading may take two lines beside the Run key. */
.grid-test--mini .grid-test__reading {
  display: -webkit-box;
  font-family: var(--r-font-sans);
  font-size: var(--r-text-xs);
  line-height: var(--r-leading-snug);
  white-space: normal;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.grid-test__ran {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.grid-test--row .grid-test__cell {
  height: 26px;
}

/* In the row the codes do the talking: a pass stays quiet, a problem carries its icon. */
.grid-test--row .grid-test__cell.is-pass {
  color: var(--r-text-secondary);
}

.grid-test--pixel .grid-test__fig {
  font-family: var(--r-font-pixel);
  font-size: var(--r-text-xl);
  font-weight: 400;
}
</style>
