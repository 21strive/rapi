<script setup lang="ts">
/**
 * A signature, checked. The seal says in one word whether the file is what its signer signed; a
 * press turns it over to the key, the time and the issuer, which is what a careful person checks.
 */
import { computed, ref } from 'vue'
import { ShieldAlert, ShieldCheck, ShieldX } from 'lucide-vue-next'

interface Detail {
  label: string
  value: string
  mono?: boolean
}

const props = defineProps<{
  /** The signed thing: "PBG 3273-2026-0412", "commit a3f9c2e". */
  doc: string
  verdict: 'valid' | 'expired' | 'invalid'
  /** The word on the seal; defaults by verdict. */
  word?: string
  signer: string
  signedAt: string
  details: Detail[]
}>()

const open = ref(false)

const look = computed(
  () =>
    ({
      valid: { tone: 'success', icon: ShieldCheck, word: 'Verified' },
      expired: { tone: 'warning', icon: ShieldAlert, word: 'Cert expired' },
      invalid: { tone: 'danger', icon: ShieldX, word: 'Invalid' },
    })[props.verdict],
)
</script>

<template>
  <button
    type="button"
    class="mk seal"
    :class="[`r-tone-${look.tone}`, { 'is-open': open }]"
    :aria-expanded="open"
    @click="open = !open"
  >
    <span class="seal__frame">
      <template v-if="!open">
        <span class="seal__word">
          <component :is="look.icon" :size="16" aria-hidden="true" />
          {{ word ?? look.word }}
        </span>
        <span class="seal__signer">{{ signer }}</span>
        <span class="seal__doc">{{ doc }}</span>
        <span class="seal__at">{{ signedAt }}</span>
      </template>
      <template v-else>
        <span class="seal__back-head">
          <span>Details</span>
          <span class="seal__back-word">{{ word ?? look.word }}</span>
        </span>
        <span v-for="d in details" :key="d.label" class="seal__detail">
          <span class="seal__dl">{{ d.label }}</span>
          <span class="seal__dv" :class="{ 'is-mono': d.mono }">{{ d.value }}</span>
        </span>
      </template>
    </span>
  </button>
</template>

<style scoped>
.seal {
  margin: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-align: inherit;
  cursor: pointer;
}

/* The ring goes on the seal itself, inside the tile, where the tile edge cannot clip it. */
.seal:focus-visible {
  outline: none;
}
.seal:focus-visible .seal__frame {
  outline: 2px solid var(--r-focus);
  outline-offset: 2px;
}

.seal__frame {
  position: relative;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 4px;
  min-height: 0;
  padding: 8px 10px;
  overflow: hidden;
  border: 1px solid var(--r-border);
  background: var(--r-bg-surface);
  transition:
    background-color var(--r-duration-fast) var(--r-ease-out),
    border-color var(--r-duration-fast) var(--r-ease-out);
}

/* The leading edge of the seal carries the verdict colour, next to the word that says it. */
.seal__frame::before {
  content: '';
  position: absolute;
  top: -1px;
  bottom: -1px;
  left: -1px;
  width: 3px;
  background: var(--tone-text);
}

.seal:hover .seal__frame {
  border-color: var(--r-border-strong);
  background: var(--r-bg-hover);
}

.seal__word {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--tone-text);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.seal__signer {
  display: -webkit-box;
  margin-top: 2px;
  overflow: hidden;
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: var(--r-leading-snug);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.seal__doc,
.seal__at {
  overflow: hidden;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.seal__doc {
  margin-top: auto;
  color: var(--r-text-secondary);
}

.seal__at {
  color: var(--r-text-tertiary);
}

.seal__back-head {
  display: flex;
  justify-content: space-between;
  gap: 6px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.seal__back-word {
  overflow: hidden;
  color: var(--tone-text);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.seal__detail {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.seal__dl {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-3xs);
}

.seal__dv {
  overflow: hidden;
  font-size: var(--r-text-xs);
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.seal__dv.is-mono {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
}
</style>
