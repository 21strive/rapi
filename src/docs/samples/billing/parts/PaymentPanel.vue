<script setup lang="ts">
import { Nfc } from 'lucide-vue-next'
import { RButton, RCard, RSpecList } from '@/design-system'
import type { SpecItem } from '@/design-system'
import { org, paymentMethod as card } from '../data'

const emit = defineEmits<{ replace: []; edit: [] }>()

const details: SpecItem[] = [
  { label: 'Invoices to', value: org.billingEmail, mono: true },
  { label: 'Billed to', value: org.legal, hint: org.address },
  { label: 'Tax ID', value: org.taxId, mono: true },
  { label: 'Backup', value: 'Virtual account', hint: card.backup.replace('Bank transfer to virtual account ', 'VA ') },
  { label: 'Currency', value: 'USD', mono: true },
]
</script>

<template>
  <RCard index="06" eyebrow="Billing" title="Payment method" class="s-billing-payment">
    <template #actions>
      <RButton size="sm" variant="outline" @click="emit('replace')">Replace card</RButton>
    </template>

    <RCard variant="ink" :supergraphic="false" padding="none" class="s-billing-face" role="img" :aria-label="`${card.issuer} ${card.kind} card ending ${card.last4}, expires ${card.expires}`">
      <div class="s-billing-face__top">
        <span class="s-billing-face__issuer">{{ card.issuer }}</span>
        <span class="s-billing-face__kind">{{ card.kind }}</span>
      </div>
      <div class="s-billing-face__chip-row">
        <span class="s-billing-face__chip" aria-hidden="true">
          <span v-for="n in 6" :key="n" />
        </span>
        <Nfc class="s-billing-face__nfc" aria-hidden="true" />
      </div>
      <p class="s-billing-face__number" aria-hidden="true">
        <span>••••</span><span>••••</span><span>••••</span><span>{{ card.last4 }}</span>
      </p>
      <div class="s-billing-face__bottom" aria-hidden="true">
        <span>
          <span class="s-billing-face__caption">Card holder</span>
          {{ card.holder }}
        </span>
        <span class="s-billing-face__right">
          <span class="s-billing-face__caption">Valid thru</span>
          {{ card.expires }}
        </span>
      </div>
    </RCard>

    <RSpecList :items="details" dense />

    <template #footer>
      <RButton size="sm" variant="ghost" @click="emit('edit')">Edit billing details</RButton>
    </template>
  </RCard>
</template>

<style scoped>
/* An ID-1 card, 85.60 × 53.98 mm, as a dark island. */
.s-billing-face {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0;
  width: 100%;
  max-width: 380px;
  aspect-ratio: 85.6 / 53.98;
  padding: 16px 18px;
  font-family: var(--r-font-mono);
  text-transform: uppercase;
}

.s-billing-face__top,
.s-billing-face__bottom,
.s-billing-face__chip-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.s-billing-face__issuer {
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
}

.s-billing-face__kind,
.s-billing-face__caption {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.08em;
}

/* The contact plate as construction lines: a frame cut into a 3 × 2 grid of hairlines. */
.s-billing-face__chip {
  display: grid;
  grid-template-columns: 1fr 1.4fr 1fr;
  grid-template-rows: 1fr 1fr;
  width: 38px;
  height: 28px;
  border: 1px solid var(--r-border-strong);
}

.s-billing-face__chip span:not(:nth-child(3n)) {
  border-right: 1px solid var(--r-border-strong);
}

.s-billing-face__chip span:nth-child(-n + 3) {
  border-bottom: 1px solid var(--r-border-strong);
}

.s-billing-face__nfc {
  width: 18px;
  height: 18px;
  color: var(--r-text-secondary);
}

.s-billing-face__number {
  display: flex;
  gap: 0.9em;
  font-size: 18px;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.06em;
}

.s-billing-face__bottom {
  align-items: flex-end;
  font-size: var(--r-text-2xs);
  letter-spacing: 0.06em;
}

.s-billing-face__bottom > span {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.s-billing-face__right {
  text-align: right;
}

@media (max-width: 420px) {
  .s-billing-face__number {
    font-size: 15px;
  }
}
</style>
