<script setup lang="ts">
/**
 * An invitation answered with a key. The date sits in a square block so the day reads first;
 * the reply goes to the host as soon as it is pressed and can be changed until the day.
 */
import { computed, ref } from 'vue'
import { timeZ, type Zone } from '../../kit'

interface Reply {
  id: string
  label: string
  /** Counts toward "going". */
  going?: boolean
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    title: string
    /** The date block: "Nov", "12", "Thu". */
    month: string
    day: string
    weekday: string
    /** "10:00–11:30 WIB". */
    when: string
    where?: string
    host: string
    going: number
    invited: number
    replies?: Reply[]
    zone?: Zone
    compact?: boolean
  }>(),
  {
    where: undefined,
    replies: () => [
      { id: 'yes', label: 'Going', going: true },
      { id: 'maybe', label: 'Maybe' },
      { id: 'no', label: 'Can’t go' },
    ],
    zone: 'WIB',
  },
)

const mine = ref<string | null>(null)
const at = ref<Date | null>(null)
const reply = computed(() => props.replies.find((r) => r.id === mine.value))
const count = computed(() => props.going + (reply.value?.going ? 1 : 0))

function answer(r: Reply) {
  mine.value = r.id
  at.value = new Date()
}
</script>

<template>
  <div class="mk invite" :class="{ 'invite--compact': compact }">
    <div class="invite__top">
      <p class="invite__date" :aria-label="`${weekday} ${day} ${month}`">
        <span class="invite__month">{{ month }}</span>
        <span class="invite__day mk-fig">{{ day }}</span>
        <span v-if="!compact" class="invite__weekday">{{ weekday }}</span>
      </p>
      <div class="invite__what">
        <div class="mk-row mk-between">
          <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
          <span v-if="!compact" class="r-label invite__count">{{ count }} of {{ invited }} going</span>
        </div>
        <p class="invite__title mk-truncate">{{ title }}</p>
        <p class="invite__when mk-truncate">{{ when }}<template v-if="where && !compact"> · {{ where }}</template></p>
      </div>
    </div>

    <div class="invite__keys mk-end" role="group" :aria-label="`Reply to ${title}`">
      <button
        v-for="r in replies"
        :key="r.id"
        type="button"
        class="invite__key mk-reset"
        :class="{ 'is-on': mine === r.id }"
        :aria-pressed="mine === r.id ? 'true' : 'false'"
        @click="answer(r)"
      >
        {{ r.label }}
      </button>
    </div>
    <p class="invite__foot r-label">
      <template v-if="reply">Sent to {{ host }} · {{ at ? timeZ(at, zone) : '' }}</template>
      <template v-else-if="compact">{{ count }} of {{ invited }} going</template>
      <template v-else>From {{ host }}</template>
    </p>
  </div>
</template>

<style scoped>
.invite {
  gap: 8px;
}

.invite__top {
  display: flex;
  gap: 12px;
  min-width: 0;
}

/* The date block: month and weekday in mono caps around the day, in a ruled square. */
.invite__date {
  display: flex;
  flex: none;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 56px;
  border: 1px solid var(--r-border-strong);
}

.invite__month,
.invite__weekday {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.invite__month {
  color: var(--r-text);
}

.invite__day {
  font-size: var(--r-text-2xl);
}

.invite__what {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.invite__count {
  flex: none;
}

.invite__title {
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.3;
}

.invite__when {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

.invite__keys {
  display: grid;
  grid-auto-columns: minmax(0, 1fr);
  grid-auto-flow: column;
  gap: 4px;
}

.invite__key {
  height: var(--r-control-sm);
  border: 1px solid var(--r-border-strong);
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
  text-align: center;
  cursor: pointer;
  transition:
    background-color var(--r-duration-fast) var(--r-ease-out),
    color var(--r-duration-fast) var(--r-ease-out);
}

.invite__key:hover:not(.is-on) {
  background: var(--r-bg-hover);
}

.invite__key.is-on {
  border-color: var(--r-ink);
  background: var(--r-ink);
  color: var(--r-on-ink);
}

.invite__foot {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 1x1: a smaller block, the place and the weekday go. */
.invite--compact .invite__top {
  gap: 10px;
}

.invite--compact .invite__date {
  width: 40px;
  height: 44px;
}

.invite--compact .invite__day {
  font-size: var(--r-text-xl);
}

.invite--compact .invite__title {
  font-size: var(--r-text-sm);
}

.invite--compact .invite__key {
  font-size: var(--r-text-xs);
}
</style>
