<script setup lang="ts">
/**
 * The model at work for a minute: which step it is on, what is already done and when, and a Stop
 * that halts it between steps. Asking "where are you at?" every few seconds is the alternative.
 * Runs only while the tile is on screen.
 */
import { computed, ref, watch } from 'vue'
import { Check } from 'lucide-vue-next'
import { RButton, RStatus } from '@/design-system'
import { clock as mmss, pad, useTick } from '../../kit'

interface Step {
  label: string
  /** How long the step takes, in seconds. */
  secs: number
  /** Shown while it runs: "2 of 6 pods". */
  detail?: string
  /** Shown once done: "v2.41.3". */
  note?: string
}

const props = withDefaults(
  defineProps<{
    title: string
    agent?: string
    steps: Step[]
    /** The step it is on when the tile opens. */
    from?: number
    /** Clock when the tile opens, "09:14:02". */
    start: string
    /** What the status says at the end: "Rolled back". */
    doneText?: string
    /** One step at a time, for small tiles. */
    compact?: boolean
  }>(),
  { agent: 'Simpul', from: 1, doneText: 'Done' },
)

const toSecs = (t: string) => t.split(':').map(Number).reduce((s, v) => s * 60 + v, 0)
const hms = (s: number) => `${pad(Math.floor(s / 3600) % 24)}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`

const now = ref(toSecs(props.start))
const index = ref(props.from)
const elapsed = ref(0)
const ran = ref(props.steps.slice(0, props.from).reduce((s, x) => s + x.secs, 0))
const state = ref<'running' | 'stopped' | 'done'>('running')
const stamps = ref<string[]>(props.steps.map((_, i) => (i < props.from ? hms(now.value - (props.from - i) * 7) : '')))

const tick = useTick(1000)
watch(tick, () => {
  if (state.value !== 'running') return
  now.value++
  ran.value++
  elapsed.value++
  const step = props.steps[index.value]
  if (step && elapsed.value >= step.secs) {
    stamps.value[index.value] = hms(now.value)
    index.value++
    elapsed.value = 0
    if (index.value >= props.steps.length) state.value = 'done'
  }
})

const current = computed(() => props.steps[index.value])
const progress = computed(() => (current.value ? Math.min(1, elapsed.value / current.value.secs) : 1))
const SEGMENTS = 10
const lit = computed(() => Math.round(progress.value * SEGMENTS))

const status = computed(() => {
  if (state.value === 'done') return { tone: 'success' as const, label: props.doneText, pulse: false }
  if (state.value === 'stopped') return { tone: 'warning' as const, label: 'Stopped', pulse: false }
  return { tone: 'signal' as const, label: 'Running', pulse: true }
})

function again() {
  index.value = 0
  elapsed.value = 0
  ran.value = 0
  stamps.value = props.steps.map(() => '')
  state.value = 'running'
}

/* Read out on a change of step only, not on every second of the clock. */
const heard = computed(() => {
  if (state.value === 'done') return `${props.doneText}.`
  if (state.value === 'stopped') return `Stopped before step ${index.value + 1}.`
  return `Step ${index.value + 1} of ${props.steps.length}: ${current.value?.label ?? ''}`
})

const short = computed(() => {
  if (state.value === 'done') return `Done · ${mmss(ran.value)}`
  if (state.value === 'stopped') return `Held at ${index.value + 1}`
  return `${index.value + 1}/${props.steps.length} · ${mmss(ran.value)}`
})

const said = computed(() => {
  if (state.value === 'done') return `${props.doneText} in ${mmss(ran.value)}. Nothing left to do.`
  if (state.value === 'stopped')
    return `Stopped before step ${index.value + 1}. ${props.steps.length - index.value - 1 > 0 ? 'Later steps did not run.' : ''}`
  return `Step ${index.value + 1} of ${props.steps.length} · ${mmss(ran.value)}`
})
</script>

<template>
  <div class="mk steps" :class="{ 'steps--compact': compact }">
    <div class="steps__head">
      <span class="r-eyebrow mk-truncate">{{ title }}</span>
      <RStatus :tone="status.tone" :label="status.label" :pulse="status.pulse" size="sm" />
    </div>

    <template v-if="compact">
      <div class="steps__now mk-grow">
        <p class="steps__label">{{ current ? current.label : steps[steps.length - 1].label }}</p>
        <div class="steps__meter" aria-hidden="true">
          <i v-for="n in SEGMENTS" :key="n" :class="{ 'is-on': state === 'done' || n <= lit }" />
        </div>
      </div>
    </template>

    <ol v-else class="steps__list mk-grow">
      <li
        v-for="(step, i) in steps"
        :key="step.label"
        class="steps__item"
        :class="{ 'is-done': i < index, 'is-now': i === index && state !== 'done', 'is-held': i === index && state === 'stopped' }"
      >
        <span class="steps__mark" aria-hidden="true">
          <Check v-if="i < index" :size="14" />
          <i v-else class="steps__lamp" />
        </span>
        <span class="steps__text">
          <span class="steps__label">{{ step.label }}</span>
          <span v-if="i < index && step.note" class="steps__detail">{{ step.note }}</span>
          <span v-else-if="i === index && state !== 'done'" class="steps__detail">
            {{ state === 'stopped' ? 'Held here' : step.detail ?? 'Working' }}
          </span>
        </span>
        <span class="steps__time">{{ stamps[i] }}</span>
        <span class="r-sr-only">{{ i < index ? 'done' : i === index ? state : 'to do' }}</span>
      </li>
    </ol>

    <p class="r-sr-only" aria-live="polite">{{ heard }}</p>
    <div class="steps__foot">
      <p class="steps__said mk-truncate">
        <span class="steps__long">{{ said }}</span>
        <span class="steps__short">{{ short }}</span>
      </p>
      <RButton v-if="state === 'running'" size="xs" variant="outline" @click="state = 'stopped'">Stop</RButton>
      <RButton v-else-if="state === 'stopped'" size="xs" variant="outline" @click="state = 'running'">Resume</RButton>
      <RButton v-else size="xs" variant="ghost" @click="again">Run again</RButton>
    </div>
  </div>
</template>

<style scoped>
.steps {
  container-type: inline-size;
  gap: 8px;
}

.steps__head {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.steps__head > * {
  max-width: 100%;
}

.steps__short {
  display: none;
}

.steps__list {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  overflow: hidden;
  border-top: 1px solid var(--r-border-subtle);
  list-style: none;
}

.steps__item {
  display: grid;
  grid-template-columns: 16px minmax(0, 1fr) auto;
  gap: 8px;
  align-items: start;
  padding: 6px 0;
  border-bottom: 1px solid var(--r-border-subtle);
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  line-height: 16px;
}

.steps__item.is-done,
.steps__item.is-now {
  color: var(--r-text);
}

.steps__mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 16px;
}

.steps__mark svg {
  color: var(--r-success-text);
}

.steps__lamp {
  width: 7px;
  height: 7px;
  border: 1px solid var(--r-border-strong);
}

.is-now .steps__lamp {
  border-color: var(--r-signal);
  background: var(--r-signal);
  animation: steps-blink 1.2s steps(1, end) infinite;
}

.is-held .steps__lamp {
  border-color: var(--r-status-warning);
  background: var(--r-status-warning);
  animation: none;
}

@keyframes steps-blink {
  50% {
    opacity: 0.25;
  }
}

.steps__text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.steps__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.steps__detail {
  overflow: hidden;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.steps__time {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
}

.steps__foot {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.steps__said {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.02em;
}

.steps__now {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 0;
  overflow: hidden;
}

.steps__now .steps__label {
  display: -webkit-box;
  flex: none;
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
  line-height: 1.3;
  white-space: normal;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.steps__meter {
  display: flex;
  gap: 2px;
  margin-top: auto;
}

.steps__meter i {
  flex: 1;
  height: 8px;
  background: var(--r-bg-track);
}

.steps__meter i.is-on {
  background: var(--r-text-secondary);
}

/* Narrow: the status under the title, labels on two lines, no clock column, a short tally. */
@container (max-width: 240px) {
  .steps__head {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }
  .steps__long {
    display: none;
  }
  .steps__short {
    display: inline;
  }
  .steps__item {
    grid-template-columns: 16px minmax(0, 1fr);
  }
  .steps__time {
    display: none;
  }
  .steps__label {
    display: -webkit-box;
    white-space: normal;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
}

@media (prefers-reduced-motion: reduce) {
  .is-now .steps__lamp {
    animation: none;
  }
}
</style>
