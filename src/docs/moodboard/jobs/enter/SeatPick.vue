<script setup lang="ts">
/**
 * A seat, picked by where it is. A map of square seats shows the window, the aisle and the exit
 * row at once, which no sentence does. Click a free seat, or walk the map with the arrow keys and
 * press Enter.
 */
import { computed, nextTick, ref } from 'vue'
import { rp } from '../../kit'

interface Seat {
  id: string
  row: string
  col: string
  /** Row index, and index among the seats of a row (aisles skipped). */
  ri: number
  si: number
  /** Index among all columns, aisles included: where it is drawn. */
  ci: number
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    meta?: string
    /** Row labels, front to back: ["10", "11", …] or ["A", "B", …]. */
    rows: string[]
    /** Seat labels across a row; an empty string is the aisle. */
    cols: string[]
    taken?: string[]
    /** Seats that cost more, and what they are. */
    extra?: { seats: string[]; price: number; label: string }
    value?: string
    /** Price of an ordinary seat; 0 when it is included. */
    price?: number
    /** What is in front: "Screen", "Front of the coach". */
    front?: string
    kind?: 'plane' | 'cinema' | 'desk' | 'train'
    /** Rows run left to right (a carriage seen from above) instead of top to bottom. */
    across?: boolean
  }>(),
  { taken: () => [], price: 0, kind: 'plane' },
)

const idOf = (row: string, col: string) => (props.kind === 'desk' ? `${col}${row}` : `${row}${col}`)
const seatCols = props.cols.filter(Boolean)
const seats: Seat[] = props.rows.flatMap((row, ri) => {
  let si = 0
  return props.cols.flatMap((col, ci) => (col ? [{ id: idOf(row, col), row, col, ri, si: si++, ci }] : []))
})
const byId = new Map(seats.map((s) => [s.id, s]))
const at = (ri: number, si: number) => seats[ri * seatCols.length + si]

const pick = ref<string | null>(props.value ?? null)
const focus = ref<Seat>(byId.get(props.value ?? '') ?? seats[0])
const map = ref<HTMLElement | null>(null)

const isTaken = (s: Seat) => props.taken.includes(s.id)
const isExtra = (s: Seat) => !!props.extra?.seats.includes(s.id)

function where(s: Seat) {
  const n = props.cols.length
  if (s.ci === 0 || s.ci === n - 1) return props.kind === 'cinema' ? 'end of the row' : props.kind === 'desk' ? 'by the window' : 'window'
  if (props.cols[s.ci - 1] === '' || props.cols[s.ci + 1] === '') return 'aisle'
  return props.kind === 'plane' || props.kind === 'train' ? 'middle' : ''
}

function describe(s: Seat) {
  const name = props.kind === 'cinema' ? `Row ${s.row}, seat ${s.col}` : props.kind === 'desk' ? `Desk ${s.id}` : `Seat ${s.id}`
  return [name, where(s), isExtra(s) ? props.extra!.label.toLowerCase() : ''].filter(Boolean).join(', ')
}

function choose(s: Seat) {
  focus.value = s
  if (isTaken(s)) return
  pick.value = pick.value === s.id ? null : s.id
}

/* Arrow keys walk the seats as drawn, stepping over the aisle. */
function onKeydown(event: KeyboardEvent) {
  const { ri, si } = focus.value
  const keys = props.across
    ? { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] }
    : { ArrowDown: [1, 0], ArrowUp: [-1, 0], ArrowRight: [0, 1], ArrowLeft: [0, -1] }
  let move = (keys as Record<string, number[]>)[event.key]
  if (event.key === 'Home') move = [0, -si]
  if (event.key === 'End') move = [0, seatCols.length - 1 - si]
  if (!move) return
  event.preventDefault()
  const r = Math.max(0, Math.min(props.rows.length - 1, ri + move[0]))
  const c = Math.max(0, Math.min(seatCols.length - 1, si + move[1]))
  focus.value = at(r, c)
  nextTick(() => map.value?.querySelector<HTMLElement>(`[data-seat="${focus.value.id}"]`)?.focus())
}

const free = computed(() => seats.length - props.taken.length - (pick.value ? 1 : 0))
const summary = computed(() => {
  const s = pick.value ? byId.get(pick.value) : null
  if (!s) return `${free.value} free · pick one`
  const c = (props.price ?? 0) + (isExtra(s) ? props.extra!.price : 0)
  const money = c ? ` · ${rp(c)}` : props.kind === 'plane' || props.kind === 'train' ? ' · included' : ''
  return `${describe(s)}${money}`
})

/* Square seats: the side is whatever fits both ways (container units on the map's frame), up to
   44px; the aisle is a narrow fixed track, not a seat-wide gap. The front edge sits on row 1. */
const grid = computed(() => {
  const aisles = props.cols.length - seatCols.length
  const lw = props.across ? 16 : 22
  const lead = props.front ? 2 : 1
  const nW = props.across ? props.rows.length : seatCols.length
  const nH = props.across ? seatCols.length : props.rows.length
  const fixedW = lw + (props.across ? 0 : aisles * 12) + (props.across ? props.rows.length : props.cols.length) * 3
  const fixedH = 14 * lead + (props.across ? aisles * 12 : 0) + ((props.across ? props.cols.length : props.rows.length) + lead - 1) * 3
  const track = (c: string) => (c ? 'var(--side)' : '12px')
  const head = props.front ? '14px 14px' : '14px'
  return {
    '--side': `min(calc((100cqw - ${fixedW}px) / ${nW}), calc((100cqh - ${fixedH}px) / ${nH}), 44px)`,
    gridTemplateColumns: props.across ? `${lw}px repeat(${props.rows.length}, var(--side))` : `${lw}px ${props.cols.map(track).join(' ')}`,
    gridTemplateRows: props.across ? `${head} ${props.cols.map(track).join(' ')}` : `${head} repeat(${props.rows.length}, var(--side))`,
  }
})

const lead = computed(() => (props.front ? 2 : 1))
const place = (s: Seat) =>
  props.across ? { gridColumn: s.ri + 2, gridRow: s.ci + lead.value + 1 } : { gridColumn: s.ci + 2, gridRow: s.ri + lead.value + 1 }
const colHead = (ci: number) => (props.across ? { gridColumn: 1, gridRow: ci + lead.value + 1 } : { gridColumn: ci + 2, gridRow: lead.value })
const rowHead = (ri: number) => (props.across ? { gridColumn: ri + 2, gridRow: lead.value } : { gridColumn: 1, gridRow: ri + lead.value + 1 })
</script>

<template>
  <div class="mk en-root seat">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span v-if="meta" class="en-meta">{{ meta }}</span>
    </div>

    <div class="seat__frame mk-grow">
    <div ref="map" class="seat__map" :style="grid" role="group" :aria-label="`${eyebrow}, seat map`" @keydown="onKeydown">
      <p v-if="front" class="seat__front" aria-hidden="true">{{ front }}</p>
      <span v-for="(c, ci) in cols" :key="`h${ci}`" class="seat__head" :style="colHead(ci)" aria-hidden="true">{{ c }}</span>
      <span v-for="(r, ri) in rows" :key="`r${r}`" class="seat__head seat__head--row" :style="rowHead(ri)" aria-hidden="true">{{ r }}</span>
      <button
        v-for="s in seats"
        :key="s.id"
        type="button"
        class="seat__seat"
        :class="{ 'is-taken': isTaken(s), 'is-extra': isExtra(s), 'is-picked': pick === s.id }"
        :style="place(s)"
        :data-seat="s.id"
        :tabindex="focus.id === s.id ? 0 : -1"
        :aria-label="`${describe(s)}${isTaken(s) ? ', taken' : ''}`"
        :aria-pressed="pick === s.id ? 'true' : 'false'"
        :aria-disabled="isTaken(s) ? 'true' : undefined"
        @click="choose(s)"
      />
    </div>
    </div>

    <div class="seat__foot">
      <p class="seat__sum mk-truncate" aria-live="polite">{{ summary }}</p>
      <p v-if="extra" class="seat__legend" aria-hidden="true"><span class="seat__key" />+{{ rp(extra.price) }}</p>
    </div>
  </div>
</template>

<style scoped>
.seat {
  gap: 6px;
}

.seat__frame {
  display: grid;
  place-items: center;
  min-height: 0;
  container-type: size;
}

.seat__front {
  grid-row: 1;
  grid-column: 2 / -1;
  height: 14px;
  border-top: 2px solid var(--r-border-strong);
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.08em;
  line-height: 12px;
  text-align: center;
  text-transform: uppercase;
}

.seat__map {
  display: grid;
  gap: 3px;
}

.seat__head {
  display: grid;
  place-items: center;
  min-width: 0;
  min-height: 0;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  line-height: 1;
}

.seat__head--row {
  justify-items: end;
  padding-right: 4px;
}

.seat__seat {
  position: relative;
  min-width: 0;
  min-height: 0;
  margin: 0;
  padding: 0;
  border: 1px solid var(--r-border-control);
  border-radius: var(--r-radius-mark);
  background: var(--r-bg-surface);
  cursor: pointer;
  transition: background-color var(--r-duration-instant) var(--r-ease-out);
}

.seat__seat:hover:not(.is-taken, .is-picked) {
  background: var(--r-bg-hover);
}

.seat__seat:focus-visible {
  z-index: 1;
  outline: 2px solid var(--r-focus);
  outline-offset: 1px;
}

/* Taken: filled and crossed, so it reads without colour. */
.seat__seat.is-taken {
  border-color: var(--r-border);
  background: var(--r-bg-pressed);
  cursor: default;
}

.seat__seat.is-taken::after {
  content: '';
  position: absolute;
  top: 50%;
  right: 20%;
  left: 20%;
  height: 1px;
  background: var(--r-text-disabled);
  transform: rotate(-45deg);
}

/* Extra: a heavier top rule, explained in the legend. */
.seat__seat.is-extra {
  border-top-width: 3px;
}

.seat__seat.is-picked {
  border-color: var(--r-brand-fill);
  background: var(--r-brand-fill);
}

.seat__foot {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.seat__sum {
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
}

.seat__legend {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 6px;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
}

.seat__key {
  width: 12px;
  height: 10px;
  border: 1px solid var(--r-border-control);
  border-top-width: 3px;
}
</style>
