<script setup lang="ts">
/**
 * An emergency stop: one big square that acts on the first press, no hold, no confirm. It latches;
 * pressing it again twists it out of the latch, which releases it but does not restart anything.
 * Start is a separate, deliberate key with a three-second warning, as on a real machine.
 */
import { computed, ref, watch } from 'vue'
import { RotateCw } from 'lucide-vue-next'
import { RButton, RStatus } from '@/design-system'
import { useTick } from '../../kit'
import { stamp, useFocusKeeper } from './shared'

const props = withDefaults(
  defineProps<{
    /** The machine: "Conveyor C3". */
    machine: string
    /** The reading while it runs, and its unit. */
    reading: number
    unit: string
    decimals?: number
    readingLabel?: string
    /** Interlocks checked before a restart, for the panel layout. */
    checks?: string[]
    /** `square` 1x1 · `tall` 1x2 · `panel` 2x2. */
    layout?: 'square' | 'tall' | 'panel'
  }>(),
  { decimals: 1, readingLabel: 'Speed', checks: () => [], layout: 'square' },
)

const state = ref<'running' | 'stopped' | 'released' | 'starting'>('running')
const stoppedAt = ref('')
const count = ref(3)
const tick = useTick(1000)
const { bind, keep } = useFocusKeeper()

watch(tick, () => {
  if (state.value !== 'starting') return
  count.value--
  if (count.value <= 0) state.value = 'running'
})

function press() {
  if (state.value === 'stopped') {
    state.value = 'released'
    return
  }
  state.value = 'stopped'
  stoppedAt.value = stamp(true)
}

function start() {
  keep('[data-focus="stop"]')
  count.value = 3
  state.value = 'starting'
}

const live = computed(() => (state.value === 'running' ? props.reading : 0))
const status = computed(() => {
  switch (state.value) {
    case 'stopped':
      return { tone: 'danger' as const, label: 'E-stop latched', pulse: false }
    case 'released':
      return { tone: 'warning' as const, label: 'Released · stopped', pulse: false }
    case 'starting':
      return { tone: 'signal' as const, label: `Starting in ${count.value}`, pulse: true }
    default:
      return { tone: 'success' as const, label: 'Running', pulse: false }
  }
})
const key = computed(() => {
  if (state.value === 'stopped') return { big: 'Stop', small: 'Press to release' }
  if (state.value === 'released') return { big: 'Stop', small: 'Released' }
  return { big: 'Stop', small: 'Emergency' }
})
</script>

<template>
  <div :ref="bind" class="mk estop" :class="[`estop--${layout}`, `is-${state}`]">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ machine }}</span>
    </div>

    <div class="estop__body">
      <button
        type="button"
        class="estop__key mk-reset"
        data-focus="stop"
        :aria-label="`Emergency stop, ${machine}. ${status.label}. ${state === 'stopped' ? 'Press again to release the latch' : 'Press to stop now'}`"
        :aria-pressed="state === 'stopped'"
        @click="press"
      >
        <span class="estop__cap">
          <span class="estop__big">{{ key.big }}</span>
          <span class="estop__small">{{ key.small }}</span>
          <RotateCw v-if="state === 'stopped'" :size="14" class="estop__twist" aria-hidden="true" />
        </span>
      </button>

      <div v-if="layout === 'panel'" class="estop__side">
        <p class="r-label">{{ readingLabel }}</p>
        <p class="estop__reading">
          <span class="mk-fig">{{ live.toFixed(decimals) }}</span>
          <span class="mk-unit">{{ unit }}</span>
        </p>
        <ul v-if="checks.length" class="estop__checks">
          <li v-for="c in checks" :key="c">
            <RStatus :tone="state === 'stopped' ? 'neutral' : 'success'" shape="square" size="sm" :label="c" />
          </li>
        </ul>
      </div>
    </div>

    <div class="estop__foot">
      <RStatus :tone="status.tone" :label="status.label" :pulse="status.pulse" size="sm" class="estop__status" />
      <p v-if="layout === 'tall'" class="estop__reading">
        <span class="mk-fig">{{ live.toFixed(decimals) }}</span>
        <span class="mk-unit">{{ unit }}</span>
      </p>
      <p v-if="state === 'stopped' && layout !== 'square'" class="estop__when">Latched {{ stoppedAt }}</p>
      <RButton v-if="state === 'released'" size="sm" variant="outline" @click="start">Start</RButton>
    </div>
  </div>
</template>

<style scoped>
.estop {
  gap: 8px;
}

.estop__body {
  display: flex;
  flex: 1 1 auto;
  gap: 12px;
  min-height: 0;
}

.estop__key {
  position: relative;
  display: grid;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  place-items: center;
  padding: 6px;
  border: 1px solid var(--r-border-strong);
  background: var(--r-bg-muted);
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
}

.estop--panel .estop__key {
  flex: 0 0 48%;
}

/* The cap: a red square that twists when it is released from the latch. */
.estop__cap {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  height: 100%;
  max-height: 120px;
  max-width: 100%;
  aspect-ratio: 1;
  background: var(--r-danger);
  color: var(--r-on-danger);
  transition: transform var(--r-duration-base) var(--r-ease-out);
}

.estop__key:hover .estop__cap {
  background: var(--r-danger-hover);
}

.estop__key:active .estop__cap {
  transform: translateY(1px);
}

/* Latched: pushed in, the cap sits a little lower with a strong ink rule around it. */
.is-stopped .estop__cap {
  outline: 3px solid var(--r-ink);
  outline-offset: -3px;
}

.is-released .estop__cap,
.is-starting .estop__cap {
  transform: rotate(45deg);
}

.is-released .estop__cap > *,
.is-starting .estop__cap > * {
  transform: rotate(-45deg);
}

.estop__big {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-bold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.estop__small {
  max-width: 100%;
  padding: 0 6px;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  line-height: 1.3;
  letter-spacing: 0.06em;
  text-align: center;
  text-transform: uppercase;
}

.estop__twist {
  position: absolute;
  top: 6px;
  right: 6px;
}

.estop__side {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.estop__reading {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.estop__reading .mk-fig {
  font-size: var(--r-text-2xl);
}

.estop__checks {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px solid var(--r-border-subtle);
}

.estop__checks :deep(.r-status__label) {
  white-space: normal;
}

.estop__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  min-width: 0;
}

.estop__status {
  min-width: 0;
  max-width: 100%;
}

.estop--tall .estop__foot {
  flex-direction: column;
  align-items: stretch;
}

.estop__when {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

@media (prefers-reduced-motion: reduce) {
  .estop__cap {
    transition: none;
  }
}
</style>
