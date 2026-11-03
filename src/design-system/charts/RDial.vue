<script setup lang="ts">
import { computed } from 'vue'
import { STATUS_COLORS, niceStep } from './utils'
import { formatNumber } from '../composables/format'
import type { DialZone } from '../types'

/** An instrument dial: 270° tick ring, status zones, needle, mono readout in the middle. */
const props = withDefaults(
  defineProps<{
    value: number
    label: string
    min?: number
    max?: number
    unit?: string
    zones?: DialZone[]
    /** Major tick every N units; minor ticks split each major into 5. */
    majorStep?: number
    size?: number
    /** `needle` (default) or `arc` (fills the ring up to the value). */
    variant?: 'needle' | 'arc'
    format?: (value: number) => string
  }>(),
  { min: 0, max: 100, size: 200, variant: 'needle' },
)

const fmt = (v: number) => (props.format ? props.format(v) : formatNumber(v))

const S = 200
const C = S / 2
const R = 86 // tick ring outer radius
const START = 135 // degrees, measured clockwise from 3 o'clock: bottom-left
const SWEEP = 270

const clampV = (v: number) => Math.min(props.max, Math.max(props.min, v))
const angleOf = (v: number) => START + ((clampV(v) - props.min) / Math.max(1e-9, props.max - props.min)) * SWEEP
const polar = (deg: number, r: number) => {
  const rad = (deg * Math.PI) / 180
  return { x: C + r * Math.cos(rad), y: C + r * Math.sin(rad) }
}

function arc(from: number, to: number, r: number) {
  const a = polar(angleOf(from), r)
  const b = polar(angleOf(to), r)
  const large = angleOf(to) - angleOf(from) > 180 ? 1 : 0
  return `M${a.x.toFixed(2)},${a.y.toFixed(2)} A${r},${r} 0 ${large} 1 ${b.x.toFixed(2)},${b.y.toFixed(2)}`
}

const major = computed(() => props.majorStep ?? niceStep(props.max - props.min, 5))

const ticks = computed(() => {
  const out: { x1: number; y1: number; x2: number; y2: number; major: boolean; label?: string; lx?: number; ly?: number; lit: boolean }[] = []
  const minor = major.value / 5
  const count = Math.round((props.max - props.min) / minor)
  for (let k = 0; k <= count; k++) {
    const v = props.min + k * minor
    const isMajor = k % 5 === 0
    const deg = angleOf(v)
    const a = polar(deg, R)
    const b = polar(deg, isMajor ? R - 10 : R - 5)
    const l = polar(deg, R - 22)
    out.push({
      x1: a.x,
      y1: a.y,
      x2: b.x,
      y2: b.y,
      major: isMajor,
      label: isMajor ? fmt(v) : undefined,
      lx: l.x,
      ly: l.y,
      lit: props.variant === 'arc' && v <= props.value,
    })
  }
  return out
})

const zoneArcs = computed(() => (props.zones ?? []).map((z) => ({ d: arc(z.from, z.to, R + 5), color: STATUS_COLORS[z.level], level: z.level })))

const activeZone = computed(() => (props.zones ?? []).find((z) => props.value >= z.from && props.value <= z.to))

const needle = computed(() => {
  const deg = angleOf(props.value)
  const tip = polar(deg, R - 6)
  const tail = polar(deg + 180, 10)
  return { x1: tail.x, y1: tail.y, x2: tip.x, y2: tip.y }
})

const valueArc = computed(() => (props.variant === 'arc' ? arc(props.min, clampV(props.value), R - 2.5) : ''))
const trackArc = computed(() => arc(props.min, props.max, R - 2.5))

const ariaLabel = computed(
  () => `${props.label}: ${fmt(props.value)}${props.unit ? ` ${props.unit}` : ''}${activeZone.value ? `, ${activeZone.value.level}` : ''}`,
)
</script>

<template>
  <figure class="r-chart r-dial" :style="{ width: `${size}px` }" role="img" :aria-label="ariaLabel">
    <svg :viewBox="`0 0 ${S} ${S * 0.86}`" :width="size" :height="size * 0.86" aria-hidden="true">
      <path v-if="variant === 'arc'" class="r-dial__track" :d="trackArc" />
      <path v-if="variant === 'arc'" class="r-dial__value" :d="valueArc" />
      <path v-for="(z, i) in zoneArcs" :key="i" class="r-dial__zone" :d="z.d" :style="{ stroke: z.color }" />
      <g class="r-dial__ticks">
        <line
          v-for="(t, i) in ticks"
          :key="i"
          :x1="t.x1"
          :y1="t.y1"
          :x2="t.x2"
          :y2="t.y2"
          :class="{ 'is-major': t.major, 'is-lit': t.lit }"
        />
      </g>
      <g class="r-chart__axis">
        <template v-for="(t, i) in ticks" :key="`l${i}`">
          <text v-if="t.label" :x="t.lx" :y="t.ly" dy="0.34em" text-anchor="middle">{{ t.label }}</text>
        </template>
      </g>
      <g v-if="variant === 'needle'" class="r-dial__needle">
        <line :x1="needle.x1" :y1="needle.y1" :x2="needle.x2" :y2="needle.y2" />
        <circle :cx="C" :cy="C" r="4" />
      </g>
    </svg>
    <figcaption class="r-dial__readout">
      <span class="r-dial__value-text">
        {{ fmt(value) }}<span v-if="unit" class="r-dial__unit">{{ unit }}</span>
      </span>
      <span class="r-dial__label">{{ label }}</span>
      <span v-if="activeZone" class="r-dial__zone-label" :style="{ '--zone': STATUS_COLORS[activeZone.level] }">{{ activeZone.level }}</span>
    </figcaption>
  </figure>
</template>

<style>
.r-dial {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  max-width: 100%;
}

.r-dial svg {
  display: block;
  max-width: 100%;
  height: auto;
}

.r-dial__ticks line {
  stroke: var(--r-chart-axis);
  stroke-width: 1;
}

.r-dial__ticks line.is-major {
  stroke: var(--r-text-secondary);
  stroke-width: 1.5;
}

.r-dial__ticks line.is-lit {
  stroke: var(--r-chart-1);
}

.r-dial .r-chart__axis text {
  font-size: 9px;
}

.r-dial__zone {
  fill: none;
  stroke-width: 3;
}

.r-dial__track {
  fill: none;
  stroke: var(--r-chart-track);
  stroke-width: 5;
}

.r-dial__value {
  fill: none;
  stroke: var(--r-chart-1);
  stroke-width: 5;
}

.r-dial__needle line {
  stroke: var(--r-chart-ink);
  stroke-width: 2;
}

.r-dial__needle circle {
  fill: var(--r-chart-surface);
  stroke: var(--r-chart-ink);
  stroke-width: 2;
}

.r-dial__readout {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  margin-top: -6px;
}

.r-dial__value-text {
  color: var(--r-text);
  font-family: var(--r-font-mono);
  font-size: 22px;
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
  line-height: 1;
  letter-spacing: -0.02em;
}

.r-dial__unit {
  margin-left: 4px;
  color: var(--r-text-tertiary);
  font-size: 10px;
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.r-dial__label {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: 9.5px;
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.r-dial__zone-label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: 9.5px;
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.r-dial__zone-label::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: var(--r-radius-round);
  background: var(--zone);
}
</style>
