<script setup lang="ts">
/**
 * The form, filled from a sentence. A person describes the thing the way they would to a
 * colleague; the screen shows each field it filled, lets any of them be corrected in place, and
 * asks only for what is missing, with the likely answers as keys.
 */
import { computed, nextTick, reactive, ref } from 'vue'
import { Check, CircleAlert, CornerDownLeft } from 'lucide-vue-next'
import { RButton, RTextarea } from '@/design-system'
import Writing from './Writing.vue'
import { useClock, useReply } from './shared'

interface Rule {
  /** A regular expression over the sentence, no case. */
  match: string
  /** What the field says when it matches; $1, $2 are the groups. */
  value: string
}

interface Field {
  label: string
  rules: Rule[]
  /** Keys offered when the sentence did not say it. */
  options?: string[]
  required?: boolean
  mono?: boolean
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    initial: string
    placeholder?: string
    fields: Field[]
    /** The button: "Create booking". */
    action: string
    /** After it: "Booking SK-48213 created". */
    done: string
    agent?: string
    start?: string
  }>(),
  { placeholder: 'Describe it in a sentence', agent: 'Simpul', start: '09:20' },
)

const clock = useClock(props.start)
const sentence = ref(props.initial)
const values = reactive<(string | null)[]>(props.fields.map(() => null))
const manual = reactive<boolean[]>(props.fields.map(() => false))
const editing = ref<number | null>(null)
const editText = ref('')
const editor = ref<HTMLInputElement[]>([])
const state = ref<'form' | 'done'>('form')
const doneAt = ref('')
const read = ref(false)
const { busy, reply } = useReply(550)

function parse(text: string) {
  props.fields.forEach((field, i) => {
    let found: string | null = null
    for (const rule of field.rules) {
      const m = text.match(new RegExp(rule.match, 'i'))
      if (m) {
        found = rule.value.replace(/\$(\d)/g, (_, k: string) => m[Number(k)] ?? '')
        break
      }
    }
    values[i] = found
    manual[i] = false
  })
  read.value = true
}
parse(props.initial)

function submit() {
  if (!sentence.value.trim()) return
  state.value = 'form'
  editing.value = null
  reply(() => parse(sentence.value))
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    submit()
  }
}

function edit(i: number) {
  editing.value = i
  editText.value = values[i] ?? ''
  nextTick(() => editor.value[0]?.focus())
}

function commit(i: number) {
  if (editing.value !== i) return
  const v = editText.value.trim()
  values[i] = v || values[i]
  if (v) manual[i] = true
  editing.value = null
}

function set(i: number, value: string) {
  values[i] = value
  manual[i] = true
}

const missing = computed(() => props.fields.filter((f, i) => f.required && !values[i]).map((f) => f.label))
const filled = computed(() => values.filter(Boolean).length)

function create() {
  state.value = 'done'
  doneAt.value = clock.next()
}
</script>

<template>
  <div class="mk form">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span class="r-label form__count">{{ filled }} of {{ fields.length }} filled</span>
    </div>

    <div class="form__body mk-grow">
      <form class="form__say" @submit.prevent="submit">
        <RTextarea
          v-model="sentence"
          :rows="3"
          resize="none"
          :placeholder="placeholder"
          :aria-label="`${eyebrow}, in a sentence`"
          @keydown="onKeydown"
        />
        <div class="form__say-foot">
          <span class="form__hint">Enter to read it again</span>
          <button type="submit" class="form__send mk-reset" aria-label="Read the sentence">
            <CornerDownLeft :size="14" />
          </button>
        </div>
      </form>

      <div class="form__fields" aria-live="polite">
        <Writing v-if="busy" label="Reading" />
        <p v-else-if="filled === 0" class="form__nothing">Nothing to fill from that. Try “{{ initial }}”.</p>
        <ul v-else class="form__list">
          <li v-for="(field, i) in fields" :key="field.label" class="form__row" :class="{ 'is-missing': !values[i] }">
            <span class="form__label">{{ field.label }}</span>
            <input
              v-if="editing === i"
              ref="editor"
              v-model="editText"
              class="form__edit"
              :class="{ 'r-mono': field.mono }"
              :aria-label="field.label"
              @keydown.enter.prevent="commit(i)"
              @keydown.esc.prevent="editing = null"
              @blur="commit(i)"
            />
            <button
              v-else-if="values[i]"
              type="button"
              class="form__value mk-reset"
              :class="{ 'r-mono': field.mono }"
              :aria-label="`${field.label}: ${values[i]}. Change`"
              @click="edit(i)"
            >
              <span class="mk-truncate">{{ values[i] }}</span>
              <span v-if="manual[i]" class="form__by">you</span>
            </button>
            <span v-else-if="field.options" class="form__options">
              <button v-for="o in field.options" :key="o" type="button" class="form__option mk-reset" @click="set(i, o)">
                {{ o }}
              </button>
            </span>
            <button v-else type="button" class="form__value form__value--missing mk-reset" @click="edit(i)">
              {{ field.required ? 'Missing · add' : 'Not said · add' }}
            </button>
          </li>
        </ul>
      </div>
    </div>

    <div class="form__foot">
      <template v-if="state === 'done'">
        <p class="form__done mk-truncate"><Check :size="14" aria-hidden="true" />{{ done }} · {{ doneAt }}</p>
        <RButton size="sm" variant="ghost" @click="state = 'form'">Back</RButton>
      </template>
      <template v-else>
        <p v-if="missing.length" class="form__missing mk-truncate">
          <CircleAlert :size="14" aria-hidden="true" />
          {{ missing.length === 1 ? `${missing[0]} is missing` : `${missing.length} fields missing` }}
        </p>
        <p v-else class="form__ready mk-truncate">{{ read ? `Read by ${agent}. Check, then create.` : '' }}</p>
        <RButton size="sm" tone="brand" :disabled="missing.length > 0 || busy" @click="create">{{ action }}</RButton>
      </template>
    </div>
  </div>
</template>

<style scoped>
.form {
  container-type: inline-size;
  gap: 8px;
}

.form__count {
  flex: none;
}

.form__body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
}

.form__say {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: 2px;
}

.form__say :deep(textarea) {
  font-size: var(--r-text-sm);
  line-height: 1.4;
}

.form__say-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.form__hint {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
}

.form__send {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: var(--r-text-tertiary);
  cursor: pointer;
}

.form__send:hover {
  color: var(--r-text);
}

.form__fields {
  min-height: 0;
  overflow: hidden;
}

.form__list {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  border-top: 1px solid var(--r-border-subtle);
  list-style: none;
}

.form__row {
  display: grid;
  grid-template-columns: 84px minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  min-height: 27px;
  border-bottom: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-xs);
}

.form__label {
  overflow: hidden;
  color: var(--r-text-tertiary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.form__value {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  height: 26px;
  color: var(--r-text);
  cursor: text;
}

.form__value:hover .mk-truncate {
  text-decoration: underline;
  text-decoration-color: var(--r-border-strong);
  text-underline-offset: 3px;
}

.form__value--missing {
  color: var(--r-warning-text);
  cursor: pointer;
}

.form__by {
  flex: none;
  padding: 0 4px;
  border: 1px solid var(--r-border);
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  line-height: 14px;
  text-transform: uppercase;
}

.form__edit {
  min-width: 0;
  height: 22px;
  margin: 2px 0;
  padding: 0 6px;
  border: 1px solid var(--r-border-strong);
  border-radius: var(--r-radius-control);
  outline: none;
  background: var(--r-bg-surface);
  color: var(--r-text);
  font: inherit;
}

.form__edit:focus-visible {
  border-color: var(--r-focus);
  box-shadow: 0 0 0 1px var(--r-focus);
}

.form__options {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 3px 0;
}

.form__option {
  height: 20px;
  padding: 0 6px;
  border: 1px dashed var(--r-warning-border);
  color: var(--r-warning-text);
  font-size: var(--r-text-2xs);
  cursor: pointer;
}

.form__option:hover {
  border-style: solid;
  background: var(--r-warning-soft);
}

.form__nothing {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  line-height: 1.45;
}

.form__foot {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.form__missing,
.form__ready,
.form__done {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--r-text-xs);
}

.form__missing {
  color: var(--r-warning-text);
}

.form__ready {
  color: var(--r-text-tertiary);
}

.form__done {
  color: var(--r-success-text);
  font-weight: var(--r-weight-medium);
}

.form__missing svg,
.form__done svg {
  flex: none;
}

/* Wide: the sentence on the left, what it filled on the right. */
@container (min-width: 480px) {
  .form__body {
    display: grid;
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
    gap: 16px;
  }
}
</style>
