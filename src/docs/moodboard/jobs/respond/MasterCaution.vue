<script setup lang="ts">
/**
 * The master caution: one big square lamp that is also its own button, as in a cockpit. It
 * flashes in two steps when something new comes in; pressing it puts it out so the next fault can
 * light it again, while the cause stays written under it. Pressed while dark, it recalls: it
 * lights steady if a fault is still standing.
 */
import { computed, ref, watch } from 'vue'
import { useTick } from '../../kit'
import { stamp } from './shared'

const props = withDefaults(
  defineProps<{
    /** Two short lines on the lamp: ["Master", "caution"]. */
    legend: [string, string]
    tone?: 'warning' | 'danger'
    /** The standing fault, in panel words: "HYD B · LO PRESS". */
    cause: string
    /** A second fault that trips by itself a while after the lamp is reset. */
    next?: string
    /** Seconds on screen after a reset before `next` trips. */
    nextAfter?: number
  }>(),
  { tone: 'warning', nextAfter: 14 },
)

const state = ref<'flash' | 'steady' | 'dark'>('flash')
const causes = ref<string[]>([props.cause])
const resetAt = ref<string | null>(null)

/* A second fault, if there is one, trips on its own while the lamp is dark. */
const tick = useTick(1000)
let darkFor = 0
watch(tick, () => {
  if (state.value !== 'dark' || !props.next || causes.value.includes(props.next)) return
  darkFor++
  if (darkFor >= props.nextAfter) {
    causes.value = [props.next, ...causes.value]
    state.value = 'flash'
  }
})

function press() {
  if (state.value === 'dark') {
    state.value = 'steady'
    return
  }
  state.value = 'dark'
  resetAt.value = stamp()
  darkFor = 0
}

const word = computed(() => (props.tone === 'danger' ? 'warning' : 'caution'))
const count = computed(() => `${causes.value.length} ${word.value}${causes.value.length === 1 ? '' : 's'}`)
const hint = computed(() =>
  state.value === 'dark' ? `Reset ${resetAt.value} · press to recall` : state.value === 'flash' ? 'New · press to reset' : 'Standing · press to reset',
)
const label = computed(() => {
  const lamp = `${props.legend.join(' ')}, ${state.value === 'dark' ? 'off' : state.value === 'flash' ? 'flashing' : 'lit'}`
  return `${lamp}. ${count.value}: ${causes.value.join(', ')}. ${state.value === 'dark' ? 'Press to recall' : 'Press to reset'}`
})
</script>

<template>
  <div class="mk mc">
    <button
      type="button"
      class="mc__lamp mk-reset"
      :class="[`r-tone-${tone}`, `is-${state}`]"
      :aria-label="label"
      @click="press"
    >
      <span class="mc__legend">
        <span>{{ legend[0] }}</span>
        <span>{{ legend[1] }}</span>
      </span>
    </button>
    <p class="mc__cause" aria-live="polite">
      <span class="mc__count">{{ count }}</span>
      <span class="mk-truncate">{{ causes[0] }}</span>
    </p>
    <p class="mc__hint">{{ hint }}</p>
  </div>
</template>

<style scoped>
.mc {
  gap: 6px;
}

.mc__lamp {
  display: grid;
  flex: 1 1 auto;
  min-height: 0;
  place-items: center;
  border: 1px solid var(--r-border-strong);
  background: var(--r-bg-muted);
  color: var(--r-text-tertiary);
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  transition: background-color var(--r-duration-instant) var(--r-ease-out);
}

.mc__lamp:active .mc__legend {
  transform: translateY(1px);
}

.mc__legend {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-bold);
  line-height: 1.25;
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

/* Lit: the lamp face in the tone colour, the legend in the colour that reads on it. */
.mc__lamp.is-steady,
.mc__lamp.is-flash {
  border-color: var(--tone-solid);
  background: var(--tone-solid);
  color: var(--tone-on-solid);
}

/* New: two steps, lit and dim, like the real lamp. Never a soft pulse. */
.mc__lamp.is-flash {
  animation: mc-flash 1s linear infinite;
}

@keyframes mc-flash {
  0%,
  49% {
    background: var(--tone-solid);
    color: var(--tone-on-solid);
  }
  50%,
  100% {
    background: color-mix(in srgb, var(--tone-solid) 22%, var(--r-bg-surface));
    color: var(--tone-text);
  }
}

.mc__cause {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
  color: var(--r-text);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.mc__count {
  flex: none;
  color: var(--r-text-tertiary);
}

.mc__hint {
  overflow: hidden;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-2xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .mc__lamp.is-flash {
    animation: none;
  }
}
</style>
