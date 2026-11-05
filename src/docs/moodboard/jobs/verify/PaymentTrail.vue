<script setup lang="ts">
/**
 * Where a payment is, and since when. Each stage on the path is a record: who or what handled it,
 * at what second, and with what result. Arrow keys walk the stages; the line under the path reads
 * the one in focus. A stage that held or failed says so in words.
 */
import { computed, nextTick, ref, useId } from 'vue'
import { RStatus } from '@/design-system'
import { arrowMove, type Mark } from './shared'

interface Stage {
  label: string
  at?: string
  detail: string
  state: 'done' | 'current' | 'held' | 'failed' | 'todo'
}

const props = defineProps<{
  eyebrow: string
  amount: string
  reference: string
  stages: Stage[]
  status: Mark
}>()

const focusIndex = props.stages.findIndex((s) => s.state === 'current' || s.state === 'held' || s.state === 'failed')
const selected = ref(focusIndex >= 0 ? focusIndex : props.stages.length - 1)
const tabs: (HTMLElement | null)[] = []
const panelId = useId()
const tabId = useId()

function select(i: number, focus = false) {
  selected.value = i
  if (focus) nextTick(() => tabs[i]?.focus())
}

function onKeydown(event: KeyboardEvent, i: number) {
  const next = arrowMove(event, i, props.stages.length, 'horizontal')
  if (next === null) return
  event.preventDefault()
  select(next, true)
}

const word: Record<Stage['state'], string> = {
  done: '',
  current: 'Now',
  held: 'Held',
  failed: 'Failed',
  todo: 'Waiting',
}

const stage = computed(() => props.stages[selected.value])
</script>

<template>
  <div class="mk trail">
    <div class="mk-row trail__top">
      <p class="trail__what mk-truncate">
        <span class="r-eyebrow">{{ eyebrow }}</span>
        <span class="trail__amount">{{ amount }}</span>
      </p>
      <span class="trail__ref mk-truncate">{{ reference }}</span>
      <RStatus :tone="status.tone" :label="status.label" size="sm" class="trail__status" />
    </div>

    <div class="trail__track" role="tablist" :aria-label="`Stages of ${eyebrow}`" :style="{ '--n': stages.length }">
      <button
        v-for="(s, i) in stages"
        :id="`${tabId}-${i}`"
        :key="s.label"
        :ref="(el) => (tabs[i] = el as HTMLElement | null)"
        type="button"
        role="tab"
        class="trail__stage"
        :class="[`is-${s.state}`, { 'is-selected': i === selected, 'is-last': i === stages.length - 1 }]"
        :aria-selected="i === selected"
        :aria-controls="panelId"
        :tabindex="i === selected ? 0 : -1"
        @click="select(i)"
        @keydown="onKeydown($event, i)"
      >
        <span class="trail__node" aria-hidden="true" />
        <span class="trail__label mk-truncate">{{ s.label }}</span>
        <span class="trail__at mk-truncate">{{ s.state === 'done' ? s.at : word[s.state] }}</span>
      </button>
    </div>

    <p :id="panelId" class="trail__detail mk-end" role="tabpanel" :aria-labelledby="`${tabId}-${selected}`">
      <span class="trail__detail-head">{{ stage.label }}<template v-if="stage.at"> · {{ stage.at }}</template></span>
      {{ stage.detail }}
    </p>
  </div>
</template>

<style scoped>
.trail {
  gap: 10px;
  container-type: inline-size;
}

.trail__top {
  gap: 10px;
}

.trail__what {
  display: flex;
  flex: 1 1 auto;
  align-items: baseline;
  gap: 8px;
}

.trail__amount {
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
  letter-spacing: var(--r-tracking-snug);
  white-space: nowrap;
}

.trail__ref {
  flex: 0 1 auto;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
}

.trail__status {
  flex: none;
}

.trail__track {
  display: grid;
  grid-template-columns: repeat(var(--n), minmax(0, 1fr));
}

.trail__stage {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  min-width: 0;
  margin: 0;
  padding: 0 6px 4px 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

/* The rail runs from this node to the next one. */
.trail__stage::after {
  content: '';
  position: absolute;
  top: 5px;
  right: 0;
  left: 14px;
  height: 1px;
  background: var(--r-border-strong);
}
.trail__stage.is-done:not(.is-last)::after {
  height: 2px;
  top: 4px;
  background: var(--r-text-secondary);
}
.trail__stage.is-last::after {
  display: none;
}

.trail__node {
  width: 11px;
  height: 11px;
  margin-bottom: 4px;
  border: 1px solid var(--r-border-strong);
  background: var(--r-bg-surface);
}

.trail__stage.is-done .trail__node {
  border-color: var(--r-text);
  background: var(--r-text);
}

.trail__stage.is-current .trail__node {
  border-color: var(--r-brand);
  background: var(--r-brand);
}

.trail__stage.is-held .trail__node {
  border-color: var(--r-status-warning);
  background: var(--r-status-warning);
}

.trail__stage.is-failed .trail__node {
  border-color: var(--r-status-critical);
  background: var(--r-status-critical);
}

.trail__label {
  max-width: 100%;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
}

.trail__at {
  max-width: 100%;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
}

.trail__stage.is-held .trail__at {
  color: var(--r-warning-text);
}
.trail__stage.is-failed .trail__at {
  color: var(--r-danger-text);
}
.trail__stage.is-current .trail__at {
  color: var(--r-brand-text);
}

.trail__stage:hover .trail__label {
  color: var(--r-text);
}

/* The stage being read: ink label with a cobalt rule under it. */
.trail__stage.is-selected .trail__label {
  color: var(--r-text);
  text-decoration: underline;
  text-decoration-color: var(--r-brand);
  text-decoration-thickness: 2px;
  text-underline-offset: 4px;
}

.trail__stage:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: 2px;
}

.trail__detail {
  display: -webkit-box;
  overflow: hidden;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: var(--r-leading-snug);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.trail__detail-head {
  margin-right: 6px;
  color: var(--r-text);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

@container (max-width: 420px) {
  .trail__ref {
    display: none;
  }
}
</style>
