<script setup lang="ts">
/**
 * A pass worn on a lanyard: the front says who, for whom they work and until when; the back says
 * where it opens. Turn it over with the Front and Back keys or the arrow keys, as a guard turns
 * the real one.
 */
import { computed, ref } from 'vue'
import { RLogo, RSegmented, identityColors, initialsOf } from '@/design-system'
import { barsPath } from './shared'

interface Zone {
  name: string
  allowed: boolean
  /** Quiet condition: "escorted", "weekdays". */
  note?: string
}

const props = withDefaults(
  defineProps<{
    org: string
    /** The 21 Strive mark on the front, for 21 Strive's own passes. */
    strive?: boolean
    name: string
    role: string
    id: string
    /** The band across the front: what the pass is. */
    level: { label: string; tone: 'ink' | 'warning' }
    valid: string
    zones: Zone[]
    /** Lines on the back: "If found", "Emergency". */
    back?: { label: string; value: string }[]
    seed: string
    /** `portrait` 1x2 · `tall` 1x3 · `landscape` 2x2. */
    layout?: 'portrait' | 'tall' | 'landscape'
  }>(),
  { back: () => [], layout: 'portrait' },
)

const side = ref<'front' | 'back'>('front')
const pick = computed({
  get: () => side.value,
  set: (v: string | number | undefined) => (side.value = v === 'back' ? 'back' : 'front'),
})
const options = [
  { label: 'Front', value: 'front' },
  { label: 'Back', value: 'back' },
]
const photo = computed(() => identityColors(props.name))
const bars = computed(() => barsPath(props.seed, 70, 18))
</script>

<template>
  <div class="mk badge" :class="`badge--${layout}`">
    <div class="badge__card">
      <span v-if="layout === 'tall'" class="badge__slot" aria-hidden="true" />
      <div v-if="side === 'front'" key="front" class="badge__face badge__face--front">
        <div class="badge__org">
          <RLogo v-if="strive" brand="21strive" variant="mark" :size="10" label="" />
          <span class="mk-truncate">{{ org }}</span>
        </div>
        <div class="badge__id-block">
          <span class="badge__photo" :style="photo" role="img" :aria-label="`Photo of ${name}`">{{ initialsOf(name) }}</span>
          <div class="badge__who">
            <p class="badge__name">{{ name }}</p>
            <p class="badge__role">{{ role }}</p>
            <p class="badge__number r-mono">{{ id }}</p>
          </div>
        </div>
        <svg v-if="layout !== 'portrait'" class="badge__bars badge__bars--front" viewBox="0 0 70 18" preserveAspectRatio="none" shape-rendering="crispEdges" aria-hidden="true">
          <path :d="bars" />
        </svg>
        <p class="badge__level" :class="`badge__level--${level.tone}`">{{ level.label }}</p>
        <p class="badge__valid r-label">Valid {{ valid }}</p>
      </div>
      <div v-else key="back" class="badge__face badge__face--back">
        <span class="r-eyebrow">Opens</span>
        <ul class="badge__zones">
          <li v-for="z in zones" :key="z.name" class="badge__zone">
            <span class="badge__lamp" :class="{ 'is-on': z.allowed }" aria-hidden="true" />
            <span class="badge__zone-name mk-truncate">{{ z.name }}</span>
            <span class="badge__zone-word">{{ z.allowed ? (z.note ?? 'Yes') : 'No' }}</span>
          </li>
        </ul>
        <dl class="badge__back">
          <div v-for="b in back" :key="b.label"><dt class="r-label">{{ b.label }}</dt><dd>{{ b.value }}</dd></div>
        </dl>
        <svg class="badge__bars" viewBox="0 0 70 18" preserveAspectRatio="none" shape-rendering="crispEdges" aria-hidden="true">
          <path :d="bars" />
        </svg>
      </div>
    </div>
    <RSegmented v-model="pick" :options="options" size="sm" block :label="`${name}'s pass, side`" />
  </div>
</template>

<style scoped>
.badge {
  gap: 8px;
}

.badge__card {
  position: relative;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--r-border-strong);
  background: var(--r-bg-surface);
}

/* The lanyard slot of a tall pass. */
.badge__slot {
  flex: none;
  width: 36px;
  height: 6px;
  margin: 10px auto 0;
  border: 1px solid var(--r-border-strong);
}

.badge__face {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  padding: 10px;
}

.badge__org {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.badge__id-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.badge--landscape .badge__id-block {
  flex-direction: row;
  gap: 14px;
}

/* No photographs on the board: the photo is the identity colour and the initials. */
.badge__photo {
  display: grid;
  flex: none;
  place-items: center;
  width: 64px;
  height: 76px;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xl);
  font-weight: var(--r-weight-semibold);
}

.badge--tall .badge__photo {
  width: 80px;
  height: 96px;
  margin-top: 6px;
}

.badge__who {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.badge__name {
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.25;
}

.badge--tall .badge__name {
  font-size: var(--r-text-lg);
}

.badge__role {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.35;
}

.badge__number {
  margin-top: 4px;
  font-size: var(--r-text-xs);
  letter-spacing: 0.06em;
}

/* The band across the front: ink for staff, amber with its word for visitors. */
.badge__level {
  margin: auto -10px 0;
  padding: 5px 10px;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.badge__level--ink {
  background: var(--r-ink);
  color: var(--r-on-ink);
}

.badge__level--warning {
  background: var(--r-warning);
  color: var(--r-on-warning);
}

.badge__valid {
  margin-top: -2px;
}

.badge__zones {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--r-border-subtle);
}

.badge__zone {
  display: grid;
  grid-template-columns: 6px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  min-height: 24px;
  border-bottom: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-xs);
}

.badge__lamp {
  width: 6px;
  height: 6px;
  border-radius: var(--r-radius-round);
  background: var(--r-status-off);
}

.badge__lamp.is-on {
  background: var(--r-status-good);
}

.badge__zone-word {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.badge__back {
  display: grid;
  gap: 4px;
  font-size: var(--r-text-xs);
}

.badge__back dd {
  margin: 0;
  color: var(--r-text-secondary);
}

.badge__bars {
  width: 100%;
  height: 18px;
  margin-top: auto;
  fill: var(--r-text);
}

.badge__bars--front {
  width: 60%;
  height: 26px;
}

.badge__bars--front + .badge__level {
  margin-top: 8px;
}

/* Turning the pass over: the new side fades in, nothing waits on the old one. */
.badge__face {
  animation: r-fade-in var(--r-duration-base) var(--r-ease-out);
}
</style>
