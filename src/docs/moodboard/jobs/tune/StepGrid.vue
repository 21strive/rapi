<script setup lang="ts">
/**
 * A step grid, the Teenage Engineering way: tracks down the side, steps across in groups of four,
 * a cell lit for each step that fires. A drum pattern, a signal plan, a fertigation fortnight, a
 * turning schedule. Click a cell (drag to paint a row), or move with the arrows and press Space.
 * Grids that play run an orange playhead while they are on screen; exclusive grids allow one
 * track per column, as a signal phase or a patient's position does.
 */
import { computed, nextTick, ref, watch } from 'vue'
import { Minus, Pause, Play, Plus } from 'lucide-vue-next'
import { RIconButton } from '@/design-system'
import { useTick } from '../../kit'
import { capture, clamp } from './shared'

interface Track {
  name: string
  /** "x" on, "." off, one character per step. */
  steps: string
}
interface Say {
  text: string
  word?: string
  tone?: 'success' | 'warning' | 'danger'
}

const props = withDefaults(
  defineProps<{
    label: string
    meta?: string
    tracks: Track[]
    /** Steps per group, for the visual rhythm. */
    group?: number
    /** One track per column. */
    exclusive?: boolean
    /** Plays at this tempo (steps are sixteenths); omit for a plan that does not play. */
    bpm?: number
    /** Milliseconds per step for plans that play faster than real time. */
    stepMs?: number
    /** A fixed "now" column (today, this hour). */
    now?: number
    /** Labels under the columns, one per group start. */
    cols?: string[]
    say: (grid: boolean[][]) => Say
  }>(),
  { group: 4, exclusive: false },
)

const grid = ref(props.tracks.map((t) => Array.from(t.steps, (ch) => ch === 'x')))
const width = computed(() => grid.value[0]?.length ?? 16)
const focus = ref({ r: 0, c: 0 })
const cells = new Map<string, HTMLElement>()
const keyOf = (r: number, c: number) => `${r}:${c}`

function setCell(r: number, c: number, on: boolean) {
  const next = grid.value.map((row) => [...row])
  if (props.exclusive && on) next.forEach((row) => (row[c] = false))
  next[r][c] = on
  grid.value = next
}

/* ── Playback: a step clock that only runs while playing and on screen ─────── */
const playing = ref(false)
const tempo = ref(props.bpm ?? 120)
const head = ref(-1)
const plays = computed(() => props.bpm !== undefined || props.stepMs !== undefined)
const ms = computed(() => props.stepMs ?? 60000 / tempo.value / 4)
const tick = plays.value ? useTick(25) : ref(0)
let nextAt = 0
watch(tick, () => {
  if (!playing.value) return
  const t = performance.now()
  if (t < nextAt) return
  head.value = (head.value + 1) % width.value
  nextAt = Math.max(nextAt + ms.value, t)
})
function toggle() {
  playing.value = !playing.value
  if (playing.value) nextAt = performance.now()
}

/* ── Painting with the pointer ─────────────────────────────────────────────── */
const area = ref<HTMLElement | null>(null)
let paint: boolean | null = null
function cellAt(event: PointerEvent) {
  const el = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null
  const r = el?.dataset?.r
  const c = el?.dataset?.c
  return r !== undefined && c !== undefined ? { r: Number(r), c: Number(c) } : null
}
function onPointerdown(event: PointerEvent) {
  if (event.button !== 0 || !area.value) return
  const hit = cellAt(event)
  if (!hit) return
  event.preventDefault()
  capture(area.value, event)
  paint = !grid.value[hit.r][hit.c]
  focus.value = hit
  cells.get(keyOf(hit.r, hit.c))?.focus({ preventScroll: true })
  setCell(hit.r, hit.c, paint)
}
function onPointermove(event: PointerEvent) {
  if (paint === null) return
  const hit = cellAt(event)
  if (hit && grid.value[hit.r][hit.c] !== paint) setCell(hit.r, hit.c, paint)
}
function onPointerup() {
  paint = null
}

function onKeydown(r: number, c: number, event: KeyboardEvent) {
  let nr = r
  let nc = c
  switch (event.key) {
    case 'ArrowRight':
      nc = c + 1
      break
    case 'ArrowLeft':
      nc = c - 1
      break
    case 'ArrowDown':
      nr = r + 1
      break
    case 'ArrowUp':
      nr = r - 1
      break
    case 'Home':
      nc = 0
      break
    case 'End':
      nc = width.value - 1
      break
    case ' ':
    case 'Enter':
      event.preventDefault()
      setCell(r, c, !grid.value[r][c])
      return
    default:
      return
  }
  event.preventDefault()
  focus.value = { r: clamp(nr, 0, grid.value.length - 1), c: clamp(nc, 0, width.value - 1) }
  nextTick(() => cells.get(keyOf(focus.value.r, focus.value.c))?.focus())
}

const said = computed(() => props.say(grid.value))
const colLabel = (c: number) => (props.cols && c % props.group === 0 ? props.cols[c / props.group] ?? '' : '')
</script>

<template>
  <div class="mk steps">
    <div class="mk-row mk-between steps__head">
      <span class="r-eyebrow mk-truncate">{{ label }}</span>
      <div class="mk-row steps__tools">
        <span v-if="meta" class="r-label">{{ meta }}</span>
        <template v-if="props.bpm !== undefined">
          <RIconButton label="Slower" size="xs" variant="ghost" @click="tempo = Math.max(60, tempo - 1)"><Minus aria-hidden="true" /></RIconButton>
          <span class="steps__bpm r-pixel">{{ tempo }}</span>
          <span class="mk-unit">BPM</span>
          <RIconButton label="Faster" size="xs" variant="ghost" @click="tempo = Math.min(200, tempo + 1)"><Plus aria-hidden="true" /></RIconButton>
        </template>
        <RIconButton
          v-if="plays"
          :label="playing ? 'Pause' : 'Play'"
          size="xs"
          :variant="playing ? 'solid' : 'outline'"
          :pressed="playing"
          @click="toggle"
        >
          <Pause v-if="playing" aria-hidden="true" />
          <Play v-else aria-hidden="true" />
        </RIconButton>
      </div>
    </div>

    <div
      ref="area"
      class="steps__grid mk-grow"
      role="group"
      :aria-label="label"
      :style="{ '--steps': width, '--tracks': grid.length }"
      @pointerdown="onPointerdown"
      @pointermove="onPointermove"
      @pointerup="onPointerup"
      @pointercancel="onPointerup"
      @lostpointercapture="onPointerup"
    >
      <template v-for="(row, r) in grid" :key="r">
        <span class="steps__name mk-truncate" aria-hidden="true">{{ tracks[r].name }}</span>
        <button
          v-for="(on, c) in row"
          :key="c"
          :ref="(el) => el && cells.set(keyOf(r, c), el as HTMLElement)"
          type="button"
          class="steps__cell mk-reset"
          :class="{
            'is-on': on,
            'is-head': c === head && playing,
            'is-now': c === now,
            'is-group': c % group === 0 && c > 0,
          }"
          :data-r="r"
          :data-c="c"
          :aria-pressed="on"
          :aria-label="`${tracks[r].name}, step ${c + 1}`"
          :tabindex="focus.r === r && focus.c === c ? 0 : -1"
          @keydown="onKeydown(r, c, $event)"
        />
      </template>
      <span class="steps__name" aria-hidden="true" />
      <span
        v-for="c in width"
        :key="`l${c}`"
        class="steps__col"
        :class="{ 'is-now': c - 1 === now, 'is-group': (c - 1) % group === 0 && c > 1 }"
        aria-hidden="true"
      >
        {{ c - 1 === now ? 'Now' : colLabel(c - 1) }}
      </span>
    </div>

    <p class="steps__say" aria-live="polite">
      <span class="mk-truncate">{{ said.text }}</span>
      <span v-if="said.word" class="steps__word" :class="`is-${said.tone}`">{{ said.word }}</span>
    </p>
  </div>
</template>

<style scoped>
.steps {
  gap: 8px;
}

.steps__head {
  min-height: 24px;
}
.steps__tools {
  flex: none;
  gap: 4px;
}

.steps__bpm {
  min-width: 26px;
  font-size: var(--r-text-lg);
  text-align: right;
}

.steps__grid {
  display: grid;
  grid-template-columns: 64px repeat(var(--steps), minmax(0, 1fr));
  grid-template-rows: repeat(var(--tracks), minmax(14px, 1fr)) auto;
  gap: 2px;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.steps__name {
  align-self: center;
  padding-right: 6px;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-medium);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.steps__cell {
  min-width: 0;
  min-height: 0;
  background: var(--r-chart-track);
  cursor: pointer;
  transition: background-color var(--r-duration-instant) var(--r-ease-out);
}
.steps__cell.is-group {
  margin-left: 3px;
}
.steps__cell:hover {
  background: var(--r-bg-pressed);
}
.steps__cell.is-on {
  background: var(--r-ink);
}
.steps__cell.is-on:hover {
  background: var(--r-ink-hover);
}
/* Live: the playhead column and the "now" column are the one orange. */
.steps__cell.is-head,
.steps__cell.is-now {
  background: var(--r-signal-soft);
}
.steps__cell.is-head.is-on,
.steps__cell.is-now.is-on {
  background: var(--r-signal);
}
.steps__cell:focus-visible {
  z-index: 1;
  outline-offset: 1px;
}

.steps__col {
  align-self: start;
  overflow: visible;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
  line-height: 12px;
  white-space: nowrap;
}
.steps__col.is-group {
  margin-left: 3px;
}
.steps__col.is-now {
  color: var(--r-signal-text);
  font-weight: var(--r-weight-semibold);
  text-transform: uppercase;
}

.steps__say {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}
.steps__word {
  flex: none;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.steps__word.is-success {
  color: var(--r-success-text);
}
.steps__word.is-warning {
  color: var(--r-warning-text);
}
.steps__word.is-danger {
  color: var(--r-danger-text);
}
</style>
