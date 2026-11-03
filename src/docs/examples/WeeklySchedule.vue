<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  ArrowDown,
  ArrowUp,
  CalendarClock,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Copy,
  CopyPlus,
  Ellipsis,
  Globe,
  LogOut,
  Mail,
  MapPin,
  PanelLeft,
  Plus,
  Search,
  Trash2,
  Video,
  WandSparkles,
  X,
} from 'lucide-vue-next'
import {
  RAvatar,
  RAvatarGroup,
  RButton,
  RCheckbox,
  RIconButton,
  RInput,
  RKbd,
  RMenu,
  RPopover,
  RSegmented,
  RTooltip,
  isMac,
  useEscape,
  useFocusTrap,
  useHotkey,
  useLayer,
  useScrollLock,
  type MenuItem,
  type Point,
} from '@/design-system'
import MiniMonth from './schedule/MiniMonth.vue'
import ExampleStrip from './parts/ExampleStrip.vue'
import AppMark from './parts/AppMark.vue'
import ColorDots from './schedule/ColorDots.vue'
import EventDialog from './schedule/EventDialog.vue'
import {
  DAY_END,
  DAY_START,
  addDays,
  calendars,
  daysBetween,
  formatHour,
  formatRange,
  formatTime,
  isoWeek,
  occursOn,
  sameDay,
  seedEvents,
  startOfDay,
  startOfWeek,
  timezoneLabel,
  type ScheduleEvent,
} from './data/schedule'

const HOUR = 64
const today = startOfDay(new Date())
/** Events count their days from this Monday. */
const base = startOfWeek(today)

const clone = (list: ScheduleEvent[]) => list.map((e) => ({ ...e, guests: [...e.guests] }))
const events = ref<ScheduleEvent[]>(clone(seedEvents))
let lastId = Math.max(...seedEvents.map((e) => e.id))

/* ── View state ────────────────────────────────────────────────────────────── */

const narrowQuery = window.matchMedia('(max-width: 1099px)')
const isNarrow = ref(narrowQuery.matches)
const onNarrowChange = (event: MediaQueryListEvent) => (isNarrow.value = event.matches)

const selected = ref<Date>(today)
const view = ref<'day' | 'week' | 'month'>(window.innerWidth < 720 ? 'day' : 'week')
const showWeekends = ref(true)
const visibleCalendars = ref<string[]>(calendars.map((c) => c.id))
const query = ref<string | number | null>('')
const drawerOpen = ref(false)

const viewOptions = [
  { label: 'Daily', value: 'day' },
  { label: 'Weekly', value: 'week' },
  { label: 'Monthly', value: 'month' },
]

const week = computed(() => startOfWeek(selected.value))
const days = computed(() => {
  if (view.value === 'day') return [startOfDay(selected.value)]
  const count = showWeekends.value ? 7 : 5
  return Array.from({ length: count }, (_, i) => addDays(week.value, i))
})

const heading = computed(() => {
  const d = view.value === 'week' ? days.value : [selected.value]
  const first = d[0]
  const last = d[d.length - 1]
  if (first.getMonth() === last.getMonth()) {
    return { month: first.toLocaleDateString('en-US', { month: 'long' }), year: String(first.getFullYear()) }
  }
  const short = (x: Date) => x.toLocaleDateString('en-US', { month: 'short' })
  return { month: `${short(first)} – ${short(last)}`, year: String(last.getFullYear()) }
})

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
/** "Tue 3 Nov 2026" */
const stripDay = (d: Date) => `${WEEKDAYS_SHORT[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`
const weekNumber = computed(() => isoWeek(week.value))

function step(direction: 1 | -1) {
  const s = selected.value
  if (view.value === 'day') selected.value = addDays(s, direction)
  else if (view.value === 'week') selected.value = addDays(s, direction * 7)
  else selected.value = new Date(s.getFullYear(), s.getMonth() + direction, Math.min(s.getDate(), 28))
}

function goToday() {
  selected.value = today
}

const calendarById = Object.fromEntries(calendars.map((c) => [c.id, c]))
const colorOf = (e: ScheduleEvent) => e.color ?? calendarById[e.calendar]?.color ?? 1
const iconOf = (e: ScheduleEvent) => calendarById[e.calendar]?.icon

const needle = computed(() => String(query.value ?? '').trim().toLowerCase())
const matches = (e: ScheduleEvent) =>
  !needle.value || e.title.toLowerCase().includes(needle.value) || e.guests.some((g) => g.toLowerCase().includes(needle.value))

function eventsOn(date: Date) {
  return events.value
    .filter((e) => visibleCalendars.value.includes(e.calendar) && occursOn(e, date, base))
    .sort((a, b) => a.start - b.start || b.end - a.end)
}

/* ── Week grid layout: events that overlap share the column in lanes ─────── */

interface Block {
  event: ScheduleEvent
  lane: number
  lanes: number
}

function layout(date: Date): Block[] {
  const blocks: Block[] = []
  let cluster: Block[] = []
  let clusterEnd = -1
  let laneEnds: number[] = []
  const flush = () => {
    for (const b of cluster) b.lanes = laneEnds.length
    cluster = []
    laneEnds = []
    clusterEnd = -1
  }
  for (const event of eventsOn(date)) {
    if (cluster.length && event.start >= clusterEnd) flush()
    let lane = laneEnds.findIndex((end) => end <= event.start)
    if (lane < 0) {
      lane = laneEnds.length
      laneEnds.push(event.end)
    } else laneEnds[lane] = event.end
    const block = { event, lane, lanes: 1 }
    cluster.push(block)
    blocks.push(block)
    clusterEnd = Math.max(clusterEnd, event.end)
  }
  flush()
  return blocks
}

const columns = computed(() => days.value.map((date) => ({ date, blocks: layout(date), isToday: sameDay(date, today) })))

const hours = Array.from({ length: (DAY_END - DAY_START) / 60 + 1 }, (_, i) => DAY_START + i * 60)
const gridHeight = ((DAY_END - DAY_START) / 60) * HOUR

function blockStyle(b: Block) {
  const top = ((b.event.start - DAY_START) / 60) * HOUR
  const height = Math.max(24, ((b.event.end - b.event.start) / 60) * HOUR - 3)
  const c = colorOf(b.event)
  // Overlaps cascade: later events step right and sit on top, so every title stays readable.
  const inset = b.lanes > 1 ? b.lane * 28 : 0
  return {
    top: `${top + 1}px`,
    height: `${height}px`,
    left: `calc(${inset}% + 4px)`,
    width: `calc(${100 - inset}% - 8px)`,
    zIndex: b.lane + 1,
    '--ev-bg': `var(--r-identity-${c})`,
    '--ev-fg': `var(--r-identity-${c}-text)`,
  }
}

const durationOf = (e: ScheduleEvent) => e.end - e.start

const dayName = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'short' })
const longDay = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })

function eventLabel(e: ScheduleEvent, date: Date) {
  const parts = [e.title, `${longDay(date)}, ${formatRange(e.start, e.end)}`, calendarById[e.calendar]?.name]
  if (e.guests.length > 1) parts.push(`${e.guests.length} guests`)
  if (e.video) parts.push('video call')
  if (e.flexible) parts.push('flexible')
  return parts.join(', ')
}

/* ── Now line ──────────────────────────────────────────────────────────────── */

const now = ref(new Date())
let clock = 0
const nowMinutes = computed(() => now.value.getHours() * 60 + now.value.getMinutes())
const nowVisible = computed(() => nowMinutes.value >= DAY_START && nowMinutes.value <= DAY_END)
const nowTop = computed(() => ((nowMinutes.value - DAY_START) / 60) * HOUR)

/* ── Month grid ────────────────────────────────────────────────────────────── */

const monthCells = computed(() => {
  const first = new Date(selected.value.getFullYear(), selected.value.getMonth(), 1)
  const start = startOfWeek(first)
  return Array.from({ length: 42 }, (_, i) => {
    const date = addDays(start, i)
    const list = eventsOn(date)
    return { date, list, outside: date.getMonth() !== first.getMonth(), isToday: sameDay(date, today) }
  })
})

function openDay(date: Date) {
  selected.value = date
  view.value = 'day'
}

/* ── Mini month dots ───────────────────────────────────────────────────────── */

const busy = computed(() => {
  const set = new Set<string>()
  const from = addDays(base, -200)
  for (let i = 0; i < 400; i++) {
    const date = addDays(from, i)
    if (events.value.some((e) => visibleCalendars.value.includes(e.calendar) && occursOn(e, date, base))) {
      set.add(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`)
    }
  }
  return set
})

/* ── Next up ───────────────────────────────────────────────────────────────── */

const nextUp = computed(() => {
  for (let offset = 0; offset < 7; offset++) {
    const date = addDays(today, offset)
    const upcoming = eventsOn(date).find((e) => offset > 0 || e.start > nowMinutes.value)
    if (upcoming) {
      const minutes = upcoming.start - nowMinutes.value
      const when =
        offset === 0
          ? minutes < 60
            ? `In ${minutes} min`
            : `Today, ${formatTime(upcoming.start)}`
          : offset === 1
            ? `Tomorrow, ${formatTime(upcoming.start)}`
            : `${dayName(date)}, ${formatTime(upcoming.start)}`
      return { event: upcoming, date, when }
    }
  }
  return null
})

/* ── Toast with undo ───────────────────────────────────────────────────────── */

const toast = ref<{ text: string; undo?: () => void } | null>(null)
let toastTimer = 0

function notify(text: string, undo?: () => void) {
  toast.value = { text, undo }
  clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => (toast.value = null), 6000)
}

function change(text: string, mutate: () => void) {
  const before = clone(events.value)
  mutate()
  notify(text, () => {
    events.value = before
    toast.value = null
  })
}

/* ── Dialog ────────────────────────────────────────────────────────────────── */

const dialog = ref<{ open: boolean; event: ScheduleEvent | null; isNew: boolean }>({ open: false, event: null, isNew: false })

/** For a repeating event, edit the occurrence in the week on screen. */
function occurrence(e: ScheduleEvent, date: Date): ScheduleEvent {
  return { ...e, guests: [...e.guests], day: e.recurring ? daysBetween(base, date) : e.day }
}

function edit(e: ScheduleEvent, date: Date) {
  dialog.value = { open: true, event: occurrence(e, date), isNew: false }
}

function create(date: Date, start = 9 * 60) {
  const clamped = Math.min(Math.max(start, DAY_START), DAY_END - 60)
  dialog.value = {
    open: true,
    isNew: true,
    event: { id: ++lastId, title: '', calendar: 'work', day: daysBetween(base, date), start: clamped, end: clamped + 60, guests: ['Anastasia Wijaya'] },
  }
}

function onSave(updated: ScheduleEvent) {
  const isNew = dialog.value.isNew
  change(isNew ? `Added “${updated.title}”` : `Saved “${updated.title}”`, () => {
    if (isNew) events.value = [...events.value, updated]
    else events.value = events.value.map((e) => (e.id === updated.id ? updated : e))
  })
}

function remove(e: ScheduleEvent) {
  change(`Deleted “${e.title}”`, () => {
    events.value = events.value.filter((x) => x.id !== e.id)
  })
}

function onColumnClick(event: MouseEvent, date: Date) {
  if (event.target !== event.currentTarget) return
  const y = event.offsetY
  const minutes = DAY_START + Math.floor(((y / HOUR) * 60) / 30) * 30
  create(date, minutes)
}

/* ── Context menu ──────────────────────────────────────────────────────────── */

const menu = ref<{ open: boolean; point: Point | null; event: ScheduleEvent | null; date: Date; focus: 'menu' | 'first' }>({
  open: false,
  point: null,
  event: null,
  date: today,
  focus: 'menu',
})

function openMenu(e: ScheduleEvent, date: Date, point: Point, focus: 'menu' | 'first') {
  menu.value = { open: true, point, event: e, date, focus }
}

function onContextMenu(ev: MouseEvent, e: ScheduleEvent, date: Date) {
  ev.preventDefault()
  openMenu(e, date, { x: ev.clientX, y: ev.clientY }, 'menu')
}

const mod = isMac ? '⌘' : 'Ctrl+'

const menuColor = computed({
  get: () => (menu.value.event ? colorOf(menu.value.event) : 1),
  set: (color: number) => {
    const target = menu.value.event
    if (!target) return
    events.value = events.value.map((e) => (e.id === target.id ? { ...e, color } : e))
    menu.value.event = events.value.find((e) => e.id === target.id) ?? null
  },
})

const menuItems = computed<MenuItem[]>(() => {
  const e = menu.value.event
  if (!e) return []
  const nextWeekStart = addDays(startOfWeek(menu.value.date), 7)
  const short = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  const range = `${short(nextWeekStart)} – ${short(addDays(nextWeekStart, 6))}`
  return [
    { id: 'flexible', label: e.flexible ? 'Make fixed' : 'Make flexible', icon: WandSparkles },
    {
      id: 'reschedule',
      label: 'Reschedule',
      icon: CalendarClock,
      children: [
        { id: 'postpone', label: 'Postpone', icon: CalendarClock, description: `Next day, ${formatRange(e.start, e.end)}` },
        {
          id: 'next-week',
          label: 'Next week',
          icon: CalendarDays,
          description: e.recurring ? 'Repeats every week already' : range,
          disabled: e.recurring,
        },
        { divider: true },
        { id: 'earlier', label: 'Earlier by 30 minutes', icon: ArrowUp, disabled: e.start - 30 < DAY_START },
        { id: 'later', label: 'Later by 30 minutes', icon: ArrowDown, disabled: e.end + 30 > DAY_END },
      ],
    },
    { id: 'copy', label: 'Copy', icon: Copy, shortcut: `${mod}C` },
    { id: 'duplicate', label: 'Duplicate', icon: CopyPlus, shortcut: `${mod}D` },
    { divider: true },
    { id: 'delete', label: 'Delete', icon: Trash2, danger: true, shortcut: '⌫' },
  ]
})

function update(id: number, patch: Partial<ScheduleEvent>) {
  events.value = events.value.map((e) => (e.id === id ? { ...e, ...patch } : e))
}

async function copyEvent(e: ScheduleEvent, date: Date) {
  const text = `${e.title}, ${longDay(date)}, ${formatRange(e.start, e.end)}`
  try {
    await navigator.clipboard.writeText(text)
    notify('Copied to the clipboard')
  } catch {
    notify('Copying is blocked in this browser')
  }
}

function duplicateEvent(e: ScheduleEvent, date: Date) {
  const length = durationOf(e)
  const fitsAfter = e.end + length <= DAY_END
  change(`Duplicated “${e.title}”`, () => {
    events.value = [
      ...events.value,
      {
        ...e,
        id: ++lastId,
        guests: [...e.guests],
        recurring: false,
        day: daysBetween(base, date),
        start: fitsAfter ? e.end : e.start,
        end: fitsAfter ? e.end + length : e.end,
      },
    ]
  })
}

function onMenuSelect(item: MenuItem) {
  const e = menu.value.event
  const date = menu.value.date
  if (!e) return
  switch (item.id) {
    case 'flexible':
      change(e.flexible ? `“${e.title}” is fixed` : `“${e.title}” can move`, () => update(e.id, { flexible: !e.flexible }))
      break
    case 'postpone':
      change(`Moved “${e.title}” to the next day`, () => update(e.id, { day: e.day + 1 }))
      break
    case 'next-week':
      change(`Moved “${e.title}” to next week`, () => update(e.id, { day: e.day + 7 }))
      break
    case 'earlier':
      change(`Moved “${e.title}” 30 minutes earlier`, () => update(e.id, { start: e.start - 30, end: e.end - 30 }))
      break
    case 'later':
      change(`Moved “${e.title}” 30 minutes later`, () => update(e.id, { start: e.start + 30, end: e.end + 30 }))
      break
    case 'copy':
      copyEvent(e, date)
      break
    case 'duplicate':
      duplicateEvent(e, date)
      break
    case 'delete':
      remove(e)
      break
  }
}

/* Keyboard on a focused event: Enter edits, the menu key or Shift+F10 opens the menu, shortcuts work directly. */
function onEventKeydown(ev: KeyboardEvent, e: ScheduleEvent, date: Date) {
  const target = ev.currentTarget as HTMLElement
  const primary = isMac ? ev.metaKey : ev.ctrlKey
  if (ev.key === 'ContextMenu' || (ev.shiftKey && ev.key === 'F10')) {
    ev.preventDefault()
    const r = target.getBoundingClientRect()
    openMenu(e, date, { x: r.left + 12, y: r.top + Math.min(r.height, 40) }, 'first')
  } else if (primary && ev.key.toLowerCase() === 'c') {
    ev.preventDefault()
    copyEvent(e, date)
  } else if (primary && ev.key.toLowerCase() === 'd') {
    ev.preventDefault()
    duplicateEvent(e, date)
  } else if (ev.key === 'Delete' || ev.key === 'Backspace') {
    ev.preventDefault()
    remove(e)
  }
}

/* ── "More" menu, add-calendar menu ────────────────────────────────────────── */

const moreOpen = ref(false)
const moreItems = computed<MenuItem[]>(() => [
  { id: 'weekends', label: 'Show weekends', checked: showWeekends.value, keepOpen: true },
  { id: 'today', label: 'Go to today', shortcut: 'T' },
  { divider: true },
  { id: 'reset', label: 'Reset sample data' },
])

function onMoreSelect(item: MenuItem) {
  if (item.id === 'weekends') showWeekends.value = !showWeekends.value
  else if (item.id === 'today') goToday()
  else if (item.id === 'reset') change('Sample data is back', () => (events.value = clone(seedEvents)))
}

const accountOpen = ref(false)
const accountItems: MenuItem[] = [
  { id: 'google', label: 'Connect Google account', icon: Globe },
  { id: 'outlook', label: 'Request Outlook support', icon: Mail },
  { id: 'icloud', label: 'Request iCloud support', icon: Cloud },
]

function onAccountSelect(item: MenuItem) {
  notify(item.id === 'google' ? 'This is a demo, so nothing was connected' : 'Thanks, noted. We will let you know.')
}

/* ── Drawer (narrow screens) ───────────────────────────────────────────────── */

const side = ref<HTMLElement | null>(null)
const drawerActive = computed(() => drawerOpen.value && isNarrow.value)
const drawerLayer = useLayer(drawerActive)
useFocusTrap(side, drawerActive, { isTop: drawerLayer.isTop })
useScrollLock(drawerActive)
useEscape(drawerActive, () => (drawerOpen.value = false), drawerLayer.isTop)

watch(selected, () => {
  if (isNarrow.value) drawerOpen.value = false
})

/* ── Hotkeys ───────────────────────────────────────────────────────────────── */

const anyOverlay = computed(() => dialog.value.open || menu.value.open || drawerActive.value)
useHotkey('n', () => create(view.value === 'day' ? selected.value : today), { enabled: () => !anyOverlay.value })
useHotkey('t', goToday, { enabled: () => !anyOverlay.value })

/* ── Mount ─────────────────────────────────────────────────────────────────── */

const scroller = ref<HTMLElement | null>(null)

function scrollToMorning() {
  nextTick(() => {
    if (scroller.value) scroller.value.scrollTop = ((8 * 60 - DAY_START) / 60) * HOUR - 4
  })
}

watch(view, (v) => {
  if (v !== 'month') scrollToMorning()
})

onMounted(() => {
  narrowQuery.addEventListener('change', onNarrowChange)
  clock = window.setInterval(() => (now.value = new Date()), 60_000)
  scrollToMorning()
})

onBeforeUnmount(() => {
  narrowQuery.removeEventListener('change', onNarrowChange)
  clearInterval(clock)
  clearTimeout(toastTimer)
})

const weekdayHeads = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
</script>

<template>
  <div class="pk" :class="{ 'is-narrow': isNarrow }">
    <ExampleStrip>
      <span>Pekan</span>
      <span class="ex-strip__sep">/</span>
      <span>Calendar</span>
      <span class="ex-strip__sep">/</span>
      <span>Week {{ weekNumber }}</span>
      <template #end>
        <span class="ex-strip__wide">{{ stripDay(now) }}</span>
        <span class="ex-strip__sep ex-strip__wide">/</span>
        <span class="pk-strip__clock">{{ formatTime(nowMinutes) }} {{ timezoneLabel }}</span>
      </template>
    </ExampleStrip>

    <div class="pk-frame">
      <!-- Sidebar: static on wide screens, a drawer on narrow ones. -->
      <div v-if="drawerActive" class="pk-backdrop" aria-hidden="true" @click="drawerOpen = false" />
      <aside
        ref="side"
        class="pk-side"
        :class="{ 'is-open': drawerActive }"
        :role="drawerActive ? 'dialog' : undefined"
        :aria-modal="drawerActive ? 'true' : undefined"
        aria-label="Calendars"
      >
        <div class="pk-side__brand">
          <AppMark glyph="pekan" />
          <span class="pk-side__name">Pekan</span>
          <RIconButton v-if="drawerActive" class="pk-side__close" label="Close calendars" variant="ghost" size="sm" @click="drawerOpen = false">
            <X />
          </RIconButton>
        </div>

        <div class="pk-side__section">
          <MiniMonth v-model="selected" :busy="busy" :week-mode="view === 'week'" />
        </div>

        <div class="pk-side__section pk-side__section--tight">
          <RInput v-model="query" placeholder="Find an event or a person" aria-label="Find an event or a person" clearable>
            <template #leading><Search /></template>
          </RInput>
        </div>

        <div class="pk-side__section pk-side__section--tight">
          <p id="pk-calendars-label" class="pk-side__label"><span class="r-index" aria-hidden="true">01</span> My calendars</p>
          <ul class="pk-calendars" aria-labelledby="pk-calendars-label">
            <li v-for="c in calendars" :key="c.id">
              <RCheckbox v-model="visibleCalendars" :value="c.id" :color="`var(--r-identity-${c.color}-text)`" :label="c.name" />
            </li>
          </ul>
          <RPopover v-model:open="accountOpen" kind="menu" placement="bottom-start">
            <template #trigger>
              <RButton variant="ghost" tone="brand" size="sm" class="pk-add-account">
                <template #leading><Plus /></template>
                Add calendar account
              </RButton>
            </template>
            <RMenu :items="accountItems" label="Add calendar account" @select="onAccountSelect" @close="accountOpen = false" />
          </RPopover>
        </div>

        <div v-if="nextUp" class="pk-next">
          <p class="pk-next__label"><span class="r-index" aria-hidden="true">02</span> Next up</p>
          <p class="pk-next__title">{{ nextUp.event.title }}</p>
          <p class="pk-next__when">
            <span>{{ nextUp.when }}</span>
            <template v-if="nextUp.event.location">
              <span class="pk-next__place"><MapPin class="pk-next__pin" aria-hidden="true" />{{ nextUp.event.location }}</span>
            </template>
          </p>
          <div class="pk-next__foot">
            <RAvatarGroup :names="nextUp.event.guests" :max="4" size="sm" />
            <RButton v-if="nextUp.event.video" size="sm" variant="outline" @click="notify('This is a demo, so there is no call to join')">
              <template #leading><Video /></template>
              Join
            </RButton>
          </div>
        </div>

        <div class="pk-profile">
          <RAvatar name="Anastasia Wijaya" size="md" status="online" />
          <div class="pk-profile__text">
            <span class="pk-profile__name">Anastasia Wijaya</span>
            <span class="pk-profile__mail">anastasia@pekan.app</span>
          </div>
          <RIconButton label="Sign out" variant="ghost" size="sm" @click="notify('Signed out. Not really, this is a demo.')">
            <LogOut />
          </RIconButton>
        </div>
      </aside>

      <main class="pk-main" aria-label="Schedule">
        <header class="pk-top">
          <div class="pk-top__left">
            <RIconButton v-if="isNarrow" label="Show calendars" variant="ghost" @click="drawerOpen = true">
              <PanelLeft />
            </RIconButton>
            <h1 class="pk-title">
              <span>{{ heading.month }}</span>{{ ' ' }}<span class="pk-title__year">{{ heading.year }}</span>
            </h1>
            <div class="pk-top__steps">
              <RIconButton :label="`Previous ${view === 'day' ? 'day' : view}`" variant="ghost" size="sm" @click="step(-1)">
                <ChevronLeft />
              </RIconButton>
              <RIconButton :label="`Next ${view === 'day' ? 'day' : view}`" variant="ghost" size="sm" @click="step(1)">
                <ChevronRight />
              </RIconButton>
            </div>
            <RTooltip content="Go to today" :shortcut="['T']" :describe="false">
              <RButton variant="outline" size="sm" @click="goToday">Today</RButton>
            </RTooltip>
          </div>

          <RSegmented v-model="view" class="pk-top__views" :options="viewOptions" size="sm" label="View" />

          <div class="pk-top__right">
            <RPopover v-model:open="moreOpen" kind="menu" placement="bottom-end">
              <template #trigger>
                <RIconButton label="More options" variant="ghost"><Ellipsis /></RIconButton>
              </template>
              <RMenu :items="moreItems" label="More options" @select="onMoreSelect" @close="moreOpen = false" />
            </RPopover>
            <RTooltip content="New event" :shortcut="['N']" :describe="false">
              <RButton class="pk-new" tone="brand" @click="create(view === 'day' ? selected : today)">
                <template #leading><Plus /></template>
                <span class="pk-new__label">New event</span>
              </RButton>
            </RTooltip>
          </div>
        </header>

        <!-- Day and week -->
        <div v-if="view !== 'month'" ref="scroller" class="pk-cal">
          <div
            class="pk-cal__inner"
            :style="{ gridTemplateColumns: `64px repeat(${columns.length}, minmax(${view === 'day' ? 240 : 116}px, 1fr))` }"
          >
            <div class="pk-cal__corner">
              <span class="pk-cal__tz">{{ timezoneLabel }}</span>
            </div>
            <button
              v-for="col in columns"
              :key="`h${col.date.getTime()}`"
              type="button"
              class="pk-cal__dayhead"
              :class="{ 'is-today': col.isToday }"
              :aria-label="`${longDay(col.date)}${col.isToday ? ', today' : ''}. Open day view`"
              :aria-current="col.isToday ? 'date' : undefined"
              @click="openDay(col.date)"
            >
              <span class="pk-cal__dayname">{{ view === 'day' ? col.date.toLocaleDateString('en-US', { weekday: 'long' }) : dayName(col.date) }}</span>
              <span class="pk-cal__daynum">{{ col.date.getDate() }}</span>
            </button>

            <div class="pk-cal__times" :style="{ height: `${gridHeight}px` }" aria-hidden="true">
              <span v-for="hr in hours" :key="hr" class="pk-cal__time" :style="{ top: `${((hr - DAY_START) / 60) * HOUR}px` }">
                {{ formatHour(hr) }}
              </span>
              <span v-if="nowVisible && columns.some((c) => c.isToday)" class="pk-cal__now-tag" :style="{ top: `${nowTop}px` }">
                {{ formatTime(nowMinutes) }}
              </span>
            </div>

            <section
              v-for="col in columns"
              :key="`c${col.date.getTime()}`"
              class="pk-cal__col"
              :class="{ 'is-today': col.isToday }"
              :style="{ height: `${gridHeight}px` }"
              :aria-label="longDay(col.date)"
              @click="onColumnClick($event, col.date)"
            >
              <button
                v-for="b in col.blocks"
                :key="b.event.id"
                type="button"
                class="pk-event"
                :class="{
                  'is-short': durationOf(b.event) < 50,
                  'is-flexible': b.event.flexible,
                  'is-dim': !matches(b.event),
                  'is-match': !!needle && matches(b.event),
                  'is-stacked': b.lane > 0,
                }"
                :style="blockStyle(b)"
                :aria-label="eventLabel(b.event, col.date)"
                aria-haspopup="menu"
                @click="edit(b.event, col.date)"
                @contextmenu="onContextMenu($event, b.event, col.date)"
                @keydown="onEventKeydown($event, b.event, col.date)"
              >
                <span class="pk-event__title">
                  <component :is="iconOf(b.event)" class="pk-event__icon" />
                  <span class="pk-event__text">{{ b.event.title }}</span>
                </span>
                <span class="pk-event__time">{{ formatRange(b.event.start, b.event.end) }}</span>
                <span v-if="durationOf(b.event) >= 75 && b.event.guests.length > 1" class="pk-event__foot">
                  <RAvatarGroup :names="b.event.guests" :max="3" size="xs" />
                  <Video v-if="b.event.video" class="pk-event__video" />
                </span>
              </button>
              <div v-if="col.isToday && nowVisible" class="pk-cal__now" :style="{ top: `${nowTop}px` }" aria-hidden="true" />
            </section>
          </div>
        </div>

        <!-- Month -->
        <div v-else class="pk-month">
          <div class="pk-month__grid">
            <div v-for="d in weekdayHeads" :key="d" class="pk-month__head" aria-hidden="true">{{ d }}</div>
            <div
              v-for="cell in monthCells"
              :key="cell.date.getTime()"
              class="pk-month__cell"
              :class="{ 'is-outside': cell.outside, 'is-today': cell.isToday }"
            >
              <button
                type="button"
                class="pk-month__date"
                :aria-label="`${longDay(cell.date)}, ${cell.list.length} ${cell.list.length === 1 ? 'event' : 'events'}`"
                :aria-current="cell.isToday ? 'date' : undefined"
                @click="openDay(cell.date)"
              >
                {{ cell.date.getDate() }}
              </button>
              <button
                v-for="e in cell.list.slice(0, 3)"
                :key="e.id"
                type="button"
                class="pk-month__event"
                :class="{ 'is-dim': !matches(e) }"
                :style="{ '--ev-bg': `var(--r-identity-${colorOf(e)})`, '--ev-fg': `var(--r-identity-${colorOf(e)}-text)` }"
                :aria-label="eventLabel(e, cell.date)"
                @click="edit(e, cell.date)"
                @contextmenu="onContextMenu($event, e, cell.date)"
                @keydown="onEventKeydown($event, e, cell.date)"
              >
                <span class="pk-month__event-time">{{ formatTime(e.start) }}</span>
                {{ e.title }}
              </button>
              <button v-if="cell.list.length > 3" type="button" class="pk-month__more" @click="openDay(cell.date)">
                {{ cell.list.length - 3 }} more
              </button>
            </div>
          </div>
        </div>

        <p class="r-sr-only">
          Tip: press N for a new event and T for today. On an event, press Enter to edit it, the menu key or Shift F10
          for more actions, <RKbd :keys="['mod', 'C']" /> to copy and <RKbd :keys="['mod', 'D']" /> to duplicate.
        </p>
      </main>
    </div>

    <!-- Right-click menu -->
    <RPopover v-model:open="menu.open" :point="menu.point" kind="menu" placement="bottom-start" :offset="2">
      <RMenu
        :key="menu.event?.id"
        :items="menuItems"
        :label="menu.event ? `${menu.event.title} actions` : 'Event actions'"
        :initial-focus="menu.focus"
        @select="onMenuSelect"
        @close="menu.open = false"
      >
        <template #header>
          <ColorDots v-model="menuColor" />
        </template>
      </RMenu>
    </RPopover>

    <EventDialog
      v-model:open="dialog.open"
      :event="dialog.event"
      :is-new="dialog.isNew"
      :base="base"
      :week="week"
      @save="onSave"
      @delete="remove"
    />

    <div class="pk-toast-region" role="status" aria-live="polite">
      <Transition name="pk-toast">
        <div v-if="toast" class="pk-toast" data-theme="dark">
          <span class="pk-toast__text">{{ toast.text }}</span>
          <RButton v-if="toast.undo" size="sm" variant="ghost" tone="brand" @click="toast.undo()">Undo</RButton>
          <RIconButton label="Dismiss" size="sm" variant="ghost" @click="toast = null"><X /></RIconButton>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style>
.pk {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;
  background: var(--r-bg-surface);
  color: var(--r-text);
}

.pk-strip__clock {
  color: var(--r-text);
  font-variant-numeric: tabular-nums;
}

.pk-frame {
  position: relative;
  display: flex;
  flex: 1;
  min-height: 0;
}

/* ── Sidebar ──────────────────────────────────────────────────────────────── */
.pk-side {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  width: 288px;
  height: 100%;
  overflow-y: auto;
  border-right: 1px solid var(--r-border);
  background: var(--r-bg-canvas);
}

/* The sidebar scrolls; its parts keep their size instead of squashing. */
.pk-side > * {
  flex-shrink: 0;
}

.pk-side__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 56px;
  padding: 0 20px;
  border-bottom: 1px solid var(--r-border);
}

.pk-side__name {
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-tight);
}

.pk-side__close {
  margin-left: auto;
}

.pk-side__section {
  padding: 20px;
  border-bottom: 1px solid var(--r-border);
}
.pk-side__section--tight {
  padding-top: 16px;
  padding-bottom: 16px;
}

.pk-side__label,
.pk-next__label {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 10px;
  color: var(--r-text);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.pk-calendars {
  display: flex;
  flex-direction: column;
  margin: 0 -8px 8px;
}
.pk-calendars li {
  transition: background-color var(--r-duration-fast) var(--r-ease-out);
}
.pk-calendars li:hover {
  background: var(--r-bg-hover);
}
.pk-calendars .r-checkbox {
  width: 100%;
  padding: 7px 8px;
}

.pk-add-account {
  margin-left: -8px;
}

.pk-next {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 16px 20px 0;
  padding: 14px 16px 16px;
  border: 1px solid var(--r-border);
  border-left: 2px solid var(--r-brand);
  background: var(--r-bg-surface);
}
.pk-next__label {
  margin-bottom: 4px;
}
.pk-next__title {
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  line-height: 1.35;
}
.pk-next__when {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 12px;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
}
.pk-next__place {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.pk-next__pin {
  width: 13px;
  height: 13px;
}
.pk-next__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
}

.pk-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: auto;
  padding: 16px 20px;
  border-top: 1px solid var(--r-border);
}
.pk-profile__text {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}
.pk-profile__name {
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
}
.pk-profile__mail {
  overflow: hidden;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── Main ─────────────────────────────────────────────────────────────────── */
.pk-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  height: 100%;
}

.pk-top {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 16px;
  height: 56px;
  padding: 0 16px 0 24px;
  border-bottom: 1px solid var(--r-border);
}

.pk-top__left,
.pk-top__right {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.pk-top__right {
  justify-content: flex-end;
}

.pk-title {
  display: flex;
  gap: 8px;
  margin-right: 4px;
  font-size: var(--r-text-xl);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-tight);
  white-space: nowrap;
}
.pk-title__year {
  color: var(--r-text-tertiary);
  font-weight: var(--r-weight-regular);
  font-variant-numeric: tabular-nums;
}

.pk-top__steps {
  display: flex;
}

/* ── Week grid ────────────────────────────────────────────────────────────── */
.pk-cal {
  flex: 1;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
}

.pk-cal__inner {
  display: grid;
  grid-template-rows: auto auto;
  min-width: min-content;
  padding-bottom: 88px;
}

.pk-cal__corner,
.pk-cal__dayhead {
  position: sticky;
  z-index: 3;
  top: 0;
  height: 64px;
  border-bottom: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}

.pk-cal__corner {
  z-index: 4;
  left: 0;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 0 10px 10px 0;
}

.pk-cal__tz {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.pk-cal__dayhead {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-end;
  gap: 2px;
  padding: 0 12px 8px;
  border: 0;
  border-bottom: 1px solid var(--r-border);
  border-left: 1px solid var(--r-border-subtle);
  color: var(--r-text);
  text-align: left;
  cursor: pointer;
}
.pk-cal__dayhead:hover .pk-cal__daynum {
  color: var(--r-brand-text);
}
.pk-cal__dayhead:focus-visible {
  outline-offset: -3px;
}

.pk-cal__dayname {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.pk-cal__daynum {
  font-size: var(--r-text-2xl);
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
  line-height: 1.05;
  letter-spacing: var(--r-tracking-tight);
  transition: color var(--r-duration-fast) var(--r-ease-out);
}

.pk-cal__dayhead.is-today {
  box-shadow: inset 0 -2px 0 var(--r-brand);
}
.pk-cal__dayhead.is-today .pk-cal__daynum,
.pk-cal__dayhead.is-today .pk-cal__dayname {
  color: var(--r-brand-text);
}

.pk-cal__times {
  position: sticky;
  z-index: 2;
  left: 0;
  background: var(--r-bg-surface);
}

.pk-cal__time {
  position: absolute;
  right: 10px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  transform: translateY(-50%);
}
.pk-cal__time:first-child {
  transform: none;
}

/* Now is signal orange: the current time is the one live thing on this screen. */
.pk-cal__now-tag {
  position: absolute;
  z-index: 1;
  right: 4px;
  padding: 2px 4px;
  background: var(--r-chart-now);
  color: var(--r-on-signal);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  transform: translateY(-50%);
}

.pk-cal__col {
  position: relative;
  border-left: 1px solid var(--r-border-subtle);
  background-image: repeating-linear-gradient(
    to bottom,
    var(--r-border-subtle) 0 1px,
    transparent 1px 64px
  );
}
.pk-cal__col.is-today {
  background-color: color-mix(in srgb, var(--r-brand-soft) 60%, transparent);
}

.pk-cal__now {
  position: absolute;
  z-index: 2;
  right: 0;
  left: 0;
  height: 2px;
  margin-top: -1px;
  background: var(--r-chart-now);
  pointer-events: none;
}
/* A point on the line: a circle means a point. */
.pk-cal__now::before {
  position: absolute;
  top: -3px;
  left: -4px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--r-chart-now);
  content: '';
}

/* ── Event blocks: identity tint, a 2px rule on the leading edge ─────────── */
.pk-event {
  --r-avatar-ring: var(--ev-bg);
  position: absolute;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  padding: 5px 8px 6px 9px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--ev-fg) 18%, transparent);
  border-left: 2px solid var(--ev-fg);
  background: var(--ev-bg);
  color: var(--ev-fg);
  text-align: left;
  cursor: pointer;
  transition:
    box-shadow var(--r-duration-fast) var(--r-ease-out),
    opacity var(--r-duration-base) var(--r-ease-out);
}
.pk-event:hover {
  border-color: color-mix(in srgb, var(--ev-fg) 45%, transparent);
  border-left-color: var(--ev-fg);
}
.pk-event:focus-visible {
  z-index: 5 !important;
  outline-offset: 1px;
}

.pk-event.is-stacked {
  box-shadow: 0 0 0 2px var(--r-bg-surface);
}

/* Dashes mean something: a flexible event the scheduler may move. */
.pk-event.is-flexible {
  border-style: dashed;
  border-left-style: solid;
}
.pk-event.is-dim {
  opacity: 0.32;
}
.pk-event.is-match {
  box-shadow: 0 0 0 2px var(--ev-fg);
}

.pk-event__title {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-semibold);
  line-height: 1.3;
}
.pk-event__icon {
  width: 13px;
  height: 13px;
}
.pk-event__text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* Full colour (no opacity) keeps the time above 4.5:1 on every tint. */
.pk-event__time {
  overflow: hidden;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-medium);
  font-variant-numeric: tabular-nums;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pk-event__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
}
.pk-event__video {
  width: 14px;
  height: 14px;
}

.pk-event.is-short {
  flex-direction: row;
  align-items: center;
  gap: 6px;
  padding-top: 0;
  padding-bottom: 0;
}
.pk-event.is-short .pk-event__title {
  flex: 0 1 auto;
}
/* In a short event the time gives way first, so the title stays readable. */
.pk-event.is-short .pk-event__time {
  flex: 0 100 auto;
  min-width: 0;
}

/* ── Month ────────────────────────────────────────────────────────────────── */
.pk-month {
  flex: 1;
  min-height: 0;
  padding: 0 0 88px;
  overflow: auto;
}

.pk-month__grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  min-width: 640px;
}

.pk-month__head {
  padding: 10px 12px;
  border-bottom: 1px solid var(--r-border);
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.pk-month__cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-height: 118px;
  padding: 6px;
  border-right: 1px solid var(--r-border-subtle);
  border-bottom: 1px solid var(--r-border-subtle);
}
.pk-month__cell:nth-child(7n + 7) {
  border-right: 0;
}
.pk-month__cell.is-outside {
  background: var(--r-bg-muted);
}

.pk-month__date {
  display: inline-grid;
  place-items: center;
  align-self: flex-start;
  min-width: 26px;
  height: 26px;
  margin-bottom: 2px;
  padding: 0 6px;
  border: 0;
  background: none;
  color: var(--r-text);
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
  font-variant-numeric: tabular-nums;
  cursor: pointer;
}
.pk-month__date:hover {
  background: var(--r-bg-hover);
}
.pk-month__cell.is-outside .pk-month__date {
  color: var(--r-text-tertiary);
}
.pk-month__cell.is-today .pk-month__date {
  background: var(--r-brand);
  color: var(--r-on-brand);
}

.pk-month__event {
  display: block;
  width: 100%;
  padding: 3px 6px 3px 5px;
  overflow: hidden;
  border: 0;
  border-left: 2px solid var(--ev-fg);
  background: var(--ev-bg);
  color: var(--ev-fg);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}
.pk-month__event.is-dim {
  opacity: 0.32;
}
.pk-month__event-time {
  margin-right: 4px;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
}

.pk-month__more {
  align-self: flex-start;
  padding: 2px 6px;
  border: 0;
  background: none;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
  cursor: pointer;
}
.pk-month__more:hover {
  background: var(--r-bg-hover);
  color: var(--r-text);
}

/* ── Toast: a square dark island ──────────────────────────────────────────── */
.pk-toast-region {
  position: fixed;
  z-index: var(--r-z-toast);
  right: 0;
  bottom: 84px;
  left: 0;
  display: flex;
  justify-content: center;
  pointer-events: none;
}

.pk-toast {
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: calc(100vw - 24px);
  padding: 4px 4px 4px 14px;
  border: 1px solid var(--r-border-strong);
  background: var(--r-bg-raised);
  box-shadow: var(--r-shadow-lg);
  color: var(--r-text);
  font-size: var(--r-text-sm);
  pointer-events: auto;
}
.pk-toast__text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pk-toast-enter-active,
.pk-toast-leave-active {
  transition:
    opacity var(--r-duration-base) var(--r-ease-out),
    transform var(--r-duration-base) var(--r-ease-out);
}
.pk-toast-enter-from,
.pk-toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

/* ── Narrow screens ───────────────────────────────────────────────────────── */
.pk-backdrop {
  position: fixed;
  z-index: calc(var(--r-z-modal) - 1);
  inset: 0;
  background: var(--r-bg-overlay);
  animation: r-fade-in var(--r-duration-base) var(--r-ease-out);
}

.pk.is-narrow .pk-side {
  position: fixed;
  z-index: var(--r-z-modal);
  top: 0;
  left: 0;
  width: min(320px, 88vw);
  height: 100dvh;
  border-right-color: var(--r-border-strong);
  box-shadow: var(--r-shadow-xl);
  visibility: hidden;
  transform: translateX(-102%);
  transition:
    transform var(--r-duration-slow) var(--r-ease-out),
    visibility 0s linear var(--r-duration-slow);
}
.pk.is-narrow .pk-side.is-open {
  visibility: visible;
  transform: none;
  transition: transform var(--r-duration-slow) var(--r-ease-out);
}

@media (max-width: 860px) {
  .pk-top {
    grid-template-columns: 1fr auto;
    grid-template-rows: auto auto;
    height: auto;
    padding: 10px 12px 10px 8px;
    row-gap: 10px;
  }
  .pk-top__views {
    grid-row: 2;
    grid-column: 1 / -1;
    justify-self: stretch;
  }
  .pk-top__views .r-segmented__option {
    flex: 1;
  }
  .pk-title {
    font-size: var(--r-text-lg);
  }
}

@media (max-width: 520px) {
  .pk-title__year,
  .pk-new__label {
    display: none;
  }
  .pk-new {
    width: 32px;
    padding: 0 !important;
  }
  .pk-top__left {
    gap: 2px;
  }
}
</style>
