<script setup lang="ts">
/**
 * Push to talk, for hands that are busy. Hold the key (or Space) and speak; the words appear as
 * they are heard, and on release the screen shows only what was understood, field by field.
 * Too short a press is told so. Each new press plays the next scripted phrase.
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { Check, Mic } from 'lucide-vue-next'
import { RStatus } from '@/design-system'
import { useTick } from '../../kit'
import { useClock } from './shared'

interface Utterance {
  /** What the person says, word by word. */
  words: string
  /** What it becomes. */
  result: { label: string; value: string }[]
}

const props = withDefaults(
  defineProps<{
    label: string
    /** The language it listens in, mono: "ID", "EN". */
    lang?: string
    utterances: Utterance[]
    /** After a phrase is understood: "Logged to WO-1182". */
    saved?: string
    start?: string
    /** What to say, shown while nothing has been said: "Say the meter and the reading". */
    hint?: string
    /** Open on the last thing captured, so the result shows before the first press. */
    primed?: boolean
    /** Small tiles: the key, one line of words, the first result. */
    compact?: boolean
  }>(),
  { lang: 'ID', start: '10:42', hint: 'Hold the key and speak; release to finish.' },
)

const clock = useClock(props.start)
const which = ref(0)
const shown = ref(0)
const holding = ref(false)
const state = ref<'idle' | 'short' | 'partial' | 'done'>(props.primed ? 'done' : 'idle')
const savedAt = ref(props.primed ? clock.now() : '')
let timer: number | undefined

const words = computed(() => props.utterances[which.value].words.split(' '))
const heard = computed(() => words.value.slice(0, shown.value).join(' '))

function reveal() {
  if (!holding.value) return
  if (shown.value < words.value.length) shown.value++
  timer = window.setTimeout(reveal, 170)
}

function begin() {
  if (holding.value) return
  if (state.value === 'done') which.value = (which.value + 1) % props.utterances.length
  shown.value = 0
  holding.value = true
  state.value = 'idle'
  window.clearTimeout(timer)
  timer = window.setTimeout(reveal, 260)
}

function end() {
  if (!holding.value) return
  holding.value = false
  window.clearTimeout(timer)
  if (shown.value < 3) state.value = 'short'
  else if (shown.value < words.value.length) state.value = 'partial'
  else {
    state.value = 'done'
    savedAt.value = clock.next()
  }
}

onBeforeUnmount(() => window.clearTimeout(timer))

const handlers = {
  onPointerdown(event: PointerEvent) {
    if (event.button !== 0) return
    ;(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId)
    begin()
  },
  onPointerup: end,
  onPointercancel: end,
  onLostpointercapture: end,
  onKeydown(event: KeyboardEvent) {
    if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) {
      event.preventDefault()
      begin()
    }
  },
  onKeyup(event: KeyboardEvent) {
    if (event.key === ' ' || event.key === 'Enter') end()
  },
  onBlur: end,
  onContextmenu: (event: Event) => event.preventDefault(),
}

/* The level: 14 bars that move while the key is held. */
const BARS = 14
const levels = ref<number[]>(Array.from({ length: BARS }, () => 0))
const tick = useTick(90)
watch(tick, () => {
  if (!holding.value) {
    if (levels.value[0] !== 0) levels.value = levels.value.map(() => 0)
    return
  }
  levels.value = levels.value.map((_, i) => {
    const centre = 1 - Math.abs(i - BARS / 2) / (BARS / 2)
    return Math.min(1, 0.15 + Math.random() * 0.6 * (0.4 + centre))
  })
})

/* Read out once a phrase is finished, not word by word while the key is held. */
const spoken = computed(() => {
  if (holding.value) return ''
  if (state.value === 'done')
    return `Heard: ${props.utterances[which.value].words}. ${props.utterances[which.value].result.map((r) => `${r.label} ${r.value}`).join(', ')}.`
  return note.value
})

const note = computed(() => {
  if (holding.value) return ''
  if (state.value === 'short') return 'Did not catch that. Hold while you speak.'
  if (state.value === 'partial') return 'Heard part of it. Hold and say it again.'
  return ''
})
</script>

<template>
  <div class="mk voice" :class="{ 'voice--compact': compact }">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ label }}</span>
      <RStatus v-if="holding" tone="signal" label="Live" pulse size="sm" />
      <span v-else class="voice__lang">{{ lang }}</span>
    </div>

    <p class="r-sr-only" aria-live="polite">{{ spoken }}</p>
    <div class="voice__main mk-grow">
      <div class="voice__words">
        <template v-if="holding || state === 'partial'">
          <p class="voice__heard">{{ heard }}<span v-if="holding" class="voice__caret" /></p>
          <p v-if="!holding" class="voice__note">{{ note }}</p>
        </template>
        <p v-else-if="note" class="voice__note">{{ note }}</p>
        <template v-else-if="state === 'done'">
          <p class="voice__said">“{{ utterances[which].words }}”</p>
          <dl class="voice__result">
            <div v-for="row in utterances[which].result" :key="row.label" class="voice__row">
              <dt>{{ row.label }}</dt>
              <dd>{{ row.value }}</dd>
            </div>
          </dl>
          <p v-if="saved" class="voice__saved"><Check :size="12" aria-hidden="true" />{{ saved }} · {{ savedAt }}</p>
        </template>
        <p v-else class="voice__note">{{ hint }}</p>
      </div>

      <div class="voice__ctl">
        <div class="voice__bars" aria-hidden="true">
          <i v-for="(l, i) in levels" :key="i" :style="{ transform: `scaleY(${Math.max(0.08, l)})` }" />
        </div>
        <button
          type="button"
          class="voice__key"
          :class="{ 'is-holding': holding }"
          :aria-label="`${label}: hold to talk`"
          :aria-pressed="holding"
          v-bind="handlers"
        >
          <Mic :size="16" aria-hidden="true" />
          <span>{{ holding ? 'Listening' : 'Hold to talk' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.voice {
  container-type: inline-size;
  gap: 8px;
}

.voice__main {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.voice__ctl {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: 8px;
}

.voice__lang {
  flex: none;
  padding: 0 4px;
  border: 1px solid var(--r-border-strong);
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  line-height: 14px;
}

.voice__words {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 6px;
  min-height: 0;
  overflow: hidden;
}

.voice__heard {
  font-size: var(--r-text-md);
  line-height: 1.35;
}

.voice__caret {
  display: inline-block;
  width: 2px;
  height: 1em;
  margin-left: 2px;
  background: var(--r-signal);
  vertical-align: -2px;
}

.voice__note {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

.voice__said {
  display: -webkit-box;
  overflow: hidden;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.voice__result {
  display: grid;
  margin: 0;
  border-top: 1px solid var(--r-border-subtle);
}

.voice__row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 3px 0;
  border-bottom: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-xs);
}

.voice__row dt {
  flex: none;
  color: var(--r-text-tertiary);
}

.voice__row dd {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.voice__saved {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--r-success-text);
  font-size: var(--r-text-2xs);
}

.voice__bars {
  display: flex;
  flex: none;
  align-items: center;
  gap: 2px;
  height: 18px;
}

.voice__bars i {
  flex: 1;
  height: 100%;
  background: var(--r-text-secondary);
  transform-origin: center;
  transition: transform var(--r-duration-instant) linear;
}

.voice__key {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: var(--r-control-xl);
  border: 0;
  border-radius: var(--r-radius-control);
  background: var(--r-ink);
  color: var(--r-on-ink);
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
  cursor: pointer;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.voice__key:hover {
  background: var(--r-ink-hover);
}

.voice__key.is-holding {
  background: var(--r-signal);
  color: var(--r-on-signal);
}

.voice--compact {
  gap: 6px;
}

.voice--compact .voice__heard,
.voice--compact .voice__said {
  font-size: var(--r-text-xs);
  -webkit-line-clamp: 2;
}

.voice--compact .voice__bars {
  height: 12px;
}

.voice--compact .voice__key {
  height: var(--r-control-lg);
}

.voice--compact .voice__row:nth-child(n + 2),
.voice--compact .voice__saved {
  display: none;
}

/* A compact strip: the key on the left, the words and what they became on the right. */
@container (min-width: 280px) {
  .voice--compact .voice__main {
    display: grid;
    grid-template-columns: 112px minmax(0, 1fr);
    gap: 14px;
  }
  .voice--compact .voice__ctl {
    order: -1;
    justify-content: flex-end;
  }
  .voice--compact .voice__key {
    flex-direction: column;
    gap: 4px;
    height: 64px;
  }
  .voice--compact .voice__row:nth-child(n + 2) {
    display: flex;
  }
}
</style>
