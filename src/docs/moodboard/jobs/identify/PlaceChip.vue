<script setup lang="ts">
/**
 * A place, pinned: its name, where it sits, the time there, and coordinates exact enough to send
 * someone. Switch between decimal degrees and degrees, minutes and seconds, and copy the one the
 * other side reads.
 */
import { computed, ref } from 'vue'
import { Check, Copy } from 'lucide-vue-next'
import { RIconButton, RSegmented } from '@/design-system'
import { time, useNow, type Zone } from '../../kit'
import { dec, dms, useCopy, ZONE_OFFSET } from './shared'

const props = withDefaults(
  defineProps<{
    eyebrow: string
    name: string
    /** City and province, or a line under the name. */
    area: string
    lat: number
    lon: number
    zone: Zone
    extra?: { label: string; value: string }[]
    /** Which way the coordinates read first. */
    format?: 'dec' | 'dms'
    /** Card layout: the outline of the plot around the point, in metres east and north of it. */
    outline?: [number, number][]
    /** `tile` 1x1 · `row` 2x1 · `card` 2x2. */
    layout?: 'tile' | 'row' | 'card'
  }>(),
  { extra: () => [], format: 'dec', layout: 'row' },
)

const fmt = ref(props.format)
const pick = computed({
  get: () => fmt.value,
  set: (v: string | number | undefined) => (fmt.value = v === 'dms' ? 'dms' : 'dec'),
})
const options = [
  { label: 'DEC', value: 'dec' },
  { label: 'DMS', value: 'dms' },
]
const latText = computed(() => (fmt.value === 'dec' ? dec(props.lat) : dms(props.lat, 'lat')))
const lonText = computed(() => (fmt.value === 'dec' ? dec(props.lon) : dms(props.lon, 'lon')))
/* Copied with ASCII signs, the way other tools read coordinates. */
const copyText = computed(() =>
  fmt.value === 'dec' ? `${props.lat.toFixed(4)}, ${props.lon.toFixed(4)}` : `${latText.value} ${lonText.value}`,
)

const now = useNow(10_000)
const local = computed(() => `${time(now.value, props.zone)} ${props.zone}`)
const { copied, copy } = useCopy()

/* The little map: a ruled square, the plot outline and the point at its centre. */
const map = computed(() => {
  const pts = props.outline ?? []
  const span = Math.max(60, ...pts.map(([x, y]) => Math.max(Math.abs(x), Math.abs(y)))) * 1.35
  const toXY = ([x, y]: [number, number]) => `${50 + (x / span) * 50},${50 - (y / span) * 50}`
  return { polygon: pts.map(toXY).join(' '), scale: Math.round((span * 2) / 4) }
})
</script>

<template>
  <div class="mk place" :class="`place--${layout}`">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span class="place__time">{{ local }}<template v-if="layout !== 'tile'"> · {{ ZONE_OFFSET[zone] }}</template></span>
    </div>
    <div class="place__what">
      <p class="place__name mk-truncate">{{ name }}</p>
      <p class="place__area">{{ area }}</p>
    </div>

    <div v-if="layout === 'card'" class="place__split">
      <svg class="place__map" viewBox="0 0 100 100" role="img" :aria-label="`Outline of ${name} around the pin, grid squares ${map.scale} m`">
        <g class="place__grid">
          <line v-for="k in 3" :key="`v${k}`" :x1="k * 25" y1="0" :x2="k * 25" y2="100" />
          <line v-for="k in 3" :key="`h${k}`" x1="0" :y1="k * 25" x2="100" :y2="k * 25" />
        </g>
        <polygon v-if="outline" class="place__plot" :points="map.polygon" />
        <line class="place__cross" x1="50" y1="38" x2="50" y2="62" />
        <line class="place__cross" x1="38" y1="50" x2="62" y2="50" />
        <circle class="place__pin" cx="50" cy="50" r="3.2" />
      </svg>
      <dl class="place__facts">
        <div v-for="x in extra" :key="x.label" class="place__fact">
          <dt class="r-label">{{ x.label }}</dt>
          <dd>{{ x.value }}</dd>
        </div>
        <div class="place__fact">
          <dt class="r-label">Grid</dt>
          <dd class="r-mono">{{ map.scale }} m squares</dd>
        </div>
      </dl>
    </div>
    <dl v-else-if="extra.length" class="place__inline">
      <div v-for="x in extra" :key="x.label"><dt class="r-label">{{ x.label }}</dt><dd>{{ x.value }}</dd></div>
    </dl>

    <div class="place__coords mk-end">
      <button
        v-if="layout === 'tile'"
        type="button"
        class="place__flip mk-reset"
        :aria-label="`Coordinates ${latText}, ${lonText}. Press for ${fmt === 'dec' ? 'degrees, minutes and seconds' : 'decimal degrees'}`"
        @click="fmt = fmt === 'dec' ? 'dms' : 'dec'"
      >
        <span>{{ latText }}</span>
        <span>{{ lonText }}</span>
      </button>
      <p v-else class="place__value" aria-live="polite">{{ latText }}<span class="place__comma">, </span>{{ lonText }}</p>
      <span class="mk-row place__actions">
        <RSegmented v-if="layout !== 'tile'" v-model="pick" :options="options" size="sm" label="Coordinate format" />
        <RIconButton size="xs" variant="ghost" :label="copied ? 'Coordinates copied' : 'Copy coordinates'" @click="copy(copyText)">
          <Check v-if="copied" />
          <Copy v-else />
        </RIconButton>
      </span>
    </div>
  </div>
</template>

<style scoped>
.place {
  gap: 6px;
}

.place__time {
  flex: none;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
}

.place__what {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.place__name {
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
}

.place--card .place__name {
  font-size: var(--r-text-lg);
}

.place__area {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

.place--tile .place__area {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.place__coords {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
  padding-top: 6px;
  border-top: 1px solid var(--r-border-subtle);
}

.place__value {
  min-width: 0;
  overflow: hidden;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.place__comma {
  color: var(--r-text-tertiary);
}

.place__flip {
  display: flex;
  flex-direction: column;
  min-width: 0;
  margin: -2px -4px;
  padding: 2px 4px;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
  line-height: 1.45;
  white-space: nowrap;
  cursor: pointer;
}

.place__flip:hover {
  background: var(--r-bg-hover);
}

.place__actions {
  flex: none;
  gap: 4px;
  margin-right: -6px;
}

.place__inline {
  display: flex;
  gap: 16px;
  min-width: 0;
  font-size: var(--r-text-xs);
}

.place__inline div {
  display: flex;
  gap: 6px;
  min-width: 0;
}

.place__inline dd {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Card: the map beside the facts */
.place__split {
  display: grid;
  grid-template-columns: 116px minmax(0, 1fr);
  gap: 14px;
  min-height: 0;
}

.place__map {
  width: 116px;
  height: 116px;
  border: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}

.place__grid line {
  stroke: var(--r-chart-grid);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

.place__plot {
  fill: var(--r-brand-soft);
  stroke: var(--r-brand);
  stroke-width: 1.5;
  stroke-linejoin: miter;
  vector-effect: non-scaling-stroke;
}

.place__cross {
  stroke: var(--r-text-tertiary);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

/* The pin is a point, so it is round, with a ring in the surface colour. */
.place__pin {
  fill: var(--r-brand);
  stroke: var(--r-bg-surface);
  stroke-width: 2;
  vector-effect: non-scaling-stroke;
}

.place__facts {
  display: flex;
  flex-direction: column;
  min-width: 0;
  border-top: 1px solid var(--r-border-subtle);
}

.place__fact {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 4px 0;
  border-bottom: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-xs);
}

.place__fact dd {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
