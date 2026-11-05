<script setup lang="ts">
/**
 * The filter builder, replaced by a sentence. The person says what they want; the screen keeps
 * only what needs a check: the terms it understood, as chips that can be taken out one by one,
 * and the count they produce.
 */
import { computed, onMounted, ref } from 'vue'
import { CornerDownLeft, MessageSquareText } from 'lucide-vue-next'
import { RChip, RInput } from '@/design-system'
import { num } from '../../kit'

interface Term {
  /** A regular expression, matched without case. */
  match: string
  /** What the chip says it understood: "Status · unpaid". */
  chip: string
  /** Share of the rows this term keeps, 0–1. */
  keep: number
}

const props = withDefaults(
  defineProps<{
    /** Plural noun of the rows: "invoices". */
    noun: string
    total: number
    terms: Term[]
    suggestions?: string[]
    placeholder?: string
    /** A sentence already asked, so the tile opens with an answer. */
    initial?: string
  }>(),
  { suggestions: () => [], placeholder: 'Say what you are looking for' },
)

const text = ref(props.initial ?? '')
const asked = ref('')
const applied = ref<Term[]>([])

function apply(sentence = text.value) {
  text.value = sentence
  asked.value = sentence.trim()
  applied.value = props.terms.filter((t) => new RegExp(t.match, 'i').test(sentence))
}

function remove(term: Term) {
  applied.value = applied.value.filter((t) => t !== term)
}

onMounted(() => {
  if (props.initial) apply(props.initial)
})

const count = computed(() => {
  if (!applied.value.length) return props.total
  return Math.max(1, Math.round(props.total * applied.value.reduce((p, t) => p * t.keep, 1)))
})
</script>

<template>
  <div class="mk sentence">
    <div class="mk-row mk-between">
      <span class="r-label">{{ noun }}</span>
      <span class="r-label">{{ num(total) }} in all</span>
    </div>
    <form class="sentence__form" @submit.prevent="apply()">
      <RInput v-model="text" size="md" :placeholder="placeholder" :aria-label="`Ask for ${noun}`">
        <template #leading><MessageSquareText /></template>
        <template #trailing>
          <button type="submit" class="sentence__send mk-reset" aria-label="Apply the sentence">
            <CornerDownLeft :size="14" />
          </button>
        </template>
      </RInput>
    </form>

    <div class="sentence__result mk-grow" aria-live="polite">
      <template v-if="asked">
        <p class="sentence__count">
          <span class="mk-fig">{{ num(count) }}</span>
          <span class="sentence__of">of {{ num(total) }} {{ noun }}</span>
        </p>
        <p v-if="applied.length" class="r-label">Understood as</p>
        <p v-else class="sentence__none">Nothing in that sentence to filter on yet. Try one of the examples.</p>
        <div v-if="applied.length" class="sentence__chips">
          <RChip
            v-for="term in applied"
            :key="term.chip"
            size="sm"
            variant="soft"
            tone="brand"
            removable
            :remove-label="`Remove ${term.chip}`"
            @remove="remove(term)"
          >
            {{ term.chip }}
          </RChip>
        </div>
      </template>
      <p v-else class="sentence__none">One sentence instead of a row of dropdowns.</p>
    </div>

    <div v-if="suggestions.length" class="sentence__try">
      <span class="r-label">Try</span>
      <button
        v-for="s in suggestions"
        :key="s"
        type="button"
        class="sentence__suggestion mk-reset mk-truncate"
        @click="apply(s)"
      >
        {{ s }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.sentence {
  gap: 10px;
}

.sentence__form {
  flex: none;
}

.sentence__send {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: var(--r-text-tertiary);
  cursor: pointer;
}
.sentence__send:hover {
  color: var(--r-text);
}

.sentence__result {
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow: hidden;
}

.sentence__count {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.sentence__count .mk-fig {
  font-size: var(--r-text-3xl);
}

.sentence__of {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-sm);
}

.sentence__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.sentence__none {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-sm);
}

.sentence__try {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-top: 8px;
  border-top: 1px solid var(--r-border-subtle);
}

.sentence__suggestion {
  padding: 2px 0;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  cursor: pointer;
}
.sentence__suggestion::before {
  content: '“';
}
.sentence__suggestion::after {
  content: '”';
}
.sentence__suggestion:hover {
  color: var(--r-brand-text);
}
</style>
