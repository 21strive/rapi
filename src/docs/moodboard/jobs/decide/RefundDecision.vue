<script setup lang="ts">
/**
 * A refund has three answers: all of it, part of it, or no. The model proposes one with its
 * reason; the person moves between them, adjusts the part with a stepper if needed, and the
 * button always says the amount that will leave.
 */
import { computed, ref } from 'vue'
import { RButton, RChip, RSegmented, RStatus, type StatusTone } from '@/design-system'
import { num, rp, type Zone } from '../../kit'
import AmountStepper from './AmountStepper.vue'
import DecisionStrip from './DecisionStrip.vue'
import { holdFocus, useDecision } from './shared'

type Mode = 'full' | 'partial' | 'deny'

const props = withDefaults(
  defineProps<{
    eyebrow: string
    title: string
    /** What the customer paid, in rupiah. */
    paid: number
    /** "Bank Pesisir card ···· 4471". */
    via?: string
    step?: number
    suggested: { mode: Mode; amount?: number; why: string }
    reasons: string[]
    zone?: Zone
  }>(),
  { via: undefined, step: 5000, zone: 'WIB' },
)

const root = ref<HTMLElement | null>(null)
const mode = ref<string | number>(props.suggested.mode)
const part = ref(props.suggested.amount ?? Math.round(props.paid / 2 / props.step) * props.step)
const reason = ref<string | null>(null)
const { choice, at, left, decide, undo } = useDecision<Mode>(10)

const modes = [
  { label: 'Full', value: 'full' },
  { label: 'Partial', value: 'partial' },
  { label: 'Deny', value: 'deny' },
]

const amount = computed(() => (mode.value === 'full' ? props.paid : mode.value === 'partial' ? part.value : 0))
const share = computed(() => `${num((part.value / props.paid) * 100)}% of the order`)
const action = computed(() => (mode.value === 'deny' ? 'Deny the refund' : `Refund ${rp(amount.value)}`))
const ready = computed(() => mode.value !== 'deny' || !!reason.value)

function commit() {
  if (!ready.value) return
  const restore = holdFocus(root)
  decide(mode.value as Mode)
  restore('[data-focus="undo"]')
}

function revert() {
  const restore = holdFocus(root)
  undo()
  restore('[data-focus="commit"]')
}

const status = computed<{ tone: StatusTone; label: string }>(() => {
  if (choice.value === 'deny') return { tone: 'danger', label: 'Denied' }
  if (choice.value) return { tone: 'success', label: 'Refunded' }
  return { tone: 'warning', label: 'Needs you' }
})
const outcome = computed(() => (choice.value === 'deny' ? `Denied · ${reason.value}` : `${rp(amount.value)} on its way`))
</script>

<template>
  <div ref="root" class="mk refund">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <RStatus :tone="status.tone" :label="status.label" size="sm" />
    </div>
    <p class="refund__title">{{ title }}</p>
    <p class="refund__paid">
      Paid <span class="refund__amount">{{ rp(paid) }}</span><template v-if="via"> · {{ via }}</template>
    </p>

    <template v-if="!choice">
      <RSegmented v-model="mode" :options="modes" size="sm" block label="Refund" />
      <div class="refund__mode">
        <div v-if="mode === 'partial'" class="refund__part">
          <AmountStepper v-model="part" class="refund__stepper" label="Refund amount" :min="step" :max="paid - step" :step="step" :format="rp" />
          <span class="refund__share">{{ share }}</span>
        </div>
        <div v-else-if="mode === 'deny'" class="refund__reasons" role="group" aria-label="Reason for denying">
          <RChip v-for="r in reasons" :key="r" size="sm" :selected="reason === r" @click="reason = r">{{ r }}</RChip>
        </div>
        <p v-else class="refund__back">All of it back the way it was paid, in 1–3 working days.</p>
      </div>
      <p class="refund__why">{{ suggested.why }}</p>
    </template>
    <p v-else class="refund__outcome">{{ outcome }}</p>

    <div class="refund__foot mk-end">
      <DecisionStrip v-if="choice" :at="at" :left="left" :zone="zone" size="lg" @undo="revert" />
      <RButton
        v-else
        :tone="mode === 'deny' ? 'danger' : 'brand'"
        size="lg"
        block
        :disabled="!ready"
        data-focus="commit"
        @click="commit"
      >
        {{ action }}
      </RButton>
    </div>
  </div>
</template>

<style scoped>
.refund {
  gap: 8px;
}

.refund__title {
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.3;
}

.refund__paid {
  margin-top: -4px;
  overflow: hidden;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.refund__amount {
  color: var(--r-text);
  font-variant-numeric: tabular-nums;
}

.refund__mode {
  display: flex;
  align-items: center;
  min-height: 28px;
}

.refund__part {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-width: 0;
}

.refund__stepper {
  flex: 1 1 auto;
}

.refund__share {
  flex: none;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
}

.refund__reasons {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.refund__back,
.refund__outcome {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

.refund__why {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}
/* The status word in the header never gives way to the eyebrow. */
.mk-row > .r-status {
  flex: none;
}
</style>
