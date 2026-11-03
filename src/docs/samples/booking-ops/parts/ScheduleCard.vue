<script setup lang="ts">
/**
 * The schedule: every booking on a Gantt, grouped by room or by staff member. Today on an
 * 08:00–21:00 axis, or the week with each day squeezed to its opening hours.
 */
import { computed, ref } from 'vue'
import { RCard, RGanttChart, RKbd, RSegmented, useElementSize } from '@/design-system'
import type { GanttItem, GanttRow } from '@/design-system'
import {
  CLOSE,
  OPEN,
  ROOMS,
  SPAN,
  STAFF,
  TODAY,
  WEEK,
  availableMinutes,
  clock,
  firstName,
  hoursOf,
  type Block,
  type Booking,
  type RoomId,
  type ScheduleTarget,
  type StaffId,
  type WalkIn,
} from '../data'

type ItemRef = ScheduleTarget | { kind: 'block' }

const props = defineProps<{
  bookings: Booking[]
  walkIns: WalkIn[]
  blocks: Block[]
  view: 'day' | 'week'
  /** Minutes after midnight, with seconds as a fraction. */
  now: number
}>()

const emit = defineEmits<{ open: [target: ScheduleTarget] }>()

const grouping = ref<'rooms' | 'staff'>('rooms')
const groupOptions = [
  { label: 'Rooms', value: 'rooms' },
  { label: 'Staff', value: 'staff' },
]

const days = computed(() => (props.view === 'day' ? [TODAY] : WEEK.map((_, i) => i)))

/* Day: minutes after midnight. Week: each day is SPAN wide, so 08:00 Monday is 0. A hair of
   inset keeps an item that starts at opening time from reading as the day tick. */
const at = (day: number, minutes: number) => (props.view === 'day' ? minutes : day * SPAN + (minutes - OPEN))
const inset = computed(() => (props.view === 'week' ? 0.001 : 0))

const lateBy = (b: Booking) => Math.max(1, Math.floor(props.now - b.start))

function labelOf(b: Booking) {
  if (b.status === 'no-show') return 'No-show'
  if (b.status === 'late') return `Late ${lateBy(b)} min`
  if (b.seats) return `${b.seats.booked}/${b.seats.capacity}`
  return b.customer ? firstName(b.customer.name) : ''
}

function toneOf(b: Booking): GanttItem['tone'] {
  if (b.status === 'late' || b.status === 'no-show') return 'signal'
  if (b.status === 'completed') return 'context'
  return 'brand'
}

interface Resource {
  id: RoomId | StaffId
  label: string
  kind: string
  has: (x: { roomId?: RoomId; staffId?: StaffId }) => boolean
  /** Minutes the resource could have been used in the shown days. */
  capacity: number
}

const resources = computed<Resource[]>(() => {
  if (grouping.value === 'staff') {
    return STAFF.map((s) => ({
      id: s.id,
      label: s.name,
      kind: s.role,
      has: (x) => x.staffId === s.id,
      capacity: availableMinutes(s.id, days.value, props.blocks),
    }))
  }
  return ROOMS.map((r) => ({
    id: r.id,
    label: r.name,
    kind: r.kind,
    has: (x) => x.roomId === r.id,
    capacity: days.value.reduce((sum, d) => {
      const [open, close] = hoursOf(d)
      const blocked = props.blocks.filter((b) => b.day === d && b.roomId === r.id).reduce((s, b) => s + (b.end - b.start), 0)
      return sum + (close - open) - blocked
    }, 0),
  }))
})

/* Axis */
const wrap = ref<HTMLElement | null>(null)
const { width } = useElementSize(wrap)
const narrow = computed(() => width.value > 0 && width.value < 560)

const domain = computed<[number, number]>(() => (props.view === 'day' ? [OPEN, CLOSE] : [0, SPAN * 7]))
const labelWidth = computed(() => (narrow.value ? 112 : width.value > 0 && width.value < 820 ? 128 : 150))
const ROW_HEIGHT = 48

/* The chart writes a label inside a bar when it fits, else after it. Past the last bar of a row
   nothing stops it, so a label there could run off the plot; on the week axis the bars are too
   thin, so only labels that fit inside are kept. Same text metrics as RGanttChart. */
const textWidth = (text: string) => text.length * 6.3 + 12

const model = computed(() => {
  const rows: GanttRow[] = []
  const refs: ItemRef[] = []
  const shown = days.value
  const e = inset.value
  const week = props.view === 'week'
  const [d0, d1] = domain.value
  const plot = Math.max(1, (width.value || 900) - labelWidth.value - 8)
  const px = (v: number) => ((v - d0) / (d1 - d0)) * plot
  for (const res of resources.value) {
    const entries: { item: GanttItem; ref: ItemRef }[] = []
    let used = 0
    for (const b of props.bookings) {
      if (!shown.includes(b.day) || !res.has(b)) continue
      used += b.end - b.start
      entries.push({
        item: { start: at(b.day, b.start) + e, end: at(b.day, b.end) - e, label: labelOf(b), tone: toneOf(b) },
        ref: { kind: 'booking', id: b.id },
      })
    }
    for (const w of props.walkIns) {
      if (!shown.includes(w.day) || w.start == null || w.end == null || !res.has(w)) continue
      used += w.end - w.start
      entries.push({
        item: { start: at(w.day, w.start) + e, end: at(w.day, w.end) - e, label: w.ticket, tone: w.state === 'serving' ? 'brand' : 'context' },
        ref: { kind: 'walkin', ticket: w.ticket },
      })
    }
    for (const b of props.blocks) {
      if (!shown.includes(b.day)) continue
      // Breaks are a few pixels wide on the week axis: noise, not information.
      if (week && b.label === 'Break') continue
      const mine = b.all || (grouping.value === 'rooms' ? b.roomId === res.id : b.staffId === res.id)
      if (!mine) continue
      entries.push({
        item: { start: at(b.day, b.start) + e, end: at(b.day, b.end) - e, label: b.label, tone: 'context', hatch: true },
        ref: { kind: 'block' },
      })
    }
    entries.sort((a, b) => a.item.start - b.item.start)
    entries.forEach(({ item }, i) => {
      const text = item.label ?? ''
      const inside = textWidth(text) < px(item.end) - px(item.start)
      const last = i === entries.length - 1
      if (!inside && (week || (last && px(item.end) + textWidth(text) > plot))) item.label = ''
    })
    const share = res.capacity > 0 ? Math.round((used / res.capacity) * 100) : 0
    rows.push({ id: res.id, label: res.label, meta: `${res.kind} · ${share}%`.toUpperCase(), items: entries.map((x) => x.item) })
    refs.push(...entries.map((x) => x.ref))
  }
  return { rows, refs }
})

/* Hour ticks (every two hours when the plot is narrow), but not the closing hour at the right
   edge, and not the hour whose label the NOW tag would cover. */
const ticks = computed(() => {
  if (props.view === 'week') return WEEK.map((_, i) => i * SPAN)
  const plot = Math.max(1, (width.value || 900) - labelWidth.value - 8)
  const perMinute = plot / (CLOSE - OPEN)
  const every = perMinute < 0.9 ? 120 : 60
  const out: number[] = []
  for (let t = OPEN; t < CLOSE; t += every) {
    if (Math.abs(t - props.now) * perMinute < 36) continue
    out.push(t)
  }
  return out
})

function formatTick(value: number) {
  if (props.view === 'day') return clock(value)
  const day = Math.min(6, Math.floor(value / SPAN))
  if (value % SPAN === 0) return `${WEEK[day].short} ${WEEK[day].date}`.toUpperCase()
  return `${WEEK[day].short} ${clock(OPEN + (value - day * SPAN))}`
}

const nowAt = computed(() => (props.view === 'day' ? props.now : TODAY * SPAN + (props.now - OPEN)))

const chartLabel = computed(() =>
  props.view === 'day'
    ? `Today's bookings by ${grouping.value === 'rooms' ? 'room' : 'staff member'}, 08:00 to 21:00 WIB, with the current time`
    : `This week's bookings by ${grouping.value === 'rooms' ? 'room' : 'staff member'}, Monday 9 to Sunday 15 November, opening hours only`,
)

/* RGanttChart has no select event: map a click, or Enter on the chart's own keyboard
   selection, back to the item through the order the chart renders its items in. */
function indexOf(item: Element) {
  return Array.from(wrap.value?.querySelectorAll('.r-gantt__item') ?? []).indexOf(item)
}

function openAt(index: number) {
  const target = model.value.refs[index]
  if (target && target.kind !== 'block') emit('open', target)
}

function onClick(event: MouseEvent) {
  const item = (event.target as Element | null)?.closest('.r-gantt__item')
  if (item) openAt(indexOf(item))
}

function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter' && event.key !== ' ') return
  const item = wrap.value?.querySelector('.r-gantt__item.is-active')
  if (!item) return
  event.preventDefault()
  openAt(indexOf(item))
}
</script>

<template>
  <RCard
    index="05"
    :eyebrow="view === 'day' ? 'Schedule · Thu 12 Nov' : 'Schedule · Week 46, 9–15 Nov'"
    :title="grouping === 'rooms' ? 'Bookings by room' : 'Bookings by staff'"
    class="s-booking-ops-schedule"
  >
    <template #actions>
      <RSegmented v-model="grouping" :options="groupOptions" size="sm" label="Group the schedule by" />
    </template>

    <p class="r-sr-only">Arrow keys step through the schedule; Enter opens the selected booking.</p>
    <div class="s-booking-ops-schedule__scroll">
      <div ref="wrap" class="s-booking-ops-schedule__chart" @click="onClick" @keydown="onKeydown">
        <RGanttChart
          :rows="model.rows"
          :domain="domain"
          :ticks="ticks"
          :format-tick="formatTick"
          :now="nowAt"
          :row-height="ROW_HEIGHT"
          :label-width="labelWidth"
          :label="chartLabel"
        />
      </div>
    </div>

    <div class="s-booking-ops-schedule__foot">
      <ul class="s-booking-ops-legend" aria-label="Legend">
        <li><span class="s-booking-ops-legend__swatch is-done" />Completed</li>
        <li><span class="s-booking-ops-legend__swatch is-booked" />Booked or in progress</li>
        <li><span class="s-booking-ops-legend__swatch is-alert" />Late or no-show</li>
        <li><span class="s-booking-ops-legend__swatch r-hatch is-blocked" />Break or blocked</li>
        <li><span class="s-booking-ops-legend__now" />Now</li>
      </ul>
      <p class="s-booking-ops-schedule__hint" aria-hidden="true">
        <RKbd :keys="['left']" size="sm" /><RKbd :keys="['right']" size="sm" /> select
        <RKbd :keys="['enter']" size="sm" /> open
      </p>
    </div>
  </RCard>
</template>

<style scoped>
.s-booking-ops-schedule__scroll {
  min-width: 0;
}

/* The chart needs room for its hour ticks; on a phone it scrolls inside the card. (Only there:
   a scroll box would clip the chart's tooltips.) */
@media (max-width: 640px) {
  .s-booking-ops-schedule__scroll {
    overflow-x: auto;
    overscroll-behavior-x: contain;
  }
  .s-booking-ops-schedule__chart {
    min-width: 600px;
  }
}

.s-booking-ops-schedule__chart :deep(.r-gantt__item) {
  cursor: pointer;
}
.s-booking-ops-schedule__chart :deep(.r-gantt__item:has(.is-hatch)) {
  cursor: default;
}

.s-booking-ops-schedule__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 24px;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--r-border-subtle);
}

.s-booking-ops-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.s-booking-ops-legend li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.s-booking-ops-legend__swatch {
  width: 10px;
  height: 10px;
}
.s-booking-ops-legend__swatch.is-done {
  background: var(--r-chart-context);
}
.s-booking-ops-legend__swatch.is-booked {
  background: var(--r-brand);
}
.s-booking-ops-legend__swatch.is-alert {
  background: var(--r-signal);
}
.s-booking-ops-legend__swatch.is-blocked {
  border: 1px solid var(--r-chart-context);
}

.s-booking-ops-legend__now {
  width: 2px;
  height: 12px;
  background: var(--r-chart-now);
}

.s-booking-ops-schedule__hint {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.s-booking-ops-schedule__hint :deep(.r-kbd + .r-kbd) {
  margin-left: 2px;
}

@media (max-width: 640px) {
  .s-booking-ops-schedule__hint {
    display: none;
  }
}
</style>
