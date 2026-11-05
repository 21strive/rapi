<script setup lang="ts">
/**
 * A policy answer is only worth something if a person can open the paragraph it came from. The
 * answer carries numbered citations; pressing one shows the quoted passage, marked, with the
 * document, the section and the date. The citations are the screen.
 */
import { computed, ref } from 'vue'
import { ArrowLeft, CornerDownLeft, MessageSquareText } from 'lucide-vue-next'
import { RInput } from '@/design-system'
import Writing from './Writing.vue'
import { understand, useClock, useReply } from './shared'

interface Source {
  /** "Returns policy §4.2". */
  title: string
  /** "Updated 2 Oct 2026". */
  meta: string
  quote: string
  /** The words in the quote the answer leans on; marked. */
  mark?: string
}

interface Answer {
  q: string
  match: string
  /** The answer, with [1] [2] where a source backs it. */
  text: string
}

const props = withDefaults(
  defineProps<{
    agent?: string
    start?: string
    answers: Answer[]
    sources: Source[]
    /** What it searched, for anything outside it: "the returns policy". */
    scope: string
    /** An example to offer when it finds nothing. */
    example: string
    /** No field: the question was asked; the tile is the check. */
    compact?: boolean
  }>(),
  { agent: 'Simpul', start: '10:02' },
)

const clock = useClock(props.start)
const current = ref(0)
const at = ref(clock.now())
const draft = ref(props.answers[0].q)
const missed = ref(false)
const picked = ref<number | null>(null)
const { busy, reply } = useReply(700)

/** The answer cut into text and citations; `cite` is 0 for plain text. */
const parts = computed(() =>
  props.answers[current.value].text
    .split(/(\[\d+\])/)
    .filter(Boolean)
    .map((p) => {
      const m = p.match(/^\[(\d+)\]$/)
      return m ? { cite: Number(m[1]), text: '' } : { cite: 0, text: p }
    }),
)
const cited = computed(() => [...new Set(parts.value.filter((p) => p.cite).map((p) => p.cite))].sort((x, y) => x - y))

function ask(text = draft.value) {
  const said = text.trim()
  if (!said) return
  picked.value = null
  reply(() => {
    const found = understand(said, props.answers)
    at.value = clock.next()
    missed.value = !found
    if (found) current.value = props.answers.indexOf(found)
  })
}

function pick(n: number) {
  picked.value = picked.value === n ? null : n
}

function marked(source: Source) {
  if (!source.mark || !source.quote.includes(source.mark)) return [{ text: source.quote, mark: false }]
  const [before, ...rest] = source.quote.split(source.mark)
  return [
    { text: before, mark: false },
    { text: source.mark, mark: true },
    { text: rest.join(source.mark), mark: false },
  ]
}
</script>

<template>
  <div class="mk cited" :class="{ 'cited--compact': compact }">
    <form v-if="!compact" class="cited__ask" @submit.prevent="ask()">
      <RInput v-model="draft" size="sm" :aria-label="`Ask about ${scope}`">
        <template #leading><MessageSquareText /></template>
        <template #trailing>
          <button type="submit" class="cited__send mk-reset" aria-label="Ask">
            <CornerDownLeft :size="14" />
          </button>
        </template>
      </RInput>
    </form>
    <p v-else class="cited__q mk-truncate">“{{ answers[current].q }}”</p>

    <div class="cited__main mk-grow" aria-live="polite">
      <p class="cited__meta">
        <span>{{ agent }} · {{ at }}</span>
        <span v-if="!busy && !missed">{{ cited.length }} {{ cited.length === 1 ? 'source' : 'sources' }}</span>
      </p>
      <Writing v-if="busy" label="Reading" />
      <p v-else-if="missed" class="cited__text">
        I could not find that in {{ scope }}. Try “{{ example }}”
      </p>

      <template v-else-if="compact && picked != null">
        <div class="cited__quote">
          <p class="cited__src">
            <span class="cited__num">{{ picked }}</span>
            <span class="mk-truncate">{{ sources[picked - 1].title }} · {{ sources[picked - 1].meta }}</span>
          </p>
          <p class="cited__said">
            <template v-for="(bit, i) in marked(sources[picked - 1])" :key="i">
              <mark v-if="bit.mark">{{ bit.text }}</mark>
              <template v-else>{{ bit.text }}</template>
            </template>
          </p>
        </div>
        <button type="button" class="cited__back mk-reset" @click="picked = null">
          <ArrowLeft :size="14" aria-hidden="true" />Back to the answer
        </button>
      </template>

      <template v-else>
        <p class="cited__text">
          <template v-for="(part, i) in parts" :key="i">
            <button
              v-if="part.cite"
              type="button"
              class="cited__cite mk-reset"
              :class="{ 'is-on': picked === part.cite }"
              :aria-pressed="picked === part.cite"
              :aria-label="`Source ${part.cite}: ${sources[part.cite - 1]?.title}`"
              @click="pick(part.cite)"
            >
              {{ part.cite }}
            </button>
            <template v-else>{{ part.text }}</template>
          </template>
        </p>

        <ol v-if="!compact" class="cited__list">
          <li v-for="n in cited" :key="n" class="cited__item" :class="{ 'is-on': picked === n }">
            <button type="button" class="cited__row mk-reset" :aria-expanded="picked === n" @click="pick(n)">
              <span class="cited__num">{{ n }}</span>
              <span class="mk-truncate">{{ sources[n - 1].title }}</span>
              <span class="cited__date">{{ sources[n - 1].meta }}</span>
            </button>
            <p v-if="picked === n" class="cited__said">
              <template v-for="(bit, i) in marked(sources[n - 1])" :key="i">
                <mark v-if="bit.mark">{{ bit.text }}</mark>
                <template v-else>{{ bit.text }}</template>
              </template>
            </p>
          </li>
        </ol>
      </template>
    </div>
  </div>
</template>

<style scoped>
.cited {
  gap: 8px;
}

.cited__ask {
  flex: none;
}

.cited__send {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: var(--r-text-tertiary);
  cursor: pointer;
}

.cited__send:hover {
  color: var(--r-text);
}

.cited__q {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

.cited__main {
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow: hidden;
}

.cited__meta {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.cited__text {
  font-size: var(--r-text-sm);
  line-height: 1.5;
}

.cited--compact .cited__text {
  display: -webkit-box;
  overflow: hidden;
  font-size: var(--r-text-xs);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
}

/* A citation: a small square key with its number, raised a little like a footnote. */
.cited__cite {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  margin: 0 1px;
  padding: 0 3px;
  border: 1px solid var(--r-border-strong);
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  line-height: 1;
  vertical-align: 2px;
  cursor: pointer;
}

.cited__cite:hover,
.cited__cite.is-on {
  border-color: var(--r-brand);
  background: var(--r-bg-selected);
  color: var(--r-brand-text);
}

.cited__list {
  display: flex;
  flex-direction: column;
  margin: 2px 0 0;
  padding: 0;
  border-top: 1px solid var(--r-border-subtle);
  list-style: none;
}

.cited__item {
  border-bottom: 1px solid var(--r-border-subtle);
}

.cited__row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 0;
  height: 28px;
  font-size: var(--r-text-xs);
  cursor: pointer;
}

.cited__row:hover .mk-truncate {
  color: var(--r-brand-text);
}

.cited__num {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: 1px solid var(--r-border-strong);
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
}

.is-on .cited__num {
  border-color: var(--r-brand);
  background: var(--r-bg-selected);
  color: var(--r-brand-text);
}

.cited__date {
  flex: none;
  margin-left: auto;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
}

.cited__said {
  margin: 0 0 8px 24px;
  padding-left: 8px;
  border-left: 2px solid var(--r-border-strong);
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.45;
}

.cited__said mark {
  background: var(--r-brand-soft);
  color: var(--r-text);
}

.cited__quote {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 0;
  overflow: hidden;
}

.cited__quote .cited__said {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.cited__src {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: var(--r-text-xs);
}

.cited__back {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 4px;
  margin-top: auto;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
  cursor: pointer;
}

.cited__back:hover {
  color: var(--r-text);
}
</style>
