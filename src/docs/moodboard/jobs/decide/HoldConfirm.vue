<script setup lang="ts">
/**
 * The model prepared it; a person releases it. Press and hold is the signature: long enough to be
 * deliberate, short enough not to be a chore. After it lands there is a short undo window.
 */
import { computed, nextTick, ref, watch } from 'vue'
import { RButton, RStatus } from '@/design-system'
import { timeZ, usePressHold, useTick } from '../../kit'

interface Line {
  label: string
  value: string
  mono?: boolean
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    title: string
    /** The figure that is being committed: "Rp 4.812.500.000". */
    figure?: string
    lines?: Line[]
    /** Who or what prepared it: "Prepared by Simpul from the October roster". */
    prepared?: string
    action?: string
    done?: string
    tone?: 'brand' | 'danger' | 'signal' | 'neutral'
    holdMs?: number
    /** Seconds the undo stays open. */
    undoFor?: number
  }>(),
  { lines: () => [], action: 'Hold to confirm', done: 'Confirmed', tone: 'brand', holdMs: 1200, undoFor: 10 },
)

const state = ref<'ready' | 'done'>('ready')
const at = ref<Date | null>(null)
const left = ref(0)
const holdEl = ref<HTMLButtonElement | null>(null)
const receiptEl = ref<HTMLElement | null>(null)

const { progress, holding, handlers, reset } = usePressHold(props.holdMs, () => {
  // The hold button is about to be replaced: if it had the focus, hand it to Undo.
  const hadFocus = document.activeElement === holdEl.value
  state.value = 'done'
  at.value = new Date()
  left.value = props.undoFor
  if (hadFocus) nextTick(() => receiptEl.value?.querySelector('button')?.focus())
})

/* The undo window counts down on the board's shared clock (it pauses off screen). */
const tick = useTick(1000)
watch(tick, () => {
  if (state.value !== 'done' || left.value <= 0) return
  const undoHadFocus = !!receiptEl.value?.contains(document.activeElement)
  left.value--
  if (left.value === 0 && undoHadFocus) nextTick(() => receiptEl.value?.focus())
})

function undo() {
  state.value = 'ready'
  at.value = null
  left.value = 0
  reset()
  nextTick(() => holdEl.value?.focus())
}

const label = computed(() => (holding.value ? 'Keep holding' : props.action))
</script>

<template>
  <div class="mk hold">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <RStatus v-if="state === 'done'" tone="success" :label="done" size="sm" />
      <RStatus v-else tone="warning" label="Needs you" size="sm" />
    </div>
    <p class="hold__title">{{ title }}</p>
    <p v-if="figure" class="hold__figure mk-fig">{{ figure }}</p>
    <dl v-if="lines.length" class="hold__lines">
      <div v-for="line in lines" :key="line.label" class="hold__line">
        <dt>{{ line.label }}</dt>
        <dd :class="{ 'r-mono': line.mono }">{{ line.value }}</dd>
      </div>
    </dl>
    <p v-if="prepared" class="hold__prepared">{{ prepared }}</p>

    <div class="hold__foot mk-end">
      <button
        v-if="state === 'ready'"
        ref="holdEl"
        type="button"
        class="hold__button"
        :class="[`r-tone-${tone}`, { 'is-holding': holding }]"
        :style="{ '--progress': progress }"
        :aria-label="`${action}: press and hold`"
        v-bind="handlers"
      >
        <span class="hold__label">{{ label }}</span>
      </button>
      <div v-else ref="receiptEl" class="hold__receipt" tabindex="-1">
        <span class="hold__when r-mono">{{ at ? timeZ(at, 'WIB', true) : '' }}</span>
        <RButton v-if="left > 0" size="sm" variant="ghost" @click="undo">Undo · {{ left }} s</RButton>
        <span v-else class="r-label">Final</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hold {
  gap: 6px;
}

.hold__title {
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.3;
}

.hold__figure {
  overflow: hidden;
  font-size: var(--r-text-2xl);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hold__lines {
  display: grid;
  margin: 2px 0 0;
  border-top: 1px solid var(--r-border-subtle);
}

.hold__line {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 5px 0;
  border-bottom: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-xs);
}

.hold__line dt {
  color: var(--r-text-tertiary);
}

.hold__line dd {
  margin: 0;
  overflow: hidden;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hold__prepared {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.hold__foot {
  padding-top: 6px;
}

.hold__button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: var(--r-control-lg);
  overflow: hidden;
  border: 0;
  border-radius: var(--r-radius-control);
  background: var(--tone-solid);
  color: var(--tone-on-solid);
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-medium);
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

/* The hold fills from the leading edge, a lighter band over the solid. */
.hold__button::before {
  content: '';
  position: absolute;
  inset: 0;
  background: color-mix(in srgb, var(--tone-on-solid) 24%, transparent);
  transform: scaleX(var(--progress));
  transform-origin: left center;
}

.hold__button:hover {
  background: var(--tone-solid-hover);
}

.hold__label {
  position: relative;
}

.hold__receipt {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  height: var(--r-control-lg);
  padding: 0 0 0 12px;
  border: 1px solid var(--r-border);
  background: var(--r-bg-muted);
}

.hold__when {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}
</style>
