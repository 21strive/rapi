<script setup lang="ts">
/**
 * Which account: a bank's monogram, a name people use for it, and the last four, never more.
 * Picking one is a radio choice, with the arrow keys or a press, and the sentence underneath says
 * what the choice means.
 */
import { computed, ref } from 'vue'
import { ChevronRight } from 'lucide-vue-next'
import { RAvatar, RBadge } from '@/design-system'
import { masked } from './shared'

interface Account {
  id: string
  bank: string
  /** What people call it: "Operating", "Kas koperasi". */
  name: string
  last4: string
  currency: string
  balance?: string
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    /** Whose accounts: "Toko Kelontong Bu Ratna". */
    subject?: string
    accounts: Account[]
    selected?: string
    /** The sentence under the list; {account} becomes the chosen account. */
    footer?: string
    /** What the chosen one is: "Default", "Sweep target". */
    mark?: string
    /** `list` 2x2 or 2x1 · `chip` 1x1 · `table` 3x2. */
    layout?: 'list' | 'chip' | 'table'
  }>(),
  { mark: 'Default', layout: 'list' },
)

const chosen = ref(props.selected ?? props.accounts[0]?.id)
const index = computed(() => Math.max(0, props.accounts.findIndex((a) => a.id === chosen.value)))
const account = computed(() => props.accounts[index.value])
const sentence = computed(() =>
  props.footer?.replace('{account}', `${account.value.bank} ${masked(account.value.last4)}`),
)

const rows = ref<(HTMLElement | null)[]>([])
function choose(i: number, focus = false) {
  const n = props.accounts.length
  const k = (i + n) % n
  chosen.value = props.accounts[k].id
  if (focus) rows.value[k]?.focus()
}

function onKeydown(event: KeyboardEvent) {
  const keys: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }
  if (event.key in keys) choose(index.value + keys[event.key], true)
  else if (event.key === 'Home') choose(0, true)
  else if (event.key === 'End') choose(props.accounts.length - 1, true)
  else return
  event.preventDefault()
}
</script>

<template>
  <!-- 1x1: the one account a payment comes from; press for the next -->
  <div v-if="layout === 'chip'" class="mk acct acct--chip">
    <div class="mk-row mk-between">
      <span class="r-eyebrow">{{ eyebrow }}</span>
      <span class="r-label">{{ index + 1 }}/{{ accounts.length }}</span>
    </div>
    <button
      type="button"
      class="acct__chip mk-reset"
      :aria-label="`${eyebrow}: ${account.name}, ${account.bank} ending ${account.last4}. Press for the next account`"
      @click="choose(index + 1)"
    >
      <span class="acct__chip-top">
        <RAvatar :name="account.bank" size="sm" decorative />
        <span class="acct__chip-name mk-truncate">{{ account.name }}</span>
        <ChevronRight :size="14" class="acct__chip-next" aria-hidden="true" />
      </span>
      <span class="acct__chip-bank mk-truncate">{{ account.bank }}</span>
      <span class="acct__chip-num r-mono">{{ masked(account.last4) }}</span>
    </button>
    <p v-if="account.balance" class="acct__chip-balance mk-end" aria-live="polite">
      <span class="mk-unit">{{ account.currency }}</span>
      <span class="mk-fig">{{ account.balance }}</span>
    </p>
  </div>

  <!-- 2x1 and 2x2: a radio list -->
  <div v-else-if="layout === 'list'" class="mk acct acct--list">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span v-if="subject" class="r-label mk-truncate">{{ subject }}</span>
    </div>
    <div class="acct__list" role="radiogroup" :aria-label="eyebrow" @keydown="onKeydown">
      <div
        v-for="(a, i) in accounts"
        :key="a.id"
        :ref="(el) => (rows[i] = el as HTMLElement | null)"
        role="radio"
        class="acct__row"
        :class="{ 'is-chosen': chosen === a.id }"
        :aria-checked="chosen === a.id"
        :tabindex="chosen === a.id ? 0 : -1"
        :aria-label="`${a.name}, ${a.bank} ending ${a.last4}, ${a.currency}`"
        @click="choose(i)"
      >
        <span class="acct__radio" aria-hidden="true" />
        <RAvatar :name="a.bank" size="sm" decorative />
        <span class="acct__text">
          <span class="acct__name mk-truncate">{{ a.name }}</span>
          <span class="acct__bank mk-truncate">{{ a.bank }} · <span class="r-mono">{{ masked(a.last4) }}</span></span>
        </span>
        <RBadge v-if="chosen === a.id" tone="brand" size="sm">{{ mark }}</RBadge>
        <span v-else class="r-label">{{ a.currency }}</span>
      </div>
    </div>
    <p v-if="sentence" class="acct__footer mk-end" aria-live="polite">{{ sentence }}</p>
  </div>

  <!-- 3x2: a table of accounts with balances -->
  <div v-else class="mk acct acct--table">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span v-if="subject" class="r-label mk-truncate">{{ subject }}</span>
    </div>
    <div class="acct__head" aria-hidden="true">
      <span />
      <span>Account</span>
      <span class="acct__ccy">Ccy</span>
      <span class="acct__num">Balance</span>
    </div>
    <div class="acct__list" role="radiogroup" :aria-label="eyebrow" @keydown="onKeydown">
      <div
        v-for="(a, i) in accounts"
        :key="a.id"
        :ref="(el) => (rows[i] = el as HTMLElement | null)"
        role="radio"
        class="acct__row acct__row--table"
        :class="{ 'is-chosen': chosen === a.id }"
        :aria-checked="chosen === a.id"
        :tabindex="chosen === a.id ? 0 : -1"
        :aria-label="`${a.name}, ${a.bank} ending ${a.last4}, ${a.currency} ${a.balance ?? ''}`"
        @click="choose(i)"
      >
        <span class="acct__radio" aria-hidden="true" />
        <span class="acct__text">
          <span class="acct__name mk-truncate">
            {{ a.name }}
            <RBadge v-if="chosen === a.id" tone="brand" size="sm" class="acct__mark">{{ mark }}</RBadge>
          </span>
          <span class="acct__bank mk-truncate">{{ a.bank }} · <span class="r-mono">{{ masked(a.last4) }}</span></span>
        </span>
        <span class="acct__ccy r-label">{{ a.currency }}</span>
        <span class="acct__num acct__balance">{{ a.balance }}</span>
      </div>
    </div>
    <p v-if="sentence" class="acct__footer mk-end" aria-live="polite">{{ sentence }}</p>
  </div>
</template>

<style scoped>
.acct--list,
.acct--table {
  container-type: inline-size;
}

.acct__list {
  display: flex;
  flex-direction: column;
  min-width: 0;
  border-top: 1px solid var(--r-border-subtle);
}

.acct__row {
  display: grid;
  grid-template-columns: 12px 24px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  min-height: 42px;
  padding: 0 8px 0 6px;
  border-bottom: 1px solid var(--r-border-subtle);
  border-left: 2px solid transparent;
  cursor: pointer;
}

.acct__row:hover {
  background: var(--r-bg-hover);
}

.acct__row:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: -2px;
}

.acct__row.is-chosen {
  border-left-color: var(--r-brand);
  background: var(--r-bg-selected);
}

/* The radio dot: a circle, because a radio is a state. */
.acct__radio {
  position: relative;
  width: 12px;
  height: 12px;
  border: 1px solid var(--r-border-control);
  border-radius: var(--r-radius-round);
  background: var(--r-bg-surface);
}

.is-chosen .acct__radio {
  border-color: var(--r-brand);
}

.is-chosen .acct__radio::after {
  content: '';
  position: absolute;
  inset: 2px;
  border-radius: var(--r-radius-round);
  background: var(--r-brand);
}

.acct__text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.acct__name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-semibold);
  line-height: 1.35;
}

.acct__bank {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.35;
}

.acct__footer {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.45;
}

/* Table */
.acct__head,
.acct__row--table {
  grid-template-columns: 12px minmax(0, 1fr) 44px minmax(0, 0.7fr);
}

.acct__head {
  display: grid;
  gap: 10px;
  padding: 0 8px 4px 8px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.acct__row--table {
  min-height: 36px;
}

.acct__num {
  text-align: right;
}

.acct__balance {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
}

.acct__mark {
  flex: none;
}

/* Chip */
.acct__chip {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0 -6px;
  padding: 6px;
  border: 1px solid var(--r-border);
  cursor: pointer;
}

.acct__chip:hover {
  border-color: var(--r-border-strong);
  background: var(--r-bg-hover);
}

.acct__chip-top {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.acct__chip-name {
  flex: 1 1 auto;
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-semibold);
}

.acct__chip-next {
  color: var(--r-text-tertiary);
}

.acct__chip-bank {
  padding-left: 32px;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

.acct__chip-num {
  padding-left: 32px;
  font-size: var(--r-text-xs);
}

.acct__chip-balance {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.acct__chip-balance .mk-fig {
  font-size: var(--r-text-lg);
}

@container (max-width: 420px) {
  .acct__head,
  .acct__row--table {
    grid-template-columns: 12px minmax(0, 1fr) minmax(0, 0.8fr);
  }
  .acct__ccy {
    display: none;
  }
}
</style>
