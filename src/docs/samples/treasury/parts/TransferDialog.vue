<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RButton, RDialog, RInput, RSegmented, RSelect, RSpecList, type SelectOption, type SpecItem } from '@/design-system'
import { type Account, accounts, bn, fx, money, toIdrBn } from '../data'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{ from?: Account | null }>()
const emit = defineEmits<{ submit: [summary: { ref: string; text: string }] }>()

const beneficiaries = [
  { value: 'ACC-05', label: 'ACC-05 · Arunika Bank · Term deposit 3M', currency: 'IDR' },
  { value: 'ACC-03', label: 'ACC-03 · Bank Samudra Niaga · Payroll', currency: 'IDR' },
  { value: 'ACC-09', label: 'ACC-09 · Atlantic Meridian Bank · USD concentration', currency: 'USD' },
  { value: 'EXT-118', label: 'PT Sinar Armada Kargo · Bank Kencana 1188 4421', currency: 'IDR' },
  { value: 'EXT-207', label: 'Meridian Port Services · Straits Meridian 501-990213', currency: 'SGD' },
]

const fromOptions: SelectOption[] = accounts
  .filter((a) => a.status !== 'term' && a.status !== 'restricted')
  .map((a) => ({ value: a.id, label: `${a.id} · ${a.bank} · ${a.name}` }))

const fromId = ref<string | number | null>('ACC-01')
const toId = ref<string | number | null>('ACC-03')
const amount = ref<string | number | null>('120.000.000.000')
const when = ref<string | number>('today')
const reference = ref<string | number | null>('Payroll pre-funding, November')

watch(open, (isOpen) => {
  if (isOpen && props.from && fromOptions.some((o) => o.value === props.from?.id)) fromId.value = props.from.id
})

const source = computed(() => accounts.find((a) => a.id === fromId.value) ?? accounts[0])
const parsed = computed(() => {
  // IDR is written with dots for thousands; the other currencies with commas and a decimal point.
  const raw = String(amount.value ?? '')
  const clean = source.value.currency === 'IDR' ? raw.replace(/\D/g, '') : raw.replace(/[^\d.]/g, '')
  return Number(clean) || 0
})
const remaining = computed(() => source.value.balance - parsed.value)
const tooMuch = computed(() => remaining.value < 0)

const summary = computed<SpecItem[]>(() => [
  { label: 'Debit', value: money(parsed.value, source.value.currency), mono: true },
  { label: 'IDR equivalent', value: `${bn(toIdrBn(parsed.value, source.value.currency), 2)} bn`, mono: true },
  {
    label: 'Balance after',
    value: money(Math.max(0, remaining.value), source.value.currency),
    mono: true,
    tone: tooMuch.value ? 'danger' : undefined,
    hint: tooMuch.value ? 'More than the available balance' : undefined,
  },
  { label: 'Value date', value: when.value === 'today' ? '3 Nov 2026, cut-off 15:00 WIB' : '4 Nov 2026, first window 08:00 WIB' },
  { label: 'Approvals', value: parsed.value * fx[source.value.currency] > 50e9 ? '2 of 4 signatories' : '1 of 4 signatories' },
])

function submit() {
  if (tooMuch.value || !parsed.value) return
  const to = beneficiaries.find((b) => b.value === toId.value)
  emit('submit', {
    ref: 'TRF-26110433',
    text: `${money(parsed.value, source.value.currency)} from ${source.value.id} to ${to?.label.split(' · ')[0] ?? 'beneficiary'}`,
  })
  open.value = false
}
</script>

<template>
  <RDialog
    v-model:open="open"
    eyebrow="Payment run · draft"
    title="New transfer"
    description="Transfers above IDR 50 bn equivalent need two signatories."
    size="md"
  >
    <form class="s-treasury-transfer" @submit.prevent="submit">
      <RSelect v-model="fromId" :options="fromOptions" label="From" />
      <RSelect v-model="toId" :options="beneficiaries" label="To" />
      <div class="s-treasury-transfer__row">
        <RInput
          v-model="amount"
          label="Amount"
          inputmode="decimal"
          :error="tooMuch ? 'Higher than the ledger balance' : undefined"
        >
          <template #leading><span class="s-treasury-transfer__ccy">{{ source.currency }}</span></template>
        </RInput>
        <div class="s-treasury-transfer__when">
          <span class="s-treasury-transfer__label">Value date</span>
          <RSegmented
            v-model="when"
            :options="[
              { label: 'Today', value: 'today' },
              { label: 'Tomorrow', value: 'tomorrow' },
            ]"
            label="Value date"
            block
          />
        </div>
      </div>
      <RInput v-model="reference" label="Reference" hint="Shown on both statements, 35 characters at most." />
      <RSpecList :items="summary" dense />
    </form>
    <template #footer="{ close }">
      <RButton variant="ghost" @click="close">Cancel</RButton>
      <RButton tone="brand" :disabled="tooMuch || !parsed" @click="submit">Submit for approval</RButton>
    </template>
  </RDialog>
</template>

<style scoped>
.s-treasury-transfer {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.s-treasury-transfer__row {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}

.s-treasury-transfer__when {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.s-treasury-transfer__label {
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
  line-height: 1.4;
}

.s-treasury-transfer__ccy {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  letter-spacing: 0.06em;
  color: var(--r-text-tertiary);
}

@media (max-width: 520px) {
  .s-treasury-transfer__row {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
