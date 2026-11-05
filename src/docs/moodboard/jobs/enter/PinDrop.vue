<script setup lang="ts">
/**
 * A point on a map. Where exactly is something a finger finds in a second; describing it takes a
 * paragraph and still misses the gate. Click or drag on the map, nudge with the arrow keys, or
 * type the coordinates; the nearest landmark is read back as the check.
 */
import { computed, ref, useId } from 'vue'
import { CircleAlert, Crosshair } from 'lucide-vue-next'
import { RInput, useElementSize } from '@/design-system'
import { num, seeded, usePointerDrag } from '../../kit'

interface Place {
  name: string
  at: [number, number]
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    meta?: string
    label?: string
    center: [number, number]
    /** Degrees of longitude across the map. */
    span?: number
    pin?: [number, number]
    look?: 'streets' | 'fields' | 'river' | 'grid'
    places?: Place[]
    /** Street or feature names printed along the edges. */
    names?: string[]
    /** Read the point back in degrees, minutes and seconds instead of a landmark. */
    dms?: boolean
    seed?: string
  }>(),
  { label: 'Coordinates', span: 0.012, look: 'streets', places: () => [], names: () => [], seed: 'pin' },
)

const uid = useId()
const box = ref<HTMLElement | null>(null)
const size = useElementSize(box)
const W = computed(() => size.width.value || 320)
const H = computed(() => size.height.value || 200)

/* Equal degrees per pixel both ways: close enough at these latitudes and this scale. */
const perPx = computed(() => props.span / W.value)
const toX = (lon: number) => (lon - props.center[1]) / perPx.value + W.value / 2
const toY = (lat: number) => H.value / 2 - (lat - props.center[0]) / perPx.value
const toLon = (x: number) => props.center[1] + (x - W.value / 2) * perPx.value
const toLat = (y: number) => props.center[0] - (y - H.value / 2) * perPx.value

const at = ref<[number, number]>(props.pin ?? props.center)
const fmt = (v: number) => num(v, 5)
const coordText = (p: [number, number]) => `${fmt(p[0])}, ${fmt(p[1])}`
const typed = ref<string | number | null>(coordText(at.value))
const problem = ref('')

/* ── The schematic, in fractions of the map, seeded so it is the same on every load ───── */
const rnd = seeded(props.seed)
const j = (n: number) => (rnd() - 0.5) * n
type Seg = { x1: number; y1: number; x2: number; y2: number }
const minor: Seg[] = []
if (props.look !== 'grid') {
  const step = props.look === 'fields' ? 0.22 : 0.15
  for (let x = 0.06 + j(0.04); x < 1; x += step + j(0.05)) minor.push({ x1: x, y1: 0, x2: x + j(0.1), y2: 1 })
  for (let y = 0.1 + j(0.05); y < 1; y += step + 0.06 + j(0.06)) minor.push({ x1: 0, y1: y, x2: 1, y2: y + j(0.12) })
}
const major = props.look === 'grid' ? [] : [[0, 0.74], [0.42, 0.5], [1, 0.26]]
const plots =
  props.look === 'fields'
    ? Array.from({ length: 15 }, (_, i) => ({ x: 0.03 + (i % 5) * 0.2 + j(0.02), y: 0.06 + Math.floor(i / 5) * 0.32 + j(0.03), w: 0.15 + j(0.03), h: 0.24 + j(0.04) }))
    : []
const riverPts = props.look === 'river' || props.look === 'fields' ? Array.from({ length: 9 }, (_, i) => [i / 8, 0.12 + i * 0.1 + j(0.12)]) : []
const coastPts = props.look === 'grid' ? [[0, 0.62], [0.18, 0.55], [0.32, 0.67], [0.48, 0.58], [0.62, 0.71], [0.8, 0.6], [1, 0.68]] : []

const path = (pts: number[][]) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${(x * W.value).toFixed(1)} ${(y * H.value).toFixed(1)}`).join(' ')
const sea = computed(() => (coastPts.length ? `${path(coastPts)} L${W.value} ${H.value} L0 ${H.value} Z` : ''))
const gridX = computed(() => (props.look === 'grid' ? Array.from({ length: 9 }, (_, i) => (i * W.value) / 8) : []))
const gridY = computed(() => (props.look === 'grid' ? Array.from({ length: 6 }, (_, i) => (i * H.value) / 5) : []))

/* ── Pin ──────────────────────────────────────────────────────────────────────────── */
const pinX = computed(() => toX(at.value[1]))
const pinY = computed(() => toY(at.value[0]))

function place(lat: number, lon: number) {
  at.value = [Number(lat.toFixed(5)), Number(lon.toFixed(5))]
  typed.value = coordText(at.value)
  problem.value = ''
}

function fromPointer(event: PointerEvent) {
  const r = box.value?.getBoundingClientRect()
  if (!r) return
  const x = Math.max(0, Math.min(r.width, event.clientX - r.left))
  const y = Math.max(0, Math.min(r.height, event.clientY - r.top))
  place(toLat(y), toLon(x))
}

const { onPointerdown } = usePointerDrag({ onStart: fromPointer, onMove: (_, e) => fromPointer(e) })

function onKeydown(event: KeyboardEvent) {
  const step = perPx.value * (event.shiftKey ? 24 : 4)
  const moves: Record<string, [number, number]> = {
    ArrowUp: [step, 0],
    ArrowDown: [-step, 0],
    ArrowLeft: [0, -step],
    ArrowRight: [0, step],
  }
  const m = moves[event.key]
  if (!m) return
  event.preventDefault()
  const lat = Math.max(toLat(H.value), Math.min(toLat(0), at.value[0] + m[0]))
  const lon = Math.max(toLon(0), Math.min(toLon(W.value), at.value[1] + m[1]))
  place(lat, lon)
}

function onType() {
  const t = String(typed.value ?? '').replace(/−/g, '-')
  const m = /^\s*(-?\d+(?:\.\d+)?)\s*[,\s]\s*(-?\d+(?:\.\d+)?)\s*$/.exec(t)
  if (!m) {
    problem.value = 'Type latitude, longitude, like −6.2297, 106.8669.'
    return
  }
  const lat = Number(m[1])
  const lon = Number(m[2])
  if (lat > toLat(0) || lat < toLat(H.value) || lon < toLon(0) || lon > toLon(W.value)) {
    problem.value = 'That point is outside this map.'
    return
  }
  place(lat, lon)
}

/* ── Read-back ────────────────────────────────────────────────────────────────────── */
function metres(a: [number, number], b: [number, number]) {
  const dy = (a[0] - b[0]) * 111320
  const dx = (a[1] - b[1]) * 111320 * Math.cos((a[0] * Math.PI) / 180)
  return Math.hypot(dx, dy)
}

function dmsOf(v: number, pos: string, neg: string) {
  const a = Math.abs(v)
  const d = Math.floor(a)
  const m = Math.floor((a - d) * 60)
  const s = Math.round(((a - d) * 60 - m) * 60)
  return `${d}°${String(m).padStart(2, '0')}′${String(Math.min(59, s)).padStart(2, '0')}″${v >= 0 ? pos : neg}`
}

const reading = computed(() => {
  if (props.dms) return `${dmsOf(at.value[0], 'N', 'S')}  ${dmsOf(at.value[1], 'E', 'W')}`
  let best: { name: string; m: number } | null = null
  for (const p of props.places) {
    const m = metres(at.value, p.at)
    if (!best || m < best.m) best = { name: p.name, m }
  }
  if (!best) return ''
  return best.m < 15 ? `At ${best.name}` : `${num(Math.round(best.m / 5) * 5)} m from ${best.name}`
})

const shownCoords = computed(() => `${fmt(at.value[0]).replace('-', '−')}, ${fmt(at.value[1]).replace('-', '−')}`)
</script>

<template>
  <div class="mk en-root pin">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span v-if="meta" class="en-meta">{{ meta }}</span>
    </div>

    <div
      ref="box"
      class="pin__map mk-grow"
      tabindex="0"
      role="group"
      aria-roledescription="map"
      :aria-label="`Map. Pin at ${shownCoords}. Click or drag to move it, or use the arrow keys; Shift moves further`"
      @pointerdown="onPointerdown"
      @keydown="onKeydown"
    >
      <svg :viewBox="`0 0 ${W} ${H}`" :width="W" :height="H" aria-hidden="true">
        <rect class="pin__ground" x="0" y="0" :width="W" :height="H" />
        <path v-if="sea" class="pin__sea" :d="sea" />
        <line v-for="x in gridX" :key="`gx${x}`" class="pin__grid" :x1="x" y1="0" :x2="x" :y2="H" />
        <line v-for="y in gridY" :key="`gy${y}`" class="pin__grid" x1="0" :y1="y" :x2="W" :y2="y" />
        <text v-for="(x, i) in gridX.slice(1, -1)" :key="`gl${i}`" class="pin__name" :x="x + 3" y="11">{{ 47 + i }}</text>
        <rect
          v-for="(p, i) in plots"
          :key="`p${i}`"
          class="pin__plot"
          :x="p.x * W"
          :y="p.y * H"
          :width="p.w * W"
          :height="p.h * H"
        />
        <path v-if="riverPts.length" class="pin__river" :d="path(riverPts)" />
        <line
          v-for="(s, i) in minor"
          :key="`r${i}`"
          class="pin__road"
          :x1="s.x1 * W"
          :y1="s.y1 * H"
          :x2="s.x2 * W"
          :y2="s.y2 * H"
        />
        <path v-if="major.length" class="pin__road--major" :d="path(major)" />
        <text v-for="(n, i) in names" :key="n" class="pin__name" :x="i % 2 ? W - 8 : 8" :y="i % 2 ? H - 8 : 14" :text-anchor="i % 2 ? 'end' : 'start'">
          {{ n }}
        </text>
        <g v-for="p in places" :key="p.name">
          <rect class="pin__poi" :x="toX(p.at[1]) - 2.5" :y="toY(p.at[0]) - 2.5" width="5" height="5" />
          <text class="pin__poi-name" :x="toX(p.at[1]) + 7" :y="toY(p.at[0]) + 3.5">{{ p.name }}</text>
        </g>
        <line class="pin__hair" :x1="pinX" y1="0" :x2="pinX" :y2="H" />
        <line class="pin__hair" x1="0" :y1="pinY" :x2="W" :y2="pinY" />
        <rect class="pin__mark" :x="pinX - 7" :y="pinY - 7" width="14" height="14" />
        <rect class="pin__dot" :x="pinX - 2" :y="pinY - 2" width="4" height="4" />
      </svg>
    </div>

    <form class="pin__form" novalidate @submit.prevent="onType">
      <RInput
        v-model="typed"
        size="sm"
        mono
        :invalid="!!problem"
        :aria-label="`${label}, latitude and longitude`"
        :aria-describedby="`${uid}-msg`"
        autocomplete="off"
        spellcheck="false"
        @blur="onType"
      >
        <template #leading><Crosshair /></template>
      </RInput>
    </form>
    <p :id="`${uid}-msg`" class="en-msg" :class="{ 'en-msg--error': problem }" aria-live="polite">
      <CircleAlert v-if="problem" aria-hidden="true" />
      <span class="mk-truncate" :class="{ 'r-mono': dms && !problem }">{{ problem || reading }}</span>
    </p>
  </div>
</template>

<style scoped>
.pin {
  gap: 6px;
}

.pin__map {
  position: relative;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--r-border);
  cursor: crosshair;
  touch-action: none;
}

.pin__map:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: 1px;
}

.pin__map svg {
  position: absolute;
  inset: 0;
  display: block;
  max-width: none;
}

.pin__ground {
  fill: var(--r-bg-muted);
}

.pin__sea {
  fill: var(--r-bg-track);
}

.pin__grid {
  stroke: var(--r-border);
  stroke-width: 1;
}

.pin__plot {
  fill: var(--r-bg-surface);
  stroke: var(--r-border);
  stroke-width: 1;
}

.pin__river {
  fill: none;
  stroke: var(--r-border-strong);
  stroke-opacity: 0.7;
  stroke-width: 10;
  stroke-linejoin: bevel;
}

.pin__road {
  stroke: var(--r-border-strong);
  stroke-width: 1;
}

.pin__road--major {
  fill: none;
  stroke: var(--r-text-tertiary);
  stroke-width: 2;
  stroke-linejoin: bevel;
}

.pin__name,
.pin__poi-name {
  fill: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.pin__poi-name {
  fill: var(--r-text-secondary);
}

.pin__poi {
  fill: var(--r-text);
}

.pin__hair {
  stroke: var(--r-brand);
  stroke-width: 1;
  stroke-opacity: 0.45;
}

.pin__mark {
  fill: none;
  stroke: var(--r-brand);
  stroke-width: 2;
}

.pin__dot {
  fill: var(--r-brand);
}

.pin__form {
  flex: none;
}
</style>
