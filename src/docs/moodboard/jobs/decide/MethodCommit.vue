<script setup lang="ts">
/**
 * Choose how, then commit: merge, squash or rebase; BI-FAST, RTGS or SKN; canary or all at once.
 * The model has picked the usual way and greyed out what can't apply, with the reason. The one
 * button names the exact action, so the press and the outcome match.
 */
import { computed, ref } from 'vue'
import { RButton, RRadioGroup, RSegmented, RStatus, type StatusTone } from '@/design-system'
import type { Zone } from '../../kit'
import DecisionStrip from './DecisionStrip.vue'
import { holdFocus, useDecision } from './shared'

interface Method {
  id: string
  label: string
  description?: string
  /** The button while it is selected: "Squash and merge". */
  action: string
  /** The outcome: "Squashed into main". */
  done: string
  disabled?: boolean
  suggested?: boolean
}

interface Fact {
  text: string
  /** A lamp before it; facts without a tone are plain mono metadata. */
  tone?: StatusTone
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    title: string
    facts?: Fact[]
    /** What is in it, a few short lines: a changelog, the files touched. */
    notes?: string[]
    methods: Method[]
    /** `radio` lists methods with their descriptions; `segmented` is a row of keys for short names. */
    picker?: 'radio' | 'segmented'
    /** A line about the suggestion, or about what is greyed out. */
    why?: string
    /** `neutral` for the ink key, used on brand panels. */
    tone?: 'brand' | 'neutral'
    zone?: Zone
    /** `row` puts the details left of the choice, for 3x1 strips. */
    layout?: 'card' | 'row'
  }>(),
  { facts: () => [], notes: () => [], picker: 'radio', why: undefined, tone: 'brand', zone: 'WIB', layout: 'card' },
)

const root = ref<HTMLElement | null>(null)
const method = ref<string | number>(props.methods.find((m) => m.suggested && !m.disabled)?.id ?? props.methods.find((m) => !m.disabled)?.id ?? '')
const current = computed(() => props.methods.find((m) => m.id === method.value) ?? props.methods[0])
const { choice, at, left, decide, undo } = useDecision<string>(10)
const chosen = computed(() => props.methods.find((m) => m.id === choice.value))

const radios = computed(() =>
  props.methods.map((m) => ({
    label: m.suggested ? `${m.label} · suggested` : m.label,
    value: m.id,
    description: m.description,
    disabled: m.disabled,
  })),
)
const keys = computed(() => props.methods.map((m) => ({ label: m.label, value: m.id, disabled: m.disabled })))

function commit() {
  const restore = holdFocus(root)
  decide(current.value.id)
  restore('[data-focus="undo"]')
}

function revert() {
  const restore = holdFocus(root)
  undo()
  restore('[data-focus="commit"]')
}
</script>

<template>
  <div ref="root" class="mk method">
    <div class="method__grid" :class="`method__grid--${layout}`">
      <div class="method__info">
        <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
        <p class="method__title">{{ title }}</p>
        <p v-if="facts.length" class="method__facts">
          <template v-for="fact in facts" :key="fact.text">
            <RStatus v-if="fact.tone" :tone="fact.tone" :label="fact.text" size="sm" />
            <span v-else class="r-label">{{ fact.text }}</span>
          </template>
        </p>
        <ul v-if="notes.length" class="method__notes">
          <li v-for="note in notes" :key="note" class="mk-truncate">{{ note }}</li>
        </ul>
      </div>

      <div class="method__choose">
        <template v-if="!choice">
          <RRadioGroup v-if="picker === 'radio'" v-model="method" class="method__radios" :options="radios" label="How" hide-label />
          <RSegmented v-else v-model="method" :options="keys" size="sm" block label="How" />
          <p v-if="why" class="method__why">{{ why }}</p>
        </template>
        <div class="method__foot">
          <DecisionStrip
            v-if="choice"
            :at="at"
            :left="left"
            :zone="zone"
            :label="chosen?.done"
            :size="layout === 'row' ? 'md' : 'lg'"
            @undo="revert"
          />
          <RButton v-else :tone="tone" :size="layout === 'row' ? 'md' : 'lg'" block data-focus="commit" @click="commit">
            {{ current.action }}
          </RButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.method {
  container-type: inline-size;
}

.method__grid {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
}

.method__info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.method__title {
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.3;
}

.method__facts {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 12px;
  margin-top: 2px;
}

.method__notes {
  display: flex;
  flex-direction: column;
  margin-top: 6px;
  border-top: 1px solid var(--r-border-subtle);
}

.method__notes li {
  padding: 4px 0;
  border-bottom: 1px solid var(--r-border-subtle);
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
}

.method__choose {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  padding-top: 10px;
  border-top: 1px solid var(--r-border-subtle);
}

.method__radios {
  gap: 0;
}

.method__radios :deep(.r-radio-group__options) {
  gap: 8px;
}

.method__radios :deep(.r-radio__label) {
  font-size: var(--r-text-sm);
}

.method__radios :deep(.r-radio__description) {
  font-size: var(--r-text-xs);
}

.method__why {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

.method__foot {
  margin-top: auto;
}

/* A strip clamped to two columns stacks; the facts give way so it keeps its height. */
@container (max-width: 459px) {
  .method__grid--row .method__facts {
    display: none;
  }
}

/* 3x1: the details on the left, the keys and the button on the right. */
@container (min-width: 460px) {
  .method__grid--row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
    column-gap: 20px;
  }
  .method__grid--row .method__notes {
  display: flex;
  flex-direction: column;
  margin-top: 6px;
  border-top: 1px solid var(--r-border-subtle);
}

.method__notes li {
  padding: 4px 0;
  border-bottom: 1px solid var(--r-border-subtle);
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
}

.method__choose {
    padding-top: 0;
    border-top: 0;
  }
}
</style>
