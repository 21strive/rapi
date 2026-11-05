<script setup lang="ts">
/**
 * Policy checks with their results in words: the failures first, then the warnings, then what
 * passed. Open a check to read why; the switch hides what passed, so the list is the work to do.
 */
import { computed, ref } from 'vue'
import { ChevronRight } from 'lucide-vue-next'
import { RBadge, RSwitch } from '@/design-system'
import { verdictTone, verdictWord, type Verdict } from './shared'

interface Check {
  name: string
  result: Exclude<Verdict, 'skip'>
  detail: string
  /** Rule id, mono: "CKV_NET_22", "KDB-60". */
  rule?: string
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    checks: Check[]
    /** list 2x2/1x2: details open in place · compact 2x1: the detail reads in the last line. */
    layout?: 'list' | 'compact' | 'narrow'
  }>(),
  { layout: 'list' },
)

const order = { fail: 0, warn: 1, pass: 2 } as const
const sorted = computed(() => [...props.checks].sort((a, b) => order[a.result] - order[b.result]))
const problemsOnly = ref(false)
const shown = computed(() => (problemsOnly.value ? sorted.value.filter((c) => c.result !== 'pass') : sorted.value))
const open = ref<string | null>(null)

const counts = computed(() => {
  const c = { pass: 0, fail: 0, warn: 0 }
  for (const ch of props.checks) c[ch.result]++
  return c
})

const openCheck = computed(() => props.checks.find((c) => c.name === open.value))

function toggle(name: string) {
  open.value = open.value === name ? null : name
}
</script>

<template>
  <div class="mk policy" :class="`policy--${layout}`">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span class="policy__sum">
        <span v-if="counts.fail" class="is-fail">{{ counts.fail }} fail</span>
        <span v-if="counts.warn" class="is-warn">{{ counts.warn }} warn</span>
        <span>{{ counts.pass }} pass</span>
      </span>
    </div>

    <ul class="policy__list mk-grow">
      <li v-for="c in shown" :key="c.name" class="policy__item" :class="`is-${c.result}`">
        <button type="button" class="policy__row" :aria-expanded="open === c.name" @click="toggle(c.name)">
          <RBadge size="sm" :tone="verdictTone[c.result]" class="policy__badge">{{ verdictWord[c.result] }}</RBadge>
          <span class="policy__name">{{ c.name }}</span>
          <span v-if="c.rule && layout === 'list'" class="policy__rule">{{ c.rule }}</span>
          <ChevronRight :size="12" aria-hidden="true" class="policy__chev" :class="{ 'is-open': open === c.name }" />
        </button>
        <p v-if="open === c.name && layout !== 'compact'" class="policy__detail">{{ c.detail }}</p>
      </li>
    </ul>

    <p v-if="layout === 'compact'" class="policy__reading mk-truncate" aria-live="polite">
      {{ openCheck ? openCheck.detail : 'Open a check to read why.' }}
    </p>

    <RSwitch v-if="layout !== 'compact'" v-model="problemsOnly" size="sm" class="policy__switch" :label="layout === 'narrow' ? 'Problems only' : 'Show problems only'" />
  </div>
</template>

<style scoped>
.policy {
  gap: 8px;
}

.policy__sum {
  display: inline-flex;
  flex: none;
  gap: 8px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
}

.policy__sum .is-fail {
  color: var(--r-danger-text);
}

.policy__sum .is-warn {
  color: var(--r-warning-text);
}

.policy__list {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-top: 1px solid var(--r-border-subtle);
}

.policy__item {
  border-bottom: 1px solid var(--r-border-subtle);
}

.policy__row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 28px;
  margin: 0;
  padding: 3px 2px;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.policy__row:hover {
  background: var(--r-bg-hover);
}

.policy__row:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: -2px;
}

.policy__badge {
  justify-content: center;
  min-width: 40px;
}

.policy__name {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  font-size: var(--r-text-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.policy__item.is-pass .policy__name {
  color: var(--r-text-secondary);
}

.policy__rule {
  flex: none;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
}

.policy__chev {
  flex: none;
  color: var(--r-text-tertiary);
  transition: transform var(--r-duration-fast) var(--r-ease-out);
}
.policy__chev.is-open {
  transform: rotate(90deg);
}

.policy__detail {
  padding: 0 4px 8px 50px;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: var(--r-leading-snug);
}

.policy__reading {
  flex: none;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

.policy__switch {
  flex: none;
}

/* Compact 2x1: three rows and the reading line. */
.policy--compact .policy__row {
  min-height: 24px;
  padding: 1px 2px;
}

/* Narrow 1x2: names wrap to two lines, the detail tucks under. */
.policy--narrow .policy__name {
  display: -webkit-box;
  white-space: normal;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-height: var(--r-leading-snug);
}
.policy--narrow .policy__detail {
  padding-left: 4px;
}
</style>
