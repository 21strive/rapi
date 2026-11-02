<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  CornerDownLeft,
  Download,
  Inbox,
  MoreHorizontal,
  Package,
  Receipt,
  RefreshCw,
  Upload,
} from 'lucide-vue-next'
import {
  RAvatar,
  RAvatarGroup,
  RBadge,
  RButton,
  RCard,
  RIconButton,
  RInput,
  RKbd,
  RMeter,
  RSegmented,
  RSparkline,
  RStat,
  RSwitch,
  RTable,
  RTrend,
  formatCurrency,
  formatNumber,
  identityIndex,
  type TableColumn,
  type TableSort,
  type Tone,
} from '@/design-system'
import DocPage from '../components/DocPage.vue'
import DocSection from '../components/DocSection.vue'
import Demo from '../components/Demo.vue'
import CodeBlock from '../components/CodeBlock.vue'
import PropsTable from '../components/PropsTable.vue'
import DoDont from '../components/DoDont.vue'

/* ── Card ───────────────────────────────────────────────────────────────── */
const payers = ['Maya Lestari', 'Rizky Pratama', 'Sekar Ayu', 'Dimas Putra', 'Nurul Aini', 'Agus Salim', 'Rani Wijaya', 'Teguh Santoso', 'Lina Hartono', 'Budi Gunawan', 'Citra Dewi']
const lastQuick = ref('')
const quickLinks = [
  { label: 'Request', icon: Receipt },
  { label: 'Send', icon: Upload },
  { label: 'Receive', icon: Download },
]
const outgoing = [
  { name: 'Snow Black Jacket', meta: '2 days ago', amount: 5600 },
  { name: 'Leather Weekender Bag', meta: '4 days ago', amount: 1240 },
  { name: 'Canvas Sneakers', meta: '6 days ago', amount: 860 },
]

const cardCode = `<script setup lang="ts">
import { ArrowUpRight } from 'lucide-vue-next'
import { RCard, RIconButton, RStat } from '@/design-system'
<\/script>

<template>
  <RCard title="Total insight" subtitle="All channels">
    <template #actions>
      <RIconButton label="Open insight report"><ArrowUpRight /></RIconButton>
    </template>
    <RStat :value="129521" :trend="-1.2" trend-label="than last month" />
  </RCard>

  <RCard variant="brand" title="Overall revenue">
    <RStat :value="25912" prefix="$" :trend="1.9" trend-label="than last month" />
  </RCard>
</template>`

const cardProps = [
  { name: 'title', type: 'string', description: 'Heading in the top-left corner.' },
  { name: 'subtitle', type: 'string', description: 'A quieter line under the title.' },
  { name: 'variant', type: "'surface' | 'muted' | 'outline' | 'brand' | 'flame' | 'ink'", default: "'surface'", description: 'Brand and flame re-point text and border tokens so components inside adapt. Ink is a dark island in both themes.' },
  { name: 'padding', type: "'none' | 'sm' | 'md' | 'lg'", default: "'md'", description: '16, 20 or 24px, a little more above 640px wide. None is for tables and lists that bring their own.' },
  { name: 'interactive', type: 'boolean', default: 'false', description: 'Hover lift. Pair it with as="a", as="button" or a RouterLink.' },
  { name: 'as', type: 'string', default: "'div'", description: 'The element or registered component to render.' },
  { name: 'titleAs', type: "'h2' | 'h3' | 'h4' | 'p'", default: "'h3'", description: 'Heading level of the title, so the page outline stays right.' },
]

/* ── Stat ───────────────────────────────────────────────────────────────── */
const revenue = ref(25912.43)
function shuffleRevenue() {
  revenue.value = Math.round((18000 + Math.random() * 24000) * 100) / 100
}

const statCode = `<script setup lang="ts">
import { RStat } from '@/design-system'
<\/script>

<template>
  <RStat label="Total members" :value="2521" :trend="12.4" trend-label="than last month" />
  <RStat label="Heart rate" value="40–189" unit="bpm" />
  <RStat :value="25912.43" prefix="$" :decimals="2" muted-decimals size="xl" animate />
</template>`

const statProps = [
  { name: 'value', type: 'number | string', description: 'Required. Numbers are formatted for you; strings are shown as written (e.g. a range).' },
  { name: 'label', type: 'string', description: 'Text above the number. The label slot works too.' },
  { name: 'prefix', type: 'string', description: 'Before the number, same size, e.g. "$".' },
  { name: 'suffix', type: 'string', description: 'After the number, same size, e.g. "%".' },
  { name: 'unit', type: 'string', description: 'After the number, half size and muted, e.g. "kcal".' },
  { name: 'decimals', type: 'number', default: '0', description: 'Fraction digits.' },
  { name: 'mutedDecimals', type: 'boolean', default: 'false', description: 'Shows the fraction in the tertiary colour.' },
  { name: 'trend', type: 'number', description: 'Adds an RTrend pill under the number.' },
  { name: 'trendLabel', type: 'string', description: 'What the trend compares against, e.g. "than last month".' },
  { name: 'invertTrend', type: 'boolean', default: 'false', description: 'For numbers where lower is better.' },
  { name: 'size', type: "'md' | 'lg' | 'xl'", default: "'lg'", description: 'Number at 24, 40 or 56px.' },
  { name: 'animate', type: 'boolean', default: 'false', description: 'Counts up from the previous value. Skipped with reduced motion.' },
  { name: 'fit', type: 'boolean', default: 'true', description: 'Shrinks the number, down to half size, when it would not fit its container.' },
  { name: 'locale', type: 'string', default: "'en-US'", description: 'Locale for number formatting.' },
]

/* ── Trend ──────────────────────────────────────────────────────────────── */
const trendCode = `<script setup lang="ts">
import { RTrend } from '@/design-system'
<\/script>

<template>
  <RTrend :value="1.9" />
  <RTrend :value="-4.2" invert />
  <RTrend :value="12" suffix=" pts" :precision="0" variant="plain" icon />
</template>`

const trendProps = [
  { name: 'value', type: 'number', description: 'Required. The change, e.g. 1.9 for +1.9%.' },
  { name: 'suffix', type: 'string', default: "'%'", description: 'Text after the number.' },
  { name: 'precision', type: 'number', default: '1', description: 'Fraction digits.' },
  { name: 'invert', type: 'boolean', default: 'false', description: 'Lower is better: a drop turns green, a rise turns red.' },
  { name: 'variant', type: "'soft' | 'plain'", default: "'soft'", description: 'A tinted pill, or coloured text only.' },
  { name: 'icon', type: 'boolean', default: 'false', description: 'Adds a small arrow.' },
  { name: 'size', type: "'sm' | 'md'", default: "'md'", description: '18 or 22px tall.' },
]

/* ── Badge ──────────────────────────────────────────────────────────────── */
const statuses: { label: string; tone: Tone }[] = [
  { label: 'Pending', tone: 'warning' },
  { label: 'In progress', tone: 'brand' },
  { label: 'Done', tone: 'success' },
  { label: 'Late', tone: 'danger' },
  { label: 'On time', tone: 'sky' },
  { label: 'Planned', tone: 'violet' },
  { label: 'New', tone: 'flame' },
  { label: 'Archived', tone: 'neutral' },
]
const tags = [
  { label: 'Marketing', color: 'var(--r-identity-4-text)' },
  { label: 'Internal', color: 'var(--r-identity-1-text)' },
  { label: 'Research', color: 'var(--r-identity-7-text)' },
]

const badgeCode = `<script setup lang="ts">
import { RBadge } from '@/design-system'
<\/script>

<template>
  <RBadge tone="warning" dot>Pending</RBadge>
  <RBadge tone="success" dot>Done</RBadge>
  <RBadge variant="outline" square>Internal</RBadge>
</template>`

const badgeProps = [
  { name: 'tone', type: 'Tone', default: "'neutral'", description: 'neutral, brand, success, warning, danger, violet, flame or sky.' },
  { name: 'variant', type: "'soft' | 'outline' | 'solid'", default: "'soft'", description: 'Soft for statuses in tables, solid for counts that need attention.' },
  { name: 'dot', type: 'boolean', default: 'false', description: 'A small dot in the text colour before the label.' },
  { name: 'square', type: 'boolean', default: 'false', description: '6px corners instead of a pill, for tags.' },
  { name: 'size', type: "'sm' | 'md'", default: "'md'", description: '20 or 24px tall.' },
]

/* ── Avatar ─────────────────────────────────────────────────────────────── */
const pool = [
  'Anastasia William', 'Kim Ji-soo', 'Nurul Aini', 'Agus Salim', 'Bessie Cooper', 'Jenny Wilson', 'Kathryn Murphy',
  'Marvin McKinney', 'Kristin Watson', 'Arthur Sjorgen', 'Tyra Dhillon', 'Britni Lando', 'Kevin Chen', 'Josh Ryan',
  'Chiseko Chuta', 'Maya Lestari', 'Rizky Pratama', 'Dimas Putra', 'Sekar Ayu', 'Rani Wijaya', 'Teguh Santoso',
  'Lina Hartono', 'Budi Gunawan', 'Citra Dewi', 'Eko Prasetyo', 'Fajar Nugroho', 'Gita Permata', 'Hana Kusuma',
  'Lukas Tan', 'Fiona Wu',
]
// One name per identity colour, so all eight show up.
const identityNames = Array.from({ length: 8 }, (_, i) => pool.find((n) => identityIndex(n) === i + 1) ?? pool[i])
const team = ['Bessie Cooper', 'Jenny Wilson', 'Kathryn Murphy', 'Marvin McKinney', 'Kristin Watson', 'Arthur Sjorgen', 'Tyra Dhillon']

const avatarCode = `<script setup lang="ts">
import { RAvatar, RAvatarGroup } from '@/design-system'

const team = ['Bessie Cooper', 'Jenny Wilson', 'Kathryn Murphy', 'Marvin McKinney', 'Kristin Watson']
<\/script>

<template>
  <RAvatar name="Anastasia William" status="online" />
  <RAvatarGroup :names="team" :max="3" />
</template>`

const avatarProps = [
  { name: 'name', type: 'string', description: 'Required. Gives the initials, the colour and the accessible name.' },
  { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'", default: "'md'", description: '20, 24, 32, 40 or 48px.' },
  { name: 'ring', type: 'boolean', default: 'false', description: 'A ring in the surface colour, for avatars that overlap.' },
  { name: 'status', type: "'online' | 'away' | 'busy' | 'offline'", description: 'A presence dot in the corner.' },
  { name: 'src', type: 'string', description: 'Optional photo. Initials stay the default.' },
  { name: 'decorative', type: 'boolean', default: 'false', description: 'Hides it from screen readers when the name is written next to it.' },
  { name: 'single', type: 'boolean', default: 'false', description: 'One initial instead of two. Groups turn this on so the overlap never cuts a letter in half.' },
]
const avatarGroupProps = [
  { name: 'names', type: 'string[]', description: 'Required. Everyone in the group.' },
  { name: 'max', type: 'number', default: '4', description: 'Avatars shown before the "+N" bubble.' },
  { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'", default: "'sm'", description: 'Size of each avatar.' },
  { name: 'label', type: 'string', description: 'Accessible name. Defaults to the shown names and how many more.' },
]

/* ── Meter ──────────────────────────────────────────────────────────────── */
const balance = [
  { label: 'Profit', value: 5_120_000, color: 'var(--r-chart-1)' },
  { label: 'Total earning', value: 2_380_000, color: 'var(--r-chart-1-soft)' },
  { label: 'Total target', value: 1_921_642, color: 'var(--r-chart-track)' },
]
const levels = [
  { label: 'Internship and contract', value: 789, color: 'var(--r-chart-5)' },
  { label: 'Staff', value: 2110, color: 'var(--r-chart-1)' },
  { label: 'CEO and director', value: 382, color: 'var(--r-chart-2)' },
]
const people = (v: number) => `${formatNumber(v)} people`

const meterCode = `<script setup lang="ts">
import { RMeter } from '@/design-system'

const levels = [
  { label: 'Internship and contract', value: 789 },
  { label: 'Staff', value: 2110 },
  { label: 'CEO and director', value: 382 },
]
const people = (value: number) => \`\${value} people\`
<\/script>

<template>
  <RMeter
    :segments="[{ label: 'Profit', value: 5.1 }, { label: 'Total earning', value: 2.4 }]"
    :max="9.4"
    gradient
    :height="44"
    legend
  />

  <RMeter variant="ticks" :segments="levels" legend="list" :format="people" />
</template>`

const meterProps = [
  { name: 'variant', type: "'bar' | 'ticks'", default: "'bar'", description: 'One rounded bar with stacked segments, or a row of thin bars.' },
  { name: 'segments', type: 'MeterSegment[]', description: '{ value, label?, color? }. Colours default to the chart palette.' },
  { name: 'max', type: 'number', description: 'Full scale. Defaults to the sum of the segments.' },
  { name: 'gradient', type: 'boolean', default: 'false', description: 'A soft left-to-right gradient on each segment, with faint ruler lines.' },
  { name: 'height', type: 'number', description: 'Thickness in px. 12 for bar, 40 for ticks.' },
  { name: 'ticks', type: 'number', default: '56', description: 'How many thin bars the ticks variant draws.' },
  { name: 'legend', type: "boolean | 'inline' | 'list'", default: 'false', description: 'Inline dots under the bar, or a list with values and shares.' },
  { name: 'format', type: '(value: number) => string', description: 'Formats values in the list legend.' },
  { name: 'label', type: 'string', description: 'Accessible summary. Defaults to each label with its share.' },
]

/* ── Table ──────────────────────────────────────────────────────────────── */
type Status = 'Pending' | 'In progress' | 'Done'
interface Project {
  id: number
  name: string
  type: string
  client: string
  team: string[]
  budget: number
  status: Status
}

const projects: Project[] = [
  { id: 1, name: 'Travearth', type: 'Travel app', client: 'Nurul Travel', team: ['Nurul Aini', 'Dimas Putra', 'Sekar Ayu'], budget: 24800, status: 'Pending' },
  { id: 2, name: 'Nganter', type: 'Courier logistics app', client: 'Agus Cargo', team: ['Agus Salim', 'Rani Wijaya'], budget: 31200, status: 'Pending' },
  { id: 3, name: 'Aturuang', type: 'Finance website', client: 'Handayani Finance', team: ['Bessie Cooper', 'Jenny Wilson', 'Kathryn Murphy', 'Marvin McKinney', 'Kristin Watson'], budget: 18450, status: 'In progress' },
  { id: 4, name: 'Andromeda', type: 'Finance website', client: 'Andromeda', team: ['Arthur Sjorgen', 'Kristin Watson'], budget: 12900, status: 'In progress' },
  { id: 5, name: 'Lahagency', type: 'Company profile', client: 'Lah Agency', team: ['Tyra Dhillon', 'Britni Lando', 'Kevin Chen'], budget: 8600, status: 'Done' },
  { id: 6, name: 'Alasturu', type: 'Ecommerce', client: 'Jodir Furniture', team: ['Josh Ryan', 'Chiseko Chuta'], budget: 42300, status: 'Done' },
  { id: 7, name: 'Apalagi', type: 'Finance website', client: 'Teguh Santoso', team: ['Maya Lestari', 'Rizky Pratama', 'Lina Hartono'], budget: 15750, status: 'In progress' },
  { id: 8, name: 'Coinmu', type: 'Cryptocurrency', client: 'Coinmu', team: ['Budi Gunawan', 'Citra Dewi', 'Eko Prasetyo', 'Fajar Nugroho'], budget: 56900, status: 'Done' },
]

const statusTone: Record<Status, Tone> = { Pending: 'warning', 'In progress': 'brand', Done: 'success' }
const statusOrder: Status[] = ['Pending', 'In progress', 'Done']

const columns: TableColumn[] = [
  { key: 'name', label: 'Project', sortable: true },
  { key: 'type', label: 'Type', sortable: true },
  { key: 'client', label: 'Client', sortable: true },
  { key: 'team', label: 'Team' },
  { key: 'budget', label: 'Budget', sortable: true, numeric: true, format: (value: number) => formatCurrency(value) },
  { key: 'status', label: 'Status', sortable: true, sortValue: (row) => statusOrder.indexOf(row.status) },
  { key: 'actions', label: 'Actions', align: 'right', width: '64px' },
]

const selected = ref<(string | number)[]>([3, 4])
const sort = ref<TableSort | null>({ key: 'budget', direction: 'desc' })
const density = ref<string | number>('comfortable')
const sticky = ref(false)
const densities = [
  { label: 'Comfortable', value: 'comfortable' },
  { label: 'Compact', value: 'compact' },
]
const sortText = computed(() => {
  if (!sort.value) return 'Click a column header to sort.'
  const column = columns.find((c) => c.key === sort.value!.key)
  return `Sorted by ${column?.label.toLowerCase()}, ${sort.value.direction === 'asc' ? 'ascending' : 'descending'}.`
})
const emptyQuery = ref<string | number | null>('Nebula')

const tableCode = `<script setup lang="ts">
import { ref } from 'vue'
import { RBadge, RTable, type TableColumn, type TableSort } from '@/design-system'

const columns: TableColumn[] = [
  { key: 'name', label: 'Project', sortable: true },
  { key: 'client', label: 'Client', sortable: true },
  { key: 'budget', label: 'Budget', sortable: true, numeric: true },
  { key: 'status', label: 'Status' },
]
const projects = [
  { id: 1, name: 'Travearth', client: 'Nurul Travel', budget: 24800, status: 'Pending' },
  { id: 2, name: 'Aturuang', client: 'Handayani Finance', budget: 18450, status: 'Done' },
]
const selected = ref<(string | number)[]>([])
const sort = ref<TableSort | null>(null)
const rowLabel = (row: Record<string, any>) => row.name
<\/script>

<template>
  <RTable
    v-model:selected="selected"
    v-model:sort="sort"
    :columns="columns"
    :rows="projects"
    selectable
    :row-label="rowLabel"
  >
    <template #cell-status="{ value }">
      <RBadge :tone="value === 'Done' ? 'success' : 'warning'" dot>{{ value }}</RBadge>
    </template>
  </RTable>
</template>`

const tableProps = [
  { name: 'columns', type: 'TableColumn[]', description: '{ key, label, align?, width?, sortable?, numeric?, sortValue?, format? }' },
  { name: 'rows', type: 'Record<string, any>[]', description: 'The data. Each row needs a stable key.' },
  { name: 'rowKey', type: 'string | (row) => string | number', default: "'id'", description: 'Property or function that gives each row its key.' },
  { name: 'selectable', type: 'boolean', default: 'false', description: 'Adds a checkbox column with select all (it shows a dash when only some rows are picked).' },
  { name: 'v-model:selected', type: '(string | number)[]', default: '[]', description: 'Keys of the selected rows. Selected rows get the brand tint.' },
  { name: 'v-model:sort', type: '{ key, direction } | null', default: 'null', description: 'Clicking a sortable header cycles ascending, descending, off.' },
  { name: 'manualSort', type: 'boolean', default: 'false', description: 'Sort somewhere else (e.g. on the server). The table only reports sort changes.' },
  { name: 'density', type: "'compact' | 'comfortable'", default: "'comfortable'", description: '44 or 56px rows.' },
  { name: 'stickyHeader', type: 'boolean', default: 'false', description: 'Keeps the header in view. Needs maxHeight so the table scrolls on its own.' },
  { name: 'maxHeight', type: 'string', description: 'Any CSS length, e.g. "320px".' },
  { name: 'emptyText', type: 'string', default: "'Nothing to show yet.'", description: 'Shown when there are no rows and no empty slot.' },
  { name: 'caption', type: 'string', description: 'Read by screen readers, not shown.' },
  { name: 'rowLabel', type: '(row) => string', description: 'Names each row checkbox, e.g. "Select Travearth".' },
]

/* ── Kbd ────────────────────────────────────────────────────────────────── */
const shortcuts = [
  { label: 'Open the command menu', keys: ['mod', 'K'] },
  { label: 'Search this page', keys: ['/'] },
  { label: 'New project', keys: ['shift', 'mod', 'N'] },
  { label: 'Move through results', keys: ['up', 'down'] },
  { label: 'Open the selected result', keys: ['enter'] },
  { label: 'Close', keys: ['esc'] },
]
const searchDemo = ref<string | number | null>('')

const kbdCode = `<script setup lang="ts">
import { CornerDownLeft } from 'lucide-vue-next'
import { RKbd } from '@/design-system'
<\/script>

<template>
  <RKbd :keys="['mod', 'K']" />
  <RKbd size="lg"><CornerDownLeft /></RKbd>
</template>`

const kbdProps = [
  { name: 'keys', type: 'string[]', description: 'Named keys (mod, shift, alt, ctrl, enter, esc, up, down, left, right, backspace, tab, space) adapt to the platform. Anything else is shown as written.' },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: '18, 20 or 26px tall.' },
]
</script>

<template>
  <DocPage
    eyebrow="Components"
    title="Data display"
    lead="Cards, numbers, statuses, people and tables. The references spend most of their attention here, so these components carry most of Rapi's character."
  >
    <!-- ── Card ───────────────────────────────────────────────────────── -->
    <DocSection
      id="card"
      title="Card"
      description="The container for almost everything on a dashboard. Surface is the default. Brand and flame are the loud cards, for the one number that matters most on a screen. Ink is a dark island that stays dark in both themes."
    >
      <Demo title="Variants" surface="plain">
        <div class="dd-cards">
          <RCard title="Total insight">
            <template #actions>
              <RIconButton label="Open insight report"><ArrowUpRight /></RIconButton>
            </template>
            <RStat :value="129521" :trend="-1.2" trend-label="than last month" />
          </RCard>
          <RCard variant="brand" title="Overall revenue">
            <template #actions>
              <RIconButton label="Open revenue report" variant="soft"><ArrowUpRight /></RIconButton>
            </template>
            <RStat :value="25912" prefix="$" :trend="1.9" trend-label="than last month" />
          </RCard>
          <RCard variant="flame" title="Statistics">
            <template #actions>
              <RIconButton label="Open statistics" variant="soft"><ArrowUpRight /></RIconButton>
            </template>
            <RStat :value="184.44" prefix="$" :decimals="2" size="md" />
            <RSparkline :values="[42, 48, 44, 39, 46, 58, 72, 64, 61, 55]" color="var(--r-text)" :height="44" class="dd-bottom" />
          </RCard>
          <RCard title="Payment templates">
            <RStat :value="486.32" prefix="$" :decimals="2" muted-decimals size="md" />
            <RCard variant="muted" padding="sm" title="Mandatory payments" subtitle="Essential dues" title-as="h4" class="dd-well">
              <template #actions>
                <RIconButton label="Open mandatory payments" size="sm"><ArrowUpRight /></RIconButton>
              </template>
              <RAvatarGroup :names="payers" :max="3" size="md" />
            </RCard>
          </RCard>
          <RCard variant="outline" title="Spend limit" subtitle="Resets on the 1st of the month">
            <RStat :value="12000" prefix="$" size="md" />
            <RMeter :segments="[{ label: 'Spent', value: 7340 }]" :max="12000" :height="8" label="7,340 of 12,000 dollars spent" />
          </RCard>
          <RCard variant="ink" title="Weekly revenue">
            <RStat :value="2332" prefix="+" unit="USD" :trend="12" trend-label="this week" size="md" />
          </RCard>
        </div>
      </Demo>

      <div class="doc-grid doc-grid--2">
        <Demo title="Header, actions and footer" surface="plain">
          <RCard title="Recent activity" subtitle="Outgoing products, last 7 days" class="dd-wide">
            <template #actions>
              <RButton size="sm" variant="outline">View all</RButton>
              <RIconButton label="More options" variant="ghost" size="sm"><MoreHorizontal /></RIconButton>
            </template>
            <ul class="dd-list">
              <li v-for="item in outgoing" :key="item.name">
                <span class="dd-list__icon"><Package /></span>
                <span class="dd-list__text">
                  <span>{{ item.name }}</span>
                  <span class="doc-label">{{ item.meta }}</span>
                </span>
                <span class="dd-list__amount">{{ formatCurrency(item.amount) }}</span>
              </li>
            </ul>
            <template #footer>
              <span class="doc-label">Updated 2 minutes ago</span>
              <RButton size="sm" variant="ghost" class="dd-push">
                <template #leading><RefreshCw /></template>
                Refresh
              </RButton>
            </template>
          </RCard>
        </Demo>
        <Demo title="Interactive" note="Rendered as buttons, so they work with the keyboard." surface="plain" stack>
          <div class="dd-quick">
            <RCard
              v-for="link in quickLinks"
              :key="link.label"
              as="button"
              type="button"
              interactive
              padding="sm"
              class="dd-quick__card"
              @click="lastQuick = link.label"
            >
              <component :is="link.icon" class="dd-quick__icon" />
              <span>{{ link.label }}</span>
            </RCard>
          </div>
          <p class="doc-label" aria-live="polite">{{ lastQuick ? `You picked ${lastQuick}.` : 'Nothing picked yet.' }}</p>
        </Demo>
      </div>

      <CodeBlock :code="cardCode" title="Usage" />
      <PropsTable :rows="cardProps" caption="RCard props" />
      <p class="doc-p">
        Slots: <code class="doc-c">default</code> for the body, <code class="doc-c">header</code> to replace the title
        block, <code class="doc-c">actions</code> for the top-right corner and <code class="doc-c">footer</code>, which
        sticks to the bottom.
      </p>

      <DoDont
        do="Give a screen one loud card at most, for the number that matters most."
        dont="Fill a dashboard with brand and flame cards. Once everything is coloured, the colour stops meaning anything."
      >
        <template #do-example>
          <div class="dd-mini">
            <span class="dd-mini__card dd-mini__card--brand" />
            <span class="dd-mini__card" />
            <span class="dd-mini__card" />
          </div>
        </template>
        <template #dont-example>
          <div class="dd-mini">
            <span class="dd-mini__card dd-mini__card--brand" />
            <span class="dd-mini__card dd-mini__card--flame" />
            <span class="dd-mini__card dd-mini__card--brand" />
          </div>
        </template>
      </DoDont>
    </DocSection>

    <!-- ── Stat ───────────────────────────────────────────────────────── -->
    <DocSection
      id="stat"
      title="Stat"
      description="A big number with its label, unit and change. Figures are tabular, so stacked stats line up, and a long number shrinks to fit a narrow card instead of spilling out of it."
    >
      <Demo title="Sizes" surface="plain">
        <div class="dd-stats">
          <RStat label="Leads by sales" :value="1802" size="md" />
          <RStat label="Total members" :value="2521" />
          <RStat label="Finance balance" :value="9421642" prefix="$" size="xl" />
        </div>
      </Demo>
      <div class="doc-grid doc-grid--2">
        <Demo title="Units and decimals" surface="plain" stack>
          <RStat label="Heart rate" value="40–189" unit="bpm" />
          <RStat label="Avg. energy activity" :value="2589" unit="kcal" />
          <RStat label="Card balance" :value="22428.26" prefix="$" :decimals="2" muted-decimals />
        </Demo>
        <Demo title="Trends" surface="plain" stack>
          <RStat label="Overall revenue" :value="25912" prefix="$" :trend="1.9" trend-label="than last month" />
          <RStat label="Total insight" :value="129521" :trend="-1.2" trend-label="than last month" />
          <RStat label="Churn" :value="2.4" suffix="%" :decimals="1" :trend="-0.6" invert-trend trend-label="lower is better" size="md" />
        </Demo>
      </div>
      <Demo title="Count up" note="Counts from the old value to the new one. With reduced motion it just changes." surface="plain">
        <RStat label="Revenue today" :value="revenue" prefix="$" :decimals="2" muted-decimals size="xl" animate class="dd-grow" />
        <RButton variant="outline" @click="shuffleRevenue">Change the number</RButton>
      </Demo>

      <CodeBlock :code="statCode" title="Usage" />
      <PropsTable :rows="statProps" caption="RStat props" />
      <p class="doc-p">
        Slots: <code class="doc-c">label</code> replaces the label text, <code class="doc-c">footer</code> adds anything
        after the trend.
      </p>

      <DoDont
        do="Put the unit in the unit prop, so it stays smaller and quieter than the number."
        dont="Write the unit into the value string. The number loses its hierarchy and its tabular alignment."
      >
        <template #do-example>
          <RStat :value="2589" unit="kcal" size="md" />
        </template>
        <template #dont-example>
          <RStat value="2,589 kcal" size="md" />
        </template>
      </DoDont>
    </DocSection>

    <!-- ── Trend ──────────────────────────────────────────────────────── -->
    <DocSection
      id="trend"
      title="Trend"
      description="The small change pill next to a number. Green means better and red means worse. For numbers where lower is better, like costs, churn or wait time, set invert and the colours follow."
    >
      <div class="doc-grid">
        <Demo title="Soft and plain">
          <RTrend :value="1.9" />
          <RTrend :value="-1.2" />
          <RTrend :value="0" />
          <RTrend :value="12.4" variant="plain" />
          <RTrend :value="-3.1" variant="plain" />
        </Demo>
        <Demo title="With icons and sizes">
          <RTrend :value="12.2" icon />
          <RTrend :value="-24" :precision="0" icon />
          <RTrend :value="2.8" size="sm" />
          <RTrend :value="12" suffix=" pts" :precision="0" variant="plain" icon />
        </Demo>
        <Demo title="Inverted" note="Lower is better here.">
          <span class="dd-pair">Expenses <RTrend :value="-4.2" invert /></span>
          <span class="dd-pair">Wait time <RTrend :value="12" :precision="0" invert /></span>
        </Demo>
      </div>

      <CodeBlock :code="trendCode" title="Usage" />
      <PropsTable :rows="trendProps" caption="RTrend props" />

      <DoDont
        do="Say what the change compares against, right next to it: than last month."
        dont="Colour a trend by hand. Set invert and let the component decide what counts as good."
      />
    </DocSection>

    <!-- ── Badge ──────────────────────────────────────────────────────── -->
    <DocSection
      id="badge"
      title="Badge"
      description="A short status or label. Every tone works with every variant, so a new status is a tone choice, not a new component."
    >
      <Demo title="Statuses" note="Soft with a dot, the way the references show them in tables.">
        <RBadge v-for="s in statuses" :key="s.label" :tone="s.tone" dot>{{ s.label }}</RBadge>
      </Demo>
      <div class="doc-grid doc-grid--2">
        <Demo title="Variants">
          <RBadge tone="brand">Soft</RBadge>
          <RBadge tone="brand" variant="outline">Outline</RBadge>
          <RBadge tone="brand" variant="solid">Solid</RBadge>
          <RBadge tone="danger" variant="solid">3 overdue</RBadge>
          <RBadge tone="success" variant="outline">Paid</RBadge>
        </Demo>
        <Demo title="Tags and sizes">
          <RBadge v-for="t in tags" :key="t.label" variant="outline" square>
            <template #leading><span class="dd-tag-square" :style="{ background: t.color }" /></template>
            {{ t.label }}
          </RBadge>
          <RBadge size="sm">12 projects</RBadge>
          <RBadge size="sm" tone="warning" dot>Small</RBadge>
        </Demo>
      </div>

      <CodeBlock :code="badgeCode" title="Usage" />
      <PropsTable :rows="badgeProps" caption="RBadge props" />

      <DoDont
        do="Keep the text to one or two words, and let the word carry the meaning."
        dont="Rely on colour alone. Some people can't tell the tones apart, so Done and Late must also read differently."
      />
    </DocSection>

    <!-- ── Avatar ─────────────────────────────────────────────────────── -->
    <DocSection
      id="avatar"
      title="Avatar"
      description="Initials on a soft colour. The colour comes from the name, so a person keeps the same colour on every screen, and it doesn't change when the brand does. Photos are optional."
    >
      <div class="doc-grid doc-grid--2">
        <Demo title="Sizes">
          <RAvatar name="Anastasia William" size="xs" />
          <RAvatar name="Anastasia William" size="sm" />
          <RAvatar name="Anastasia William" />
          <RAvatar name="Anastasia William" size="lg" />
          <RAvatar name="Anastasia William" size="xl" />
        </Demo>
        <Demo title="Presence">
          <RAvatar name="Kim Ji-soo" size="lg" status="online" />
          <RAvatar name="Nurul Aini" size="lg" status="away" />
          <RAvatar name="Agus Salim" size="lg" status="busy" />
          <RAvatar name="Kevin Chen" size="lg" status="offline" />
        </Demo>
      </div>
      <div class="doc-grid doc-grid--2">
        <Demo title="Eight identity colours">
          <span v-for="person in identityNames" :key="person" class="dd-person">
            <RAvatar :name="person" decorative />
            <span>{{ person }}</span>
          </span>
        </Demo>
        <Demo title="Groups" stack>
          <RAvatarGroup :names="team" :max="4" />
          <RAvatarGroup :names="team" :max="3" size="md" />
          <RAvatarGroup :names="team.slice(0, 3)" size="lg" />
        </Demo>
      </div>

      <CodeBlock :code="avatarCode" title="Usage" />
      <PropsTable :rows="avatarProps" caption="RAvatar props" />
      <h3 class="doc-h4">RAvatarGroup</h3>
      <PropsTable :rows="avatarGroupProps" caption="RAvatarGroup props" />

      <DoDont
        do="Mark an avatar decorative when the name is written right next to it, so screen readers don't say it twice."
        dont="Show a group of faces with no way to find out who they are. Give it a label or put the names in a tooltip."
      />
    </DocSection>

    <!-- ── Meter ──────────────────────────────────────────────────────── -->
    <DocSection
      id="meter"
      title="Meter"
      description="Parts of a whole on one line. The bar variant stacks segments in one rounded bar, like the finance balance in Syncrowave. The ticks variant draws a row of thin bars, like the job levels in Makaryo."
    >
      <div class="doc-grid doc-grid--2">
        <Demo title="Bar" surface="plain" stack>
          <div class="dd-meter-card">
            <span class="doc-label">Finance balance</span>
            <RStat :value="9421642" prefix="$" size="md" />
            <RMeter :segments="balance" gradient :height="44" legend />
          </div>
          <div class="dd-meter-card">
            <div class="dd-meter-row">
              <span>Storage</span>
              <span class="doc-label">6.2 of 10 GB</span>
            </div>
            <RMeter :segments="[{ label: 'Used', value: 6.2 }]" :max="10" :height="8" label="Storage, 62% used" />
          </div>
        </Demo>
        <Demo title="Ticks" surface="plain" stack>
          <div class="dd-meter-card">
            <span class="doc-label">Company job levels</span>
            <RStat :value="3281" unit="employees and staff" size="md" />
            <RMeter variant="ticks" :segments="levels" :height="56" legend="list" :format="people" />
          </div>
        </Demo>
      </div>

      <CodeBlock :code="meterCode" title="Usage" />
      <PropsTable :rows="meterProps" caption="RMeter props" />

      <DoDont
        do="Keep it to three segments or so. Past that, a bar list reads better."
        dont="Use a meter for values that don't add up to a whole, like revenue per region over time."
      />
    </DocSection>

    <!-- ── Table ──────────────────────────────────────────────────────── -->
    <DocSection
      id="table"
      title="Table"
      description="Columns you can sort, rows you can select, and a slot for any cell. On small screens the table scrolls sideways inside its container instead of squeezing the columns."
    >
      <Demo title="Projects" note="Sort by any column with a chevron. Select rows with the checkboxes." surface="plain" padding="none">
        <div class="dd-table">
          <div class="dd-table__bar">
            <div class="dd-table__title">
              <span>List project</span>
              <RBadge size="sm" dot>{{ projects.length }} projects</RBadge>
            </div>
            <div class="dd-table__controls">
              <RSegmented v-model="density" :options="densities" size="sm" label="Row density" />
              <RSwitch v-model="sticky" size="sm" label="Sticky header" />
            </div>
          </div>
          <RTable
            v-model:selected="selected"
            v-model:sort="sort"
            :columns="columns"
            :rows="projects"
            selectable
            :density="density === 'compact' ? 'compact' : 'comfortable'"
            :sticky-header="sticky"
            :max-height="sticky ? '300px' : undefined"
            :row-label="(row) => row.name"
            caption="Projects"
          >
            <template #cell-name="{ value }">
              <span class="dd-strong">{{ value }}</span>
            </template>
            <template #cell-team="{ value }">
              <RAvatarGroup :names="value" :max="3" size="xs" />
            </template>
            <template #cell-status="{ value }">
              <RBadge :tone="statusTone[value as Status]" dot>{{ value }}</RBadge>
            </template>
            <template #header-actions>
              <span class="r-sr-only">Actions</span>
            </template>
            <template #cell-actions="{ row }">
              <RIconButton :label="`More options for ${row.name}`" variant="ghost" size="sm" @click.stop>
                <MoreHorizontal />
              </RIconButton>
            </template>
          </RTable>
          <div class="dd-table__foot">
            <span>
              {{ selected.length ? `${selected.length} selected` : 'Nothing selected' }}
              <RButton v-if="selected.length" size="sm" variant="ghost" @click="selected = []">Clear</RButton>
            </span>
            <span>{{ sortText }}</span>
          </div>
        </div>
      </Demo>

      <Demo title="Empty" note="The empty slot is the place to explain why and offer a way out." surface="plain" padding="none">
        <div class="dd-table">
          <div class="dd-table__bar">
            <RInput v-model="emptyQuery" placeholder="Search projects" aria-label="Search projects" clearable class="dd-search" />
          </div>
          <RTable :columns="columns.slice(0, 3)" :rows="[]" caption="Projects matching the search">
            <template #empty>
              <div class="dd-empty">
                <Inbox class="dd-empty__icon" />
                <p class="dd-empty__title">No projects match “{{ emptyQuery }}”</p>
                <p class="doc-label">Check the spelling, or search by client instead.</p>
                <RButton size="sm" variant="outline" @click="emptyQuery = ''">Clear search</RButton>
              </div>
            </template>
          </RTable>
        </div>
      </Demo>

      <CodeBlock :code="tableCode" title="Usage" />
      <PropsTable :rows="tableProps" caption="RTable props" />
      <p class="doc-p">
        Slots: <code class="doc-c">cell-{key}</code> gets <code class="doc-c">{ row, value, index }</code>,
        <code class="doc-c">header-{key}</code> gets <code class="doc-c">{ column }</code>, and
        <code class="doc-c">empty</code> replaces the empty message. The <code class="doc-c">row-click</code> event
        gives you the row and its index, and turns the cursor into a pointer.
      </p>

      <DoDont
        do="Right-align numbers and mark the column numeric, so the figures line up digit by digit."
        dont="Truncate the first column to fit everything on screen. It's the column people scan; let the others scroll."
      />
    </DocSection>

    <!-- ── Kbd ────────────────────────────────────────────────────────── -->
    <DocSection
      id="kbd"
      title="Keyboard key"
      description="Shows a key or a shortcut. Named keys adapt to the platform: mod is ⌘ on a Mac and Ctrl elsewhere. Screen readers hear the key's name, not the symbol."
    >
      <div class="doc-grid doc-grid--2">
        <Demo title="Shortcuts" surface="plain" stack>
          <dl class="dd-shortcuts">
            <div v-for="s in shortcuts" :key="s.label">
              <dt>{{ s.label }}</dt>
              <dd><RKbd :keys="s.keys" /></dd>
            </div>
          </dl>
        </Demo>
        <Demo title="Sizes and context" stack>
          <div class="doc-row">
            <RKbd :keys="['mod', 'K']" size="sm" />
            <RKbd :keys="['mod', 'K']" />
            <RKbd :keys="['mod', 'K']" size="lg" />
          </div>
          <RInput v-model="searchDemo" placeholder="Search anything" aria-label="Search anything">
            <template #trailing><RKbd :keys="['mod', 'K']" /></template>
          </RInput>
          <div class="dd-hints">
            <span><RKbd size="lg"><ArrowUp /></RKbd><RKbd size="lg"><ArrowDown /></RKbd> to navigate</span>
            <span><RKbd size="lg"><CornerDownLeft /></RKbd> to select</span>
            <span><RKbd size="lg">esc</RKbd> to close</span>
          </div>
        </Demo>
      </div>

      <CodeBlock :code="kbdCode" title="Usage" />
      <PropsTable :rows="kbdProps" caption="RKbd props" />
      <p class="doc-p">Without <code class="doc-c">keys</code>, the default slot renders a single key, which is handy for an icon.</p>

      <DoDont
        do="Show shortcuts where people look for them: in menus, tooltips and search fields."
        dont="Write Cmd or Ctrl by hand. Use mod, and each platform sees its own key."
      />
    </DocSection>
  </DocPage>
</template>

<style>
.dd-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(260px, 100%), 1fr));
  gap: 16px;
  width: 100%;
}

.dd-wide {
  width: 100%;
}

.dd-well {
  border-radius: var(--r-radius-lg);
}

.dd-bottom {
  margin-top: auto;
}

.dd-list {
  display: flex;
  flex-direction: column;
}
.dd-list li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
}
.dd-list li + li {
  border-top: 1px solid var(--r-border-subtle);
}
.dd-list__icon {
  display: inline-grid;
  flex-shrink: 0;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: var(--r-radius-md);
  background: var(--r-bg-muted);
  color: var(--r-text-secondary);
}
.dd-list__icon svg {
  width: 18px;
  height: 18px;
}
.dd-list__text {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
}
.dd-list__amount {
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
}

.dd-push {
  margin-left: auto;
}

.dd-quick {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  width: 100%;
}
.dd-quick__card {
  align-items: center;
  justify-content: center;
  gap: 10px !important;
  min-height: 108px;
  font: inherit;
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
  text-align: center;
}
.dd-quick__icon {
  width: 24px;
  height: 24px;
  color: var(--r-text-secondary);
}

.dd-mini {
  display: flex;
  gap: 8px;
}
.dd-mini__card {
  width: 64px;
  height: 44px;
  border: 1px solid var(--r-border);
  border-radius: 10px;
  background: var(--r-bg-surface);
}
.dd-mini__card--brand {
  border-color: transparent;
  background: linear-gradient(140deg, var(--r-feature-brand-from), var(--r-feature-brand-to));
}
.dd-mini__card--flame {
  border-color: transparent;
  background: linear-gradient(150deg, var(--r-feature-flame-from), var(--r-feature-flame-to));
}

.dd-stats {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 24px 48px;
  width: 100%;
}

.dd-grow {
  flex: 1 1 260px;
}

.dd-pair {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: var(--r-text-sm);
}

.dd-tag-square {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}

.dd-person {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 170px;
  font-size: var(--r-text-sm);
}

.dd-meter-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  border: 1px solid var(--r-border-subtle);
  border-radius: var(--r-radius-xl);
  background: var(--r-bg-surface);
}
.dd-meter-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
}

.dd-table {
  width: 100%;
  min-width: 0;
  background: var(--r-bg-surface);
}
.dd-table__bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 16px;
  padding: 16px 20px;
}
.dd-table__title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-semibold);
}
.dd-table__controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
}
.dd-table__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
  min-height: 52px;
  padding: 8px 20px;
  border-top: 1px solid var(--r-border-subtle);
  color: var(--r-text-tertiary);
  font-size: var(--r-text-sm);
}
.dd-table__foot > span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.dd-strong {
  font-weight: var(--r-weight-medium);
}
.dd-search {
  width: min(320px, 100%);
}

.dd-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 40px 16px 44px;
  text-align: center;
}
.dd-empty__icon {
  width: 28px;
  height: 28px;
  margin-bottom: 6px;
  color: var(--r-text-tertiary);
}
.dd-empty__title {
  color: var(--r-text);
  font-weight: var(--r-weight-semibold);
}
.dd-empty .r-button {
  margin-top: 10px;
}

.dd-shortcuts {
  display: flex;
  flex-direction: column;
  width: 100%;
  border: 1px solid var(--r-border-subtle);
  border-radius: var(--r-radius-lg);
  background: var(--r-bg-surface);
}
.dd-shortcuts > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 11px 16px;
  font-size: var(--r-text-sm);
}
.dd-shortcuts > div + div {
  border-top: 1px solid var(--r-border-subtle);
}
.dd-shortcuts dd {
  margin: 0;
}

.dd-hints {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 18px;
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
}
.dd-hints > span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
</style>
