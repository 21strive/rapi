<script setup lang="ts">
/**
 * A covered switch, as on a launch console or a flight deck: lift the guard, then flip. Two
 * separate moves, so nobody arms anything by brushing past it. The guard drops back by itself if
 * nothing is flipped, and closing it over an armed switch puts the switch back to safe.
 */
import { computed, nextTick, ref, useId, watch } from 'vue'
import { ChevronDown, ChevronUp } from 'lucide-vue-next'
import { RStatus, type StatusTone } from '@/design-system'
import { timeZ, useTick, type Zone } from '../../kit'

interface Readout {
  label: string
  value: string
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    /** What the switch does, its accessible name: "Master arm". */
    label: string
    /** The two positions, printed beside the switch. */
    onWord?: string
    offWord?: string
    /** The lamp word while it is on: "Armed". */
    onState?: string
    readouts?: Readout[]
    /** Seconds the guard stays up with nothing flipped. */
    closeAfter?: number
    zone?: Zone
  }>(),
  { onWord: 'Arm', offWord: 'Safe', onState: 'Armed', readouts: () => [], closeAfter: 8, zone: 'WIB' },
)

const id = useId()
const root = ref<HTMLElement | null>(null)
const guardBtn = ref<HTMLButtonElement | null>(null)
const open = ref(false)
const on = ref(false)
const left = ref(0)
const at = ref<Date | null>(null)

const tick = useTick(1000)
watch(tick, () => {
  if (!open.value || on.value || left.value <= 0) return
  left.value--
  if (left.value === 0) closeGuard()
})

function toggleGuard() {
  if (open.value) closeGuard()
  else {
    open.value = true
    left.value = props.closeAfter
  }
}

function closeGuard() {
  const hadFocus = !!root.value?.querySelector('.cov__switch')?.contains(document.activeElement)
  open.value = false
  on.value = false
  at.value = null
  if (hadFocus) nextTick(() => guardBtn.value?.focus())
}

function flip() {
  if (!open.value) return
  on.value = !on.value
  at.value = on.value ? new Date() : null
  left.value = on.value ? 0 : props.closeAfter
}

const status = computed<{ tone: StatusTone; label: string; pulse: boolean }>(() => {
  if (on.value) return { tone: 'signal', label: props.onState, pulse: true }
  if (open.value) return { tone: 'warning', label: 'Guard up', pulse: false }
  return { tone: 'neutral', label: props.offWord, pulse: false }
})
</script>

<template>
  <div ref="root" class="mk cov">
    <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>

    <dl v-if="readouts.length" class="cov__readouts">
      <div v-for="r in readouts" :key="r.label">
        <dt class="r-label">{{ r.label }}</dt>
        <dd class="r-mono">{{ r.value }}</dd>
      </div>
    </dl>

    <div class="cov__bay" :class="{ 'is-open': open }">
      <div :id="`${id}-sw`" class="cov__switch" :inert="!open">
        <span class="cov__words" aria-hidden="true">
          <span :class="{ 'is-lit': on }">{{ onWord }}</span>
          <span :class="{ 'is-lit': !on }">{{ offWord }}</span>
        </span>
        <button
          type="button"
          role="switch"
          class="cov__toggle mk-reset"
          :class="{ 'is-on': on }"
          :aria-checked="on ? 'true' : 'false'"
          :aria-label="label"
          @click="flip"
        >
          <span class="cov__paddle" />
        </button>
      </div>

      <button
        ref="guardBtn"
        type="button"
        class="cov__guard mk-reset"
        :aria-expanded="open ? 'true' : 'false'"
        :aria-controls="`${id}-sw`"
        :aria-label="open ? `Close the guard over ${label}` : `Lift the guard over ${label}`"
        @click="toggleGuard"
      >
        <span v-if="!open" class="cov__engraving">{{ label }}</span>
        <span class="cov__lift">
          <component :is="open ? ChevronDown : ChevronUp" :size="14" aria-hidden="true" />
          <span class="cov__guard-word">{{ open ? 'Close guard' : 'Lift guard' }}</span>
        </span>
        <span v-if="open && !on" class="cov__left r-mono">{{ left }} s</span>
      </button>
    </div>

    <p class="cov__foot">
      <RStatus :tone="status.tone" :label="status.label" :pulse="status.pulse" size="sm" />
      <span v-if="at" class="cov__at r-label">{{ timeZ(at, zone) }}</span>
    </p>
  </div>
</template>

<style scoped>
.cov {
  gap: 8px;
}

.cov__readouts {
  display: grid;
  gap: 2px;
  margin: 0;
}

.cov__readouts div {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.cov__readouts dd {
  margin: 0;
  font-size: var(--r-text-xs);
}

/* The bay: the switch sits in it, the guard covers all of it until lifted. */
.cov__bay {
  position: relative;
  flex: 1 1 auto;
  min-height: 64px;
  border: 1px solid var(--r-border-strong);
  background: var(--r-bg-muted);
}

.cov__switch {
  position: absolute;
  inset: 26px 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.cov__words {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 52px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.cov__words .is-lit {
  color: var(--r-text);
}

/* The toggle: a vertical slot with a square paddle; up is on. */
.cov__toggle {
  position: relative;
  width: 24px;
  height: 52px;
  border: 1px solid var(--r-border-strong);
  background: var(--r-bg-surface);
  cursor: pointer;
}

.cov__paddle {
  position: absolute;
  right: 3px;
  bottom: 3px;
  left: 3px;
  height: 20px;
  background: var(--r-ink);
  transition: bottom var(--r-duration-fast) var(--r-ease-out);
}

.cov__toggle.is-on .cov__paddle {
  bottom: calc(100% - 23px);
  background: var(--r-signal);
}

.cov__toggle:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: 2px;
}

/* The guard: a solid ink cover with its word; lifted, it folds into a bar along the top. */
.cov__guard {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: var(--r-ink);
  color: var(--r-on-ink);
  cursor: pointer;
  transition:
    bottom var(--r-duration-base) var(--r-ease-out),
    background-color var(--r-duration-fast) var(--r-ease-out);
}

.cov__guard:hover {
  background: var(--r-ink-hover);
}

.cov__bay.is-open .cov__guard {
  bottom: calc(100% - 22px);
  flex-direction: row;
  justify-content: flex-start;
  padding: 0 8px;
}

/* The function, engraved on the cover. */
.cov__engraving {
  max-width: calc(100% - 16px);
  overflow: hidden;
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cov__lift {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  opacity: 0.8;
}

.cov__guard-word {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.cov__left {
  margin-left: auto;
  font-size: var(--r-text-2xs);
}

.cov__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.cov__at {
  flex: none;
}
</style>
