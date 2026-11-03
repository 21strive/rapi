<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ShieldCheck } from 'lucide-vue-next'
import { RAvatar, RBadge, RIconButton, RSegmented, RSpecList, RStat, type SpecItem } from '@/design-system'
import { type Account, recipient, rp, transfer } from '../data'

const speed = defineModel<'instant' | 'standard'>('speed', { required: true })
const props = defineProps<{ from: Account; sentAt: string | null }>()
const emit = defineEmits<{ back: [] }>()

const choice = computed(() => transfer.speeds[speed.value])
const total = computed(() => transfer.amount + choice.value.fee)

/** Once the transfer is sent, the choice is fixed. */
const speedOptions = computed(() => [
  { label: `Instant · ${rp(transfer.speeds.instant.fee)}`, value: 'instant', disabled: !!props.sentAt && speed.value !== 'instant' },
  { label: 'Standard · free', value: 'standard', disabled: !!props.sentAt && speed.value !== 'standard' },
])

const specs = computed<SpecItem[]>(() => [
  { label: 'From', value: `${props.from.name} · ${props.from.number.slice(-4)}` },
  { label: 'Reference', value: transfer.reference },
  { label: 'Amount', value: rp(transfer.amount), mono: true },
  { label: 'Fee', value: choice.value.fee ? rp(choice.value.fee) : 'Free', mono: true },
  { label: 'Total debit', value: rp(total.value), mono: true },
  { label: 'Arrives', value: choice.value.arrival },
  { label: 'Balance after', value: rp(props.from.balance - total.value), mono: true },
])
</script>

<template>
  <div class="s-mb-review">
    <header class="s-mb-appbar">
      <RIconButton label="Back to amount" variant="ghost" @click="emit('back')"><ChevronLeft /></RIconButton>
      <p class="s-mb-appbar__title">Review transfer</p>
      <span class="r-label s-mb-appbar__step">Step 2 of 3</span>
    </header>

    <section class="s-mb-amount" aria-label="Amount">
      <RStat label="You send" :value="transfer.amount" prefix="Rp" locale="id-ID" size="lg" />
    </section>

    <section class="s-mb-recipient" aria-label="Recipient">
      <RAvatar :name="recipient.name" size="lg" decorative />
      <div class="s-mb-recipient__main">
        <p class="s-mb-recipient__name">{{ recipient.name }}</p>
        <p class="s-mb-recipient__acct">{{ recipient.bank }} · <span class="r-mono">{{ recipient.number }}</span></p>
        <p class="s-mb-recipient__saved">{{ recipient.saved }}</p>
      </div>
      <RBadge size="sm" tone="success" dot>Name checked</RBadge>
    </section>

    <section class="s-mb-speed" aria-label="Speed">
      <p class="s-mb-speed__label">Speed</p>
      <RSegmented v-model="speed" :options="speedOptions" block label="Transfer speed" />
    </section>

    <section class="s-mb-specs">
      <RSpecList :items="specs" dense />
    </section>

    <p class="s-mb-note">
      <ShieldCheck aria-hidden="true" />
      Check the name before you confirm. A sent transfer cannot be recalled.
    </p>
  </div>
</template>

<style scoped>
.s-mb-review {
  display: flex;
  flex-direction: column;
}

.s-mb-appbar {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 60px;
  padding: 10px 16px 10px 8px;
  border-bottom: 1px solid var(--r-border);
}
.s-mb-appbar__title {
  flex: 1;
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
}

.s-mb-amount {
  padding: 20px 16px 16px;
}

.s-mb-recipient {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: start;
  gap: 12px;
  margin: 0 16px;
  padding: 14px 0;
  border-top: 1px solid var(--r-border);
  border-bottom: 1px solid var(--r-border);
}
.s-mb-recipient__main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.s-mb-recipient__name {
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
}
.s-mb-recipient__acct {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}
.s-mb-recipient__saved {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.s-mb-speed {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px 16px 4px;
}
.s-mb-speed__label {
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
}

.s-mb-specs {
  padding: 12px 16px 0;
}

.s-mb-note {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 16px;
  padding: 10px 12px;
  border-left: 2px solid var(--r-border-strong);
  background: var(--r-bg-muted);
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.45;
}
.s-mb-note svg {
  width: 14px;
  height: 14px;
  margin-top: 1px;
}
</style>
