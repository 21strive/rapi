<script setup lang="ts">
/**
 * The system is about to act on its own unless a person stops it: a failover, a gate opening, an
 * order lapsing, a door locking. The clock is the figure; Cancel is the one key, because stopping
 * an automation is the decision that needs a person. "Now" skips the wait for those who agree.
 */
import { computed, ref } from 'vue'
import { RButton, RStatus } from '@/design-system'
import { mmss, stamp, useCountdown, useFocusKeeper } from './shared'

interface Reading {
  label: string
  value: string
  unit: string
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    /** What will happen: "Failing over to ap-southeast-1". */
    title: string
    reason?: string
    seconds: number
    cancel?: string
    now?: string
    /** Said after it happened, or after it was stopped. */
    done: string
    stopped: string
    /** The way back afterwards: "Fail back". */
    undo?: string
    readings?: Reading[]
    pixel?: boolean
    /** `row` 2x1 · `panel` 2x2 · `square` 1x1. */
    layout?: 'row' | 'panel' | 'square'
  }>(),
  { cancel: 'Cancel', now: 'Do it now', undo: 'Undo', readings: () => [], pixel: false, layout: 'row' },
)

const state = ref<'counting' | 'done' | 'stopped'>('counting')
const at = ref('')
const clock = useCountdown(props.seconds, { auto: true, onDone: () => finish('done') })
const left = clock.left
const { bind, keep } = useFocusKeeper()

function finish(next: 'done' | 'stopped') {
  keep('[data-focus="undo"]')
  clock.stop()
  at.value = stamp(true)
  state.value = next
}

function again() {
  keep('[data-focus="cancel"]')
  state.value = 'counting'
  clock.start()
}

const SEGMENTS = 30
const lit = computed(() => Math.ceil((left.value / props.seconds) * SEGMENTS))
const status = computed(() => {
  if (state.value === 'done') return { tone: 'success' as const, label: 'Done', pulse: false }
  if (state.value === 'stopped') return { tone: 'neutral' as const, label: 'Cancelled', pulse: false }
  return { tone: 'signal' as const, label: 'Automatic', pulse: true }
})
</script>

<template>
  <div :ref="bind" class="mk auto" :class="`auto--${layout}`">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <RStatus v-if="layout !== 'square'" :tone="status.tone" :label="status.label" :pulse="status.pulse" size="sm" class="auto__status" />
    </div>

    <div class="auto__main">
      <div class="auto__text">
        <p class="auto__title">{{ layout === 'square' && state !== 'counting' ? (state === 'done' ? done : stopped) : title }}</p>
        <p v-if="reason && layout !== 'square'" class="auto__reason">{{ reason }}</p>
      </div>
      <p class="auto__figure" role="timer" :aria-label="state === 'counting' ? `In ${mmss(left)}` : status.label">
        <span class="mk-fig" :class="{ 'r-pixel': pixel }">{{ state === 'counting' ? mmss(left) : '00:00' }}</span>
      </p>
    </div>

    <dl v-if="readings.length && layout === 'panel'" class="auto__readings">
      <div v-for="r in readings" :key="r.label">
        <dt class="r-label">{{ r.label }}</dt>
        <dd><span class="auto__value">{{ r.value }}</span> <span class="mk-unit">{{ r.unit }}</span></dd>
      </div>
    </dl>

    <div class="auto__bar" aria-hidden="true">
      <span v-for="i in SEGMENTS" :key="i" :class="{ 'is-on': state === 'counting' && i <= lit }" />
    </div>

    <div class="auto__foot mk-end">
      <template v-if="state === 'counting'">
        <RButton size="sm" data-focus="cancel" @click="finish('stopped')">{{ cancel }}</RButton>
        <RButton v-if="layout !== 'square'" size="sm" variant="outline" @click="finish('done')">{{ now }}</RButton>
      </template>
      <template v-else>
        <p class="auto__done" aria-live="polite">{{ state === 'done' ? done : stopped }} · {{ at }}</p>
        <RButton size="sm" variant="ghost" data-focus="undo" @click="again">{{ state === 'done' ? undo : 'Start again' }}</RButton>
      </template>
    </div>
  </div>
</template>

<style scoped>
.auto {
  gap: 8px;
}

.auto__status {
  flex: none;
}

/* On a signal tile the lamp would vanish into the orange, so it burns in ink there. */
:global(.r-card--signal) .auto__status {
  --tone-lamp: var(--r-text);
}

.auto__main {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
}

.auto--square .auto__main {
  flex-direction: column-reverse;
  align-items: stretch;
  gap: 2px;
}

.auto__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.auto__title {
  display: -webkit-box;
  overflow: hidden;
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.35;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.auto__reason {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

.auto__figure {
  flex: none;
}

.auto__figure .mk-fig {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xl);
  font-weight: var(--r-weight-medium);
  letter-spacing: -0.02em;
}

.auto--square .auto__figure .mk-fig {
  font-size: var(--r-text-2xl);
}

.auto__figure .mk-fig.r-pixel {
  font-family: var(--r-font-pixel);
  font-weight: 400;
  letter-spacing: 0.02em;
}

.auto__readings {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
  padding: 8px 0;
  border-top: 1px solid var(--r-border-subtle);
  border-bottom: 1px solid var(--r-border-subtle);
}

.auto__readings dd {
  margin: 2px 0 0;
}

.auto__value {
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
}

.auto__bar {
  display: grid;
  grid-template-columns: repeat(30, 1fr);
  gap: 2px;
  height: 4px;
}

.auto__bar span {
  background: var(--r-bg-track);
}

.auto__bar span.is-on {
  background: var(--r-text);
}

.auto__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.auto--square .auto__foot > * {
  flex: 1 1 auto;
}

.auto__done {
  min-width: 0;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

.auto--square .auto__done {
  display: none;
}
</style>
