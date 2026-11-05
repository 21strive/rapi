<script setup lang="ts">
/**
 * A question typed as a sentence, answered with a figure. The screen keeps what a person needs to
 * trust the number: the working, step by step, and what was read to get it. Follow-ups are one
 * tap; anything outside the script gets told what can be asked.
 */
import { computed, ref } from 'vue'
import { ChevronRight, CornerDownLeft, MessageSquareText } from 'lucide-vue-next'
import { RInput, RTrend } from '@/design-system'
import { pad } from '../../kit'
import Writing from './Writing.vue'
import { understand, useClock, useReply } from './shared'

interface Answer {
  /** The question as a person would ask it. */
  q: string
  /** The follow-up key: "By account". */
  chip: string
  match: string
  figure: string
  unit?: string
  /** Change in percent. */
  delta?: number
  against?: string
  invert?: boolean
  says: string
  working: string[]
  /** What was read: tables, files, meters. */
  sources: string[]
}

const props = withDefaults(
  defineProps<{
    /** Mono caps at the right of the answer: "Treasury". */
    topic: string
    agent?: string
    start?: string
    answers: Answer[]
    /** What it can answer about, said to anything outside the script. */
    scope: string
  }>(),
  { agent: 'Simpul', start: '09:14' },
)

const clock = useClock(props.start)
const current = ref(0)
const at = ref(clock.now())
const draft = ref(props.answers[0].q)
const missed = ref(false)
const open = ref(false)
const { busy, reply } = useReply(750)

const a = computed(() => props.answers[current.value])
const next = computed(() =>
  props.answers
    .map((x, i) => ({ chip: x.chip, i }))
    .filter((x) => x.i !== current.value)
    .slice(0, 2),
)

function ask(text = draft.value) {
  const said = text.trim()
  if (!said) return
  draft.value = said
  reply(() => {
    const found = understand(said, props.answers)
    at.value = clock.next()
    missed.value = !found
    if (found) current.value = props.answers.indexOf(found)
  })
}

function follow(i: number) {
  ask(props.answers[i].q)
}
</script>

<template>
  <div class="mk figure" :class="{ 'is-open': open }">
    <form class="figure__ask" @submit.prevent="ask()">
      <RInput v-model="draft" size="sm" :aria-label="`Ask about ${topic}`">
        <template #leading><MessageSquareText /></template>
        <template #trailing>
          <button type="submit" class="figure__send mk-reset" aria-label="Ask">
            <CornerDownLeft :size="14" />
          </button>
        </template>
      </RInput>
    </form>

    <div class="figure__main mk-grow" aria-live="polite">
      <div class="figure__answer">
        <p class="figure__meta">
          <span>{{ agent }} · {{ at }}</span>
          <span class="mk-truncate">{{ topic }}</span>
        </p>
        <Writing v-if="busy" label="Working it out" />
        <p v-else-if="missed" class="figure__says">
          I can answer questions about {{ scope }}. Try “{{ next[0]?.chip ?? answers[0].chip }}” below.
        </p>
        <template v-else>
          <p class="figure__fig">
            <span class="mk-fig mk-truncate">{{ a.figure }}</span>
            <span v-if="a.unit" class="mk-unit">{{ a.unit }}</span>
          </p>
          <p v-if="a.delta != null" class="figure__delta">
            <RTrend :value="a.delta" :invert="a.invert" size="sm" />
            <span class="mk-truncate">{{ a.against }}</span>
          </p>
          <p class="figure__says">{{ a.says }}</p>
          <button type="button" class="figure__toggle mk-reset" :aria-expanded="open" @click="open = !open">
            <ChevronRight :size="14" :class="{ 'is-open': open }" aria-hidden="true" />
            {{ open ? 'Hide working' : 'Show working' }}
          </button>
        </template>
      </div>
      <div v-if="!busy && !missed" class="figure__working" :class="{ 'is-open': open }">
        <p class="r-label">Working</p>
        <ol class="figure__steps">
          <li v-for="(step, i) in a.working" :key="step">
            <span class="figure__n">{{ pad(i + 1) }}</span>
            <span>{{ step }}</span>
          </li>
        </ol>
        <p class="figure__sources">Read · {{ a.sources.join(' · ') }}</p>
      </div>
    </div>

    <div class="figure__next">
      <span class="r-label">Ask next</span>
      <button
        v-for="x in next"
        :key="x.chip"
        type="button"
        class="figure__chip mk-reset mk-truncate"
        :disabled="busy"
        @click="follow(x.i)"
      >
        {{ x.chip }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.figure {
  container-type: inline-size;
  gap: 10px;
}

.figure__ask {
  flex: none;
}

.figure__send {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: var(--r-text-tertiary);
  cursor: pointer;
}

.figure__send:hover {
  color: var(--r-text);
}

.figure__main {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
}

.figure__answer {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.figure__meta {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.figure__fig {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}

.figure__fig .mk-fig {
  font-size: var(--r-text-2xl);
}

.figure__delta {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.figure__says {
  font-size: var(--r-text-sm);
  line-height: 1.4;
}

.figure__toggle {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 4px;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
  cursor: pointer;
}

.figure__toggle:hover {
  color: var(--r-text);
}

.figure__toggle svg {
  transition: transform var(--r-duration-fast) var(--r-ease-out);
}

.figure__toggle svg.is-open {
  transform: rotate(90deg);
}

.figure__working {
  display: none;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding-top: 8px;
  border-top: 1px solid var(--r-border-subtle);
}

.figure__working.is-open {
  display: flex;
}

.figure__steps {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.figure__steps li {
  display: flex;
  gap: 8px;
  font-size: var(--r-text-xs);
  line-height: 1.35;
}

.figure__n {
  flex: none;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  line-height: 16px;
}

.figure__sources {
  overflow: hidden;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.figure__next {
  display: flex;
  flex: none;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 6px;
  min-width: 0;
  max-height: 61px;
  padding-top: 8px;
  overflow: hidden;
  border-top: 1px solid var(--r-border-subtle);
}

.figure__next .r-label {
  flex: none;
}

.figure__chip {
  flex: none;
  max-width: 100%;
  height: 24px;
  padding: 0 8px;
  border: 1px solid var(--r-border-strong);
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 22px;
  cursor: pointer;
}

.figure__chip:hover:not(:disabled) {
  border-color: var(--r-text-tertiary);
  color: var(--r-text);
}

/* Narrow: the working takes the sentence's place while it is open. */
@container (max-width: 459px) {
  .is-open .figure__says,
  .is-open .figure__delta {
    display: none;
  }
}

/* Wide: the working stands beside the answer, always open. */
@container (min-width: 460px) {
  .figure__main {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 20px;
  }
  .figure__working,
  .figure__working.is-open {
    display: flex;
    padding: 0 0 0 20px;
    border-top: 0;
    border-left: 1px solid var(--r-border-subtle);
  }
  .figure__toggle {
    display: none;
  }
  .figure__fig .mk-fig {
    font-size: var(--r-text-3xl);
  }
}
</style>
