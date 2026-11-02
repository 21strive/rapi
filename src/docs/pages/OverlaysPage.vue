<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import {
  AlarmClock,
  Archive,
  Bell,
  Calendar,
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  Clock,
  Copy,
  CopyPlus,
  Download,
  Info,
  LayoutDashboard,
  Link,
  Mail,
  MoreHorizontal,
  Pencil,
  Repeat,
  Search,
  Share2,
  SlidersHorizontal,
  Trash2,
  UserRound,
  X,
} from 'lucide-vue-next'
import {
  RAvatarGroup,
  RBadge,
  RButton,
  RCard,
  RChip,
  RCoachmark,
  RCommandPalette,
  RDialog,
  RIconButton,
  RInput,
  RMenu,
  RPopover,
  RSelect,
  RStat,
  RSwitch,
  RTooltip,
  RTour,
  isMac,
  type CommandItem,
  type MenuItem,
  type Placement,
  type SelectOption,
  type Tone,
  type TourStep,
} from '@/design-system'
import DocPage from '../components/DocPage.vue'
import DocSection from '../components/DocSection.vue'
import Demo from '../components/Demo.vue'
import CodeBlock from '../components/CodeBlock.vue'
import PropsTable from '../components/PropsTable.vue'
import DoDont from '../components/DoDont.vue'
import type { PropRow } from '../types'

const mod = isMac ? '⌘' : 'Ctrl+'

/* ── Popover: a Finanzen-style filter ─────────────────────────────────────── */
interface Filters {
  from: string
  to: string
  client: string | number | null
  status: string | number | null
  keyword: string
}
const empty = (): Filters => ({ from: '', to: '', client: null, status: null, keyword: '' })
const filterOpen = ref(false)
const draft = reactive<Filters>({ ...empty(), from: '2025-11-12', to: '2025-11-15', status: 'done' })
const applied = reactive<Filters>(empty())

const clientTypes: SelectOption[] = [
  { label: 'Finance website', value: 'finance' },
  { label: 'Travel app', value: 'travel' },
  { label: 'Courier logistics app', value: 'courier' },
  { label: 'Company profile', value: 'profile' },
  { label: 'Ecommerce', value: 'ecommerce' },
]
const statuses: SelectOption[] = [
  { label: 'Pending', value: 'pending', tone: 'warning' },
  { label: 'In progress', value: 'progress', tone: 'brand' },
  { label: 'Done', value: 'done', tone: 'success' },
]

const shortDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const formatDay = (value: string) => (value ? shortDate.format(new Date(`${value}T00:00:00Z`)) : '')

function applyFilters(close: () => void) {
  Object.assign(applied, draft)
  close()
}
function resetFilters() {
  Object.assign(draft, empty())
}

type ChipKey = 'dates' | 'client' | 'status' | 'keyword'

const appliedChips = computed(() => {
  const chips: { key: ChipKey; label: string; tone?: Tone }[] = []
  if (applied.from || applied.to) {
    chips.push({ key: 'dates', label: `${formatDay(applied.from) || '…'} → ${formatDay(applied.to) || '…'}` })
  }
  const client = clientTypes.find((c) => c.value === applied.client)
  if (client) chips.push({ key: 'client', label: client.label })
  const status = statuses.find((s) => s.value === applied.status)
  if (status) chips.push({ key: 'status', label: status.label, tone: status.tone as Tone })
  if (applied.keyword.trim()) chips.push({ key: 'keyword', label: `“${applied.keyword.trim()}”` })
  return chips
})

function removeChip(key: ChipKey) {
  if (key === 'dates') {
    applied.from = draft.from = ''
    applied.to = draft.to = ''
  } else if (key === 'keyword') {
    applied.keyword = draft.keyword = ''
  } else {
    applied[key] = null
    draft[key] = null
  }
}

const placements: Placement[] = ['top', 'right-start', 'bottom', 'left']

const popoverCode = `<script setup lang="ts">
import { ref } from 'vue'
import { SlidersHorizontal } from 'lucide-vue-next'
import { RButton, RPopover } from '@/design-system'

const open = ref(false)
<\/script>

<template>
  <RPopover v-model:open="open" placement="bottom-end" width="340px" label="Filter projects">
    <template #trigger>
      <RButton variant="outline">
        <template #leading><SlidersHorizontal /></template>
        Filter
      </RButton>
    </template>
    <template #default="{ close }">
      <FilterForm @apply="close" />
    </template>
  </RPopover>
</template>`

const popoverProps: PropRow[] = [
  { name: 'v-model:open', type: 'boolean', default: 'false', description: 'Open state. Works without v-model too; the trigger toggles it.' },
  { name: 'placement', type: 'Placement', default: "'bottom-start'", description: 'top, bottom, left or right, with -start or -end. Flips to the other side when it runs out of room.' },
  { name: 'offset', type: 'number', default: '8', description: 'Gap between the trigger and the panel, in px.' },
  { name: 'point', type: '{ x, y } | null', default: 'null', description: 'Anchor to a point in the viewport instead of a trigger. Used for context menus.' },
  { name: 'kind', type: "'dialog' | 'menu'", default: "'dialog'", description: 'dialog moves focus into the panel and keeps Tab inside. menu leaves focus to the RMenu you put in it.' },
  { name: 'label', type: 'string', description: 'Accessible name of a dialog popover.' },
  { name: 'padding', type: "'none' | 'sm' | 'md'", default: 'sm for menus, md for dialogs', description: 'Inner padding of the panel.' },
  { name: 'width', type: 'string', description: 'Fixed panel width, e.g. "340px". It never grows past the viewport.' },
  { name: 'matchWidth', type: 'boolean', default: 'false', description: 'Make the panel at least as wide as the trigger.' },
  { name: '#trigger', type: 'slot { open, toggle }', description: 'The element that opens it. Clicking it toggles, and it gets aria-expanded and aria-controls for you.' },
  { name: '#default', type: 'slot { close }', description: 'Panel content. Escape and a click outside also close it, and focus goes back to the trigger.' },
]

/* ── Menu ─────────────────────────────────────────────────────────────────── */
const moreOpen = ref(false)
const lastAction = ref('')
const rowActions: MenuItem[] = [
  { id: 'edit', label: 'Edit details', icon: Pencil, shortcut: `${mod}E` },
  { id: 'duplicate', label: 'Duplicate', icon: CopyPlus, shortcut: `${mod}D` },
  { id: 'share', label: 'Share', icon: Share2 },
  { id: 'archive', label: 'Archive', icon: Archive },
  { divider: true },
  { id: 'delete', label: 'Delete', icon: Trash2, danger: true, shortcut: '⌫' },
]

const eventColors = [
  { index: 1, name: 'Blue' },
  { index: 2, name: 'Violet' },
  { index: 3, name: 'Pink' },
  { index: 4, name: 'Rose' },
  { index: 5, name: 'Orange' },
  { index: 6, name: 'Amber' },
  { index: 7, name: 'Green' },
  { index: 8, name: 'Teal' },
]
const eventColor = ref(1)
const eventWhen = ref('Fri 12 Jan · 08:00 – 09:00')
const contextOpen = ref(false)
const contextPoint = ref<{ x: number; y: number } | null>(null)
const contextFocus = ref<'first' | 'menu'>('menu')
const dotEls: (HTMLButtonElement | null)[] = []

function openContextAt(event: MouseEvent) {
  contextPoint.value = { x: event.clientX, y: event.clientY }
  contextFocus.value = 'menu'
  contextOpen.value = true
}

function onEventKeydown(event: KeyboardEvent) {
  if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
    event.preventDefault()
    const box = (event.currentTarget as HTMLElement).getBoundingClientRect()
    contextPoint.value = { x: box.left + 12, y: box.bottom + 4 }
    contextFocus.value = 'first'
    contextOpen.value = true
  }
}

function onDotsKeydown(event: KeyboardEvent) {
  const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0
  if (!step) return
  event.preventDefault()
  const at = eventColors.findIndex((c) => c.index === eventColor.value)
  const next = (at + step + eventColors.length) % eventColors.length
  eventColor.value = eventColors[next].index
  dotEls[next]?.focus()
}

const contextItems: MenuItem[] = [
  { id: 'flexible', label: 'Make flexible', icon: Repeat },
  {
    id: 'reschedule',
    label: 'Reschedule',
    icon: CalendarClock,
    children: [
      { id: 'postpone', label: 'Postpone', icon: CalendarPlus, description: 'Next free slot after 12 Jan' },
      { id: 'next-week', label: 'Next week', icon: CalendarDays, description: 'Fri 19 Jan, same time' },
      { divider: true },
      { id: 'tomorrow', label: 'Tomorrow morning', icon: Clock, description: 'Sat 13 Jan, 09:00' },
    ],
  },
  { id: 'copy', label: 'Copy', icon: Copy, shortcut: `${mod}C` },
  { id: 'duplicate', label: 'Duplicate', icon: CopyPlus, shortcut: `${mod}D` },
  { divider: true },
  { id: 'delete', label: 'Delete', icon: Trash2, danger: true, shortcut: '⌫' },
]

const contextResult = ref('')
function onContextSelect(item: MenuItem) {
  const results: Record<string, string> = {
    flexible: 'Weekly meeting can now move within the day.',
    postpone: 'Moved to the next free slot, Mon 15 Jan at 10:30.',
    'next-week': 'Moved to Fri 19 Jan, 08:00.',
    tomorrow: 'Moved to Sat 13 Jan, 09:00.',
    copy: 'Copied to the clipboard.',
    duplicate: 'Duplicated as “Weekly meeting (copy)”.',
    delete: 'Deleted. You can undo this for a few seconds.',
  }
  if (item.id === 'next-week') eventWhen.value = 'Fri 19 Jan · 08:00 – 09:00'
  if (item.id === 'tomorrow') eventWhen.value = 'Sat 13 Jan · 09:00 – 10:00'
  if (item.id === 'postpone') eventWhen.value = 'Mon 15 Jan · 10:30 – 11:30'
  contextResult.value = results[item.id ?? ''] ?? ''
}

const view = reactive({ weekends: true, declined: false, compact: false })
const viewOpen = ref(false)
const viewItems = computed<MenuItem[]>(() => [
  { heading: true, label: 'Show' },
  { id: 'weekends', label: 'Weekends', checked: view.weekends, keepOpen: true, onSelect: () => (view.weekends = !view.weekends) },
  { id: 'declined', label: 'Declined events', checked: view.declined, keepOpen: true, onSelect: () => (view.declined = !view.declined) },
  { divider: true },
  { id: 'compact', label: 'Compact rows', checked: view.compact, keepOpen: true, onSelect: () => (view.compact = !view.compact) },
])

const menuCode = `<script setup lang="ts">
import { ref } from 'vue'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-vue-next'
import { RIconButton, RMenu, RPopover } from '@/design-system'

const open = ref(false)
const items = [
  { id: 'edit', label: 'Edit details', icon: Pencil, shortcut: '⌘E' },
  { divider: true },
  { id: 'delete', label: 'Delete', icon: Trash2, danger: true },
]
<\/script>

<template>
  <RPopover v-model:open="open" kind="menu" placement="bottom-end">
    <template #trigger>
      <RIconButton label="More actions"><MoreHorizontal /></RIconButton>
    </template>
    <RMenu :items="items" label="Project actions" @select="run" @close="open = false" />
  </RPopover>
</template>`

const menuProps: PropRow[] = [
  { name: 'items', type: 'MenuItem[]', description: 'Rows of the menu. See the fields below.' },
  { name: 'label', type: 'string', description: 'Accessible name of the menu.' },
  { name: 'initialFocus', type: "'first' | 'menu' | 'none'", default: "'first'", description: 'first when opened from the keyboard, menu when opened by a pointer (nothing looks selected until you press an arrow key).' },
  { name: '@select', type: '(item: MenuItem) => void', description: 'Fired for every chosen item, including ones inside a submenu.' },
  { name: '@close', type: "(reason: 'select' | 'escape' | 'tab') => void", description: 'The menu wants to close. Set your popover to closed here.' },
  { name: '#header', type: 'slot', description: 'Content above the items, like colour dots. Tab moves between the header and the items; arrow keys in the header belong to its own widget.' },
]

const menuItemProps: PropRow[] = [
  { name: 'id', type: 'string', description: 'Stable id, handy in a select handler.' },
  { name: 'label', type: 'string', description: 'The text. Typing its first letters jumps to it.' },
  { name: 'icon', type: 'Component', description: 'Shown on the left. When one item has an icon, all labels line up.' },
  { name: 'shortcut', type: 'string', description: 'Shown on the right, e.g. "⌘C". Display only; wire the key yourself.' },
  { name: 'description', type: 'string', description: 'A quieter second line under the label.' },
  { name: 'danger', type: 'boolean', description: 'Destructive action, drawn in the danger colour.' },
  { name: 'disabled', type: 'boolean', description: 'Shown dimmed and skipped by the arrow keys.' },
  { name: 'children', type: 'MenuItem[]', description: 'Opens a submenu on hover, click or ArrowRight. One level reads best.' },
  { name: 'divider', type: 'boolean', description: 'Renders a separator instead of an item.' },
  { name: 'heading', type: 'boolean', description: 'Renders a small group label instead of an item.' },
  { name: 'checked', type: 'boolean', description: 'Makes it a menuitemcheckbox and shows a check when true.' },
  { name: 'keepOpen', type: 'boolean', description: 'Keep the menu open after choosing it, for checkable items.' },
  { name: 'onSelect', type: '() => void', description: 'Called when the item is chosen, before @select.' },
]

/* ── Tooltip ──────────────────────────────────────────────────────────────── */
const toolbar = [
  { label: 'Copy link', icon: Link, keys: ['mod', 'L'], aria: isMac ? 'Meta+L' : 'Control+L' },
  { label: 'Duplicate', icon: CopyPlus, keys: ['mod', 'D'], aria: isMac ? 'Meta+D' : 'Control+D' },
  { label: 'Archive', icon: Archive, keys: ['E'], aria: 'E' },
  { label: 'Delete', icon: Trash2, keys: ['backspace'], aria: 'Backspace' },
]
const tooltipPlacements: Placement[] = ['top', 'right', 'bottom', 'left']

const tooltipCode = `<RTooltip content="Duplicate" :shortcut="['mod', 'D']" :describe="false">
  <RIconButton label="Duplicate" variant="ghost"><CopyPlus /></RIconButton>
</RTooltip>

<RTooltip content="Revenue after refunds, fees and tax.">
  <button type="button" aria-label="About net revenue"><Info /></button>
</RTooltip>`

const tooltipProps: PropRow[] = [
  { name: 'content', type: 'string', description: 'The tooltip text.' },
  { name: 'placement', type: 'Placement', default: "'top'", description: 'Where it opens. Flips when there is no room.' },
  { name: 'delay', type: 'number', default: '400', description: 'Hover delay in ms. Keyboard focus shows it straight away.' },
  { name: 'shortcut', type: 'string[]', description: "Keys shown inside the tooltip, e.g. ['mod', 'D']. 'mod' becomes ⌘ or Ctrl." },
  { name: 'disabled', type: 'boolean', default: 'false', description: 'Never show it.' },
  { name: 'describe', type: 'boolean', default: 'true', description: 'Adds the text as the trigger’s accessible description. Turn it off when the text repeats the label.' },
  { name: '#default', type: 'slot', description: 'The trigger. Its first element gets aria-describedby.' },
  { name: '#content', type: 'slot', description: 'Rich content instead of the content prop.' },
]

/* ── Dialog ───────────────────────────────────────────────────────────────── */
const inviteOpen = ref(false)
const invite = reactive({ name: '', email: '', role: 'editor' as string | number | null, billing: false })
const inviteTried = ref(false)
const inviteSent = ref('')
const roles: SelectOption[] = [
  { label: 'Admin — can change billing and members', value: 'admin' },
  { label: 'Editor — can edit projects', value: 'editor' },
  { label: 'Viewer — can read and comment', value: 'viewer' },
]
const emailError = computed(() =>
  inviteTried.value && !/^\S+@\S+\.\S+$/.test(invite.email) ? 'Enter a work email, like kim@finanzen.co.' : '',
)
function openInvite() {
  inviteTried.value = false
  inviteOpen.value = true
}
function sendInvite() {
  inviteTried.value = true
  if (emailError.value) {
    // Send people to the field that needs fixing; its error is read as the description.
    document.querySelector<HTMLInputElement>('#ov-invite input[type="email"]')?.focus()
    return
  }
  inviteSent.value = `Invite sent to ${invite.email}.`
  inviteOpen.value = false
  Object.assign(invite, { name: '', email: '', role: 'editor', billing: false })
}

const deleteOpen = ref(false)
const deleted = ref(false)
function confirmDelete() {
  deleted.value = true
  deleteOpen.value = false
}

const dialogCode = `<script setup lang="ts">
import { ref } from 'vue'
import { RButton, RDialog, RInput } from '@/design-system'

const open = ref(false)
const email = ref('')
<\/script>

<template>
  <RButton @click="open = true">Invite teammate</RButton>
  <RDialog v-model:open="open" title="Invite a teammate" description="The link works for 7 days.">
    <form id="invite" @submit.prevent="send">
      <RInput v-model="email" label="Work email" type="email" />
    </form>
    <template #footer="{ close }">
      <RButton variant="outline" @click="close">Cancel</RButton>
      <RButton type="submit" form="invite">Send invite</RButton>
    </template>
  </RDialog>
</template>`

const dialogProps: PropRow[] = [
  { name: 'v-model:open', type: 'boolean', default: 'false', description: 'Open state.' },
  { name: 'title', type: 'string', description: 'Heading, also the accessible name.' },
  { name: 'description', type: 'string', description: 'One or two sentences under the title, also read as the description.' },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: '400, 520 or 720px wide. Under 520px of screen it becomes a bottom sheet.' },
  { name: 'closable', type: 'boolean', default: 'true', description: 'Show the close button in the corner.' },
  { name: 'dismissible', type: 'boolean', default: 'true', description: 'Close on Escape and on a click outside. Turn off for flows that must be finished or cancelled.' },
  { name: 'initialFocus', type: 'string', description: 'Selector of the element to focus first. Defaults to the first field in the body.' },
  { name: '@closed', type: '() => void', description: 'Fired after the closing animation ends.' },
  { name: '#default', type: 'slot { close }', description: 'The body. It scrolls when the content is taller than the screen.' },
  { name: '#header', type: 'slot', description: 'Replaces the title and description.' },
  { name: '#footer', type: 'slot { close }', description: 'Buttons, right-aligned. Put the main action last.' },
]

/* ── Command palette ──────────────────────────────────────────────────────── */
const paletteOpen = ref(false)
const paletteResult = ref('')
const timeFormat = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' })
const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long' })
const inMinutes = (minutes: number) => timeFormat.format(new Date(Date.now() + minutes * 60_000))
const tomorrow = () => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return weekday.format(d)
}

const paletteItems = computed<CommandItem[]>(() => {
  const remind = (id: string, label: string, meta: string): CommandItem => ({
    id,
    label,
    meta,
    onSelect: () => {
      paletteResult.value = `Reminder set: ${label.toLowerCase()} (${meta}).`
    },
  })
  const go = (label: string) => () => {
    paletteResult.value = `Opened ${label}.`
  }
  return [
    {
      id: 'remind',
      label: 'Remind me',
      icon: AlarmClock,
      group: 'Actions',
      keywords: ['reminder', 'later', 'snooze'],
      placeholder: 'When should we remind you?',
      children: [
        remind('r15', 'In 15 minutes', inMinutes(15)),
        remind('r30', 'In 30 minutes', inMinutes(30)),
        remind('r60', 'In 1 hour', inMinutes(60)),
        remind('tomorrow', 'Tomorrow', `${tomorrow()}, 9:00 AM`),
        remind('next-week', 'Next week', 'Monday, 9:00 AM'),
      ],
    },
    { id: 'invite', label: 'Invite teammate', icon: UserRound, group: 'Actions', shortcut: ['mod', 'I'], onSelect: go('the invite form') },
    { id: 'search', label: 'Advanced search', icon: Search, group: 'Actions', shortcut: ['mod', 'shift', 'F'], onSelect: go('advanced search') },
    { id: 'notifications', label: 'Notifications', icon: Bell, group: 'Navigate', meta: '8 new', onSelect: go('notifications') },
    { id: 'messages', label: 'Messages', icon: Mail, group: 'Navigate', meta: '4 unread', onSelect: go('messages') },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'Navigate', onSelect: go('the dashboard') },
    { id: 'calendar', label: 'Calendar', icon: Calendar, group: 'Navigate', keywords: ['schedule', 'events'], onSelect: go('the calendar') },
  ]
})

const paletteCode = `<script setup lang="ts">
import { ref } from 'vue'
import { AlarmClock, Bell } from 'lucide-vue-next'
import { RCommandPalette } from '@/design-system'

const open = ref(false)
const items = [
  {
    id: 'remind', label: 'Remind me', icon: AlarmClock, group: 'Actions',
    children: [
      { id: 'r30', label: 'In 30 minutes', meta: '2:51 PM', onSelect: () => remind(30) },
    ],
  },
  { id: 'inbox', label: 'Notifications', icon: Bell, group: 'Navigate', meta: '8 new' },
]
<\/script>

<template>
  <!-- ⌘K / Ctrl K toggles it; pass :hotkey="null" to wire your own. -->
  <RCommandPalette v-model:open="open" :items="items" />
</template>`

const paletteProps: PropRow[] = [
  { name: 'v-model:open', type: 'boolean', default: 'false', description: 'Open state.' },
  { name: 'items', type: 'CommandItem[]', description: 'Everything you can search. Items with children open a nested page.' },
  { name: 'placeholder', type: 'string', default: "'Type an action or navigate'", description: 'Input placeholder on the first page. Nested pages can set their own.' },
  { name: 'emptyText', type: 'string', default: "'Nothing matches that. Try another word.'", description: 'Shown when nothing matches.' },
  { name: 'hotkey', type: 'string | null', default: "'mod+k'", description: 'Global shortcut that toggles the palette. null turns it off.' },
  { name: 'label', type: 'string', default: "'Command menu'", description: 'Accessible name of the dialog and the list.' },
  { name: '@select', type: '(item: CommandItem) => void', description: 'Fired when a leaf item is chosen.' },
]

const commandItemProps: PropRow[] = [
  { name: 'id', type: 'string', description: 'Unique id.' },
  { name: 'label', type: 'string', description: 'What people search for. Matched letters stay bright while typing.' },
  { name: 'icon', type: 'Component', description: 'Shown on the left.' },
  { name: 'group', type: 'string', description: 'Heading the item sits under. Groups keep the order they first appear in.' },
  { name: 'keywords', type: 'string[]', description: 'Extra words that should match, like "dark" for a theme switch.' },
  { name: 'shortcut', type: 'string[]', description: "Keys shown on the right, e.g. ['mod', 'D']." },
  { name: 'meta', type: 'string', description: 'Quiet text on the right, like "2:51 PM" or "8 new".' },
  { name: 'children', type: 'CommandItem[]', description: 'Opens a nested page. Backspace or ← on an empty input goes back.' },
  { name: 'placeholder', type: 'string', description: 'Placeholder for the nested page.' },
  { name: 'disabled', type: 'boolean', description: 'Shown dimmed, skipped by the arrow keys.' },
  { name: 'onSelect', type: '() => void | boolean', description: 'Runs when chosen. Return false to keep the palette open.' },
]

/* ── Coachmark ────────────────────────────────────────────────────────────── */
const coachSteps: { title: string; body: string; tone: Tone }[] = [
  {
    title: 'Highlight what you need',
    body: 'Give a row a colour so you can find it again at a glance. Everyone on the project sees the same highlights.',
    tone: 'violet',
  },
  {
    title: 'Work on it together',
    body: 'See who is looking at which row while you edit. Changes appear for everyone as they happen.',
    tone: 'success',
  },
  {
    title: 'Read the trend',
    body: 'Select a few columns and a small chart shows how they move week to week.',
    tone: 'sky',
  },
  {
    title: 'Keep it tidy',
    body: 'Done rows tuck themselves away after a week. You can always bring them back from the archive.',
    tone: 'warning',
  },
]
const coachStep = ref(1)
const coachVisible = ref(true)
const currentCoach = computed(() => coachSteps[coachStep.value - 1])
function coachNext() {
  if (coachStep.value < coachSteps.length) coachStep.value += 1
  else coachVisible.value = false
}
function coachRestart() {
  coachStep.value = 1
  coachVisible.value = true
}

const coachmarkCode = `<RCoachmark
  title="Highlight what you need"
  :step="1"
  :total="4"
  media-tone="violet"
  @skip="dismiss"
  @next="step++"
>
  Give a row a colour so you can find it again at a glance.
  <template #media>
    <img src="/onboarding/highlight.svg" alt="" />
  </template>
</RCoachmark>`

const coachmarkProps: PropRow[] = [
  { name: 'title', type: 'string', description: 'Short heading, also the accessible name.' },
  { name: 'step', type: 'number', description: 'Current step, starting at 1. Step 1 shows Skip, later steps show Back.' },
  { name: 'total', type: 'number', description: 'Number of steps; shows “2 of 4”. On the last step the main button says Done.' },
  { name: 'closable', type: 'boolean', default: 'true', description: 'Show the close button.' },
  { name: 'mediaTone', type: 'Tone', default: "'violet'", description: 'Colour of the illustration well.' },
  { name: 'nextLabel', type: 'string', default: "'Continue'", description: 'Main button text.' },
  { name: 'backLabel', type: 'string', default: "'Back'", description: 'Back button text.' },
  { name: 'skipLabel', type: 'string', default: "'Skip'", description: 'Skip button text on the first step.' },
  { name: 'finishLabel', type: 'string', default: "'Done'", description: 'Main button text on the last step.' },
  { name: '@close / @skip / @back / @next', type: '() => void', description: 'One event per button. The coachmark keeps no state of its own.' },
  { name: '#default', type: 'slot', description: 'The body text.' },
  { name: '#media', type: 'slot', description: 'Illustration inside the coloured well.' },
]

/* ── Tour ─────────────────────────────────────────────────────────────────── */
const tourOpen = ref(false)
const tourStep = ref(0)
const tourDone = ref('')
const tourSteps: TourStep[] = [
  {
    target: '.ov-tour-kpi',
    title: 'Your number first',
    body: 'The headline figure for the period you picked, with the change against last month next to it.',
    placement: 'bottom-start',
  },
  {
    target: '.ov-tour-filters',
    title: 'Narrow it down',
    body: 'Chips filter everything on the page. Add as many as you like and remove them one by one.',
    placement: 'bottom',
  },
  {
    target: '.ov-tour-export',
    title: 'Take it with you',
    body: 'Export what you see as CSV or PDF. Your filters come along.',
    placement: 'top-end',
  },
]
function startTour() {
  tourStep.value = 0
  tourDone.value = ''
  tourOpen.value = true
}

const tourCode = `<script setup lang="ts">
import { ref } from 'vue'
import { RButton, RTour } from '@/design-system'

const open = ref(false)
const steps = [
  { target: '#revenue', title: 'Your number first', body: 'The headline figure for the period.' },
  { target: '#filters', title: 'Narrow it down', body: 'Chips filter everything on the page.' },
]
<\/script>

<template>
  <RButton @click="open = true">Take the tour</RButton>
  <RTour v-model:open="open" :steps="steps" @finish="markSeen" />
</template>`

const tourProps: PropRow[] = [
  { name: 'v-model:open', type: 'boolean', default: 'false', description: 'Whether the tour is running.' },
  { name: 'v-model:step', type: 'number', default: '0', description: 'Current step index, starting at 0.' },
  { name: 'steps', type: 'TourStep[]', description: 'Each step has target (a CSS selector), title, body, and optionally placement and mediaTone.' },
  { name: 'padding', type: 'number', default: '8', description: 'Space between the target and the edge of the spotlight.' },
  { name: 'radius', type: 'number', default: '16', description: 'Corner radius of the spotlight.' },
  { name: '@finish', type: '() => void', description: 'The last step was confirmed.' },
  { name: '@skip', type: '() => void', description: 'Closed early with Skip, the close button or Escape.' },
  { name: '#media', type: 'slot { step, index }', description: 'Illustration for the current step.' },
]
</script>

<template>
  <DocPage
    eyebrow="Components"
    title="Overlays"
    lead="Things that float above the page: popovers, menus, tooltips, dialogs, the command palette and onboarding. They share one positioning engine, close on Escape, and give focus back to whatever opened them."
  >
    <!-- Popover ------------------------------------------------------------ -->
    <DocSection
      id="popover"
      title="Popover"
      description="A floating panel tied to a trigger, or to a point on screen. It flips when it would leave the viewport, follows the trigger while you scroll, and closes on Escape or a click outside."
    >
      <Demo title="Filter" note="Like Finanzen's project filter. Apply it and the chips below follow." stack>
        <div class="ov-filter-bar">
          <span class="ov-filter-bar__title">List project</span>
          <RPopover
            v-model:open="filterOpen"
            placement="bottom-end"
            width="340px"
            label="Filter projects"
            padding="none"
            class="ov-filter-popover"
          >
            <template #trigger>
              <RButton variant="outline">
                <template #leading><SlidersHorizontal /></template>
                Filter
                <template v-if="appliedChips.length" #trailing>
                  <RBadge tone="brand" variant="solid" size="sm">{{ appliedChips.length }}</RBadge>
                </template>
              </RButton>
            </template>
            <template #default="{ close }">
              <div class="ov-filter">
                <div class="ov-filter__head">
                  <span class="ov-filter__title">Filter</span>
                  <RIconButton label="Close filter" variant="ghost" size="sm" shape="square" @click="close"><X /></RIconButton>
                </div>
                <div class="ov-filter__body">
                  <div class="ov-filter__group">
                    <div class="ov-filter__row">
                      <span class="ov-filter__label">Select date</span>
                      <button type="button" class="ov-filter__clear" @click="(draft.from = ''), (draft.to = '')">Clear</button>
                    </div>
                    <div class="ov-filter__dates">
                      <RInput v-model="draft.from" type="date" label="From" />
                      <RInput v-model="draft.to" type="date" label="To" />
                    </div>
                  </div>
                  <div class="ov-filter__group">
                    <div class="ov-filter__row">
                      <span class="ov-filter__label">Client type</span>
                      <button type="button" class="ov-filter__clear" @click="draft.client = null">Clear</button>
                    </div>
                    <RSelect v-model="draft.client" :options="clientTypes" placeholder="Any client type" aria-label="Client type" />
                  </div>
                  <div class="ov-filter__group">
                    <div class="ov-filter__row">
                      <span class="ov-filter__label">Status</span>
                      <button type="button" class="ov-filter__clear" @click="draft.status = null">Clear</button>
                    </div>
                    <RSelect v-model="draft.status" :options="statuses" placeholder="Any status" aria-label="Status">
                      <template #leading="{ option }">
                        <span class="ov-status-dot" :class="option ? `r-tone-${option.tone}` : 'is-empty'" />
                      </template>
                    </RSelect>
                  </div>
                  <div class="ov-filter__group">
                    <div class="ov-filter__row">
                      <span class="ov-filter__label">Search by keywords</span>
                      <button type="button" class="ov-filter__clear" @click="draft.keyword = ''">Clear</button>
                    </div>
                    <RInput v-model="draft.keyword" placeholder="Search" aria-label="Keywords">
                      <template #leading><Search /></template>
                    </RInput>
                  </div>
                </div>
                <div class="ov-filter__foot">
                  <RButton variant="outline" @click="resetFilters">Reset</RButton>
                  <RButton @click="applyFilters(close)">Apply now</RButton>
                </div>
              </div>
            </template>
          </RPopover>
        </div>
        <div class="ov-filter-chips" aria-live="polite">
          <template v-if="appliedChips.length">
            <RChip
              v-for="chip in appliedChips"
              :key="chip.key"
              variant="soft"
              :tone="chip.tone ?? 'neutral'"
              removable
              :remove-label="`Remove ${chip.label}`"
              @remove="removeChip(chip.key)"
            >
              {{ chip.label }}
            </RChip>
          </template>
          <span v-else class="ov-muted">No filters yet. Open Filter and press Apply now.</span>
        </div>
      </Demo>

      <Demo title="Placement" note="Each one flips to the other side when it would leave the screen." center>
        <RPopover v-for="p in placements" :key="p" :placement="p" width="220px" :label="`Opens ${p}`">
          <template #trigger>
            <RButton variant="outline" size="sm">{{ p }}</RButton>
          </template>
          <p class="ov-small">Opens <strong>{{ p }}</strong>. Press Escape or click outside to close.</p>
        </RPopover>
      </Demo>

      <CodeBlock :code="popoverCode" />
      <PropsTable :rows="popoverProps" caption="RPopover props" />
      <DoDont
        do="Use a popover for small, related choices people make without leaving the page, like filters or a share link."
        dont="Don't put a long form or a second popover inside one. When it needs scrolling, it wants to be a dialog."
      />
    </DocSection>

    <!-- Menu --------------------------------------------------------------- -->
    <DocSection
      id="menu"
      title="Menu"
      description="A list of actions inside a popover. Arrow keys move, Enter chooses, ArrowRight opens a submenu and ArrowLeft comes back, and typing a letter jumps to the item that starts with it."
    >
      <div class="doc-grid doc-grid--2">
        <Demo title="Row actions" note="The “…” button on a table row." center>
          <div class="ov-row">
            <span class="ov-row__name">Travearth</span>
            <RBadge tone="warning" dot size="sm">Pending</RBadge>
            <RPopover v-model:open="moreOpen" kind="menu" placement="bottom-end">
              <template #trigger>
                <RIconButton label="More actions for Travearth" variant="ghost" size="sm"><MoreHorizontal /></RIconButton>
              </template>
              <RMenu :items="rowActions" label="Project actions" @select="(item) => (lastAction = item.label ?? '')" @close="moreOpen = false" />
            </RPopover>
          </div>
          <p class="ov-result" aria-live="polite">{{ lastAction ? `You chose “${lastAction}”.` : '' }}</p>
        </Demo>

        <Demo title="Checkable items" note="They stay open so you can flip several." center>
          <RPopover v-model:open="viewOpen" kind="menu" placement="bottom-start">
            <template #trigger>
              <RButton variant="outline" size="sm">
                View
                <template #trailing><SlidersHorizontal /></template>
              </RButton>
            </template>
            <RMenu :items="viewItems" label="View options" @close="viewOpen = false" />
          </RPopover>
          <p class="ov-result">
            Weekends {{ view.weekends ? 'on' : 'off' }} · declined {{ view.declined ? 'shown' : 'hidden' }} · rows
            {{ view.compact ? 'compact' : 'comfortable' }}
          </p>
        </Demo>
      </div>

      <Demo title="Context menu" note="Right-click the event, or focus it and press Shift F10. Colour dots live in the header slot." stack>
        <div class="ov-calendar">
          <div class="ov-calendar__times" aria-hidden="true">
            <span>08:00</span>
            <span>09:00</span>
            <span>10:00</span>
          </div>
          <div class="ov-calendar__column">
            <div
              class="ov-event"
              tabindex="0"
              role="button"
              aria-haspopup="menu"
              :aria-label="`Weekly meeting, ${eventWhen}. Press Shift F10 for options.`"
              :style="{ background: `var(--r-identity-${eventColor})`, color: `var(--r-identity-${eventColor}-text)`, '--r-avatar-ring': `var(--r-identity-${eventColor})` }"
              @contextmenu.prevent="openContextAt"
              @keydown="onEventKeydown"
            >
              <span class="ov-event__title"><Calendar /> Weekly meeting</span>
              <span class="ov-event__time">{{ eventWhen }}</span>
              <RAvatarGroup :names="['Anastasia William', 'Kim Ji-soo', 'Agus Pratama', 'Nurul Huda', 'Tony Stark']" :max="3" size="xs" />
            </div>
          </div>
        </div>
        <p class="ov-result" aria-live="polite">{{ contextResult }}</p>
        <RPopover v-model:open="contextOpen" kind="menu" :point="contextPoint" placement="bottom-start" :offset="2">
          <RMenu
            :items="contextItems"
            :initial-focus="contextFocus"
            label="Event options"
            @select="onContextSelect"
            @close="contextOpen = false"
          >
            <template #header>
              <div class="ov-dots" role="radiogroup" aria-label="Event colour" @keydown="onDotsKeydown">
                <button
                  v-for="(color, i) in eventColors"
                  :key="color.index"
                  :ref="(el) => (dotEls[i] = el as HTMLButtonElement | null)"
                  type="button"
                  role="radio"
                  class="ov-dots__dot"
                  :aria-checked="eventColor === color.index"
                  :aria-label="color.name"
                  :tabindex="eventColor === color.index ? 0 : -1"
                  :style="{ '--dot': `var(--r-identity-${color.index})`, '--dot-ink': `var(--r-identity-${color.index}-text)` }"
                  @click="eventColor = color.index"
                />
              </div>
            </template>
          </RMenu>
        </RPopover>
      </Demo>

      <CodeBlock :code="menuCode" />
      <PropsTable :rows="menuProps" caption="RMenu props" />
      <h3 class="doc-h4">MenuItem fields</h3>
      <PropsTable :rows="menuItemProps" caption="MenuItem fields" />
      <DoDont
        do="Put the destructive item last, behind a divider, and keep the most common action first."
        dont="Don't nest submenus inside submenus. If one level isn't enough, the choice deserves a dialog."
      />
    </DocSection>

    <!-- Tooltip ------------------------------------------------------------ -->
    <DocSection
      id="tooltip"
      title="Tooltip"
      description="A short label on hover or keyboard focus. Icon buttons get one for their name and shortcut; anything that explains a number gets one for the explanation."
    >
      <div class="doc-grid doc-grid--2">
        <Demo title="With shortcuts" note="Hover or Tab through the buttons." center>
          <div class="ov-toolbar" role="group" aria-label="Event actions">
            <RTooltip v-for="action in toolbar" :key="action.label" :content="action.label" :shortcut="action.keys" :describe="false">
              <RIconButton :label="action.label" variant="ghost" shape="square" :aria-keyshortcuts="action.aria">
                <component :is="action.icon" />
              </RIconButton>
            </RTooltip>
          </div>
        </Demo>

        <Demo title="Explaining a number" center>
          <div class="ov-metric">
            <div class="ov-metric__label">
              Net revenue
              <RTooltip content="Revenue after refunds, payment fees and tax. Updated every hour.">
                <button type="button" class="ov-info" aria-label="About net revenue"><Info /></button>
              </RTooltip>
            </div>
            <RStat :value="18420" prefix="$" size="md" :trend="4.2" trend-label="vs last week" />
          </div>
        </Demo>
      </div>

      <Demo title="Placement" center>
        <RTooltip v-for="p in tooltipPlacements" :key="p" :content="`Tooltip on the ${p}`" :placement="p" :describe="false">
          <RButton variant="outline" size="sm">{{ p }}</RButton>
        </RTooltip>
      </Demo>

      <CodeBlock :code="tooltipCode" />
      <PropsTable :rows="tooltipProps" caption="RTooltip props" />
      <DoDont
        do="Keep it to a few words, and repeat the shortcut there so people learn it."
        dont="Don't hide anything people need to finish a task in a tooltip. Touch screens never see it."
      />
    </DocSection>

    <!-- Dialog ------------------------------------------------------------- -->
    <DocSection
      id="dialog"
      title="Dialog"
      description="A modal for one focused task. Focus moves to the first field and stays inside until it closes, the page behind stops scrolling, and Escape or the backdrop closes it unless you turn that off."
    >
      <Demo title="Form and confirmation" center>
        <RButton @click="openInvite">
          <template #leading><UserRound /></template>
          Invite teammate
        </RButton>
        <RButton tone="danger" variant="soft" :disabled="deleted" @click="deleteOpen = true">
          <template #leading><Trash2 /></template>
          {{ deleted ? 'Project deleted' : 'Delete project' }}
        </RButton>
        <RButton v-if="deleted" variant="ghost" size="sm" @click="deleted = false">Undo</RButton>
        <p class="ov-result ov-result--full" aria-live="polite">{{ inviteSent }}</p>
      </Demo>

      <RDialog v-model:open="inviteOpen" title="Invite a teammate" description="They get an email with a link that works for 7 days.">
        <form id="ov-invite" class="ov-form" novalidate @submit.prevent="sendInvite">
          <RInput v-model="invite.name" label="Full name" placeholder="Kim Ji-soo" autocomplete="name" />
          <RInput
            v-model="invite.email"
            label="Work email"
            type="email"
            placeholder="kim@finanzen.co"
            autocomplete="email"
            :error="emailError"
          />
          <RSelect v-model="invite.role" label="Role" :options="roles" />
          <RSwitch v-model="invite.billing" label="Can see billing" description="Invoices, payment methods and plan changes." />
        </form>
        <template #footer="{ close }">
          <RButton variant="outline" @click="close">Cancel</RButton>
          <RButton type="submit" form="ov-invite">Send invite</RButton>
        </template>
      </RDialog>

      <RDialog
        v-model:open="deleteOpen"
        size="sm"
        title="Delete “Travearth”?"
        description="The project, its 24 tasks and all files go to the bin. You can restore them for 30 days."
        initial-focus=".ov-keep"
      >
        <template #footer="{ close }">
          <RButton variant="outline" class="ov-keep" @click="close">Keep it</RButton>
          <RButton tone="danger" @click="confirmDelete">Delete project</RButton>
        </template>
      </RDialog>

      <CodeBlock :code="dialogCode" />
      <PropsTable :rows="dialogProps" caption="RDialog props" />
      <DoDont
        do="Name the main button after what it does (“Send invite”, “Delete project”), and focus the safe choice in a destructive confirmation."
        dont="Don't open a dialog from a dialog. Finish or close the first one, or turn the flow into a page."
      />
    </DocSection>

    <!-- Command palette ---------------------------------------------------- -->
    <DocSection
      id="command-palette"
      title="Command palette"
      description="Search across everything you can do. It is always a dark island, like the Untitled UI reference, so it reads the same on any page. Items can open a nested page; Backspace or ← on an empty input goes back."
    >
      <Demo title="With a nested page" note="Try “remind”, pick Remind me, then press Backspace." stack>
        <button type="button" class="ov-palette-trigger" @click="paletteOpen = true">
          <Search />
          <span>Type an action or navigate</span>
        </button>
        <p class="ov-result" aria-live="polite">{{ paletteResult }}</p>
      </Demo>
      <RCommandPalette v-model:open="paletteOpen" :items="paletteItems" :hotkey="null" label="Demo command menu" />

      <p class="doc-p">
        This site has its own palette on <code class="doc-c">⌘K</code>, so the demo above opens a second one with
        <code class="doc-c">:hotkey="null"</code>.
      </p>
      <CodeBlock :code="paletteCode" />
      <PropsTable :rows="paletteProps" caption="RCommandPalette props" />
      <h3 class="doc-h4">CommandItem fields</h3>
      <PropsTable :rows="commandItemProps" caption="CommandItem fields" />
      <DoDont
        do="Write labels as verbs or places (“Invite teammate”, “Calendar”) and add keywords for the words people actually type."
        dont="Don't make the palette the only way to reach something. It is a shortcut, not the map."
      />
    </DocSection>

    <!-- Coachmark ---------------------------------------------------------- -->
    <DocSection
      id="coachmark"
      title="Coachmark"
      description="An onboarding card with a title, a short explanation, an illustration and step controls. It holds no state; you decide what Continue and Back mean."
    >
      <div class="ov-coach-grid">
        <Demo title="Four steps" note="Skip, Back, Continue and Done all work." center>
          <RCoachmark
            v-if="coachVisible"
            :title="currentCoach.title"
            :step="coachStep"
            :total="coachSteps.length"
            :media-tone="currentCoach.tone"
            @close="coachVisible = false"
            @skip="coachVisible = false"
            @back="coachStep -= 1"
            @next="coachNext"
          >
            {{ currentCoach.body }}
            <template #media>
              <div class="ov-art" aria-hidden="true">
                <div v-if="coachStep === 1" class="ov-art__screen">
                  <span class="ov-art__bar" style="width: 46%" />
                  <span class="ov-art__bar" style="width: 28%" />
                  <span class="ov-art__bar ov-art__bar--lit" style="width: 58%" />
                  <span class="ov-art__bar" style="width: 34%" />
                  <div class="ov-art__people">
                    <span v-for="n in 8" :key="n" :style="{ background: `var(--r-identity-${n})`, color: `var(--r-identity-${n}-text)` }">A</span>
                  </div>
                </div>
                <div v-else-if="coachStep === 2" class="ov-art__screen ov-art__screen--rows">
                  <div v-for="n in [6, 7, 8]" :key="n" class="ov-art__line" :class="{ 'is-lit': n === 7 }">
                    <span class="ov-art__num">{{ n }}</span>
                    <span class="ov-art__bar" :style="{ width: n === 7 ? '64%' : '70%' }" />
                    <template v-if="n === 7">
                      <span class="ov-art__cursor" />
                      <span class="ov-art__name">Mike</span>
                      <span class="ov-art__badge">A</span>
                    </template>
                  </div>
                </div>
                <div v-else-if="coachStep === 3" class="ov-art__screen ov-art__screen--chart">
                  <span class="ov-art__caption">Usage</span>
                  <div class="ov-art__columns">
                    <span v-for="(h, i) in [38, 54, 46, 70, 62, 84, 76]" :key="i" :style="{ height: `${h}%` }" :class="{ 'is-lit': i === 5 }" />
                  </div>
                </div>
                <div v-else class="ov-art__screen ov-art__screen--checks">
                  <div v-for="(row, i) in ['Wireframes', 'Prototype', 'Handoff']" :key="row" class="ov-art__check" :class="{ 'is-done': i < 2 }">
                    <span class="ov-art__box" />
                    {{ row }}
                  </div>
                </div>
              </div>
            </template>
          </RCoachmark>
          <RButton v-else variant="outline" @click="coachRestart">Show the coachmark again</RButton>
        </Demo>

        <Demo title="On a dark surface" note="Same component inside data-theme=&quot;dark&quot;." center surface="plain">
          <div class="ov-dark-island" data-theme="dark">
            <RCoachmark title="Cooperation is the key" :step="2" :total="4" media-tone="success">
              Request support from your team and ship faster.
              <template #media>
                <div class="ov-art" aria-hidden="true">
                  <div class="ov-art__screen ov-art__screen--rows">
                    <div v-for="n in [6, 7, 8]" :key="n" class="ov-art__line" :class="{ 'is-lit': n === 7 }">
                      <span class="ov-art__num">{{ n }}</span>
                      <span class="ov-art__bar" style="width: 66%" />
                    </div>
                  </div>
                </div>
              </template>
            </RCoachmark>
          </div>
        </Demo>
      </div>

      <CodeBlock :code="coachmarkCode" />
      <PropsTable :rows="coachmarkProps" caption="RCoachmark props" />
      <DoDont
        do="Keep onboarding to three or four steps, each about one thing people can try right away."
        dont="Don't block the first visit with a long tour. Offer it, and let people skip."
      />
    </DocSection>

    <!-- Tour --------------------------------------------------------------- -->
    <DocSection
      id="tour"
      title="Tour"
      description="Coachmarks pointed at real parts of the page. The tour dims everything else, cuts a soft spotlight around the target, scrolls it into view and places the card next to it."
    >
      <Demo title="A three-step tour" stack>
        <div class="ov-tour-board">
          <RCard class="ov-tour-kpi">
            <RStat label="Revenue this month" :value="25912" prefix="$" :trend="1.9" trend-label="than last month" />
          </RCard>
          <RCard class="ov-tour-side">
            <div class="ov-tour-filters doc-row">
              <RChip variant="solid" tone="violet" caret>Pending</RChip>
              <RChip caret>Tag</RChip>
              <RChip variant="dashed">Add filter</RChip>
            </div>
            <div class="ov-tour-actions">
              <RButton class="ov-tour-export" variant="outline">
                <template #leading><Download /></template>
                Export
              </RButton>
            </div>
          </RCard>
        </div>
        <div class="doc-row">
          <RButton @click="startTour">Start the tour</RButton>
          <span class="ov-result" aria-live="polite">{{ tourDone }}</span>
        </div>
      </Demo>
      <RTour
        v-model:open="tourOpen"
        v-model:step="tourStep"
        :steps="tourSteps"
        @finish="tourDone = 'Tour finished. Nice.'"
        @skip="tourDone = 'Tour skipped.'"
      />

      <CodeBlock :code="tourCode" />
      <PropsTable :rows="tourProps" caption="RTour props" />
      <DoDont
        do="Point at things people can use right now, and say what they get from them."
        dont="Don't tour every button. If a screen needs ten steps to explain, the screen needs work."
      />
    </DocSection>
  </DocPage>
</template>

<style>
.ov-muted,
.ov-small,
.ov-result {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-sm);
}

.ov-small {
  color: var(--r-text-secondary);
  line-height: 1.5;
}

.ov-result {
  min-height: 20px;
}
.ov-result--full {
  flex-basis: 100%;
  text-align: center;
}

/* Filter popover */
.ov-filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px 14px 20px;
  border: 1px solid var(--r-border-subtle);
  border-radius: var(--r-radius-xl);
  background: var(--r-bg-surface);
  box-shadow: var(--r-shadow-xs);
}

.ov-filter-bar__title {
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-semibold);
}

.ov-filter-chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-height: 32px;
}

/* Header and footer stay put; the fields scroll when the screen is short. */
.ov-filter-popover {
  overflow: hidden;
}

.ov-filter {
  display: flex;
  flex-direction: column;
  max-height: inherit;
}

.ov-filter__body {
  flex: 1;
  min-height: 0;
  padding-bottom: 2px;
  overflow-y: auto;
}

.ov-filter__head {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  padding: 10px 10px 10px 16px;
  border-bottom: 1px solid var(--r-border-subtle);
  background: var(--r-bg-muted);
  border-radius: var(--r-radius-lg) var(--r-radius-lg) 0 0;
}

.ov-filter__title {
  font-weight: var(--r-weight-semibold);
}

.ov-filter__group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px 0;
}

.ov-filter__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ov-filter__label {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-sm);
}

.ov-filter__clear {
  padding: 2px 4px;
  border: 0;
  border-radius: 6px;
  background: none;
  color: var(--r-brand-text);
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
  cursor: pointer;
}
.ov-filter__clear:hover {
  background: var(--r-brand-soft);
}

.ov-filter__dates {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.ov-filter__dates .r-field__label {
  color: var(--r-text);
  font-size: var(--r-text-sm);
}

.ov-filter__foot {
  display: flex;
  flex-shrink: 0;
  justify-content: space-between;
  gap: 8px;
  margin-top: 16px;
  padding: 14px 16px;
  border-top: 1px solid var(--r-border-subtle);
}

.ov-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--tone-solid);
}
.ov-status-dot.is-empty {
  border: 1.5px solid var(--r-border-strong);
  background: transparent;
}

/* Row actions */
.ov-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: min(100%, 360px);
  padding: 8px 8px 8px 16px;
  border: 1px solid var(--r-border-subtle);
  border-radius: var(--r-radius-lg);
  background: var(--r-bg-surface);
}
.ov-row__name {
  flex: 1;
  font-weight: var(--r-weight-medium);
}

/* Context menu */
.ov-calendar {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr);
  border: 1px solid var(--r-border-subtle);
  border-radius: var(--r-radius-xl);
  background: var(--r-bg-surface);
  overflow: hidden;
}

.ov-calendar__times {
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--r-border-subtle);
}
.ov-calendar__times span {
  height: 64px;
  padding: 6px 8px 0 0;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.ov-calendar__column {
  position: relative;
  min-height: 192px;
  padding: 10px 12px;
  background-image: linear-gradient(var(--r-border-subtle) 1px, transparent 1px);
  background-size: 100% 64px;
}

.ov-event {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: min(100%, 300px);
  margin-top: 4px;
  padding: 10px 12px 12px;
  border-radius: var(--r-radius-md);
  cursor: context-menu;
  transition: background-color var(--r-duration-base) var(--r-ease-out);
}

.ov-event__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-semibold);
}
.ov-event__title svg {
  width: 14px;
  height: 14px;
}

.ov-event__time {
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
}

.ov-dots {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.ov-dots__dot {
  width: 20px;
  height: 20px;
  padding: 0;
  border: 1.5px solid color-mix(in srgb, var(--dot-ink) 28%, transparent);
  border-radius: 50%;
  background: var(--dot);
  cursor: pointer;
  transition: box-shadow var(--r-duration-fast) var(--r-ease-out);
}
.ov-dots__dot[aria-checked='true'] {
  border-color: var(--dot-ink);
  box-shadow:
    0 0 0 2px var(--r-bg-raised),
    0 0 0 3.5px var(--dot-ink);
}

/* Tooltip */
.ov-toolbar {
  display: inline-flex;
  gap: 2px;
  padding: 4px;
  border: 1px solid var(--r-border-subtle);
  border-radius: var(--r-radius-lg);
  background: var(--r-bg-surface);
  box-shadow: var(--r-shadow-xs);
}

.ov-metric {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: min(100%, 280px);
  padding: 18px 20px;
  border: 1px solid var(--r-border-subtle);
  border-radius: var(--r-radius-xl);
  background: var(--r-bg-surface);
}

.ov-metric__label {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
}

.ov-info {
  display: inline-grid;
  place-items: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: none;
  color: var(--r-text-tertiary);
  cursor: help;
}
.ov-info:hover {
  background: var(--r-bg-hover);
  color: var(--r-text);
}
.ov-info svg {
  width: 15px;
  height: 15px;
}

/* Dialog form */
.ov-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Command palette trigger */
.ov-palette-trigger {
  display: flex;
  align-items: center;
  gap: 12px;
  width: min(100%, 520px);
  height: 52px;
  margin: 0 auto;
  padding: 0 18px;
  border: 1px solid var(--r-border);
  border-radius: var(--r-radius-lg);
  background: var(--r-bg-surface);
  box-shadow: var(--r-shadow-sm);
  color: var(--r-text-tertiary);
  font-size: var(--r-text-md);
  cursor: pointer;
}
.ov-palette-trigger:hover {
  border-color: var(--r-border-strong);
}
.ov-palette-trigger svg {
  width: 18px;
  height: 18px;
}
.ov-palette-trigger + .ov-result {
  text-align: center;
}

/* Coachmark illustrations: small dark product screens on a pastel well */
.ov-coach-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(420px, 100%), 1fr));
  gap: 16px;
}

.ov-dark-island {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  place-items: center;
  width: 100%;
  padding: 28px 16px;
  border-radius: var(--r-radius-lg);
  background: var(--r-bg-canvas);
}

.ov-art {
  position: absolute;
  inset: 0;
  padding: 26px 0 0 30px;
}

.ov-art__screen {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  padding: 18px 18px 0;
  border-radius: 14px 0 0 0;
  background: #17181b;
  color: #e9eaee;
  font-size: 12px;
}

.ov-art__bar {
  display: block;
  height: 14px;
  border-radius: 999px;
  background: #2c2e33;
}
.ov-art__bar--lit {
  background: color-mix(in srgb, var(--tone-solid) 55%, #ffffff);
}

.ov-art__people {
  display: flex;
  gap: 6px;
  align-self: flex-start;
  margin-top: 4px;
  padding: 7px 9px;
  border: 1px solid #2c2e33;
  border-radius: 999px;
  background: #0f1012;
}
.ov-art__people span {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  font-size: 10px;
  font-weight: 600;
}

.ov-art__screen--rows {
  gap: 0;
  padding-top: 6px;
}
.ov-art__line {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  height: 40px;
  border-bottom: 1px solid #2a2c31;
}
.ov-art__line.is-lit .ov-art__bar {
  outline: 2px solid color-mix(in srgb, var(--tone-solid) 70%, #ffffff);
  outline-offset: 6px;
}
.ov-art__num {
  width: 10px;
  color: #8a8f99;
}
.ov-art__cursor {
  position: absolute;
  top: 18px;
  left: 44px;
  width: 0;
  height: 0;
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
  border-left: 13px solid #e7a4f1;
  transform: rotate(-35deg);
}
.ov-art__name {
  position: absolute;
  top: 28px;
  left: 54px;
  padding: 1px 6px;
  border-radius: 999px;
  background: #e7a4f1;
  color: #3b1243;
  font-size: 10px;
  font-weight: 600;
}
.ov-art__badge {
  position: absolute;
  top: 2px;
  right: 18px;
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--tone-solid) 70%, #ffffff);
  color: #0d2b16;
  font-size: 10px;
  font-weight: 600;
}

.ov-art__caption {
  font-size: 12px;
  font-weight: 600;
}
.ov-art__columns {
  display: flex;
  flex: 1;
  align-items: flex-end;
  gap: 8px;
  padding-bottom: 0;
}
.ov-art__columns span {
  flex: 1;
  border-radius: 6px 6px 0 0;
  background: #2c2e33;
}
.ov-art__columns span.is-lit {
  background: color-mix(in srgb, var(--tone-solid) 60%, #ffffff);
}

.ov-art__screen--checks {
  gap: 12px;
}
.ov-art__check {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #c9ccd3;
}
.ov-art__check.is-done {
  color: #6f747e;
  text-decoration: line-through;
}
.ov-art__box {
  width: 16px;
  height: 16px;
  border: 1.5px solid #4a4e57;
  border-radius: 5px;
}
.ov-art__check.is-done .ov-art__box {
  border-color: transparent;
  background: color-mix(in srgb, var(--tone-solid) 70%, #ffffff);
}

/* Tour */
.ov-tour-board {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
  gap: 16px;
}

.ov-tour-side {
  justify-content: space-between;
}

.ov-tour-actions {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 720px) {
  .ov-tour-board {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
