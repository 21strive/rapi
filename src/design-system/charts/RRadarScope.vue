<script setup lang="ts">
import { computed, useId } from 'vue'
import { useChartFocus } from './utils'
import type { RadarContact } from '../types'

/** A plan-position scope: range rings, bearing ticks, a sweep, labelled contacts. */
const props = withDefaults(
  defineProps<{
    contacts: RadarContact[]
    label: string
    /** Outer ring range in scope units. */
    range?: number
    rings?: number
    unit?: string
    /** Rotating sweep line. Off under reduced motion. */
    sweep?: boolean
    size?: number
    selected?: string
    /** Ring labels, e.g. to show elevation on a sky plot: (v) => `${90 - v}°`. */
    formatRing?: (value: number) => string
    /** A ring to watch, in scope units: drawn dashed in the critical colour with its range. */
    alertRing?: number
    alertLabel?: string
  }>(),
  { range: 100, rings: 4, unit: 'NM', sweep: true, size: 360 },
)

const emit = defineEmits<{ select: [id: string] }>()

const uid = useId()
const S = 400
const C = S / 2
const R = 172

// Shape, colour and a word all carry the kind, so it never rests on colour alone.
const KINDS = {
  friendly: { color: 'var(--r-chart-1)', word: 'Friendly' },
  unknown: { color: 'var(--r-status-warning)', word: 'Unknown' },
  hostile: { color: 'var(--r-signal)', word: 'Hostile' },
  neutral: { color: 'var(--r-chart-context)', word: 'Neutral' },
} as const

const polar = (bearing: number, r: number) => {
  const rad = ((bearing - 90) * Math.PI) / 180
  return { x: C + r * Math.cos(rad), y: C + r * Math.sin(rad) }
}

const ringList = computed(() =>
  Array.from({ length: props.rings }, (_, i) => {
    const r = (R * (i + 1)) / props.rings
    const v = (props.range * (i + 1)) / props.rings
    const at = polar(45, r)
    return { r, label: props.formatRing ? props.formatRing(v) : `${Math.round(v)}`, lx: at.x + 3, ly: at.y - 3 }
  }),
)

const bearingTicks = computed(() =>
  Array.from({ length: 72 }, (_, i) => {
    const b = i * 5
    const major = b % 30 === 0
    const a = polar(b, R)
    const z = polar(b, R + (major ? 9 : b % 10 === 0 ? 5 : 3))
    const l = polar(b, R + 20)
    return { b, major, x1: a.x, y1: a.y, x2: z.x, y2: z.y, lx: l.x, ly: l.y, text: String(b).padStart(3, '0') }
  }),
)

const items = computed(() =>
  props.contacts.map((c) => {
    const p = polar(c.bearing, Math.min(1, c.range / props.range) * R)
    const kind = KINDS[c.kind ?? 'unknown']
    const lead = c.heading == null ? null : polar(c.heading, 18)
    return {
      ...c,
      beyond: c.range > props.range,
      x: p.x,
      y: p.y,
      color: kind.color,
      word: kind.word,
      lead: lead ? { x2: p.x + (lead.x - C), y2: p.y + (lead.y - C) } : null,
    }
  }),
)

const focus = useChartFocus(
  () => props.contacts.length,
  (i) => {
    const c = items.value[i]
    return `${c.label ?? c.id}, ${c.word}, bearing ${String(Math.round(c.bearing)).padStart(3, '0')}, range ${c.range} ${props.unit}`
  },
)

function onKeydown(event: KeyboardEvent) {
  if ((event.key === 'Enter' || event.key === ' ') && focus.active.value !== null) {
    event.preventDefault()
    emit('select', items.value[focus.active.value].id)
    return
  }
  focus.onKeydown(event)
}

const highlighted = computed(() => {
  const i = focus.active.value
  return i === null ? props.selected : items.value[i]?.id
})
</script>

<template>
  <figure
    class="r-chart r-radar"
    :style="{ width: `${size}px` }"
    tabindex="0"
    :aria-describedby="`${uid}-hint`"
    @keydown="onKeydown"
    @blur="focus.onBlur"
  >
    <svg :viewBox="`-24 -24 ${S + 48} ${S + 48}`" :width="size" :height="size" role="img" :aria-label="label">
      <circle class="r-radar__face" :cx="C" :cy="C" :r="R" />
      <g class="r-radar__rings">
        <circle v-for="ring in ringList" :key="ring.r" :cx="C" :cy="C" :r="ring.r" />
        <line :x1="C" :y1="C - R" :x2="C" :y2="C + R" />
        <line :x1="C - R" :y1="C" :x2="C + R" :y2="C" />
      </g>
      <g v-if="alertRing != null && alertRing <= range" class="r-radar__alert">
        <circle :cx="C" :cy="C" :r="(alertRing / range) * R" />
        <text :x="C" :y="C - (alertRing / range) * R - 5" text-anchor="middle">{{ alertLabel ?? `${alertRing} ${unit}` }}</text>
      </g>
      <g class="r-chart__axis">
        <text v-for="ring in ringList" :key="`l${ring.r}`" :x="ring.lx" :y="ring.ly">{{ ring.label }}</text>
        <text class="r-chart__unit" :x="C + 4" :y="C - 6">{{ unit }}</text>
      </g>
      <g class="r-radar__bearings">
        <line
          v-for="t in bearingTicks"
          :key="t.b"
          :x1="t.x1"
          :y1="t.y1"
          :x2="t.x2"
          :y2="t.y2"
          :class="{ 'is-major': t.major }"
        />
      </g>
      <g class="r-chart__axis">
        <template v-for="t in bearingTicks" :key="`b${t.b}`">
          <text v-if="t.major" :x="t.lx" :y="t.ly" dy="0.34em" text-anchor="middle">{{ t.text }}</text>
        </template>
      </g>

      <g v-if="sweep" class="r-radar__sweep" :style="{ transformOrigin: `${C}px ${C}px` }">
        <path class="r-radar__wedge" :d="`M${C},${C} L${C},${C - R} A${R},${R} 0 0 0 ${polar(-24, R).x},${polar(-24, R).y} Z`" />
        <line :x1="C" :y1="C" :x2="C" :y2="C - R" />
      </g>

      <g
        v-for="(c, i) in items"
        :key="c.id"
        class="r-radar__contact"
        :class="[`is-${c.kind ?? 'unknown'}`, { 'is-selected': highlighted === c.id, 'is-beyond': c.beyond }]"
        @pointerenter="focus.onPointer(i)"
        @pointerleave="focus.onPointer(null)"
        @click="emit('select', c.id)"
      >
        <line v-if="c.lead" class="r-radar__lead" :x1="c.x" :y1="c.y" :x2="c.lead.x2" :y2="c.lead.y2" :style="{ stroke: c.color }" />
        <!-- friendly: circle · hostile: diamond · unknown: open square · neutral: filled square -->
        <circle v-if="c.kind === 'friendly'" :cx="c.x" :cy="c.y" r="5.5" :style="{ fill: c.color }" class="r-radar__mark" />
        <rect
          v-else-if="c.kind === 'hostile'"
          :x="c.x - 5"
          :y="c.y - 5"
          width="10"
          height="10"
          :transform="`rotate(45 ${c.x} ${c.y})`"
          :style="{ fill: c.color }"
          class="r-radar__mark"
        />
        <rect
          v-else-if="c.kind === 'neutral'"
          :x="c.x - 5"
          :y="c.y - 5"
          width="10"
          height="10"
          :style="{ fill: c.color }"
          class="r-radar__mark"
        />
        <rect v-else :x="c.x - 5" :y="c.y - 5" width="10" height="10" class="r-radar__mark is-open" :style="{ stroke: c.color }" />
        <rect v-if="highlighted === c.id" class="r-radar__select" :x="c.x - 11" :y="c.y - 11" width="22" height="22" />
        <text class="r-radar__id" :x="c.x + 10" :y="c.y - 8">{{ c.label ?? c.id }}</text>
        <rect class="r-radar__hit" :x="c.x - 12" :y="c.y - 12" width="24" height="24" />
      </g>
    </svg>
    <div class="r-sr-only">
      <table>
        <caption>{{ label }}</caption>
        <thead>
          <tr>
            <th scope="col">Track</th>
            <th scope="col">Kind</th>
            <th scope="col">Bearing</th>
            <th scope="col">Range ({{ unit }})</th>
            <th scope="col">Heading</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in items" :key="c.id">
            <th scope="row">{{ c.label ?? c.id }}</th>
            <td>{{ c.word }}</td>
            <td>{{ String(Math.round(c.bearing)).padStart(3, '0') }}°</td>
            <td>{{ c.range }}{{ c.beyond ? ' (beyond scope)' : '' }}</td>
            <td>{{ c.heading == null ? '—' : `${String(Math.round(c.heading)).padStart(3, '0')}°` }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <span :id="`${uid}-hint`" hidden>Use the arrow keys to step through the tracks; Enter selects one.</span>
    <span class="r-sr-only" aria-live="polite">{{ focus.announce.value }}</span>
  </figure>
</template>

<style>
.r-radar {
  max-width: 100%;
}

.r-radar svg {
  display: block;
  max-width: 100%;
  height: auto;
}

.r-radar__face {
  fill: var(--r-chart-surface);
  stroke: var(--r-chart-axis);
  stroke-width: 1;
}

.r-radar__rings circle,
.r-radar__rings line {
  fill: none;
  stroke: var(--r-chart-grid);
  stroke-width: 1;
}

.r-radar__bearings line {
  stroke: var(--r-chart-axis);
  stroke-width: 1;
}

.r-radar__bearings line.is-major {
  stroke: var(--r-text-secondary);
}

.r-radar__sweep {
  animation: r-radar-sweep 6s linear infinite;
}

.r-radar__sweep line {
  stroke: var(--r-chart-1);
  stroke-width: 1.5;
}

.r-radar__wedge {
  fill: var(--r-chart-1);
  opacity: 0.08;
}

@keyframes r-radar-sweep {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .r-radar__sweep {
    animation: none;
  }
}

.r-radar__contact {
  cursor: pointer;
}

/* Beyond the outer ring: pinned to the edge and faded, still labelled. */
.r-radar__contact.is-beyond {
  opacity: 0.45;
}

.r-radar__alert circle {
  fill: none;
  stroke: var(--r-status-critical);
  stroke-width: 1;
  stroke-dasharray: 5 4;
}

.r-radar__alert text {
  fill: var(--r-danger-text);
  font-family: var(--r-font-mono);
  font-size: 9.5px;
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.r-radar__mark {
  stroke: var(--r-chart-surface);
  stroke-width: 1.5;
}

.r-radar__mark.is-open {
  fill: var(--r-chart-surface);
  stroke-width: 2;
}

.r-radar__lead {
  stroke-width: 1.5;
}

.r-radar__select {
  fill: none;
  stroke: var(--r-chart-ink);
  stroke-width: 1;
  stroke-dasharray: 3 2;
}

.r-radar__id {
  fill: var(--r-text);
  font-family: var(--r-font-mono);
  font-size: 10px;
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.02em;
}

.r-radar__hit {
  fill: transparent;
}
</style>
