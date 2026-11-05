<script setup lang="ts">
/**
 * Who answers: the person on call now, and who comes next. Step through the rota with the keys
 * or the arrows; the lamp says which slot is now, so "who do I call" never needs a calendar.
 */
import { computed, ref } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { RAvatar, RIconButton, RSegmented, RStatus } from '@/design-system'

interface Slot {
  /** Short name for the slot: "Now", "Next", "Tonight". */
  label: string
  name: string
  role?: string
  from: string
  to: string
  backup?: string
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    team: string
    /** Where to reach the rota: "#platform-oncall", "Radio · Ch 4". */
    channel?: string
    slots: Slot[]
    /** The slot that is on now. */
    now?: number
    /** What the lamp calls the slot that is on now. */
    nowLabel?: string
    /** `card` 2x2 · `row` 2x1. */
    layout?: 'card' | 'row'
  }>(),
  { now: 0, nowLabel: 'On call now', layout: 'card' },
)

const index = ref(props.now)
const slot = computed(() => props.slots[index.value])
const isNow = computed(() => index.value === props.now)
const options = computed(() => props.slots.map((s, i) => ({ label: s.label, value: i })))
const pick = computed({
  get: () => index.value,
  set: (v: string | number | undefined) => (index.value = Number(v ?? 0)),
})

function step(by: number) {
  const n = props.slots.length
  index.value = (index.value + by + n) % n
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowRight') step(1)
  else if (event.key === 'ArrowLeft') step(-1)
  else return
  event.preventDefault()
}
</script>

<template>
  <div v-if="layout === 'card'" class="mk rota rota--card">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span v-if="channel" class="r-label mk-truncate">{{ channel }}</span>
    </div>
    <div class="rota__team">
      <RAvatar :name="team" size="sm" decorative />
      <span class="rota__team-name mk-truncate">{{ team }}</span>
    </div>
    <RSegmented v-model="pick" :options="options" size="sm" block :label="`${team} rota`" />
    <div class="rota__who" aria-live="polite">
      <RAvatar :name="slot.name" size="xl" decorative />
      <div class="rota__who-text">
        <p class="rota__name mk-truncate">{{ slot.name }}</p>
        <p v-if="slot.role" class="rota__role mk-truncate">{{ slot.role }}</p>
        <RStatus v-if="isNow" tone="signal" :label="nowLabel" size="sm" />
        <RStatus v-else tone="neutral" :label="index > now ? 'Scheduled' : 'Finished'" size="sm" />
      </div>
    </div>
    <dl class="rota__lines mk-end">
      <div class="rota__line"><dt class="r-label">From</dt><dd class="r-mono">{{ slot.from }}</dd></div>
      <div class="rota__line"><dt class="r-label">To</dt><dd class="r-mono">{{ slot.to }}</dd></div>
      <div v-if="slot.backup" class="rota__line"><dt class="r-label">Backup</dt><dd>{{ slot.backup }}</dd></div>
    </dl>
  </div>

  <div v-else class="mk rota rota--row" @keydown="onKeydown">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <div class="rota__pager" role="group" :aria-label="`${team} rota`">
        <RIconButton size="xs" variant="ghost" label="Previous slot" @click="step(-1)"><ChevronLeft /></RIconButton>
        <span class="rota__count r-mono" aria-hidden="true">{{ index + 1 }}/{{ slots.length }}</span>
        <RIconButton size="xs" variant="ghost" label="Next slot" @click="step(1)"><ChevronRight /></RIconButton>
      </div>
    </div>
    <div class="rota__who rota__who--row" aria-live="polite">
      <RAvatar :name="slot.name" size="lg" decorative />
      <div class="rota__who-text">
        <div class="mk-row mk-between">
          <p class="rota__name mk-truncate">{{ slot.name }}</p>
          <RStatus v-if="isNow" tone="signal" :label="nowLabel" size="sm" />
          <span v-else class="r-label">{{ slot.label }}</span>
        </div>
        <p class="rota__role mk-truncate">{{ slot.role }}</p>
      </div>
    </div>
    <p class="rota__when mk-end">
      <span class="r-mono">{{ slot.from }} – {{ slot.to }}</span>
      <span v-if="slot.backup" class="rota__backup mk-truncate">Backup {{ slot.backup }}</span>
    </p>
  </div>
</template>

<style scoped>
.rota__team {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.rota__team-name {
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
}

.rota__who {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding-top: 4px;
}

.rota__who--row {
  padding-top: 0;
}

.rota__who-text {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  min-width: 0;
}

.rota__who-text > .mk-row {
  width: 100%;
}

.rota__name {
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
}

.rota__role {
  margin-bottom: 4px;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

.rota__lines {
  display: grid;
  border-top: 1px solid var(--r-border-subtle);
}

.rota__line {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr);
  align-items: center;
  min-height: 28px;
  border-bottom: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-xs);
}

.rota__line dd {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rota__pager {
  display: flex;
  align-items: center;
  gap: 2px;
  margin: -4px -6px -4px 0;
}

.rota__count {
  min-width: 26px;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-3xs);
  text-align: center;
}

.rota__when {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  padding-top: 6px;
  border-top: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-xs);
}

.rota__when .r-mono {
  flex: none;
}

.rota__backup {
  color: var(--r-text-tertiary);
}
</style>
