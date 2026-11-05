<script setup lang="ts">
/**
 * A long thread in three lines. Each line points to the messages it came from: pressing a number
 * shows that message, so the summary can be trusted without reading everything. "Show all"
 * opens the thread itself, with the cited messages marked.
 */
import { computed, ref } from 'vue'
import { ArrowLeft } from 'lucide-vue-next'
import { pad } from '../../kit'

interface Message {
  who: string
  at: string
  text: string
}

interface Line {
  text: string
  /** Message numbers, from 1. */
  cites: number[]
}

const props = withDefaults(
  defineProps<{
    channel: string
    /** "Since 07:40". */
    since: string
    messages: Message[]
    summary: Line[]
    agent?: string
    /** When the thread is longer than the messages given: "48 reports". */
    total?: number
    noun?: string
  }>(),
  { agent: 'Simpul', noun: 'messages' },
)

const view = ref<'summary' | 'all'>('summary')
/* Opens on the first message the summary cites, so the check is visible before any press. */
const quote = ref<number | null>(props.summary[0]?.cites[0] ?? null)
const count = computed(() => props.total ?? props.messages.length)
const citedSet = computed(() => new Set(props.summary.flatMap((l) => l.cites)))

function cite(n: number) {
  quote.value = quote.value === n ? null : n
}
</script>

<template>
  <div class="mk thread">
    <div class="mk-row mk-between">
      <span class="r-label mk-truncate">{{ channel }} · {{ count }} {{ noun }} · {{ since }}</span>
      <button type="button" class="thread__toggle mk-reset" :aria-expanded="view === 'all'" @click="view = view === 'all' ? 'summary' : 'all'">
        <template v-if="view === 'all'"><ArrowLeft :size="12" aria-hidden="true" />Summary</template>
        <template v-else>Show all</template>
      </button>
    </div>

    <template v-if="view === 'summary'">
      <p class="r-eyebrow">In {{ summary.length }} lines, by {{ agent }}</p>
      <ol class="thread__summary">
        <li v-for="(line, i) in summary" :key="i" class="thread__line">
          <span class="thread__n">{{ pad(i + 1) }}</span>
          <p class="thread__text">
            {{ line.text }}
            <button
              v-for="c in line.cites"
              :key="c"
              type="button"
              class="thread__cite mk-reset"
              :class="{ 'is-on': quote === c }"
              :aria-pressed="quote === c"
              :aria-label="`Message ${c}, from ${messages[c - 1]?.who}`"
              @click="cite(c)"
            >
              {{ c }}
            </button>
          </p>
        </li>
      </ol>
      <div class="thread__quote mk-grow" aria-live="polite">
        <template v-if="quote != null && messages[quote - 1]">
          <p class="thread__who">
            <span class="mk-truncate">{{ pad(quote) }} · {{ messages[quote - 1].who }}</span>
            <span>{{ messages[quote - 1].at }}</span>
          </p>
          <p class="thread__said">{{ messages[quote - 1].text }}</p>
        </template>
        <p v-else class="thread__hint">Press a number to read the message a line comes from.</p>
      </div>
    </template>

    <ol v-else class="thread__all mk-grow" :aria-label="`${channel}, all ${noun}`">
      <li v-for="(m, i) in messages" :key="i" class="thread__msg" :class="{ 'is-cited': citedSet.has(i + 1) }">
        <p class="thread__who">
          <span class="mk-truncate">{{ pad(i + 1) }} · {{ m.who }}</span>
          <span>{{ m.at }}</span>
        </p>
        <p class="thread__said">{{ m.text }}</p>
      </li>
      <li v-if="total && total > messages.length" class="thread__more">
        {{ total - messages.length }} more {{ noun }} say the same things
      </li>
    </ol>
  </div>
</template>

<style scoped>
.thread {
  gap: 8px;
}

.thread__toggle {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 4px;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
  cursor: pointer;
}

.thread__toggle:hover {
  color: var(--r-text);
}

.thread__summary {
  display: flex;
  flex: none;
  flex-direction: column;
  margin: 0;
  padding: 0;
  border-top: 1px solid var(--r-border-subtle);
  list-style: none;
}

.thread__line {
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr);
  gap: 6px;
  padding: 6px 0;
  border-bottom: 1px solid var(--r-border-subtle);
}

.thread__n {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  line-height: 19px;
}

.thread__text {
  font-size: var(--r-text-sm);
  line-height: 1.45;
}

.thread__cite {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 16px;
  margin-left: 3px;
  padding: 0 3px;
  border: 1px solid var(--r-border-strong);
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  line-height: 1;
  vertical-align: 1px;
  cursor: pointer;
}

.thread__cite:hover,
.thread__cite.is-on {
  border-color: var(--r-brand);
  background: var(--r-bg-selected);
  color: var(--r-brand-text);
}

.thread__quote {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}

.thread__quote .thread__said {
  padding-left: 8px;
  border-left: 2px solid var(--r-brand);
}

.thread__who {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.thread__said {
  display: -webkit-box;
  overflow: hidden;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.thread__hint {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.thread__all {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  border-top: 1px solid var(--r-border-subtle);
  list-style: none;
  scrollbar-width: thin;
}

.thread__msg {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: 2px;
  padding: 6px 0 6px 10px;
  border-bottom: 1px solid var(--r-border-subtle);
  border-left: 2px solid transparent;
}

.thread__msg.is-cited {
  border-left-color: var(--r-brand);
}

.thread__msg .thread__said {
  -webkit-line-clamp: 2;
}

.thread__more {
  padding: 8px 0 4px 12px;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}
</style>
