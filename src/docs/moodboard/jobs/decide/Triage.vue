<script setup lang="ts">
/**
 * Triage in one press. The item and the model's suggested level are on the tile; a person takes
 * the suggestion or overrides it, and the routing that follows is written out right away. The
 * number keys pick a level while the keys have focus.
 */
import { computed, ref } from 'vue'
import { RStatus, type StatusTone } from '@/design-system'
import type { Zone } from '../../kit'
import DecisionStrip from './DecisionStrip.vue'
import { holdFocus, useDecision } from './shared'

interface Level {
  id: string
  /** On the key: "P1", "Immediate". */
  label: string
  /** Under the key: "1 h". */
  sub?: string
  /** A lamp on the key for scales that are colours with words (red, yellow, green tags). */
  tone?: StatusTone
  /** What happens once it is filed: "Paged Platform on-call". */
  then: string
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    title: string
    detail?: string
    levels: Level[]
    suggested?: string
    zone?: Zone
    compact?: boolean
  }>(),
  { detail: undefined, suggested: undefined, zone: 'WIB' },
)

const root = ref<HTMLElement | null>(null)
const { choice, at, left, decide, undo } = useDecision<string>(10)
const picked = computed(() => props.levels.find((l) => l.id === choice.value))

function file(level: Level) {
  const restore = holdFocus(root)
  decide(level.id)
  restore('[data-focus="undo"]')
}

function revert() {
  const restore = holdFocus(root)
  undo()
  restore(`[data-level="${props.suggested ?? props.levels[0]?.id}"]`)
}

function onKeydown(event: KeyboardEvent) {
  const n = Number(event.key)
  if (!Number.isInteger(n) || n < 1 || n > props.levels.length) return
  event.preventDefault()
  file(props.levels[n - 1])
}
</script>

<template>
  <div ref="root" class="mk triage" :class="{ 'triage--compact': compact }">
    <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
    <p class="triage__title">{{ title }}</p>
    <p v-if="detail && !compact" class="triage__detail mk-truncate">{{ detail }}</p>

    <div class="triage__foot mk-end">
      <template v-if="picked">
        <p class="triage__then">
          <span v-if="compact" class="triage__filed">{{ picked.label }}</span>
          {{ picked.then }}
        </p>
        <DecisionStrip
          :at="at"
          :left="left"
          :zone="zone"
          :label="compact ? undefined : `Filed ${picked.label}`"
          :tone="picked.tone ?? 'neutral'"
          @undo="revert"
        />
      </template>
      <template v-else>
        <div
          class="triage__keys"
          role="group"
          :aria-label="`Priority for ${title}`"
          :style="{ gridTemplateColumns: `repeat(${levels.length}, minmax(0, 1fr))` }"
          @keydown="onKeydown"
        >
          <button
            v-for="(level, i) in levels"
            :key="level.id"
            type="button"
            class="triage__key mk-reset"
            :class="{ 'is-suggested': level.id === suggested }"
            :data-level="level.id"
            :aria-keyshortcuts="String(i + 1)"
            :aria-label="`${level.label}${level.sub ? `, ${level.sub}` : ''}${level.id === suggested ? ', suggested' : ''}`"
            @click="file(level)"
          >
            <span class="triage__label">
              <RStatus v-if="level.tone" :tone="level.tone" shape="square" size="sm" aria-hidden="true" />
              {{ level.label }}
            </span>
            <span v-if="level.sub && !compact" class="triage__sub">{{ level.sub }}</span>
          </button>
        </div>
        <p v-if="suggested" class="triage__hint r-label">
          Suggested {{ levels.find((l) => l.id === suggested)?.label }}
        </p>
      </template>
    </div>
  </div>
</template>

<style scoped>
.triage {
  gap: 6px;
}

.triage__title {
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.3;
}

.triage__detail {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.triage__foot {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.triage__keys {
  display: grid;
  gap: 4px;
}

/* A level key: square, ruled, the level in mono caps. The suggestion carries a cobalt rule on top. */
.triage__key {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-width: 0;
  height: var(--r-control-lg);
  border: 1px solid var(--r-border-strong);
  cursor: pointer;
  transition:
    background-color var(--r-duration-fast) var(--r-ease-out),
    color var(--r-duration-fast) var(--r-ease-out);
}

.triage__key:hover {
  background: var(--r-ink);
  color: var(--r-on-ink);
}

.triage__key.is-suggested::before {
  content: '';
  position: absolute;
  top: -1px;
  right: -1px;
  left: -1px;
  height: 3px;
  background: var(--r-brand);
}

.triage__label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  max-width: 100%;
  overflow: hidden;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
}

.triage__sub {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
}

.triage__key:hover .triage__sub {
  color: inherit;
}

.triage__then {
  overflow: hidden;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.triage__filed {
  margin-right: 4px;
  color: var(--r-text);
  font-family: var(--r-font-mono);
  font-weight: var(--r-weight-semibold);
  text-transform: uppercase;
}

.triage__hint {
  margin-top: -2px;
}

.triage--compact .triage__key {
  height: var(--r-control-md);
}
</style>
