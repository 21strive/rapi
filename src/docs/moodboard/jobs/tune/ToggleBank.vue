<script setup lang="ts">
/**
 * A bank of switches with what they add up to: a card's controls, a flag across regions, the
 * sign-in methods a workspace allows. Every on and off is visible at once, and the line at the
 * bottom says what the combination means. Each switch is the library's RSwitch (click, Space).
 */
import { computed, reactive } from 'vue'
import { RSwitch } from '@/design-system'

interface Item {
  label: string
  description?: string
  on: boolean
  /** Share of users or traffic behind this switch, 0–1, drawn as a small bar. */
  share?: number
}
interface Say {
  text: string
  word?: string
  tone?: 'success' | 'warning' | 'danger'
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    items: Item[]
    summary: (on: boolean[]) => Say
    /** Two columns of switches without descriptions (short tiles). */
    columns?: 1 | 2
  }>(),
  { columns: 1 },
)

const on = reactive(props.items.map((i) => i.on))
const count = computed(() => on.filter(Boolean).length)
const said = computed(() => props.summary([...on]))
</script>

<template>
  <div class="mk bank" :class="`bank--${columns}`">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span class="r-label bank__count">{{ count }} of {{ items.length }} on</span>
    </div>

    <ul class="bank__list">
      <li v-for="(item, i) in items" :key="item.label" class="bank__row">
        <RSwitch v-model="on[i]" :label="item.label" :description="columns === 1 ? item.description : undefined" size="sm" />
        <span v-if="item.share !== undefined" class="bank__share" :class="{ 'is-on': on[i] }" aria-hidden="true">
          <span class="bank__bar"><span :style="{ width: `${item.share * 100}%` }" /></span>
          <span class="bank__pct">{{ Math.round(item.share * 100) }}%</span>
        </span>
      </li>
    </ul>

    <p class="bank__say mk-end" aria-live="polite">
      <span class="bank__text">{{ said.text }}</span>
      <span v-if="said.word" class="bank__word" :class="`is-${said.tone}`">{{ said.word }}</span>
    </p>
  </div>
</template>

<style scoped>
.bank {
  gap: 8px;
}

.bank__count {
  flex: none;
}

.bank__list {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--r-border-subtle);
}

.bank__row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  padding: 7px 0;
  border-bottom: 1px solid var(--r-border-subtle);
}
.bank__row :deep(.r-switch) {
  min-width: 0;
}
.bank__row :deep(.r-switch__description) {
  font-size: var(--r-text-xs);
  line-height: 1.35;
}

.bank__share {
  display: flex;
  flex: none;
  align-items: center;
  gap: 6px;
  margin-top: 3px;
  color: var(--r-text-tertiary);
}
.bank__bar {
  display: block;
  width: 48px;
  height: 6px;
  background: var(--r-chart-track);
}
.bank__bar span {
  display: block;
  height: 100%;
  background: var(--r-chart-context);
  transition: background-color var(--r-duration-fast) var(--r-ease-out);
}
.bank__share.is-on .bank__bar span {
  background: var(--r-chart-1);
}
.bank__pct {
  width: 28px;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
  text-align: right;
}
.bank__share.is-on .bank__pct {
  color: var(--r-text);
}

.bank__say {
  display: flex;
  flex-direction: column;
  gap: 2px;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.35;
}
.bank__word {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.bank__word.is-success {
  color: var(--r-success-text);
}
.bank__word.is-warning {
  color: var(--r-warning-text);
}
.bank__word.is-danger {
  color: var(--r-danger-text);
}

/* Two columns: short labels, no descriptions, no rules between rows. */
.bank--2 .bank__list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px 12px;
  border-top: 0;
}
.bank--2 .bank__row {
  padding: 2px 0;
  border-bottom: 0;
}
</style>
