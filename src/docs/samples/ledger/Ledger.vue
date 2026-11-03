<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Download, Lock } from 'lucide-vue-next'
import { RButton, RCard, RMeter, RReadout, RSparkline, RStat, RStatus, RTabs, RWaterfallChart, useToast } from '@/design-system'
import SampleShell from '../_kit/SampleShell.vue'
import BatchesTab from './parts/BatchesTab.vue'
import BreaksTab from './parts/BreaksTab.vue'
import JournalTab from './parts/JournalTab.vue'
import MatchDialog from './parts/MatchDialog.vue'
import {
  type Batch,
  type Break,
  batches as batchSeed,
  bn,
  breakAmount,
  breaks as breakSeed,
  businessDate,
  closing,
  dayTotals,
  entriesToday,
  flows,
  millions,
  postingsByHalfHour,
  typeLabel,
} from './data'

const { show } = useToast()

/* ── Clock ──────────────────────────────────────────────────────────────────────────────── */
const elapsed = ref(0)
let timer = 0
onMounted(() => {
  const started = Date.now()
  timer = window.setInterval(() => (elapsed.value = Math.floor((Date.now() - started) / 1000)), 1000)
})
onBeforeUnmount(() => clearInterval(timer))
const clock = computed(() => {
  const t = 10 * 3600 + 42 * 60 + 18 + elapsed.value
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(Math.floor(t / 3600) % 24)}:${pad(Math.floor(t / 60) % 60)}:${pad(t % 60)}`
})

/* ── State ──────────────────────────────────────────────────────────────────────────────── */
const tab = ref<string | number>('journal')
const batches = ref<Batch[]>(batchSeed.map((b) => ({ ...b, times: [...b.times] })))
const breaks = ref<Break[]>(breakSeed.map((b) => ({ ...b })))

const settled = computed(() => batches.value.filter((b) => b.status === 'settled' || b.status === 'reconciled').length)
const rejected = computed(() => batches.value.filter((b) => b.status === 'failed').length)
const openAmount = computed(() => breaks.value.reduce((s, b) => s + breakAmount(b), 0))
const aged = computed(() => breaks.value.filter((b) => b.ageDays > 2).length)
const breakMix = computed(() =>
  (['amount', 'missing-bank', 'missing-ledger', 'duplicate'] as const)
    .map((type) => ({ label: typeLabel[type], value: breaks.value.filter((b) => b.type === type).length }))
    .filter((s) => s.value > 0),
)

const tabs = computed(() => [
  { label: 'Journal', value: 'journal', count: entriesToday.toLocaleString('en-US') },
  { label: 'Batches', value: 'batches', count: batches.value.length },
  { label: 'Breaks', value: 'breaks', count: breaks.value.length },
])

/* ── Actions ────────────────────────────────────────────────────────────────────────────── */
const matchOpen = ref(false)
const current = ref<Break | null>(null)
let jeSeq = 491

function openBreak(item: Break) {
  current.value = item
  matchOpen.value = true
}

function resolve(item: Break, action: string) {
  breaks.value = breaks.value.filter((b) => b.id !== item.id)
  matchOpen.value = false
  const je = `JE-20261103-00${jeSeq++}`
  show({
    title: `${item.id} resolved`,
    body: item.type === 'missing-bank' ? `Marked in transit until 4 Nov 2026. ${breaks.value.length} breaks left.` : `${action}. Posted ${je}. ${breaks.value.length} breaks left.`,
    tone: 'success',
  })
}

function carry(item: Break) {
  matchOpen.value = false
  show({ title: `${item.id} carried to 4 Nov`, body: 'It stays open and counts against tomorrow’s close.' })
}

function autoMatch() {
  const matched = breaks.value.filter((b) => b.suggestion)
  breaks.value = breaks.value.filter((b) => !b.suggestion)
  show({
    title: `${matched.length} breaks matched`,
    body: `Adjustments posted as JE-20261103-00${jeSeq}–00${jeSeq + matched.length - 1}. ${breaks.value.length} left.`,
    tone: 'success',
  })
  jeSeq += matched.length
}

function resubmit(batch: Batch) {
  const target = batches.value.find((b) => b.id === batch.id)
  if (!target) return
  target.status = 'submitted'
  target.file = 'SKN-20261103-1100-R1.txt'
  target.window = '11:00'
  target.times = [target.times[0], target.times[1], `${clock.value.slice(0, 5)}:00`]
  target.error = undefined
  show({ title: `${batch.id} resubmitted`, body: 'New file id SKN-20261103-1100-R1 in the 11:00 WIB window.', tone: 'success' })
}

function download(batch: Batch) {
  show({ title: 'File downloaded', body: batch.file })
}

function exportDay() {
  show({ title: 'Export ready', body: 'gl-arn-01-20261103.csv · journal, batches and breaks' })
}

function closeDay() {
  if (breaks.value.length) {
    show({
      title: 'The day cannot close yet',
      body: `${breaks.value.length} breaks are open. Match them or carry them to 4 Nov first.`,
      tone: 'warning',
      action: { label: 'Show breaks', onClick: () => (tab.value = 'breaks') },
    })
    return
  }
  show({ title: 'Business day closed', body: `GL-ARN-01 closed for ${businessDate} at ${clock.value} WIB.`, tone: 'success' })
}
</script>

<template>
  <SampleShell product="Ledger">
    <template #strip>
      <span class="s-ledger-strip-ctx">/ GL-ARN-01 · Payments operations</span>
    </template>
    <template #meta>
      <span class="s-ledger-hide-sm">Business date {{ businessDate }}</span>
      <span class="s-ledger-clock">{{ clock }} WIB</span>
      <RStatus tone="success" label="Day open" size="sm" />
    </template>

    <template #header>
      <div class="s-ledger-heading">
        <p class="r-eyebrow s-ledger-heading__eyebrow">Arunika Bank · General ledger</p>
        <h1 class="s-ledger-heading__title">Ledger &amp; reconciliation</h1>
      </div>
    </template>
    <template #actions>
      <RButton variant="outline" size="sm" @click="exportDay">
        <template #leading><Download /></template>
        Export
      </RButton>
      <RButton tone="brand" size="sm" @click="closeDay">
        <template #leading><Lock /></template>
        Close day
      </RButton>
    </template>

    <div class="s-ledger">
      <div class="s-ledger-top">
        <section class="s-ledger-kpis r-grid-ruled" aria-label="Day status">
          <div class="s-ledger-kpi">
            <RStat label="Entries posted" :value="entriesToday" size="md">
              <template #footer>
                <div class="s-ledger-kpi__meter">
                  <RSparkline
                    :values="postingsByHalfHour"
                    :height="28"
                    color="var(--r-chart-1)"
                    area
                    label="Entries posted per half hour since midnight, peaking at 164 between 09:00 and 09:30"
                  />
                  <span class="s-ledger-kpi__note">Per 30 min since 00:00 · last at 10:31:50</span>
                </div>
              </template>
            </RStat>
          </div>
          <div class="s-ledger-kpi">
            <RReadout
              label="Difference · Dr − Cr"
              value="0.00"
              unit="IDR"
              font="pixel"
              size="lg"
              ghost
              tone="success"
            >
              <template #footer>
                <span class="s-ledger-kpi__note">Debits = credits = IDR {{ bn(dayTotals.debit / 1e9) }} bn today</span>
              </template>
            </RReadout>
          </div>
          <div class="s-ledger-kpi">
            <RStat label="Batches settled" :value="`${settled} of ${batches.length}`" size="md">
              <template #footer>
                <div class="s-ledger-kpi__meter">
                  <RMeter
                    variant="segments"
                    :value="settled"
                    :max="batches.length"
                    :count="batches.length"
                    :height="10"
                    :label="`${settled} of ${batches.length} batches settled`"
                  />
                  <span class="s-ledger-kpi__note">{{ rejected ? `${rejected} rejected, needs a resubmit` : 'None rejected' }}</span>
                </div>
              </template>
            </RStat>
          </div>
          <div class="s-ledger-kpi">
            <RStat label="Open breaks" :value="breaks.length" size="md">
              <template #footer>
                <div class="s-ledger-kpi__meter">
                  <RMeter
                    v-if="breaks.length"
                    :segments="breakMix"
                    :height="8"
                    legend="inline"
                    :label="`Open breaks by type: ${breakMix.map((s) => `${s.label} ${s.value}`).join(', ')}`"
                  />
                  <span class="s-ledger-kpi__note">Rp {{ millions(openAmount) }} · {{ aged }} older than 2 days</span>
                </div>
              </template>
            </RStat>
          </div>
        </section>

        <RCard eyebrow="Settlement account 1010 · today" title="Net flows" class="s-ledger-flows">
          <template #actions><span class="s-ledger-unit">IDR bn</span></template>
          <RWaterfallChart
            :steps="flows"
            :height="196"
            :format="(v) => bn(v)"
            label="Net flows on the central bank settlement account today, from the opening balance to the closing balance, in IDR billions"
          />
          <p class="s-ledger-flows__note">
            <span class="r-label">Intraday</span>
            Closing {{ bn(closing) }} bn at {{ clock.slice(0, 5) }} WIB. The 10:45 and 12:00 windows are still to settle.
          </p>
        </RCard>
      </div>

      <RCard padding="none" class="s-ledger-tabs">
        <RTabs v-model="tab" :items="tabs" label="Ledger views">
          <template #default="{ value }">
            <JournalTab v-if="value === 'journal'" />
            <BatchesTab v-else-if="value === 'batches'" :batches="batches" @resubmit="resubmit" @download="download" />
            <BreaksTab v-else :breaks="breaks" @open="openBreak" @auto-match="autoMatch" />
          </template>
        </RTabs>
      </RCard>
    </div>

    <MatchDialog v-model:open="matchOpen" :item="current" @resolve="resolve" @carry="carry" />
  </SampleShell>
</template>

<style scoped>
.s-ledger {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.s-ledger-strip-ctx {
  color: var(--r-text-tertiary);
}
.s-ledger-clock {
  color: var(--r-text);
  font-variant-numeric: tabular-nums;
}

.s-ledger-heading {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.s-ledger-heading__eyebrow {
  color: var(--r-text-tertiary);
}
.s-ledger-heading__title {
  font-size: var(--r-text-xl);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-tight);
  line-height: 1.2;
}

.s-ledger-top {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr);
  gap: 16px;
  align-items: stretch;
}

.s-ledger-kpis {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.s-ledger-kpi {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 132px;
  padding: 16px 20px;
}
.s-ledger-kpi__note {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}
.s-ledger-kpi__meter {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}
.s-ledger-kpi :deep(.r-stat__footer) {
  width: 100%;
}

.s-ledger-flows__note {
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid var(--r-border-subtle);
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}
.s-ledger-flows__note .r-label {
  margin-right: 6px;
}

.s-ledger-tabs :deep(.r-tabs__list) {
  padding: 0 16px;
}

@media (max-width: 1100px) {
  .s-ledger-top {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 640px) {
  .s-ledger-hide-sm,
  .s-ledger-strip-ctx {
    display: none;
  }
}

@media (max-width: 480px) {
  .s-ledger-kpis {
    grid-template-columns: minmax(0, 1fr);
  }
}

/* Units keep their own case (IDR bn, not IDR BN), so they sit beside the card head, not in its meta. */
.s-ledger-unit {
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
