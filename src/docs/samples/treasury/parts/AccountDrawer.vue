<script setup lang="ts">
import { computed } from 'vue'
import { ArrowLeftRight, FileDown } from 'lucide-vue-next'
import { RButton, RDialog, RLineChart, RSpecList, RStat, RStatus, type SpecItem } from '@/design-system'
import { type Account, type Range, accountChange, bn, fx, historyLength, money, rangeBaseline, signedBn, statusMeta } from '../data'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{ account: Account | null; range: Range }>()
const emit = defineEmits<{ statement: [account: Account]; transfer: [account: Account] }>()

/** The last 30 days, in IDR bn, for the small chart. */
const days = 30
const labels = computed(() => {
  const end = new Date(Date.UTC(2026, 10, 3))
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(end.getTime() - (days - 1 - i) * 86400000)
    return `${d.getUTCDate()} ${d.toLocaleString('en-GB', { month: 'short', timeZone: 'UTC' })}`
  })
})

const series = computed(() => {
  const a = props.account
  if (!a) return []
  const rate = fx[a.currency]
  const values = a.history.slice(historyLength - days).map((v) => Math.round(((v * rate) / 1e9) * 100) / 100)
  return [{ name: 'Balance, IDR bn eq.', values }]
})

const change = computed(() => (props.account ? accountChange(props.account, props.range) : 0))

const specs = computed<SpecItem[]>(() => {
  const a = props.account
  if (!a) return []
  const status = statusMeta[a.status]
  return [
    { label: 'Account number', value: a.number, mono: true },
    { label: 'BIC', value: a.bic, mono: true },
    { label: 'Branch', value: a.branch },
    { label: 'Currency', value: a.currency === 'IDR' ? 'IDR' : `${a.currency} · ${bn(fx[a.currency], fx[a.currency] < 1000 ? 2 : 0)} IDR`, mono: true },
    { label: 'Opened', value: a.opened },
    { label: 'Interest', value: a.rate },
    { label: 'Sweep rule', value: a.sweep },
    { label: 'Signatories', value: a.signatories },
    { label: 'Last statement', value: '3 Nov 2026 06:00 WIB · MT940', mono: true },
    { label: 'Status', value: status.label, tone: status.tone },
  ]
})
</script>

<template>
  <RDialog
    v-model:open="open"
    side="right"
    size="md"
    initial-focus=".r-dialog__close"
    :eyebrow="account ? `${account.id} · ${account.currency}` : undefined"
    :title="account ? `${account.bank} · ${account.name}` : ''"
  >
    <div v-if="account" class="s-treasury-drawer">
      <div class="s-treasury-drawer__hero">
        <RStat
          label="Ledger balance"
          :value="money(account.balance, account.currency)"
          size="md"
        />
        <div class="s-treasury-drawer__eq">
          <span class="r-label">IDR equivalent</span>
          <span class="s-treasury-drawer__eq-value">{{ bn(account.idr / 1e9, 2) }} bn</span>
          <span class="r-label">{{ signedBn(change, 2) }} bn {{ rangeBaseline[range] }}</span>
        </div>
      </div>

      <div class="s-treasury-drawer__chart">
        <div class="s-treasury-drawer__chart-head">
          <span class="s-treasury-drawer__head">
            <span class="r-eyebrow">Balance · 30 days</span>
            <span class="s-treasury-drawer__unit">IDR bn eq.</span>
          </span>
          <RStatus :tone="statusMeta[account.status].tone" :label="statusMeta[account.status].label" size="sm" />
        </div>
        <RLineChart
          :labels="labels"
          :series="series"
          :height="168"
          :now="days - 1"
          :min="Math.floor(Math.min(...series[0].values) * 0.96)"
          :format="(v) => `${bn(v, 2)} bn`"
          :axis-format="(v) => bn(v, 0)"
          :label="`${account.bank} ${account.name}, daily balance over the last 30 days in IDR billions`"
        />
      </div>

      <RSpecList :items="specs" dense />
    </div>
    <template #footer="{ close }">
      <RButton variant="ghost" @click="close">Close</RButton>
      <span class="s-treasury-drawer__spacer" />
      <RButton variant="outline" @click="account && emit('statement', account)">
        <template #leading><FileDown /></template>
        Statement
      </RButton>
      <RButton tone="brand" @click="account && emit('transfer', account)">
        <template #leading><ArrowLeftRight /></template>
        Transfer from account
      </RButton>
    </template>
  </RDialog>
</template>

<style scoped>
.s-treasury-drawer {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.s-treasury-drawer__hero {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--r-border);
}

.s-treasury-drawer__eq {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.s-treasury-drawer__eq-value {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-md);
  font-variant-numeric: tabular-nums;
}

.s-treasury-drawer__chart {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.s-treasury-drawer__chart-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.s-treasury-drawer__head {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
}
.s-treasury-drawer__unit {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
}

.s-treasury-drawer__spacer {
  flex: 1;
}
</style>
