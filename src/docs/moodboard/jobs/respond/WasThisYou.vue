<script setup lang="ts">
/**
 * "Was this you?" The one question a bank or a service asks when something looks unlike the
 * person: the amount, where and when, and two answers. No blocks the thing at once; yes clears it.
 * Either can be undone, because a person can tap the wrong one in a hurry.
 */
import { computed, ref } from 'vue'
import { RButton, RStatus } from '@/design-system'
import { stamp, useFocusKeeper } from './shared'

interface Line {
  label: string
  value: string
}

const props = withDefaults(
  defineProps<{
    /** Mono caps: "Card ···· 4471". */
    eyebrow: string
    question?: string
    /** The amount, if there is one: "Rp 8.450.000". */
    figure?: string
    /** What happened, in one line: "Toko Elektronik Sinar, Batam". */
    what: string
    lines?: Line[]
    yes?: string
    /** The protective answer: "No, freeze card". */
    no: string
    yesDone: string
    noDone: string
    /** The word on the lamp after no: "Frozen", "Blocked". */
    noWord?: string
    /** `card` 2x2 · `row` 2x1. */
    layout?: 'card' | 'row'
  }>(),
  { question: 'Was this you?', lines: () => [], yes: 'Yes, it was me', noWord: 'Blocked', layout: 'card' },
)

const answer = ref<'yes' | 'no' | null>(null)
const at = ref('')
const { bind, keep } = useFocusKeeper()

function reply(value: 'yes' | 'no') {
  keep('[data-focus="undo"]')
  answer.value = value
  at.value = stamp()
}

function undo() {
  keep('[data-focus="no"]')
  answer.value = null
}

const status = computed(() => {
  if (answer.value === 'yes') return { tone: 'success' as const, label: 'Confirmed', pulse: false }
  if (answer.value === 'no') return { tone: 'danger' as const, label: props.noWord, pulse: false }
  return { tone: 'warning' as const, label: 'Unusual', pulse: true }
})
</script>

<template>
  <div :ref="bind" class="mk you" :class="`you--${layout}`">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <RStatus :tone="status.tone" :label="status.label" :pulse="status.pulse" size="sm" class="you__status" />
    </div>

    <p v-if="layout === 'card'" class="you__question">{{ question }}</p>
    <p v-if="figure" class="you__figure mk-fig" :class="{ 'is-void': answer === 'no' }">{{ figure }}</p>
    <p class="you__what">
      <span v-if="layout === 'row'" class="you__q">{{ question }}</span>
      {{ what }}
    </p>

    <dl v-if="lines.length && layout === 'card'" class="you__lines">
      <div v-for="line in lines" :key="line.label">
        <dt>{{ line.label }}</dt>
        <dd>{{ line.value }}</dd>
      </div>
    </dl>

    <div class="you__foot mk-end">
      <div v-if="!answer" class="you__actions">
        <RButton size="sm" tone="danger" data-focus="no" @click="reply('no')">{{ no }}</RButton>
        <RButton size="sm" variant="outline" @click="reply('yes')">{{ yes }}</RButton>
      </div>
      <div v-else class="you__done" aria-live="polite">
        <p class="you__said">
          <span class="you__at">{{ at }}</span>
          {{ answer === 'yes' ? yesDone : noDone }}
        </p>
        <RButton size="sm" variant="ghost" data-focus="undo" @click="undo">Undo</RButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.you {
  gap: 6px;
}

.you__status {
  flex: none;
}

.you__question {
  margin-top: 2px;
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.3;
}

.you__figure {
  overflow: hidden;
  font-size: var(--r-text-3xl);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.you--row .you__figure {
  font-size: var(--r-text-xl);
}

/* A blocked amount keeps its figure, struck through, so the record still reads. */
.you__figure.is-void {
  color: var(--r-text-tertiary);
  text-decoration: line-through;
  text-decoration-thickness: 2px;
}

.you__what {
  overflow: hidden;
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
  line-height: 1.4;
  text-overflow: ellipsis;
}

.you--row .you__what {
  white-space: nowrap;
}

.you__q {
  color: var(--r-text);
  font-weight: var(--r-weight-semibold);
}

.you__lines {
  display: grid;
  margin: 4px 0 0;
  border-top: 1px solid var(--r-border-subtle);
}

.you__lines > div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 5px 0;
  border-bottom: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-xs);
}

.you__lines dt {
  flex: none;
  color: var(--r-text-tertiary);
}

.you__lines dd {
  overflow: hidden;
  margin: 0;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.you__foot {
  padding-top: 4px;
}

.you__actions {
  display: flex;
  gap: 8px;
}

.you__actions > * {
  flex: 1 1 0;
  min-width: 0;
}

.you__done {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: var(--r-control-sm);
}

.you__said {
  min-width: 0;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

.you__at {
  margin-right: 4px;
  color: var(--r-text);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
}
</style>
