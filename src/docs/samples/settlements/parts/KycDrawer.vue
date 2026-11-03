<script setup lang="ts">
/**
 * The KYC review drawer: the documents as a masked datasheet, the fields read from them with
 * mismatches flagged, the automated checks, and the decision.
 */
import { computed, ref, watch } from 'vue'
import { TriangleAlert } from 'lucide-vue-next'
import { RBadge, RButton, RDialog, RMeter, RSegmented, RSelect, RSpecList, RStatus, RTextarea } from '@/design-system'
import type { SegmentedOption, SpecItem } from '@/design-system'
import DocumentFrame from './DocumentFrame.vue'
import { REJECT_REASONS, RISK_TONE, slaOf, submittedLabel, type KycApplicant } from '../data'

export interface KycDecision {
  id: string
  decision: 'approve' | 'reject'
  reason: string | null
  note: string
}

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{ applicant: KycApplicant | null }>()
const emit = defineEmits<{ decide: [decision: KycDecision] }>()

const docIndex = ref<string | number>(0)
const reason = ref<string | number | null>(null)
const note = ref('')
const error = ref('')

watch(
  () => props.applicant?.id,
  () => {
    docIndex.value = 0
    reason.value = null
    note.value = ''
    error.value = ''
  },
)
watch(note, () => {
  if (note.value.trim()) error.value = ''
})

const a = computed(() => props.applicant)
const doc = computed(() => a.value?.documents[Number(docIndex.value)] ?? null)

// A document with a flagged field carries a warning mark in the switcher.
const docOptions = computed<SegmentedOption[]>(
  () =>
    a.value?.documents.map((d, i) => ({
      label: d.label,
      value: i,
      icon: d.fields.some((f) => f.expected) ? TriangleAlert : undefined,
    })) ?? [],
)

const fields = computed<SpecItem[]>(
  () =>
    doc.value?.fields.map((f) => ({
      label: f.label,
      value: f.value,
      mono: f.mono,
      hint: f.expected ? `${f.expectedFrom ?? 'Application'}: ${f.expected}` : f.hint,
      tone: f.expected ? ('warning' as const) : undefined,
    })) ?? [],
)
const flagOf = (index: number) => doc.value?.fields[index]?.flag ?? 'Mismatch'

const checks = computed<SpecItem[]>(
  () => a.value?.checks.map((c) => ({ label: c.label, value: c.value, tone: c.tone, hint: c.hint })) ?? [],
)

const flaggedChecks = computed(() => a.value?.checks.filter((c) => c.tone !== 'success').length ?? 0)
const sla = computed(() => (a.value ? slaOf(a.value) : null))
const score = computed(() => a.value?.score ?? 0)
const scoreTone = computed(() => (score.value >= 0.9 ? 'success' : score.value >= 0.8 ? 'warning' : 'danger'))
const scoreWord = computed(() => (score.value >= 0.9 ? 'Strong' : score.value >= 0.8 ? 'Review' : 'Weak'))
const description = computed(() => (a.value ? `${a.value.owner} · ${a.value.category} · ${a.value.city}` : undefined))

function decide(decision: 'approve' | 'reject') {
  if (!a.value) return
  if (decision === 'reject' && !note.value.trim()) {
    error.value = 'Write a reason before rejecting. The applicant sees it.'
    return
  }
  const label = REJECT_REASONS.find((r) => r.value === reason.value)?.label ?? null
  emit('decide', { id: a.value.id, decision, reason: label, note: note.value.trim() })
}
</script>

<template>
  <RDialog v-model:open="open" side="right" size="lg" :eyebrow="a?.id" :title="a?.business" :description="description">
    <div v-if="a && doc" class="s-settlements-review">
      <div class="s-settlements-review__meta">
        <RBadge :tone="RISK_TONE[a.risk]" dot>{{ a.risk }} risk</RBadge>
        <RStatus v-if="sla" :tone="sla.tone" :label="`${sla.word} · ${sla.text}`" />
        <span class="s-settlements-review__stamp">Submitted {{ submittedLabel(a.submitted) }} WIB · {{ a.docType }}</span>
      </div>

      <section class="s-settlements-review__section" aria-labelledby="s-settlements-review-docs">
        <header class="s-settlements-review__head">
          <span class="r-index">01</span>
          <h3 id="s-settlements-review-docs" class="r-eyebrow">Documents</h3>
          <span class="r-label">{{ a.documents.length }} uploaded</span>
        </header>
        <RSegmented v-model="docIndex" :options="docOptions" size="sm" label="Document" class="s-settlements-review__docs" />
        <DocumentFrame :doc="doc" />
      </section>

      <section class="s-settlements-review__section" aria-labelledby="s-settlements-review-fields">
        <header class="s-settlements-review__head">
          <span class="r-index">02</span>
          <h3 id="s-settlements-review-fields" class="r-eyebrow">Extracted fields</h3>
          <span class="r-label">OCR · {{ doc.label }}</span>
        </header>
        <RSpecList :items="fields" dense>
          <template #value="{ item, index }">
            <span class="s-settlements-review__value">
              {{ item.value }}
              <RBadge v-if="item.tone === 'warning'" tone="warning" size="sm">{{ flagOf(index) }}</RBadge>
            </span>
          </template>
        </RSpecList>
      </section>

      <section class="s-settlements-review__section" aria-labelledby="s-settlements-review-checks">
        <header class="s-settlements-review__head">
          <span class="r-index">03</span>
          <h3 id="s-settlements-review-checks" class="r-eyebrow">Automated checks</h3>
          <span class="r-label">{{ flaggedChecks ? `${flaggedChecks} flagged` : 'All clear' }}</span>
        </header>
        <div class="s-settlements-review__score">
          <div class="s-settlements-review__score-figure">
            <span class="r-label">Match score</span>
            <span class="s-settlements-review__score-value">{{ score.toFixed(2) }}</span>
          </div>
          <div class="s-settlements-review__score-meter">
            <RMeter
              variant="segments"
              :value="Math.round(score * 100)"
              :max="100"
              :count="20"
              :tone="scoreTone"
              :height="14"
              :label="`Match score ${score.toFixed(2)} of 1, ${scoreWord.toLowerCase()}`"
            />
            <div class="s-settlements-review__scale" aria-hidden="true">
              <span>0</span>
              <span class="s-settlements-review__threshold">0.80</span>
              <span>1.00</span>
            </div>
          </div>
          <RStatus :tone="scoreTone" :label="scoreWord" />
        </div>
        <RSpecList :items="checks" dense />
      </section>

      <section class="s-settlements-review__section" aria-labelledby="s-settlements-review-decision">
        <header class="s-settlements-review__head">
          <span class="r-index">04</span>
          <h3 id="s-settlements-review-decision" class="r-eyebrow">Decision</h3>
          <span class="r-label">Kept in the audit log</span>
        </header>
        <div class="s-settlements-review__decision">
          <RSelect v-model="reason" :options="REJECT_REASONS" label="Reason" placeholder="Choose a reason" />
          <RTextarea
            v-model="note"
            label="Note to the applicant"
            :rows="3"
            :maxlength="400"
            :error="error"
            :hint="error ? undefined : 'Required to reject. The applicant sees it in the Sesi app.'"
            placeholder="Say what does not match and what to upload again."
          />
        </div>
      </section>
    </div>

    <template #footer>
      <span class="s-settlements-review__who">Signed as R. Wibowo</span>
      <RButton variant="outline" tone="danger" @click="decide('reject')">Reject</RButton>
      <RButton tone="brand" @click="decide('approve')">Approve</RButton>
    </template>
  </RDialog>
</template>

<style scoped>
.s-settlements-review {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.s-settlements-review__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
  margin-top: -4px;
}

.s-settlements-review__stamp {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.s-settlements-review__section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.s-settlements-review__head {
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.s-settlements-review__head .r-label {
  margin-left: auto;
}

.s-settlements-review__docs {
  align-self: flex-start;
  max-width: 100%;
}

.s-settlements-review__value {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 4px 8px;
}

/* Match score: a figure, an LED meter with its scale, and the verdict as a word. */
.s-settlements-review__score {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 20px;
  padding: 12px 16px;
  border: 1px solid var(--r-border);
}

.s-settlements-review__score-figure {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.s-settlements-review__score-value {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xl);
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.s-settlements-review__score-meter {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.s-settlements-review__scale {
  position: relative;
  display: flex;
  justify-content: space-between;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.s-settlements-review__threshold {
  position: absolute;
  left: 80%;
  color: var(--r-text-secondary);
  transform: translateX(-50%);
}
/* The threshold tick, between the 16th and 17th block. */
.s-settlements-review__threshold::before {
  position: absolute;
  bottom: calc(100% + 1px);
  left: 50%;
  width: 1px;
  height: 6px;
  background: var(--r-text);
  content: '';
}

.s-settlements-review__decision {
  display: grid;
  gap: 12px;
}

.s-settlements-review__who {
  margin-right: auto;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

@media (max-width: 520px) {
  .s-settlements-review__score {
    grid-template-columns: auto minmax(0, 1fr);
  }
  .s-settlements-review__score > :last-child {
    grid-column: 1 / -1;
  }
}
</style>
