<script setup lang="ts">
/**
 * The model has done the work and needs one word from a person before it acts. The question
 * arrives as a square message block with the facts that matter; the answer is a key, not a
 * sentence to type. The reply and what the model did with it land right underneath.
 */
import { ref } from 'vue'
import { RButton } from '@/design-system'
import type { Zone } from '../../kit'
import DecisionStrip from './DecisionStrip.vue'
import { holdFocus, useDecision } from './shared'

interface Fact {
  label: string
  value: string
}

const props = withDefaults(
  defineProps<{
    /** Who asks: "Simpul". */
    from?: string
    /** When it asked, already formatted: "14:02 WIB". */
    asked: string
    question: string
    facts?: Fact[]
    yes?: string
    no?: string
    /** What the model says after each answer. */
    afterYes: string
    afterNo: string
    zone?: Zone
    /**
     * `card` 2x2 keeps the question above the answer. `wide` 2x1 and `small` 1x1 swap the question
     * for the answer once it is given; `small` also drops the message block.
     */
    layout?: 'small' | 'wide' | 'card'
  }>(),
  { from: 'Simpul', facts: () => [], yes: 'Yes', no: 'No', zone: 'WIB', layout: 'card' },
)

const root = ref<HTMLElement | null>(null)
const { choice, at, left, decide, undo } = useDecision<'yes' | 'no'>(10)

function answer(value: 'yes' | 'no') {
  const restore = holdFocus(root)
  decide(value)
  restore('[data-focus="undo"]')
}

function change() {
  const restore = holdFocus(root)
  undo()
  restore('[data-focus="yes"]')
}
</script>

<template>
  <div ref="root" class="mk ask" :class="[`ask--${layout}`, { 'is-answered': choice }]">
    <p class="ask__meta r-label">
      <span class="mk-truncate">{{ from }}</span>
      <span class="ask__time">{{ asked }}</span>
    </p>
    <p class="ask__msg">{{ question }}</p>

    <dl v-if="facts.length && layout === 'card' && !choice" class="ask__facts">
      <div v-for="fact in facts" :key="fact.label" class="ask__fact">
        <dt>{{ fact.label }}</dt>
        <dd>{{ fact.value }}</dd>
      </div>
    </dl>

    <template v-if="choice">
      <p class="ask__reply">{{ choice === 'yes' ? yes : no }}</p>
      <p class="ask__after">{{ choice === 'yes' ? afterYes : afterNo }}</p>
    </template>

    <div class="ask__foot mk-end">
      <DecisionStrip v-if="choice" :at="at" :left="left" :zone="zone" undo-label="Change" final-label="Sent" @undo="change" />
      <div v-else class="ask__keys" role="group" :aria-label="`Answer ${from}`">
        <RButton variant="outline" :size="layout === 'small' ? 'sm' : 'md'" @click="answer('no')">{{ no }}</RButton>
        <RButton tone="brand" :size="layout === 'small' ? 'sm' : 'md'" data-focus="yes" @click="answer('yes')">{{ yes }}</RButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ask {
  gap: 6px;
}

.ask__meta {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.ask__time {
  flex: none;
}

/* The model's message: a square block one step off the panel. */
.ask__msg {
  padding: 8px 10px;
  background: var(--r-bg-muted);
  font-size: var(--r-text-sm);
  line-height: 1.4;
}

.ask__facts {
  display: grid;
  margin: 0;
}

.ask__fact {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 0;
  border-bottom: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-xs);
}

.ask__fact dt {
  color: var(--r-text-tertiary);
}

.ask__fact dd {
  margin: 0;
  font-variant-numeric: tabular-nums;
}

/* The person's reply: right-aligned, ruled, on the panel. */
.ask__reply {
  align-self: flex-end;
  max-width: 80%;
  padding: 4px 10px;
  border: 1px solid var(--r-border-strong);
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
}

.ask__after {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

.ask__keys {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

/* Small and wide tiles give the question up to the answer once it is in. */
.ask--small.is-answered .ask__msg,
.ask--wide.is-answered .ask__msg {
  display: none;
}

/* 1x1: the question loses its block, the reply shrinks. */
.ask--small .ask__msg {
  padding: 0;
  background: none;
  font-weight: var(--r-weight-medium);
  line-height: 1.35;
}

.ask--small .ask__reply {
  padding: 2px 8px;
  font-size: var(--r-text-xs);
}
</style>
