<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, reactive, ref, useId, watch } from 'vue'
import {
  Archive,
  Building2,
  Calendar,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Copy,
  Download,
  EllipsisVertical,
  Keyboard,
  LogOut,
  Menu,
  Pencil,
  Plus,
  Search,
  Settings,
  SlidersHorizontal,
  Tag,
  Trash2,
  Upload,
  User,
  X,
  Bell,
  Check,
} from 'lucide-vue-next'
import {
  RAvatar,
  RAvatarGroup,
  RBadge,
  RButton,
  RCard,
  RChip,
  RDialog,
  RIconButton,
  RInput,
  RKbd,
  RMenu,
  RPagination,
  RPopover,
  RSegmented,
  RSelect,
  RTable,
  formatCurrency,
  isMac,
  useEscape,
  useFocusTrap,
  useHotkey,
  useLayer,
  useScrollLock,
  type MenuItem,
  type SelectOption,
  type TableColumn,
  type TableSort,
  type Tone,
} from '@/design-system'
import ProjectsSidebar from './parts/ProjectsSidebar.vue'
import { PROJECT_TYPES, STATUS_LABEL, TAGS, projects as seed, type Project, type ProjectStatus } from './data/projects'

const TODAY = '2026-11-02'
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const formatDay = (iso: string) => {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${MONTHS[m - 1]} ${y}`
}
const shortDay = (iso: string) => {
  const [, m, d] = iso.split('-').map(Number)
  return `${MONTHS[m - 1]} ${d}`
}

const rows = ref<Project[]>(seed.map((p) => ({ ...p, team: [...p.team], tags: [...p.tags] })))

/* ── Search ─────────────────────────────────────────────────────────────── */
const query = ref('')
const search = ref<{ focus: () => void } | null>(null)
useHotkey('mod+k', () => search.value?.focus())

/* ── Filters ────────────────────────────────────────────────────────────── */
interface Filters {
  from: string
  to: string
  type: string | null
  status: ProjectStatus | null
  tagMode: 'include' | 'exclude'
  tags: string[]
}

const emptyFilters = (): Filters => ({ from: '', to: '', type: null, status: null, tagMode: 'include', tags: [] })
const copyFilters = (f: Filters): Filters => ({ ...f, tags: [...f.tags] })

const applied = ref<Filters>(emptyFilters())
const draft = ref<Filters>(emptyFilters())
const filterOpen = ref(false)
const tagQuery = ref('')
const ids = { date: useId(), type: useId(), status: useId(), tags: useId() }

watch(filterOpen, (open) => {
  if (!open) return
  draft.value = copyFilters(applied.value)
  tagQuery.value = ''
})

const typeOptions: SelectOption[] = PROJECT_TYPES.map((t) => ({ label: t, value: t }))
const statusOptions: SelectOption[] = (Object.keys(STATUS_LABEL) as ProjectStatus[]).map((s) => ({
  label: STATUS_LABEL[s],
  value: s,
}))
const tagModes = [
  { label: 'Include', value: 'include' },
  { label: 'Exclude', value: 'exclude' },
]
const visibleTags = computed(() => {
  const q = tagQuery.value.trim().toLowerCase()
  return TAGS.filter((t) => t.name.toLowerCase().includes(q))
})
const dateError = computed(() =>
  draft.value.from && draft.value.to && draft.value.from > draft.value.to ? 'The start date is after the end date.' : '',
)

function toggleTag(name: string) {
  const tags = draft.value.tags
  draft.value.tags = tags.includes(name) ? tags.filter((t) => t !== name) : [...tags, name]
}

function applyFilters() {
  if (dateError.value) return
  applied.value = copyFilters(draft.value)
  filterOpen.value = false
}

function resetFilters() {
  draft.value = emptyFilters()
  applied.value = emptyFilters()
  tagQuery.value = ''
}

function clearEverything() {
  resetFilters()
  query.value = ''
}

const activeCount = computed(() => {
  const f = applied.value
  return [f.from || f.to, f.type, f.status, f.tags.length].filter(Boolean).length
})

const chips = computed(() => {
  const f = applied.value
  const out: { id: string; label: string; icon: unknown; clear: () => void }[] = []
  if (f.status) {
    out.push({
      id: 'status',
      label: STATUS_LABEL[f.status],
      icon: CircleDot,
      clear: () => (applied.value = { ...copyFilters(applied.value), status: null }),
    })
  }
  if (f.tags.length) {
    out.push({
      id: 'tags',
      label: `${f.tagMode === 'exclude' ? 'Not ' : ''}${f.tags.join(', ')}`,
      icon: Tag,
      clear: () => (applied.value = { ...copyFilters(applied.value), tags: [], tagMode: 'include' }),
    })
  }
  if (f.from || f.to) {
    out.push({
      id: 'date',
      label: `${f.from ? shortDay(f.from) : 'Any'} → ${f.to ? shortDay(f.to) : 'any'}`,
      icon: Calendar,
      clear: () => (applied.value = { ...copyFilters(applied.value), from: '', to: '' }),
    })
  }
  if (f.type) {
    out.push({
      id: 'type',
      label: f.type,
      icon: Building2,
      clear: () => (applied.value = { ...copyFilters(applied.value), type: null }),
    })
  }
  return out
})

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  const f = applied.value
  return rows.value.filter((p) => {
    if (q && ![p.name, p.client, p.type].some((v) => v.toLowerCase().includes(q))) return false
    if (f.from && p.due < f.from) return false
    if (f.to && p.due > f.to) return false
    if (f.type && p.type !== f.type) return false
    if (f.status && p.status !== f.status) return false
    if (f.tags.length) {
      const hit = p.tags.some((t) => f.tags.includes(t))
      if (f.tagMode === 'include' ? !hit : hit) return false
    }
    return true
  })
})

/* ── Sorting and paging (done here, over every match, not just one page) ── */
const sort = ref<TableSort | null>({ key: 'due', direction: 'asc' })
const STATUS_ORDER: Record<ProjectStatus, number> = { pending: 0, progress: 1, done: 2 }

const sorted = computed(() => {
  const s = sort.value
  if (!s) return filtered.value
  const dir = s.direction === 'asc' ? 1 : -1
  const read = (p: Project): string | number =>
    s.key === 'status' ? STATUS_ORDER[p.status] : s.key === 'budget' ? p.budget : String(p[s.key as keyof Project])
  return [...filtered.value].sort((a, b) => {
    const x = read(a)
    const y = read(b)
    if (typeof x === 'number' && typeof y === 'number') return (x - y) * dir
    return String(x).localeCompare(String(y), undefined, { sensitivity: 'base' }) * dir
  })
})

const page = ref(1)
const pageSize = ref(10)
const pageSizes: SelectOption[] = [
  { label: '10 rows', value: 10 },
  { label: '20 rows', value: 20 },
  { label: '50 rows', value: 50 },
]
const pageCount = computed(() => Math.max(1, Math.ceil(sorted.value.length / pageSize.value)))
const pageRows = computed(() => sorted.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value))
const rangeText = computed(() => {
  const total = sorted.value.length
  if (!total) return 'No projects'
  const start = (page.value - 1) * pageSize.value + 1
  const end = Math.min(page.value * pageSize.value, total)
  return `Showing ${start}–${end} of ${total}`
})

watch([query, applied, pageSize], () => (page.value = 1), { deep: true })
watch(pageCount, (count) => {
  if (page.value > count) page.value = count
})

/* ── Table ──────────────────────────────────────────────────────────────── */
const selected = ref<(string | number)[]>([])

const columns: TableColumn[] = [
  { key: 'name', label: 'Project', sortable: true },
  { key: 'type', label: 'Type', sortable: true },
  { key: 'team', label: 'Team' },
  { key: 'due', label: 'Due date', sortable: true },
  { key: 'budget', label: 'Budget', numeric: true, sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'actions', label: 'Actions', width: '56px', align: 'right' },
]

const statusTone: Record<ProjectStatus, Tone> = { pending: 'warning', progress: 'sky', done: 'success' }
const tagColor = (name: string) => TAGS.find((t) => t.name === name)?.color ?? 'var(--r-text-tertiary)'
const isOverdue = (p: Project) => p.status !== 'done' && p.due < TODAY

/* ── Row menu ───────────────────────────────────────────────────────────── */
const menuFor = ref<number | null>(null)
const duplicateKeys = `${isMac ? '⌘' : 'Ctrl '}D`

function rowMenu(p: Project): MenuItem[] {
  return [
    { id: 'edit', label: 'Edit', icon: Pencil, onSelect: () => window.setTimeout(() => openEdit(p)) },
    { id: 'duplicate', label: 'Duplicate', icon: Copy, shortcut: duplicateKeys, onSelect: () => duplicate(p) },
    { id: 'archive', label: 'Archive', icon: Archive, onSelect: () => removeProjects([p.id], 'archived') },
    { divider: true },
    { id: 'delete', label: 'Delete', icon: Trash2, danger: true, onSelect: () => removeProjects([p.id], 'deleted') },
  ]
}

let nextId = 2000

function duplicate(p: Project) {
  const at = rows.value.findIndex((r) => r.id === p.id)
  const copy: Project = { ...p, id: nextId++, name: `${p.name} (copy)`, team: [...p.team], tags: [...p.tags] }
  rows.value = [...rows.value.slice(0, at + 1), copy, ...rows.value.slice(at + 1)]
  notify(`Duplicated ${p.name}.`)
}

// ⌘D duplicates the project whose row has focus, or whose menu is open.
useHotkey(
  'mod+d',
  (event) => {
    let target: Project | undefined
    if (menuFor.value !== null) target = rows.value.find((r) => r.id === menuFor.value)
    else {
      const row = (document.activeElement as HTMLElement | null)?.closest<HTMLTableRowElement>('.projects__table tbody tr')
      if (row) target = pageRows.value[row.sectionRowIndex]
    }
    if (!target) return
    event.preventDefault()
    menuFor.value = null
    duplicate(target)
  },
  { preventDefault: false },
)

/* ── Bulk actions, with undo ────────────────────────────────────────────── */
const notice = ref<{ text: string; undo?: () => void } | null>(null)
let noticeTimer = 0

function notify(text: string, undo?: () => void) {
  notice.value = { text, undo }
  clearTimeout(noticeTimer)
  noticeTimer = window.setTimeout(() => (notice.value = null), 6000)
}

function removeProjects(keys: (string | number)[], verb: 'archived' | 'deleted') {
  const before = rows.value
  const removed = before.filter((p) => keys.includes(p.id))
  if (!removed.length) return
  rows.value = before.filter((p) => !keys.includes(p.id))
  selected.value = selected.value.filter((k) => !keys.includes(k))
  const what = removed.length === 1 ? removed[0].name : `${removed.length} projects`
  notify(`${what} ${verb}.`, () => {
    rows.value = before
    notice.value = null
  })
}

function undoLast() {
  notice.value?.undo?.()
}

onBeforeUnmount(() => clearTimeout(noticeTimer))

function download(name: string, list: Project[]) {
  const header = ['Project', 'Client', 'Type', 'Team', 'Due', 'Budget', 'Status', 'Tags']
  const lines = list.map((p) => [p.name, p.client, p.type, p.team.join('; '), p.due, p.budget, STATUS_LABEL[p.status], p.tags.join('; ')])
  const csv = [header, ...lines].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  Object.assign(document.createElement('a'), { href: url, download: name }).click()
  URL.revokeObjectURL(url)
}

function exportSelected() {
  const list = rows.value.filter((p) => selected.value.includes(p.id))
  download('projects-selected.csv', list)
  notify(`Exported ${list.length} ${list.length === 1 ? 'project' : 'projects'} to CSV.`)
}

/* ── Create and edit ────────────────────────────────────────────────────── */
const editOpen = ref(false)
const editingId = ref<number | null>(null)
const form = reactive({ name: '', client: '', type: 'Company profile', status: 'pending' as ProjectStatus, due: '', budget: '' })
const formError = ref('')

function openEdit(p: Project) {
  editingId.value = p.id
  Object.assign(form, { name: p.name, client: p.client, type: p.type, status: p.status, due: p.due, budget: String(p.budget) })
  formError.value = ''
  editOpen.value = true
}

function openCreate() {
  editingId.value = null
  Object.assign(form, { name: '', client: '', type: 'Company profile', status: 'pending', due: '2026-12-15', budget: '12000' })
  formError.value = ''
  editOpen.value = true
}

function saveProject() {
  if (!form.name.trim()) {
    formError.value = 'Give the project a name.'
    return
  }
  const budget = Math.max(0, Number(form.budget) || 0)
  if (editingId.value === null) {
    const project: Project = {
      id: nextId++,
      name: form.name.trim(),
      client: form.client.trim() || 'New client',
      type: form.type,
      team: ['Kim Ji-soo'],
      due: form.due || TODAY,
      budget,
      status: form.status,
      tags: ['Web'],
    }
    rows.value = [project, ...rows.value]
    notify(`Added ${project.name}.`)
  } else {
    rows.value = rows.value.map((p) =>
      p.id === editingId.value
        ? { ...p, name: form.name.trim(), client: form.client.trim() || p.client, type: form.type, status: form.status, due: form.due || p.due, budget }
        : p,
    )
    notify(`Saved ${form.name.trim()}.`)
  }
  editOpen.value = false
}

/* ── Account menu and the narrow-screen drawer ──────────────────────────── */
const accountOpen = ref(false)
const accountMenu: MenuItem[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'keys', label: 'Keyboard shortcuts', icon: Keyboard },
  { divider: true },
  { id: 'logout', label: 'Log out', icon: LogOut },
]

const drawerOpen = ref(false)
const drawer = ref<HTMLElement | null>(null)
const drawerLayer = useLayer(drawerOpen)
useScrollLock(drawerOpen)
useFocusTrap(drawer, drawerOpen, { isTop: drawerLayer.isTop })
useEscape(drawerOpen, () => (drawerOpen.value = false), drawerLayer.isTop)

watch(drawerOpen, (open) => {
  if (open) nextTick(() => drawer.value?.querySelector<HTMLElement>('.r-nav-item.is-active')?.focus())
})
</script>

<template>
  <div class="projects">
    <aside class="projects__sidebar">
      <ProjectsSidebar />
    </aside>

    <div class="projects__main">
      <header class="projects__topbar">
        <RIconButton class="projects__menu-button" label="Open navigation" variant="ghost" @click="drawerOpen = true">
          <Menu />
        </RIconButton>
        <nav class="projects__crumbs" aria-label="Breadcrumb">
          <span>Project</span>
          <ChevronRight aria-hidden="true" />
          <span aria-current="page">Project list</span>
        </nav>
        <div class="projects__topbar-actions">
          <RIconButton label="Notifications, 2 unread" dot>
            <Bell />
          </RIconButton>
          <RPopover v-model:open="accountOpen" kind="menu" placement="bottom-end">
            <template #trigger>
              <RButton variant="outline" shape="pill" class="projects__account" aria-label="Account menu for Kim Ji-soo">
                <template #leading><RAvatar name="Kim Ji-soo" size="sm" decorative /></template>
                <span class="projects__account-name">Kim Ji-soo</span>
                <template #trailing><ChevronDown /></template>
              </RButton>
            </template>
            <RMenu :items="accountMenu" label="Account" @close="accountOpen = false" />
          </RPopover>
        </div>
      </header>

      <main class="projects__content">
        <RCard padding="none" class="projects__card">
          <div class="projects__toolbar">
            <div class="projects__heading">
              <h1 class="projects__title">List project</h1>
              <RBadge dot>{{ filtered.length }} {{ filtered.length === 1 ? 'project' : 'projects' }}</RBadge>
            </div>
            <div class="projects__tools">
              <RInput
                ref="search"
                v-model="query"
                class="projects__search"
                type="search"
                placeholder="Search projects"
                aria-label="Search projects"
                clearable
              >
                <template #leading><Search /></template>
                <template #trailing><RKbd :keys="['mod', 'K']" size="sm" /></template>
              </RInput>
              <RIconButton label="Import projects" shape="square" class="projects__secondary">
                <Upload />
              </RIconButton>
              <RIconButton label="Export all projects to CSV" shape="square" class="projects__secondary" @click="download('projects.csv', sorted)">
                <Download />
              </RIconButton>
              <RPopover v-model:open="filterOpen" placement="bottom-end" label="Filter projects" width="360px" padding="none">
                <template #trigger>
                  <RButton variant="outline" :class="{ 'projects__filter--on': activeCount }">
                    <template #leading><SlidersHorizontal /></template>
                    Filter
                    <template v-if="activeCount" #trailing>
                      <span class="projects__filter-count">{{ activeCount }}</span>
                    </template>
                  </RButton>
                </template>

                <form class="pf" @submit.prevent="applyFilters">
                  <div class="pf__head">
                    <h2 class="pf__title">Filter</h2>
                    <RIconButton label="Close filter" variant="ghost" size="sm" shape="square" @click="filterOpen = false">
                      <X />
                    </RIconButton>
                  </div>

                  <div class="pf__body">
                    <div class="pf__group" role="group" :aria-labelledby="ids.date">
                      <div class="pf__group-head">
                        <span :id="ids.date" class="pf__label">Due date</span>
                        <button type="button" class="pf__clear" :disabled="!draft.from && !draft.to" @click="(draft.from = ''), (draft.to = '')">
                          Clear
                        </button>
                      </div>
                      <div class="pf__dates">
                        <RInput v-model="draft.from" type="date" label="From" size="sm" :invalid="!!dateError" />
                        <RInput v-model="draft.to" type="date" label="To" size="sm" :invalid="!!dateError" />
                      </div>
                      <p v-if="dateError" class="pf__error" role="alert">{{ dateError }}</p>
                    </div>

                    <div class="pf__group" role="group" :aria-labelledby="ids.type">
                      <div class="pf__group-head">
                        <span :id="ids.type" class="pf__label">Client type</span>
                        <button type="button" class="pf__clear" :disabled="!draft.type" @click="draft.type = null">Clear</button>
                      </div>
                      <RSelect v-model="draft.type" :options="typeOptions" placeholder="Any type" size="sm" :aria-labelledby="ids.type" />
                    </div>

                    <div class="pf__group" role="group" :aria-labelledby="ids.status">
                      <div class="pf__group-head">
                        <span :id="ids.status" class="pf__label">Status</span>
                        <button type="button" class="pf__clear" :disabled="!draft.status" @click="draft.status = null">Clear</button>
                      </div>
                      <RSelect
                        :model-value="draft.status"
                        :options="statusOptions"
                        placeholder="Any status"
                        size="sm"
                        :aria-labelledby="ids.status"
                        @update:model-value="(v) => (draft.status = (v as ProjectStatus | null) ?? null)"
                      >
                        <template #leading="{ option }">
                          <span class="pf__dot" :class="option ? `is-${option.value}` : ''" aria-hidden="true" />
                        </template>
                      </RSelect>
                    </div>

                    <div class="pf__group" role="group" :aria-labelledby="ids.tags">
                      <div class="pf__group-head">
                        <span :id="ids.tags" class="pf__label">Tags</span>
                        <button type="button" class="pf__clear" :disabled="!draft.tags.length" @click="draft.tags = []">Clear</button>
                      </div>
                      <RSegmented
                        :model-value="draft.tagMode"
                        :options="tagModes"
                        block
                        size="sm"
                        label="Tag rule"
                        @update:model-value="(v) => (draft.tagMode = v as 'include' | 'exclude')"
                      />
                      <RInput v-model="tagQuery" variant="filled" size="sm" placeholder="Search tags" aria-label="Search tags">
                        <template #leading><Search /></template>
                      </RInput>
                      <ul class="pf__tags">
                        <li v-for="t in visibleTags" :key="t.name">
                          <button
                            type="button"
                            role="checkbox"
                            class="pf__tag"
                            :class="{ 'is-on': draft.tags.includes(t.name) }"
                            :aria-checked="draft.tags.includes(t.name)"
                            @click="toggleTag(t.name)"
                          >
                            <span class="pf__tag-chip">
                              <span class="pf__tag-square" :style="{ background: t.color }" aria-hidden="true" />
                              {{ t.name }}
                            </span>
                            <Check v-if="draft.tags.includes(t.name)" class="pf__tag-check" aria-hidden="true" />
                          </button>
                        </li>
                        <li v-if="!visibleTags.length" class="pf__none">No tags match “{{ tagQuery }}”.</li>
                      </ul>
                      <p class="pf__hint">
                        {{ draft.tagMode === 'include' ? 'Show projects with any of these tags.' : 'Hide projects with any of these tags.' }}
                      </p>
                    </div>
                  </div>

                  <div class="pf__foot">
                    <RButton variant="outline" @click="resetFilters">Reset</RButton>
                    <RButton type="submit" tone="brand" :disabled="!!dateError">Apply now</RButton>
                  </div>
                </form>
              </RPopover>
              <RButton class="projects__add" @click="openCreate">
                <template #leading><Plus /></template>
                Add project
              </RButton>
            </div>
          </div>

          <div class="projects__chips" role="group" aria-label="Active filters">
            <RChip
              v-for="chip in chips"
              :key="chip.id"
              variant="solid"
              tone="violet"
              caret
              removable
              size="sm"
              :remove-label="`Remove filter: ${chip.label}`"
              @click="filterOpen = true"
              @remove="chip.clear()"
            >
              <template #leading><component :is="chip.icon" /></template>
              {{ chip.label }}
            </RChip>
            <RChip variant="dashed" size="sm" @click="filterOpen = true">
              <template #leading><Plus /></template>
              {{ chips.length ? 'Add filter' : 'Add a filter' }}
            </RChip>
            <button v-if="chips.length" type="button" class="projects__clear-all" @click="resetFilters">Clear all</button>
          </div>

          <RTable
            v-model:selected="selected"
            v-model:sort="sort"
            class="projects__table"
            :columns="columns"
            :rows="pageRows"
            row-key="id"
            selectable
            manual-sort
            :row-label="(row) => row.name"
            caption="Projects"
          >
            <template #header-actions>
              <span class="r-sr-only">Actions</span>
            </template>
            <template #cell-name="{ row }">
              <span class="pl__project">
                <span class="pl__name">{{ row.name }}</span>
                <span class="pl__client">{{ row.client }}</span>
              </span>
            </template>
            <template #cell-type="{ row }">
              <span class="pl__project">
                <span>{{ row.type }}</span>
                <span class="pl__tags">
                  <span v-for="t in row.tags" :key="t" class="pl__tag">
                    <span class="pl__tag-dot" :style="{ background: tagColor(t) }" aria-hidden="true" />
                    {{ t }}
                  </span>
                </span>
              </span>
            </template>
            <template #cell-team="{ row }">
              <RAvatarGroup :names="row.team" :max="3" size="sm" />
            </template>
            <template #cell-due="{ row }">
              <span :class="isOverdue(row as Project) ? 'pl__overdue' : 'pl__muted'">
                {{ formatDay(row.due) }}
                <span v-if="isOverdue(row as Project)" class="pl__overdue-note">Overdue</span>
              </span>
            </template>
            <template #cell-budget="{ value }">{{ formatCurrency(value) }}</template>
            <template #cell-status="{ row }">
              <RBadge :tone="statusTone[(row as Project).status]" dot>{{ STATUS_LABEL[(row as Project).status] }}</RBadge>
            </template>
            <template #cell-actions="{ row }">
              <RPopover
                :open="menuFor === row.id"
                kind="menu"
                placement="bottom-end"
                @update:open="(open) => (menuFor = open ? row.id : null)"
              >
                <template #trigger>
                  <RIconButton :label="`Actions for ${row.name}`" variant="ghost" size="sm">
                    <EllipsisVertical />
                  </RIconButton>
                </template>
                <RMenu :items="rowMenu(row as Project)" :label="`Actions for ${row.name}`" @close="menuFor = null" />
              </RPopover>
            </template>
            <template #empty>
              <div class="pl__empty">
                <p class="pl__empty-title">No projects match.</p>
                <p class="pl__empty-text">Try a different search, or loosen the filters.</p>
                <RButton variant="outline" size="sm" @click="clearEverything">Clear search and filters</RButton>
              </div>
            </template>
          </RTable>

          <div class="projects__footer">
            <span class="projects__range">{{ rangeText }}</span>
            <RPagination v-model="page" :page-count="pageCount" />
            <RSelect v-model="pageSize" :options="pageSizes" size="sm" aria-label="Rows per page" class="projects__page-size" />
          </div>
        </RCard>
      </main>
    </div>

    <Transition name="pl-bar">
      <div v-if="selected.length" class="pl-bar" data-theme="dark" role="toolbar" aria-label="Selected projects">
        <span class="pl-bar__count" aria-live="polite">{{ selected.length }} selected</span>
        <span class="pl-bar__divider" aria-hidden="true" />
        <RButton variant="ghost" size="sm" @click="exportSelected">
          <template #leading><Download /></template>
          Export
        </RButton>
        <RButton variant="ghost" size="sm" @click="removeProjects(selected, 'archived')">
          <template #leading><Archive /></template>
          Archive
        </RButton>
        <RButton variant="ghost" tone="danger" size="sm" @click="removeProjects(selected, 'deleted')">
          <template #leading><Trash2 /></template>
          Delete
        </RButton>
        <RIconButton label="Clear selection" variant="ghost" size="sm" @click="selected = []">
          <X />
        </RIconButton>
      </div>
      <div v-else-if="notice" class="pl-bar pl-bar--notice" data-theme="dark" role="status">
        <span>{{ notice.text }}</span>
        <RButton v-if="notice.undo" variant="ghost" size="sm" @click="undoLast">Undo</RButton>
      </div>
    </Transition>

    <RDialog
      v-model:open="editOpen"
      :title="editingId === null ? 'New project' : 'Edit project'"
      :description="editingId === null ? 'It shows up at the top of the list.' : 'Changes save to this list straight away.'"
      size="md"
    >
      <form id="project-form" class="pl-form" @submit.prevent="saveProject">
        <RInput v-model="form.name" label="Project name" :error="formError" autocomplete="off" @input="formError = ''" />
        <RInput v-model="form.client" label="Client" autocomplete="off" />
        <div class="pl-form__row">
          <RSelect v-model="form.type" :options="typeOptions" label="Type" />
          <RSelect
            :model-value="form.status"
            :options="statusOptions"
            label="Status"
            @update:model-value="(v) => (form.status = (v as ProjectStatus) ?? 'pending')"
          />
        </div>
        <div class="pl-form__row">
          <RInput v-model="form.due" type="date" label="Due date" />
          <RInput v-model="form.budget" type="number" label="Budget (USD)" min="0" step="500" />
        </div>
      </form>
      <template #footer="{ close }">
        <RButton variant="outline" @click="close">Cancel</RButton>
        <RButton type="submit" form="project-form">{{ editingId === null ? 'Add project' : 'Save changes' }}</RButton>
      </template>
    </RDialog>

    <Teleport to="body">
      <Transition name="pl-drawer">
        <div v-if="drawerOpen" class="pl-drawer" @pointerdown.self="drawerOpen = false">
          <div ref="drawer" class="pl-drawer__panel" role="dialog" aria-modal="true" aria-label="Navigation">
            <RIconButton class="pl-drawer__close" label="Close navigation" variant="ghost" size="sm" @click="drawerOpen = false">
              <X />
            </RIconButton>
            <ProjectsSidebar />
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style>
.projects {
  display: flex;
  min-height: 100dvh;
  background: var(--r-bg-canvas);
}

.projects__sidebar {
  position: sticky;
  top: 0;
  flex-shrink: 0;
  width: 264px;
  height: 100dvh;
  padding: 20px 16px 24px;
  overflow-y: auto;
  border-right: 1px solid var(--r-border-subtle);
  background: var(--r-bg-surface);
}

.projects__main {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.projects__topbar {
  position: sticky;
  z-index: var(--r-z-sticky);
  top: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  height: 72px;
  padding: 0 32px;
  border-bottom: 1px solid var(--r-border-subtle);
  background: color-mix(in srgb, var(--r-bg-surface) 88%, transparent);
  backdrop-filter: blur(10px);
}

.projects__menu-button {
  display: none;
}

.projects__crumbs {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-sm);
}
.projects__crumbs svg {
  width: 14px;
  height: 14px;
}
.projects__crumbs [aria-current] {
  color: var(--r-text);
  font-weight: var(--r-weight-medium);
}

.projects__topbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.projects__account.r-button {
  padding-left: 5px;
}

.projects__content {
  flex: 1;
  padding: 28px 32px 128px;
}

.projects__card {
  gap: 0;
  overflow: hidden;
}

.projects__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 14px 20px;
  padding: 20px 20px 16px;
}

.projects__heading {
  display: flex;
  align-items: center;
  gap: 10px;
}

.projects__title {
  font-size: var(--r-text-xl);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
}

.projects__tools {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.projects__search {
  width: 280px;
}

.projects__filter-count {
  display: inline-grid;
  place-items: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: var(--r-radius-full);
  background: var(--r-brand);
  color: var(--r-on-brand);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
}
.projects__filter--on.r-button {
  border-color: var(--r-brand);
}

.projects__chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 0 20px 16px;
}

.projects__clear-all {
  padding: 4px 6px;
  border: 0;
  border-radius: var(--r-radius-xs);
  background: none;
  color: var(--r-brand-text);
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
  cursor: pointer;
}
.projects__clear-all:hover {
  text-decoration: underline;
}

.projects__table {
  border-top: 1px solid var(--r-border-subtle);
}

.projects__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 16px;
  padding: 14px 20px;
  border-top: 1px solid var(--r-border-subtle);
}

.projects__range {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-sm);
  font-variant-numeric: tabular-nums;
}

.projects__page-size {
  width: 112px;
}

/* Table cells */
.pl__project {
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 1.3;
}
.pl__name {
  font-weight: var(--r-weight-medium);
}
.pl__client,
.pl__muted {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-sm);
}
.pl__tags {
  display: flex;
  gap: 10px;
}
.pl__tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}
.pl__tag-dot {
  width: 6px;
  height: 6px;
  border-radius: 2px;
}
.pl__overdue {
  color: var(--r-danger-text);
  font-size: var(--r-text-sm);
}
.pl__overdue-note {
  display: block;
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
}

.pl__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 56px 16px;
  text-align: center;
}
.pl__empty-title {
  font-weight: var(--r-weight-semibold);
}
.pl__empty-text {
  margin-bottom: 8px;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-sm);
}

/* Filter popover */
.pf {
  display: flex;
  flex-direction: column;
  max-height: min(640px, calc(100dvh - 32px));
}

.pf__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 12px 12px 18px;
  border-bottom: 1px solid var(--r-border-subtle);
}

.pf__title {
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
}

.pf__body {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 16px 18px;
  overflow-y: auto;
}

.pf__group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pf__group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pf__label {
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
}

.pf__clear {
  padding: 2px 4px;
  border: 0;
  border-radius: var(--r-radius-xs);
  background: none;
  color: var(--r-brand-text);
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
  cursor: pointer;
}
.pf__clear:disabled {
  color: var(--r-text-disabled);
  cursor: default;
}

.pf__dates {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.pf__dates .r-field__label {
  font-size: var(--r-text-xs);
}

.pf__error {
  color: var(--r-danger-text);
  font-size: var(--r-text-xs);
}

.pf__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1.5px var(--r-border-strong);
}
.pf__dot.is-pending {
  background: var(--r-warning);
  box-shadow: none;
}
.pf__dot.is-progress {
  background: var(--r-sky);
  box-shadow: none;
}
.pf__dot.is-done {
  background: var(--r-success);
  box-shadow: none;
}

.pf__tags {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pf__tag {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 38px;
  padding: 4px 10px 4px 6px;
  border: 0;
  border-radius: var(--r-radius-md);
  background: none;
  color: var(--r-text);
  cursor: pointer;
}
.pf__tag:hover {
  background: var(--r-bg-hover);
}
.pf__tag.is-on {
  background: var(--r-violet-soft);
}

.pf__tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 26px;
  padding: 0 9px;
  border: 1px solid var(--r-border);
  border-radius: var(--r-radius-sm);
  background: var(--r-bg-surface);
  font-size: var(--r-text-sm);
}
.pf__tag-square {
  width: 9px;
  height: 9px;
  border-radius: 2px;
}
.pf__tag-check {
  width: 16px;
  height: 16px;
  color: var(--r-violet-text);
  stroke-width: 2.5;
}

.pf__none,
.pf__hint {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}
.pf__none {
  padding: 8px 6px;
}

.pf__foot {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 14px 18px;
  border-top: 1px solid var(--r-border-subtle);
}

/* Bulk action bar and notices */
.pl-bar {
  position: fixed;
  z-index: var(--r-z-toast);
  bottom: 84px;
  left: 50%;
  display: flex;
  align-items: center;
  gap: 4px;
  max-width: calc(100vw - 24px);
  padding: 6px 6px 6px 16px;
  overflow-x: auto;
  border: 1px solid var(--r-border);
  border-radius: var(--r-radius-full);
  background: var(--r-bg-raised);
  box-shadow: var(--r-shadow-xl);
  color: var(--r-text);
  font-size: var(--r-text-sm);
  white-space: nowrap;
  transform: translateX(-50%);
}

.pl-bar--notice {
  gap: 10px;
  padding-right: 8px;
}

.pl-bar__count {
  padding-right: 6px;
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
}

.pl-bar__divider {
  width: 1px;
  height: 18px;
  margin: 0 4px;
  background: var(--r-border);
}

.pl-bar-enter-active,
.pl-bar-leave-active {
  transition:
    opacity var(--r-duration-base) var(--r-ease-out),
    transform var(--r-duration-base) var(--r-ease-out);
}
.pl-bar-enter-from,
.pl-bar-leave-to {
  opacity: 0;
  transform: translate(-50%, 12px);
}

/* Edit dialog */
.pl-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.pl-form__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

/* Drawer */
.pl-drawer {
  position: fixed;
  z-index: var(--r-z-modal);
  inset: 0;
  background: var(--r-bg-overlay);
}
.pl-drawer__panel {
  position: relative;
  width: min(296px, 86vw);
  height: 100%;
  padding: 20px 14px 24px;
  overflow-y: auto;
  background: var(--r-bg-raised);
  box-shadow: var(--r-shadow-xl);
}
.pl-drawer__close {
  position: absolute;
  top: 18px;
  right: 12px;
}
.pl-drawer-enter-active,
.pl-drawer-leave-active {
  transition: opacity var(--r-duration-base) var(--r-ease-out);
}
.pl-drawer-enter-active .pl-drawer__panel,
.pl-drawer-leave-active .pl-drawer__panel {
  transition: transform var(--r-duration-base) var(--r-ease-out);
}
.pl-drawer-enter-from,
.pl-drawer-leave-to {
  opacity: 0;
}
.pl-drawer-enter-from .pl-drawer__panel,
.pl-drawer-leave-to .pl-drawer__panel {
  transform: translateX(-100%);
}

@media (max-width: 1023px) {
  .projects__sidebar {
    display: none;
  }
  .projects__menu-button {
    display: inline-grid;
  }
  .projects__topbar {
    padding: 0 16px 0 10px;
  }
}

@media (max-width: 760px) {
  .projects__content {
    padding: 16px 12px 128px;
  }
  .projects__tools {
    width: 100%;
  }
  .projects__search {
    flex: 1 1 100%;
    width: auto;
  }
  .projects__add {
    margin-left: auto;
  }
  .projects__account-name {
    display: none;
  }
  .projects__footer {
    justify-content: center;
  }
  .projects__range {
    width: 100%;
    text-align: center;
  }
  .pl-form__row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 420px) {
  .projects__secondary {
    display: none;
  }
}
</style>
