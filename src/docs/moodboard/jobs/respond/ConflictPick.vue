<script setup lang="ts">
/**
 * Two bookings on the same slot. The strip shows how much they overlap; the two cards are the
 * choice, and what happens to the other one is said before the press. Keep resolves it; Undo puts
 * both back.
 */
import { computed, ref } from 'vue'
import { RButton, RStatus } from '@/design-system'
import { pad } from '../../kit'
import { stamp, useFocusKeeper } from './shared'

interface Booking {
  id: string
  title: string
  /** Who or what: "Dewi Anggraini · 6 people". */
  who: string
  /** Minutes from midnight. */
  from: number
  to: number
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    /** The two bookings; the first is preselected. */
    options: [Booking, Booking]
    /** What happens to the one not kept: "Decline it with a note", "Move it to Door 6". */
    other: string
    /** What happened to the one not kept, after its title: "declined with a note". */
    after: string
    zone?: string
    /** `panel` 2x2 · `wide` 3x2 or 3x1. */
    layout?: 'panel' | 'wide'
  }>(),
  { zone: 'WIB', layout: 'panel' },
)

const chosen = ref(props.options[0].id)
const kept = ref<{ title: string; dropped: string; at: string } | null>(null)
const { bind, keep } = useFocusKeeper()

const hm = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`
const from = Math.min(props.options[0].from, props.options[1].from)
const to = Math.max(props.options[0].to, props.options[1].to)
const lo = Math.floor((from - 30) / 60) * 60
const hi = Math.ceil((to + 30) / 60) * 60
const x = (m: number) => ((m - lo) / (hi - lo)) * 100
const overlap = {
  from: Math.max(props.options[0].from, props.options[1].from),
  to: Math.min(props.options[0].to, props.options[1].to),
}
const ticks = Array.from({ length: (hi - lo) / 60 + 1 }, (_, i) => lo + i * 60)

const current = computed(() => props.options.find((o) => o.id === chosen.value) ?? props.options[0])
const dropped = computed(() => props.options.find((o) => o.id !== chosen.value) ?? props.options[1])

function choose(id: string) {
  if (!kept.value) chosen.value = id
}

function onKey(event: KeyboardEvent) {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key) || kept.value) return
  event.preventDefault()
  const next = props.options.find((o) => o.id !== chosen.value)!
  chosen.value = next.id
  ;(event.currentTarget as HTMLElement).querySelector<HTMLElement>(`[data-id="${next.id}"]`)?.focus()
}

function keepIt() {
  keep('[data-focus="undo"]')
  kept.value = { title: current.value.title, dropped: dropped.value.title, at: stamp() }
}

function undo() {
  keep('[data-focus="keep"]')
  kept.value = null
}
</script>

<template>
  <div :ref="bind" class="mk clash" :class="`clash--${layout}`">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <RStatus :tone="kept ? 'success' : 'warning'" :label="kept ? 'Resolved' : 'Double-booked'" size="sm" class="clash__status" />
    </div>

    <div class="clash__strip" aria-hidden="true">
      <span class="clash__overlap" :style="{ left: `${x(overlap.from)}%`, width: `${x(overlap.to) - x(overlap.from)}%` }">
        <span>Overlap {{ overlap.to - overlap.from }} min</span>
      </span>
      <span
        v-for="(o, i) in options"
        :key="o.id"
        class="clash__bar"
        :class="{ 'is-chosen': o.id === chosen, 'is-dropped': kept && o.id !== chosen }"
        :style="{ left: `${x(o.from)}%`, width: `${x(o.to) - x(o.from)}%`, top: `calc(${20 + i * 22}px + ${i} * var(--gap, 0px))` }"
      />
      <span
        v-for="(t, i) in ticks"
        :key="t"
        class="clash__tick"
        :class="{ 'is-first': i === 0, 'is-last': i === ticks.length - 1 }"
        :style="{ left: `${x(t)}%` }"
      >
        {{ hm(t) }}
      </span>
    </div>

    <div class="clash__options" role="radiogroup" :aria-label="`${eyebrow}: keep which booking`" @keydown="onKey">
      <div
        v-for="o in options"
        :key="o.id"
        role="radio"
        class="clash__option"
        :class="{ 'is-chosen': o.id === chosen, 'is-dropped': kept && o.id !== chosen }"
        :data-id="o.id"
        :aria-checked="o.id === chosen"
        :aria-disabled="kept ? 'true' : undefined"
        :tabindex="o.id === chosen ? 0 : -1"
        @click="choose(o.id)"
      >
        <span class="clash__time">{{ hm(o.from) }}–{{ hm(o.to) }} {{ zone }}</span>
        <span class="clash__title">{{ o.title }}</span>
        <span class="clash__who mk-truncate">{{ o.who }}</span>
      </div>
    </div>

    <div class="clash__foot mk-end">
      <template v-if="!kept">
        <RButton size="sm" tone="brand" data-focus="keep" @click="keepIt">Keep this one</RButton>
        <span class="clash__other mk-truncate">{{ other }}</span>
      </template>
      <template v-else>
        <p class="clash__done" aria-live="polite">Kept {{ kept.title }}. {{ kept.dropped }} {{ after }} · {{ kept.at }}</p>
        <RButton size="sm" variant="ghost" data-focus="undo" @click="undo">Undo</RButton>
      </template>
    </div>
  </div>
</template>

<style scoped>
.clash {
  gap: 8px;
}

.clash__status {
  flex: none;
}

/* The strip: an hour axis with the two bookings as square bars and the overlap marked. */
.clash__strip {
  position: relative;
  flex: none;
  height: 68px;
  border-bottom: 1px solid var(--r-chart-axis);
}

.clash--wide .clash__strip {
  --gap: 10px;
  height: 96px;
}

.clash--wide .clash__bar {
  height: 22px;
}

/* The overlap band starts under its own label, so no rule ever crosses the words. */
.clash__overlap {
  position: absolute;
  top: 16px;
  bottom: 0;
  background: color-mix(in srgb, var(--r-status-warning) 16%, transparent);
  border-right: 1px solid var(--r-status-warning);
  border-left: 1px solid var(--r-status-warning);
}

.clash__overlap span {
  position: absolute;
  top: -16px;
  left: 0;
  color: var(--r-warning-text);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
}

.clash__bar {
  position: absolute;
  height: 16px;
  background: var(--r-chart-context);
  transition: background-color var(--r-duration-fast) var(--r-ease-out);
}

.clash__bar.is-chosen {
  background: var(--r-brand);
}

.clash__bar.is-dropped {
  background: transparent;
  outline: 1px dashed var(--r-chart-context);
  outline-offset: -1px;
}

.clash__tick {
  position: absolute;
  bottom: -16px;
  color: var(--r-chart-label);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  transform: translateX(-50%);
}

.clash__tick.is-first {
  transform: none;
}

.clash__tick.is-last {
  transform: translateX(-100%);
}

.clash__options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 16px;
}

.clash__option {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  padding: 8px 10px;
  border: 1px solid var(--r-border);
  cursor: pointer;
  transition:
    background-color var(--r-duration-fast) var(--r-ease-out),
    border-color var(--r-duration-fast) var(--r-ease-out);
}

.clash__option:hover {
  border-color: var(--r-border-strong);
}

.clash__option.is-chosen {
  border-color: var(--r-brand);
  background: var(--r-bg-selected);
}

/* The selected card carries the 2px cobalt rule on its leading edge, as a selected row does. */
.clash__option.is-chosen::before {
  position: absolute;
  top: -1px;
  bottom: -1px;
  left: -1px;
  width: 2px;
  background: var(--r-brand);
  content: '';
}

.clash__option.is-dropped {
  border-style: dashed;
  background: transparent;
  color: var(--r-text-tertiary);
}

.clash__option.is-dropped .clash__title {
  text-decoration: line-through;
}

.clash__time {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  font-variant-numeric: tabular-nums;
}

.clash__title {
  display: -webkit-box;
  overflow: hidden;
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-semibold);
  line-height: 1.35;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.clash__who {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

.clash__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.clash__other {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.clash__done {
  min-width: 0;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}
</style>
