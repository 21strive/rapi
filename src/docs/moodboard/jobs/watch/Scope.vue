<script setup lang="ts">
/**
 * A plan-position scope with tracks that move as the picture updates. Pick a track on the scope, or
 * in the list beside it, to read bearing, range, speed and whether it is closing. Arrow keys on the
 * scope step through tracks and Enter picks one.
 */
import { computed, ref, shallowRef, watch } from 'vue'
import { RRadarScope, RStatus, type RadarContact } from '@/design-system'
import { num, pad, time, useTick, type Zone } from '../../kit'
import { useElementSize } from './shared'

interface Track extends RadarContact {
  /** Speed in the scope's unit per hour. */
  speed: number
  /** A slow turn, degrees per update. */
  turn?: number
}

const props = withDefaults(
  defineProps<{
    label: string
    tracks: Track[]
    range: number
    unit?: string
    rings?: number
    alertRing?: number
    alertLabel?: string
    /** Speed unit, e.g. "kn" or "km/h". */
    speedUnit?: string
    /** Seconds of motion per update. */
    step?: number
    initial?: string
    zone?: Zone
    layout?: 'side' | 'stack'
  }>(),
  { unit: 'NM', rings: 4, speedUnit: 'kn', step: 6, zone: 'WIB', layout: 'stack' },
)

const rad = (d: number) => (d * Math.PI) / 180
const tracks = shallowRef(props.tracks.map((t) => ({ ...t })))
const updated = ref(new Date())

const tick = useTick(1500)
watch(tick, () => {
  tracks.value = tracks.value.map((t) => {
    const heading = ((t.heading ?? 0) + (t.turn ?? 0) + 360) % 360
    const d = (t.speed * props.step) / 3600
    const x = t.range * Math.sin(rad(t.bearing)) + d * Math.sin(rad(heading))
    const y = t.range * Math.cos(rad(t.bearing)) + d * Math.cos(rad(heading))
    const bearing = ((Math.atan2(x, y) * 180) / Math.PI + 360) % 360
    return { ...t, heading, bearing: Math.round(bearing * 10) / 10, range: Math.round(Math.hypot(x, y) * 10) / 10 }
  })
  updated.value = new Date()
})

const selected = ref<string | undefined>(props.initial)
const current = computed(() => tracks.value.find((t) => t.id === selected.value))
function pick(id: string) {
  selected.value = selected.value === id ? undefined : id
}

/** Positive when the track is getting closer. */
function closing(t: Track) {
  const h = rad(t.heading ?? 0)
  const b = rad(t.bearing)
  return -t.speed * (Math.sin(h) * Math.sin(b) + Math.cos(h) * Math.cos(b))
}
const deg = (v: number) => `${pad(Math.round(v) % 360, 3)}°`
const KIND = { friendly: 'Friendly', unknown: 'Unknown', hostile: 'Hostile', neutral: 'Neutral' } as const
const TONE = { friendly: 'brand', unknown: 'warning', hostile: 'signal', neutral: 'neutral' } as const

const box = ref<HTMLElement | null>(null)
const { width, height } = useElementSize(box)
const size = computed(() => Math.max(120, Math.floor(Math.min(width.value, height.value))))
const sorted = computed(() => [...tracks.value].sort((a, b) => a.range - b.range))
</script>

<template>
  <div class="mk scope" :class="`scope--${layout}`">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ label }}</span>
      <RStatus tone="signal" pulse size="sm" :label="layout === 'side' ? `Live · ${time(updated, zone, true)}` : 'Live'" />
    </div>

    <div class="scope__body mk-grow">
      <div ref="box" class="scope__face">
        <RRadarScope
          :contacts="tracks"
          :label="label"
          :range="range"
          :unit="unit"
          :rings="rings"
          :alert-ring="alertRing"
          :alert-label="alertLabel"
          :size="size"
          :selected="selected"
          @select="pick"
        />
      </div>

      <ol v-if="layout === 'side'" class="scope__list" :aria-label="`Tracks by range`">
        <li v-for="t in sorted" :key="t.id">
          <button
            type="button"
            class="scope__row mk-reset"
            :class="{ 'is-selected': t.id === selected }"
            :aria-pressed="t.id === selected"
            @click="pick(t.id)"
          >
            <span class="scope__id">{{ t.label ?? t.id }}</span>
            <span class="scope__num">{{ num(t.range, 1) }} {{ unit }}</span>
            <RStatus :tone="TONE[t.kind ?? 'unknown']" shape="square" size="sm" :label="KIND[t.kind ?? 'unknown']" />
            <span class="scope__num scope__brg">{{ deg(t.bearing) }}</span>
          </button>
        </li>
      </ol>
    </div>

    <p class="scope__detail" aria-live="polite">
      <template v-if="current">
        <span class="scope__pick">{{ current.label ?? current.id }}</span>
        <span>{{ KIND[current.kind ?? 'unknown'] }}</span>
        <span>{{ deg(current.bearing) }}</span>
        <span>{{ num(current.range, 1) }} {{ unit }}</span>
        <span>{{ num(current.speed) }} {{ speedUnit }}</span>
        <span>{{ closing(current) > 1 ? `closing ${num(closing(current))} ${speedUnit}` : 'opening' }}</span>
      </template>
      <span v-else class="scope__hint">Pick a track to read it · {{ tracks.length }} tracks · {{ time(updated, zone, true) }}</span>
    </p>
  </div>
</template>

<style scoped>
.scope {
  container-type: inline-size;
  gap: 8px;
}

.scope__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.scope__face {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  justify-content: center;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.scope__list {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  overflow: hidden;
  border-top: 1px solid var(--r-border-subtle);
  list-style: none;
}

.scope__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 3px 8px;
  width: 100%;
  padding: 6px 8px 6px 6px;
  border-bottom: 1px solid var(--r-border-subtle);
  border-left: 2px solid transparent;
  cursor: pointer;
  font-size: var(--r-text-xs);
}

.scope__row:hover {
  background: var(--r-bg-hover);
}

.scope__row.is-selected {
  border-left-color: var(--r-brand);
  background: var(--r-bg-selected);
}

.scope__id {
  overflow: hidden;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scope__brg {
  color: var(--r-text-tertiary);
}

.scope__num {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.scope__detail {
  display: flex;
  flex: none;
  flex-wrap: wrap;
  gap: 2px 12px;
  min-height: 16px;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
}

.scope__pick {
  color: var(--r-text);
  font-weight: var(--r-weight-semibold);
}

.scope__hint {
  color: var(--r-text-tertiary);
}

.scope--side .scope__body {
  flex-direction: row;
}

.scope--side .scope__list {
  flex: 0 0 172px;
  border-top: 0;
  border-left: 1px solid var(--r-border-subtle);
}

/* Narrow (a phone clamps it to two columns): the list goes under the scope. */
@container (max-width: 440px) {
  .scope--side .scope__body {
    flex-direction: column;
  }
  .scope--side .scope__list {
    flex: none;
    max-height: 40%;
    border-top: 1px solid var(--r-border-subtle);
    border-left: 0;
  }
}
</style>
