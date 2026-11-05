<script setup lang="ts">
/**
 * A level set on a bar of LED segments: lights, a runway's intensity step, an infrared lamp, a
 * conveyor's speed. Light and speed are judged by eye, so the bar is the control: click or drag
 * across the segments (click the top lit one again to step down), or use the arrow keys, Home
 * and End. The power key turns it off and back to the last level.
 */
import { computed, ref, useId } from 'vue'
import { ChevronRight, Fan, Power } from 'lucide-vue-next'
import { RIconButton } from '@/design-system'
import { capture, clamp } from './shared'

const props = withDefaults(
  defineProps<{
    label: string
    sub?: string
    steps: number
    value: number
    orientation?: 'vertical' | 'horizontal'
    /** The big readout for a level, e.g. "60" or "Step 3". */
    readout: (level: number) => string
    unit?: string
    note?: (level: number) => string
    /** Printed beside each segment, bottom to top (or left to right). */
    stepLabels?: string[]
    /** Something that moves at the set speed. */
    indicator?: 'fan' | 'conveyor'
    power?: boolean
    pixel?: boolean
    tone?: 'ink' | 'brand'
    /** The readout sits in the head row (small tiles). */
    compact?: boolean
  }>(),
  { orientation: 'vertical', power: true, pixel: false, tone: 'ink', compact: false },
)

const id = useId()
const level = ref(props.value)
let last = props.value || Math.ceil(props.steps / 2)
const bar = ref<HTMLElement | null>(null)
const vertical = computed(() => props.orientation === 'vertical')

function set(v: number) {
  level.value = clamp(Math.round(v), 0, props.steps)
  if (level.value > 0) last = level.value
}

/* ── Pointer: the segment under the pointer; the top lit one again steps down ── */
let dragging = false
let downAt = -1
function segmentAt(event: PointerEvent) {
  const box = bar.value!.getBoundingClientRect()
  const f = vertical.value ? 1 - (event.clientY - box.top) / box.height : (event.clientX - box.left) / box.width
  return clamp(Math.floor(f * props.steps), 0, props.steps - 1)
}
function onPointerdown(event: PointerEvent) {
  if (event.button !== 0 || !bar.value) return
  event.preventDefault()
  bar.value.focus({ preventScroll: true })
  capture(bar.value, event)
  dragging = true
  downAt = segmentAt(event)
  set(downAt + 1 === level.value ? downAt : downAt + 1)
}
function onPointermove(event: PointerEvent) {
  if (!dragging) return
  const i = segmentAt(event)
  if (i !== downAt) {
    downAt = -2
    set(i + 1)
  }
}
function onPointerup() {
  dragging = false
}

function onKeydown(event: KeyboardEvent) {
  const map: Record<string, number> = {
    ArrowUp: level.value + 1,
    ArrowRight: level.value + 1,
    ArrowDown: level.value - 1,
    ArrowLeft: level.value - 1,
    PageUp: level.value + 3,
    PageDown: level.value - 3,
    Home: 0,
    End: props.steps,
  }
  if (!(event.key in map)) return
  event.preventDefault()
  set(map[event.key])
}

function togglePower() {
  if (level.value > 0) level.value = 0
  else set(last)
}

const text = computed(() => props.readout(level.value))
const noteText = computed(() => props.note?.(level.value) ?? '')
/** One turn of the fan, or one chevron of belt, per this many seconds. */
const period = computed(() => (level.value ? `${(1.6 / level.value).toFixed(2)}s` : '0s'))
</script>

<template>
  <div class="mk led" :class="[`led--${orientation}`, `led--${tone}`, { 'led--compact': compact }]" :style="{ '--period': period }">
    <div class="mk-row mk-between">
      <span :id="`${id}-label`" class="r-label mk-truncate">{{ label }}</span>
      <Fan v-if="indicator === 'fan'" class="led__fan" :class="{ 'is-on': level > 0 }" :size="16" aria-hidden="true" />
      <p v-if="compact" class="led__read led__read--head">
        <span :class="pixel ? 'led__fig r-pixel' : 'led__fig mk-fig'">{{ text }}</span>
        <span v-if="unit && level > 0" class="mk-unit">{{ unit }}</span>
      </p>
    </div>

    <p v-if="!compact" class="led__read">
      <span :class="pixel ? 'led__fig r-pixel' : 'led__fig mk-fig'">{{ text }}</span>
      <span v-if="unit && level > 0" class="mk-unit">{{ unit }}</span>
    </p>

    <div v-if="indicator === 'conveyor'" class="led__belt" :class="{ 'is-on': level > 0 }" aria-hidden="true">
      <span class="led__chevrons">
        <ChevronRight v-for="n in 8" :key="n" :size="14" />
      </span>
    </div>

    <div class="led__body" :class="{ 'mk-grow': vertical }">
      <div v-if="stepLabels && vertical" class="led__labels" aria-hidden="true">
        <span v-for="(s, i) in stepLabels" :key="i" :class="{ 'is-on': i < level }">{{ s }}</span>
      </div>
      <div
        ref="bar"
        class="led__bar"
        role="slider"
        tabindex="0"
        :aria-orientation="orientation"
        :aria-labelledby="`${id}-label`"
        :aria-valuemin="0"
        :aria-valuemax="steps"
        :aria-valuenow="level"
        :aria-valuetext="[text, level > 0 ? unit : ''].filter(Boolean).join(' ')"
        @pointerdown="onPointerdown"
        @pointermove="onPointermove"
        @pointerup="onPointerup"
        @pointercancel="onPointerup"
        @lostpointercapture="onPointerup"
        @keydown="onKeydown"
      >
        <span v-for="n in steps" :key="n" class="led__seg" :class="{ 'is-on': n <= level }" />
      </div>
    </div>
    <div v-if="stepLabels && !vertical" class="led__labels led__labels--row" aria-hidden="true">
      <span v-for="(s, i) in stepLabels" :key="i" :class="{ 'is-on': i < level }">{{ s }}</span>
    </div>

    <div class="led__foot">
      <p v-if="noteText || sub" class="led__note">{{ noteText || sub }}</p>
      <RIconButton v-if="power" :label="level > 0 ? 'Turn off' : 'Turn on'" size="xs" :variant="level > 0 ? 'solid' : 'outline'" :pressed="level > 0" @click="togglePower">
        <Power aria-hidden="true" />
      </RIconButton>
    </div>
  </div>
</template>

<style scoped>
.led {
  gap: 8px;
}

.led__read {
  display: flex;
  align-items: baseline;
  gap: 4px;
  min-width: 0;
}
.led__fig {
  font-size: var(--r-text-2xl);
  line-height: 1;
  white-space: nowrap;
}
.led__read--head {
  flex: none;
}
.led__read--head .led__fig {
  font-size: var(--r-text-xl);
}

.led__body {
  display: flex;
  gap: 8px;
  min-height: 0;
}

.led__bar {
  display: flex;
  flex: 1 1 auto;
  gap: 2px;
  cursor: pointer;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}
.led__bar:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: 3px;
}
.led--vertical .led__bar {
  flex-direction: column-reverse;
  max-width: 64px;
  margin: 0 auto;
}
.led--horizontal .led__bar {
  height: 22px;
}

.led__seg {
  flex: 1 1 0;
  min-width: 0;
  min-height: 0;
  background: var(--r-chart-track);
  transition: background-color var(--r-duration-instant) var(--r-ease-out);
}
.led__seg.is-on {
  background: var(--r-ink);
}
.led--brand .led__seg.is-on {
  background: var(--r-brand);
}

.led__labels {
  display: flex;
  flex-direction: column-reverse;
  justify-content: space-around;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
  text-align: right;
}
.led__labels .is-on {
  color: var(--r-text);
}
.led__labels--row {
  flex-direction: row;
  margin-top: -4px;
}
.led__labels--row span {
  flex: 1;
  text-align: center;
}

.led__foot {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
  margin-top: auto;
}
.led__note {
  min-width: 0;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.35;
}

/* Live indicators move at the set speed; under reduced motion they hold still. */
.led__fan {
  color: var(--r-text-tertiary);
}
.led__fan.is-on {
  color: var(--r-text);
  animation: led-spin var(--period) linear infinite;
}
@keyframes led-spin {
  to {
    transform: rotate(360deg);
  }
}

.led__belt {
  height: 16px;
  overflow: hidden;
  border-top: 1px solid var(--r-border);
  border-bottom: 1px solid var(--r-border);
  color: var(--r-text-tertiary);
}
.led__chevrons {
  display: flex;
  width: calc(100% + 18px);
  margin-left: -18px;
}
.led__chevrons svg {
  flex: none;
  width: 18px;
  height: 14px;
}
.led__belt.is-on {
  color: var(--r-text);
}
.led__belt.is-on .led__chevrons {
  animation: led-belt var(--period) linear infinite;
}
@keyframes led-belt {
  to {
    transform: translateX(18px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .led__fan.is-on,
  .led__belt.is-on .led__chevrons {
    animation: none;
  }
}
</style>
