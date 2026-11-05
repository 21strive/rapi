<script setup lang="ts">
/**
 * A month of square days, ruled like a spec sheet. One tap picks a day (or two pick a stay); the
 * arrow keys walk the days and Page keys turn the month. Days that cannot be picked stay readable
 * and say why; hatching means rain in the forecast and nothing else.
 */
import { computed, nextTick, ref } from 'vue'
import { CalendarCheck, ChevronLeft, ChevronRight, CircleAlert } from 'lucide-vue-next'
import { RIconButton } from '@/design-system'
import { rp } from '../../kit'

const props = withDefaults(
  defineProps<{
    eyebrow: string
    meta?: string
    /** First month shown, "2026-11". */
    month?: string
    months?: 1 | 2
    mode?: 'single' | 'range'
    value?: string | [string, string]
    today?: string
    /** Last day that can be picked. */
    until?: string
    /** Weekends cannot be picked (value dates, working days). */
    workdays?: boolean
    /** Open slots per day; a day with 0 is full. Days not listed have none. */
    slots?: Record<string, number>
    /** Days with rain in the forecast: hatched, still pickable, with a warning. */
    rain?: string[]
    /** Price per night for a stay. */
    night?: number
    /** What the picked day is for, after the date: "salaries land that morning". */
    purpose?: string
  }>(),
  { month: '2026-11', months: 1, mode: 'single', today: '2026-11-05' },
)

const DAY = 86400000
const parse = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}
const iso = (t: number) => new Date(t).toISOString().slice(0, 10)
const fmt = (t: number, opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', ...opts }).format(new Date(t))
const long = (t: number) => fmt(t, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).replace(',', '')
const short = (t: number) => fmt(t, { weekday: 'short', day: 'numeric', month: 'short' }).replace(',', '')

const todayT = parse(props.today)
const untilT = props.until ? parse(props.until) : Infinity
const [y0, m0] = props.month.split('-').map(Number)
const view = ref(Date.UTC(y0, m0 - 1, 1))

const start = ref<number | null>(null)
const end = ref<number | null>(null)
if (Array.isArray(props.value)) {
  start.value = parse(props.value[0])
  end.value = parse(props.value[1])
} else if (props.value) start.value = parse(props.value)
const hover = ref<number | null>(null)
const focusT = ref(start.value ?? Math.max(todayT, view.value))

function blocked(t: number): string {
  if (t < todayT) return 'past'
  if (t > untilT) return 'outside the window'
  const dow = new Date(t).getUTCDay()
  if (props.workdays && (dow === 0 || dow === 6)) return 'weekend'
  if (props.slots && !(props.slots[iso(t)] > 0)) return 'full'
  return ''
}

const monthsShown = computed(() =>
  Array.from({ length: props.months }, (_, k) => {
    const first = new Date(view.value)
    const t = Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + k, 1)
    const d = new Date(t)
    const days = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate()
    const lead = (d.getUTCDay() + 6) % 7
    const cells: ({ t: number; n: number; open?: number } | null)[] = [
      ...Array.from({ length: lead }, () => null),
      ...Array.from({ length: days }, (_, i) => ({ t: t + i * DAY, n: i + 1, open: props.slots?.[iso(t + i * DAY)] })),
    ]
    while (cells.length % 7) cells.push(null)
    return { t, title: fmt(t, { month: 'long', year: 'numeric' }), cells }
  }),
)

const lastShown = computed(() => {
  const m = monthsShown.value[monthsShown.value.length - 1]
  const d = new Date(m.t)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)
})

const rangeEnd = computed(() => end.value ?? (props.mode === 'range' && start.value != null && hover.value != null && hover.value > start.value ? hover.value : null))

function cellClass(t: number) {
  const s = start.value
  const e = rangeEnd.value
  return {
    'is-today': t === todayT,
    'is-off': !!blocked(t),
    'is-rain r-hatch': props.rain?.includes(iso(t)),
    'is-picked': t === s || t === end.value,
    'is-span': s != null && e != null && t > s && t < e,
    'is-edge': props.mode === 'range' && e != null && t === e && end.value == null,
  }
}

function label(t: number) {
  const parts = [long(t)]
  const why = blocked(t)
  if (why) parts.push(`not available, ${why}`)
  if (props.slots?.[iso(t)]) parts.push(`${props.slots[iso(t)]} slots open`)
  if (props.rain?.includes(iso(t))) parts.push('rain in the forecast')
  if (t === todayT) parts.push('today')
  return parts.join(', ')
}

function pick(t: number) {
  focusT.value = t
  if (blocked(t)) return
  if (props.mode === 'single') {
    start.value = t
    return
  }
  if (start.value == null || end.value != null || t <= start.value) {
    start.value = t
    end.value = null
  } else end.value = t
}

function turn(step: number) {
  const d = new Date(view.value)
  view.value = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + step, 1)
}

const grid = ref<HTMLElement | null>(null)
function onKeydown(event: KeyboardEvent) {
  const t = focusT.value
  const dow = (new Date(t).getUTCDay() + 6) % 7
  const moves: Record<string, number> = {
    ArrowLeft: t - DAY,
    ArrowRight: t + DAY,
    ArrowUp: t - 7 * DAY,
    ArrowDown: t + 7 * DAY,
    Home: t - dow * DAY,
    End: t + (6 - dow) * DAY,
  }
  let next = moves[event.key]
  if (event.key === 'PageUp' || event.key === 'PageDown') {
    const d = new Date(t)
    const step = event.key === 'PageUp' ? -1 : 1
    const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + step, 1))
    const days = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate()
    next = Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), Math.min(d.getUTCDate(), days))
  }
  if (next === undefined) return
  event.preventDefault()
  focusT.value = next
  if (next < view.value) turn(-1)
  else if (next > lastShown.value) turn(1)
  nextTick(() => grid.value?.querySelector<HTMLElement>(`[data-t="${next}"]`)?.focus())
}

/* The day that takes Tab: the focused one if it is on screen, else the first day shown. */
const tabT = computed(() => {
  const inView = monthsShown.value.some((m) => m.cells.some((c) => c?.t === focusT.value))
  return inView ? focusT.value : monthsShown.value[0].t
})

const summary = computed(() => {
  const s = start.value
  if (s == null) return { tone: 'none', text: props.mode === 'range' ? 'Pick the first night' : 'Pick a day' }
  if (props.mode === 'range') {
    if (end.value == null) return { tone: 'none', text: `${short(s)} → pick the last morning` }
    const nights = Math.round((end.value - s) / DAY)
    const cost = props.night ? ` · ${rp(nights * props.night)}` : ''
    return { tone: 'ok', text: `${fmt(s, { day: 'numeric', month: 'short' })} → ${fmt(end.value, { day: 'numeric', month: 'short' })} · ${nights} ${nights === 1 ? 'night' : 'nights'}${cost}` }
  }
  if (props.rain?.includes(iso(s))) return { tone: 'warn', text: `${short(s)}: rain in the forecast, spray may wash off` }
  const open = props.slots?.[iso(s)]
  const extra = open ? ` · ${open} ${open === 1 ? 'slot' : 'slots'} open` : props.purpose ? ` · ${props.purpose}` : ''
  return { tone: 'ok', text: `${long(s)}${extra}` }
})

const canBack = computed(() => view.value > Date.UTC(new Date(todayT).getUTCFullYear(), new Date(todayT).getUTCMonth(), 1))
const canNext = computed(() => lastShown.value < untilT)
const WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
</script>

<template>
  <div class="mk en-root cal" :class="{ 'cal--two': months === 2 }">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span v-if="meta" class="en-meta">{{ meta }}</span>
    </div>

    <div ref="grid" class="cal__months mk-grow" @keydown="onKeydown" @pointerleave="hover = null">
      <div v-for="(m, k) in monthsShown" :key="m.t" class="cal__month">
        <div class="cal__head">
          <RIconButton v-if="k === 0" size="xs" variant="ghost" label="Previous month" :disabled="!canBack" @click="turn(-1)">
            <ChevronLeft />
          </RIconButton>
          <p class="cal__title">{{ m.title }}</p>
          <RIconButton v-if="k === months - 1" size="xs" variant="ghost" label="Next month" :disabled="!canNext" @click="turn(1)">
            <ChevronRight />
          </RIconButton>
        </div>
        <div class="cal__week" aria-hidden="true">
          <span v-for="(w, i) in WEEK" :key="i">{{ w }}</span>
        </div>
        <div class="cal__days" role="group" :aria-label="m.title" :style="{ '--rows': m.cells.length / 7 }">
          <template v-for="(c, i) in m.cells" :key="i">
            <span v-if="!c" class="cal__pad" />
            <button
              v-else
              type="button"
              class="cal__day"
              :class="cellClass(c.t)"
              :data-t="c.t"
              :tabindex="c.t === tabT ? 0 : -1"
              :aria-label="label(c.t)"
              :aria-pressed="c.t === start || c.t === end ? 'true' : 'false'"
              :aria-disabled="blocked(c.t) ? 'true' : undefined"
              @click="pick(c.t)"
              @pointerenter="hover = c.t"
            >
              <span class="cal__n">{{ c.n }}</span>
              <span v-if="c.open" class="cal__slots" aria-hidden="true">{{ c.open }}</span>
            </button>
          </template>
        </div>
      </div>
    </div>

    <p class="en-msg cal__sum" :class="{ 'is-picked': summary.tone === 'ok', 'en-msg--warn': summary.tone === 'warn' }" aria-live="polite">
      <CalendarCheck v-if="summary.tone === 'ok'" aria-hidden="true" />
      <CircleAlert v-else-if="summary.tone === 'warn'" aria-hidden="true" />
      <span class="mk-truncate">{{ summary.text }}</span>
    </p>
  </div>
</template>

<style scoped>
.cal__months {
  display: grid;
  grid-auto-columns: minmax(0, 1fr);
  grid-auto-flow: column;
  gap: 16px;
}

.cal__month {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  min-height: 0;
}

.cal__head {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 24px;
}

.cal__title {
  flex: 1;
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
}

.cal__month:first-child:not(:last-child) .cal__title {
  padding-left: 4px;
}

.cal__week,
.cal__days {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

.cal__week span {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  text-align: center;
}

/* The ruled month: 1px rules between square days. */
.cal__days {
  flex: 1 1 auto;
  grid-template-rows: repeat(var(--rows), minmax(0, 1fr));
  gap: 1px;
  min-height: 0;
  border: 1px solid var(--r-border-subtle);
  background: var(--r-border-subtle);
}

.cal__pad,
.cal__day {
  min-width: 0;
  min-height: 0;
  background-color: var(--r-bg-surface);
}

.cal__day {
  position: relative;
  display: grid;
  place-items: center;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: var(--r-radius-mark);
  color: var(--r-text);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  transition: background-color var(--r-duration-instant) var(--r-ease-out);
}

.cal__day:hover:not(.is-off, .is-picked) {
  background-color: var(--r-bg-hover);
}

.cal__day:focus-visible {
  z-index: 1;
  outline: 2px solid var(--r-focus);
  outline-offset: -2px;
}

/* Today is "now": the one orange tick on the month. */
.cal__day.is-today::after {
  content: '';
  position: absolute;
  bottom: 3px;
  left: 50%;
  width: 10px;
  height: 2px;
  background: var(--r-signal);
  transform: translateX(-50%);
}

.cal__day.is-off {
  color: var(--r-text-disabled);
  cursor: default;
}

/* Rain in the forecast wears the language's hatching (.r-hatch), which only means forecast. */
.cal__day.is-span {
  background-color: var(--r-brand-soft);
}

.cal__day.is-edge {
  background-color: var(--r-brand-soft);
  box-shadow: inset 0 0 0 1px var(--r-brand);
}

.cal__day.is-picked {
  background-color: var(--r-brand-fill);
  background-image: none;
  color: var(--r-on-brand);
  font-weight: var(--r-weight-semibold);
}

.cal__slots {
  position: absolute;
  right: 3px;
  bottom: 1px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  line-height: 1.2;
}

.cal__day.is-picked .cal__slots {
  color: var(--r-on-brand);
}

.cal__sum {
  flex: none;
}

.cal__sum.is-picked {
  color: var(--r-text);
}
</style>
