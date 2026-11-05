<script setup lang="ts">
/**
 * One urgent banner across the top of a screen: what broke, how long it has been open, and the
 * one action. Acknowledging quiets it without hiding it: the solid block turns to an outline and
 * the lamp stops blinking, because the condition is still there. Undo raises it again.
 */
import { ref } from 'vue'
import { RAlert, RButton } from '@/design-system'
import { hms, stamp, useElapsed, useFocusKeeper } from './shared'

const props = withDefaults(
  defineProps<{
    /** `danger` something broke · `warning` something drifts · `signal` something is live now. */
    tone?: 'danger' | 'warning' | 'signal'
    /** Mono caps over the title: "Settlement · Bank Sagara". */
    eyebrow: string
    title: string
    body?: string
    /** The one action: "Acknowledge", "Join bridge". */
    action?: string
    /** What the banner says once a person acted: "Acknowledged", "Joined". */
    done?: string
    /** Seconds the alarm has been open when the tile appears. */
    open?: number
    /** Quiet mono facts under the banner: "Paged 2", "Runbook RB-114". */
    facts?: string[]
  }>(),
  { tone: 'danger', action: 'Acknowledge', done: 'Acknowledged', open: 0, facts: () => [] },
)

const at = ref<string | null>(null)
const { value: openFor } = useElapsed(props.open)
const { bind, keep } = useFocusKeeper()

function act() {
  keep('[data-focus="undo"]')
  at.value = stamp(true)
}

function undo() {
  keep('[data-focus="act"]')
  at.value = null
}
</script>

<template>
  <div :ref="bind" class="mk alarm">
    <RAlert :tone="tone" :variant="at ? 'outline' : 'solid'" class="alarm__banner" :class="{ 'is-quiet': at }">
      <p class="alarm__head">
        <span class="alarm__lamp" :class="{ 'is-live': !at }" aria-hidden="true" />
        <span class="mk-truncate">{{ eyebrow }}</span>
        <span class="alarm__open">Open {{ hms(openFor) }}</span>
      </p>
      <p class="alarm__title">{{ title }}</p>
      <p v-if="body" class="alarm__body">{{ body }}</p>
      <template #actions>
        <RButton v-if="!at" size="sm" data-focus="act" @click="act">{{ action }}</RButton>
        <span v-else class="alarm__done">
          <span class="alarm__stamp">{{ done }} {{ at }}</span>
          <RButton size="sm" variant="ghost" data-focus="undo" @click="undo">Undo</RButton>
        </span>
      </template>
    </RAlert>
    <p v-if="facts.length" class="alarm__facts mk-end">
      <span v-for="fact in facts" :key="fact" class="r-label">{{ fact }}</span>
    </p>
  </div>
</template>

<style scoped>
.alarm {
  gap: 6px;
}

.alarm__banner {
  flex: none;
  padding-top: 9px;
  padding-bottom: 9px;
}

.alarm__head {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-medium);
  line-height: 16px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.alarm__lamp {
  flex: none;
  width: 6px;
  height: 6px;
  border-radius: var(--r-radius-round);
  background: currentColor;
}

/* Once acknowledged the lamp burns steady in the tone's own lamp colour. */
.is-quiet .alarm__lamp {
  background: var(--tone-lamp);
}

.alarm__lamp.is-live {
  animation: r-blink 1.2s linear infinite;
}

.alarm__open {
  flex: none;
  margin-left: auto;
  font-variant-numeric: tabular-nums;
}

.alarm__title {
  margin-top: 2px;
  color: var(--r-text);
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  line-height: 20px;
  letter-spacing: var(--r-tracking-snug);
}

.alarm__body {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

.alarm__done {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.alarm__stamp {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
}

.alarm__facts {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  overflow: hidden;
}

@media (prefers-reduced-motion: reduce) {
  .alarm__lamp.is-live {
    animation: none;
  }
}
</style>
