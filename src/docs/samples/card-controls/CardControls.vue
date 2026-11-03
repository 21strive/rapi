<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Plus, Search } from 'lucide-vue-next'
import {
  RBadge,
  RBarList,
  RBulletChart,
  RButton,
  RCard,
  REmpty,
  RInput,
  RMeter,
  RSegmented,
  RSlider,
  RSpecList,
  RStat,
  RStatus,
  RSwitch,
  RTable,
  useToast,
  type SpecItem,
  type TableColumn,
} from '@/design-system'
import SampleShell from '../_kit/SampleShell.vue'
import CardFace from './parts/CardFace.vue'
import IssueDialog from './parts/IssueDialog.vue'
import {
  type Card,
  type Channels,
  type Txn,
  cards as cardSeed,
  categories,
  channelMeta,
  cycle,
  declines,
  frozenCount,
  m,
  missingReceipts,
  programmeLimit,
  programmeSpent,
  rp,
  teamNearest,
  teamRows,
  totalCards,
} from './data'

const { show } = useToast()

const cards = ref<Card[]>(cardSeed.map((c) => ({ ...c, channels: { ...c.channels }, txns: c.txns.map((t) => ({ ...t })) })))
const selectedId = ref('CRD-0412')
const card = computed(() => cards.value.find((c) => c.id === selectedId.value) ?? cards.value[0])

/* ── Wallet filter ──────────────────────────────────────────────────────────────────────── */
const query = ref<string | number | null>('')
const kind = ref<'all' | 'physical' | 'virtual' | 'frozen'>('all')
const kindOptions = computed(() => [
  { label: `All ${cards.value.length}`, value: 'all' },
  { label: 'Physical', value: 'physical' },
  { label: 'Virtual', value: 'virtual' },
  { label: 'Frozen', value: 'frozen' },
])
const wallet = computed(() => {
  const q = String(query.value ?? '').trim().toLowerCase()
  return cards.value.filter((c) => {
    if (kind.value === 'frozen' ? !c.frozen : kind.value !== 'all' && c.type !== kind.value) return false
    return !q || `${c.holder} ${c.team} ${c.purpose} ${c.last4} ${c.id}`.toLowerCase().includes(q)
  })
})

/* ── Programme figures ──────────────────────────────────────────────────────────────────── */
const frozenOutside = frozenCount - cardSeed.filter((c) => c.frozen).length
const frozenNow = computed(() => frozenOutside + cards.value.filter((c) => c.frozen).length)
const issued = computed(() => totalCards + (cards.value.length - cardSeed.length))

/* ── Selected card: freeze, limit, channels ─────────────────────────────────────────────── */
const draftLimit = ref(card.value.limit)
watch(selectedId, () => (draftLimit.value = card.value.limit))
const limitDirty = computed(() => draftLimit.value !== card.value.limit)
const used = computed(() => (draftLimit.value ? (card.value.spent / draftLimit.value) * 100 : 100))

function setFrozen(value: boolean) {
  const target = card.value
  target.frozen = value
  show({
    title: value ? 'Card frozen' : 'Card unfrozen',
    body: value
      ? `${target.id} · ${target.holder}. New payments decline until you unfreeze it.`
      : `${target.id} · ${target.holder} can pay again.`,
    tone: value ? 'warning' : 'success',
    action: { label: 'Undo', onClick: () => (target.frozen = !value) },
  })
}

function saveLimit() {
  const target = card.value
  const before = target.limit
  target.limit = draftLimit.value
  show({
    title: 'Limit updated',
    body: `${target.id} · ${rp(before * 1e6)} → ${rp(target.limit * 1e6)} a month, from the next payment.`,
    tone: 'success',
  })
}

function setChannel(key: keyof Channels, value: boolean) {
  card.value.channels[key] = value
  const label = channelMeta.find((c) => c.key === key)?.label ?? key
  show({ title: `${label} ${value ? 'on' : 'off'}`, body: `${card.value.id} · ${card.value.holder}` })
}

const channelLocked = (key: keyof Channels) => card.value.type === 'virtual' && (key === 'atm' || key === 'contactless')

const specs = computed<SpecItem[]>(() => {
  const c = card.value
  return [
    { label: 'Card', value: c.id, mono: true },
    { label: 'Type', value: c.type === 'virtual' ? 'Virtual, online only' : 'Physical, chip and PIN' },
    { label: 'Programme', value: 'Arunika Business debit' },
    { label: 'Cost centre', value: c.costCentre, mono: true },
    { label: 'Approver', value: c.approver },
    { label: 'Issued', value: c.issued },
    { label: 'Expires', value: `${c.expiry} · end of month`, mono: true },
    { label: 'Status', value: c.frozen ? 'Frozen' : 'Active', tone: c.frozen ? 'neutral' : 'success' },
  ]
})

/* ── Transactions ───────────────────────────────────────────────────────────────────────── */
const txnColumns: TableColumn[] = [
  { key: 'when', label: 'When' },
  { key: 'merchant', label: 'Merchant' },
  { key: 'category', label: 'Category' },
  { key: 'amount', label: 'Amount', numeric: true },
  { key: 'status', label: 'Status' },
  { key: 'receipt', label: 'Receipt', align: 'right' },
]
const TXN_STATUS = {
  settled: { label: 'Settled', tone: 'success' },
  pending: { label: 'Pending', tone: 'warning' },
  declined: { label: 'Declined', tone: 'danger' },
} as const

function requestReceipt(txn: Txn) {
  txn.receipt = 'attached'
  show({ title: 'Receipt requested', body: `${card.value.holder} gets a reminder for ${txn.merchant}, ${rp(txn.amount)}.` })
}

/* ── Issue ──────────────────────────────────────────────────────────────────────────────── */
const issueOpen = ref(false)
let seq = 452

function issue(draft: { holder: string; type: Card['type']; purpose: string; limit: number; channels: Channels }) {
  const id = `CRD-0${seq++}`
  const last4 = String(1000 + ((seq * 7919) % 9000))
  cards.value.unshift({
    id,
    holder: draft.holder,
    team: 'Engineering',
    purpose: draft.purpose,
    type: draft.type,
    last4,
    expiry: '11/29',
    limit: draft.limit,
    spent: 0,
    frozen: false,
    channels: draft.channels,
    issued: '3 Nov 2026',
    approver: 'Sarah Lim',
    costCentre: 'CC-510 Platform',
    txns: [],
  })
  selectedId.value = id
  kind.value = 'all'
  query.value = ''
  show({
    title: draft.type === 'virtual' ? 'Virtual card issued' : 'Physical card ordered',
    body:
      draft.type === 'virtual'
        ? `${id} ending ${last4} is ready for ${draft.holder}.`
        : `${id} ships to ${draft.holder} by 10 Nov 2026. The virtual number works today.`,
    tone: 'success',
  })
}
</script>

<template>
  <SampleShell product="Cards">
    <template #strip>
      <span class="s-cards-strip-ctx">/ Arunika Business</span>
    </template>
    <template #meta>
      <span class="s-cards-hide-sm">Cycle {{ cycle.label }} · day {{ cycle.day }} of {{ cycle.days }}</span>
      <RStatus tone="success" label="Issuing online" size="sm" />
    </template>

    <template #header>
      <div class="s-cards-heading">
        <p class="r-eyebrow s-cards-heading__eyebrow">PT Nusantara Logistik · Spend management</p>
        <h1 class="s-cards-heading__title">Corporate cards</h1>
      </div>
    </template>
    <template #actions>
      <RInput v-model="query" size="sm" placeholder="Holder, team or last 4" aria-label="Search cards" clearable class="s-cards-search">
        <template #leading><Search /></template>
      </RInput>
      <RButton tone="brand" size="sm" @click="issueOpen = true">
        <template #leading><Plus /></template>
        Issue card
      </RButton>
    </template>

    <div class="s-cards">
      <section class="s-cards-kpis r-grid-ruled" aria-label="Programme figures">
        <div class="s-cards-kpi">
          <RStat label="Active cards" :value="issued - frozenNow" size="md">
            <template #footer><span class="s-cards-note">{{ issued }} issued · {{ frozenNow }} frozen</span></template>
          </RStat>
        </div>
        <div class="s-cards-kpi">
          <RStat label="Spent this cycle" :value="Math.round(programmeSpent * 10) / 10" :decimals="1" unit="IDR M" size="md">
            <template #footer>
              <span class="s-cards-note">{{ Math.round((programmeSpent / programmeLimit) * 100) }}% of {{ m(programmeLimit, 0) }} on day {{ cycle.day }} of {{ cycle.days }}</span>
            </template>
          </RStat>
        </div>
        <div class="s-cards-kpi">
          <RStat label="Available" :value="Math.round((programmeLimit - programmeSpent) * 10) / 10" :decimals="1" unit="IDR M" size="md">
            <template #footer><span class="s-cards-note">Across team limits until 25 Nov</span></template>
          </RStat>
        </div>
        <div class="s-cards-kpi">
          <RStat label="Receipts missing" :value="missingReceipts" size="md">
            <template #footer><span class="s-cards-note">Due 5 working days after payment</span></template>
          </RStat>
        </div>
      </section>

      <RCard :eyebrow="`Wallet · ${wallet.length} of ${issued}`" title="Cards you manage" padding="none" class="s-cards-wallet">
        <template #actions>
          <RSegmented v-model="kind" :options="kindOptions" size="sm" label="Card type" />
        </template>
        <div v-if="wallet.length" class="s-cards-wallet__rail" role="list" aria-label="Cards">
          <div v-for="c in wallet" :key="c.id" role="listitem" class="s-cards-wallet__item">
            <CardFace :card="c" interactive :selected="c.id === selectedId" @select="selectedId = c.id" />
          </div>
        </div>
        <REmpty v-else title="No cards match" :description="`Nothing for “${query}”. Try a holder’s name or the last four digits.`" class="s-cards-wallet__empty" />
      </RCard>

      <div class="s-cards-grid">
        <RCard
          :eyebrow="`${card.id} · ${card.type}`"
          :title="card.holder"
          :subtitle="`${card.team} · ${card.purpose}`"
          padding="none"
          class="s-cards-detail"
        >
          <template #actions>
            <RStatus :tone="card.frozen ? 'neutral' : 'success'" :label="card.frozen ? 'Frozen' : 'Active'" size="sm" />
          </template>

          <div class="s-cards-detail__top">
            <div class="s-cards-detail__face">
              <div class="s-cards-face-frame r-marks"><CardFace :card="card" size="lg" /></div>
              <RSpecList :items="specs" dense />
            </div>

            <div class="s-cards-controls">
              <div class="s-cards-control">
                <RSwitch
                  :model-value="card.frozen"
                  label="Freeze card"
                  description="New payments decline at once. Refunds and reversals still land."
                  @update:model-value="setFrozen"
                />
              </div>

              <div class="s-cards-control">
                <RSlider
                  v-model="draftLimit"
                  label="Monthly limit"
                  :min="0"
                  :max="300"
                  :step="5"
                  :marks="[
                    { value: 0, label: '0' },
                    { value: 100, label: '100' },
                    { value: 200, label: '200' },
                    { value: 300, label: '300' },
                  ]"
                  :format="(v) => `Rp ${m(v, 0)} M`"
                />
                <div class="s-cards-usage">
                  <RMeter
                    variant="segments"
                    :value="Math.min(100, used)"
                    :max="100"
                    :count="24"
                    :height="10"
                    :tone="used >= 90 ? 'warning' : 'brand'"
                    :label="`${Math.round(used)}% of the limit used this cycle`"
                  />
                  <div class="s-cards-usage__line">
                    <span><span class="r-label">Spent</span> Rp {{ m(card.spent) }} M</span>
                    <span><span class="r-label">Left</span> Rp {{ m(Math.max(0, draftLimit - card.spent)) }} M</span>
                    <span class="s-cards-usage__pct">{{ Math.round(used) }}%</span>
                  </div>
                  <p v-if="draftLimit < card.spent" class="s-cards-usage__warn">
                    <RStatus tone="warning" label="Below spend" size="sm" />
                    New payments will decline until 26 Nov.
                  </p>
                </div>
                <div v-if="limitDirty" class="s-cards-control__save">
                  <RButton size="sm" variant="ghost" @click="draftLimit = card.limit">Reset</RButton>
                  <RButton size="sm" @click="saveLimit">Save limit</RButton>
                </div>
              </div>

              <div class="s-cards-control s-cards-channels" role="group" aria-label="Channels">
                <p class="r-eyebrow s-cards-channels__title">Channels</p>
                <RSwitch
                  v-for="ch in channelMeta"
                  :key="ch.key"
                  :model-value="card.channels[ch.key]"
                  :label="ch.label"
                  :description="channelLocked(ch.key) ? 'Not available on a virtual card' : ch.description"
                  :disabled="channelLocked(ch.key) || card.frozen"
                  size="sm"
                  @update:model-value="(v) => setChannel(ch.key, v)"
                />
              </div>
            </div>
          </div>

          <div class="s-cards-txns">
            <p class="r-eyebrow s-cards-txns__title">Recent transactions · {{ card.txns.length }}</p>
            <RTable
              :columns="txnColumns"
              :rows="card.txns"
              density="compact"
              :caption="`Recent transactions on ${card.id}`"
              empty-text="No transactions on this card yet."
            >
              <template #cell-when="{ row }"><span class="s-cards-mono">{{ row.when }}</span></template>
              <template #cell-merchant="{ row }">
                <span class="s-cards-merchant">
                  {{ row.merchant }}
                  <span v-if="row.note" class="s-cards-merchant__note">{{ row.note }}</span>
                </span>
              </template>
              <template #cell-category="{ row }"><span class="s-cards-quiet">{{ row.category }}</span></template>
              <template #cell-amount="{ row }">{{ rp(row.amount) }}</template>
              <template #cell-status="{ row }">
                <RStatus :tone="TXN_STATUS[row.status as Txn['status']].tone" :label="TXN_STATUS[row.status as Txn['status']].label" size="sm" />
              </template>
              <template #cell-receipt="{ row }">
                <RButton v-if="row.receipt === 'missing'" size="xs" variant="soft" @click.stop="requestReceipt(row as Txn)">Request</RButton>
                <RBadge v-else-if="row.receipt === 'attached'" size="sm">Attached</RBadge>
                <span v-else class="s-cards-quiet">—</span>
              </template>
            </RTable>
          </div>
        </RCard>

        <div class="s-cards-side">
          <RCard
            eyebrow="Teams · this cycle"
            title="Spend against limits"
            :subtitle="`${teamNearest.team} is at ${Math.round((teamNearest.spent / teamNearest.limit) * 100)}% on day ${cycle.day}`"
          >
            <template #actions><span class="s-cards-unit">IDR M</span></template>
            <RBulletChart
              :rows="teamRows"
              :format="(v) => (Number.isInteger(v) ? String(v) : v.toFixed(1))"
              label="Card spend by team this cycle against each team's monthly limit, in IDR millions"
            />
          </RCard>
          <RCard eyebrow="Declines · 7 days" :title="`${declines.length} declined payments`" subtitle="Select one to open the card and its controls." padding="none">
            <ul class="s-cards-declines">
              <li v-for="d in declines" :key="d.id">
                <button type="button" class="s-cards-decline" @click="selectedId = d.card">
                  <span class="s-cards-decline__main">
                    <span class="s-cards-decline__merchant">{{ d.merchant }}</span>
                    <span class="s-cards-decline__reason">{{ d.reason }}</span>
                  </span>
                  <span class="s-cards-decline__side">
                    <span class="s-cards-mono">{{ rp(d.amount) }}</span>
                    <span class="r-label">{{ d.card }} · {{ d.when }}</span>
                  </span>
                </button>
              </li>
            </ul>
          </RCard>
          <RCard eyebrow="Merchant categories" title="Where the money went" :subtitle="`All ${issued} cards, ${cycle.label}`">
            <template #actions><span class="s-cards-unit">IDR M</span></template>
            <RBarList
              :items="categories.map((c) => ({ label: c.label, values: c.value }))"
              :format="(v) => m(v)"
              :bar-height="10"
              label="Card spend by merchant category this cycle, in IDR millions"
            />
          </RCard>
        </div>
      </div>
    </div>

    <IssueDialog v-model:open="issueOpen" @issue="issue" />
  </SampleShell>
</template>

<style scoped>
.s-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.s-cards-strip-ctx {
  color: var(--r-text-tertiary);
}

.s-cards-heading {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.s-cards-heading__eyebrow {
  color: var(--r-text-tertiary);
}
.s-cards-heading__title {
  font-size: var(--r-text-xl);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-tight);
  line-height: 1.2;
}
.s-cards-search {
  width: 240px;
}

.s-cards-kpis {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.s-cards-kpi {
  padding: 14px 20px;
}
.s-cards-note {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

/* Wallet: one rail of faces, scrolling sideways */
.s-cards-wallet__rail {
  display: flex;
  gap: 16px;
  padding: 8px 20px 20px;
  overflow-x: auto;
  overscroll-behavior-x: contain;
}
.s-cards-wallet__item {
  flex: none;
  padding: 4px;
}
.s-cards-wallet__empty {
  margin: 0 20px 20px;
}

.s-cards-grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

.s-cards-detail__top {
  display: grid;
  grid-template-columns: minmax(0, 360px) minmax(0, 1fr);
  gap: 24px;
  padding: 16px 20px 20px;
}
.s-cards-detail__face {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}
.s-cards-face-frame {
  width: 100%;
  max-width: 360px;
}

.s-cards-controls {
  display: flex;
  flex-direction: column;
  min-width: 0;
  border-top: 1px solid var(--r-border);
}
.s-cards-control {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid var(--r-border);
}
.s-cards-control__save {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.s-cards-usage {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.s-cards-usage__line {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
}
.s-cards-usage__line .r-label {
  margin-right: 4px;
}
.s-cards-usage__pct {
  margin-left: auto;
  color: var(--r-text-secondary);
}
.s-cards-usage__warn {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

.s-cards-channels {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 20px;
}
.s-cards-channels__title {
  grid-column: 1 / -1;
  color: var(--r-text-tertiary);
}

.s-cards-txns {
  border-top: 1px solid var(--r-border);
}
.s-cards-txns__title {
  padding: 14px 20px 10px;
  color: var(--r-text-tertiary);
}
.s-cards-mono {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
}
.s-cards-merchant {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
}
.s-cards-merchant__note {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}
.s-cards-quiet {
  color: var(--r-text-tertiary);
}

.s-cards-side {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.s-cards-declines {
  border-top: 1px solid var(--r-border);
}
.s-cards-declines li + li {
  border-top: 1px solid var(--r-border-subtle);
}
.s-cards-decline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-height: 52px;
  padding: 8px 20px;
  border: 0;
  background: none;
  color: var(--r-text);
  text-align: left;
}
.s-cards-decline:hover {
  background: var(--r-bg-muted);
}
.s-cards-decline:focus-visible {
  outline-offset: -2px;
}
.s-cards-decline__main,
.s-cards-decline__side {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.s-cards-decline__side {
  flex: none;
  align-items: flex-end;
}
.s-cards-decline__merchant {
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
}
.s-cards-decline__reason {
  overflow: hidden;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 1240px) {
  .s-cards-grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .s-cards-side {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .s-cards-kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .s-cards-detail__top {
    grid-template-columns: minmax(0, 1fr);
  }
  .s-cards-side {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 640px) {
  .s-cards-hide-sm,
  .s-cards-strip-ctx {
    display: none;
  }
  .s-cards-search {
    width: 100%;
  }
  .s-cards-wallet__rail {
    padding: 8px 16px 16px;
  }
  .s-cards-channels {
    grid-template-columns: minmax(0, 1fr);
  }
  .s-cards-detail__top {
    padding: 16px;
  }
}

@media (max-width: 420px) {
  .s-cards-kpis {
    grid-template-columns: minmax(0, 1fr);
  }
}

/* Units keep their own case (IDR bn, not IDR BN), so they sit beside the card head, not in its meta. */
.s-cards-unit {
  display: inline-block;
  padding-top: 4px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-medium);
  letter-spacing: 0.02em;
  white-space: nowrap;
}
</style>
