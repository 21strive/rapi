<script setup lang="ts">
/**
 * The next twelve hours of weather for one place: the hour under the pointer in figures, the
 * chance of rain as columns. Run a finger along the hours, or arrow through them, and the
 * figures follow. Where there is a rule (a spray window, a crane limit) each hour says whether
 * it holds.
 */
import { computed, ref, type Component } from 'vue'
import { ArrowUp, Cloud, CloudLightning, CloudRain, CloudSun, Sun } from 'lucide-vue-next'
import { num } from '../../kit'

type Sky = 'clear' | 'partly' | 'cloud' | 'rain' | 'storm'

interface Hour {
  /** "14:00". */
  t: string
  temp: number
  /** Chance of rain, 0–100. */
  rain: number
  /** Expected rain in mm for the hour. */
  mm: number
  /** km/h. */
  wind: number
  /** Where the wind comes from, degrees: 45 is from the north-east. */
  deg: number
  sky: Sky
  /** The rule holds this hour. */
  ok?: boolean
}

const props = withDefaults(
  defineProps<{
    place: string
    /** "Issued 14:00 WIB". */
    issued?: string
    hours: Hour[]
    /** The rule the hours are checked against: "Spray window". */
    rule?: string
    /** Words for an hour that keeps or breaks the rule. */
    ruleWords?: [string, string]
    /** Two modules wide, one high: figures on the left, the hours on the right. */
    compact?: boolean
  }>(),
  { ruleWords: () => ['Open', 'Closed'], compact: false },
)

const ICONS: Record<Sky, Component> = { clear: Sun, partly: CloudSun, cloud: Cloud, rain: CloudRain, storm: CloudLightning }
const POINTS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
const compass = (deg: number) => POINTS[Math.round((((deg % 360) + 360) % 360) / 45) % 8]

function words(h: Hour) {
  if (h.sky === 'storm') return 'Thunderstorm'
  if (h.sky === 'rain') return h.mm < 2.5 ? 'Light rain' : h.mm < 7.6 ? 'Moderate rain' : 'Heavy rain'
  return h.sky === 'clear' ? 'Clear' : h.sky === 'partly' ? 'Partly cloudy' : 'Cloudy'
}

const pinned = ref(0)
const hovered = ref<number | null>(null)
const at = computed(() => hovered.value ?? pinned.value)
const hour = computed(() => props.hours[at.value] ?? props.hours[0])
const valueText = computed(() => {
  const h = hour.value
  const rule = props.rule && h.ok != null ? `, ${props.rule.toLowerCase()} ${h.ok ? props.ruleWords[0] : props.ruleWords[1]}` : ''
  return `${h.t}, ${h.temp} °C, ${words(h).toLowerCase()}, rain ${h.rain}%, wind ${h.wind} km/h from ${compass(h.deg)}${rule}`
})

function indexAt(event: PointerEvent | MouseEvent) {
  const box = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const n = props.hours.length
  return Math.max(0, Math.min(n - 1, Math.floor(((event.clientX - box.left) / box.width) * n)))
}
function onKeydown(event: KeyboardEvent) {
  const n = props.hours.length
  let next: number | undefined
  if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = pinned.value + 1
  else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = pinned.value - 1
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = n - 1
  if (next === undefined) return
  event.preventDefault()
  hovered.value = null
  pinned.value = Math.max(0, Math.min(n - 1, next))
}
const tick = (i: number) => (i === 0 ? 'Now' : i % 3 === 0 ? props.hours[i].t.slice(0, 2) : '')
</script>

<template>
  <div class="mk wx" :class="{ 'wx--compact': compact }">
    <div class="mk-row mk-between">
      <span class="r-label mk-truncate">{{ place }}</span>
      <span v-if="issued" class="r-label wx__issued">{{ issued }}</span>
    </div>

    <div class="wx__top">
      <div class="wx__now">
        <component :is="ICONS[hour.sky]" :size="20" class="wx__icon" aria-hidden="true" />
        <span class="wx__temp mk-fig">{{ hour.temp }}<span class="mk-unit">°C</span></span>
        <span class="wx__word">
          <span class="wx__sky">{{ words(hour) }}</span>
          <span class="r-label">{{ at === 0 ? 'Now' : hour.t }}</span>
        </span>
      </div>
      <dl class="wx__stats">
        <div>
          <dt class="r-label">Rain</dt>
          <dd>{{ hour.rain }}%<span class="mk-unit">{{ num(hour.mm, 1) }} mm</span></dd>
        </div>
        <div>
          <dt class="r-label">Wind</dt>
          <dd>
            <ArrowUp :size="12" class="wx__arrow" :style="{ transform: `rotate(${hour.deg + 180}deg)` }" aria-hidden="true" />
            {{ hour.wind }}<span class="mk-unit">km/h {{ compass(hour.deg) }}</span>
          </dd>
        </div>
        <div v-if="rule && hour.ok != null">
          <dt class="r-label">{{ rule }}</dt>
          <dd :class="hour.ok ? 'is-ok' : 'is-no'">{{ hour.ok ? ruleWords[0] : ruleWords[1] }}</dd>
        </div>
      </dl>
    </div>

    <div class="wx__strip mk-grow">
      <div
        class="wx__cols"
        role="slider"
        tabindex="0"
        :aria-label="`${place}, hour`"
        aria-valuemin="0"
        :aria-valuemax="hours.length - 1"
        :aria-valuenow="pinned"
        :aria-valuetext="valueText"
        @pointermove="hovered = indexAt($event)"
        @pointerleave="hovered = null"
        @click="pinned = indexAt($event)"
        @keydown="onKeydown"
      >
        <span class="wx__now-line" aria-hidden="true" />
        <span v-for="(h, i) in hours" :key="h.t" class="wx__col" :class="{ 'is-on': i === at }" aria-hidden="true">
          <span class="wx__bar" :style="{ height: `${Math.max(2, h.rain)}%` }" />
        </span>
      </div>
      <div v-if="rule" class="wx__rule" aria-hidden="true">
        <span v-for="(h, i) in hours" :key="h.t" :class="{ 'is-ok': h.ok, 'is-on': i === at }" />
      </div>
      <div class="wx__ticks" aria-hidden="true">
        <span v-for="(h, i) in hours" :key="h.t">{{ tick(i) }}</span>
      </div>
      <p class="wx__legend" aria-hidden="true">
        <span><i class="wx__swatch" />Chance of rain</span>
        <span v-if="rule"><i class="wx__swatch is-ok" />{{ rule }} {{ ruleWords[0].toLowerCase() }}</span>
      </p>
    </div>
  </div>
</template>

<style scoped>
.wx {
  container-type: inline-size;
  gap: 10px;
}

.wx__issued {
  flex: none;
}

.wx__top {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px 16px;
}

.wx__now {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.wx__icon {
  color: var(--r-text-secondary);
}

.wx__temp {
  display: flex;
  align-items: baseline;
  gap: 2px;
  font-size: var(--r-text-3xl);
}

.wx__word {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.wx__sky {
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
  white-space: nowrap;
}

.wx__stats {
  display: flex;
  gap: 16px;
}

.wx__stats dd {
  display: flex;
  align-items: baseline;
  gap: 3px;
  margin: 0;
  font-size: var(--r-text-sm);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.wx__stats dd.is-ok {
  color: var(--r-success-text);
}

.wx__stats dd.is-no {
  color: var(--r-text-secondary);
}

.wx__arrow {
  align-self: center;
  transition: transform var(--r-duration-base) var(--r-ease-out);
}

.wx__strip {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 0;
}

.wx__cols {
  position: relative;
  display: flex;
  flex: 1 1 auto;
  gap: 2px;
  min-height: 24px;
  border-bottom: 1px solid var(--r-chart-axis);
  cursor: crosshair;
  touch-action: pan-y;
}

.wx__cols:focus-visible {
  outline-offset: 3px;
}

.wx__col {
  display: flex;
  flex: 1 1 0;
  align-items: flex-end;
  min-width: 0;
}

.wx__col.is-on {
  background: var(--r-bg-selected);
}

.wx__bar {
  width: 100%;
  background: var(--r-chart-1);
  transition: height var(--r-duration-base) var(--r-ease-out);
}

/* Now: the signal-orange line at the start of the strip. */
.wx__now-line {
  position: absolute;
  top: -4px;
  bottom: -1px;
  left: 0;
  width: 2px;
  background: var(--r-chart-now);
}

.wx__rule {
  display: flex;
  gap: 2px;
}

.wx__rule span {
  flex: 1 1 0;
  height: 4px;
  background: var(--r-chart-track);
}

.wx__rule span.is-ok {
  background: var(--r-status-good);
}

.wx__ticks {
  display: flex;
  gap: 2px;
  color: var(--r-chart-label);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  line-height: 1;
}

.wx__ticks span {
  flex: 1 1 0;
  min-width: 0;
  overflow: visible;
  white-space: nowrap;
}

.wx__ticks span:first-child {
  color: var(--r-signal-text);
}

.wx__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.wx__legend span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.wx__swatch {
  width: 8px;
  height: 8px;
  background: var(--r-chart-1);
}

.wx__swatch.is-ok {
  background: var(--r-status-good);
}

/* Compact: figures on the left, the hours on the right, no legend. */
.wx--compact {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  grid-template-rows: auto minmax(0, 1fr);
  gap: 8px 16px;
}

.wx--compact > .mk-row {
  grid-column: 1 / -1;
}

.wx--compact .wx__top {
  flex-direction: column;
  flex-wrap: nowrap;
  align-items: flex-start;
  justify-content: space-between;
}

.wx--compact .wx__temp {
  font-size: var(--r-text-2xl);
}

.wx--compact .wx__stats {
  gap: 12px;
}

.wx--compact .wx__legend {
  display: none;
}
</style>
