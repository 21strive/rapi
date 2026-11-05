<script setup lang="ts">
/**
 * A water level against its alert marks: the figure, the band it is in as a word, the marks drawn
 * dashed and the last half hour as a line. Step through the gauges with the arrow keys or the two
 * keys beside the name; each keeps reading while it is not shown.
 */
import { computed, ref, shallowRef, watch } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { RIconButton, RSparkline, RStatus, type StatusTone } from '@/design-system'
import { num, seeded, signed, time, useTick, type Zone } from '../../kit'
import { clamp } from './shared'

interface Band {
  /** The level this band starts at. */
  from: number
  word: string
  tone: StatusTone
}
interface Station {
  name: string
  level: number
  /** Change per reading, on average. */
  trend: number
  min: number
  max: number
  bands: Band[]
}

const props = withDefaults(
  defineProps<{
    label: string
    stations: Station[]
    unit?: string
    decimals?: number
    /** Seconds between readings. */
    every?: number
    seed: string
    zone?: Zone
    layout?: 'tall' | 'strip' | 'card' | 'mini'
  }>(),
  { unit: 'cm', decimals: 0, every: 2, zone: 'WIB', layout: 'tall' },
)

const N = 30
const rnd = seeded(props.seed)
const series = shallowRef(
  props.stations.map((s) => {
    const out: number[] = []
    let v = s.level - s.trend * N
    for (let i = 0; i < N; i++) {
      v = clamp(v + s.trend + (rnd() - 0.5) * Math.abs(s.trend) * 3, s.min, s.max)
      out.push(v)
    }
    out[N - 1] = s.level
    return out
  }),
)
const read = ref(new Date())

const tick = useTick(props.every * 1000)
watch(tick, () => {
  series.value = series.value.map((list, i) => {
    const s = props.stations[i]
    const v = clamp(list[N - 1] + s.trend + (rnd() - 0.5) * Math.abs(s.trend) * 3, s.min, s.max)
    return [...list.slice(1), v]
  })
  read.value = new Date()
})

const at = ref(0)
const station = computed(() => props.stations[at.value])
const values = computed(() => series.value[at.value])
const level = computed(() => values.value[N - 1])
const band = computed(() => [...station.value.bands].reverse().find((b) => level.value >= b.from) ?? station.value.bands[0])
const share = (v: number) => clamp((v - station.value.min) / (station.value.max - station.value.min), 0, 1) * 100
const perHour = computed(() => ((values.value[N - 1] - values.value[0]) / ((N - 1) * props.every)) * 3600)

function go(step: number) {
  at.value = (at.value + step + props.stations.length) % props.stations.length
}
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') go(1)
  else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') go(-1)
  else return
  event.preventDefault()
}
const horizontal = computed(() => props.layout === 'strip' || props.layout === 'mini')
</script>

<template>
  <div class="mk water" :class="[`water--${layout}`, { 'is-horizontal': horizontal }]" @keydown="onKeydown">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ label }}</span>
      <RStatus tone="signal" pulse size="sm" :label="layout === 'mini' || layout === 'tall' ? 'Live' : `Live · ${time(read, zone, true)}`" />
    </div>

    <div class="water__pick">
      <RIconButton v-if="stations.length > 1" label="Previous gauge" size="xs" variant="ghost" @click="go(-1)">
        <ChevronLeft :size="14" />
      </RIconButton>
      <p class="water__name mk-truncate" aria-live="polite">{{ station.name }}</p>
      <RIconButton v-if="stations.length > 1" label="Next gauge" size="xs" variant="ghost" @click="go(1)">
        <ChevronRight :size="14" />
      </RIconButton>
    </div>

    <div class="water__body mk-grow">
      <div class="water__read">
        <p class="water__fig">
          <span class="mk-fig">{{ num(level, decimals) }}</span>
          <span class="mk-unit">{{ unit }}</span>
        </p>
        <RStatus :tone="band.tone" shape="square" size="sm" :label="band.word" />
        <p v-if="layout !== 'mini'" class="water__rate">{{ signed(perHour, decimals ? 1 : 0, ` ${unit}/h`) }}</p>
        <RSparkline v-if="layout === 'card' || layout === 'strip'" class="water__spark" :values="values" color="var(--r-chart-1)" :height="28" :label="`${station.name}, last ${N} readings`" />
      </div>

      <div class="water__gauge" role="meter" :aria-valuemin="station.min" :aria-valuemax="station.max" :aria-valuenow="Math.round(level)" :aria-valuetext="`${num(level, decimals)} ${unit}, ${band.word}`" :aria-label="station.name">
        <span class="water__fill" :style="{ '--v': share(level) }" />
        <span v-for="b in station.bands.slice(1)" :key="b.word" class="water__mark" :style="{ '--v': share(b.from) }">
          <span class="water__mark-label">{{ b.word }} {{ num(b.from, decimals) }}</span>
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.water {
  gap: 8px;
}

.water__pick {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.water__name {
  flex: 1;
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
}

.water--tall .water__name {
  white-space: normal;
  line-height: 1.25;
}

.water__body {
  display: flex;
  gap: 14px;
}

.water__read {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.water__fig {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.water__fig .mk-fig {
  font-size: var(--r-text-3xl);
}

.water__rate {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
}

.water__spark {
  margin-top: auto;
}

.water__gauge {
  position: relative;
  flex: none;
  order: -1;
  width: 36px;
  margin-right: 84px;
  border: 1px solid var(--r-border-strong);
  background: var(--r-bg-track);
}

.water__fill {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: calc(var(--v) * 1%);
  background: var(--r-chart-1);
  transition: height var(--r-duration-slow) var(--r-ease-out);
}

.water__mark {
  position: absolute;
  right: -6px;
  bottom: calc(var(--v) * 1%);
  left: -6px;
  border-top: 1px dashed var(--r-chart-ink);
}

.water__mark-label {
  position: absolute;
  bottom: -6px;
  left: calc(100% + 4px);
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: 9px;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  white-space: nowrap;
}

/* Tall: the figure on top, the gauge under it with its marks named on the right. */
.water--tall .water__body {
  flex-direction: column;
  gap: 10px;
}

.water--tall .water__read {
  flex: none;
}

.water--tall .water__gauge {
  flex: 1 1 auto;
  order: 0;
  margin-right: 0;
}

/* Horizontal: the gauge lies under the figure, marks standing on it. */
.water.is-horizontal .water__body {
  flex-direction: column;
  gap: 8px;
}

.water.is-horizontal .water__gauge {
  order: 0;
  width: auto;
  height: 12px;
  margin-top: auto;
  margin-right: 0;
  margin-bottom: 12px;
}

.water.is-horizontal .water__fill {
  top: 0;
  width: calc(var(--v) * 1%);
  height: auto;
}

.water.is-horizontal .water__mark {
  top: -4px;
  right: auto;
  bottom: -4px;
  left: calc(var(--v) * 1%);
  border-top: 0;
  border-left: 1px dashed var(--r-chart-ink);
}

.water.is-horizontal .water__mark-label {
  top: calc(100% + 2px);
  right: auto;
  bottom: auto;
  left: 0;
  transform: translateX(-50%);
}

.water--mini .water__fig .mk-fig {
  font-size: var(--r-text-2xl);
}

.water--mini .water__mark-label {
  display: none;
}

.water--strip .water__read {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 12px;
}

.water--strip .water__spark {
  flex: 1;
  min-width: 80px;
  margin-top: 0;
}

@media (prefers-reduced-motion: reduce) {
  .water__fill {
    transition: none;
  }
}

/* On an orange tile the signal colour is the panel itself: live lamps inside turn black. */
.r-card--signal .water {
  --r-signal: var(--r-on-signal);
}
</style>
