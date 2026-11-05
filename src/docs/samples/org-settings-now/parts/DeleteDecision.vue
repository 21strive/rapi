<script setup lang="ts">
/**
 * Deleting the organization is scheduled, never done from a sentence: the name typed in full is
 * the deliberate act, one of the few fields worth a field. It says what goes and when it can no
 * longer be undone.
 */
import { computed, ref, useId } from 'vue'
import { TriangleAlert } from 'lucide-vue-next'
import { RButton, RInput, formatNumber } from '@/design-system'

const props = defineProps<{
  name: string
  footprint: { projects: number; deployments: number; domains: number; apiKeys: number; storage: string }
  /** "25 Nov 2026". */
  on: string
}>()

const emit = defineEmits<{ confirm: []; cancel: [] }>()

const typed = ref('')
const matches = computed(() => typed.value.trim() === props.name)
const titleId = useId()

function confirm() {
  if (matches.value) emit('confirm')
}
</script>

<template>
  <section class="s-orgnow-risk" data-decision :aria-labelledby="titleId">
    <header>
      <p class="s-orgnow-risk__eyebrow">Deliberate · deletion</p>
      <h3 :id="titleId" class="s-orgnow-risk__title">Delete {{ name }}</h3>
    </header>
    <dl class="s-orgnow-risk__rows">
      <div class="s-orgnow-risk__row">
        <dt>Removes</dt>
        <dd>
          {{ footprint.projects }} projects · {{ formatNumber(footprint.deployments) }} deployments · {{ footprint.domains }} custom domains ·
          {{ footprint.storage }}
        </dd>
      </div>
      <div class="s-orgnow-risk__row">
        <dt>API keys</dt>
        <dd>{{ footprint.apiKeys }}, revoked at once</dd>
      </div>
      <div class="s-orgnow-risk__row">
        <dt>Runs</dt>
        <dd>{{ on }}, 7 days after you confirm; until then everything keeps working</dd>
      </div>
    </dl>
    <p class="s-orgnow-risk__cannot">
      <TriangleAlert aria-hidden="true" />
      <span>Cannot be undone after {{ on }}: nothing can be recovered. Any admin can cancel until then; invoices stay with the billing contact.</span>
    </p>
    <div class="s-orgnow-risk__confirm">
      <RInput
        v-model="typed"
        class="s-orgnow-risk__field"
        :label="`Type ${name} to confirm`"
        :placeholder="name"
        autocomplete="off"
        spellcheck="false"
        data-primary
        @keydown.enter.prevent="confirm"
      />
      <div class="s-orgnow-risk__buttons">
        <RButton tone="danger" :disabled="!matches" @click="confirm">Schedule deletion</RButton>
        <RButton variant="ghost" @click="emit('cancel')">Cancel</RButton>
      </div>
    </div>
  </section>
</template>

<style scoped>
.s-orgnow-risk {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px 14px;
  border: 1px solid var(--r-danger-border);
  background: var(--r-bg-surface);
}

.s-orgnow-risk__eyebrow {
  color: var(--r-danger-text);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  line-height: 1.4;
  text-transform: uppercase;
}

.s-orgnow-risk__title {
  margin-top: 2px;
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.3;
}

.s-orgnow-risk__rows {
  display: flex;
  flex-direction: column;
  margin: 0;
  border-top: 1px solid var(--r-border-subtle);
}

.s-orgnow-risk__row {
  display: grid;
  grid-template-columns: minmax(96px, 28%) minmax(0, 1fr);
  gap: 12px;
  padding: 6px 0;
  border-bottom: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-sm);
}

.s-orgnow-risk__row dt {
  color: var(--r-text-tertiary);
}

.s-orgnow-risk__row dd {
  margin: 0;
  min-width: 0;
  font-variant-numeric: tabular-nums;
}

.s-orgnow-risk__cannot {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: var(--r-danger-text);
  font-size: var(--r-text-sm);
  line-height: 1.45;
}

.s-orgnow-risk__cannot svg {
  flex: none;
  width: 14px;
  height: 14px;
  margin-top: 2px;
}

.s-orgnow-risk__confirm {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 8px 12px;
}

.s-orgnow-risk__field {
  flex: 1 1 240px;
  max-width: 320px;
}

.s-orgnow-risk__buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
