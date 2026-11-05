<script setup lang="ts">
/**
 * The model finishes the line in grey; Tab takes all of it, → takes one word, Esc sends it away.
 * Writing stays in the person's hands, and Tab still moves focus when there is nothing to take.
 */
import { computed, nextTick, onMounted, ref } from 'vue'
import { useClock } from './shared'

const props = withDefaults(
  defineProps<{
    label: string
    /** A quiet line over the field: who it is for, what it answers. */
    context?: string
    /** Whole suggestions, best first; the one that starts with what is typed is shown. */
    completions: string[]
    initial?: string
    agent?: string
    mono?: boolean
    start?: string
  }>(),
  { initial: '', agent: 'Racik', start: '11:05' },
)

const clock = useClock(props.start)
const typed = ref(props.initial)
const dismissed = ref(false)
const overflowing = ref(false)
const taken = ref(0)
const takenAt = ref('')
const input = ref<HTMLInputElement | null>(null)

const rest = computed(() => {
  if (dismissed.value) return ''
  const t = typed.value
  const found = props.completions.find((c) => c.toLowerCase().startsWith(t.toLowerCase()) && c.length > t.length)
  return found ? found.slice(t.length) : ''
})

function measure() {
  const el = input.value
  overflowing.value = !!el && el.scrollWidth > el.clientWidth + 1
}

onMounted(measure)

function onInput() {
  dismissed.value = false
  measure()
}

function take(all: boolean) {
  const r = rest.value
  if (!r) return
  const piece = all ? r : (r.match(/^\s*\S+/)?.[0] ?? r)
  typed.value += piece
  taken.value += piece.trim().split(/\s+/).filter(Boolean).length
  takenAt.value = clock.next()
  nextTick(() => {
    const el = input.value
    if (!el) return
    el.focus()
    el.setSelectionRange(el.value.length, el.value.length)
    el.scrollLeft = el.scrollWidth
    measure()
  })
}

function onKeydown(event: KeyboardEvent) {
  if (!rest.value) return
  const el = event.currentTarget as HTMLInputElement
  const atEnd = el.selectionStart === el.value.length && el.selectionEnd === el.value.length
  if (event.key === 'Tab' && !event.shiftKey && atEnd) {
    event.preventDefault()
    take(true)
  } else if (event.key === 'ArrowRight' && atEnd) {
    event.preventDefault()
    take(false)
  } else if (event.key === 'Escape') {
    event.preventDefault()
    dismissed.value = true
  }
}

function reset() {
  typed.value = props.initial
  dismissed.value = false
  taken.value = 0
  nextTick(measure)
}
</script>

<template>
  <div class="mk ghost">
    <div class="mk-row mk-between">
      <span class="r-label mk-truncate">{{ context ?? label }}</span>
      <span class="r-label ghost__by">Suggested by {{ agent }}</span>
    </div>

    <div class="ghost__field" :class="{ 'is-mono': mono }">
      <span class="ghost__name">{{ label }}</span>
      <div class="ghost__line">
        <div v-if="rest && !overflowing" class="ghost__mirror" aria-hidden="true">
          <span class="ghost__typed">{{ typed }}</span><span class="ghost__rest">{{ rest }}</span>
        </div>
        <input
          ref="input"
          v-model="typed"
          class="ghost__input"
          type="text"
          spellcheck="false"
          autocomplete="off"
          :aria-label="label"
          @input="onInput"
          @keydown="onKeydown"
        />
      </div>
      <button v-if="rest" type="button" class="ghost__tab mk-reset" :aria-label="`Accept the suggestion: ${rest.trim()}`" @click="take(true)">
        Tab
      </button>
    </div>

    <p class="ghost__foot" aria-live="polite">
      <template v-if="rest && overflowing">Tab adds “{{ rest.trim() }}”</template>
      <template v-else-if="rest">Tab accepts · → one word · Esc dismisses</template>
      <template v-else-if="taken">
        Kept {{ taken }} {{ taken === 1 ? 'word' : 'words' }} from {{ agent }} · {{ takenAt }}
        <button type="button" class="ghost__reset mk-reset" @click="reset">Start over</button>
      </template>
      <template v-else>No suggestion for that. Keep typing.</template>
    </p>
  </div>
</template>

<style scoped>
.ghost {
  justify-content: center;
  gap: 8px;
}

.ghost__by {
  flex: none;
}

.ghost__field {
  display: flex;
  flex: none;
  align-items: center;
  gap: 10px;
  height: var(--r-control-lg);
  padding: 0 6px 0 10px;
  border: 1px solid var(--r-border-strong);
  background: var(--r-bg-surface);
}

.ghost__field:focus-within {
  border-color: var(--r-focus);
  box-shadow: 0 0 0 1px var(--r-focus);
}

.ghost__name {
  flex: none;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.ghost__line {
  position: relative;
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  min-width: 0;
  height: 100%;
}

.ghost__mirror,
.ghost__input {
  font-family: var(--r-font-sans);
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-regular);
  letter-spacing: 0;
}

.is-mono .ghost__mirror,
.is-mono .ghost__input {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-sm);
}

.ghost__mirror {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  overflow: hidden;
  white-space: pre;
  pointer-events: none;
}

.ghost__typed {
  color: transparent;
}

.ghost__rest {
  color: var(--r-text-tertiary);
}

.ghost__input {
  position: relative;
  width: 100%;
  min-width: 0;
  height: 100%;
  padding: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--r-text);
}

.ghost__tab {
  flex: none;
  height: 22px;
  padding: 0 6px;
  border: 1px solid var(--r-border-strong);
  border-bottom-width: 2px;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  cursor: pointer;
}

.ghost__tab:hover {
  border-color: var(--r-text-tertiary);
  color: var(--r-text);
}

.ghost__foot {
  display: flex;
  flex: none;
  align-items: center;
  gap: 8px;
  min-width: 0;
  overflow: hidden;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  white-space: nowrap;
}

.ghost__reset {
  color: var(--r-text-secondary);
  text-decoration: underline;
  text-decoration-color: var(--r-border-strong);
  text-underline-offset: 3px;
  cursor: pointer;
}
</style>
