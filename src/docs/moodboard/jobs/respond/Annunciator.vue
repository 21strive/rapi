<script setup lang="ts">
/**
 * An annunciator panel: a grid of labelled windows, one per condition, as in a control room. A
 * new alarm flashes in two steps; acknowledging it makes it burn steady; reset puts out the ones
 * that are acknowledged. The horn line says whether the room is still being called. Arrow keys
 * move between windows; Enter or Space acknowledges one.
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { Volume2, VolumeX } from 'lucide-vue-next'
import { RButton } from '@/design-system'
import { useTick } from '../../kit'
import { stamp } from './shared'

interface Window {
  id: string
  /** Mono caps, two short lines at most: "Bus 150 kV · low volt". */
  label: string
  tone?: 'warning' | 'danger'
  state?: 'off' | 'alarm' | 'acked'
}

const props = withDefaults(
  defineProps<{
    title: string
    cols: number
    windows: Window[]
    /** A window that trips by itself after this many seconds on screen. */
    trip?: { id: string; after: number }
  }>(),
  {},
)

const list = ref(props.windows.map((w) => ({ ...w, tone: w.tone ?? 'warning', state: w.state ?? 'off' })))
const focusIndex = ref(Math.max(0, list.value.findIndex((w) => w.state === 'alarm')))
const testing = ref(false)
const lastAck = ref<string | null>(null)
const grid = ref<HTMLElement | null>(null)

const unacked = computed(() => list.value.filter((w) => w.state === 'alarm').length)
const lit = computed(() => list.value.filter((w) => w.state !== 'off').length)

/* One window trips on its own, once, a little while after the panel is on screen. */
const tick = useTick(1000)
let seen = 0
watch(tick, () => {
  if (!props.trip) return
  seen++
  if (seen !== props.trip.after) return
  const w = list.value.find((x) => x.id === props.trip!.id)
  if (w && w.state === 'off') w.state = 'alarm'
})

function ack(index: number) {
  const w = list.value[index]
  focusIndex.value = index
  if (w.state !== 'alarm') return
  w.state = 'acked'
  lastAck.value = stamp(true)
}

function ackAll() {
  list.value.forEach((w) => {
    if (w.state === 'alarm') w.state = 'acked'
  })
  lastAck.value = stamp(true)
}

function reset() {
  list.value.forEach((w) => {
    if (w.state === 'acked') w.state = 'off'
  })
}

let testTimer: number | undefined
onBeforeUnmount(() => window.clearTimeout(testTimer))
function lampTest() {
  testing.value = true
  window.clearTimeout(testTimer)
  testTimer = window.setTimeout(() => (testing.value = false), 1500)
}

function move(event: KeyboardEvent) {
  const n = list.value.length
  const steps: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: props.cols, ArrowUp: -props.cols }
  let next: number | undefined
  if (event.key in steps) next = focusIndex.value + steps[event.key]
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = n - 1
  if (next === undefined || next < 0 || next >= n) return
  event.preventDefault()
  focusIndex.value = next
  grid.value?.querySelectorAll<HTMLElement>('button')[next]?.focus()
}

const words = { off: 'normal', alarm: 'alarm, not acknowledged', acked: 'alarm, acknowledged' }
</script>

<template>
  <div class="mk ann">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ title }}</span>
      <span class="ann__horn" :class="{ 'is-on': unacked > 0 }">
        <component :is="unacked ? Volume2 : VolumeX" :size="12" aria-hidden="true" />
        {{ unacked ? 'Horn on' : 'Horn off' }}
      </span>
    </div>

    <div
      ref="grid"
      class="ann__grid"
      role="group"
      :aria-label="`${title}: ${lit} lit, ${unacked} not acknowledged`"
      :style="{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }"
      @keydown="move"
    >
      <button
        v-for="(w, i) in list"
        :key="w.id"
        type="button"
        class="ann__win mk-reset"
        :class="[`r-tone-${w.tone}`, `is-${testing ? 'test' : w.state}`]"
        :tabindex="i === focusIndex ? 0 : -1"
        :aria-label="`${w.label}, ${words[w.state]}`"
        @click="ack(i)"
        @focus="focusIndex = i"
      >
        <span class="ann__label">{{ w.label }}</span>
        <span v-if="w.state === 'alarm'" class="ann__new" aria-hidden="true">New</span>
      </button>
    </div>

    <div class="ann__foot">
      <span class="r-label mk-truncate" aria-live="polite">
        {{ unacked ? `${unacked} new · ${lit} lit` : lastAck ? `Acknowledged ${lastAck}` : `${lit} lit` }}
      </span>
      <span class="mk-row ann__keys">
        <RButton size="xs" variant="ghost" @click="lampTest">Test</RButton>
        <RButton size="xs" variant="outline" :disabled="!list.some((w) => w.state === 'acked')" @click="reset">Reset</RButton>
        <RButton size="xs" tone="signal" :disabled="!unacked" @click="ackAll">Acknowledge</RButton>
      </span>
    </div>
  </div>
</template>

<style scoped>
.ann {
  gap: 8px;
}

.ann__horn {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 6px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.ann__horn.is-on {
  color: var(--r-text);
}

.ann__grid {
  display: grid;
  flex: 1 1 auto;
  min-height: 0;
  grid-auto-rows: minmax(0, 1fr);
  gap: 4px;
}

.ann__win {
  position: relative;
  display: grid;
  min-width: 0;
  min-height: 0;
  place-items: center;
  padding: 10px 6px 4px;
  border: 1px solid var(--r-border);
  background: var(--r-bg-muted);
  color: var(--r-text-tertiary);
  cursor: pointer;
}

.ann__win:hover {
  border-color: var(--r-border-strong);
}

.ann__label {
  display: -webkit-box;
  overflow: hidden;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  line-height: 1.25;
  letter-spacing: 0.06em;
  text-align: center;
  text-transform: uppercase;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.ann__win.is-acked,
.ann__win.is-alarm,
.ann__win.is-test {
  border-color: var(--tone-solid);
  background: var(--tone-solid);
  color: var(--tone-on-solid);
}

.ann__win.is-alarm {
  animation: ann-flash 1s linear infinite;
}

@keyframes ann-flash {
  0%,
  49% {
    background: var(--tone-solid);
    color: var(--tone-on-solid);
  }
  50%,
  100% {
    background: color-mix(in srgb, var(--tone-solid) 18%, var(--r-bg-surface));
    color: var(--tone-text);
  }
}

/* "New" in the corner: the state is in words as well as in the flashing. */
.ann__new {
  position: absolute;
  top: 2px;
  left: 4px;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.06em;
  line-height: 1;
  text-transform: uppercase;
}

.ann__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.ann__keys {
  flex: none;
  gap: 4px;
}

@media (prefers-reduced-motion: reduce) {
  .ann__win.is-alarm {
    animation: none;
  }
}
</style>
