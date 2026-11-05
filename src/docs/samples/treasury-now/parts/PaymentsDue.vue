<script setup lang="ts">
/**
 * Needs you · the payments due this week that wait for Ayu's signature. Simpul has matched each to
 * its invoice; what is left is the deliberate part: hold to release. Ten seconds to undo after,
 * and a Revert in the record until the first one leaves the bank.
 */
import { computed, ref } from 'vue'
import { RButton, RStatus } from '@/design-system'
import { bn, money, openPayments, openPaymentsBn, releaseShort } from '../data'
import type { TreasuryDesk } from '../script'
import HoldButton from './HoldButton.vue'
import { useKeepFocus } from './focus'

const props = defineProps<{ td: TreasuryDesk }>()
const s = props.td.state

const released = computed(() => s.payments === 'released')
const left = computed(() => s.windows[s.paymentsTrail] ?? 0)

const root = ref<HTMLElement | null>(null)
useKeepFocus(root, () => [s.payments, left.value > 0])

/** "Sinar Armada Kargo", without the legal form, for a dense row. */
const short = (payee: string) => payee.replace(/^PT /, '').replace(/,? (Pte\. Ltd\.|GmbH|Co\., Ltd\.)$/, '')
</script>

<template>
  <section ref="root" class="tn-pay" aria-labelledby="tn-pay-title">
    <header class="tn-pay__head">
      <h3 id="tn-pay-title" class="tn-pay__title">
        {{ released ? 'Released' : 'Release' }} {{ openPayments.length }} payments
        <span class="tn-pay__range">Due 4–9 Nov</span>
      </h3>
      <p class="tn-pay__sum">
        <span class="tn-pay__fig">{{ bn(openPaymentsBn, 2) }}</span>
        <span class="tn-unit">IDR bn eq.</span>
      </p>
    </header>

    <ul class="tn-pay__rows">
      <li v-for="p in openPayments" :key="p.id" class="tn-pay__row">
        <span class="tn-pay__when">{{ releaseShort(p, s.bremerMoved) }}</span>
        <span class="tn-pay__payee">
          <span class="tn-pay__name">{{ short(p.payee) }}</span>
          <span class="tn-pay__purpose">{{ p.purpose }}</span>
        </span>
        <span class="tn-pay__amount">{{ money(p.amount, p.currency) }}</span>
        <RStatus v-if="released" tone="success" label="Released" size="sm" class="tn-pay__state" />
      </li>
    </ul>

    <footer class="tn-pay__foot">
      <p class="tn-pay__check">
        <span class="r-label">Checked 09:12</span>
        <span>Invoices match; no payee bank changed.</span>
      </p>
      <HoldButton
        v-if="!released"
        data-focus
        label="Hold to release"
        :description="`${openPayments.length} payments, IDR ${bn(openPaymentsBn, 2)} bn eq.`"
        @done="td.surface.releasePayments()"
      />
      <div v-else class="tn-receipt" tabindex="-1" :data-focus="left > 0 ? undefined : ''">
        <span class="tn-receipt__at">{{ s.paymentsAt }} WIB</span>
        <RButton
          v-if="left > 0"
          data-focus
          size="sm"
          variant="ghost"
          :aria-label="`Undo the release, ${left} seconds left`"
          @click="td.surface.revert(s.paymentsTrail)"
        >
          Undo · {{ left }} s
        </RButton>
        <span v-else class="r-label">By you</span>
      </div>
    </footer>
  </section>
</template>

<style>
.tn-pay {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}

.tn-pay__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px 8px;
}

.tn-pay__title {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.3;
}

.tn-pay__range {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-medium);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.tn-pay__sum {
  display: flex;
  flex: none;
  align-items: baseline;
  gap: 6px;
}

.tn-pay__fig {
  font-size: var(--r-text-xl);
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
  letter-spacing: var(--r-tracking-tight);
}

.tn-pay__rows {
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--r-border-subtle);
}

.tn-pay__row {
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 12px;
  min-height: 30px;
  padding: 3px 14px;
  border-bottom: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-sm);
}

.tn-pay__when {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.tn-pay__payee {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
}

.tn-pay__name {
  flex: none;
  font-weight: var(--r-weight-medium);
}

.tn-pay__purpose {
  overflow: hidden;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  text-overflow: ellipsis;
}

.tn-pay__amount {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
  text-align: right;
  white-space: nowrap;
}

.tn-pay__state {
  flex: none;
}

.tn-pay__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 8px 14px 10px;
}

.tn-pay__check {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 2px 8px;
  min-width: 0;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

@container tn (max-width: 520px) {
  .tn-pay__purpose {
    display: none;
  }
  .tn-pay__foot {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
