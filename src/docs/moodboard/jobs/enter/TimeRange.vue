<script setup lang="ts">
/**
 * A window of time: two typed times and a day strip that draws the window, across midnight when
 * it has to. Windows already on the day sit on the strip too, so an overlap shows before it is
 * saved, with the minutes it costs.
 */
import { computed, ref, useId } from 'vue'
import { ArrowRight, CircleAlert, MoonStar } from 'lucide-vue-next'
import { RInput } from '@/design-system'
import type { Zone } from '../../kit'
import { span, toMin } from './shared'

interface Busy {
  from: string
  to: string
  label: string
  /** Hatched: a maintenance window, the only thing hatching means besides forecast. */
  hatch?: boolean
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    meta?: string
    from: string
    to: string
    zone?: Zone
    step?: number
    busy?: Busy[]
    /** What the window is called in the overlap message: "this window", "the new shift". */
    noun?: string
  }>(),
  { zone: 'WIB', step: 15, busy: () => [], noun: 'This window' },
)

const uid = useId()
const a = ref<string | number | null>(props.from)
const b = ref<string | number | null>(props.to)
const start = computed(() => (typeof a.value === 'string' ? toMin(a.value) : null))
const end = computed(() => (typeof b.value === 'string' ? toMin(b.value) : null))

/** A window on the round day, cut at midnight into one or two pieces of [0, 1440). */
function pieces(s: number, e: number): [number, number][] {
  if (e > s) return [[s, e]]
  return [
    [s, 1440],
    [0, e],
  ].filter(([x, y]) => y > x) as [number, number][]
}

const length = computed(() => (start.value == null || end.value == null ? 0 : (end.value - start.value + 1440) % 1440))
const own = computed(() => (start.value == null || end.value == null || !length.value ? [] : pieces(start.value, end.value)))
const others = computed(() =>
  props.busy.map((w) => ({ ...w, parts: pieces(toMin(w.from) ?? 0, toMin(w.to) ?? 0) })),
)

const clash = computed(() => {
  for (const w of others.value) {
    let minutes = 0
    for (const [x, y] of own.value) for (const [p, q] of w.parts) minutes += Math.max(0, Math.min(y, q) - Math.max(x, p))
    if (minutes) return { w, minutes }
  }
  return null
})

const message = computed(() => {
  if (start.value == null || end.value == null) return { tone: 'error', text: 'Type both times, like 2200 and 0200.' }
  if (!length.value) return { tone: 'error', text: 'Start and end are the same time.' }
  if (clash.value) return { tone: 'error', text: `${props.noun} overlaps ${clash.value.w.label} by ${span(clash.value.minutes)}.` }
  const night = end.value <= start.value
  return { tone: night ? 'night' : 'plain', text: `${span(length.value)}${night ? ', across midnight' : ''}` }
})

const pct = (m: number) => `${(m / 1440) * 100}%`
const HOURS = Array.from({ length: 24 }, (_, i) => i)
</script>

<template>
  <div class="mk en-root tr">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span class="en-meta">{{ meta ? `${meta} · ${zone}` : zone }}</span>
    </div>

    <div class="tr__fields">
      <RInput
        v-model="a"
        type="time"
        class="tr__input"
        :step="step * 60"
        :invalid="!!clash"
        :aria-label="`Start, ${zone}`"
        :aria-describedby="`${uid}-msg`"
      />
      <ArrowRight class="tr__arrow" aria-hidden="true" />
      <RInput
        v-model="b"
        type="time"
        class="tr__input"
        :step="step * 60"
        :invalid="!!clash"
        :aria-label="`End, ${zone}`"
        :aria-describedby="`${uid}-msg`"
      />
      <p class="tr__length" aria-hidden="true">
        <span class="tr__fig">{{ length ? span(length) : '—' }}</span>
      </p>
    </div>

    <div class="tr__strip mk-end" aria-hidden="true">
      <div class="tr__track">
        <span v-for="h in HOURS" :key="h" class="tr__hour" />
        <template v-for="w in others" :key="w.label">
          <span
            v-for="(p, i) in w.parts"
            :key="i"
            class="tr__busy"
            :class="{ 'r-hatch': w.hatch }"
            :style="{ left: pct(p[0]), width: pct(p[1] - p[0]) }"
          />
        </template>
        <span
          v-for="(p, i) in own"
          :key="`own-${i}`"
          class="tr__own"
          :class="{ 'is-clash': clash }"
          :style="{ left: pct(p[0]), width: pct(p[1] - p[0]) }"
        />
      </div>
      <div class="tr__ticks">
        <span v-for="t in [0, 6, 12, 18, 24]" :key="t" :style="{ left: pct(t * 60) }">{{ String(t).padStart(2, '0') }}</span>
      </div>
    </div>

    <p :id="`${uid}-msg`" class="en-msg" :class="{ 'en-msg--error': message.tone === 'error' }" aria-live="polite">
      <CircleAlert v-if="message.tone === 'error'" aria-hidden="true" />
      <MoonStar v-else-if="message.tone === 'night'" aria-hidden="true" />
      <span class="mk-truncate">{{ message.text }}</span>
      <span v-if="busy.length && message.tone !== 'error'" class="tr__legend mk-truncate">
        <span class="tr__key" :class="{ 'r-hatch': busy[0].hatch }" />{{ busy[0].label }} {{ busy[0].from }}–{{ busy[0].to }}
      </span>
    </p>
  </div>
</template>

<style scoped>
.tr__fields {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.tr {
  container-type: inline-size;
}

.tr__input {
  flex: 0 1 96px;
  min-width: 72px;
}

.tr__input :deep(.r-input__control) {
  font-weight: var(--r-weight-semibold);
}

.tr__arrow {
  flex: none;
  width: 14px;
  height: 14px;
  color: var(--r-text-tertiary);
}

.tr__length {
  display: none;
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-align: right;
  white-space: nowrap;
}

@container (min-width: 420px) {
  .tr__length {
    display: block;
  }
}

.tr__fig {
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  font-variant-numeric: tabular-nums;
}

.tr__strip {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

/* The day as 24 ruled hours; windows lie on top. */
.tr__track {
  position: relative;
  display: flex;
  gap: 1px;
  height: 18px;
}

.tr__hour {
  flex: 1;
  background: var(--r-bg-track);
}

.tr__busy,
.tr__own {
  position: absolute;
  top: 0;
  bottom: 0;
}

.tr__busy {
  border: 1px solid var(--r-border-strong);
  background-color: var(--r-bg-surface);
}

.tr__own {
  top: 4px;
  bottom: 4px;
  background: var(--r-brand);
  transition:
    left var(--r-duration-fast) var(--r-ease-out),
    width var(--r-duration-fast) var(--r-ease-out);
}

.tr__own.is-clash {
  background: var(--r-danger);
}

.tr__ticks {
  position: relative;
  height: 12px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  line-height: 12px;
}

.tr__ticks span {
  position: absolute;
  transform: translateX(-50%);
}

.tr__ticks span:first-child {
  transform: none;
}

.tr__ticks span:last-child {
  transform: translateX(-100%);
}

.tr__legend {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  padding-left: 8px;
}

.tr__key {
  flex: none;
  width: 12px;
  height: 8px;
  border: 1px solid var(--r-border-strong);
}
</style>
