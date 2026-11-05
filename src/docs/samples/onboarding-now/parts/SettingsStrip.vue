<script setup lang="ts">
/**
 * Every setting the five steps used to ask for, one square each, grouped as the steps were: ink
 * for what the person said, cobalt for what Simpul inferred (marked in the summary, to check), and
 * hatched for the one the launch itself sets, the terms. Read in one look: how much was said, how
 * much was inferred, and that nothing is left to fill in.
 */
import { computed } from 'vue'
import type { CellGroup } from '../state'

const props = defineProps<{
  groups: CellGroup[]
  tally: { total: number; you: number; simpul: number; launch: number }
  /** After the launch the marks are gone; the strip keeps where each setting came from. */
  live?: boolean
}>()

const summary = computed(() => {
  const t = props.tally
  const parts = [`${t.you} from you`, `${t.simpul} inferred by Simpul`]
  if (t.launch) parts.push(`${t.launch} set when you create`)
  return `${t.total} settings: ${parts.join(', ')}`
})
</script>

<template>
  <div class="s-onbn-strip">
    <p class="s-onbn-strip__total">
      <span class="s-onbn-strip__figure">{{ tally.total }}</span>
      <span class="r-label">Settings</span>
    </p>
    <div class="s-onbn-strip__cells" role="img" :aria-label="summary">
      <div v-for="g in groups" :key="g.key" class="s-onbn-strip__group">
        <span class="s-onbn-strip__row">
          <i
            v-for="(source, n) in g.cells"
            :key="n"
            class="s-onbn-strip__cell"
            :class="[`is-${source}`, { 'r-hatch': source === 'launch' }]"
          />
        </span>
        <span class="s-onbn-strip__name">{{ g.label }}</span>
      </div>
    </div>
    <ul class="s-onbn-strip__legend" aria-hidden="true">
      <li><i class="s-onbn-strip__cell is-you" />{{ tally.you }} from you</li>
      <li><i class="s-onbn-strip__cell is-simpul" />{{ tally.simpul }} inferred{{ live ? ' by Simpul' : ', marked' }}</li>
      <li v-if="tally.launch"><i class="s-onbn-strip__cell is-launch r-hatch" />{{ tally.launch }} on create</li>
    </ul>
  </div>
</template>

<style scoped>
.s-onbn-strip {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 10px 20px;
}

.s-onbn-strip__total {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 56px;
}

.s-onbn-strip__figure {
  font-size: var(--r-text-2xl);
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
  letter-spacing: var(--r-tracking-tight);
  line-height: 1;
}

/* Five groups, as the five steps were; each square a field the steps asked for. */
.s-onbn-strip__cells {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
}

.s-onbn-strip__group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.s-onbn-strip__row {
  display: flex;
  gap: 2px;
}

.s-onbn-strip__cell {
  display: block;
  flex: none;
  width: 10px;
  height: 18px;
  border: 1px solid transparent;
}

.s-onbn-strip__cell.is-you {
  background: var(--r-ink);
}

.s-onbn-strip__cell.is-simpul {
  background: var(--r-brand);
}

/* Not set yet: the launch sets it. Hatched (.r-hatch), the way the system marks "not yet". */
.s-onbn-strip__cell.is-launch {
  border-color: var(--r-border-strong);
  background-color: var(--r-bg-surface);
}

.s-onbn-strip__name {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
  line-height: 1;
  text-transform: uppercase;
  white-space: nowrap;
}

.s-onbn-strip__legend {
  display: flex;
  flex-wrap: wrap;
  align-self: center;
  gap: 4px 16px;
  margin: 0 0 0 auto;
  padding: 0;
  list-style: none;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
  line-height: 1.3;
}

.s-onbn-strip__legend li {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.s-onbn-strip__legend .s-onbn-strip__cell {
  width: 8px;
  height: 12px;
}
</style>
