<script setup lang="ts">
/** Applications waiting for a KYC decision, most urgent SLA first. A row opens the review drawer. */
import { computed, ref } from 'vue'
import { ChevronRight } from 'lucide-vue-next'
import { RBadge, RCard, REmpty, RIconButton, RSegmented, RStatus, RTable } from '@/design-system'
import type { TableColumn } from '@/design-system'
import { RISK_TONE, slaOf, submittedLabel, type KycApplicant, type Risk } from '../data'

const props = defineProps<{
  queue: KycApplicant[]
  activeId: string | null
  /** Decisions made today, including the ones made on this screen. */
  decided: { approved: number; rejected: number }
}>()
const emit = defineEmits<{ open: [id: string] }>()

const risk = ref<string | number>('all')
const riskOptions = [
  { label: 'All', value: 'all' },
  { label: 'High', value: 'HIGH' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'Low', value: 'LOW' },
]

const columns: TableColumn[] = [
  { key: 'business', label: 'Applicant' },
  { key: 'docType', label: 'Document' },
  { key: 'risk', label: 'Risk' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'sla', label: 'SLA 24 h' },
  { key: 'action', label: 'Review', align: 'right', width: '48px' },
]

const rows = computed(() =>
  props.queue
    .filter((a) => risk.value === 'all' || a.risk === (risk.value as Risk))
    .map((a) => ({ ...a, sla: slaOf(a), submittedText: submittedLabel(a.submitted) })),
)

const breached = computed(() => props.queue.filter((a) => slaOf(a).left < 0).length)
const selected = computed(() => (props.activeId ? [props.activeId] : []))
</script>

<template>
  <RCard
    id="s-settlements-kyc"
    class="s-settlements-kyc"
    index="04"
    eyebrow="KYC review"
    title="Review queue"
    :meta="breached ? `${queue.length} waiting · ${breached} breached` : `${queue.length} waiting`"
    padding="none"
  >
    <template #actions>
      <RSegmented v-model="risk" :options="riskOptions" size="sm" label="Filter by risk" />
    </template>
    <RTable
      :columns="columns"
      :rows="rows"
      :selected="selected"
      row-key="id"
      caption="KYC applications waiting for review, most urgent first"
      @row-click="(row) => emit('open', row.id)"
    >
      <template #cell-business="{ row }">
        <span class="s-settlements-kyc__who">
          <span class="s-settlements-kyc__business">{{ row.business }}</span>
          <span class="s-settlements-kyc__owner">{{ row.owner }} · {{ row.city }}</span>
        </span>
      </template>
      <template #cell-risk="{ row }">
        <RBadge :tone="RISK_TONE[row.risk as Risk]" size="sm">{{ row.risk }}</RBadge>
      </template>
      <template #cell-submitted="{ row }">
        <span class="s-settlements-kyc__mono">{{ row.submittedText }}</span>
      </template>
      <template #cell-sla="{ row }">
        <span class="s-settlements-kyc__sla">
          <RStatus :tone="row.sla.tone" :label="row.sla.word" size="sm" />
          <span class="s-settlements-kyc__mono">{{ row.sla.text }}</span>
        </span>
      </template>
      <template #header-action>
        <span class="r-sr-only">Review</span>
      </template>
      <template #cell-docType="{ row }">
        <span class="s-settlements-kyc__doc">{{ row.docType }}</span>
      </template>
      <template #cell-action="{ row }">
        <RIconButton size="xs" variant="ghost" :label="`Review ${row.business}`" @click.stop="emit('open', row.id)">
          <ChevronRight />
        </RIconButton>
      </template>
      <template #empty>
        <REmpty size="sm" title="Queue clear" body="Every application in the last 24 hours has a decision." />
      </template>
    </RTable>
    <template #footer>
      <dl class="s-settlements-kyc__tally">
        <div>
          <dt>Decided today</dt>
          <dd>{{ decided.approved + decided.rejected }}</dd>
        </div>
        <div>
          <dt>Approved</dt>
          <dd>{{ decided.approved }}</dd>
        </div>
        <div>
          <dt>Rejected</dt>
          <dd>{{ decided.rejected }}</dd>
        </div>
        <div>
          <dt>Median to decision</dt>
          <dd>3 h 12 m</dd>
        </div>
      </dl>
    </template>
  </RCard>
</template>

<style scoped>
.s-settlements-kyc {
  scroll-margin-top: 48px;
}

.s-settlements-kyc :deep(.r-table td) {
  height: 48px;
}

.s-settlements-kyc__who {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.s-settlements-kyc__business {
  font-weight: var(--r-weight-medium);
  line-height: 1.3;
}

.s-settlements-kyc__owner {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  line-height: 1.3;
}

.s-settlements-kyc__mono {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
}

.s-settlements-kyc__tally {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 28px;
  width: 100%;
  margin: 0;
  padding-top: 12px;
  border-top: 1px solid var(--r-border-subtle);
}
.s-settlements-kyc__tally > div {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.s-settlements-kyc__tally dt {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.s-settlements-kyc__tally dd {
  margin: 0;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-sm);
  font-variant-numeric: tabular-nums;
}

.s-settlements-kyc__doc {
  display: block;
  max-width: 96px;
  line-height: 1.3;
  white-space: normal;
}

.s-settlements-kyc__sla {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
</style>
