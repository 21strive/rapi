<script setup lang="ts">
/**
 * Slide to confirm: a square thumb dragged the full length of a ruled track. A tap can't do it by
 * accident, and letting go early puts the thumb back. From the keyboard the thumb is a slider:
 * the arrows move it a quarter at a time, End takes it home.
 */
import { computed, ref } from 'vue'
import { ChevronsRight } from 'lucide-vue-next'
import { type StatusTone } from '@/design-system'
import { usePointerDrag, type Zone } from '../../kit'
import DecisionStrip from './DecisionStrip.vue'
import { holdFocus, useDecision } from './shared'

interface Readout {
  label: string
  value: string
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    title: string
    figure?: string
    /** Mono caps at the right of the eyebrow: "BI-FAST". */
    meta?: string
    sub?: string
    readouts?: Readout[]
    /** In the track: "Slide to send". */
    action: string
    done: string
    doneTone?: StatusTone
    tone?: 'brand' | 'neutral' | 'danger'
    zone?: Zone
    /** `row` puts the details left of the track, for 3x1 and 4x1 strips. */
    layout?: 'stack' | 'row'
  }>(),
  { figure: undefined, meta: undefined, sub: undefined, readouts: () => [], doneTone: 'success', tone: 'brand', zone: 'WIB', layout: 'stack' },
)

const root = ref<HTMLElement | null>(null)
const track = ref<HTMLElement | null>(null)
const p = ref(0)
const { at, left, decided, decide, undo } = useDecision<true>(10)

function commit() {
  const restore = holdFocus(root)
  decide(true)
  p.value = 0
  restore('[data-focus="undo"]')
}

let from = 0
let travel = 1
const { dragging, onPointerdown } = usePointerDrag({
  onStart: (event) => {
    ;(event.currentTarget as HTMLElement).focus()
    from = p.value
    const t = track.value?.getBoundingClientRect()
    travel = Math.max(1, (t?.width ?? 200) - 42)
  },
  onMove: ({ totalX }) => {
    p.value = Math.min(1, Math.max(0, from + totalX / travel))
  },
  onEnd: () => {
    if (p.value >= 0.97) commit()
    else p.value = 0
  },
})

function onKeydown(event: KeyboardEvent) {
  const step: Record<string, number> = { ArrowRight: 0.25, ArrowUp: 0.25, ArrowLeft: -0.25, ArrowDown: -0.25 }
  let next: number | undefined
  if (event.key in step) next = p.value + step[event.key]
  else if (event.key === 'End') next = 1
  else if (event.key === 'Home' || event.key === 'Escape') next = 0
  if (next === undefined) return
  event.preventDefault()
  p.value = Math.min(1, Math.max(0, next))
  if (p.value >= 1) commit()
}

function revert() {
  const restore = holdFocus(root)
  undo()
  restore('[data-focus="thumb"]')
}

const percent = computed(() => Math.round(p.value * 100))
</script>

<template>
  <div ref="root" class="mk slide">
    <div class="slide__grid" :class="`slide__grid--${layout}`">
      <div class="slide__info">
        <div class="mk-row mk-between">
          <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
          <span v-if="meta" class="r-label slide__meta">{{ meta }}</span>
        </div>
        <p class="slide__head">
          <span class="slide__title">{{ title }}</span>
          <span v-if="figure" class="slide__figure mk-fig">{{ figure }}</span>
        </p>
        <p v-if="sub" class="slide__sub mk-truncate">{{ sub }}</p>
        <dl v-if="readouts.length" class="slide__readouts">
          <div v-for="r in readouts" :key="r.label">
            <dt class="r-label">{{ r.label }}</dt>
            <dd class="r-mono">{{ r.value }}</dd>
          </div>
        </dl>
      </div>

      <div class="slide__control">
        <DecisionStrip v-if="decided" :at="at" :left="left" :zone="zone" :label="done" :tone="doneTone" size="lg" @undo="revert" />
        <div
          v-else
          ref="track"
          class="slide__track"
          :class="[`r-tone-${tone}`, { 'is-dragging': dragging }]"
          :style="{ '--p': p }"
        >
          <span class="slide__fill" aria-hidden="true" />
          <span class="slide__label" aria-hidden="true">{{ action }}</span>
          <span
            class="slide__thumb"
            role="slider"
            tabindex="0"
            data-focus="thumb"
            :aria-label="`${action}: ${title}${figure ? `, ${figure}` : ''}`"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-valuenow="percent"
            :aria-valuetext="`${percent}%`"
            @pointerdown="onPointerdown"
            @keydown="onKeydown"
          >
            <ChevronsRight :size="16" aria-hidden="true" />
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.slide {
  container-type: inline-size;
}

.slide__grid {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
}

.slide__info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.slide__meta {
  flex: none;
}

.slide__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
}

.slide__title {
  min-width: 0;
  overflow: hidden;
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.slide__figure {
  flex: none;
  font-size: var(--r-text-xl);
}

.slide__sub {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.slide__readouts {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  margin: 2px 0 0;
}

.slide__readouts div {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.slide__readouts dd {
  margin: 0;
  font-size: var(--r-text-xs);
}

.slide__control {
  margin-top: auto;
}

/* The track: a ruled channel; the fill trails the thumb in the tone's soft colour. */
.slide__track {
  --thumb: 40px;
  position: relative;
  height: var(--r-control-lg);
  border: 1px solid var(--r-border-strong);
  background: var(--r-bg-muted);
  user-select: none;
  -webkit-user-select: none;
}

.slide__fill {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: calc(var(--p) * (100% - var(--thumb)) + var(--thumb));
  background: var(--tone-soft);
}

.slide__label {
  position: absolute;
  inset: 0 0 0 var(--thumb);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 0 8px;
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
  white-space: nowrap;
  opacity: calc(1 - var(--p) * 1.6);
}

.slide__thumb {
  position: absolute;
  top: -1px;
  bottom: -1px;
  left: calc(var(--p) * (100% - var(--thumb)));
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--thumb);
  background: var(--tone-solid);
  color: var(--tone-on-solid);
  cursor: grab;
  touch-action: none;
}

.slide__thumb:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: 2px;
}

.slide__track:not(.is-dragging) .slide__thumb,
.slide__track:not(.is-dragging) .slide__fill {
  transition:
    left var(--r-duration-base) var(--r-ease-out),
    width var(--r-duration-base) var(--r-ease-out);
}

.slide__track.is-dragging .slide__thumb {
  cursor: grabbing;
}

/* Row: details on the left, the track on the right; stacks again when clamped to two columns. */
@container (min-width: 440px) {
  .slide__grid--row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
    align-items: stretch;
    column-gap: 20px;
  }
  .slide__grid--row .slide__control {
    align-self: end;
  }
}

@container (max-width: 200px) {
  .slide__label {
    font-size: var(--r-text-xs);
  }
  .slide__title {
    white-space: normal;
  }
}
</style>
