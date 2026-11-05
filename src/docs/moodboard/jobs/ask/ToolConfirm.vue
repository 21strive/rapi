<script setup lang="ts">
/**
 * The model can write the query; running it against the real thing is a person's call. The card
 * shows exactly what will run, where, and what it changes, with one Run and one Not now.
 */
import { ref } from 'vue'
import { Check } from 'lucide-vue-next'
import { RBadge, RButton } from '@/design-system'
import { useClock, useCountdown, useReply } from './shared'

const props = withDefaults(
  defineProps<{
    agent?: string
    /** What it wants to do, in a sentence. */
    intent: string
    /** Where it runs: "Production". */
    target: string
    targetTone?: 'danger' | 'warning' | 'neutral' | 'brand'
    /** The exact call, query or command. */
    code?: string
    /** Mono caps over the code: "SQL", "POST", "TC". */
    language?: string
    effects?: string[]
    /** The button: "Run once". */
    run: string
    /** After: "214 rows archived". */
    done: string
    decline?: string
    /** Seconds of undo after it ran; 0 for none. */
    undoFor?: number
    start?: string
    /** Small tiles: the sentence and the two keys. */
    compact?: boolean
  }>(),
  { agent: 'Simpul', targetTone: 'danger', effects: () => [], decline: 'Not now', undoFor: 0, start: '09:16' },
)

const clock = useClock(props.start)
const state = ref<'ask' | 'running' | 'done' | 'declined'>('ask')
const at = ref('')
const { reply } = useReply(900)
const undo = useCountdown()

function go() {
  state.value = 'running'
  reply(() => {
    state.value = 'done'
    at.value = clock.next()
    if (props.undoFor) undo.start(props.undoFor)
  })
}

function back() {
  undo.stop()
  state.value = 'ask'
}
</script>

<template>
  <div class="mk tool" :class="{ 'tool--compact': compact }">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate tool__who">{{ agent }} wants to</span>
      <RBadge :tone="targetTone" size="sm">{{ target }}</RBadge>
    </div>
    <p class="tool__intent">
      <span class="tool__plain">{{ intent }}</span>
      <span class="tool__lead">{{ agent }} wants to {{ intent.charAt(0).toLowerCase() + intent.slice(1) }}</span>
    </p>

    <div v-if="!compact" class="tool__body mk-grow">
      <div v-if="code" class="tool__code">
        <p v-if="language" class="tool__lang">{{ language }}</p>
        <pre><code>{{ code }}</code></pre>
      </div>
      <ul v-if="effects.length" class="tool__effects">
        <li v-for="e in effects" :key="e">{{ e }}</li>
      </ul>
    </div>
    <div v-else class="mk-grow" />

    <div class="tool__foot" aria-live="polite">
      <template v-if="state === 'ask' || state === 'running'">
        <RButton size="sm" tone="brand" :loading="state === 'running'" @click="go">{{ run }}</RButton>
        <RButton size="sm" variant="ghost" :disabled="state === 'running'" @click="state = 'declined'">{{ decline }}</RButton>
      </template>
      <template v-else-if="state === 'done'">
        <p class="tool__done mk-truncate"><Check :size="14" aria-hidden="true" />{{ done }} · {{ at }}</p>
        <RButton v-if="undo.left.value > 0" size="xs" variant="outline" @click="back">Undo · {{ undo.left.value }} s</RButton>
        <RButton v-else size="xs" variant="ghost" @click="state = 'ask'">Again</RButton>
      </template>
      <template v-else>
        <p class="tool__skip mk-truncate">Skipped. Nothing ran.</p>
        <RButton size="xs" variant="ghost" @click="state = 'ask'">Ask again</RButton>
      </template>
    </div>
  </div>
</template>

<style scoped>
.tool {
  container-type: inline-size;
  gap: 8px;
}

.tool__lead {
  display: none;
}

/* Narrow: no room for the eyebrow beside the badge; the sentence says who asks. */
@container (max-width: 240px) {
  .tool__who,
  .tool__plain {
    display: none;
  }
  .tool__lead {
    display: inline;
  }
}

.tool__intent {
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.3;
}

.tool--compact .tool__intent {
  display: -webkit-box;
  overflow: hidden;
  font-size: var(--r-text-sm);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.tool__body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
}

.tool__code {
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--r-border);
  background: color-mix(in srgb, var(--r-text) 4%, transparent);
}

.tool__lang {
  padding: 4px 8px;
  border-bottom: 1px solid var(--r-border);
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
}

.tool__code pre {
  margin: 0;
  padding: 6px 8px;
  overflow: hidden;
  color: var(--r-text);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.tool__effects {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.tool__effects li {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.02em;
}

.tool__effects li::before {
  content: '· ';
  color: var(--r-text-tertiary);
}

.tool__foot {
  display: flex;
  flex: none;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.tool__done {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  gap: 6px;
  color: var(--r-success-text);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
}

.tool__done svg {
  flex: none;
}

.tool__skip {
  flex: 1 1 auto;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.tool--compact .tool__foot > :deep(.r-button) {
  flex: 1;
}
</style>
