<script setup lang="ts">
import { computed } from 'vue'
import { RAlert, RButton, RDialog, RSpecList, type SpecItem } from '@/design-system'
import { type Break, type Side, accounts, breakDifference, rp, signedRp, typeLabel } from '../data'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{ item: Break | null }>()
const emit = defineEmits<{ resolve: [item: Break, action: string]; carry: [item: Break] }>()

function specs(side: Side | null): SpecItem[] {
  if (!side) return []
  return [
    { label: 'Reference', value: side.ref, mono: true },
    { label: 'Value date', value: side.date },
    { label: 'Amount', value: rp(side.amount), mono: true },
    { label: 'Counterparty', value: side.counterparty },
    { label: 'Account', value: `${side.account} · ${accounts[side.account] ?? ''}` },
    { label: 'Narrative', value: side.narrative },
  ]
}

const action = computed(() => {
  const b = props.item
  if (!b) return ''
  if (b.type === 'amount') return `Match and post ${rp(Math.abs(breakDifference(b)))}`
  if (b.type === 'duplicate') return 'Reverse duplicate'
  if (b.type === 'missing-ledger') return 'Post entry'
  return 'Mark in transit'
})

const advice = computed(() => {
  const b = props.item
  if (!b) return ''
  if (b.suggestion) return `Suggested: ${b.suggestion}.`
  if (b.type === 'missing-bank') return 'The payout left the ledger but is not on the statement yet. Instant payouts usually land within one business day.'
  return 'The statement shows a credit with no ledger entry. Posting creates the entry against 2010 Customer deposits after a second approval.'
})
</script>

<template>
  <RDialog
    v-model:open="open"
    size="lg"
    :eyebrow="item ? `${item.id} · ${typeLabel[item.type]}` : undefined"
    title="Match break"
    :description="item ? `Open for ${item.ageDays === 0 ? 'less than a day' : `${item.ageDays} day${item.ageDays > 1 ? 's' : ''}`}. Compare both sides before you resolve it.` : undefined"
  >
    <div v-if="item" class="s-ledger-match">
      <div class="s-ledger-match__sides">
        <section class="s-ledger-match__side" aria-label="Ledger side">
          <p class="r-eyebrow s-ledger-match__label"><span class="r-index">A</span> Ledger · GL-ARN-01</p>
          <RSpecList v-if="item.ledger" :items="specs(item.ledger)" dense />
          <div v-else class="s-ledger-match__none r-hatch">
            <span class="r-label">No ledger entry</span>
          </div>
        </section>
        <section class="s-ledger-match__side" aria-label="Bank statement side">
          <p class="r-eyebrow s-ledger-match__label"><span class="r-index">B</span> Bank statement · MT940</p>
          <RSpecList v-if="item.bank" :items="specs(item.bank)" dense />
          <div v-else class="s-ledger-match__none r-hatch">
            <span class="r-label">No statement line</span>
          </div>
        </section>
      </div>
      <dl class="s-ledger-match__diff">
        <div>
          <dt class="r-label">Difference, A − B</dt>
          <dd>{{ signedRp(breakDifference(item)) }}</dd>
        </div>
      </dl>
      <RAlert :tone="item.suggestion ? 'brand' : 'neutral'" variant="soft">{{ advice }}</RAlert>
    </div>
    <template #footer="{ close }">
      <RButton variant="ghost" @click="close">Cancel</RButton>
      <span class="s-ledger-match__spacer" />
      <RButton variant="outline" @click="item && emit('carry', item)">Carry to 4 Nov</RButton>
      <RButton tone="brand" @click="item && emit('resolve', item, action)">{{ action }}</RButton>
    </template>
  </RDialog>
</template>

<style scoped>
.s-ledger-match {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.s-ledger-match__sides {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  border: 1px solid var(--r-border);
}

.s-ledger-match__side {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  padding: 12px 16px 8px;
}
.s-ledger-match__side + .s-ledger-match__side {
  border-left: 1px solid var(--r-border);
}

.s-ledger-match__label {
  display: flex;
  align-items: baseline;
  gap: 8px;
  color: var(--r-text-secondary);
}

.s-ledger-match__none {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 160px;
  margin-bottom: 8px;
  border: 1px solid var(--r-border-subtle);
}
.s-ledger-match__none .r-label {
  padding: 2px 6px;
  background: var(--r-bg-surface);
}

.s-ledger-match__diff > div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-top: 1px solid var(--r-border);
  border-bottom: 1px solid var(--r-border);
}
.s-ledger-match__diff dd {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-lg);
  font-variant-numeric: tabular-nums;
}

.s-ledger-match__spacer {
  flex: 1;
}

@media (max-width: 640px) {
  .s-ledger-match__sides {
    grid-template-columns: minmax(0, 1fr);
  }
  .s-ledger-match__side + .s-ledger-match__side {
    border-left: 0;
    border-top: 1px solid var(--r-border);
  }
}
</style>
