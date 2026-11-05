<script setup lang="ts">
/**
 * Feedback on an answer is one press and, when it was wrong, one reason. Nobody fills in a survey;
 * everybody taps "No, out of date".
 */
import { ref } from 'vue'
import { RButton } from '@/design-system'

const props = withDefaults(
  defineProps<{
    /** The answer being rated, short. */
    answer: string
    /** Why it was wrong, three or four words each. */
    reasons: string[]
    /** Who reads the "No": "the finance data team". */
    team: string
    question?: string
  }>(),
  { question: 'Was this right?' },
)

const state = ref<'ask' | 'why' | 'yes' | 'no'>('ask')
const reason = ref('')

function no(r: string) {
  reason.value = r
  state.value = 'no'
}

const thanks = () =>
  state.value === 'yes' ? 'Thanks. Kept as a good answer.' : `Thanks. Sent to ${props.team} with the answer, marked “${reason.value}”.`
</script>

<template>
  <div class="mk rate">
    <p class="r-eyebrow mk-truncate">{{ state === 'why' ? 'What was wrong?' : question }}</p>
    <div class="rate__body mk-grow">
      <p v-if="state !== 'why'" class="rate__answer">{{ answer }}</p>
      <div class="rate__side" aria-live="polite">
        <div v-if="state === 'ask'" class="rate__keys">
          <RButton size="xs" variant="outline" @click="state = 'yes'">Yes</RButton>
          <RButton size="xs" variant="outline" @click="state = 'why'">No</RButton>
        </div>
        <div v-else-if="state === 'why'" class="rate__reasons" role="group" aria-label="What was wrong">
          <button v-for="r in reasons" :key="r" type="button" class="rate__reason mk-reset mk-truncate" @click="no(r)">
            {{ r }}
          </button>
        </div>
        <div v-else class="rate__done">
          <p class="rate__thanks">{{ thanks() }}</p>
          <RButton size="xs" variant="ghost" @click="state = 'ask'">Undo</RButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rate {
  container-type: inline-size;
  gap: 6px;
}

.rate__body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
}

.rate__answer {
  display: -webkit-box;
  overflow: hidden;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.rate__side {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.rate__keys {
  display: flex;
  gap: 6px;
}

.rate__keys > * {
  flex: 1;
}

.rate__reasons {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--r-border-subtle);
}

.rate__reason {
  padding: 5px 0;
  border-bottom: 1px solid var(--r-border-subtle);
  color: var(--r-text);
  font-size: var(--r-text-xs);
  cursor: pointer;
}

.rate__reason:hover {
  color: var(--r-brand-text);
}

.rate__done {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.rate__thanks {
  display: -webkit-box;
  overflow: hidden;
  font-size: var(--r-text-xs);
  line-height: 1.4;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

@container (min-width: 300px) {
  .rate__body {
    flex-direction: row;
    align-items: flex-start;
    gap: 16px;
  }
  .rate__answer {
    flex: 1 1 50%;
    -webkit-line-clamp: 5;
  }
  .rate__side {
    flex: 1 1 50%;
  }
  .rate__reasons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 12px;
  }
}
</style>
