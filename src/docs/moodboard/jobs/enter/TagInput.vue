<script setup lang="ts">
/**
 * A short list of exact words (labels, allergies, recipients) typed one at a time and kept as
 * square chips to check. Enter or a comma adds, Backspace on an empty field takes the last one
 * back, a pasted list splits itself.
 */
import { computed, nextTick, ref, useId } from 'vue'
import { CircleAlert, Plus, X } from 'lucide-vue-next'
import { RChip } from '@/design-system'

const props = withDefaults(
  defineProps<{
    eyebrow: string
    meta?: string
    label: string
    /** Hide the label above the field (the eyebrow says it); it stays as the accessible name. */
    hideLabel?: boolean
    tags: string[]
    suggestions?: string[]
    validate?: 'email'
    max?: number
    placeholder?: string
    /** Lowercase every tag, as labels and keywords are. */
    lower?: boolean
    note?: string
  }>(),
  { suggestions: () => [], placeholder: 'Type and press Enter' },
)

const uid = useId()
const list = ref([...props.tags])
const draft = ref('')
const said = ref<{ tone: 'plain' | 'error'; text: string } | null>(null)
const input = ref<HTMLInputElement | null>(null)

const bad = (t: string) => props.validate === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t)
const invalid = computed(() => list.value.filter(bad))
const full = computed(() => props.max != null && list.value.length >= props.max)
const offered = computed(() => props.suggestions.filter((s) => !list.value.some((t) => t.toLowerCase() === s.toLowerCase())))

function add(raw: string) {
  const words = raw
    .split(/[,;\n]+/)
    .map((w) => (props.lower ? w.trim().toLowerCase() : w.trim()))
    .filter(Boolean)
  for (const w of words) {
    if (full.value) {
      said.value = { tone: 'error', text: `Up to ${props.max}. Remove one to add ${w}.` }
      break
    }
    if (list.value.some((t) => t.toLowerCase() === w.toLowerCase())) {
      said.value = { tone: 'plain', text: `${w} is already in the list.` }
      continue
    }
    list.value = [...list.value, w]
    said.value = { tone: 'plain', text: `Added ${w}.` }
  }
  draft.value = ''
}

function remove(t: string) {
  list.value = list.value.filter((x) => x !== t)
  said.value = { tone: 'plain', text: `Removed ${t}.` }
  nextTick(() => input.value?.focus())
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ',' || event.key === ';') {
    if (!draft.value.trim()) return
    event.preventDefault()
    add(draft.value)
  } else if (event.key === 'Backspace' && !draft.value && list.value.length) {
    event.preventDefault()
    const last = list.value[list.value.length - 1]
    list.value = list.value.slice(0, -1)
    draft.value = last
    said.value = { tone: 'plain', text: `Took ${last} back to edit.` }
  }
}

function onPaste(event: ClipboardEvent) {
  const text = event.clipboardData?.getData('text') ?? ''
  if (!/[,;\n]/.test(text)) return
  event.preventDefault()
  add(text)
}

/* A click on the box, between chips, lands in the field: the box reads as one field. */
function onBoxDown(event: PointerEvent) {
  if ((event.target as HTMLElement).closest('button, input')) return
  event.preventDefault()
  input.value?.focus()
}

const message = computed(() => {
  if (invalid.value.length) return { tone: 'error', text: `${invalid.value[0]} is not a full address.` }
  return said.value
})
</script>

<template>
  <div class="mk en-root tags">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span v-if="meta" class="en-meta">{{ meta }}</span>
    </div>

    <div class="tags__field">
      <label :for="`${uid}-in`" class="tags__label" :class="{ 'r-sr-only': hideLabel }">{{ label }}</label>
      <div class="tags__box en-box" :class="{ 'is-invalid': invalid.length }" @pointerdown="onBoxDown">
        <span v-for="t in list" :key="t" class="tags__tag" :class="{ 'is-bad': bad(t) }">
          <CircleAlert v-if="bad(t)" class="tags__warn" aria-hidden="true" />
          <span class="tags__text">{{ t }}</span>
          <button type="button" class="tags__x" :aria-label="`Remove ${t}`" @click="remove(t)">
            <X aria-hidden="true" />
          </button>
        </span>
        <input
          :id="`${uid}-in`"
          ref="input"
          v-model="draft"
          class="tags__input"
          autocomplete="off"
          spellcheck="false"
          :type="validate === 'email' ? 'email' : 'text'"
          :placeholder="list.length ? '' : placeholder"
          :disabled="full"
          :aria-invalid="invalid.length ? 'true' : undefined"
          :aria-describedby="`${uid}-msg`"
          @keydown="onKeydown"
          @paste="onPaste"
          @blur="draft.trim() && add(draft)"
        />
      </div>
    </div>

    <div v-if="offered.length && !full" class="tags__offer" role="group" :aria-label="`Suggested ${label.toLowerCase()}`">
      <RChip v-for="s in offered" :key="s" size="sm" variant="dashed" @click="add(s)">
        <template #leading><Plus aria-hidden="true" /></template>
        {{ s }}
      </RChip>
    </div>

    <p :id="`${uid}-msg`" class="en-msg tags__msg mk-end" :class="{ 'en-msg--error': message?.tone === 'error' }" aria-live="polite">
      <CircleAlert v-if="message?.tone === 'error'" aria-hidden="true" />
      <span class="mk-truncate">{{ message?.text ?? note ?? `${list.length} added${max ? ` of ${max}` : ''}` }}</span>
    </p>
  </div>
</template>

<style scoped>
.tags__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.tags__label {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
  line-height: 1.3;
}

.tags__box {
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 4px;
  min-height: var(--r-control-md);
  max-height: 120px;
  padding: 3px;
  overflow: hidden;
  cursor: text;
}

.tags__tag {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  height: 24px;
  padding-left: 8px;
  border: 1px solid var(--r-border-strong);
  background: var(--r-bg-muted);
  font-size: var(--r-text-xs);
  line-height: 1;
}

.tags__text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tags__tag.is-bad {
  padding-left: 6px;
  border-color: var(--r-danger);
  background: var(--r-danger-soft);
  color: var(--r-danger-text);
}

.tags__warn {
  flex: none;
  width: 12px;
  height: 12px;
}

.tags__x {
  display: grid;
  flex: none;
  place-items: center;
  width: 22px;
  height: 22px;
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  opacity: 0.7;
  cursor: pointer;
}

.tags__x:hover {
  background: var(--r-bg-hover);
  opacity: 1;
}

.tags__x:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: -2px;
}

.tags__x svg {
  width: 12px;
  height: 12px;
}

.tags__input {
  flex: 1 1 72px;
  min-width: 72px;
  height: 24px;
  padding: 0 5px;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--r-text);
  font-size: var(--r-text-sm);
}

.tags__input::placeholder {
  color: var(--r-text-tertiary);
}

.tags__offer {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-height: 24px;
  overflow: hidden;
}

.tags__msg {
  min-height: 17px;
}
</style>
