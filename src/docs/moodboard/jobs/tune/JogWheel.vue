<script setup lang="ts">
/**
 * A jog wheel for finding an exact moment: a frame in an edit, a second of CCTV footage, the log
 * line where an incident starts. Turn the wheel around its centre (one step every 6°), use the
 * arrow keys (Shift for ten), Page keys for a minute, or click the strip to jump. The wheel
 * scrolls only while it has focus.
 */
import { computed, ref } from 'vue'
import { RButton, RReadout } from '@/design-system'
import { pad } from '../../kit'
import { capture, clamp, focusedWheel, pointerAngle, turn } from './shared'

interface LogLine {
  /** Seconds from the start of the window. */
  t: number
  level: 'INFO' | 'WARN' | 'ERROR'
  service: string
  text: string
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    meta?: string
    /** `timecode` frames at `fps` · `clock` seconds of a day · `log` seconds with a log beside. */
    kind: 'timecode' | 'clock' | 'log'
    fps?: number
    /** Window start, in seconds since midnight (clock, log). */
    from?: number
    /** Window length in steps. */
    length: number
    /** Starting position, in steps from the window start. */
    value?: number
    zone?: string
    /** Marks on the strip, in steps: motion events, errors. */
    events?: number[]
    eventLabel?: string
    lines?: LogLine[]
    /** Pixel digits for the readout. */
    pixel?: boolean
  }>(),
  { fps: 25, from: 0, value: 0, zone: 'WIB', events: () => [], eventLabel: 'event', lines: () => [], pixel: false },
)

const value = ref(props.value)
const marks = ref<number[]>([])
const wheel = ref<HTMLElement | null>(null)
const turning = ref(false)

const set = (v: number) => (value.value = clamp(Math.round(v), 0, props.length))

function clockText(s: number) {
  const t = ((s % 86400) + 86400) % 86400
  return `${pad(Math.floor(t / 3600))}:${pad(Math.floor((t % 3600) / 60))}:${pad(t % 60)}`
}

const readout = computed(() => {
  if (props.kind === 'timecode') {
    const f = value.value
    const s = Math.floor(f / props.fps)
    return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}:${pad(f % props.fps)}`
  }
  return clockText(props.from + value.value)
})
const valueText = computed(() => (props.kind === 'timecode' ? `Timecode ${readout.value}` : `${readout.value} ${props.zone}`))

/* ── Wheel: one step every 6°, so a full turn is 60 steps ─────────────────── */
const DEG = 6
let last = 0
let rest = 0
function onPointerdown(event: PointerEvent) {
  if (event.button !== 0 || !wheel.value) return
  event.preventDefault()
  wheel.value.focus({ preventScroll: true })
  capture(wheel.value, event)
  last = pointerAngle(event, wheel.value)
  rest = 0
  turning.value = true
}
function onPointermove(event: PointerEvent) {
  if (!turning.value || !wheel.value) return
  const now = pointerAngle(event, wheel.value)
  rest += turn(last, now) / DEG
  last = now
  const steps = Math.trunc(rest)
  if (steps) {
    set(value.value + steps)
    rest -= steps
  }
}
function onPointerup() {
  turning.value = false
}

const onWheel = focusedWheel((dir, event) => set(value.value - dir * (event.shiftKey ? 10 : 1)))

const big = computed(() => (props.kind === 'timecode' ? props.fps : 60))
function onKeydown(event: KeyboardEvent) {
  const step = event.shiftKey ? 10 : 1
  const keys: Record<string, number> = {
    ArrowRight: value.value + step,
    ArrowUp: value.value + step,
    ArrowLeft: value.value - step,
    ArrowDown: value.value - step,
    PageUp: value.value + big.value,
    PageDown: value.value - big.value,
    Home: 0,
    End: props.length,
  }
  if (!(event.key in keys)) return
  event.preventDefault()
  set(keys[event.key])
}

const SIZE = 132
const C = SIZE / 2
const ticks = Array.from({ length: 40 }, (_, i) => i * 9)
const angle = computed(() => (value.value * DEG) % 360)

/* ── Strip: the whole window, the events on it, click to jump ─────────────── */
const at = (v: number) => `${(v / props.length) * 100}%`
function onStrip(event: PointerEvent) {
  const box = (event.currentTarget as HTMLElement).getBoundingClientRect()
  set(((event.clientX - box.left) / box.width) * props.length)
}

function nextEvent() {
  const next = props.events.find((e) => e > value.value) ?? props.events[0]
  if (next !== undefined) set(next)
}
const eventIndex = computed(() => props.events.filter((e) => e <= value.value).length)

function addMark() {
  if (!marks.value.includes(value.value)) marks.value = [...marks.value, value.value].sort((a, b) => a - b)
}

const scale = computed(() => {
  const n = 4
  return Array.from({ length: n + 1 }, (_, i) => {
    const v = (props.length * i) / n
    if (props.kind === 'timecode') {
      const s = Math.floor(v / props.fps)
      return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`
    }
    return clockText(props.from + v).slice(0, 5)
  })
})

/* ── Log: the line at the cursor and its neighbours ──────────────────────── */
const lineAt = computed(() => {
  let found = 0
  props.lines.forEach((l, i) => {
    if (l.t <= value.value) found = i
  })
  return found
})
const shown = computed(() => {
  const from = clamp(lineAt.value - 2, 0, Math.max(0, props.lines.length - 5))
  return props.lines.slice(from, from + 5).map((l, k) => ({ ...l, i: from + k }))
})
</script>

<template>
  <div class="mk jog" :class="`jog--${kind}`">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span v-if="meta" class="r-label jog__meta">{{ meta }}</span>
    </div>

    <div class="jog__body mk-grow">
      <div class="jog__left">
        <RReadout
          v-if="kind !== 'log'"
          :label="kind === 'timecode' ? 'Timecode' : 'Playback'"
          :value="readout"
          :unit="kind === 'clock' ? zone : undefined"
          :font="pixel ? 'pixel' : 'mono'"
          :ghost="pixel"
          size="md"
        />
        <p v-else class="jog__clock">
          <span class="jog__time">{{ readout }}</span>
          <span class="mk-unit">{{ zone }}</span>
        </p>

        <div
          ref="wheel"
          class="jog__wheel"
          :class="{ 'is-turning': turning }"
          role="slider"
          tabindex="0"
          :aria-label="`${eyebrow}: jog wheel`"
          :aria-valuemin="0"
          :aria-valuemax="length"
          :aria-valuenow="value"
          :aria-valuetext="valueText"
          @pointerdown="onPointerdown"
          @pointermove="onPointermove"
          @pointerup="onPointerup"
          @pointercancel="onPointerup"
          @lostpointercapture="onPointerup"
          @wheel="onWheel"
          @keydown="onKeydown"
        >
          <svg :width="SIZE" :height="SIZE" :viewBox="`0 0 ${SIZE} ${SIZE}`" aria-hidden="true" focusable="false">
            <!-- A jog wheel is a physical rotary control: round by nature. -->
            <circle class="jog__rim" :cx="C" :cy="C" :r="C - 1" />
            <g :transform="`rotate(${angle} ${C} ${C})`">
              <rect v-for="t in ticks" :key="t" class="jog__tick" :x="C - 0.75" y="5" width="1.5" height="6" :transform="`rotate(${t} ${C} ${C})`" />
              <rect class="jog__dimple" :x="C - 5" y="16" width="10" height="10" />
            </g>
            <circle class="jog__hub" :cx="C" :cy="C" r="16" />
          </svg>
        </div>
      </div>

      <ol v-if="kind === 'log'" class="jog__log" aria-live="polite">
        <li v-for="l in shown" :key="l.i" class="jog__line" :class="{ 'is-on': l.i === lineAt }">
          <span class="jog__lt">{{ clockText(from + l.t) }}</span>
          <span class="jog__lv" :class="`is-${l.level.toLowerCase()}`">{{ l.level }}</span>
          <span class="jog__lx">
            <span class="jog__svc">{{ l.service }}</span>
            <span class="jog__msg">{{ l.text }}</span>
          </span>
        </li>
      </ol>
    </div>

    <div class="jog__strip" aria-hidden="true" @pointerdown="onStrip">
      <span v-for="e in events" :key="`e${e}`" class="jog__event" :style="{ left: at(e) }" />
      <span v-for="m in marks" :key="`m${m}`" class="jog__mark" :style="{ left: at(m) }" />
      <span class="jog__head" :style="{ left: at(value) }" />
    </div>
    <div class="jog__scale" aria-hidden="true">
      <span v-for="s in scale" :key="s">{{ s }}</span>
    </div>

    <div v-if="kind !== 'log'" class="mk-row mk-between jog__foot">
      <template v-if="kind === 'timecode'">
        <span class="r-label">{{ marks.length }} {{ marks.length === 1 ? 'mark' : 'marks' }}</span>
        <RButton size="xs" variant="outline" @click="addMark">Mark this frame</RButton>
      </template>
      <template v-else>
        <span class="r-label">{{ eventLabel }} {{ eventIndex }} of {{ events.length }}</span>
        <RButton size="xs" variant="outline" @click="nextEvent">Next {{ eventLabel.toLowerCase() }}</RButton>
      </template>
    </div>
  </div>
</template>

<style scoped>
.jog {
  gap: 8px;
  container-type: inline-size;
}

.jog__meta {
  flex: none;
}

.jog__body {
  display: flex;
  gap: 16px;
  min-height: 0;
}

.jog__left {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}
.jog--log .jog__left {
  flex: none;
  justify-content: center;
}
.jog__left > :first-child {
  align-self: stretch;
}

.jog__clock {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.jog__time {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xl);
  font-weight: var(--r-weight-medium);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

.jog__wheel {
  flex: none;
  cursor: grab;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}
.jog__wheel.is-turning {
  cursor: grabbing;
}
.jog__wheel:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: 2px;
}
.jog__wheel svg {
  display: block;
}

.jog__rim {
  fill: var(--r-bg-muted);
  stroke: var(--r-border-strong);
  stroke-width: 1;
}
.jog__wheel:hover .jog__rim,
.jog__wheel.is-turning .jog__rim {
  stroke: var(--r-text-tertiary);
}
.jog__tick {
  fill: var(--r-border-strong);
}
.jog__dimple {
  fill: var(--r-ink);
}
.jog__hub {
  fill: var(--r-bg-surface);
  stroke: var(--r-border);
  stroke-width: 1;
}

/* The strip: the whole window, events as squares, the playhead as an ink rule. */
.jog__strip {
  position: relative;
  flex: none;
  height: 16px;
  border: 1px solid var(--r-border-strong);
  background: var(--r-bg-muted);
  cursor: pointer;
}
.jog__event,
.jog__mark {
  position: absolute;
  top: 4px;
  width: 6px;
  height: 6px;
  transform: translateX(-50%);
}
.jog__event {
  background: var(--r-text-tertiary);
}
.jog--log .jog__event {
  background: var(--r-status-critical);
}
.jog__mark {
  top: 3px;
  width: 2px;
  height: 8px;
  background: var(--r-brand);
}
.jog__head {
  position: absolute;
  top: -4px;
  bottom: -4px;
  width: 2px;
  background: var(--r-ink);
  transform: translateX(-50%);
}

.jog__scale {
  display: flex;
  justify-content: space-between;
  margin-top: -4px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
}

.jog__foot {
  min-height: 24px;
}

/* Log beside the wheel. */
.jog__log {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  border-top: 1px solid var(--r-border-subtle);
}
.jog__line {
  display: grid;
  grid-template-columns: auto 40px minmax(0, 1fr);
  align-items: baseline;
  gap: 8px;
  padding: 6px 6px 6px 8px;
  border-bottom: 1px solid var(--r-border-subtle);
  border-left: 2px solid transparent;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}
.jog__line.is-on {
  border-left-color: var(--r-brand);
  background: var(--r-bg-selected);
  color: var(--r-text);
}
.jog__lt,
.jog__lv {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
}
.jog__lt {
  color: var(--r-text-tertiary);
}
.jog__lv {
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.04em;
}
.jog__lv.is-error {
  color: var(--r-danger-text);
}
.jog__lv.is-warn {
  color: var(--r-warning-text);
}
.jog__lx {
  display: flex;
  gap: 6px;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
}
.jog__svc {
  flex: none;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  line-height: 18px;
}
.jog__msg {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Narrow (a phone's two columns): the service sits over the message, so both stay readable. */
@container (max-width: 440px) {
  .jog__body {
    gap: 10px;
  }
  .jog__line {
    grid-template-columns: auto minmax(0, 1fr);
    gap: 2px 6px;
    padding: 4px 4px 4px 6px;
  }
  .jog__lt {
    display: none;
  }
  .jog__lx {
    flex-direction: column;
    gap: 0;
  }
  .jog__svc {
    line-height: 14px;
  }
}
</style>
