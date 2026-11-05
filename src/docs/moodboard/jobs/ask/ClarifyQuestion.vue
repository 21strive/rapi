<script setup lang="ts">
/**
 * When a request could mean two things, the model asks one question with the likely answers as
 * keys, instead of a form that asks for everything. "Something else" takes a typed answer; the
 * result says what was done, and Change goes back to the question.
 */
import { nextTick, ref } from 'vue'
import { Check, CornerDownLeft } from 'lucide-vue-next'
import { RButton, RInput } from '@/design-system'
import Msg from './Msg.vue'
import Writing from './Writing.vue'
import { fill, understand, useClock, useReply } from './shared'

interface Option {
  label: string
  /** Typed answers that mean this option. */
  match?: string
  /** What was done: "Booked: CDD box truck, Rungkut 08:00". */
  result: string
  /** A mono line under it: a reference, a time. */
  detail?: string
}

const props = withDefaults(
  defineProps<{
    /** What the person asked. */
    request: string
    question: string
    options: Option[]
    /** Label of the key that takes a typed answer; leave empty for none. */
    other?: string
    /** Said to a typed answer that matches no option. `{text}` is what they typed. */
    otherReply?: string
    agent?: string
    start?: string
    /** Small tiles: the question and the keys, no transcript. */
    compact?: boolean
  }>(),
  { other: 'Something else', otherReply: 'Noted: “{text}”. I will check it and confirm.', agent: 'Simpul', start: '08:41' },
)

const clock = useClock(props.start)
const asked = clock.now()
const state = ref<'ask' | 'other' | 'done'>('ask')
const chosen = ref('')
const result = ref<{ text: string; detail?: string }>({ text: '' })
const answeredAt = ref('')
const typed = ref('')
const field = ref<InstanceType<typeof RInput> | null>(null)
const { busy, reply } = useReply(650)

function choose(label: string, text: string, detail?: string) {
  chosen.value = label
  reply(() => {
    result.value = { text, detail }
    answeredAt.value = clock.next()
    state.value = 'done'
  })
}

function pick(option: Option) {
  choose(option.label, option.result, option.detail)
}

function openOther() {
  state.value = 'other'
  nextTick(() => field.value?.focus())
}

function sendOther() {
  const said = typed.value.trim()
  if (!said) return
  const found = understand(said, props.options.filter((o): o is Option & { match: string } => !!o.match))
  if (found) pick(found)
  else choose(said, fill(props.otherReply, { text: said }))
}

function change() {
  state.value = 'ask'
  chosen.value = ''
  typed.value = ''
}
</script>

<template>
  <div class="mk clarify" :class="{ 'clarify--compact': compact }">
    <template v-if="!compact">
      <Msg who="You" :at="asked" mine>{{ request }}</Msg>
      <Msg :who="agent" :at="asked" class="clarify__q">
        <p class="clarify__question">{{ question }}</p>
      </Msg>
    </template>
    <template v-else>
      <p class="clarify__request mk-truncate">“{{ request }}”</p>
      <p class="clarify__question">{{ question }}</p>
    </template>

    <div class="clarify__answer mk-grow" aria-live="polite">
      <div v-if="state === 'ask' && !busy" class="clarify__keys" role="group" :aria-label="question">
        <button v-for="option in options" :key="option.label" type="button" class="clarify__key mk-reset" @click="pick(option)">
          <span class="mk-truncate">{{ option.label }}</span>
        </button>
        <button v-if="other" type="button" class="clarify__key clarify__key--other mk-reset" @click="openOther">
          <span class="mk-truncate">{{ other }}</span>
        </button>
      </div>

      <form v-else-if="state === 'other' && !busy" class="clarify__other" @submit.prevent="sendOther">
        <RInput ref="field" v-model="typed" size="sm" placeholder="Type the answer" :aria-label="question">
          <template #trailing>
            <button type="submit" class="clarify__send mk-reset" aria-label="Send the answer">
              <CornerDownLeft :size="14" />
            </button>
          </template>
        </RInput>
        <button type="button" class="clarify__back mk-reset" @click="change">Back to the choices</button>
      </form>

      <Writing v-else-if="busy" :label="compact ? 'On it' : 'Working'" />

      <div v-else class="clarify__done">
        <p v-if="!compact" class="clarify__chosen mk-truncate">You chose “{{ chosen }}”</p>
        <p class="clarify__result">
          <Check :size="14" aria-hidden="true" />
          <span>{{ result.text }}</span>
        </p>
        <p v-if="result.detail" class="clarify__detail mk-truncate">{{ result.detail }} · {{ answeredAt }}</p>
        <RButton size="xs" variant="ghost" class="clarify__change" @click="change">Change</RButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.clarify {
  container-type: inline-size;
  gap: 6px;
}

.clarify__question {
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
  line-height: 1.35;
}

.clarify__request {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.clarify__answer {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.clarify__keys {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.clarify__key {
  display: flex;
  align-items: center;
  min-width: 0;
  height: 28px;
  padding: 0 10px;
  border: 1px solid var(--r-border-strong);
  color: var(--r-text);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
  cursor: pointer;
  transition:
    border-color var(--r-duration-fast) var(--r-ease-out),
    background-color var(--r-duration-fast) var(--r-ease-out);
}

.clarify__key:hover {
  border-color: var(--r-brand);
  background: var(--r-bg-selected);
}

.clarify__key--other {
  border-style: dashed;
  color: var(--r-text-secondary);
}

.clarify__other {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.clarify__send {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: var(--r-text-tertiary);
  cursor: pointer;
}

.clarify__back {
  align-self: flex-start;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  cursor: pointer;
}

.clarify__back:hover {
  color: var(--r-text);
}

.clarify__done {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  min-width: 0;
}

.clarify__chosen {
  max-width: 100%;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.clarify__result {
  display: flex;
  gap: 6px;
  font-size: var(--r-text-sm);
  line-height: 1.35;
}

.clarify__result svg {
  flex: none;
  margin-top: 2px;
  color: var(--r-success-text);
}

.clarify--compact .clarify__result {
  font-size: var(--r-text-xs);
}

.clarify__detail {
  max-width: 100%;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.02em;
}

.clarify__change {
  margin-left: -8px;
}

/* A wide strip: the question on the left, the keys on the right. */
@container (min-width: 300px) {
  .clarify--compact .clarify__keys {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
}
</style>
