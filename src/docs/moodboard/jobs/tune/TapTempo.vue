<script setup lang="ts">
/**
 * Tap a rhythm and read its rate: a tempo for a pattern, compressions for CPR practice, a cow's
 * breaths for heat stress. The hand already knows the rhythm; counting it is slower. Press the
 * key on each beat (pointer, Space, Enter or T while it has focus); the rate is the average of
 * the last five gaps, and a pause of over two and a half seconds starts a new count.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { Minus, Plus } from 'lucide-vue-next'
import { RIconButton } from '@/design-system'
import { clamp } from './shared'

interface Band {
  /** Upper bound of the band, per minute. */
  upTo: number
  word: string
  tone: 'success' | 'warning' | 'danger' | 'neutral'
}

const props = withDefaults(
  defineProps<{
    label: string
    /** Text on the key cap: "Tap", "Press", "Breath". */
    cap?: string
    unit?: string
    value?: number
    /** Words for ranges of the rate, low to high. */
    bands?: Band[]
    /** A scale under the readout with the target band marked. */
    scale?: { min: number; max: number; lo: number; hi: number }
    /** A lamp that blinks on the beat (tempo). */
    tempo?: boolean
    /** One-step nudge keys under the reading. */
    nudge?: boolean
    /** The idle line before the first tap. */
    start?: string
    pixel?: boolean
    wide?: boolean
  }>(),
  { cap: 'Tap', unit: '/min', tempo: false, nudge: false, start: 'Tap to start', pixel: false, wide: false },
)

const rate = ref<number | null>(props.value ?? null)
const taps = ref<number[]>([])
const flash = ref(false)
let flashTimer: number | undefined

function tap() {
  const now = performance.now()
  const last = taps.value[taps.value.length - 1]
  const list = last !== undefined && now - last > 2500 ? [now] : [...taps.value, now].slice(-6)
  taps.value = list
  if (list.length >= 2) {
    const gaps = list.slice(1).map((t, i) => t - list[i])
    const avg = gaps.reduce((s, g) => s + g, 0) / gaps.length
    rate.value = Math.round(clamp(60000 / avg, 10, 300))
  }
  flash.value = true
  window.clearTimeout(flashTimer)
  flashTimer = window.setTimeout(() => (flash.value = false), 90)
}

function onPointerdown(event: PointerEvent) {
  if (event.button !== 0) return
  event.preventDefault()
  ;(event.currentTarget as HTMLElement).focus({ preventScroll: true })
  tap()
}
onBeforeUnmount(() => window.clearTimeout(flashTimer))
function onKeydown(event: KeyboardEvent) {
  if (event.key !== ' ' && event.key !== 'Enter' && event.key.toLowerCase() !== 't') return
  event.preventDefault()
  if (!event.repeat) tap()
}

const band = computed(() => {
  const r = rate.value
  if (r === null || !props.bands?.length) return null
  return props.bands.find((b) => r <= b.upTo) ?? props.bands[props.bands.length - 1]
})
const counting = computed(() => taps.value.length)
const status = computed(() => {
  if (counting.value === 1) return 'One more tap'
  if (counting.value >= 2) return `${counting.value} taps`
  return rate.value === null ? props.start : 'Last count'
})
const at = (v: number) => `${((clamp(v, props.scale!.min, props.scale!.max) - props.scale!.min) / (props.scale!.max - props.scale!.min)) * 100}%`
</script>

<template>
  <div class="mk tap" :class="{ 'tap--wide': wide }" :style="{ '--beat': `${60 / (rate ?? 120)}s` }">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ label }}</span>
      <span v-if="tempo" class="tap__lamp" :class="{ 'is-beating': rate !== null }" aria-hidden="true" />
    </div>

    <div class="tap__body">
      <button
        type="button"
        class="tap__key"
        :class="{ 'is-down': flash }"
        :aria-label="`${cap}: press on each beat`"
        @pointerdown="onPointerdown"
        @keydown="onKeydown"
        @contextmenu.prevent
      >
        {{ cap }}
      </button>

      <div class="tap__read">
        <p class="tap__rate" aria-live="polite">
          <span :class="pixel ? 'tap__digits r-pixel' : 'tap__digits mk-fig'">{{ rate ?? '–' }}</span>
          <span class="mk-unit">{{ unit }}</span>
        </p>
        <p class="tap__status">
          <span v-if="band" class="tap__word" :class="`is-${band.tone}`">{{ band.word }}</span>
          <span class="r-label">{{ status }}</span>
        </p>
        <div v-if="scale" class="tap__scale" aria-hidden="true">
          <span class="tap__target" :style="{ left: at(scale.lo), width: `calc(${at(scale.hi)} - ${at(scale.lo)})` }" />
          <span v-if="rate !== null" class="tap__marker" :style="{ left: at(rate) }" />
        </div>
        <div v-if="scale" class="tap__ends" aria-hidden="true">
          <span>{{ scale.min }}</span>
          <span>{{ scale.lo }}–{{ scale.hi }}</span>
          <span>{{ scale.max }}</span>
        </div>
        <div v-if="nudge" class="mk-row tap__nudge">
          <RIconButton label="One slower" size="xs" variant="outline" :disabled="rate === null" @click="rate = Math.max(40, (rate ?? 120) - 1)">
            <Minus aria-hidden="true" />
          </RIconButton>
          <RIconButton label="One faster" size="xs" variant="outline" :disabled="rate === null" @click="rate = Math.min(240, (rate ?? 120) + 1)">
            <Plus aria-hidden="true" />
          </RIconButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tap {
  gap: 8px;
}

/* The beat lamp blinks in two steps at the tempo, and holds still under reduced motion. */
.tap__lamp {
  flex: none;
  width: 8px;
  height: 8px;
  background: var(--r-status-off);
}
.tap__lamp.is-beating {
  background: var(--r-signal);
  animation: tap-beat var(--beat) steps(1, end) infinite;
}
@keyframes tap-beat {
  0% {
    opacity: 1;
  }
  25% {
    opacity: 0.2;
  }
}
@media (prefers-reduced-motion: reduce) {
  .tap__lamp.is-beating {
    animation: none;
  }
}

.tap__body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column-reverse;
  gap: 8px;
  min-height: 0;
}

.tap__key {
  flex: none;
  height: 36px;
  border: 1px solid var(--r-ink);
  border-radius: var(--r-radius-control);
  background: var(--r-ink);
  color: var(--r-on-ink);
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-medium);
  touch-action: manipulation;
  user-select: none;
  -webkit-user-select: none;
  transition:
    background-color var(--r-duration-instant) var(--r-ease-out),
    color var(--r-duration-instant) var(--r-ease-out);
}
.tap__key:hover {
  background: var(--r-ink-hover);
}
.tap__key.is-down {
  background: var(--r-bg-surface);
  color: var(--r-text);
}

.tap__read {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.tap__rate {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.tap__digits {
  font-size: var(--r-text-3xl);
  line-height: 1;
}
.tap__digits.r-pixel {
  font-size: var(--r-text-3xl);
}

.tap__status {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}
.tap__word {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.tap__word.is-success {
  color: var(--r-success-text);
}
.tap__word.is-warning {
  color: var(--r-warning-text);
}
.tap__word.is-danger {
  color: var(--r-danger-text);
}
.tap__word.is-neutral {
  color: var(--r-text-secondary);
}

.tap__scale {
  position: relative;
  height: 10px;
  margin-top: 4px;
  background: var(--r-chart-track);
}
.tap__target {
  position: absolute;
  top: 0;
  bottom: 0;
  background: var(--r-success-soft);
  border-right: 1px solid var(--r-success);
  border-left: 1px solid var(--r-success);
}
.tap__marker {
  position: absolute;
  top: -3px;
  bottom: -3px;
  width: 2px;
  background: var(--r-ink);
  transform: translateX(-50%);
  transition: left var(--r-duration-base) var(--r-ease-out);
}
.tap__ends {
  display: flex;
  justify-content: space-between;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
}

.tap__nudge {
  gap: 4px;
}

/* Wide: a big square key on the left, the reading on the right. */
.tap--wide .tap__body {
  flex-direction: row;
  align-items: stretch;
  gap: 16px;
}
.tap--wide .tap__key {
  width: 104px;
  height: auto;
}
.tap--wide .tap__read {
  flex: 1;
  justify-content: center;
}
</style>
