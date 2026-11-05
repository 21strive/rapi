<script setup lang="ts">
/**
 * A plan, a tier or a term, picked from ruled cards. The current one is marked, the model's
 * suggestion says why in its own line, and the button names the change and when it takes effect.
 */
import { computed, ref } from 'vue'
import { RButton, RRadioGroup } from '@/design-system'
import type { Zone } from '../../kit'
import DecisionStrip from './DecisionStrip.vue'
import { holdFocus, useDecision } from './shared'

interface Plan {
  id: string
  label: string
  /** "Rp 412.000 a month". */
  price: string
  /** One more line: what it fits, what it adds. */
  detail?: string
  /** What happens on the switch: "From 1 Dec 2026 · one-off fee Rp 1.185.000". */
  terms?: string
  current?: boolean
  suggested?: boolean
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    title?: string
    plans: Plan[]
    /** Cards per row; leave out to stack them. */
    columns?: number
    /** The price on its own line under the name, for narrow cards. */
    priceLine?: boolean
    /** The verb on the button: "Switch to", "Place for". */
    verb?: string
    done?: string
    zone?: Zone
  }>(),
  { title: undefined, columns: undefined, verb: 'Switch to', done: 'Switched', zone: 'WIB' },
)

const root = ref<HTMLElement | null>(null)
const picked = ref<string | number>(props.plans.find((p) => p.suggested)?.id ?? props.plans[0]?.id)
const plan = computed(() => props.plans.find((p) => p.id === picked.value) ?? props.plans[0])
const { choice, at, left, decided, decide, undo } = useDecision<string>(10)
const chosen = computed(() => props.plans.find((p) => p.id === choice.value))

// Once decided, the other cards lock until the decision is undone.
const options = computed(() =>
  props.plans.map((p) => {
    const mark = p.current ? 'Current' : p.suggested ? 'Suggested' : ''
    return {
      label: props.priceLine ? p.label : `${p.label} · ${p.price}`,
      value: p.id,
      description: props.priceLine
        ? [[p.price, mark].filter(Boolean).join(' · '), p.detail].filter(Boolean).join('\n')
        : [mark, p.detail].filter(Boolean).join(' · '),
      disabled: decided.value && p.id !== choice.value,
    }
  }),
)

function commit() {
  if (plan.value.current) return
  const restore = holdFocus(root)
  decide(plan.value.id)
  restore('[data-focus="undo"]')
}

function revert() {
  const restore = holdFocus(root)
  undo()
  restore('[data-focus="commit"]')
}
</script>

<template>
  <div ref="root" class="mk plan" :class="{ 'plan--cols': columns }">
    <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
    <p v-if="title" class="plan__title">{{ title }}</p>

    <RRadioGroup
      v-model="picked"
      class="plan__cards"
      :options="options"
      :label="title ?? eyebrow"
      hide-label
      variant="card"
      :orientation="columns ? 'horizontal' : 'vertical'"
      :columns="columns"
    />

    <p v-if="plan.terms && !decided" class="plan__terms mk-truncate">{{ plan.terms }}</p>

    <div class="plan__foot mk-end">
      <DecisionStrip v-if="decided" :at="at" :left="left" :zone="zone" :label="`${done} · ${chosen?.label ?? ''}`" size="lg" @undo="revert" />
      <RButton v-else tone="brand" size="lg" block :disabled="plan.current" data-focus="commit" @click="commit">
        {{ plan.current ? 'This is the current one' : `${verb} ${plan.label}` }}
      </RButton>
    </div>
  </div>
</template>

<style scoped>
.plan {
  container-type: inline-size;
  gap: 8px;
}

.plan__title {
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.3;
}

.plan__cards :deep(.r-radio--card) {
  padding: 8px 12px 9px;
}

.plan__cards :deep(.r-radio--card .r-radio__input) {
  top: 10px;
  left: 12px;
}

.plan__cards :deep(.r-radio__label) {
  font-size: var(--r-text-sm);
}

.plan__cards :deep(.r-radio__description) {
  line-height: 16px;
  white-space: pre-line;
}

.plan__terms {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

/* A row of cards clamped narrow (two board columns on a phone): stacked, names only. */
@container (max-width: 400px) {
  .plan--cols .plan__cards.r-radio-group--horizontal :deep(.r-radio-group__options) {
    grid-template-columns: minmax(0, 1fr);
  }
  .plan--cols .plan__cards :deep(.r-radio__description) {
    display: none;
  }
}
</style>
