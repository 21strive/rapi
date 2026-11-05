<script setup lang="ts">
/**
 * The model wrote it; a person reads it once and decides. Approve sends it as it is, Edit opens
 * the few fields that can change, Discard throws it away (and can be taken back). After sending
 * there is a short undo, the way a real outbox holds a message.
 */
import { computed, reactive, ref } from 'vue'
import { RButton, RInput, RStatus, RTextarea } from '@/design-system'
import { useClock, useCountdown, useReply } from './shared'

interface Field {
  label: string
  value: string
  mono?: boolean
  /** Can be changed in Edit. */
  edit?: boolean
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    agent?: string
    fields?: Field[]
    body?: string
    /** Where the draft came from: "From the thread of 4 Nov". */
    prepared: string
    /** The approve button: "Send", "Approve transfer", "Post update". */
    approve: string
    /** The state after: "Sent", "Scheduled", "Posted". */
    done: string
    start?: string
    undoFor?: number
    /** One row: body on the left, the three actions on the right. */
    compact?: boolean
  }>(),
  { agent: 'Racik', fields: () => [], start: '09:14', undoFor: 10 },
)

type State = 'draft' | 'edit' | 'sending' | 'done' | 'gone'
const state = ref<State>('draft')
const clock = useClock(props.start)
const values = reactive(props.fields.map((f) => f.value))
const text = ref(props.body ?? '')
const editValues = reactive([...values])
const editText = ref(text.value)
const edited = ref(false)
const at = ref('')
const { reply } = useReply(600)
const undo = useCountdown()

const status = computed(() => {
  switch (state.value) {
    case 'edit':
      return { tone: 'neutral' as const, label: 'Editing' }
    case 'sending':
    case 'done':
      return { tone: 'success' as const, label: props.done }
    case 'gone':
      return { tone: 'neutral' as const, label: 'Discarded' }
    default:
      return { tone: 'warning' as const, label: 'Needs you' }
  }
})

function startEdit() {
  props.fields.forEach((_, i) => (editValues[i] = values[i]))
  editText.value = text.value
  state.value = 'edit'
}

function save() {
  props.fields.forEach((_, i) => (values[i] = editValues[i]))
  text.value = editText.value
  edited.value = true
  state.value = 'draft'
}

function send() {
  state.value = 'sending'
  reply(() => {
    state.value = 'done'
    at.value = clock.next()
    undo.start(props.undoFor)
  })
}

function takeBack() {
  undo.stop()
  state.value = 'draft'
}
</script>

<template>
  <div class="mk draft" :class="{ 'draft--compact': compact }">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <RStatus :tone="status.tone" :label="status.label" size="sm" />
    </div>

    <div class="draft__main mk-grow">
      <div class="draft__paper" :class="{ 'is-gone': state === 'gone' }">
        <dl v-if="fields.length && state !== 'edit'" class="draft__fields">
          <div v-for="(field, i) in fields" :key="field.label" class="draft__field">
            <dt>{{ field.label }}</dt>
            <dd :class="{ 'r-mono': field.mono }">{{ values[i] }}</dd>
          </div>
        </dl>
        <div v-if="state === 'edit'" class="draft__edit">
          <template v-for="(field, i) in fields" :key="field.label">
            <RInput
              v-if="field.edit"
              v-model="editValues[i]"
              size="sm"
              :mono="field.mono"
              :aria-label="field.label"
              class="draft__input"
            >
              <template #leading><span class="draft__affix">{{ field.label }}</span></template>
            </RInput>
          </template>
          <RTextarea v-if="body" v-model="editText" :rows="compact ? 2 : 4" resize="none" aria-label="Draft text" />
        </div>
        <p v-else-if="body" class="draft__body">{{ text }}</p>
      </div>
      <p class="draft__prepared mk-truncate" aria-live="polite">
        <template v-if="state === 'done'">{{ done }} at {{ at }} WIB by you</template>
        <template v-else-if="state === 'gone'">Discarded. Nothing was sent.</template>
        <template v-else-if="edited">Edited by you · prepared by {{ agent }}</template>
        <template v-else>Prepared by {{ agent }} · {{ prepared }}</template>
      </p>
    </div>

    <div class="draft__actions">
      <template v-if="state === 'draft' || state === 'sending'">
        <RButton size="sm" tone="brand" :loading="state === 'sending'" @click="send">{{ approve }}</RButton>
        <RButton size="sm" variant="outline" :disabled="state === 'sending'" @click="startEdit">Edit</RButton>
        <RButton size="sm" variant="ghost" :disabled="state === 'sending'" @click="state = 'gone'">Discard</RButton>
      </template>
      <template v-else-if="state === 'edit'">
        <RButton size="sm" tone="brand" @click="save">Save</RButton>
        <RButton size="sm" variant="ghost" @click="state = 'draft'">Cancel</RButton>
      </template>
      <template v-else-if="state === 'done'">
        <RButton v-if="undo.left.value > 0" size="sm" variant="outline" @click="takeBack">Undo · {{ undo.left.value }} s</RButton>
        <span v-else class="r-label">Final</span>
      </template>
      <RButton v-else size="sm" variant="outline" @click="state = 'draft'">Restore draft</RButton>
    </div>
  </div>
</template>

<style scoped>
.draft {
  gap: 8px;
}

.draft__main {
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow: hidden;
}

.draft__paper {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 0;
  overflow: hidden;
}

.draft__paper.is-gone {
  color: var(--r-text-tertiary);
  text-decoration: line-through;
  text-decoration-color: var(--r-text-tertiary);
}

.draft__fields {
  display: grid;
  margin: 0;
  border-top: 1px solid var(--r-border-subtle);
}

.draft__field {
  display: flex;
  gap: 12px;
  padding: 4px 0;
  border-bottom: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-xs);
}

.draft__field dt {
  flex: none;
  width: 56px;
  color: var(--r-text-tertiary);
}

.draft__field dd {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.draft__body {
  display: -webkit-box;
  overflow: hidden;
  font-size: var(--r-text-sm);
  line-height: 1.45;
  white-space: pre-line;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 6;
}

.draft__edit {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.draft__affix {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.draft__prepared {
  flex: none;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.draft__actions {
  display: flex;
  flex: none;
  align-items: center;
  gap: 6px;
}

/* One row: the draft on the left, the actions stacked on the right. */
.draft--compact {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-rows: auto minmax(0, 1fr);
  column-gap: 16px;
  row-gap: 6px;
}

.draft--compact > .mk-row {
  grid-column: 1 / -1;
}

.draft--compact .draft__body {
  font-size: var(--r-text-xs);
  -webkit-line-clamp: 3;
}

.draft--compact .draft__actions {
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
}
</style>
