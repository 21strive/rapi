<script setup lang="ts">
/**
 * Most answers to a message are one of three. The likely replies sit under it; picking one puts
 * it in the field to check or change, and Send sends it. The other side answers back.
 */
import { nextTick, ref, watch } from 'vue'
import { CornerDownLeft } from 'lucide-vue-next'
import { RButton, RInput } from '@/design-system'
import Msg from './Msg.vue'
import { useClock, useReply } from './shared'

interface Reply {
  text: string
  /** What the other side writes back. */
  answer?: string
}

const props = withDefaults(
  defineProps<{
    /** Who wrote the message: "Fikri · driver". */
    from: string
    at: string
    message: string
    replies: Reply[]
    /** Small tiles: a key sends the reply straight away. */
    compact?: boolean
  }>(),
  {},
)

const clock = useClock(props.at)
const draft = ref('')
const picked = ref<Reply | null>(null)
const sent = ref<{ text: string; at: string } | null>(null)
const answer = ref<{ text: string; at: string } | null>(null)
const field = ref<InstanceType<typeof RInput> | null>(null)
const { busy, reply } = useReply(1300)
const log = ref<HTMLElement | null>(null)

/* The newest message stays in view; the log scrolls, it never clips. */
watch([sent, answer, busy], () =>
  nextTick(() => {
    if (log.value) log.value.scrollTop = log.value.scrollHeight
  }),
)

function pick(r: Reply) {
  picked.value = r
  if (props.compact) {
    send(r.text)
    return
  }
  draft.value = r.text
  nextTick(() => field.value?.focus())
}

function send(text = draft.value) {
  const t = text.trim()
  if (!t) return
  sent.value = { text: t, at: clock.next() }
  draft.value = ''
  const back = picked.value && picked.value.text === t ? picked.value.answer : props.replies.find((r) => r.text === t)?.answer
  reply(() => {
    answer.value = { text: back ?? 'Ok, noted.', at: clock.next() }
  })
}

function reset() {
  sent.value = null
  answer.value = null
  picked.value = null
  draft.value = ''
}
</script>

<template>
  <div class="mk replies" :class="{ 'replies--compact': compact }">
    <div ref="log" class="replies__log" aria-live="polite">
      <Msg :who="from" :at="at" :dense="compact">{{ message }}</Msg>
      <Msg v-if="sent" who="You" :at="sent.at" mine :dense="compact">{{ sent.text }}</Msg>
      <Msg v-if="sent && (busy || answer)" :who="from" :at="answer?.at" :pending="busy" :dense="compact">{{ answer?.text }}</Msg>
    </div>

    <template v-if="!sent">
      <div class="replies__keys" role="group" aria-label="Suggested replies">
        <button
          v-for="r in replies"
          :key="r.text"
          type="button"
          class="replies__key mk-reset"
          :class="{ 'is-picked': picked === r }"
          @click="pick(r)"
        >
          <span class="replies__key-text">{{ r.text }}</span>
        </button>
      </div>
      <form v-if="!compact" class="replies__form" @submit.prevent="send()">
        <RInput ref="field" v-model="draft" size="sm" placeholder="Pick a reply or write one" aria-label="Reply">
          <template #trailing>
            <button type="submit" class="replies__send mk-reset" aria-label="Send">
              <CornerDownLeft :size="14" />
            </button>
          </template>
        </RInput>
      </form>
    </template>
    <div v-else class="replies__foot">
      <span class="r-label">{{ answer ? 'Read' : 'Delivered' }}</span>
      <RButton size="xs" variant="ghost" @click="reset">Start over</RButton>
    </div>
  </div>
</template>

<style scoped>
.replies {
  container-type: inline-size;
  gap: 8px;
}

.replies__log {
  display: flex;
  flex: 0 1 auto;
  flex-direction: column;
  gap: 6px;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: none;
}

.replies__keys {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: 4px;
}

.replies__key {
  display: flex;
  align-items: center;
  min-width: 0;
  min-height: 28px;
  padding: 4px 10px;
  border: 1px solid var(--r-border-strong);
  color: var(--r-text);
  font-size: var(--r-text-xs);
  line-height: 1.3;
  cursor: pointer;
  transition:
    border-color var(--r-duration-fast) var(--r-ease-out),
    background-color var(--r-duration-fast) var(--r-ease-out);
}

.replies__key:hover,
.replies__key.is-picked {
  border-color: var(--r-brand);
  background: var(--r-bg-selected);
}

.replies__key-text {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.replies__form {
  flex: none;
  margin-top: auto;
}

.replies__send {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: var(--r-text-tertiary);
  cursor: pointer;
}

.replies__foot {
  display: flex;
  flex: none;
  margin-top: auto;
  align-items: center;
  justify-content: space-between;
}

.replies--compact {
  gap: 6px;
}

.replies--compact .replies__key {
  min-height: 24px;
  padding: 2px 8px;
}

/* A strip: the replies sit in a row under the message. */
@container (min-width: 300px) {
  .replies--compact .replies__keys {
    flex-direction: row;
    flex-wrap: wrap;
  }
  .replies--compact .replies__key {
    max-width: 100%;
  }
}
</style>
