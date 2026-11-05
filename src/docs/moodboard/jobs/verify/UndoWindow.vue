<script setup lang="ts">
/**
 * Something just happened, and for a few seconds it can be taken back. The bar drains one segment
 * at a time on the board's clock (so it waits while the tile is off screen); Undo puts things
 * back and the line underneath says what is true now.
 */
import { computed, ref } from 'vue'
import { RButton, RStatus } from '@/design-system'
import { stamp, useCountdown } from './shared'

const props = withDefaults(
  defineProps<{
    eyebrow: string
    /** What just happened: "Moved 14 emails to Archive". */
    did: string
    /** What is true after Undo: "14 emails are back in the inbox". */
    undone: string
    /** What is true once the window closes. */
    kept?: string
    seconds?: number
    undoLabel?: string
    /** When it happened, as printed at first: "14:02 WIB". */
    at?: string
    /** 1x1: the figure is the seconds left. */
    compact?: boolean
  }>(),
  { seconds: 10, undoLabel: 'Undo', kept: 'Done. The undo window has closed.', at: '' },
)

type State = 'open' | 'kept' | 'undone'
const state = ref<State>('open')
const when = ref(props.at)
const undoneAt = ref('')

const { left, start, stop } = useCountdown(props.seconds, () => {
  if (state.value === 'open') state.value = 'kept'
})
start()

function undo() {
  stop()
  state.value = 'undone'
  undoneAt.value = stamp('WIB', false)
}

function again() {
  state.value = 'open'
  when.value = stamp('WIB', false)
  start()
}

const segments = computed(() => Math.min(props.seconds, props.compact ? 10 : 20))
const lit = computed(() => Math.ceil((left.value / props.seconds) * segments.value))
const result = computed(() => (state.value === 'undone' ? props.undone : props.kept))
</script>

<template>
  <div class="mk undo" :class="{ 'undo--compact': compact, [`is-${state}`]: true }">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span v-if="when && !compact" class="undo__at">{{ when }}</span>
    </div>

    <p class="undo__did">{{ did }}</p>

    <div v-if="state === 'open'" class="undo__bar" aria-hidden="true">
      <span v-for="i in segments" :key="i" :class="{ 'is-on': i <= lit }" />
    </div>
    <p v-else class="undo__result" aria-live="polite">{{ result }}</p>

    <!-- One button whose word follows the state, so focus stays on it after a press. -->
    <div class="mk-row mk-between mk-end">
      <p v-if="state === 'open'" class="undo__left">
        <span class="undo__secs">{{ left }}</span><span class="mk-unit">s</span>
        <span v-if="!compact" class="undo__left-word">to undo</span>
      </p>
      <RStatus
        v-else
        :tone="state === 'undone' ? 'neutral' : 'success'"
        :label="state === 'undone' ? (compact ? 'Undone' : `Undone ${undoneAt}`) : 'Kept'"
        size="sm"
      />
      <RButton :size="compact ? 'xs' : 'sm'" :variant="state === 'open' ? 'outline' : 'ghost'" @click="state === 'open' ? undo() : again()">
        {{ state === 'open' ? undoLabel : state === 'undone' ? 'Redo' : 'Run again' }}
      </RButton>
    </div>
  </div>
</template>

<style scoped>
.undo {
  gap: 8px;
}

.undo__at {
  flex: none;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
}

.undo__did {
  display: -webkit-box;
  overflow: hidden;
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: var(--r-leading-snug);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.is-undone .undo__did {
  color: var(--r-text-tertiary);
  text-decoration: line-through;
}

/* The window as LED segments: lit ones are what is left. */
.undo__bar {
  display: flex;
  gap: 2px;
  height: 8px;
}

.undo__bar span {
  flex: 1;
  background: var(--r-bg-track);
  transition: background-color var(--r-duration-fast) var(--r-ease-out);
}

.undo__bar span.is-on {
  background: var(--r-text-secondary);
}

.undo__left {
  display: flex;
  align-items: baseline;
  gap: 3px;
  min-width: 0;
}

.undo__secs {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-medium);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.undo__left-word {
  margin-left: 4px;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.undo__result {
  display: -webkit-box;
  overflow: hidden;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: var(--r-leading-snug);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.undo--compact .undo__did {
  font-size: var(--r-text-sm);
}

.undo--compact .undo__result {
  -webkit-line-clamp: 1;
}

.undo--compact .undo__secs {
  font-size: var(--r-text-xl);
}
</style>
