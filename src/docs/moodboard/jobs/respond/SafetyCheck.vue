<script setup lang="ts">
/**
 * After an earthquake, a gas alarm, a fire: "Are you safe?" with two answers. The tally fills as
 * the rest of the team answers, one square each, so the person in charge sees who is still
 * missing. "I need help" is the louder answer and says what happens next.
 */
import { computed, ref, watch } from 'vue'
import { RButton, RStatus } from '@/design-system'
import { useTick } from '../../kit'
import { stamp, useFocusKeeper } from './shared'

const props = withDefaults(
  defineProps<{
    eyebrow: string
    /** The word on the lamp: "M5.8", "Gas", "Fire alarm". */
    word: string
    tone?: 'danger' | 'warning'
    title: string
    question?: string
    safe?: string
    help?: string
    /** What happens after "I need help". */
    helpText: string
    /** Team size, and how many answered "safe" already. */
    team: number
    answered: number
    /** Seconds on screen between two teammates answering. */
    every?: number
    /** Teammates, in the order they answer, for the latest-answers lines. */
    names?: string[]
    /** `panel` 2x2 · `row` 2x1. */
    layout?: 'panel' | 'row'
  }>(),
  { tone: 'danger', question: 'Are you safe?', safe: 'I’m safe', help: 'I need help', every: 4, names: () => [], layout: 'panel' },
)

const others = ref(props.answered)
const me = ref<'safe' | 'help' | null>(null)
const at = ref('')
const tick = useTick(1000)
const { bind, keep } = useFocusKeeper()

/* The rest of the team answers on its own, one by one, leaving a couple who have not. */
watch(tick, (t) => {
  if (t % props.every === 0 && others.value < props.team - 3) others.value++
})

/* The latest two who answered, newest first, with the minute they did. */
const latest = computed(() =>
  props.names.length
    ? [others.value - 1, others.value - 2]
        .filter((i) => i >= 0)
        .map((i) => ({ name: props.names[i % props.names.length], minute: Math.max(1, Math.round((others.value - i) * 0.8)) }))
    : [],
)

const safeCount = computed(() => others.value + (me.value === 'safe' ? 1 : 0))
const helpCount = computed(() => (me.value === 'help' ? 1 : 0))

function answer(value: 'safe' | 'help') {
  keep('[data-focus="change"]')
  me.value = value
  at.value = stamp()
}

function change() {
  keep('[data-focus="safe"]')
  me.value = null
}

/* One square per person: safe first, then help, then not yet answered. Yours is marked. */
const squares = computed(() =>
  Array.from({ length: props.team }, (_, i) => {
    if (i < safeCount.value) return 'safe'
    if (i < safeCount.value + helpCount.value) return 'help'
    return 'none'
  }),
)
</script>

<template>
  <div :ref="bind" class="mk safe" :class="`safe--${layout}`">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <RStatus :tone="tone" :label="word" size="sm" class="safe__status" />
    </div>
    <p v-if="layout === 'panel'" class="safe__title">{{ title }}</p>

    <div class="safe__tally" role="img" :aria-label="`${safeCount} of ${team} safe, ${helpCount} need help, ${team - safeCount - helpCount} not answered`">
      <span v-for="(s, i) in squares" :key="i" :class="`is-${s}`" />
    </div>
    <p class="safe__count">
      <span class="safe__n">{{ safeCount }}</span> of {{ team }} safe
      <template v-if="helpCount"> · {{ helpCount }} need help</template>
      · {{ team - safeCount - helpCount }} not yet
    </p>

    <ul v-if="latest.length && layout === 'panel'" class="safe__latest">
      <li v-for="p in latest" :key="p.name">
        <span class="mk-truncate">{{ p.name }}</span>
        <span class="safe__ago">Safe · {{ p.minute }} min ago</span>
      </li>
    </ul>

    <div class="safe__foot mk-end">
      <template v-if="!me">
        <p v-if="layout === 'panel'" class="safe__q">{{ question }}</p>
        <div class="safe__actions">
          <RButton size="sm" data-focus="safe" @click="answer('safe')">{{ safe }}</RButton>
          <RButton size="sm" tone="danger" variant="outline" @click="answer('help')">{{ help }}</RButton>
        </div>
      </template>
      <div v-else class="safe__done">
        <p class="safe__said" aria-live="polite">
          <span class="safe__at">{{ at }}</span>
          {{ me === 'safe' ? 'You are marked safe. Your team can see it.' : helpText }}
        </p>
        <RButton size="sm" variant="ghost" data-focus="change" @click="change">Change</RButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.safe {
  gap: 8px;
}

.safe__status {
  flex: none;
}

.safe__title {
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.35;
}

.safe__tally {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(10px, 1fr));
  gap: 2px;
}

.safe--panel .safe__tally {
  grid-template-columns: repeat(auto-fill, minmax(18px, 1fr));
  margin-top: 4px;
}

.safe__tally span {
  aspect-ratio: 1;
  background: var(--r-bg-track);
}

.safe__tally span.is-safe {
  background: var(--r-status-good);
}

.safe__tally span.is-help {
  background: var(--r-status-critical);
}

.safe__count {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.safe__n {
  color: var(--r-text);
  font-weight: var(--r-weight-semibold);
}

.safe__latest {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--r-border-subtle);
}

.safe__latest li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 0;
  border-bottom: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-xs);
}

.safe__ago {
  flex: none;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  line-height: 18px;
  text-transform: uppercase;
}

.safe__foot {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.safe__q {
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
}

.safe__actions {
  display: flex;
  gap: 8px;
}

.safe__actions > * {
  flex: 1 1 0;
}

.safe__done {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.safe__said {
  min-width: 0;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

.safe__at {
  margin-right: 4px;
  color: var(--r-text);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
}
</style>
