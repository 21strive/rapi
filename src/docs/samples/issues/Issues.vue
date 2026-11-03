<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Copy,
  FolderKanban,
  Inbox,
  Layers,
  Plus,
  RefreshCcw,
  Search,
  UserRound,
  CircleDot,
  Contrast,
  SignalHigh,
} from 'lucide-vue-next'
import {
  RAvatar,
  RBadge,
  RButton,
  RCommandPalette,
  RDialog,
  REmpty,
  RInput,
  RKbd,
  RMeter,
  RNavItem,
  RSegmented,
  RSelect,
  RTextarea,
  useToast,
  type CommandItem,
} from '@/design-system'
import SampleShell from '../_kit/SampleShell.vue'
import IssueDetail from './parts/IssueDetail.vue'
import PriorityMark from './parts/PriorityMark.vue'
import StatusIcon from './parts/StatusIcon.vue'
import {
  CYCLE,
  ME,
  initialIssues,
  labelTone,
  nextIssueNumber,
  people,
  priorities,
  priorityLabel,
  statusLabel,
  statuses,
  type Issue,
  type PriorityId,
  type StatusId,
} from './data'

const { show } = useToast()

const issues = ref<Issue[]>(initialIssues.map((i) => ({ ...i, activity: [...i.activity] })))
const view = ref<'all' | 'mine'>('all')
const query = ref('')
const collapsed = ref<StatusId[]>(['done'])

/* ── Grouping ────────────────────────────────────────────────────────────── */
const rank = (p: PriorityId) => (p === 0 ? 9 : p)
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return issues.value.filter((i) => {
    if (view.value === 'mine' && i.assignee !== ME) return false
    if (!q) return true
    return `${i.id} ${i.title} ${i.labels.join(' ')} ${i.assignee ?? ''}`.toLowerCase().includes(q)
  })
})
const groups = computed(() =>
  statuses.map((s) => {
    const list = filtered.value
      .filter((i) => i.status === s.id)
      .sort((a, b) => rank(a.priority) - rank(b.priority) || b.id.localeCompare(a.id))
    return { ...s, issues: list, points: list.reduce((sum, i) => sum + (i.estimate ?? 0), 0), open: !collapsed.value.includes(s.id) }
  }),
)
/** The rows j and k walk through: visible groups only. */
const flat = computed(() => groups.value.flatMap((g) => (g.open ? g.issues : [])))
const totals = computed(() => ({
  count: filtered.value.length,
  points: filtered.value.reduce((sum, i) => sum + (i.estimate ?? 0), 0),
}))

function toggleGroup(id: StatusId) {
  collapsed.value = collapsed.value.includes(id) ? collapsed.value.filter((x) => x !== id) : [...collapsed.value, id]
}

/* ── Selection and the detail pane ──────────────────────────────────────── */
const selectedId = ref('STR-1204')
const openId = ref<string | null>('STR-1204')
const openIssue = computed(() => issues.value.find((i) => i.id === openId.value) ?? null)

const wide = ref(true)
let media: MediaQueryList | undefined
const onMedia = () => (wide.value = !!media?.matches)
const drawerOpen = computed({
  get: () => !wide.value && !!openId.value,
  set: (v) => {
    if (!v) openId.value = null
  },
})

function scrollToRow(id: string) {
  nextTick(() => document.getElementById(`s-issues-row-${id}`)?.scrollIntoView({ block: 'nearest' }))
}

function move(step: 1 | -1) {
  const list = flat.value
  if (!list.length) return
  const at = list.findIndex((i) => i.id === selectedId.value)
  const next = list[Math.min(list.length - 1, Math.max(0, at < 0 ? 0 : at + step))]
  selectedId.value = next.id
  if (wide.value && openId.value) openId.value = next.id
  scrollToRow(next.id)
}

function open(issue: Issue) {
  selectedId.value = issue.id
  openId.value = issue.id
  if (collapsed.value.includes(issue.status)) toggleGroup(issue.status)
  scrollToRow(issue.id)
}

/* ── Changes, each one written to the activity ──────────────────────────── */
function update(id: string, patch: Partial<Issue>, entry: { title: string; body?: string; tone?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger' }) {
  issues.value = issues.value.map((i) =>
    i.id === id ? { ...i, ...patch, updated: 'Just now', activity: [...i.activity, { id: `${id}-${Date.now()}`, time: 'Just now', meta: ME, ...entry }] } : i,
  )
}

function setStatus(issue: Issue, status: StatusId) {
  if (issue.status === status) return
  update(issue.id, { status }, { title: `Moved from ${statusLabel(issue.status)} to ${statusLabel(status)}`, tone: status === 'done' ? 'success' : 'brand' })
  if (collapsed.value.includes(status)) toggleGroup(status)
  show({ title: `${issue.id} moved to ${statusLabel(status)}`, body: issue.title, tone: status === 'done' ? 'success' : 'neutral', duration: 3200 })
  scrollToRow(issue.id)
}
function setPriority(issue: Issue, priority: PriorityId) {
  if (issue.priority === priority) return
  update(issue.id, { priority }, { title: `Priority set to ${priorityLabel(priority)}`, tone: priority === 1 ? 'danger' : priority === 2 ? 'warning' : 'neutral' })
}
function setAssignee(issue: Issue, assignee: string | null) {
  if (issue.assignee === assignee) return
  update(issue.id, { assignee }, { title: assignee ? `Assigned to ${assignee}` : 'Unassigned' })
}
function setEstimate(issue: Issue, estimate: number | null) {
  if (issue.estimate === estimate) return
  update(issue.id, { estimate }, { title: estimate ? `Estimate set to ${estimate} ${estimate === 1 ? 'point' : 'points'}` : 'Estimate removed' })
}
function comment(issue: Issue, text: string) {
  update(issue.id, {}, { title: 'Comment', body: text })
  show({ title: 'Comment added', body: `${issue.id} · ${text.length > 60 ? `${text.slice(0, 60)}…` : text}`, tone: 'success', duration: 2600 })
}

/* ── New issue ───────────────────────────────────────────────────────────── */
const composerOpen = ref(false)
let nextNumber = nextIssueNumber
const blankDraft = () => ({ title: '', description: '', status: 'todo' as StatusId, priority: 3 as PriorityId, assignee: ME as string })
const draft = ref(blankDraft())
const draftError = ref('')
const statusOptions = statuses.map((s) => ({ label: s.label, value: s.id }))
const priorityOptions = priorities.map((p) => ({ label: p.label, value: p.id }))
const assigneeOptions = [{ label: 'Unassigned', value: '' }, ...people.map((p) => ({ label: p, value: p }))]

function openComposer() {
  draft.value = blankDraft()
  draftError.value = ''
  composerOpen.value = true
}

function create(close: () => void) {
  const title = draft.value.title.trim()
  if (!title) {
    draftError.value = 'Give the issue a title.'
    return
  }
  const id = `STR-${nextNumber++}`
  const issue: Issue = {
    id,
    title,
    status: draft.value.status,
    priority: draft.value.priority,
    assignee: draft.value.assignee || null,
    labels: [],
    estimate: null,
    updated: 'Just now',
    project: 'Platform',
    description: draft.value.description.trim() ? [draft.value.description.trim()] : ['No description yet.'],
    activity: [{ id: `${id}-1`, time: 'Just now', title: `${ME} opened the issue`, meta: ME }],
  }
  issues.value = [issue, ...issues.value]
  close()
  open(issue)
  show({ title: `${id} created`, body: `${title} · ${statusLabel(issue.status)}`, tone: 'success' })
}

/* ── Command palette (⌘K) ────────────────────────────────────────────────── */
const paletteOpen = ref(false)
const target = computed(() => issues.value.find((i) => i.id === (openId.value ?? selectedId.value)) ?? flat.value[0])

const commands = computed<CommandItem[]>(() => {
  const t = target.value
  const list: CommandItem[] = [{ id: 'new', label: 'Create new issue', icon: Plus, group: 'Create', shortcut: ['C'], onSelect: openComposer }]
  if (t) {
    list.push(
      {
        id: 'status',
        label: `Change status of ${t.id}`,
        icon: Contrast,
        group: `${t.id} · ${t.title}`,
        placeholder: 'Set status',
        children: statuses.map((s) => ({ id: `status-${s.id}`, label: s.label, meta: s.id === t.status ? 'Current' : undefined, onSelect: () => setStatus(t, s.id) })),
      },
      {
        id: 'priority',
        label: 'Set priority',
        icon: SignalHigh,
        group: `${t.id} · ${t.title}`,
        placeholder: 'Set priority',
        children: priorities.map((p) => ({ id: `priority-${p.id}`, label: p.label, meta: p.id === t.priority ? 'Current' : undefined, onSelect: () => setPriority(t, p.id) })),
      },
      {
        id: 'assign',
        label: 'Assign to…',
        icon: UserRound,
        group: `${t.id} · ${t.title}`,
        placeholder: 'Assign to',
        children: people.map((p) => ({ id: `assign-${p}`, label: p, meta: p === t.assignee ? 'Current' : undefined, onSelect: () => setAssignee(t, p) })),
      },
      { id: 'me', label: 'Assign to me', icon: UserRound, group: `${t.id} · ${t.title}`, keywords: ['self', 'take'], onSelect: () => setAssignee(t, ME) },
      { id: 'copy', label: `Copy ${t.id}`, icon: Copy, group: `${t.id} · ${t.title}`, onSelect: () => void copyId(t) },
    )
  }
  list.push(
    { id: 'mine', label: 'Show my issues', icon: UserRound, group: 'View', onSelect: () => void (view.value = 'mine') },
    { id: 'all', label: 'Show all issues', icon: Layers, group: 'View', onSelect: () => void (view.value = 'all') },
    {
      id: 'done',
      label: collapsed.value.includes('done') ? 'Show done issues' : 'Hide done issues',
      icon: CircleDot,
      group: 'View',
      onSelect: () => toggleGroup('done'),
    },
    ...issues.value.map((i) => ({ id: `open-${i.id}`, label: `${i.id} ${i.title}`, icon: ArrowRight, group: 'Open issue', meta: statusLabel(i.status), onSelect: () => open(i) })),
  )
  return list
})

async function copyId(issue: Issue) {
  try {
    await navigator.clipboard?.writeText(issue.id)
  } catch {
    /* clipboard blocked */
  }
  show({ title: `${issue.id} copied`, tone: 'success', duration: 2200 })
}

/* ── Keyboard: j / k move, Enter opens, Esc closes, C creates, ⌘K commands ─ */
function editable(target: EventTarget | null) {
  const el = target as HTMLElement | null
  return !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))
}

function onKeydown(event: KeyboardEvent) {
  // This screen owns ⌘K: stop it here so the docs palette does not open as well.
  if ((event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    event.stopPropagation()
    paletteOpen.value = !paletteOpen.value
    return
  }
  if (paletteOpen.value || composerOpen.value || drawerOpen.value) return
  if (event.metaKey || event.ctrlKey || event.altKey || editable(event.target)) return
  if (document.querySelector('.r-popover, .r-dialog')) return
  const inList = !!(event.target as HTMLElement | null)?.closest?.('.s-issues__list')
  switch (event.key) {
    case 'j':
      move(1)
      break
    case 'k':
      move(-1)
      break
    case 'ArrowDown':
      if (!inList) return
      move(1)
      break
    case 'ArrowUp':
      if (!inList) return
      move(-1)
      break
    case 'Enter': {
      const issue = issues.value.find((i) => i.id === selectedId.value)
      if (!issue || (event.target as HTMLElement | null)?.tagName === 'BUTTON') return
      open(issue)
      break
    }
    case 'Escape':
      if (!openId.value) return
      openId.value = null
      break
    case 'c':
      openComposer()
      break
    default:
      return
  }
  event.preventDefault()
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown, { capture: true })
  media = window.matchMedia('(min-width: 1100px)')
  onMedia()
  media.addEventListener('change', onMedia)
  // On a phone the screen opens on the list, not on an issue.
  if (!wide.value) openId.value = null
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown, { capture: true })
  media?.removeEventListener('change', onMedia)
})

watch(view, () => {
  if (!flat.value.some((i) => i.id === selectedId.value) && flat.value[0]) selectedId.value = flat.value[0].id
})

const mineCount = computed(() => issues.value.filter((i) => i.assignee === ME && i.status !== 'done').length)
const viewOptions = [
  { label: 'All issues', value: 'all' },
  { label: 'Assigned to me', value: 'mine' },
]
</script>

<template>
  <SampleShell product="Tracker" padding="none">
    <template #strip>
      <span class="s-issues__path">/ 21 Strive / Platform</span>
    </template>
    <template #meta>
      <span class="s-issues__wide">{{ CYCLE.name }} · {{ CYCLE.daysLeft }} days left</span>
      <span class="s-issues__narrow">{{ CYCLE.daysLeft }} days left</span>
    </template>

    <template #sidebar>
      <div class="s-issues__me">
        <RAvatar :name="ME" size="sm" />
        <span class="s-issues__me-text">
          <span class="s-issues__me-name">{{ ME }}</span>
          <span class="r-label">21 Strive</span>
        </span>
      </div>
      <button type="button" class="s-issues__find" @click="paletteOpen = true">
        <Search />
        <span>Search</span>
        <RKbd :keys="['mod', 'K']" size="sm" />
      </button>
      <nav class="s-issues__nav" aria-label="Workspace">
        <RNavItem as="button" type="button" label="Inbox" :icon="Inbox" :badge="4" badge-tone="brand" />
        <RNavItem as="button" type="button" label="My issues" :icon="UserRound" :badge="mineCount" :active="view === 'mine'" @click="view = 'mine'" />
      </nav>
      <div class="s-issues__team">
        <p class="s-issues__team-head"><span class="r-eyebrow">Platform</span><span class="r-label">STR</span></p>
        <nav class="s-issues__nav" aria-label="Platform team">
          <RNavItem as="button" type="button" label="Issues" :icon="Layers" :active="view === 'all'" @click="view = 'all'" />
          <RNavItem as="button" type="button" label="Projects" :icon="FolderKanban" />
          <RNavItem as="button" type="button" label="Cycles" :icon="RefreshCcw" />
          <RNavItem as="button" type="button" label="Views" :icon="CircleDot" />
        </nav>
      </div>
      <div class="s-issues__cycle">
        <div class="s-issues__cycle-head">
          <span class="r-eyebrow">{{ CYCLE.name }}</span>
          <span class="r-label">{{ CYCLE.range }}</span>
        </div>
        <RMeter variant="segments" :value="CYCLE.done" :max="CYCLE.scope" :count="16" :height="10" tone="brand" :label="`${CYCLE.done} of ${CYCLE.scope} points done`" />
        <p class="s-issues__cycle-foot">
          <span class="r-mono">{{ CYCLE.done }}/{{ CYCLE.scope }} pts</span>
          <span class="r-text-tertiary">{{ CYCLE.closed }} of {{ CYCLE.issues }} issues closed</span>
        </p>
      </div>
      <dl class="s-issues__keys">
        <div><dt><RKbd size="sm">J</RKbd><RKbd size="sm">K</RKbd></dt><dd>Move</dd></div>
        <div><dt><RKbd :keys="['enter']" size="sm" /></dt><dd>Open</dd></div>
        <div><dt><RKbd size="sm">C</RKbd></dt><dd>New issue</dd></div>
        <div><dt><RKbd :keys="['mod', 'K']" size="sm" /></dt><dd>Commands</dd></div>
      </dl>
    </template>

    <template #header>
      <div class="s-issues__title">
        <p class="r-eyebrow">Platform · STR</p>
        <h1 class="r-h3">{{ view === 'mine' ? 'My issues' : 'Active issues' }}</h1>
      </div>
    </template>
    <template #actions>
      <RInput v-model="query" size="sm" placeholder="Filter issues" clearable aria-label="Filter issues" class="s-issues__filter">
        <template #leading><Search /></template>
      </RInput>
      <RButton tone="brand" size="sm" @click="openComposer">
        <template #leading><Plus /></template>
        New issue
      </RButton>
    </template>

    <div class="s-issues" :class="{ 'has-pane': wide && openIssue }">
      <div
        class="s-issues__list"
        role="listbox"
        tabindex="0"
        aria-label="Issues grouped by status"
        :aria-activedescendant="selectedId ? `s-issues-row-${selectedId}` : undefined"
      >
        <div class="s-issues__bar">
          <RSegmented v-model="view" :options="viewOptions" size="sm" label="Issues to show" />
          <span class="r-label">{{ totals.count }} issues · {{ totals.points }} points · by priority</span>
        </div>

        <section v-for="group in groups" :key="group.id" class="s-issues__group" :aria-label="group.label">
          <button type="button" class="s-issues__group-head" :aria-expanded="group.open" @click="toggleGroup(group.id)">
            <component :is="group.open ? ChevronDown : ChevronRight" class="s-issues__chev" />
            <StatusIcon :status="group.id" decorative />
            <span class="s-issues__group-name">{{ group.label }}</span>
            <span class="s-issues__group-count r-mono">{{ group.issues.length }}</span>
            <span class="s-issues__group-points r-label">{{ group.points }} pts</span>
          </button>
          <div v-if="group.open" role="group" :aria-label="group.label">
            <div
              v-for="issue in group.issues"
              :id="`s-issues-row-${issue.id}`"
              :key="issue.id"
              role="option"
              :aria-selected="issue.id === selectedId"
              class="s-issues__row"
              :class="{ 'is-selected': issue.id === selectedId, 'is-open': issue.id === openId }"
              @click="open(issue)"
            >
              <PriorityMark :priority="issue.priority" />
              <span class="s-issues__id r-mono">{{ issue.id }}</span>
              <StatusIcon :status="issue.status" />
              <span class="s-issues__row-title">{{ issue.title }}</span>
              <span class="s-issues__labels">
                <RBadge v-for="l in issue.labels" :key="l" size="sm" :tone="labelTone[l] ?? 'neutral'" :dot="!!labelTone[l]">{{ l }}</RBadge>
              </span>
              <span class="s-issues__est r-mono" :title="issue.estimate ? `${issue.estimate} points` : 'No estimate'">{{ issue.estimate ?? '–' }}</span>
              <RAvatar v-if="issue.assignee" :name="issue.assignee" size="xs" :decorative="false" />
              <UserRound v-else class="s-issues__nobody" aria-label="Unassigned" role="img" />
              <span class="s-issues__date r-mono">{{ issue.updated }}</span>
            </div>
            <p v-if="!group.issues.length" class="s-issues__none r-caption">No issues in {{ group.label.toLowerCase() }}.</p>
          </div>
        </section>

        <REmpty v-if="!filtered.length" size="sm" title="No issues match" :body="`Nothing in Platform matches “${query}”.`">
          <template #actions>
            <RButton variant="outline" size="sm" @click="(query = ''), (view = 'all')">Clear filter</RButton>
          </template>
        </REmpty>
      </div>

      <aside v-if="wide && openIssue" class="s-issues__pane" aria-label="Issue detail">
        <IssueDetail
          :issue="openIssue"
          closable
          @close="openId = null"
          @status="(v) => setStatus(openIssue!, v)"
          @priority="(v) => setPriority(openIssue!, v)"
          @assignee="(v) => setAssignee(openIssue!, v)"
          @estimate="(v) => setEstimate(openIssue!, v)"
          @comment="(t) => comment(openIssue!, t)"
        />
      </aside>
    </div>

    <RDialog v-model:open="drawerOpen" side="right" :closable="false" class="s-issues-drawer">
      <IssueDetail
        v-if="openIssue"
        :issue="openIssue"
        closable
        @close="openId = null"
        @status="(v) => setStatus(openIssue!, v)"
        @priority="(v) => setPriority(openIssue!, v)"
        @assignee="(v) => setAssignee(openIssue!, v)"
        @estimate="(v) => setEstimate(openIssue!, v)"
        @comment="(t) => comment(openIssue!, t)"
      />
    </RDialog>

    <RDialog v-model:open="composerOpen" eyebrow="Platform · STR" title="New issue" size="md">
      <form id="s-issues-composer" class="s-issues__composer" @submit.prevent>
        <RInput v-model="draft.title" label="Title" placeholder="What needs to change?" :error="draftError" @update:model-value="draftError = ''" />
        <RTextarea v-model="draft.description" label="Description" :rows="4" placeholder="Context, steps to reproduce, the link to a log line." />
        <div class="s-issues__composer-row">
          <RSelect v-model="draft.status" :options="statusOptions" label="Status" size="sm" />
          <RSelect v-model="draft.priority" :options="priorityOptions" label="Priority" size="sm" />
          <RSelect v-model="draft.assignee" :options="assigneeOptions" label="Assignee" size="sm" />
        </div>
      </form>
      <template #footer="{ close }">
        <RButton variant="outline" @click="close">Cancel</RButton>
        <RButton tone="brand" @click="create(close)">Create issue</RButton>
      </template>
    </RDialog>

    <RCommandPalette v-model:open="paletteOpen" :items="commands" :hotkey="null" placeholder="Type a command or an issue id" label="Tracker commands" />
  </SampleShell>
</template>

<style scoped>
.s-issues__path {
  color: var(--r-text-tertiary);
}
.s-issues__narrow {
  display: none;
}

/* Sidebar */
.s-issues__me {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 2px 6px;
}
.s-issues__me-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.s-issues__me-name {
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-semibold);
}
.s-issues__find {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid var(--r-border-strong);
  background: var(--r-bg-surface);
  color: var(--r-text-tertiary);
  font-size: var(--r-text-sm);
  text-align: left;
}
.s-issues__find:hover {
  background: var(--r-bg-hover);
}
.s-issues__find svg {
  width: 14px;
  height: 14px;
}
.s-issues__find > span:not(.r-kbd-group) {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.s-issues__nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.s-issues__team {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.s-issues__team-head {
  display: flex;
  justify-content: space-between;
  padding: 0 8px;
  color: var(--r-text-tertiary);
}
.s-issues__cycle {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 8px 0;
  border-top: 1px solid var(--r-border);
}
.s-issues__cycle-head,
.s-issues__cycle-foot {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}
.s-issues__cycle-foot {
  font-size: var(--r-text-xs);
}
.s-issues__keys {
  display: grid;
  gap: 6px;
  margin: auto 0 0;
  padding: 12px 8px 0;
  border-top: 1px solid var(--r-border);
}
.s-issues__keys > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: var(--r-text-xs);
}
.s-issues__keys dt {
  display: inline-flex;
  gap: 4px;
}
.s-issues__keys dd {
  margin: 0;
  color: var(--r-text-tertiary);
}

.s-issues__title {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.s-issues__title .r-eyebrow {
  color: var(--r-text-tertiary);
}
.s-issues__filter {
  width: 220px;
}

/* List and pane */
.s-issues {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: start;
}
.s-issues.has-pane {
  grid-template-columns: minmax(0, 1fr) 460px;
}
.s-issues__list {
  min-width: 0;
  padding-bottom: 96px;
  outline: none;
}
.s-issues__list:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: -2px;
}
.s-issues__bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
  padding: 10px 20px;
  border-bottom: 1px solid var(--r-border);
}

.s-issues__group-head {
  position: sticky;
  top: 32px;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 36px;
  padding: 0 20px 0 14px;
  border: 0;
  border-bottom: 1px solid var(--r-border);
  background: var(--r-bg-muted);
  color: var(--r-text);
  font-size: var(--r-text-sm);
  text-align: left;
}
.s-issues__group-head:hover {
  background: var(--r-bg-hover);
}
.s-issues__chev {
  width: 14px;
  height: 14px;
  color: var(--r-text-tertiary);
}
.s-issues__group-name {
  font-weight: var(--r-weight-semibold);
}
.s-issues__group-count {
  color: var(--r-text-tertiary);
}
.s-issues__group-points {
  margin-left: auto;
}

.s-issues__row {
  position: relative;
  display: grid;
  grid-template-columns: 16px 72px 14px minmax(0, 1fr) auto 22px 20px 66px;
  align-items: center;
  gap: 10px;
  height: 38px;
  padding: 0 20px;
  border-bottom: 1px solid var(--r-border-subtle);
  background: var(--r-bg-surface);
  font-size: var(--r-text-sm);
  cursor: pointer;
}
.s-issues__row:hover {
  background: var(--r-bg-muted);
}
/* Selected: the selection tint and a 2px cobalt rule on the leading edge, as in tables. */
.s-issues__row.is-selected {
  background: var(--r-bg-selected);
}
.s-issues__row.is-selected::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 2px;
  background: var(--r-brand);
}
.s-issues__id {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}
.s-issues__row-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.s-issues__row.is-open .s-issues__row-title {
  font-weight: var(--r-weight-medium);
}
.s-issues__labels {
  display: inline-flex;
  gap: 4px;
}
.s-issues__est {
  display: grid;
  place-items: center;
  height: 18px;
  border: 1px solid var(--r-border);
  color: var(--r-text-secondary);
  font-size: var(--r-text-3xs);
}
.s-issues__nobody {
  width: 16px;
  height: 16px;
  color: var(--r-text-tertiary);
}
.s-issues__date {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  text-align: right;
}
.s-issues__none {
  padding: 10px 20px 10px 52px;
  border-bottom: 1px solid var(--r-border-subtle);
  color: var(--r-text-tertiary);
}

.s-issues__pane {
  position: sticky;
  top: 32px;
  height: calc(100dvh - 32px);
  border-left: 1px solid var(--r-border);
}

.s-issues__composer {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.s-issues__composer-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 1360px) {
  .s-issues.has-pane .s-issues__labels {
    display: none;
  }
}

@media (max-width: 640px) {
  .s-issues__path,
  .s-issues__wide {
    display: none;
  }
  .s-issues__narrow {
    display: inline;
  }
  .s-issues__filter {
    width: auto;
    flex: 1 1 160px;
  }
  .s-issues__bar {
    padding: 10px 16px;
  }
  .s-issues__row {
    grid-template-columns: 16px minmax(0, 1fr) 20px;
    grid-template-rows: auto auto;
    row-gap: 2px;
    height: auto;
    padding: 8px 16px;
  }
  .s-issues__row > :nth-child(2) {
    grid-column: 2;
    grid-row: 2;
  }
  .s-issues__row > :nth-child(3),
  .s-issues__labels,
  .s-issues__est,
  .s-issues__date {
    display: none;
  }
  .s-issues__row-title {
    grid-column: 2;
    grid-row: 1;
  }
  .s-issues__composer-row {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>

<style>
/* The drawer is teleported to <body>, so its body padding is reset outside the scoped block. */
.s-issues-drawer .r-dialog__body {
  padding: 0;
}
</style>
