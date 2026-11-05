<script setup lang="ts">
/**
 * Ownership is the one thing a person cannot take back alone once the other side accepts, so it
 * never goes from a sentence: it waits here for a hold, and says what cannot be undone.
 */
import { useId } from 'vue'
import { TriangleAlert } from 'lucide-vue-next'
import { RButton } from '@/design-system'
import HoldButton from './HoldButton.vue'

defineProps<{
  /** The admin who would become owner. */
  to: string
  first: string
  owner: string
}>()

const emit = defineEmits<{ done: []; cancel: [] }>()
const titleId = useId()
</script>

<template>
  <section class="s-orgnow-risk" data-decision :aria-labelledby="titleId">
    <header class="s-orgnow-risk__head">
      <p class="s-orgnow-risk__eyebrow">Deliberate · ownership</p>
      <h3 :id="titleId" class="s-orgnow-risk__title">Transfer ownership to {{ to }}</h3>
    </header>
    <dl class="s-orgnow-risk__rows">
      <div class="s-orgnow-risk__row">
        <dt>Owner</dt>
        <dd>
          <span class="s-orgnow-risk__from">{{ owner }}</span>
          <span class="s-orgnow-risk__arrow" aria-hidden="true">→</span>
          <span class="s-orgnow-risk__to"><span class="r-sr-only">to </span>{{ to }}</span>
        </dd>
      </div>
      <div class="s-orgnow-risk__row">
        <dt>You become</dt>
        <dd>Admin</dd>
      </div>
      <div class="s-orgnow-risk__row">
        <dt>{{ first }} accepts</dt>
        <dd>Within 72 hours of sending; until then you are the owner</dd>
      </div>
    </dl>
    <p class="s-orgnow-risk__cannot">
      <TriangleAlert aria-hidden="true" />
      <span>Cannot be undone once {{ first }} accepts: only {{ first }} can transfer it back.</span>
    </p>
    <footer class="s-orgnow-risk__foot">
      <HoldButton label="Hold to send transfer" :aria-label="`Hold to send transfer to ${to}`" data-primary @done="emit('done')" />
      <RButton variant="ghost" @click="emit('cancel')">Cancel</RButton>
    </footer>
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
  display: flex;
  flex-wrap: wrap;
  gap: 2px 8px;
  margin: 0;
  min-width: 0;
}

.s-orgnow-risk__from,
.s-orgnow-risk__arrow {
  color: var(--r-text-tertiary);
}

.s-orgnow-risk__to {
  font-weight: var(--r-weight-semibold);
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

.s-orgnow-risk__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  padding-top: 2px;
}
</style>
