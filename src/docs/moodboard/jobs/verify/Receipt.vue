<script setup lang="ts">
/**
 * A receipt: the record both sides of a payment point to. The reference copies in one press and
 * the fee lines open in place of the note, so a dispute starts from the same facts.
 */
import { ref } from 'vue'
import { Check, ChevronDown, Copy } from 'lucide-vue-next'
import { RStatus } from '@/design-system'
import { copyText, useFlash, type Mark } from './shared'

interface Line {
  label: string
  value: string
  mono?: boolean
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    status: Mark
    /** "Rp 2.450.000". */
    amount: string
    party?: string
    partySub?: string
    reference: string
    /** What the reference is called where it is used: "Reference", "NTPN", "UETR", "RRN". */
    referenceLabel?: string
    when?: string
    lines?: Line[]
    note?: string
    /** card 2x2 · slip 1x2 (lines always shown) · strip 3x1 · mini 1x1. */
    layout?: 'card' | 'slip' | 'strip' | 'mini'
  }>(),
  { referenceLabel: 'Reference', lines: () => [], layout: 'card' },
)

const open = ref(false)
const { on: copied, flash } = useFlash()

async function copy() {
  await copyText(props.reference)
  flash()
}
</script>

<template>
  <div class="mk receipt" :class="`receipt--${layout}`">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <RStatus :tone="status.tone" :label="status.label" size="sm" />
    </div>

    <div class="receipt__body">
      <div class="receipt__who">
        <p class="receipt__amount mk-fig">{{ amount }}</p>
        <p v-if="party" class="receipt__party mk-truncate">{{ party }}</p>
        <p v-if="partySub" class="receipt__sub mk-truncate">{{ partySub }}</p>
      </div>

      <dl class="receipt__lines">
        <div class="receipt__line receipt__line--ref">
          <dt>{{ referenceLabel }}</dt>
          <dd class="receipt__ref">{{ reference }}</dd>
          <button
            type="button"
            class="receipt__copy mk-reset"
            :class="{ 'is-done': copied }"
            :aria-label="copied ? `${referenceLabel} copied` : `Copy ${referenceLabel} ${reference}`"
            @click="copy"
          >
            <Check v-if="copied" :size="14" aria-hidden="true" />
            <Copy v-else :size="14" aria-hidden="true" />
            <span v-if="layout !== 'mini'" class="receipt__copy-word">{{ copied ? 'Copied' : 'Copy' }}</span>
          </button>
        </div>
        <div v-if="when && layout !== 'mini'" class="receipt__line">
          <dt>Time</dt>
          <dd class="receipt__mono">{{ when }}</dd>
        </div>
        <template v-if="layout === 'slip' || open">
          <div v-for="line in lines" :key="line.label" class="receipt__line">
            <dt>{{ line.label }}</dt>
            <dd :class="{ receipt__mono: line.mono }">{{ line.value }}</dd>
          </div>
        </template>
      </dl>
    </div>

    <p v-if="note && !open && layout === 'card'" class="receipt__note">{{ note }}</p>

    <button
      v-if="lines.length && layout === 'card'"
      type="button"
      class="receipt__toggle mk-reset mk-end"
      :aria-expanded="open"
      @click="open = !open"
    >
      <ChevronDown :size="14" aria-hidden="true" class="receipt__chev" :class="{ 'is-open': open }" />
      {{ open ? 'Hide details' : `Details · ${lines.length} lines` }}
    </button>
  </div>
</template>

<style scoped>
.receipt {
  gap: 8px;
}

.receipt__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
}

.receipt__who {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.receipt__amount {
  overflow: hidden;
  font-size: var(--r-text-3xl);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.receipt__party {
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-medium);
}

.receipt__sub {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.receipt__lines {
  display: grid;
  border-top: 1px solid var(--r-border-subtle);
}

.receipt__line {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  min-height: 24px;
  border-bottom: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-xs);
}

.receipt__line dt {
  flex: none;
  color: var(--r-text-tertiary);
}

.receipt__line dd {
  flex: 1 1 auto;
  min-width: 0;
  margin: 0;
  overflow: hidden;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.receipt__mono,
.receipt__ref {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  letter-spacing: 0;
}

.receipt__line--ref {
  min-height: 30px;
}

.receipt__ref {
  color: var(--r-text);
  font-variant-numeric: tabular-nums;
}

.receipt__copy {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 4px;
  height: 24px;
  padding: 0 6px;
  border: 1px solid var(--r-border-strong);
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  cursor: pointer;
  transition:
    background-color var(--r-duration-fast) var(--r-ease-out),
    color var(--r-duration-fast) var(--r-ease-out);
}
.receipt__copy:hover {
  background: var(--r-bg-hover);
  color: var(--r-text);
}
.receipt__copy.is-done {
  border-color: var(--r-success-border);
  color: var(--r-success-text);
}

.receipt__note {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  line-height: var(--r-leading-snug);
}

.receipt__toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  align-self: flex-start;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  cursor: pointer;
}
.receipt__toggle:hover {
  color: var(--r-text);
}

.receipt__chev {
  transition: transform var(--r-duration-fast) var(--r-ease-out);
}
.receipt__chev.is-open {
  transform: rotate(180deg);
}

/* Slip: a narrow till roll, every line printed. */
.receipt--slip .receipt__amount {
  font-size: var(--r-text-2xl);
}
.receipt--slip .receipt__line--ref {
  flex-wrap: wrap;
  padding: 4px 0;
}
.receipt--slip .receipt__line--ref .receipt__copy {
  justify-content: center;
  width: 100%;
}

/* Strip: amount on the left, the record on the right. */
.receipt--strip {
  container-type: inline-size;
}
.receipt--strip .receipt__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr);
  gap: 16px;
}
.receipt--strip .receipt__amount {
  font-size: var(--r-text-2xl);
}
.receipt--strip .receipt__ref {
  white-space: normal;
  overflow-wrap: anywhere;
  line-height: 1.35;
}
@container (max-width: 420px) {
  .receipt--strip .receipt__body {
    grid-template-columns: minmax(0, 1fr);
    gap: 6px;
  }
  .receipt--strip .receipt__sub {
    display: none;
  }
  .receipt--strip .receipt__amount {
    font-size: var(--r-text-xl);
  }
}

/* Mini: one figure and the reference. */
.receipt--mini .receipt__amount {
  font-size: var(--r-text-2xl);
}
.receipt--mini .receipt__body {
  flex: 1 1 auto;
  justify-content: space-between;
}
.receipt--mini .receipt__lines {
  border-top-color: var(--r-border);
}
.receipt--mini .receipt__line {
  border-bottom: 0;
}
.receipt--mini .receipt__line dt {
  display: none;
}
.receipt--mini .receipt__line dd {
  text-align: left;
}
.receipt--mini .receipt__copy {
  width: 24px;
  justify-content: center;
  padding: 0;
}
</style>
