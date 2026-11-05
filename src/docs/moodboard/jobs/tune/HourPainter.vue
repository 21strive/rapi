<script setup lang="ts">
/**
 * Hours painted across a day or a week: when the car charges, when notifications hold, when
 * deploys are allowed. Press a cell and drag across others to paint them the same way; with a
 * cell focused, arrows move and Space toggles. The line under the grid reads the painted hours
 * back as ranges and a total.
 */
import { computed, nextTick, ref } from 'vue'
import { pad } from '../../kit'
import { capture, clamp } from './shared'

interface Say {
  text: string
  word?: string
  tone?: 'success' | 'warning' | 'danger'
}

const props = withDefaults(
  defineProps<{
    label: string
    /** Row names (days); one unnamed row for a single day. */
    rows?: string[]
    /** Hours per cell: 1 (24 cells) or 2 (12 cells). */
    per?: 1 | 2
    /** Painted hours per row, as [from, to) pairs in hours. */
    value: [number, number][][]
    /** A labelled span above the cells, e.g. the peak tariff. */
    band?: { from: number; to: number; label: string }
    say: (hours: number, ranges: string[], grid: boolean[][]) => Say
  }>(),
  { rows: () => [''], per: 1 },
)

const cols = computed(() => 24 / props.per)
const grid = ref<boolean[][]>(
  props.rows.map((_, r) =>
    Array.from({ length: 24 / props.per }, (_, c) => (props.value[r] ?? []).some(([a, b]) => c * props.per >= a && c * props.per < b)),
  ),
)
const focus = ref({ r: 0, c: 0 })
const cells = new Map<string, HTMLElement>()
const keyOf = (r: number, c: number) => `${r}:${c}`

const hh = (h: number) => `${pad(h % 24 === 0 && h > 0 ? 24 : h)}:00`
function rangesOf(row: boolean[]) {
  const out: string[] = []
  let start = -1
  row.forEach((on, c) => {
    if (on && start < 0) start = c
    if ((!on || c === row.length - 1) && start >= 0) {
      const end = on ? c + 1 : c
      out.push(`${hh(start * props.per)}–${hh(end * props.per)}`)
      start = -1
    }
  })
  // A range that runs past midnight reads as one: 22:00–24:00 and 00:00–05:00 → 22:00–05:00.
  if (out.length > 1 && row[0] && row[row.length - 1]) {
    const first = out.shift()!
    const last = out.pop()!
    out.push(`${last.split('–')[0]}–${first.split('–')[1]}`)
  }
  return out
}
const hours = computed(() => grid.value.reduce((s, row) => s + row.filter(Boolean).length * props.per, 0))
const said = computed(() => props.say(hours.value, rangesOf(grid.value[0]), grid.value))

/* ── Painting ────────────────────────────────────────────────────────────── */
const area = ref<HTMLElement | null>(null)
let paint: boolean | null = null
function cellAt(event: PointerEvent) {
  const el = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null
  const r = el?.dataset?.r
  const c = el?.dataset?.c
  return r !== undefined && c !== undefined ? { r: Number(r), c: Number(c) } : null
}
function setCell(r: number, c: number, on: boolean) {
  if (grid.value[r][c] === on) return
  const next = grid.value.map((row) => [...row])
  next[r][c] = on
  grid.value = next
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
  if (hit) setCell(hit.r, hit.c, paint)
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
      nc = cols.value - 1
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
  focus.value = { r: clamp(nr, 0, props.rows.length - 1), c: clamp(nc, 0, cols.value - 1) }
  nextTick(() => cells.get(keyOf(focus.value.r, focus.value.c))?.focus())
}

const ticks = computed(() => [0, 6, 12, 18, 24].map((h) => ({ h, at: (h / 24) * 100 })))
const cellName = (r: number, c: number) =>
  `${props.rows[r] ? `${props.rows[r]} ` : ''}${hh(c * props.per)} to ${hh((c + 1) * props.per)}`
</script>

<template>
  <div class="mk hours" :class="{ 'hours--week': rows.length > 1 }">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ label }}</span>
      <span class="r-label hours__total">{{ hours }} h</span>
    </div>

    <div class="hours__body" :class="{ 'mk-grow': rows.length > 1 }">
      <div v-if="band" class="hours__band" aria-hidden="true">
        <span :style="{ left: `${(band.from / 24) * 100}%`, width: `${((band.to - band.from) / 24) * 100}%` }">{{ band.label }}</span>
      </div>

      <div
        ref="area"
        class="hours__grid"
        role="group"
        :aria-label="label"
        :style="{ '--cols': cols, '--rows': rows.length }"
        @pointerdown="onPointerdown"
        @pointermove="onPointermove"
        @pointerup="onPointerup"
        @pointercancel="onPointerup"
        @lostpointercapture="onPointerup"
      >
        <template v-for="(row, r) in grid" :key="r">
          <span v-if="rows.length > 1" class="hours__day" aria-hidden="true">{{ rows[r] }}</span>
          <button
            v-for="(on, c) in row"
            :key="c"
            :ref="(el) => el && cells.set(keyOf(r, c), el as HTMLElement)"
            type="button"
            class="hours__cell mk-reset"
            :class="{ 'is-on': on }"
            :data-r="r"
            :data-c="c"
            :aria-pressed="on"
            :aria-label="cellName(r, c)"
            :tabindex="focus.r === r && focus.c === c ? 0 : -1"
            @keydown="onKeydown(r, c, $event)"
          />
        </template>
      </div>

      <div class="hours__ticks" aria-hidden="true">
        <span v-for="t in ticks" :key="t.h" :style="{ left: `${t.at}%` }">{{ pad(t.h) }}</span>
      </div>
    </div>

    <p class="hours__say mk-end" aria-live="polite">
      <span class="mk-truncate">{{ said.text }}</span>
      <span v-if="said.word" class="hours__word" :class="`is-${said.tone}`">{{ said.word }}</span>
    </p>
  </div>
</template>

<style scoped>
.hours {
  gap: 8px;
  --day: 0px;
}
.hours--week {
  --day: 34px;
}

.hours__total {
  flex: none;
  color: var(--r-text);
}

.hours__body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 0;
}

.hours__band {
  position: relative;
  height: 14px;
  margin-left: var(--day);
}
.hours__band span {
  position: absolute;
  top: 0;
  height: 14px;
  overflow: hidden;
  border-top: 2px solid var(--r-text-secondary);
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
  line-height: 12px;
  text-align: center;
  text-transform: uppercase;
  white-space: nowrap;
}

.hours__grid {
  display: grid;
  flex: 1 1 auto;
  grid-template-columns: var(--day) repeat(var(--cols), minmax(0, 1fr));
  grid-auto-rows: minmax(14px, 1fr);
  gap: 2px;
  min-height: 26px;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}
.hours:not(.hours--week) .hours__grid {
  grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
  height: 28px;
  flex: none;
}

.hours__day {
  align-self: center;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.hours__cell {
  min-width: 0;
  background: var(--r-chart-track);
  cursor: pointer;
  transition: background-color var(--r-duration-instant) var(--r-ease-out);
}
.hours__cell:hover {
  background: var(--r-bg-pressed);
}
.hours__cell.is-on {
  background: var(--r-brand);
}
.hours__cell.is-on:hover {
  background: var(--r-brand-hover);
}
.hours__cell:focus-visible {
  z-index: 1;
  outline-offset: 1px;
}

.hours__ticks {
  position: relative;
  height: 12px;
  margin-left: var(--day);
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
}
.hours__ticks span {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
}
.hours__ticks span:first-child {
  transform: none;
}
.hours__ticks span:last-child {
  transform: translateX(-100%);
}

.hours__say {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}
.hours__word {
  flex: none;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.hours__word.is-success {
  color: var(--r-success-text);
}
.hours__word.is-warning {
  color: var(--r-warning-text);
}
.hours__word.is-danger {
  color: var(--r-danger-text);
}
</style>
