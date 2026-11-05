<script setup lang="ts">
/**
 * A run of stages, one lamp and one word each: WAIT, RUN, PASS, FAIL. The running lamp blinks and
 * its clock counts. Pick a stage to read its last log line; a failed stage offers Retry, which
 * picks up from that stage, and a finished run can go again.
 */
import { computed, ref } from 'vue'
import { RotateCcw } from 'lucide-vue-next'
import { RButton, RStatus } from '@/design-system'
import { clock, useNow } from '../../kit'
import { stepKey } from './shared'

interface Stage {
  label: string
  secs: number
  /** Its last log line once it has run. */
  log: string
  /** Set on the stage that fails on the first attempt: the line it fails with. */
  fail?: string
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    stages: Stage[]
    /** Seconds into the run when the tile opens. */
    ran?: number
    layout?: 'row' | 'list'
  }>(),
  { ran: 0, layout: 'row' },
)

const now = useNow(1000)
const startedAt = ref(Date.now() - props.ran * 1000)
const retried = ref(new Set<number>())
const starts = props.stages.reduce<number[]>((acc, _s, i) => [...acc, i ? acc[i - 1] + props.stages[i - 1].secs : 0], [])
const ends = props.stages.map((s, i) => starts[i] + s.secs)
const total = ends[ends.length - 1]

const failing = computed(() => props.stages.findIndex((s, i) => s.fail && !retried.value.has(i)))
const raw = computed(() => (now.value.getTime() - startedAt.value) / 1000)
const elapsed = computed(() => Math.min(raw.value, failing.value >= 0 ? ends[failing.value] : total))
const failed = computed(() => failing.value >= 0 && raw.value >= ends[failing.value])
const passed = computed(() => !failed.value && elapsed.value >= total)

type State = 'wait' | 'run' | 'pass' | 'fail'
const stateOf = (i: number): State => {
  if (failed.value && i === failing.value) return 'fail'
  if (elapsed.value >= ends[i]) return 'pass'
  if (elapsed.value >= starts[i]) return 'run'
  return 'wait'
}
const TONE = { wait: 'neutral', run: 'signal', pass: 'success', fail: 'danger' } as const
const timeOf = (i: number) => {
  const st = stateOf(i)
  if (st === 'wait') return '—'
  return clock(Math.max(0, Math.min(elapsed.value, ends[i]) - starts[i]))
}

const running = computed(() => props.stages.findIndex((_, i) => stateOf(i) === 'run'))
const picked = ref<number | null>(null)
const selected = computed(() => picked.value ?? (failed.value ? failing.value : running.value >= 0 ? running.value : props.stages.length - 1))
const logLine = computed(() => {
  const i = selected.value
  const s = props.stages[i]
  const st = stateOf(i)
  if (st === 'fail') return s.fail ?? s.log
  if (st === 'wait') return `Waits for ${props.stages[Math.max(0, i - 1)].label}`
  if (st === 'run') return `${s.log.replace(/\.$/, '')} …`
  return s.log
})

const status = computed(() => {
  if (failed.value) return { tone: 'danger' as const, label: `Failed at ${props.stages[failing.value].label}`, pulse: false }
  if (passed.value) return { tone: 'success' as const, label: `Passed in ${clock(total)}`, pulse: false }
  return { tone: 'signal' as const, label: 'Running', pulse: true }
})

function retry() {
  const f = failing.value
  retried.value = new Set([...retried.value, f])
  startedAt.value = Date.now() - starts[f] * 1000
  picked.value = null
}
function rerun() {
  startedAt.value = Date.now()
  picked.value = null
}

function onKeydown(event: KeyboardEvent) {
  const next = stepKey(event, selected.value, props.stages.length)
  if (next == null) return
  picked.value = next
  ;(event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus()
}
</script>

<template>
  <div class="mk pipe" :class="`pipe--${layout}`">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span class="mk-row pipe__state">
        <RStatus :tone="status.tone" :pulse="status.pulse" size="sm" :label="status.label" />
        <RButton v-if="failed" size="xs" variant="outline" @click="retry">
          <template #leading><RotateCcw :size="14" /></template>
          Retry
        </RButton>
        <RButton v-else-if="passed" size="xs" variant="ghost" @click="rerun">Run again</RButton>
      </span>
    </div>

    <div class="pipe__stages mk-grow" role="radiogroup" :aria-label="`Stages of ${eyebrow}`" @keydown="onKeydown">
      <button
        v-for="(s, i) in stages"
        :key="s.label"
        type="button"
        role="radio"
        class="pipe__stage mk-reset"
        :class="[`is-${stateOf(i)}`, { 'is-selected': i === selected }]"
        :aria-checked="i === selected"
        :tabindex="i === selected ? 0 : -1"
        @click="picked = i"
      >
        <RStatus :tone="TONE[stateOf(i)]" :pulse="stateOf(i) === 'run'" shape="square" size="sm" :label="stateOf(i)" />
        <span class="pipe__label">{{ s.label }}</span>
        <span class="pipe__time">{{ timeOf(i) }}</span>
      </button>
    </div>

    <p class="pipe__log" :class="{ 'is-fail': stateOf(selected) === 'fail' }">
      <span class="pipe__log-label">{{ stages[selected].label }}</span>
      <span class="mk-truncate">{{ logLine }}</span>
    </p>
  </div>
</template>

<style scoped>
.pipe {
  gap: 8px;
}

.pipe__state {
  flex: none;
  gap: 8px;
}

.pipe__stages {
  display: grid;
  grid-auto-columns: minmax(0, 1fr);
  grid-auto-flow: column;
  border: 1px solid var(--r-border);
}

.pipe__stage {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 4px;
  min-width: 0;
  padding: 8px;
  border-left: 1px solid var(--r-border-subtle);
  cursor: pointer;
}

.pipe__stage:first-child {
  border-left: 0;
}

.pipe__stage:hover {
  background: var(--r-bg-hover);
}

.pipe__stage.is-selected {
  background: var(--r-bg-selected);
}

/* The selected stage carries a 2px cobalt rule on its leading edge, as a selected table row does. */
.pipe__stage.is-selected::before {
  content: '';
  position: absolute;
  top: -1px;
  right: 0;
  left: 0;
  height: 2px;
  background: var(--r-brand);
}

.pipe__stage:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: -2px;
}

.pipe__label {
  overflow: hidden;
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pipe__stage.is-wait .pipe__label {
  color: var(--r-text-tertiary);
}

.pipe__time {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
}

.pipe__log {
  display: flex;
  flex: none;
  gap: 8px;
  min-width: 0;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
}

.pipe__log.is-fail {
  color: var(--r-danger-text);
}

.pipe__log-label {
  flex: none;
  color: var(--r-text-tertiary);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

/* List: the stages run down, one row each. */
.pipe--list .pipe__stages {
  grid-auto-flow: row;
  grid-auto-rows: minmax(0, 1fr);
  grid-auto-columns: auto;
}

.pipe--list .pipe__stage {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr) auto;
  align-items: center;
  padding: 0 10px;
  border-top: 1px solid var(--r-border-subtle);
  border-left: 0;
}

.pipe--list .pipe__stage:first-child {
  border-top: 0;
}

.pipe--list .pipe__stage.is-selected::before {
  top: 0;
  right: auto;
  bottom: 0;
  left: -1px;
  width: 2px;
  height: auto;
}

/* On a cobalt tile cobalt is the panel itself: selection inside turns white. */
.r-card--brand .pipe {
  --r-brand: var(--r-on-brand);
}
</style>
