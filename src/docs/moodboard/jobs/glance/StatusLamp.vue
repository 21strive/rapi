<script setup lang="ts">
/**
 * One system, one lamp, one word, big enough to read across a room. Pressing the tile steps to
 * the next system of the group, so a small tile still covers the whole set; arrow keys step
 * both ways.
 */
import { computed, ref } from 'vue'
import { ChevronRight } from 'lucide-vue-next'
import { RStatus } from '@/design-system'
import type { StatusTone } from '@/design-system'
import { pad } from '../../kit'

interface System {
  name: string
  /** The status word, set in mono caps: "Nominal". */
  status: string
  tone: StatusTone
  /** Quiet line under the lamp: "since 13:48 WIB", "p95 412 ms". */
  meta?: string
  /** The name is an id (a service, a feeder, a host): set it in mono. */
  mono?: boolean
  /** Live right now (tracking, on air): the lamp blinks in two steps. */
  live?: boolean
}

const props = withDefaults(defineProps<{ group: string; systems: System[]; start?: number }>(), { start: 0 })

const at = ref(props.start)
const system = computed(() => props.systems[at.value] ?? props.systems[0])
const said = ref('')

function go(step: number) {
  const n = props.systems.length
  at.value = (at.value + step + n) % n
  said.value = `${system.value.name}, ${system.value.status}`
}

function onKeydown(event: KeyboardEvent) {
  const steps: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }
  if (!(event.key in steps)) return
  event.preventDefault()
  go(steps[event.key])
}
</script>

<template>
  <div class="mk mk--bleed lamp">
    <button type="button" class="lamp__face mk-reset" @click="go(1)" @keydown="onKeydown">
      <span class="mk-row mk-between">
        <span class="r-label mk-truncate">{{ group }}</span>
        <span class="r-index">{{ pad(at + 1) }}/{{ pad(systems.length) }}</span>
      </span>
      <span class="lamp__name mk-truncate" :class="{ 'is-mono': system.mono }">{{ system.name }}</span>
      <RStatus :tone="system.tone" :label="system.status" :pulse="system.live" />
      <span v-if="system.meta" class="lamp__meta mk-truncate">{{ system.meta }}</span>
      <span class="lamp__foot" aria-hidden="true">
        <span class="lamp__ticks">
          <span v-for="(s, i) in systems" :key="s.name" :class="{ 'is-on': i === at }" />
        </span>
        <span class="lamp__next">Next<ChevronRight :size="12" /></span>
      </span>
    </button>
    <p class="r-sr-only" aria-live="polite">{{ said }}</p>
  </div>
</template>

<style scoped>
.lamp__face {
  display: flex;
  flex-direction: column;
  gap: 6px;
  height: 100%;
  min-width: 0;
  padding: 4px 12px 12px;
  cursor: pointer;
  transition: background-color var(--r-duration-fast) var(--r-ease-out);
}

.lamp__face:hover {
  background: var(--r-bg-hover);
}

.lamp__face:focus-visible {
  outline-offset: -2px;
}

.lamp__name {
  margin-top: 4px;
  font-size: var(--r-text-xl);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-tight);
  line-height: 1.2;
}

.lamp__name.is-mono {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-medium);
  letter-spacing: 0;
}

.lamp__meta {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.lamp__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: auto;
}

.lamp__ticks {
  display: flex;
  gap: 2px;
}

.lamp__ticks span {
  width: 8px;
  height: 2px;
  background: var(--r-border-strong);
  transition: background-color var(--r-duration-fast) var(--r-ease-out);
}

.lamp__ticks span.is-on {
  background: var(--r-text);
}

.lamp__next {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  transition: color var(--r-duration-fast) var(--r-ease-out);
}

.lamp__face:hover .lamp__next,
.lamp__face:focus-visible .lamp__next {
  color: var(--r-text);
}
</style>
