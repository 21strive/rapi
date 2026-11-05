<script setup lang="ts">
/**
 * Where a delivery is right now: the stops, the leg it is on, and when it reaches the next stop and
 * the last. The orange point is the vehicle, moving with the clock. Pick a stop, with the pointer or
 * the arrow keys, to read its time and what happens there.
 */
import { computed, ref } from 'vue'
import { RStatus } from '@/design-system'
import { clock, time, timeZ, useNow, type Zone } from '../../kit'
import { clamp, minutes, stepKey } from './shared'

interface Stop {
  name: string
  /** Minutes of driving from the stop before. The first stop takes 0. */
  mins: number
  note?: string
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    title?: string
    stops: Stop[]
    /** The stop being driven to when the tile opens; the ones before are done. */
    at: number
    /** Share of the current leg already driven, 0–1. */
    legDone?: number
    /** Who is driving: "Fikri · B 3412 KZT". */
    vehicle?: string
    zone?: Zone
    layout?: 'strip' | 'card' | 'tall'
  }>(),
  { legDone: 0.3, zone: 'WIB', layout: 'strip' },
)

const now = useNow(1000)
const opened = Date.now()
const arrive = props.stops.reduce<number[]>((acc, s, i) => [...acc, (i ? acc[i - 1] : 0) + s.mins * 60], [])
const end = arrive[arrive.length - 1]
const startPos = arrive[props.at - 1] + props.legDone * props.stops[props.at].mins * 60
const pos = computed(() => Math.min(end, startPos + (now.value.getTime() - opened) / 1000))

/** The stop the vehicle is heading to, or the length when it has arrived. */
const heading = computed(() => {
  const i = arrive.findIndex((a) => a > pos.value)
  return i < 0 ? props.stops.length : i
})
const arrived = computed(() => heading.value >= props.stops.length)
const legShare = computed(() => {
  if (arrived.value) return 1
  const i = heading.value
  return clamp((pos.value - arrive[i - 1]) / (arrive[i] - arrive[i - 1]), 0, 1)
})
/** Position along the drawn route, 0–1, with stops spaced evenly. */
const along = computed(() =>
  arrived.value ? 1 : (heading.value - 1 + legShare.value) / Math.max(1, props.stops.length - 1),
)

const timeOf = (i: number) => new Date(opened + (arrive[i] - startPos) * 1000)
const stateOf = (i: number) => (i < heading.value ? 'done' : i === heading.value ? 'next' : 'later')
const nextIn = computed(() => (arrived.value ? 0 : arrive[heading.value] - pos.value))
const lastIn = computed(() => end - pos.value)

const picked = ref<number | null>(null)
const selected = computed(() => picked.value ?? Math.min(heading.value, props.stops.length - 1))
const detail = computed(() => {
  const i = selected.value
  const s = props.stops[i]
  const when = stateOf(i) === 'done' ? `Passed ${timeZ(timeOf(i), props.zone)}` : `Due ${timeZ(timeOf(i), props.zone)}`
  return `${s.name} · ${when}${s.note ? ` · ${s.note}` : ''}`
})

function onKeydown(event: KeyboardEvent) {
  const next = stepKey(event, selected.value, props.stops.length)
  if (next == null) return
  picked.value = next
  ;(event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus()
}
</script>

<template>
  <div class="mk track" :class="`track--${layout}`">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <RStatus v-if="arrived" tone="success" size="sm" label="Delivered" />
      <RStatus v-else tone="signal" pulse size="sm" label="En route" />
    </div>

    <div v-if="layout !== 'strip'" class="track__eta">
      <p class="track__fig">
        <span class="mk-fig">{{ arrived ? 'Arrived' : time(timeOf(stops.length - 1), zone) }}</span>
        <span v-if="!arrived" class="mk-unit">{{ zone }}</span>
      </p>
      <p class="track__quiet">{{ arrived ? `at ${stops[stops.length - 1].name}` : `in ${minutes(Math.ceil(lastIn / 60))} · next stop in ${clock(nextIn)}` }}</p>
      <p v-if="title" class="track__title mk-truncate">{{ title }}</p>
      <p v-if="vehicle" class="track__quiet mk-truncate">{{ vehicle }}</p>
    </div>
    <p v-else class="track__line">
      <span class="track__title mk-truncate">{{ title }}</span>
      <span class="track__quiet">{{ arrived ? 'Arrived' : `Next stop in ${clock(nextIn)} · last at ${timeZ(timeOf(stops.length - 1), zone)}` }}</span>
    </p>

    <div
      class="track__route mk-grow"
      role="radiogroup"
      :aria-label="`Stops of ${eyebrow}`"
      :style="{ '--n': stops.length, '--t': along }"
      @keydown="onKeydown"
    >
      <span class="track__rail" aria-hidden="true"><span class="track__ran" /></span>
      <span class="track__vehicle" aria-hidden="true" />
      <button
        v-for="(s, i) in stops"
        :key="s.name"
        type="button"
        role="radio"
        class="track__stop mk-reset"
        :class="[`is-${stateOf(i)}`, { 'is-selected': i === selected }]"
        :aria-checked="i === selected"
        :tabindex="i === selected ? 0 : -1"
        @click="picked = i"
      >
        <span class="track__mark" aria-hidden="true" />
        <span class="track__name">{{ s.name }}</span>
        <span class="track__time">{{ time(timeOf(i), zone) }}</span>
      </button>
    </div>

    <p class="track__detail mk-truncate" aria-live="polite">{{ detail }}</p>
  </div>
</template>

<style scoped>
.track {
  gap: 8px;
}

.track__eta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.track__fig {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.track__fig .mk-fig {
  font-size: var(--r-text-3xl);
}

.track__title {
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
}

.track--tall .track__title {
  overflow: visible;
  white-space: normal;
}

.track__quiet {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
}

.track__line {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
}

.track__line .track__quiet {
  flex: none;
}

/* ── Route: stops spaced evenly, the rail from the first mark to the last ─────────────── */
.track__route {
  --mark: 10px;
  position: relative;
  display: grid;
  grid-template-columns: repeat(var(--n), minmax(0, 1fr));
  align-items: start;
}

.track__rail {
  position: absolute;
  top: calc(var(--mark) / 2 - 1px);
  right: calc(50% / var(--n));
  left: calc(50% / var(--n));
  height: 2px;
  background: var(--r-bg-track);
}

.track__ran {
  position: absolute;
  inset: 0 auto 0 0;
  width: calc(var(--t) * 100%);
  background: var(--r-ink);
}

.track__vehicle {
  position: absolute;
  z-index: 1;
  top: calc(var(--mark) / 2 - 6px);
  left: calc(50% / var(--n) + (100% - 100% / var(--n)) * var(--t) - 6px);
  width: 12px;
  height: 12px;
  border: 2px solid var(--r-bg-surface);
  border-radius: var(--r-radius-round);
  background: var(--r-chart-now);
}

.track__stop {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  min-width: 0;
  padding: 0 2px 2px;
  cursor: pointer;
  text-align: center;
}

.track__mark {
  width: var(--mark);
  height: var(--mark);
  border: 2px solid var(--r-ink);
  background: var(--r-bg-surface);
}

.track__stop.is-done .track__mark {
  background: var(--r-ink);
}

.track__stop.is-later .track__mark {
  border-color: var(--r-border-strong);
}

.track__stop.is-selected .track__mark {
  outline: 2px solid var(--r-brand);
  outline-offset: 2px;
}

.track__name {
  max-width: 100%;
  overflow: hidden;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track__stop.is-selected .track__name {
  color: var(--r-text);
  font-weight: var(--r-weight-medium);
}

.track__time {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
}

.track__detail {
  flex: none;
  padding-top: 6px;
  border-top: 1px solid var(--r-border-subtle);
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

/* ── Card and tall: the route runs down ──────────────────────────────────────────────── */
.track--card .track__route,
.track--tall .track__route {
  grid-template-columns: none;
  grid-template-rows: repeat(var(--n), minmax(0, 1fr));
  align-items: center;
}

.track--card .track__rail,
.track--tall .track__rail {
  top: calc(50% / var(--n));
  bottom: calc(50% / var(--n));
  left: calc(var(--mark) / 2 - 1px);
  width: 2px;
  height: auto;
}

.track--card .track__ran,
.track--tall .track__ran {
  inset: 0 0 auto 0;
  width: auto;
  height: calc(var(--t) * 100%);
}

.track--card .track__vehicle,
.track--tall .track__vehicle {
  top: calc(50% / var(--n) + (100% - 100% / var(--n)) * var(--t) - 6px);
  left: calc(var(--mark) / 2 - 6px);
}

.track--card .track__stop,
.track--tall .track__stop {
  flex-direction: row;
  justify-content: flex-start;
  gap: 10px;
  padding: 0;
  text-align: left;
}

.track--card .track__time,
.track--tall .track__time {
  margin-left: auto;
}

.track__stop:focus-visible {
  outline: none;
}
.track__stop:focus-visible .track__name {
  outline: 2px solid var(--r-focus);
  outline-offset: 2px;
}
</style>
