<script setup lang="ts">
/**
 * Told to wait: a rate limit, a resend window, a lockout. The wait is the figure and it counts
 * down where the person is looking. `backoff` retries by itself and doubles the wait each time it
 * is refused, with Retry now for the impatient; `cooldown` holds one action until the wait is over.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { RButton, RStatus } from '@/design-system'
import { mmss, stamp, useCountdown, useFocusKeeper } from './shared'

const props = withDefaults(
  defineProps<{
    eyebrow: string
    title: string
    mode?: 'backoff' | 'cooldown'
    /** Backoff: the wait before the next attempt, the attempt it is on, and the one that gets through. */
    wait?: number
    attempt?: number
    maxAttempts?: number
    succeedOn?: number
    /** Cooldown: how many times the action may run before a long lock. */
    uses?: number
    /** Cooldown: the action ends the wait for good (an unlock), instead of starting a longer one. */
    once?: boolean
    /** Said after it went through, or after each cooldown action. */
    done: string
    action: string
    pixel?: boolean
    /** `row` 2x1 · `square` 1x1. */
    layout?: 'row' | 'square'
  }>(),
  { mode: 'backoff', wait: 8, attempt: 3, maxAttempts: 6, succeedOn: 5, uses: 3, once: false, pixel: false, layout: 'row' },
)

const phase = ref<'waiting' | 'trying' | 'ok' | 'ready'>('waiting')
const attempt = ref(props.attempt)
const delay = ref(props.wait)
const usesLeft = ref(props.uses)
const note = ref('')
const { bind, keep, hold } = useFocusKeeper()
const clock = useCountdown(props.wait, { auto: true, onDone: () => (props.mode === 'backoff' ? tryNow() : (phase.value = 'ready')) })
const left = clock.left

let timer: number | undefined
onBeforeUnmount(() => window.clearTimeout(timer))

function tryNow() {
  if (phase.value === 'trying') return
  const giveBack = hold()
  clock.stop()
  phase.value = 'trying'
  timer = window.setTimeout(() => {
    if (attempt.value >= props.succeedOn) {
      phase.value = 'ok'
      note.value = `${props.done} · ${stamp()}`
      giveBack('[data-focus="reset"]')
      return
    }
    attempt.value++
    delay.value = Math.min(delay.value * 2, 64)
    phase.value = 'waiting'
    clock.start(delay.value)
    giveBack('[data-focus="act"]')
  }, 800)
}

function use() {
  note.value = `${props.done} · ${stamp()}`
  if (props.once) {
    keep('[data-focus="reset"]')
    phase.value = 'ok'
    return
  }
  keep('[data-focus="act"]')
  usesLeft.value--
  delay.value = usesLeft.value > 0 ? delay.value * 2 : 1800
  phase.value = 'waiting'
  clock.start(delay.value)
}

function reset() {
  keep('[data-focus="act"]')
  window.clearTimeout(timer)
  attempt.value = props.attempt
  delay.value = props.wait
  usesLeft.value = props.uses
  note.value = ''
  phase.value = 'waiting'
  clock.start(props.wait)
}

const SEGMENTS = 16
const lit = computed(() => Math.ceil((left.value / delay.value) * SEGMENTS))
const status = computed(() => {
  if (phase.value === 'ok') return { tone: 'success' as const, label: 'Through', pulse: false }
  if (phase.value === 'trying') return { tone: 'brand' as const, label: 'Trying', pulse: true }
  if (phase.value === 'ready') return { tone: 'neutral' as const, label: 'Ready', pulse: false }
  return { tone: 'warning' as const, label: props.mode === 'backoff' ? 'Rate limited' : 'Wait', pulse: false }
})
const caption = computed(() => {
  if (props.mode === 'backoff') {
    if (phase.value === 'ok') return note.value
    return `Attempt ${attempt.value} of ${props.maxAttempts} · next wait ${Math.min(delay.value * 2, 64)} s`
  }
  if (usesLeft.value <= 0) return 'No tries left · locked for 30 min'
  return note.value || `${usesLeft.value} of ${props.uses} left`
})
const figure = computed(() => (phase.value === 'ok' ? '00:00' : phase.value === 'trying' ? '··:··' : mmss(left.value)))
</script>

<template>
  <div :ref="bind" class="mk wait" :class="`wait--${layout}`">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <RStatus v-if="layout === 'row'" :tone="status.tone" :label="status.label" :pulse="status.pulse" size="sm" class="wait__status" />
    </div>

    <div class="wait__main">
      <div class="wait__text">
        <p class="wait__title">{{ layout === 'square' && note ? done : title }}</p>
        <p class="wait__caption">{{ caption }}</p>
      </div>
      <p class="wait__figure" role="timer" :aria-label="`Wait ${mmss(left)}`">
        <span class="mk-fig" :class="{ 'r-pixel': pixel }">{{ figure }}</span>
      </p>
    </div>

    <div class="wait__bar" aria-hidden="true">
      <span v-for="i in SEGMENTS" :key="i" :class="{ 'is-on': phase === 'waiting' && i <= lit }" />
    </div>

    <div class="wait__foot mk-end">
      <RButton v-if="phase === 'ok'" size="sm" variant="ghost" data-focus="reset" @click="reset">Reset</RButton>
      <RButton
        v-else-if="mode === 'backoff'"
        size="sm"
        variant="outline"
        :aria-disabled="phase === 'trying' ? 'true' : undefined"
        data-focus="act"
        @click="tryNow"
      >
        {{ action }}
      </RButton>
      <RButton
        v-else
        size="sm"
        :variant="phase === 'ready' ? 'solid' : 'outline'"
        :disabled="phase !== 'ready' || usesLeft <= 0"
        data-focus="act"
        @click="use"
      >
        {{ phase === 'ready' ? action : `${action} in ${mmss(left)}` }}
      </RButton>
    </div>
  </div>
</template>

<style scoped>
.wait {
  gap: 8px;
}

.wait__status {
  flex: none;
}

.wait__main {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
}

.wait--square .wait__main {
  flex-direction: column-reverse;
  align-items: stretch;
  gap: 2px;
}

.wait__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.wait__title {
  overflow: hidden;
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wait__caption {
  overflow: hidden;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.wait--square .wait__caption {
  display: none;
}

.wait__figure {
  flex: none;
}

.wait__figure .mk-fig {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xl);
  font-weight: var(--r-weight-medium);
  letter-spacing: -0.02em;
}

.wait__figure .mk-fig.r-pixel {
  font-family: var(--r-font-pixel);
  font-weight: 400;
  letter-spacing: 0.02em;
}

.wait__bar {
  display: grid;
  grid-template-columns: repeat(16, 1fr);
  gap: 2px;
  height: 4px;
}

.wait__bar span {
  background: var(--r-bg-track);
}

.wait__bar span.is-on {
  background: var(--r-status-warning);
}

.wait__foot {
  display: flex;
}

.wait--square .wait__foot > * {
  flex: 1 1 auto;
}
</style>
