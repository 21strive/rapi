<script setup lang="ts">
/**
 * What the model keeps about a person, in their words, with where it came from and a Forget
 * next to each. One press removes it; Undo puts it back. No settings page to find.
 */
import { reactive } from 'vue'
import { RButton } from '@/design-system'

interface Note {
  text: string
  /** Where it was learnt: "From your message on 3 Nov". */
  from: string
}

const props = withDefaults(
  defineProps<{
    notes: Note[]
    agent?: string
    /** Eyebrow over a single note. */
    title?: string
  }>(),
  { agent: 'Simpul', title: 'Remembered' },
)

const gone = reactive<boolean[]>(props.notes.map(() => false))
const kept = () => gone.filter((g) => !g).length
</script>

<template>
  <div class="mk memory" :class="{ 'memory--list': notes.length > 1 }">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ title }}</span>
      <span v-if="notes.length > 1" class="r-label memory__kept">{{ kept() }} of {{ notes.length }}</span>
    </div>

    <template v-if="notes.length === 1">
      <p class="memory__text mk-grow" :class="{ 'is-gone': gone[0] }">“{{ notes[0].text }}”</p>
      <p class="memory__from mk-truncate" aria-live="polite">
        {{ gone[0] ? `Forgotten. ${agent} will ask next time.` : notes[0].from }}
      </p>
      <div class="memory__foot">
        <RButton
          size="xs"
          :variant="gone[0] ? 'ghost' : 'outline'"
          :aria-label="gone[0] ? 'Undo, remember it again' : `Forget: ${notes[0].text}`"
          @click="gone[0] = !gone[0]"
        >
          {{ gone[0] ? 'Undo' : 'Forget' }}
        </RButton>
      </div>
    </template>

    <ul v-else class="memory__list mk-grow">
      <li v-for="(note, i) in notes" :key="note.text" class="memory__item" :class="{ 'is-gone': gone[i] }">
        <p class="memory__item-text">{{ note.text }}</p>
        <div class="memory__item-foot">
          <span class="memory__from mk-truncate">{{ gone[i] ? 'Forgotten' : note.from }}</span>
          <button
            type="button"
            class="memory__forget mk-reset"
            :aria-label="gone[i] ? `Undo, remember again: ${note.text}` : `Forget: ${note.text}`"
            @click="gone[i] = !gone[i]"
          >
            {{ gone[i] ? 'Undo' : 'Forget' }}
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.memory {
  gap: 6px;
}

.memory__kept {
  flex: none;
  white-space: nowrap;
}

.memory__text {
  display: -webkit-box;
  overflow: hidden;
  font-size: var(--r-text-sm);
  line-height: 1.4;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
}

.is-gone .memory__item-text,
.memory__text.is-gone {
  color: var(--r-text-tertiary);
  text-decoration: line-through;
  text-decoration-color: var(--r-text-tertiary);
}

.memory__from {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-2xs);
}

.memory__foot {
  display: flex;
}

.memory__list {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  overflow: hidden;
  border-top: 1px solid var(--r-border-subtle);
  list-style: none;
}

.memory__item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 0;
  border-bottom: 1px solid var(--r-border-subtle);
}

.memory__item-text {
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

.memory__item-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.memory__forget {
  flex: none;
  color: var(--r-text-secondary);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-medium);
  text-decoration: underline;
  text-decoration-color: var(--r-border-strong);
  text-underline-offset: 3px;
  cursor: pointer;
}

.memory__forget:hover {
  color: var(--r-text);
}
</style>
