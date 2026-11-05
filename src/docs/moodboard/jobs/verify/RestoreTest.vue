<script setup lang="ts">
/**
 * A backup only counts once a restore has been proven. The tile shows when the last backup ran and
 * when a restore was last tested; Run walks a restore drill step by step, each step with what it
 * found, and ends with a dated pass.
 */
import { computed, ref } from 'vue'
import { RButton, RStatus } from '@/design-system'
import { stamp, useSequence } from './shared'

interface Step {
  label: string
  /** What the step found: "18,204,551 rows, same count". */
  result: string
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    backupAt: string
    size: string
    /** "4 days ago". */
    lastTest: string
    /** The last test is older than policy allows. */
    overdue?: boolean
    steps: Step[]
    /** card 2x2 · row 2x1 · mini 1x1. */
    layout?: 'card' | 'row' | 'mini'
  }>(),
  { layout: 'card' },
)

const { step, running, run } = useSequence()
const passedAt = ref('')

function start() {
  if (running.value) return
  passedAt.value = ''
  run(props.steps.length, 650, () => {
    passedAt.value = stamp()
  })
}

function stateOf(i: number) {
  if (running.value) return i < step.value ? 'pass' : i === step.value ? 'run' : 'wait'
  return passedAt.value ? 'pass' : 'idle'
}

const status = computed(() => {
  if (passedAt.value) return { tone: 'success' as const, label: 'Passed just now' }
  if (running.value) return { tone: 'brand' as const, label: 'Restoring' }
  if (props.overdue) return { tone: 'warning' as const, label: props.layout === 'card' ? 'Test overdue' : 'Overdue' }
  return { tone: 'success' as const, label: props.layout === 'card' ? `Passed ${props.lastTest}` : 'Passed' }
})

const current = computed(() => (running.value ? props.steps[Math.min(step.value, props.steps.length - 1)] : null))
</script>

<template>
  <div class="mk restore" :class="`restore--${layout}`">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <RStatus v-if="layout !== 'mini'" :tone="status.tone" :label="status.label" size="sm" />
    </div>

    <dl v-if="layout === 'card'" class="restore__facts">
      <div><dt>Last backup</dt><dd class="mk-fig">{{ backupAt }}</dd></div>
      <div><dt>Size</dt><dd class="mk-fig">{{ size }}</dd></div>
      <div><dt>Last test</dt><dd class="mk-fig">{{ lastTest }}</dd></div>
    </dl>
    <p v-else-if="layout === 'row'" class="restore__line mk-truncate">
      Backup {{ backupAt }} · {{ size }} · restore tested {{ lastTest }}
    </p>
    <template v-else>
      <p class="restore__mini-fig"><span class="mk-fig">{{ lastTest }}</span></p>
      <RStatus :tone="status.tone" :label="passedAt ? 'Passed' : running ? 'Restoring' : overdue ? 'Overdue' : 'Passed'" size="sm" />
    </template>

    <ol class="restore__steps" :class="{ 'mk-grow': layout === 'card' }">
      <li v-for="(s, i) in steps" :key="s.label" class="restore__step" :class="`is-${stateOf(i)}`">
        <span class="restore__lamp" aria-hidden="true" />
        <span class="restore__label mk-truncate">{{ s.label }}</span>
        <span v-if="layout === 'card'" class="restore__result mk-truncate">{{ stateOf(i) === 'pass' ? s.result : stateOf(i) === 'run' ? 'Running' : '—' }}</span>
      </li>
    </ol>

    <div class="mk-row mk-between mk-end restore__foot">
      <p v-if="layout !== 'mini'" class="restore__note mk-truncate" aria-live="polite">
        <template v-if="passedAt">{{ steps.length }} of {{ steps.length }} steps passed · {{ passedAt }}</template>
        <template v-else-if="current">{{ current.label }}</template>
        <template v-else>Restores to a sandbox only.</template>
      </p>
      <RButton :size="layout === 'mini' ? 'xs' : 'sm'" variant="outline" :block="layout === 'mini'" :aria-busy="running" @click="start">
        {{ running ? `Step ${Math.min(step + 1, steps.length)} of ${steps.length}` : passedAt ? 'Run again' : 'Run restore test' }}
      </RButton>
    </div>
  </div>
</template>

<style scoped>
.restore {
  gap: 8px;
}

.restore__facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-top: 1px solid var(--r-border-subtle);
  border-bottom: 1px solid var(--r-border-subtle);
}

.restore__facts > div {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding: 6px 8px 8px 0;
}

.restore__facts > div + div {
  padding-left: 10px;
  border-left: 1px solid var(--r-border-subtle);
}

.restore__facts dt {
  overflow: hidden;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.restore__facts dd {
  margin: 0;
  overflow: hidden;
  font-size: var(--r-text-md);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.restore__line {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

.restore__steps {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.restore__step {
  display: grid;
  grid-template-columns: 8px minmax(0, 1fr) minmax(0, 1.1fr);
  align-items: center;
  gap: 8px;
  min-height: 26px;
  border-bottom: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-xs);
}

.restore__lamp {
  width: 8px;
  height: 8px;
  background: var(--r-status-off);
}

.restore__step.is-run .restore__lamp {
  background: var(--r-brand);
}

.restore__step.is-pass .restore__lamp {
  background: var(--r-status-good);
}

.restore__step.is-wait .restore__label {
  color: var(--r-text-tertiary);
}

.restore__result {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  text-align: right;
}

.restore__foot {
  gap: 10px;
}

.restore__note {
  min-width: 0;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

/* Row and mini: the steps are a strip of lamps, each with its name. */
.restore--row .restore__steps,
.restore--mini .restore__steps {
  display: grid;
  grid-auto-columns: minmax(0, 1fr);
  grid-auto-flow: column;
  gap: 2px;
}
.restore--row .restore__step,
.restore--mini .restore__step {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 4px;
  min-height: 0;
  border-bottom: 0;
}
.restore--row .restore__lamp,
.restore--mini .restore__lamp {
  width: auto;
  height: 8px;
}
.restore--row .restore__label {
  color: var(--r-text-secondary);
  font-size: var(--r-text-3xs);
  font-family: var(--r-font-mono);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.restore--mini .restore__label {
  display: none;
}

.restore__mini-fig .mk-fig {
  font-size: var(--r-text-xl);
}
</style>
