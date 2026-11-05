<script setup lang="ts">
/**
 * A job that takes minutes: the stage it is in, how far it has come and when it will be done. Next
 * to it sits the one control a person needs while watching, stop it; a finished job can run again.
 * The bar is cut per stage, filled in ink, with the leading edge drawn as the orange "now" line.
 */
import { computed, ref } from 'vue'
import { RButton, RStatus } from '@/design-system'
import { clock, num, timeZ, useNow, type Zone } from '../../kit'
import { bytes, minutes } from './shared'

interface Stage {
  label: string
  secs: number
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    title: string
    stages: Stage[]
    /** Seconds already run when the tile opens. */
    ran?: number
    /** A size to count through, in MB: "1.9 of 3.2 GB". */
    sizeMb?: number
    /** The stop control and the word for a stopped job. */
    stop?: string
    stopped?: string
    layout?: 'card' | 'strip' | 'mini'
    zone?: Zone
  }>(),
  { ran: 0, stop: 'Cancel', stopped: 'Cancelled', layout: 'card', zone: 'WIB' },
)

const now = useNow(1000)
const total = props.stages.reduce((a, s) => a + s.secs, 0)
const startedAt = ref(Date.now() - props.ran * 1000)
const stoppedAt = ref<number | null>(null)

const elapsed = computed(() =>
  Math.max(0, Math.min(total, ((stoppedAt.value ?? now.value.getTime()) - startedAt.value) / 1000)),
)
const phase = computed(() => (stoppedAt.value != null ? 'stopped' : elapsed.value >= total ? 'done' : 'running'))
const share = computed(() => elapsed.value / total)

const rows = computed(() => {
  let acc = 0
  return props.stages.map((s) => {
    const ran = Math.max(0, Math.min(s.secs, elapsed.value - acc))
    acc += s.secs
    return { ...s, ran, part: ran / s.secs }
  })
})
const current = computed(() => {
  const i = rows.value.findIndex((r) => r.part < 1)
  return i < 0 ? props.stages.length : i
})

type State = 'done' | 'running' | 'stopped' | 'queued'
const stateOf = (i: number): State =>
  i < current.value ? 'done' : i > current.value ? 'queued' : phase.value === 'stopped' ? 'stopped' : 'running'
const WORD: Record<State, string> = { done: 'Done', running: 'Running', stopped: props.stopped, queued: 'Queued' }
const TONE = { done: 'success', running: 'signal', stopped: 'neutral', queued: 'neutral' } as const

const status = computed(() => {
  if (phase.value === 'done') return { tone: 'success' as const, label: 'Done', pulse: false }
  if (phase.value === 'stopped') return { tone: 'neutral' as const, label: props.stopped, pulse: false }
  return { tone: 'signal' as const, label: 'Running', pulse: true }
})

const stageName = computed(() => props.stages[Math.min(current.value, props.stages.length - 1)].label)
const left = computed(() => total - elapsed.value)
const leftText = computed(() => (left.value < 60 ? 'under a minute left' : `about ${minutes(left.value / 60)} left`))
const doneBy = computed(() => timeZ(new Date(startedAt.value + total * 1000), props.zone))
const note = computed(() => {
  if (phase.value === 'done') return `Done in ${clock(total)} at ${doneBy.value}`
  if (phase.value === 'stopped') return `${props.stopped} in ${stageName.value} at ${clock(elapsed.value)}`
  return `Done by ${doneBy.value}`
})
const sizeText = computed(() => (props.sizeMb ? `${bytes(props.sizeMb * share.value)} of ${bytes(props.sizeMb)}` : ''))

function halt() {
  stoppedAt.value = Date.now()
}
function restart() {
  startedAt.value = Date.now()
  stoppedAt.value = null
}
</script>

<template>
  <div class="mk job" :class="`job--${layout}`">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <RStatus v-if="layout !== 'mini'" :tone="status.tone" :pulse="status.pulse" size="sm" :label="status.label" />
    </div>

    <p v-if="layout !== 'mini'" class="job__title">{{ title }}</p>

    <div class="job__figures">
      <p class="job__pct">
        <span class="mk-fig">{{ num(share * 100) }}</span><span class="mk-unit">%</span>
      </p>
      <span v-if="layout === 'mini'" class="job__quiet mk-truncate">{{ current + 1 > stages.length ? stages.length : current + 1 }} of {{ stages.length }}</span>
      <span v-else class="job__quiet mk-truncate">{{ sizeText || `${clock(elapsed)} elapsed` }}</span>
      <span v-if="layout === 'card'" class="job__quiet job__left mk-truncate">{{ phase === 'running' ? leftText : '' }}</span>
      <span v-else-if="layout === 'strip'" class="job__quiet job__left mk-truncate">{{ phase === 'running' ? `${current + 1} of ${stages.length} · ${stageName}` : phase === 'done' ? 'Done' : stopped }}</span>
    </div>

    <div class="job__bar" role="progressbar" :aria-valuenow="Math.round(share * 100)" aria-valuemin="0" aria-valuemax="100" :aria-valuetext="`${num(share * 100)}%, ${stageName}`" :aria-label="title">
      <span v-for="(r, i) in rows" :key="r.label" class="job__seg" :style="{ flexGrow: r.secs }">
        <span class="job__fill" :style="{ width: `${r.part * 100}%` }" />
        <span v-if="stateOf(i) === 'running'" class="job__now" :style="{ left: `${r.part * 100}%` }" />
      </span>
    </div>

    <ol v-if="layout === 'card'" class="job__stages mk-grow">
      <li v-for="(r, i) in rows" :key="r.label" class="job__stage" :class="`is-${stateOf(i)}`">
        <span class="mk-truncate">{{ r.label }}</span>
        <RStatus :tone="TONE[stateOf(i)]" :pulse="stateOf(i) === 'running'" shape="square" size="sm" :label="WORD[stateOf(i)]" />
        <span class="job__time">{{ stateOf(i) === 'queued' ? clock(r.secs) : clock(r.ran) }}</span>
      </li>
    </ol>

    <p v-else-if="layout === 'mini'" class="job__stage-now mk-truncate">
      <template v-if="phase === 'running'">{{ stageName }}</template>
      <template v-else>{{ phase === 'done' ? 'Done' : stopped }}</template>
    </p>

    <div class="mk-row mk-between job__foot">
      <RButton v-if="phase === 'running'" size="xs" variant="outline" @click="halt">{{ stop }}</RButton>
      <RButton v-else-if="phase === 'stopped'" size="xs" variant="outline" @click="restart">Restart</RButton>
      <RButton v-else size="xs" variant="ghost" @click="restart">Run again</RButton>
      <span v-if="layout !== 'mini'" class="job__quiet mk-truncate">{{ layout === 'strip' && phase === 'running' ? leftText : note }}</span>
    </div>
  </div>
</template>

<style scoped>
.job {
  gap: 8px;
}

.job > * {
  flex: none;
}

.job > .job__stages {
  flex: 1 1 auto;
}

.job__title {
  overflow: hidden;
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.job__figures {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
}

.job__pct {
  display: flex;
  flex: none;
  align-items: baseline;
  gap: 2px;
}

.job__pct .mk-fig {
  font-size: var(--r-text-2xl);
}

.job--strip .job__pct .mk-fig {
  font-size: var(--r-text-xl);
}

.job__quiet {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
}

.job__left {
  margin-left: auto;
}

.job__bar {
  display: flex;
  flex: none;
  gap: 2px;
  height: 8px;
}

.job__seg {
  position: relative;
  flex-basis: 0;
  min-width: 4px;
  background: var(--r-bg-track);
}

.job__fill {
  position: absolute;
  inset: 0 auto 0 0;
  background: var(--r-ink);
  transition: width var(--r-duration-slow) var(--r-ease-out);
}

.job__now {
  position: absolute;
  top: -3px;
  bottom: -3px;
  width: 2px;
  margin-left: -1px;
  background: var(--r-chart-now);
  transition: left var(--r-duration-slow) var(--r-ease-out);
}

.job__stages {
  display: flex;
  flex-direction: column;
  margin: 2px 0 0;
  padding: 0;
  overflow: hidden;
  border-top: 1px solid var(--r-border-subtle);
  list-style: none;
}

.job__stage {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto 40px;
  align-items: center;
  gap: 10px;
  padding: 5px 0;
  border-bottom: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-xs);
}

.job__stage.is-queued {
  color: var(--r-text-tertiary);
}

.job__time {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.job__stage-now {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

.job__foot {
  flex: none;
  margin-top: auto;
}

@media (prefers-reduced-motion: reduce) {
  .job__fill,
  .job__now {
    transition: none;
  }
}
</style>
