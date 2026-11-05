<script setup lang="ts">
/**
 * The conversation, oldest first, scrolled to the latest message. Messages are square blocks with
 * a mono head (who, when); the person's own carry a faint fill, the agent's sit on a hairline,
 * system lines are quiet mono notes. A message with a `card` renders the screen's `card` slot
 * inside it: the summary to check, the diff to approve, the options to pick from.
 */
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { DeskMessage } from './script'

const props = defineProps<{
  messages: DeskMessage[]
  /** The agent is writing a reply. */
  writing?: boolean
  agent: string
}>()

defineSlots<{ card?(props: { message: DeskMessage }): unknown }>()

const root = ref<HTMLElement | null>(null)
const toLatest = () => root.value && (root.value.scrollTop = root.value.scrollHeight)
watch(
  () => [props.messages.length, props.writing],
  () => nextTick(toLatest),
  { immediate: true },
)

/* A resize (a rotated phone, a narrower window) keeps the latest message in view. */
let ro: ResizeObserver | null = null
onMounted(() => {
  if (!root.value) return
  ro = new ResizeObserver(() => toLatest())
  ro.observe(root.value)
})
onBeforeUnmount(() => ro?.disconnect())
</script>

<template>
  <div ref="root" class="desk-thread">
    <ol class="desk-thread__list" role="log" aria-live="polite" :aria-label="`Conversation with ${agent}`">
      <li v-for="m in messages" :key="m.id" class="desk-thread__item" :class="{ 'is-system': m.system }">
        <p v-if="m.system" class="desk-thread__note">
          <span class="desk-thread__at">{{ m.at }}</span>
          <span>{{ m.text }}</span>
        </p>
        <div v-else class="desk-msg" :class="{ 'desk-msg--mine': m.mine }">
          <p class="desk-msg__head">
            <span>{{ m.mine ? 'You' : m.who }}</span>
            <span class="desk-thread__at">{{ m.at }}</span>
          </p>
          <p v-if="m.text" class="desk-msg__text">{{ m.text }}</p>
          <div v-if="m.card" class="desk-msg__card"><slot name="card" :message="m" /></div>
        </div>
      </li>
      <li v-if="writing" class="desk-thread__item">
        <div class="desk-msg">
          <p class="desk-msg__head"><span>{{ agent }}</span></p>
          <span class="desk-writing" role="status">
            <span class="desk-writing__dots" aria-hidden="true"><i /><i /><i /></span>
            <span>Writing</span>
          </span>
        </div>
      </li>
    </ol>
  </div>
</template>

<style>
.desk-thread {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 16px;
  scroll-behavior: smooth;
}

@media (prefers-reduced-motion: reduce) {
  .desk-thread {
    scroll-behavior: auto;
  }
}

.desk-thread__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.desk-thread__note {
  display: flex;
  gap: 8px;
  padding: 2px 0;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  letter-spacing: 0.02em;
}

.desk-thread__at {
  flex: none;
  font-variant-numeric: tabular-nums;
}

.desk-msg {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding: 8px 12px 10px;
  border: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}

.desk-msg--mine {
  border-color: transparent;
  background: color-mix(in srgb, var(--r-text) 6%, transparent);
}

.desk-msg__head {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-medium);
  line-height: 16px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.desk-msg__text {
  color: var(--r-text);
  font-size: var(--r-text-sm);
  line-height: var(--r-leading-normal);
  overflow-wrap: anywhere;
  white-space: pre-line;
}

.desk-msg__card {
  margin-top: 6px;
}

.desk-writing {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-medium);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.desk-writing__dots {
  display: inline-flex;
  gap: 2px;
}

/* Three square segments lit in turn, in steps; still under reduced motion. */
.desk-writing__dots i {
  width: 4px;
  height: 4px;
  background: var(--r-text-secondary);
  opacity: 0.25;
  animation: desk-writing 960ms steps(1, end) infinite;
}
.desk-writing__dots i:nth-child(2) {
  animation-delay: 320ms;
}
.desk-writing__dots i:nth-child(3) {
  animation-delay: 640ms;
}

@keyframes desk-writing {
  0% {
    opacity: 1;
  }
  33.3% {
    opacity: 0.25;
  }
}

@media (prefers-reduced-motion: reduce) {
  .desk-writing__dots i {
    animation: none;
    opacity: 0.6;
  }
}
</style>
