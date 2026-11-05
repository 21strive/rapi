<script setup lang="ts">
/**
 * A date that will cost something if it passes: tax, a bill, a notice period, a licence. The date
 * block and the days left say it at a glance; the one action does it now, the quiet one asks to
 * be reminded at a better moment. Both can be undone.
 */
import { computed, ref } from 'vue'
import { RButton, RStatus } from '@/design-system'
import { useFocusKeeper } from './shared'

const props = withDefaults(
  defineProps<{
    eyebrow: string
    /** The date: day number and month. */
    day: number
    month: string
    /** Days left, said in words on the lamp. */
    days: number
    title: string
    figure?: string
    detail?: string
    action: string
    /** Said after the action: "Paid · receipt sent to your email". */
    done: string
    snooze?: string
    /** Said after snoozing: "Reminder set for Fri 6 Nov, 09:00 WIB". */
    snoozed?: string
    /** `row` 2x1 · `square` 1x1. */
    layout?: 'row' | 'square'
  }>(),
  { layout: 'row' },
)

const state = ref<'due' | 'done' | 'snoozed'>('due')
const { bind, keep } = useFocusKeeper()

function set(next: 'done' | 'snoozed') {
  keep('[data-focus="undo"]')
  state.value = next
}

function undo() {
  keep('[data-focus="act"]')
  state.value = 'due'
}

const when = computed(() => (props.days === 0 ? 'Today' : props.days === 1 ? 'Tomorrow' : `In ${props.days} days`))
const status = computed(() => {
  if (state.value === 'done') return { tone: 'success' as const, label: 'Done' }
  if (state.value === 'snoozed') return { tone: 'neutral' as const, label: 'Snoozed' }
  return { tone: props.days <= 2 ? ('warning' as const) : ('neutral' as const), label: when.value }
})
</script>

<template>
  <div :ref="bind" class="mk due" :class="`due--${layout}`">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <RStatus v-if="layout === 'row'" :tone="status.tone" :label="status.label" size="sm" class="due__status" />
    </div>

    <div class="due__main" :class="`is-${status.tone}`">
      <p class="due__date" :class="{ 'is-done': state === 'done' }" aria-hidden="true">
        <span class="due__month">{{ month }}</span>
        <span class="due__day">{{ String(day).padStart(2, '0') }}</span>
      </p>
      <div class="due__text">
        <p class="due__title">{{ layout === 'square' ? status.label : title }}</p>
        <p v-if="state !== 'done' && (figure || layout === 'square')" class="due__figure">{{ figure ?? title }}</p>
        <p v-if="layout === 'row' || state !== 'due'" class="due__detail" aria-live="polite">
          {{ state === 'done' ? done : state === 'snoozed' ? snoozed : detail }}
        </p>
      </div>
    </div>

    <div class="due__foot mk-end">
      <template v-if="state === 'due'">
        <RButton size="sm" data-focus="act" @click="set('done')">{{ action }}</RButton>
        <RButton v-if="snooze && layout === 'row'" size="sm" variant="ghost" @click="set('snoozed')">{{ snooze }}</RButton>
      </template>
      <RButton v-else size="sm" variant="ghost" data-focus="undo" @click="undo">Undo</RButton>
    </div>
  </div>
</template>

<style scoped>
.due {
  gap: 8px;
}

.due__status {
  flex: none;
}

.due__main {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
}

/* The date block: a torn-off calendar page, square, month over day. */
.due__date {
  display: flex;
  flex: none;
  flex-direction: column;
  align-items: stretch;
  width: 48px;
  border: 1px solid var(--r-border-strong);
  text-align: center;
}

.due__month {
  padding: 2px 0;
  background: var(--r-ink);
  color: var(--r-on-ink);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.due__day {
  padding: 3px 0 4px;
  font-size: var(--r-text-xl);
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}

.due__date.is-done {
  border-color: var(--r-border);
  color: var(--r-text-tertiary);
}

.due__date.is-done .due__month {
  background: var(--r-bg-pressed);
  color: var(--r-text-secondary);
}

.due__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.due__title {
  display: -webkit-box;
  overflow: hidden;
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.35;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.due--square .due__title {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.due--square .due__figure {
  display: -webkit-box;
  font-size: var(--r-text-sm);
  line-height: 1.3;
  white-space: normal;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.due--square .is-warning .due__title {
  color: var(--r-warning-text);
}

.due--square .is-success .due__title {
  color: var(--r-success-text);
}

.due__figure {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
}

.due__detail {
  display: -webkit-box;
  overflow: hidden;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.due__foot {
  display: flex;
  gap: 4px;
}

.due--square .due__foot > * {
  flex: 1 1 auto;
}
</style>
