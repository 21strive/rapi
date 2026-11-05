<script setup lang="ts">
/**
 * Chain of custody: every handoff of one object, with who took it, when, where, and whether the
 * seal was still the same number. A handoff opens to its conditions. One broken link is visible at
 * a look, and it says so in words.
 */
import { ref } from 'vue'
import { ChevronRight } from 'lucide-vue-next'
import { RStatus } from '@/design-system'

interface Handoff {
  who: string
  role?: string
  at: string
  place?: string
  seal?: string
  /** true: same seal · false: seal changed or broken. Leave out when there is no seal. */
  sealOk?: boolean
  note?: string
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    /** The object: "Sample 0412-B", "TGHU 441720 9". */
    item: string
    handoffs: Handoff[]
    /** Handoff to open first. */
    opened?: number | null
  }>(),
  { opened: null },
)

const open = ref<number | null>(props.opened)

function toggle(i: number) {
  open.value = open.value === i ? null : i
}

const broken = props.handoffs.filter((h) => h.sealOk === false).length
</script>

<template>
  <div class="mk custody">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <RStatus :tone="broken ? 'warning' : 'success'" :label="broken ? 'Check seal' : 'Unbroken'" size="sm" />
    </div>
    <p class="custody__item mk-truncate">{{ item }}</p>

    <ol class="custody__list mk-grow">
      <li
        v-for="(h, i) in handoffs"
        :key="`${h.who}-${h.at}`"
        class="custody__hand"
        :class="{ 'is-now': i === handoffs.length - 1, 'is-broken': h.sealOk === false }"
      >
        <span class="custody__node" aria-hidden="true" />
        <button type="button" class="custody__row" :aria-expanded="open === i" @click="toggle(i)">
          <span class="custody__who mk-truncate">{{ h.who }}</span>
          <span class="custody__at">{{ h.at }}</span>
          <span class="custody__meta mk-truncate">
            <template v-if="h.place">{{ h.place }}<template v-if="h.sealOk !== undefined"> · </template></template>
            <span v-if="h.sealOk !== undefined" class="custody__seal" :class="h.sealOk ? 'is-ok' : 'is-bad'">
              {{ h.sealOk ? 'Seal same' : 'Seal changed' }}
            </span>
          </span>
          <ChevronRight :size="12" aria-hidden="true" class="custody__chev" :class="{ 'is-open': open === i }" />
        </button>
        <p v-if="open === i" class="custody__note">
          <span v-if="h.role" class="custody__role">{{ h.role }}</span>
          <span v-if="h.seal" class="custody__sealno">Seal {{ h.seal }}</span>
          <span v-if="h.note">{{ h.note }}</span>
        </p>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.custody {
  gap: 6px;
  container-type: inline-size;
}

.custody__item {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
}

.custody__list {
  display: flex;
  flex-direction: column;
  margin-top: 4px;
  overflow: hidden;
}

.custody__hand {
  position: relative;
  padding-left: 16px;
}

/* The rail: from each node down to the next. */
.custody__hand::before {
  content: '';
  position: absolute;
  top: 12px;
  bottom: -2px;
  left: 4px;
  width: 1px;
  background: var(--r-border-strong);
}

.custody__hand:last-child::before {
  display: none;
}

.custody__node {
  position: absolute;
  top: 6px;
  left: 0;
  width: 9px;
  height: 9px;
  border: 1px solid var(--r-text);
  background: var(--r-text);
}

.custody__hand.is-now .custody__node {
  border-color: var(--r-brand);
  background: var(--r-brand);
}

.custody__hand.is-broken .custody__node {
  border-color: var(--r-status-warning);
  background: var(--r-status-warning);
}

.custody__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto 12px;
  grid-template-areas:
    'who at chev'
    'meta meta chev';
  align-items: center;
  column-gap: 8px;
  width: 100%;
  margin: 0;
  padding: 2px 2px 8px 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.custody__row:hover .custody__who {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.custody__row:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: 0;
}

.custody__who {
  grid-area: who;
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
}

.custody__at {
  grid-area: at;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
}

.custody__meta {
  grid-area: meta;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.custody__seal {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.custody__seal.is-ok {
  color: var(--r-success-text);
}

.custody__seal.is-bad {
  color: var(--r-warning-text);
}

.custody__chev {
  grid-area: chev;
  color: var(--r-text-tertiary);
  transition: transform var(--r-duration-fast) var(--r-ease-out);
}
.custody__chev.is-open {
  transform: rotate(90deg);
}

.custody__note {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: -4px 0 8px;
  padding: 6px 8px;
  border-left: 2px solid var(--r-border-strong);
  background: var(--r-bg-muted);
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: var(--r-leading-snug);
}

.custody__role {
  color: var(--r-text);
}

.custody__sealno {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
}

/* Narrow: the time goes under the name so neither is cut. */
@container (max-width: 240px) {
  .custody__row {
    grid-template-columns: minmax(0, 1fr) 12px;
    grid-template-areas:
      'who chev'
      'at chev'
      'meta chev';
    row-gap: 1px;
  }
}
</style>
