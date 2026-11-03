<script setup lang="ts">
import { computed } from 'vue'
import { Check, Share2, X } from 'lucide-vue-next'
import { RIconButton, RLogo, RSpecList, type SpecItem } from '@/design-system'
import { type Account, recipient, rp, transfer, user } from '../data'

const props = defineProps<{ from: Account; speed: 'instant' | 'standard'; time: string; reference: string }>()
const emit = defineEmits<{ share: []; close: [] }>()

const choice = computed(() => transfer.speeds[props.speed])
const total = computed(() => transfer.amount + choice.value.fee)

const specs = computed<SpecItem[]>(() => [
  { label: 'Reference', value: props.reference, mono: true },
  { label: 'Date', value: `3 Nov 2026 · ${props.time} WIB`, mono: true },
  { label: 'From', value: `${user.name} · ${props.from.number.slice(-4)}` },
  { label: 'To', value: recipient.name },
  { label: 'Bank', value: `${recipient.bank} · ${recipient.number}`, mono: true },
  { label: 'Note', value: transfer.reference },
  { label: 'Amount', value: rp(transfer.amount), mono: true },
  { label: 'Fee', value: choice.value.fee ? rp(choice.value.fee) : 'Free', mono: true },
  { label: 'Total', value: rp(total.value), mono: true },
  { label: 'Speed', value: `${choice.value.label}, ${props.speed === 'instant' ? 'credited' : 'clears by 15:00 WIB'}` },
  { label: 'Status', value: props.speed === 'instant' ? 'Completed' : 'Scheduled', tone: props.speed === 'instant' ? 'success' : 'warning' },
])
</script>

<template>
  <div class="s-mb-receipt">
    <header class="s-mb-appbar">
      <RIconButton label="Close receipt" variant="ghost" @click="emit('close')"><X /></RIconButton>
      <p class="s-mb-appbar__title">Receipt</p>
      <RIconButton label="Share receipt" variant="ghost" @click="emit('share')"><Share2 /></RIconButton>
    </header>

    <section class="s-mb-done" aria-live="polite">
      <span class="s-mb-done__mark" aria-hidden="true"><Check /></span>
      <h2 class="s-mb-done__title">{{ speed === 'instant' ? 'Transfer sent' : 'Transfer scheduled' }}</h2>
      <p class="s-mb-done__body">
        {{ rp(transfer.amount) }} {{ speed === 'instant' ? 'reached' : 'goes to' }} {{ recipient.name }}
        {{ speed === 'instant' ? `at ${time.slice(0, 5)} WIB.` : 'today by 15:00 WIB.' }}
      </p>
    </section>

    <section class="s-mb-slip r-marks" aria-label="Receipt details">
      <div class="s-mb-slip__head">
        <span class="s-mb-slip__brand">
          <RLogo brand="21strive" variant="mark" :size="10" label="" />
          Arunika · Transfer receipt
        </span>
        <span class="r-label">No. 7731</span>
      </div>
      <p class="s-mb-slip__total">{{ rp(total) }}</p>
      <RSpecList :items="specs" dense />
    </section>
  </div>
</template>

<style scoped>
.s-mb-receipt {
  display: flex;
  flex-direction: column;
}

.s-mb-appbar {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 60px;
  padding: 10px 8px;
  border-bottom: 1px solid var(--r-border);
}
.s-mb-appbar__title {
  flex: 1;
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
}

.s-mb-done {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 20px 16px 16px;
}
.s-mb-done__mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  margin-bottom: 6px;
  border: 1px solid var(--r-success-border);
  background: var(--r-success-soft);
  color: var(--r-success-text);
}
.s-mb-done__mark svg {
  width: 22px;
  height: 22px;
}
.s-mb-done__title {
  font-size: var(--r-text-2xl);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-tight);
  line-height: 1.2;
}
.s-mb-done__body {
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
}

.s-mb-slip {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 4px 16px 16px;
  padding: 14px 14px 6px;
  border: 1px solid var(--r-border);
  background: var(--r-bg-muted);
}
.s-mb-slip__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.s-mb-slip__brand {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}
.s-mb-slip__total {
  padding-bottom: 6px;
  border-bottom: 1px solid var(--r-border-strong);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xl);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}
</style>
