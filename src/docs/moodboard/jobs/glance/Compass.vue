<script setup lang="ts">
/**
 * A compass card. `card`: a ship's heading, the card turns under a fixed lubber line, true or
 * magnetic. `wind`: where the wind comes from on a fixed card, now and in the next hours.
 * `runway`: the wind against the runway in use, split into headwind and crosswind, the two
 * figures a pilot actually decides on.
 */
import { computed, ref, watch } from 'vue'
import { RSegmented, RStatus } from '@/design-system'
import { num } from '../../kit'

interface View {
  id: string
  label: string
  /** Card: the heading. Runway: the runway's magnetic heading. Wind: where it comes from. */
  deg: number
  /** Wind speed for this view (wind mode). */
  speed?: number
  /** Quiet line for this view. */
  note?: string
}

const props = withDefaults(
  defineProps<{
    label: string
    mode?: 'card' | 'wind' | 'runway'
    views: View[]
    /** Runway mode: the wind now. */
    wind?: { from: number; speed: number; gust?: number }
    unit?: string
    /** Card mode: a speed under the heading, e.g. speed over ground. */
    speed?: { label: string; value: number; decimals?: number }
    /** Runway mode: tailwind above this many knots is outside limits. */
    tailLimit?: number
    crossLimit?: number
    /** Size of the card in px. */
    dial?: number
    /** Card above the figures instead of beside them. */
    stack?: boolean
  }>(),
  { mode: 'card', unit: 'kn', tailLimit: 10, crossLimit: 25, dial: 120, stack: false },
)

const viewId = ref(props.views[0]?.id)
const view = computed(() => props.views.find((v) => v.id === viewId.value) ?? props.views[0])
const options = computed(() => props.views.map((v) => ({ label: v.label, value: v.id })))

const POINTS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
const point = (deg: number) => POINTS[Math.round((((deg % 360) + 360) % 360) / 22.5) % 16]
const three = (deg: number) => String(Math.round(((deg % 360) + 360) % 360)).padStart(3, '0')

/* The card (or the arrow) turns the short way round. */
const target = computed(() => {
  if (props.mode === 'card') return -view.value.deg
  if (props.mode === 'wind') return view.value.deg
  return props.wind?.from ?? 0
})
const turn = ref(target.value)
watch(target, (to) => {
  const delta = ((((to - turn.value) % 360) + 540) % 360) - 180
  turn.value += delta
})

/* Runway: the components of the wind along and across the runway in use. */
const parts = computed(() => {
  if (props.mode !== 'runway' || !props.wind) return null
  const angle = ((props.wind.from - view.value.deg) * Math.PI) / 180
  const along = props.wind.speed * Math.cos(angle)
  const across = props.wind.speed * Math.sin(angle)
  return { along, across: Math.abs(across), side: across >= 0 ? 'right' : 'left' }
})
const within = computed(() => {
  if (!parts.value) return true
  return -parts.value.along <= props.tailLimit && parts.value.across <= props.crossLimit
})
const runwayAngle = computed(() => (props.mode === 'runway' ? view.value.deg : 0))
const reciprocal = computed(() => String(Math.round((((view.value.deg + 180) % 360) / 10)) || 36).padStart(2, '0'))

const C = 100
const small = computed(() => props.dial < 100)
const allTicks = Array.from({ length: 72 }, (_, i) => {
  const deg = i * 5
  const len = deg % 30 === 0 ? 10 : deg % 10 === 0 ? 6 : 3
  const rad = ((deg - 90) * Math.PI) / 180
  return {
    deg,
    major: deg % 30 === 0,
    x1: C + 90 * Math.cos(rad),
    y1: C + 90 * Math.sin(rad),
    x2: C + (90 - len) * Math.cos(rad),
    y2: C + (90 - len) * Math.sin(rad),
  }
})
const ticks = computed(() => (small.value ? allTicks.filter((t) => t.major) : allTicks))
const letters = [
  { t: 'N', deg: 0 },
  { t: 'E', deg: 90 },
  { t: 'S', deg: 180 },
  { t: 'W', deg: 270 },
].map((l) => {
  const rad = ((l.deg - 90) * Math.PI) / 180
  return { ...l, x: C + 66 * Math.cos(rad), y: C + 66 * Math.sin(rad) }
})
const numbers = [30, 60, 120, 150, 210, 240, 300, 330].map((deg) => {
  const rad = ((deg - 90) * Math.PI) / 180
  return { deg, t: String(deg / 10), x: C + 70 * Math.cos(rad), y: C + 70 * Math.sin(rad) }
})

const aria = computed(() => {
  if (props.mode === 'card') return `${props.label}: heading ${three(view.value.deg)} degrees ${view.value.label.toLowerCase()}`
  if (props.mode === 'wind') return `${props.label}: wind from ${three(view.value.deg)} degrees, ${view.value.speed ?? 0} ${props.unit}`
  return `${props.label}: wind from ${three(props.wind?.from ?? 0)} degrees at ${props.wind?.speed ?? 0} ${props.unit}`
})
</script>

<template>
  <div class="mk cmp" :class="{ 'cmp--stack': stack }">
    <div class="mk-row mk-between">
      <span class="r-label mk-truncate">{{ label }}</span>
      <span v-if="mode === 'card'" class="r-label cmp__ref">{{ view.label }}</span>
    </div>
    <div class="cmp__body mk-grow">
      <svg class="cmp__dial" :style="{ width: `${dial}px` }" viewBox="0 0 200 200" role="img" :aria-label="aria">
        <circle class="cmp__ring" :cx="C" :cy="C" r="90" />
        <g class="cmp__card" :style="{ transform: `rotate(${mode === 'card' ? turn : 0}deg)` }">
          <line
            v-for="t in ticks"
            :key="t.deg"
            :x1="t.x1"
            :y1="t.y1"
            :x2="t.x2"
            :y2="t.y2"
            :class="{ 'is-major': t.major }"
          />
          <text
            v-for="l in letters"
            :key="l.t"
            class="cmp__letter"
            :class="{ 'is-north': l.t === 'N', 'is-small': small }"
            :x="l.x"
            :y="l.y"
            text-anchor="middle"
            dominant-baseline="central"
            :transform="mode === 'card' ? `rotate(${l.deg} ${l.x} ${l.y})` : undefined"
          >
            {{ l.t }}
          </text>
          <template v-if="dial >= 110">
            <text
              v-for="n in numbers"
              :key="n.deg"
              class="cmp__num"
              :x="n.x"
              :y="n.y"
              text-anchor="middle"
              dominant-baseline="central"
              :transform="mode === 'card' ? `rotate(${n.deg} ${n.x} ${n.y})` : undefined"
            >
              {{ n.t }}
            </text>
          </template>
        </g>

        <!-- Runway: an outlined strip through the centre, its numbers at both ends. -->
        <g v-if="mode === 'runway'" class="cmp__runway" :style="{ transform: `rotate(${runwayAngle}deg)` }">
          <rect :x="C - 7" :y="C - 46" width="14" height="92" />
          <text
            :x="C"
            :y="C + 36"
            text-anchor="middle"
            dominant-baseline="central"
            class="cmp__rwy is-active"
            :transform="`rotate(${-runwayAngle} ${C} ${C + 36})`"
          >
            {{ view.label }}
          </text>
          <text
            :x="C"
            :y="C - 36"
            text-anchor="middle"
            dominant-baseline="central"
            class="cmp__rwy"
            :transform="`rotate(${-runwayAngle} ${C} ${C - 36})`"
          >
            {{ reciprocal }}
          </text>
        </g>

        <!-- Heading: the lubber line, fixed at the top. -->
        <g v-if="mode === 'card'" class="cmp__lubber">
          <path :d="`M${C - 6},4 L${C + 6},4 L${C},14 Z`" />
          <line :x1="C" :y1="14" :x2="C" :y2="40" />
        </g>

        <!-- Wind: an arrow from the rim it blows from, through the centre. -->
        <g v-else class="cmp__wind" :style="{ transform: `rotate(${turn}deg)` }">
          <line :x1="C" :y1="18" :x2="C" :y2="C + 40" />
          <path :d="`M${C - 7},${C + 30} L${C + 7},${C + 30} L${C},${C + 44} Z`" />
        </g>
        <circle class="cmp__hub" :cx="C" :cy="C" r="3" />
      </svg>

      <div class="cmp__read" aria-live="polite">
        <template v-if="mode === 'card'">
          <p class="cmp__fig"><span class="mk-fig">{{ three(view.deg) }}</span><span class="cmp__deg">°</span></p>
          <p class="cmp__point">{{ point(view.deg) }}</p>
          <p v-if="speed" class="cmp__line">
            <span class="r-label">{{ speed.label }}</span>
            <span class="cmp__val">{{ num(speed.value, speed.decimals ?? 1) }}<span class="mk-unit">{{ unit }}</span></span>
          </p>
        </template>
        <template v-else-if="mode === 'wind'">
          <p class="cmp__fig"><span class="mk-fig">{{ view.speed ?? 0 }}</span><span class="mk-unit">{{ unit }}</span></p>
          <p class="cmp__point">From {{ point(view.deg) }} · {{ three(view.deg) }}°</p>
          <p v-if="view.note" class="cmp__note">{{ view.note }}</p>
        </template>
        <template v-else-if="parts">
          <p class="cmp__line">
            <span class="r-label">{{ parts.along >= 0 ? 'Headwind' : 'Tailwind' }}</span>
            <span class="cmp__val">{{ num(Math.abs(parts.along)) }}<span class="mk-unit">{{ unit }}</span></span>
          </p>
          <p class="cmp__line">
            <span class="r-label">{{ parts.across >= 1 ? `Crosswind, ${parts.side}` : 'Crosswind' }}</span>
            <span class="cmp__val">{{ num(parts.across) }}<span class="mk-unit">{{ unit }}</span></span>
          </p>
          <p class="cmp__note">
            Wind {{ three(wind?.from ?? 0) }}° at {{ wind?.speed }} {{ unit }}<template v-if="wind?.gust">, gusts {{ wind.gust }}</template>
          </p>
          <RStatus size="sm" :tone="within ? 'success' : 'warning'" :label="within ? 'Within limits' : 'Over limits'" />
        </template>
      </div>
    </div>
    <RSegmented v-if="views.length > 1" v-model="viewId" :options="options" size="sm" block :label="`${label}, ${mode === 'runway' ? 'runway' : mode === 'wind' ? 'time' : 'reference'}`" />
  </div>
</template>

<style scoped>
.cmp__ref {
  flex: none;
}

.cmp__body {
  display: flex;
  align-items: center;
  gap: 14px;
}

.cmp--stack .cmp__body {
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  gap: 10px;
}

.cmp__dial {
  flex: none;
  max-width: 100%;
  height: auto;
  overflow: visible;
}

.cmp--stack .cmp__dial {
  align-self: center;
}

.cmp__ring {
  fill: none;
  stroke: var(--r-border-strong);
  stroke-width: 1;
}

.cmp__card {
  transform-origin: 100px 100px;
  transition: transform var(--r-duration-slow) var(--r-ease-out);
}

.cmp__card line {
  stroke: var(--r-chart-axis);
  stroke-width: 1;
}

.cmp__card line.is-major {
  stroke: var(--r-text-secondary);
  stroke-width: 1.5;
}

.cmp__letter {
  fill: var(--r-text);
  font-family: var(--r-font-mono);
  font-size: 15px;
  font-weight: var(--r-weight-semibold);
}

.cmp__letter.is-north {
  font-size: 18px;
  font-weight: var(--r-weight-bold);
}

.cmp__letter.is-small {
  font-size: 30px;
}

.cmp__num {
  fill: var(--r-chart-label);
  font-family: var(--r-font-mono);
  font-size: 10px;
}

.cmp__lubber path {
  fill: var(--r-text);
}

.cmp__lubber line {
  stroke: var(--r-text);
  stroke-width: 2;
}

.cmp__wind {
  transform-origin: 100px 100px;
  transition: transform var(--r-duration-slow) var(--r-ease-out);
}

.cmp__wind line {
  stroke: var(--r-chart-1);
  stroke-width: 3;
}

.cmp__wind path {
  fill: var(--r-chart-1);
}

.cmp__runway {
  transform-origin: 100px 100px;
  transition: transform var(--r-duration-slow) var(--r-ease-out);
}

.cmp__runway rect {
  fill: var(--r-bg-muted);
  stroke: var(--r-text-secondary);
  stroke-width: 1;
}

.cmp__rwy {
  fill: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: 11px;
  font-weight: var(--r-weight-semibold);
}

.cmp__rwy.is-active {
  fill: var(--r-text);
}

.cmp__hub {
  fill: var(--r-bg-surface);
  stroke: var(--r-text);
  stroke-width: 1.5;
}

.cmp__read {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.cmp__fig {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.cmp__fig .mk-fig {
  font-size: var(--r-text-3xl);
}

.cmp__deg {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xl);
}

.cmp__point {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.cmp__line {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 0;
  border-bottom: 1px solid var(--r-border-subtle);
}

.cmp__val {
  display: inline-flex;
  align-items: baseline;
  gap: 3px;
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.cmp__note {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}
</style>
