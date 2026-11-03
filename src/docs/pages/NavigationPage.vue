<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  Activity,
  Banknote,
  BookOpen,
  Building2,
  CalendarDays,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Settings,
  Store,
  Truck,
  UserRound,
  Users,
  Wallet,
} from 'lucide-vue-next'
import { RBadge, RNavItem, RPagination, RTabs, RTooltip, formatNumber } from '@/design-system'
import DocPage from '../components/DocPage.vue'
import DocSection from '../components/DocSection.vue'
import Demo from '../components/Demo.vue'
import CodeBlock from '../components/CodeBlock.vue'
import PropsTable from '../components/PropsTable.vue'
import DoDont from '../components/DoDont.vue'
import type { PropRow } from '../types'

/* ── Nav item ─────────────────────────────────────────────────────────────── */
const mainMenu = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Company', icon: Building2 },
  { label: 'Client', icon: UserRound },
  { label: 'Vendor', icon: Store },
  { label: 'Project', icon: FolderKanban },
  { label: 'Employee', icon: Users },
]
const financial = [
  { label: 'Asset', icon: Wallet },
  { label: 'Journal', icon: BookOpen },
  { label: 'Supply', icon: Truck },
  { label: 'Payroll', icon: Banknote },
]
const solidActive = ref('Project')

const calendarMenu = [
  { label: 'Inbox', icon: Inbox, badge: 4 },
  { label: 'Calendar', icon: CalendarDays },
  { label: 'Team', icon: Users },
  { label: 'Reports', icon: Activity, badge: 'New', badgeTone: 'brand' as const },
]
const softActive = ref('Calendar')

const rail = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Projects', icon: FolderKanban },
  { label: 'Calendar', icon: CalendarDays },
  { label: 'Payroll', icon: Banknote },
  { label: 'Settings', icon: Settings },
]
const railActive = ref('Projects')

const navItemCode = `<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { LayoutDashboard } from 'lucide-vue-next'
import { RNavItem } from '@/design-system'

const route = useRoute()
<\/script>

<template>
  <RNavItem
    :as="RouterLink"
    to="/dashboard"
    :icon="LayoutDashboard"
    label="Dashboard"
    :active="route.path === '/dashboard'"
  />
</template>`

const navItemProps: PropRow[] = [
  { name: 'label', type: 'string', description: 'The visible text. When collapsed it becomes the accessible name and a native title.' },
  { name: 'icon', type: 'Component', description: 'A Lucide icon (or any component) shown before the label.' },
  { name: 'badge', type: 'string | number', description: 'A count or short tag on the right, like unread items.' },
  { name: 'badgeTone', type: 'Tone', default: "'neutral'", description: 'Neutral counts are quiet; any other tone is filled.' },
  { name: 'active', type: 'boolean', default: 'false', description: 'Marks the current page and sets aria-current="page".' },
  { name: 'variant', type: "'soft' | 'solid'", default: "'soft'", description: 'Soft is a grey row with a 2px ink rule on its leading edge; solid fills the active item with ink.' },
  { name: 'as', type: 'string | Component', default: "'a'", description: "What to render: 'a', 'button', or a component such as RouterLink. Extra attributes like to or href pass straight through." },
  { name: 'collapsed', type: 'boolean', default: 'false', description: 'Icon only, for narrow rails. Pair it with a tooltip.' },
  { name: '#trailing', type: 'slot', description: 'Anything after the label, such as a chevron for a group that expands.' },
]

/* ── Tabs ─────────────────────────────────────────────────────────────────── */
const paymentsTab = ref<string | number>('all')
const payments = [
  { id: 'INV-2041', client: 'Airbnb General', amount: 1250, status: 'paid' },
  { id: 'INV-2042', client: 'Stripe Atlas', amount: 480, status: 'pending' },
  { id: 'INV-2043', client: 'Uber Freight', amount: 2310, status: 'overdue' },
  { id: 'INV-2044', client: 'Airbnb General', amount: 760, status: 'paid' },
  { id: 'INV-2045', client: 'Figma', amount: 312, status: 'pending' },
  { id: 'INV-2046', client: 'Mailchimp', amount: 95, status: 'paid' },
]
const paymentTabs = computed(() => [
  { label: 'All payments', value: 'all', count: payments.length },
  { label: 'Pending', value: 'pending', count: payments.filter((p) => p.status === 'pending').length },
  { label: 'Paid', value: 'paid', count: payments.filter((p) => p.status === 'paid').length },
  { label: 'Overdue', value: 'overdue', count: payments.filter((p) => p.status === 'overdue').length },
  { label: 'Refunds', value: 'refunds', disabled: true },
])
const visiblePayments = computed(() =>
  paymentsTab.value === 'all' ? payments : payments.filter((p) => p.status === paymentsTab.value),
)
const statusTone = { paid: 'success', pending: 'warning', overdue: 'danger' } as const

const settingsTab = ref<string | number>('overview')
const settingsTabs = [
  { label: 'Overview', value: 'overview', icon: LayoutGrid },
  { label: 'Activity', value: 'activity', icon: Activity },
  { label: 'Settings', value: 'settings', icon: Settings },
]
const settingsCopy: Record<string, string> = {
  overview: 'Twelve projects, three of them due this week. Nothing is blocked.',
  activity: 'Kim moved “Travearth” to Done two hours ago. Agus left a comment on “Nganter”.',
  settings: 'Notifications go to the project channel. Weekly digest on Mondays at 9:00.',
}

const tabsCode = `<script setup lang="ts">
import { ref } from 'vue'
import { RTabs } from '@/design-system'

const tab = ref('all')
const items = [
  { label: 'All payments', value: 'all', count: 128 },
  { label: 'Pending', value: 'pending', count: 12 },
  { label: 'Paid', value: 'paid', count: 104 },
]
<\/script>

<template>
  <RTabs v-model="tab" :items="items" label="Payments">
    <template #default="{ value }">
      <PaymentsList :status="value" />
    </template>
  </RTabs>
</template>`

const tabsProps: PropRow[] = [
  { name: 'v-model', type: 'string | number', description: 'The value of the selected tab.' },
  { name: 'items', type: 'TabItem[]', description: 'Each item has label, value, and optionally count, icon and disabled.' },
  { name: 'size', type: "'sm' | 'md'", default: "'md'", description: 'A 32 or 40px tab row, with 13 or 14px labels.' },
  { name: 'label', type: 'string', description: 'Accessible name for the tab list, e.g. “Payments”.' },
  { name: 'id', type: 'string', default: 'auto', description: 'Prefix for the tab and panel ids. Generated when left out.' },
  { name: '#default', type: 'slot { value }', description: 'The panel. Rendered inside role="tabpanel" and linked to the selected tab.' },
]

/* ── Pagination ───────────────────────────────────────────────────────────── */
const page = ref(2)
const smallPage = ref(1)
const widePage = ref(48)
const pageSize = 12
const total = 1440
const rangeText = computed(() => {
  const from = (page.value - 1) * pageSize + 1
  const to = Math.min(total, page.value * pageSize)
  return `Showing ${formatNumber(from)}–${formatNumber(to)} of ${formatNumber(total)} projects`
})

const paginationCode = `<script setup lang="ts">
import { ref } from 'vue'
import { RPagination } from '@/design-system'

const page = ref(1)
<\/script>

<template>
  <RPagination v-model="page" :page-count="120" />
</template>`

const paginationProps: PropRow[] = [
  { name: 'v-model', type: 'number', default: '1', description: 'The current page, starting at 1.' },
  { name: 'pageCount', type: 'number', description: 'How many pages there are.' },
  { name: 'siblings', type: 'number', default: '1', description: 'Pages shown on each side of the current one before an ellipsis.' },
  { name: 'size', type: "'sm' | 'md'", default: "'md'", description: '24 or 28px square buttons.' },
  { name: 'label', type: 'string', default: "'Pagination'", description: 'Accessible name for the nav landmark. Change it when a page has two.' },
]
</script>

<template>
  <DocPage
    eyebrow="Components"
    title="Navigation"
    lead="How people move around: sidebar rows, tabs inside a view, and pages of a long list. The active state is always more than a change of text colour: an ink rule, an ink fill or an underline."
  >
    <DocSection
      id="nav-item"
      title="Nav item"
      description="One square 32px row in a sidebar. It renders whatever you pass to as, so the same row works as a RouterLink, a plain link or a button, and the library never depends on vue-router."
    >
      <div class="nav-demos">
        <Demo title="Solid" note="The ink fill says where you are.">
          <div class="nav-demo-sidebar">
            <div class="nav-demo-sidebar__brand">
              <span class="nav-demo-sidebar__logo" aria-hidden="true">F</span>
              Finanzen
            </div>
            <p class="nav-demo-sidebar__group">Main menu</p>
            <RNavItem
              v-for="item in mainMenu"
              :key="item.label"
              as="button"
              type="button"
              variant="solid"
              :icon="item.icon"
              :label="item.label"
              :active="solidActive === item.label"
              @click="solidActive = item.label"
            />
            <p class="nav-demo-sidebar__group">Financial</p>
            <RNavItem
              v-for="item in financial"
              :key="item.label"
              as="button"
              type="button"
              variant="solid"
              :icon="item.icon"
              :label="item.label"
              :active="solidActive === item.label"
              @click="solidActive = item.label"
            />
            <div class="nav-demo-sidebar__foot">
              <RNavItem as="button" type="button" :icon="LogOut" label="Log out" />
            </div>
          </div>
        </Demo>

        <Demo title="Soft, with counts" note="A grey row and an ink rule. Quieter, for apps where the content does the talking.">
          <div class="nav-demo-sidebar">
            <div class="nav-demo-sidebar__brand">
              <span class="nav-demo-sidebar__logo nav-demo-sidebar__logo--soft" aria-hidden="true">O</span>
              Ofative
            </div>
            <RNavItem
              v-for="item in calendarMenu"
              :key="item.label"
              as="button"
              type="button"
              :icon="item.icon"
              :label="item.label"
              :badge="item.badge"
              :badge-tone="item.badgeTone"
              :active="softActive === item.label"
              @click="softActive = item.label"
            />
          </div>
        </Demo>

        <Demo title="Collapsed rail" note="Icon only, with a tooltip for the name.">
          <div class="nav-demo-rail">
            <RTooltip v-for="item in rail" :key="item.label" :content="item.label" placement="right" :describe="false">
              <RNavItem
                as="button"
                type="button"
                collapsed
                :icon="item.icon"
                :label="item.label"
                :active="railActive === item.label"
                @click="railActive = item.label"
              />
            </RTooltip>
          </div>
        </Demo>
      </div>

      <CodeBlock :code="navItemCode" title="Sidebar link with vue-router" />
      <PropsTable :rows="navItemProps" caption="RNavItem props" />
      <DoDont
        do="Pick one active style per sidebar and keep it: solid when the sidebar is the main way around, soft when the content should lead."
        dont="Don't mark two items active or use the solid fill for hover. The fill means “you are here” and nothing else."
      />
    </DocSection>

    <DocSection
      id="tabs"
      title="Tabs"
      description="Switch between views of the same thing. A 2px ink rule slides under the selected tab, counts sit in mono tags, and the arrow keys move between tabs (Home and End jump to the ends)."
    >
      <Demo title="With counts" note="Payment views. Refunds is disabled." stack>
        <div class="nav-tabs-card">
          <RTabs v-model="paymentsTab" :items="paymentTabs" label="Payments">
            <template #default="{ value }">
              <ul class="nav-payments" :aria-label="`Payments: ${value}`">
                <li v-for="payment in visiblePayments" :key="payment.id">
                  <span class="nav-payments__id">{{ payment.id }}</span>
                  <span class="nav-payments__client">{{ payment.client }}</span>
                  <RBadge :tone="statusTone[payment.status as keyof typeof statusTone]" dot size="sm">
                    {{ payment.status[0].toUpperCase() + payment.status.slice(1) }}
                  </RBadge>
                  <span class="nav-payments__amount">${{ formatNumber(payment.amount) }}</span>
                </li>
              </ul>
            </template>
          </RTabs>
        </div>
      </Demo>

      <Demo title="Small, with icons" stack>
        <div class="nav-tabs-card">
          <RTabs v-model="settingsTab" :items="settingsTabs" size="sm" label="Project">
            <template #default="{ value }">
              <p class="nav-tabs-copy">{{ settingsCopy[String(value)] }}</p>
            </template>
          </RTabs>
        </div>
      </Demo>

      <CodeBlock :code="tabsCode" />
      <PropsTable :rows="tabsProps" caption="RTabs props" />
      <DoDont
        do="Use tabs when each view is a different slice of the same data, and keep the labels short and parallel."
        dont="Don't use tabs as filters that combine, or for actions. Chips and a segmented control are better at that."
      />
    </DocSection>

    <DocSection
      id="pagination"
      title="Pagination"
      description="Pages of a long list, on square 28px keys with mono figures. The current page is filled with ink, gaps collapse into an ellipsis, and Previous and Next stay put so they don't jump while you click."
    >
      <Demo title="Table footer" stack>
        <div class="nav-pagination-footer">
          <span class="nav-pagination-footer__range">{{ rangeText }}</span>
          <RPagination v-model="page" :page-count="Math.ceil(total / pageSize)" label="Projects pages" />
        </div>
      </Demo>

      <div class="doc-grid doc-grid--2">
        <Demo title="Few pages, small" center>
          <RPagination v-model="smallPage" :page-count="5" size="sm" label="Small example pages" />
        </Demo>
        <Demo title="Two siblings" center>
          <RPagination v-model="widePage" :page-count="120" :siblings="2" label="Wide example pages" />
        </Demo>
      </div>

      <CodeBlock :code="paginationCode" />
      <PropsTable :rows="paginationProps" caption="RPagination props" />
      <DoDont
        do="Say how many items there are next to the pages, so people know how far the list goes."
        dont="Don't paginate short lists. Under a hundred rows, a single scrolling table is easier to scan."
      />
    </DocSection>
  </DocPage>
</template>

<style>
.nav-demos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(250px, 100%), 1fr));
  gap: 16px;
  align-items: start;
}

.nav-demo-sidebar {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  padding: 12px 8px;
  border: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}

.nav-demo-sidebar__brand {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px 12px;
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-tight);
}

.nav-demo-sidebar__logo {
  display: inline-grid;
  place-items: center;
  width: 24px;
  height: 24px;
  background: var(--r-brand);
  color: var(--r-on-brand);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-bold);
}
.nav-demo-sidebar__logo--soft {
  background: var(--r-ink);
  color: var(--r-on-ink);
}

/* Group labels in the label voice, like the docs sidebar. */
.nav-demo-sidebar__group {
  padding: 14px 10px 6px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.nav-demo-sidebar__foot {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--r-border-subtle);
}

.nav-demo-rail {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  border: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}

.nav-tabs-card {
  min-width: 0;
  max-width: 100%;
  padding: 4px 20px 20px;
  border: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}

.nav-payments {
  display: flex;
  flex-direction: column;
}
.nav-payments li {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr) auto 80px;
  align-items: center;
  gap: 12px;
  min-height: 48px;
  border-bottom: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-sm);
}
.nav-payments li:last-child {
  border-bottom: 0;
}
.nav-payments__id {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
}
.nav-payments__client {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.nav-payments__amount {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

@media (max-width: 520px) {
  .nav-payments li {
    grid-template-columns: minmax(0, 1fr) auto;
    row-gap: 2px;
    padding: 8px 0;
  }
  .nav-payments__id {
    grid-column: 1 / -1;
    font-size: var(--r-text-xs);
  }
}

.nav-tabs-copy {
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
  line-height: 1.6;
}

.nav-pagination-footer {
  max-width: 100%;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 20px;
  padding: 12px 16px;
  border: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}

.nav-pagination-footer__range {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-sm);
  font-variant-numeric: tabular-nums;
}
</style>
