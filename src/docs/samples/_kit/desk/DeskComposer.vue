<script setup lang="ts">
/**
 * Where the person talks: suggestions above (things worth saying next), one line to type in, and
 * Enter to send. ↑ in an empty field brings back the last thing said. Keys act only while the
 * field has focus.
 */
import { ref } from 'vue'
import { CornerDownLeft, MessageSquareText } from 'lucide-vue-next'
import { RInput } from '@/design-system'

const props = withDefaults(
  defineProps<{
    placeholder?: string
    suggestions?: string[]
    /** The agent is writing: sending waits. */
    busy?: boolean
    /** Accessible name of the field: "Message Simpul". */
    label: string
  }>(),
  { placeholder: 'Say what you need', suggestions: () => [] },
)

const emit = defineEmits<{ send: [text: string] }>()

const text = ref('')
const history: string[] = []
const form = ref<HTMLFormElement | null>(null)

function submit(value = text.value) {
  const said = value.trim()
  if (!said || props.busy) return
  history.push(said)
  // Suggestions are replaced when the reply lands; keep the focus in the field so it is not lost.
  form.value?.querySelector('input')?.focus()
  emit('send', said)
  text.value = ''
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowUp' && !text.value && history.length) {
    event.preventDefault()
    text.value = history[history.length - 1]
  }
}
</script>

<template>
  <form ref="form" class="desk-composer" @submit.prevent="submit()">
    <div v-if="suggestions.length" class="desk-composer__chips" role="group" aria-label="Suggestions">
      <button
        v-for="s in suggestions"
        :key="s"
        type="button"
        class="desk-composer__chip"
        :disabled="busy"
        @click="submit(s)"
      >
        {{ s }}
      </button>
    </div>
    <RInput v-model="text" size="lg" :placeholder="placeholder" :aria-label="label" @keydown="onKeydown">
      <template #leading><MessageSquareText /></template>
      <template #trailing>
        <button type="submit" class="desk-composer__send" :disabled="busy || !text.trim()" aria-label="Send">
          <CornerDownLeft :size="16" />
        </button>
      </template>
    </RInput>
  </form>
</template>

<style>
.desk-composer {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.desk-composer__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

/* Suggestions: quiet dashed keys, the "something you could say" chip. */
.desk-composer__chip {
  max-width: 100%;
  height: 26px;
  padding: 0 8px;
  overflow: hidden;
  border: 1px dashed var(--r-border-strong);
  border-radius: var(--r-radius-control);
  background: none;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
  transition:
    border-color var(--r-duration-fast) var(--r-ease-out),
    color var(--r-duration-fast) var(--r-ease-out);
}
.desk-composer__chip:hover:not(:disabled) {
  border-color: var(--r-ink);
  border-style: solid;
  color: var(--r-text);
}
.desk-composer__chip:disabled {
  opacity: 0.5;
}

.desk-composer__send {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin-right: -6px;
  border: 0;
  border-radius: var(--r-radius-control);
  background: none;
  color: var(--r-text-secondary);
}
.desk-composer__send:hover:not(:disabled) {
  background: var(--r-bg-hover);
  color: var(--r-text);
}
.desk-composer__send:disabled {
  color: var(--r-text-disabled);
}
</style>
