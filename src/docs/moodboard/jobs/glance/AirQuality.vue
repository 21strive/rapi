<script setup lang="ts">
/**
 * Air as a figure, a band and a word. The band shows where the reading falls between good and
 * hazardous, only the band it falls in is lit, and the word says what to do about it. Keys switch
 * the pollutant or the room; on the smallest tile a press steps to the next one.
 */
import { computed, ref } from 'vue'
import { ChevronRight } from 'lucide-vue-next'
import { RSegmented, RStatus } from '@/design-system'
import { num, pad } from '../../kit'

type AqLevel = 'good' | 'warning' | 'serious' | 'critical' | 'hazard'

interface Band {
  /** Upper edge of the band in the reading's unit. The last band is open-ended. */
  upTo: number
  word: string
  level: AqLevel
}

interface Reading {
  id: string
  /** "PM2.5", "Merapi room". */
  label: string
  value: number
  unit: string
  decimals?: number
  bands: Band[]
  /** What to do at this reading: "Open a window". */
  advice?: string
}

const props = withDefaults(
  defineProps<{
    place: string
    readings: Reading[]
    orientation?: 'row' | 'column'
    /** The whole tile is one button that steps through the readings. */
    cycle?: boolean
    /** Print the band edges under the band. */
    edges?: boolean
  }>(),
  { orientation: 'row', cycle: false, edges: false },
)

const id = ref(props.readings[0]?.id)
const reading = computed(() => props.readings.find((r) => r.id === id.value) ?? props.readings[0])
const index = computed(() => props.readings.findIndex((r) => r.id === reading.value.id))
const bandIndex = computed(() => {
  const i = reading.value.bands.findIndex((b) => reading.value.value <= b.upTo)
  return i < 0 ? reading.value.bands.length - 1 : i
})
const band = computed(() => reading.value.bands[bandIndex.value])

/* Where the marker sits: each band takes an equal share, the value is linear inside its band. */
const markerAt = computed(() => {
  const bands = reading.value.bands
  const i = bandIndex.value
  const lo = i === 0 ? 0 : bands[i - 1].upTo
  const hi = i === bands.length - 1 ? Math.max(bands[i].upTo, lo * 1.5) : bands[i].upTo
  const inside = Math.max(0, Math.min(1, (reading.value.value - lo) / Math.max(1e-9, hi - lo)))
  return ((i + inside) / bands.length) * 100
})

const TONE: Record<AqLevel, 'success' | 'warning' | 'danger'> = {
  good: 'success',
  warning: 'warning',
  serious: 'danger',
  critical: 'danger',
  hazard: 'danger',
}
const FILL: Record<AqLevel, string> = {
  good: 'var(--r-status-good)',
  warning: 'var(--r-status-warning)',
  serious: 'var(--r-status-serious)',
  critical: 'var(--r-status-critical)',
  hazard: 'var(--r-danger-hover)',
}

const options = computed(() => props.readings.map((r) => ({ label: r.label, value: r.id })))
const said = ref('')
function next(step = 1) {
  const n = props.readings.length
  id.value = props.readings[(index.value + step + n) % n].id
  said.value = `${reading.value.label}, ${num(reading.value.value, reading.value.decimals ?? 0)} ${reading.value.unit}, ${band.value.word}`
}
function onKeydown(event: KeyboardEvent) {
  const steps: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }
  if (!(event.key in steps)) return
  event.preventDefault()
  next(steps[event.key])
}
</script>

<template>
  <div class="mk aq" :class="[`aq--${orientation}`, { 'aq--cycle': cycle, 'mk--bleed': cycle }]">
    <component
      :is="cycle ? 'button' : 'div'"
      :type="cycle ? 'button' : undefined"
      class="aq__face"
      :class="{ 'mk-reset': cycle }"
      v-on="cycle ? { click: () => next(1), keydown: onKeydown } : {}"
    >
      <span class="mk-row mk-between aq__head">
        <span class="r-label mk-truncate">{{ place }}</span>
        <span v-if="cycle" class="aq__pager" aria-hidden="true">
          {{ pad(index + 1) }}/{{ pad(readings.length) }}<ChevronRight :size="12" />
        </span>
        <RStatus v-else-if="orientation === 'row'" class="keep" size="sm" :tone="TONE[band.level]" :label="band.word" />
      </span>

      <span class="aq__body">
        <span v-if="orientation === 'column'" class="aq__vband" aria-hidden="true">
          <span
            v-for="(b, i) in reading.bands"
            :key="b.word"
            class="aq__seg"
            :class="{ 'is-on': i === bandIndex }"
            :style="{ '--fill': FILL[b.level] }"
          />
          <span class="aq__marker" :style="{ bottom: `${markerAt}%` }" />
        </span>

        <span class="aq__read">
          <span v-if="cycle || orientation === 'column'" class="aq__item mk-truncate">{{ reading.label }}</span>
          <span class="aq__figure">
            <span class="mk-fig">{{ num(reading.value, reading.decimals ?? 0) }}</span>
            <span class="mk-unit">{{ reading.unit }}</span>
            <span v-if="!cycle && orientation === 'row'" class="aq__what r-label">{{ reading.label }}</span>
          </span>
          <RStatus v-if="cycle || orientation === 'column'" size="sm" :tone="TONE[band.level]" :label="band.word" />
          <span v-if="reading.advice && !cycle" class="aq__advice">{{ reading.advice }}</span>
        </span>
      </span>

      <span v-if="orientation === 'row'" class="aq__band" aria-hidden="true">
        <span class="aq__segs">
          <span
            v-for="(b, i) in reading.bands"
            :key="b.word"
            class="aq__seg"
            :class="{ 'is-on': i === bandIndex }"
            :style="{ '--fill': FILL[b.level] }"
          />
          <span class="aq__marker" :style="{ left: `${markerAt}%` }" />
        </span>
        <span v-if="edges" class="aq__edges">
          <span>0</span>
          <span v-for="b in reading.bands.slice(0, -1)" :key="b.word">{{ num(b.upTo, b.upTo % 1 ? 1 : 0) }}</span>
        </span>
      </span>

    </component>
    <RSegmented
      v-if="!cycle && readings.length > 1"
      v-model="id"
      :options="options"
      size="sm"
      block
      :label="`${place}, reading`"
    />
    <p v-if="cycle" class="r-sr-only" aria-live="polite">{{ said }}</p>
  </div>
</template>

<style scoped>
.aq__face {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  min-height: 0;
}

.aq--cycle .aq__face {
  height: 100%;
  padding: 4px 12px 12px;
  cursor: pointer;
  transition: background-color var(--r-duration-fast) var(--r-ease-out);
}

.aq--cycle .aq__face:hover {
  background: var(--r-bg-hover);
}

.aq--cycle .aq__face:focus-visible {
  outline-offset: -2px;
}

.aq__head {
  flex: none;
}

.aq__body {
  display: flex;
  flex: 1 1 auto;
  gap: 12px;
  min-width: 0;
  min-height: 0;
}

.aq__read {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 4px;
  min-width: 0;
}

.aq--row .aq__read {
  justify-content: flex-start;
}

.aq__item {
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
}

.aq__figure {
  display: flex;
  align-items: baseline;
  gap: 4px;
  min-width: 0;
}

.aq__figure .mk-fig {
  font-size: var(--r-text-3xl);
}

.aq--cycle .aq__figure .mk-fig {
  font-size: var(--r-text-2xl);
}

.aq__what {
  margin-left: 6px;
}

.aq__advice {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

.aq__band {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: auto;
}

.aq__segs {
  position: relative;
  display: flex;
  gap: 2px;
  height: 8px;
}

.aq__seg {
  flex: 1 1 0;
  background: color-mix(in srgb, var(--fill) 26%, var(--r-chart-track));
  transition: background-color var(--r-duration-fast) var(--r-ease-out);
}

.aq__seg.is-on {
  background: var(--fill);
}

.aq__marker {
  position: absolute;
  top: -4px;
  bottom: -4px;
  width: 2px;
  background: var(--r-text);
  transform: translateX(-1px);
  transition:
    left var(--r-duration-base) var(--r-ease-out),
    bottom var(--r-duration-base) var(--r-ease-out);
}

.aq__edges {
  position: relative;
  display: flex;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.aq__edges span {
  flex: 1 1 0;
  min-width: 0;
}

/* Column: the band stands on the left, good at the bottom. */
.aq__vband {
  position: relative;
  display: flex;
  flex: none;
  flex-direction: column-reverse;
  gap: 2px;
  width: 10px;
}

.aq__vband .aq__marker {
  top: auto;
  right: -4px;
  left: -4px;
  width: auto;
  height: 2px;
  transform: translateY(1px);
}

.aq__pager {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 2px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
}

.aq--cycle .aq__face:hover .aq__pager,
.aq--cycle .aq__face:focus-visible .aq__pager {
  color: var(--r-text);
}

/* The status word stays whole; the label beside it truncates instead. */
.keep {
  flex: none;
}
</style>
