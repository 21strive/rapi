<script setup lang="ts">
/**
 * A service doing the same thing again and again, as one line: who, what, how often and when.
 * Thirty identical key refreshes are one fact, not thirty rows; opened, the line lists every
 * timestamp so nothing is hidden.
 */
import { computed } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import { RAvatar, RStatus } from '@/design-system'
import { dayMonth, dayWib, hhmmWib, stamp, type AuditEvent } from '../data'

const props = defineProps<{ events: AuditEvent[]; open: boolean }>()
const emit = defineEmits<{ toggle: [] }>()

const first = computed(() => props.events[0])
const resources = computed(() => new Set(props.events.map((e) => e.resource)))
const refused = computed(() => props.events.filter((e) => e.result !== 'success').length)
const rhythm = computed(() => {
  const hours = new Set(props.events.map((e) => hhmmWib(e.ts)))
  const days = new Set(props.events.map((e) => dayWib(e.ts)))
  const span = `${dayMonth(props.events[props.events.length - 1].ts)} – ${dayMonth(props.events[0].ts)}`
  return hours.size === 1 && days.size === props.events.length ? `Daily at ${[...hours][0]} WIB · ${span}` : span
})
const listId = computed(() => `s-alnow-routine-${first.value.actor.id}-${first.value.action}`)
</script>

<template>
  <div class="s-alnow-routine" :class="{ 'is-open': open }">
    <div class="s-alnow-routine__line">
      <span class="s-alnow-routine__count">×{{ events.length }}</span>
      <span class="s-alnow-routine__what">
        <button type="button" class="s-alnow-routine__toggle" :aria-expanded="open" :aria-controls="listId" @click="emit('toggle')">
          <RAvatar :name="first.actor.avatar" size="xs" decorative />
          <span class="r-mono">{{ first.actor.name }}</span>
          <span class="s-alnow-routine__action">{{ first.action }}</span>
          <ChevronDown class="s-alnow-routine__chevron" :size="14" aria-hidden="true" />
        </button>
        <span class="s-alnow-routine__resource">{{ resources.size === 1 ? first.resource : `${resources.size} resources` }}</span>
      </span>
      <span class="s-alnow-routine__end">
        <span class="s-alnow-routine__rhythm">{{ rhythm }}</span>
        <RStatus v-if="refused" tone="danger" :label="`${refused} refused`" size="sm" />
        <RStatus v-else tone="success" label="Success" size="sm" />
      </span>
    </div>
    <ol v-if="open" :id="listId" class="s-alnow-routine__list" :aria-label="`Every ${first.action} by ${first.actor.name}`">
      <li v-for="e in events" :key="e.id">{{ dayMonth(e.ts) }} {{ stamp(e.ts) }}</li>
    </ol>
  </div>
</template>

<style scoped>
.s-alnow-routine {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 14px;
  border: 1px solid var(--r-border);
  background: var(--r-bg-muted);
}

.s-alnow-routine__line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 12px;
  min-width: 0;
}

.s-alnow-routine__count {
  flex: none;
  min-width: 32px;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
}

.s-alnow-routine__what {
  display: inline-flex;
  flex: 1 1 260px;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.s-alnow-routine__toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--r-text);
  font: inherit;
  font-size: var(--r-text-xs);
  text-align: left;
  cursor: pointer;
}

.s-alnow-routine__toggle:hover {
  color: var(--r-brand-text);
}

.s-alnow-routine__action {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
}

.s-alnow-routine__chevron {
  color: var(--r-text-tertiary);
  transition: transform var(--r-duration-fast) var(--r-ease-out);
}

.s-alnow-routine.is-open .s-alnow-routine__chevron {
  transform: rotate(180deg);
}

.s-alnow-routine__resource {
  overflow: hidden;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.s-alnow-routine__end {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.s-alnow-routine__rhythm {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
}

.s-alnow-routine__list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 2px 12px;
  margin: 0;
  padding: 8px 0 0;
  border-top: 1px solid var(--r-border-subtle);
  list-style: none;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
}

@media (prefers-reduced-motion: reduce) {
  .s-alnow-routine__chevron {
    transition: none;
  }
}
</style>
