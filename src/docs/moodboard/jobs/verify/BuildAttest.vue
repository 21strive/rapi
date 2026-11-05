<script setup lang="ts">
/**
 * Where a build came from, as claims a person can check one by one: the commit and who signed it,
 * the builder, what went into it, whether a second build came out identical. Each claim opens to
 * its evidence; Verify checks them all again and dates the result. The digest copies whole.
 */
import { computed, nextTick, ref } from 'vue'
import { Check, Copy } from 'lucide-vue-next'
import { RButton } from '@/design-system'
import { arrowMove, copyText, stamp, useFlash, useSequence } from './shared'

interface Claim {
  label: string
  value: string
  /** The word when it holds: "Signed", "Hermetic", "Identical". */
  word: string
  ok: boolean
  /** What the check looked at. */
  evidence: string
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    digest: string
    claims: Claim[]
    verifiedAt?: string
    /** card 2x2 · row 2x1. */
    layout?: 'card' | 'row'
  }>(),
  { verifiedAt: '', layout: 'card' },
)

const selected = ref(0)
const rows: (HTMLElement | null)[] = []
const at = ref(props.verifiedAt)
const { step, running, run } = useSequence()
const { on: copied, flash } = useFlash()

async function copy() {
  await copyText(props.digest)
  flash()
}

function verify() {
  if (running.value) return
  at.value = ''
  run(props.claims.length, 300, () => {
    at.value = stamp()
  })
}

function onKeydown(event: KeyboardEvent, i: number) {
  const next = arrowMove(event, i, props.claims.length, 'vertical')
  if (next === null) return
  event.preventDefault()
  selected.value = next
  nextTick(() => rows[next]?.focus())
}

function wordOf(c: Claim, i: number) {
  if (running.value && i >= step.value) return i === step.value ? 'Checking' : '—'
  return c.ok ? c.word : 'Fails'
}

const failing = computed(() => props.claims.filter((c) => !c.ok).length)
const claim = computed(() => props.claims[selected.value])
</script>

<template>
  <div class="mk attest" :class="`attest--${layout}`">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span class="attest__sum" :class="{ 'is-bad': failing }">
        {{ running ? 'Checking' : failing ? `${failing} claim fails` : `${claims.length} of ${claims.length} hold` }}
      </span>
    </div>

    <div v-if="layout === 'card'" class="attest__digest">
      <span class="attest__hash mk-truncate">{{ digest }}</span>
      <button type="button" class="attest__copy mk-reset" :aria-label="copied ? 'Digest copied' : 'Copy the digest'" @click="copy">
        <Check v-if="copied" :size="14" aria-hidden="true" />
        <Copy v-else :size="14" aria-hidden="true" />
      </button>
    </div>

    <ul class="attest__claims mk-grow" role="listbox" :aria-label="`Claims about ${eyebrow}`">
      <li
        v-for="(c, i) in claims"
        :key="c.label"
        :ref="(el) => (rows[i] = el as HTMLElement | null)"
        role="option"
        class="attest__claim"
        :class="{ 'is-selected': i === selected, 'is-bad': !c.ok && !(running && i >= step), 'is-pending': running && i >= step }"
        :aria-selected="i === selected"
        :tabindex="i === selected ? 0 : -1"
        @click="selected = i"
        @keydown="onKeydown($event, i)"
      >
        <span class="attest__label">{{ c.label }}</span>
        <span class="attest__value mk-truncate">{{ c.value }}</span>
        <span class="attest__word">{{ wordOf(c, i) }}</span>
      </li>
    </ul>

    <p v-if="layout === 'card'" class="attest__evidence" aria-live="polite">{{ claim.evidence }}</p>

    <div class="mk-row mk-between attest__foot">
      <span class="attest__at mk-truncate">
        <template v-if="layout === 'row'">{{ claim.evidence }}</template>
        <template v-else>{{ at ? `Verified ${at}` : running ? 'Checking claims' : 'Not verified yet' }}</template>
      </span>
      <RButton size="xs" variant="outline" :aria-busy="running" @click="verify">{{ at ? 'Verify again' : 'Verify' }}</RButton>
    </div>
  </div>
</template>

<style scoped>
.attest {
  gap: 8px;
}

.attest__sum {
  flex: none;
  color: var(--r-success-text);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.attest__sum.is-bad {
  color: var(--r-danger-text);
}

.attest__digest {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  padding: 4px 4px 4px 8px;
  border: 1px solid var(--r-border);
  background: var(--r-bg-muted);
}

.attest__hash {
  flex: 1 1 auto;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
}

.attest__copy {
  display: grid;
  flex: none;
  place-items: center;
  width: 22px;
  height: 22px;
  color: var(--r-text-secondary);
  cursor: pointer;
}
.attest__copy:hover {
  background: var(--r-bg-hover);
  color: var(--r-text);
}

.attest__claims {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-top: 1px solid var(--r-border-subtle);
}

.attest__claim {
  position: relative;
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  min-height: 28px;
  padding: 0 4px 0 8px;
  border-bottom: 1px solid var(--r-border-subtle);
  cursor: pointer;
}

.attest__claim:hover {
  background: var(--r-bg-hover);
}

.attest__claim.is-selected {
  background: var(--r-bg-selected);
}

.attest__claim.is-selected::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 2px;
  background: var(--r-brand);
}

.attest__claim:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: -2px;
}

.attest__label {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.attest__value {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
}

.attest__word {
  color: var(--r-success-text);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.attest__claim.is-bad .attest__word {
  color: var(--r-danger-text);
}

.attest__claim.is-pending .attest__word {
  color: var(--r-text-tertiary);
}

.attest__evidence {
  display: -webkit-box;
  flex: none;
  overflow: hidden;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: var(--r-leading-snug);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.attest__foot {
  gap: 10px;
}

.attest__at {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
}

.attest--row {
  gap: 6px;
}
.attest--row .attest__claim {
  min-height: 23px;
}

.attest--row .attest__at {
  color: var(--r-text-secondary);
  font-family: var(--r-font-sans);
  font-size: var(--r-text-xs);
}
</style>
