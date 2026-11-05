<script setup lang="ts">
/**
 * A command line that takes a sentence. While the person types, the line under the field shows
 * the exact command it would run, so it can be checked before Enter. Risky ones need a second
 * Enter. ↑ and ↓ walk the history, inside the field only.
 */
import { computed, nextTick, onMounted, ref } from 'vue'
import { CornerDownLeft } from 'lucide-vue-next'

interface Command {
  /** A regular expression over the sentence. */
  match: string
  /** The command it becomes; $1, $2 are the groups. */
  run: string
  /** What the command prints; $1, $2 work here too. */
  out: string[]
  /** Asks for a second Enter first, and says why: "Runs on production." */
  risky?: string
}

interface Entry {
  kind: 'said' | 'run' | 'out' | 'note'
  text: string
}

const props = withDefaults(
  defineProps<{
    /** Left of the strip: "ctl · staging". */
    context: string
    commands: Command[]
    /** Earlier sentences, oldest first, for ↑. */
    history: string[]
    /** What the log shows when the tile opens. */
    log?: Entry[]
    initial?: string
    placeholder?: string
    /** Said to a sentence with no command: what it can do and an example. */
    fallback: string
  }>(),
  { log: () => [], initial: '', placeholder: 'Say what to do' },
)

const text = ref(props.initial)
const entries = ref<Entry[]>([...props.log])
const hist = ref<string[]>([...props.history])
const hpos = ref(-1)
let stash = ''
const pending = ref<{ said: string; run: string; out: string[]; risky: string } | null>(null)

function parse(said: string) {
  for (const c of props.commands) {
    const m = said.match(new RegExp(c.match, 'i'))
    if (m) {
      const sub = (s: string) => s.replace(/\$(\d)/g, (_, k: string) => m[Number(k)] ?? '')
      return { run: sub(c.run), out: c.out.map(sub), risky: c.risky }
    }
  }
  return null
}

const preview = computed(() => (text.value.trim() ? parse(text.value.trim()) : null))

const logEl = ref<HTMLElement | null>(null)
function follow() {
  nextTick(() => {
    if (logEl.value) logEl.value.scrollTop = logEl.value.scrollHeight
  })
}
onMounted(follow)

function push(...more: Entry[]) {
  entries.value = [...entries.value, ...more].slice(-24)
  follow()
}

function run() {
  const said = text.value.trim()
  if (!said) return
  if (pending.value && pending.value.said === said) {
    push(
      { kind: 'said', text: said },
      { kind: 'run', text: pending.value.run },
      ...pending.value.out.map((o) => ({ kind: 'out' as const, text: o })),
    )
    pending.value = null
    remember(said)
    return
  }
  const parsed = parse(said)
  if (!parsed) {
    push({ kind: 'said', text: said }, { kind: 'note', text: props.fallback })
    remember(said)
    return
  }
  if (parsed.risky) {
    pending.value = { said, run: parsed.run, out: parsed.out, risky: parsed.risky }
    return
  }
  push({ kind: 'said', text: said }, { kind: 'run', text: parsed.run }, ...parsed.out.map((o) => ({ kind: 'out' as const, text: o })))
  remember(said)
}

function remember(said: string) {
  hist.value = [...hist.value.filter((h) => h !== said), said]
  hpos.value = -1
  text.value = ''
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault()
    run()
  } else if (event.key === 'Escape') {
    if (pending.value) pending.value = null
    else text.value = ''
  } else if (event.key === 'ArrowUp' && hist.value.length) {
    event.preventDefault()
    if (hpos.value === -1) {
      stash = text.value
      hpos.value = hist.value.length - 1
    } else hpos.value = Math.max(0, hpos.value - 1)
    text.value = hist.value[hpos.value]
  } else if (event.key === 'ArrowDown' && hpos.value !== -1) {
    event.preventDefault()
    if (hpos.value < hist.value.length - 1) {
      hpos.value++
      text.value = hist.value[hpos.value]
    } else {
      hpos.value = -1
      text.value = stash
    }
  }
}

function onInput() {
  if (pending.value && pending.value.said !== text.value.trim()) pending.value = null
}
</script>

<template>
  <div class="mk cli">
    <p class="cli__strip">
      <span class="mk-truncate">{{ context }}</span>
      <span class="cli__keys">↑ ↓ history · esc clear</span>
    </p>

    <ol ref="logEl" class="cli__log mk-grow" aria-live="polite" aria-label="Command log">
      <li v-for="(e, i) in entries" :key="i" class="cli__line" :class="`cli__line--${e.kind}`">
        <span class="cli__sigil" aria-hidden="true">{{ e.kind === 'said' ? '›' : e.kind === 'run' ? '$' : '' }}</span>
        <span class="cli__text">{{ e.text }}</span>
      </li>
    </ol>

    <form class="cli__field" @submit.prevent="run">
      <span class="cli__sigil" aria-hidden="true">›</span>
      <input
        v-model="text"
        class="cli__input"
        type="text"
        spellcheck="false"
        autocomplete="off"
        :placeholder="placeholder"
        :aria-label="`Command, in a sentence. ${context}`"
        @keydown="onKeydown"
        @input="onInput"
      />
      <button type="submit" class="cli__enter mk-reset" aria-label="Run">
        <CornerDownLeft :size="14" />
      </button>
    </form>

    <p v-if="pending" class="cli__preview is-risky" role="status">{{ pending.risky }} Enter again to run, esc to cancel.</p>
    <p class="cli__preview" :class="{ 'is-none': text.trim() && !preview }">
      <template v-if="preview">→ {{ preview.run }}</template>
      <template v-else-if="text.trim()">→ No command for that yet. Enter to ask anyway.</template>
      <template v-else>→ Type a sentence; the command appears here before it runs.</template>
    </p>
  </div>
</template>

<style scoped>
.cli {
  gap: 6px;
  font-family: var(--r-font-mono);
}

.cli__strip {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.cli__keys {
  flex: none;
}

.cli__log {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  list-style: none;
  scrollbar-width: none;
}

.cli__line {
  display: flex;
  flex: none;
  gap: 8px;
  min-width: 0;
  font-size: var(--r-text-2xs);
  line-height: 16px;
}

.cli__text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cli__sigil {
  flex: none;
  width: 8px;
  color: var(--r-text-tertiary);
}

.cli__line--said {
  color: var(--r-text-secondary);
}

.cli__line--run {
  color: var(--r-text);
}

.cli__line--out {
  color: var(--r-text-tertiary);
}

.cli__line--note {
  color: var(--r-warning-text);
}

.cli__field {
  display: flex;
  flex: none;
  align-items: center;
  gap: 8px;
  height: var(--r-control-sm);
  padding: 0 8px;
  border: 1px solid var(--r-border-strong);
}

.cli__field:focus-within {
  border-color: var(--r-focus);
  box-shadow: 0 0 0 1px var(--r-focus);
}

.cli__input {
  flex: 1 1 auto;
  min-width: 0;
  height: 100%;
  padding: 0;
  border: 0;
  outline: none;
  background: none;
  color: var(--r-text);
  font: inherit;
  font-size: var(--r-text-xs);
}

.cli__input::placeholder {
  color: var(--r-text-tertiary);
}

.cli__enter {
  display: inline-flex;
  color: var(--r-text-tertiary);
  cursor: pointer;
}

.cli__enter:hover {
  color: var(--r-text);
}

.cli__preview {
  flex: none;
  overflow: hidden;
  color: var(--r-brand-text);
  font-size: var(--r-text-2xs);
  line-height: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cli__preview.is-none {
  color: var(--r-text-tertiary);
}

.cli__preview.is-risky {
  color: var(--r-warning-text);
}
</style>
