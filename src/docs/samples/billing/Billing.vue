<script setup lang="ts">
/**
 * Sample 28 · Usage & billing. Simpul, the developer platform of 21 Strive, as seen by the
 * organization Kopra Labs on day 18 of its November cycle: the plan, usage against quotas, the
 * cost forecast, plans to compare and change, invoices and the card on file.
 */
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { Boxes, ChartLine, CreditCard, Download, Globe, LayoutGrid, LifeBuoy, Rocket, Settings, Users } from 'lucide-vue-next'
import { RAlert, RAvatar, RButton, RNavItem, RSegmented, useToast } from '@/design-system'
import SampleShell from '../_kit/SampleShell.vue'
import PlanBand from './parts/PlanBand.vue'
import UsagePanel from './parts/UsagePanel.vue'
import ForecastPanel from './parts/ForecastPanel.vue'
import PlanPicker from './parts/PlanPicker.vue'
import InvoicesPanel from './parts/InvoicesPanel.vue'
import PaymentPanel from './parts/PaymentPanel.vue'
import ChangePlanDialog from './parts/ChangePlanDialog.vue'
import InvoiceDrawer from './parts/InvoiceDrawer.vue'
import {
  type CycleId,
  type Invoice,
  type PlanId,
  OVERAGE,
  cycles,
  invoiceDetail,
  invoiceHistory,
  millions,
  org,
  planById,
  plans,
  quotaMillions,
  summarize,
  today,
  usd,
} from './data'

const { show } = useToast()
const router = useRouter()

/* ── Plan state ────────────────────────────────────────────────────────────────────── */
/** Plan in force from the 1st; an upgrade re-prices the days after `changeDay`. */
const basePlanId = ref<PlanId>('scale')
const currentPlanId = ref<PlanId>('scale')
const changeDay = ref<number | null>(null)
const scheduledId = ref<PlanId | null>(null)
const selectedId = ref<PlanId>('scale')

const basePlan = computed(() => planById(basePlanId.value))
const currentPlan = computed(() => planById(currentPlanId.value))
const scheduledPlan = computed(() => (scheduledId.value ? planById(scheduledId.value) : null))
const target = computed(() => planById(selectedId.value))

const TODAY = cycles.current.today as number
const DAYS_LEFT = cycles.current.days - TODAY

const planAt = (day: number) => (changeDay.value != null && day >= changeDay.value ? currentPlan.value : basePlan.value)

/* ── Cycles ────────────────────────────────────────────────────────────────────────── */
const cycle = ref<CycleId>('current')
const cycleOptions = [
  { label: 'November', value: 'current' },
  { label: 'October', value: 'previous' },
]

const current = computed(() => summarize(cycles.current, planAt))
const previous = computed(() => summarize(cycles.previous, () => planById('scale')))
const closed = computed(() => cycle.value === 'previous')
const view = computed(() => (closed.value ? previous.value : current.value))

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const dayLabel = (spec: { firstDow: number; month: string }, day: number) => `${DOW[(spec.firstDow + day - 1) % 7]} ${day} ${spec.month}`
const currentDay = (day: number) => dayLabel(cycles.current, day)
const viewDay = (day: number) => dayLabel(view.value.spec, day)

/* ── Alert: one quota near its limit ───────────────────────────────────────────────── */
const requestsPct = computed(() => (current.value.used.requests / currentPlan.value.quota.requests) * 100)
const showAlert = computed(() => requestsPct.value >= 80)
const notifyAt95 = ref(false)

const alertTitle = computed(
  () => `Requests are at ${Math.round(requestsPct.value)}% of the ${quotaMillions(currentPlan.value.quota.requests)} quota with ${DAYS_LEFT} days left`,
)
const alertBody = computed(() => {
  const day = current.value.requestsQuotaDay
  const rate = usd(currentPlan.value.rate.requests * OVERAGE)
  const when = day ? `At this rate you pass it on ${currentDay(day)}. ` : ''
  return `${when}Past the quota, requests cost ${rate} per million, ${OVERAGE}× the plan rate.`
})

const plansSection = ref<HTMLElement | null>(null)

function raiseQuota() {
  const next = plans.find((p) => p.fee > currentPlan.value.fee && p.quota.requests > current.value.projected.requests)
  if (next) selectedId.value = next.id
  plansSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function notify() {
  notifyAt95.value = true
  show({ title: 'Usage email set', body: `${org.billingEmail} hears from us at 95% of the requests quota.`, tone: 'success' })
}

/* ── Changing plan ─────────────────────────────────────────────────────────────────── */
const dialogOpen = ref(false)

const blocked = computed(() => {
  const to = target.value
  if (to.id === currentPlan.value.id) return null
  const seats = current.value.used.seats
  if (to.quota.seats < seats) {
    return `${to.name} allows ${to.quota.seats} seats and ${org.name} has ${seats} members. Remove ${seats - to.quota.seats} members before you move.`
  }
  return null
})

const isUpgrade = computed(() => target.value.fee > currentPlan.value.fee)
const proration = computed(() => (isUpgrade.value ? ((target.value.fee - currentPlan.value.fee) * DAYS_LEFT) / cycles.current.days : 0))
const projectedAfter = computed(() =>
  isUpgrade.value ? summarize(cycles.current, (day) => (day > TODAY ? target.value : basePlan.value)).projected.total : current.value.projected.total,
)
const changeWarning = computed(() => {
  const to = target.value
  if (isUpgrade.value) return null
  const pace = current.value.projected.requests
  if (pace <= to.quota.requests) return null
  return `November is on course for ${millions(pace)} requests, over the ${quotaMillions(to.quota.requests)} quota of ${to.name}. Past the quota, requests cost ${OVERAGE}× the plan rate.`
})

function confirmChange() {
  const to = target.value
  if (isUpgrade.value) {
    const fee = proration.value
    currentPlanId.value = to.id
    changeDay.value = TODAY + 1
    scheduledId.value = null
    show({ title: `You are on ${to.name}`, body: `New quotas apply now. A prorated fee of ${usd(fee)} goes on the 1 Dec invoice.`, tone: 'success' })
  } else {
    scheduledId.value = to.id
    show({ title: `${to.name} starts on 1 Dec 2026`, body: `You keep ${currentPlan.value.name} and its quotas until then.` })
  }
}

function keepPlan() {
  const was = scheduledPlan.value?.name
  scheduledId.value = null
  show({ title: `Staying on ${currentPlan.value.name}`, body: was ? `The move to ${was} on 1 Dec is cancelled.` : undefined })
}

/* ── Invoices, payment, export ─────────────────────────────────────────────────────── */
const invoices = computed(() => invoiceHistory(previous.value, current.value.projected.total))

const drawerOpen = ref(false)
const openInvoice = ref<Invoice | null>(null)
const openDetail = computed(() =>
  openInvoice.value ? invoiceDetail(openInvoice.value, current.value, previous.value, openInvoice.value.id === 'draft' ? currentPlan.value : planById('scale')) : null,
)

function showInvoice(invoice: Invoice) {
  // The draft follows the live estimate, so re-read it from the current list.
  openInvoice.value = invoices.value.find((i) => i.id === invoice.id) ?? invoice
  drawerOpen.value = true
}

function download(invoice: Invoice) {
  show({ title: `Downloading ${invoice.number}`, body: `${invoice.period} · ${usd(invoice.amount)} · PDF` })
}

function replaceCard() {
  show({ title: 'Card form opened', body: 'Card numbers are entered on the payment page of Arta Kencana Bank and never stored by Simpul.' })
}

function editDetails() {
  show({
    title: 'Billing details live in organization settings',
    action: { label: 'Open settings', onClick: () => router.push('/samples/org-settings') },
  })
}

function exportCsv() {
  const s = view.value
  const month = s.spec.id === 'current' ? '11' : '10'
  const head = 'date,requests_millions,storage_gb,build_minutes,cost_to_date_usd,forecast'
  const lines = s.rows.map((r) =>
    [`${s.spec.year}-${month}-${String(r.day).padStart(2, '0')}`, r.requests.toFixed(3), r.storage.toFixed(1), r.build, r.totalCum.toFixed(2), r.forecast ? 'yes' : 'no'].join(','),
  )
  const name = `simpul-usage-kopra-labs-${s.spec.year}-${month}.csv`
  const url = URL.createObjectURL(new Blob([[head, ...lines].join('\n')], { type: 'text/csv' }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
  show({ title: 'Usage exported', body: `${name}, ${s.rows.length} days`, tone: 'success' })
}
</script>

<template>
  <SampleShell product="Simpul" title="Usage & billing">
    <template #strip>
      <span class="s-billing-strip__sep" aria-hidden="true">/</span>
      <span>{{ org.name }}</span>
    </template>
    <template #meta>
      <span class="s-billing-strip__wide">Account {{ org.account }}</span>
      <span><span class="s-billing-strip__wide">{{ today.label }} · </span>{{ today.time }}</span>
    </template>

    <template #actions>
      <RSegmented v-model="cycle" :options="cycleOptions" size="sm" label="Billing cycle" />
      <RButton size="sm" variant="outline" @click="exportCsv">
        <template #leading><Download /></template>
        Usage CSV
      </RButton>
    </template>

    <template #sidebar>
      <div class="s-billing-side__org">
        <RAvatar :name="org.name" size="md" decorative />
        <div class="s-billing-side__org-text">
          <p class="r-title">{{ org.name }}</p>
          <p class="r-label">{{ currentPlan.name }} · {{ current.used.seats }} seats</p>
        </div>
      </div>
      <nav class="s-billing-side__nav" aria-label="Workspace">
        <p class="r-index s-billing-side__group">Workspace</p>
        <RNavItem as="button" type="button" label="Overview" :icon="LayoutGrid" />
        <RNavItem as="button" type="button" label="Projects" :icon="Boxes" badge="3" />
        <RNavItem as="button" type="button" label="Deployments" :icon="Rocket" />
        <RNavItem as="button" type="button" label="Domains" :icon="Globe" />
        <RNavItem as="button" type="button" label="Analytics" :icon="ChartLine" />
        <p class="r-index s-billing-side__group">Organization</p>
        <RNavItem :as="RouterLink" to="/samples/org-settings" label="Members" :icon="Users" :badge="current.used.seats" />
        <RNavItem as="button" type="button" label="Usage & billing" :icon="CreditCard" active />
        <RNavItem :as="RouterLink" to="/samples/org-settings" label="Settings" :icon="Settings" />
      </nav>
      <div class="s-billing-side__foot">
        <RNavItem as="button" type="button" label="Support" :icon="LifeBuoy" />
        <div class="s-billing-side__user">
          <RAvatar name="Nadia Kusuma" size="sm" decorative />
          <div class="s-billing-side__org-text">
            <p class="s-billing-side__name">Nadia Kusuma</p>
            <p class="r-label">Billing admin</p>
          </div>
        </div>
      </div>
    </template>

    <div class="s-billing">
      <PlanBand
        :plan="currentPlan"
        :scheduled="scheduledPlan"
        :changed="changeDay != null"
        :summary="current"
        :previous-total="previous.end.totalCum"
        :day-name="currentDay"
      />

      <RAlert v-if="showAlert" tone="warning" :title="alertTitle">
        {{ alertBody }}
        <template #actions>
          <RButton size="sm" variant="outline" @click="raiseQuota">Raise the quota</RButton>
          <RButton size="sm" variant="ghost" :disabled="notifyAt95" @click="notify">
            {{ notifyAt95 ? 'Email set at 95%' : 'Email me at 95%' }}
          </RButton>
        </template>
      </RAlert>

      <div class="s-billing__row">
        <UsagePanel
          class="s-billing__usage"
          :summary="view"
          :quota-plan="closed ? planById('scale') : currentPlan"
          :rate-plan="closed ? planById('scale') : planAt(TODAY)"
          :closed="closed"
          :day-name="viewDay"
          :previous="closed ? null : previous"
        />
        <ForecastPanel class="s-billing__forecast" :summary="view" :closed="closed" :day-name="viewDay" />
      </div>

      <div ref="plansSection" class="s-billing__plans">
        <PlanPicker
          v-model:selected="selectedId"
          :current="currentPlan"
          :scheduled="scheduledPlan"
          :blocked="blocked"
          @change="dialogOpen = true"
          @keep="keepPlan"
        />
      </div>

      <div class="s-billing__row">
        <InvoicesPanel class="s-billing__invoices" :invoices="invoices" @download="download" @open="showInvoice" />
        <PaymentPanel class="s-billing__payment" @replace="replaceCard" @edit="editDetails" />
      </div>
    </div>

    <InvoiceDrawer v-model:open="drawerOpen" :invoice="openInvoice" :detail="openDetail" @download="download" />

    <ChangePlanDialog
      v-model:open="dialogOpen"
      :from="currentPlan"
      :to="target"
      :proration="proration"
      :days-left="DAYS_LEFT"
      :projected-now="current.projected.total"
      :projected-after="projectedAfter"
      :warning="changeWarning"
      @confirm="confirmChange"
    />
  </SampleShell>
</template>

<style scoped>
.s-billing {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 1600px;
}

.s-billing__row {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 16px;
  align-items: stretch;
}

.s-billing__usage {
  grid-column: span 7;
}

.s-billing__forecast {
  grid-column: span 5;
}

.s-billing__invoices {
  grid-column: span 8;
}

.s-billing__payment {
  grid-column: span 4;
}

.s-billing__plans {
  scroll-margin-top: 48px;
}

.s-billing-strip__sep {
  color: var(--r-text-tertiary);
}

/* Sidebar */
.s-billing-side__org {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 8px 12px;
  border-bottom: 1px solid var(--r-border-subtle);
}

.s-billing-side__org-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.s-billing-side__nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.s-billing-side__group {
  padding: 12px 8px 6px;
  text-transform: uppercase;
}

.s-billing-side__group:first-child {
  padding-top: 0;
}

.s-billing-side__foot {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--r-border-subtle);
}

.s-billing-side__user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 8px;
}

.s-billing-side__name {
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
}

.s-billing-side__mail {
  overflow: hidden;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 1279px) {
  .s-billing__usage,
  .s-billing__forecast,
  .s-billing__invoices,
  .s-billing__payment {
    grid-column: 1 / -1;
  }
}

@media (max-width: 640px) {
  .s-billing-strip__wide {
    display: none;
  }
}
</style>
