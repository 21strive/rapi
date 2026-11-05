<script setup lang="ts">
/**
 * An identity check, field by field: each value masked, each with its verdict in a word, so a
 * reviewer reads the exceptions instead of rereading everything. Seeing a full value is itself an
 * act on the record: it shows for five seconds and leaves a line in the access log.
 */
import { computed, ref } from 'vue'
import { Eye, EyeOff } from 'lucide-vue-next'
import { RStatus } from '@/design-system'
import { stamp, useCountdown } from './shared'

interface Field {
  label: string
  masked: string
  /** The unmasked value. Invented, like everything on this board. */
  full?: string
  verdict: 'match' | 'partial' | 'mismatch' | 'unreadable'
  /** Why it is not a clean match. */
  note?: string
  /** "94%", for a face or a name similarity. */
  score?: string
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    subject?: string
    fields: Field[]
    /** list 2x2/2x1 · strip 3x1. */
    layout?: 'list' | 'strip'
  }>(),
  { layout: 'list' },
)

const look = {
  match: { tone: 'success', word: 'Match' },
  partial: { tone: 'warning', word: 'Partial' },
  mismatch: { tone: 'danger', word: 'Mismatch' },
  unreadable: { tone: 'neutral', word: 'Unreadable' },
} as const

const shown = ref<number | null>(null)
const log = ref('')
const { left, start, stop } = useCountdown(5, () => {
  shown.value = null
})

function reveal(i: number) {
  if (shown.value === i) {
    stop()
    shown.value = null
    return
  }
  shown.value = i
  log.value = `${props.fields[i].label} viewed by you · ${stamp()} · logged`
  start()
}

const review = computed(() => props.fields.filter((f) => f.verdict !== 'match').length)
const firstNote = computed(() => props.fields.find((f) => f.note))
</script>

<template>
  <div class="mk kyc" :class="`kyc--${layout}`">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <RStatus v-if="review" tone="warning" :label="`${review} to review`" size="sm" />
      <RStatus v-else tone="success" label="All match" size="sm" />
    </div>
    <p v-if="layout === 'list' && subject" class="kyc__subject mk-truncate">{{ subject }}</p>

    <dl class="kyc__fields mk-grow">
      <div v-for="(f, i) in fields" :key="f.label" class="kyc__field" :class="`is-${f.verdict}`">
        <dt class="kyc__label mk-truncate">{{ f.label }}</dt>
        <dd class="kyc__value">
          <span class="kyc__text mk-truncate" :class="{ 'is-shown': shown === i }">{{ shown === i ? f.full : f.masked }}</span>
        </dd>
        <dd class="kyc__eyecell">
          <button
            v-if="f.full"
            type="button"
            class="kyc__eye mk-reset"
            :aria-pressed="shown === i"
            :aria-label="shown === i ? `Hide ${f.label}` : `Show ${f.label} for five seconds; this is logged`"
            @click="reveal(i)"
          >
            <EyeOff v-if="shown === i" :size="14" aria-hidden="true" />
            <Eye v-else :size="14" aria-hidden="true" />
            <span v-if="shown === i" class="kyc__left">{{ left }}</span>
          </button>
        </dd>
        <dd class="kyc__verdict">
          <span v-if="f.score" class="kyc__score">{{ f.score }}</span>
          <RStatus :tone="look[f.verdict].tone" :label="look[f.verdict].word" size="sm" />
        </dd>
        <dd v-if="f.note && layout === 'list'" class="kyc__note">{{ f.note }}</dd>
      </div>
    </dl>

    <p class="kyc__log mk-truncate" aria-live="polite">
      <template v-if="log">{{ log }}</template>
      <template v-else-if="layout === 'strip' && firstNote">{{ firstNote.label }}: {{ firstNote.note }}</template>
      <template v-else>Values stay masked. Showing one is logged.</template>
    </p>
  </div>
</template>

<style scoped>
.kyc {
  gap: 8px;
  container-type: inline-size;
}

.kyc__subject {
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
}

.kyc__fields {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-top: 1px solid var(--r-border-subtle);
}

.kyc__field {
  display: grid;
  grid-template-columns: minmax(56px, 0.8fr) minmax(0, 1.6fr) 36px auto;
  align-items: center;
  column-gap: 10px;
  min-height: 30px;
  padding: 3px 0;
  border-bottom: 1px solid var(--r-border-subtle);
}

.kyc__label {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.kyc__value {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  margin: 0;
}

.kyc__text {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
}

.kyc__text.is-shown {
  background: var(--r-bg-selected);
  outline: 1px solid var(--r-brand-border);
  white-space: normal;
  overflow-wrap: anywhere;
}

.kyc__eyecell {
  display: flex;
  margin: 0;
}

.kyc__eye {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 3px;
  height: 22px;
  padding: 0 4px;
  color: var(--r-text-tertiary);
  cursor: pointer;
}
.kyc__eye:hover {
  background: var(--r-bg-hover);
  color: var(--r-text);
}
.kyc__eye[aria-pressed='true'] {
  color: var(--r-brand-text);
}

.kyc__left {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
}

.kyc__verdict {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  margin: 0;
}

.kyc__score {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
}

.kyc__note {
  grid-column: 2 / -1;
  margin: 0 0 2px;
  color: var(--r-warning-text);
  font-size: var(--r-text-xs);
  line-height: var(--r-leading-snug);
}

.kyc__field.is-mismatch .kyc__note {
  color: var(--r-danger-text);
}

.kyc__log {
  flex: none;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
}

/* Strip: the fields stand side by side, each a column. */
.kyc--strip .kyc__fields {
  display: grid;
  grid-auto-columns: minmax(0, 1fr);
  grid-auto-flow: column;
  border-top: 0;
  border-left: 1px solid var(--r-border-subtle);
}
.kyc--strip .kyc__field {
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas:
    'label eye'
    'value value'
    'verdict verdict';
  align-content: start;
  row-gap: 4px;
  padding: 2px 10px;
  border-right: 1px solid var(--r-border-subtle);
  border-bottom: 0;
}
.kyc--strip .kyc__label {
  grid-area: label;
}
.kyc--strip .kyc__value {
  grid-area: value;
}
.kyc--strip .kyc__eyecell {
  grid-area: eye;
}
.kyc--strip .kyc__verdict {
  grid-area: verdict;
}
.kyc--strip .kyc__verdict {
  justify-content: flex-start;
}
/* On a phone the strip folds back into compact rows, so masked values stay whole. */
@container (max-width: 420px) {
  .kyc--strip .kyc__fields {
    display: flex;
    flex-direction: column;
    border-top: 1px solid var(--r-border-subtle);
    border-left: 0;
  }
  .kyc--strip .kyc__field {
    grid-template-columns: minmax(56px, 0.8fr) minmax(0, 1.6fr) 36px auto;
    grid-template-areas: 'label value eye verdict';
    min-height: 26px;
    padding: 2px 0;
    border-right: 0;
    border-bottom: 1px solid var(--r-border-subtle);
  }
}
</style>
