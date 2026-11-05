<script setup lang="ts">
/**
 * The running summary: the same four blocks the Then screen reviews before "Create workspace"
 * (company, team, integrations, plan), kept up to date as the person talks. Rows Simpul inferred
 * carry the selection rule, so the person knows exactly what to check; any of them changes by
 * saying so. Above them, the settings strip says in one look how much was said and inferred.
 */
import { useId } from 'vue'
import { RBadge, RStatus } from '@/design-system'
import type { CellGroup, SummaryBlock } from '../state'
import SettingsStrip from './SettingsStrip.vue'

defineProps<{
  name: string
  url: string
  live: boolean
  blocks: SummaryBlock[]
  groups: CellGroup[]
  tally: { total: number; you: number; simpul: number; launch: number }
}>()

const id = useId()
</script>

<template>
  <section class="s-onbn-summary" :aria-labelledby="`${id}-name`">
    <header class="s-onbn-summary__head">
      <div class="s-onbn-summary__id">
        <p class="r-eyebrow s-onbn-summary__eyebrow">Workspace summary</p>
        <h3 :id="`${id}-name`" class="s-onbn-summary__name">{{ name }}</h3>
        <p class="s-onbn-summary__url">{{ url }}</p>
      </div>
      <RStatus class="s-onbn-summary__lamp" :tone="live ? 'success' : 'brand'" :label="live ? 'Live' : 'Ready to create'" />
    </header>

    <SettingsStrip class="s-onbn-summary__strip" :groups="groups" :tally="tally" :live="live" />

    <div class="s-onbn-summary__blocks">
      <section v-for="block in blocks" :key="block.key" class="s-onbn-summary__block" :aria-labelledby="`${id}-${block.key}`">
        <h4 :id="`${id}-${block.key}`" class="s-onbn-summary__block-head">
          <span class="r-index">{{ block.index }}</span>
          <span class="r-eyebrow s-onbn-summary__block-title">{{ block.title }}</span>
        </h4>
        <dl class="s-onbn-summary__rows">
          <div
            v-for="row in block.rows"
            :key="row.label"
            class="s-onbn-summary__row"
            :class="{ 'is-marked': row.marked }"
          >
            <dt>
              {{ row.label }}<span v-if="row.marked" class="r-sr-only">, inferred by Simpul</span>
            </dt>
            <dd>
              <span v-if="row.value" class="s-onbn-summary__value">
                <span :class="{ 'r-mono': row.mono }">{{ row.value }}</span>
                <RBadge v-if="row.badge" size="sm" variant="outline">{{ row.badge }}</RBadge>
              </span>
              <ul v-if="row.entries?.length" class="s-onbn-summary__entries">
                <li v-for="entry in row.entries" :key="entry.text" class="s-onbn-summary__entry">
                  <span class="s-onbn-summary__value">
                    <span>{{ entry.text }}</span>
                    <RStatus v-if="entry.status" size="sm" :tone="entry.status.tone" :label="entry.status.label" />
                  </span>
                  <span v-if="entry.hint" class="s-onbn-summary__hint is-mono">{{ entry.hint }}</span>
                </li>
              </ul>
              <span v-if="row.hint" class="s-onbn-summary__hint" :class="{ 'is-mono': row.hintMono }">{{ row.hint }}</span>
              <RStatus v-if="row.status" class="s-onbn-summary__status" size="sm" :tone="row.status.tone" :label="row.status.label" />
            </dd>
          </div>
        </dl>
      </section>
    </div>
  </section>
</template>

<style scoped>
.s-onbn-summary {
  container: s-onbn-summary / inline-size;
  border: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}

.s-onbn-summary__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px 0;
}

.s-onbn-summary__id {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 2px 12px;
  min-width: 0;
}

.s-onbn-summary__lamp {
  flex: none;
  margin-top: 1px;
}

.s-onbn-summary__eyebrow {
  flex-basis: 100%;
  color: var(--r-text-secondary);
}

.s-onbn-summary__name {
  font-size: var(--r-text-xl);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.3;
}

.s-onbn-summary__url {
  color: var(--r-brand-text);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-sm);
}

.s-onbn-summary__strip {
  margin: 10px 16px 12px;
}

/* Four blocks in a ruled row, the steps of the old wizard side by side. */
.s-onbn-summary__blocks {
  display: grid;
  grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.14fr) minmax(0, 1.04fr) minmax(0, 0.98fr);
  border-top: 1px solid var(--r-border);
}

.s-onbn-summary__block {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 8px 0 6px;
}

.s-onbn-summary__block + .s-onbn-summary__block {
  border-left: 1px solid var(--r-border);
}

.s-onbn-summary__block-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin: 0 12px 4px;
  font-size: inherit;
  font-weight: inherit;
}

.s-onbn-summary__block-title {
  color: var(--r-text-secondary);
}

.s-onbn-summary__rows {
  display: flex;
  flex-direction: column;
  margin: 0;
}

.s-onbn-summary__row {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 4px 12px 5px;
  border-top: 1px solid var(--r-border-subtle);
}

.s-onbn-summary__row dt {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
  line-height: 14px;
  text-transform: uppercase;
}

.s-onbn-summary__entries {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  margin: 1px 0 0;
  padding: 0;
  list-style: none;
}

.s-onbn-summary__entry {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.s-onbn-summary__row dd {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  min-width: 0;
  margin: 0;
}

.s-onbn-summary__value {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
  max-width: 100%;
  font-size: var(--r-text-sm);
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.s-onbn-summary__value .r-mono {
  font-size: var(--r-text-xs);
}

.s-onbn-summary__hint {
  max-width: 100%;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.s-onbn-summary__hint.is-mono {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
}

.s-onbn-summary__status {
  margin-top: 2px;
}

/* Inferred by Simpul: the selection tint and a 2px cobalt rule on the leading edge, as DeskCheck marks it. */
.s-onbn-summary__row.is-marked {
  position: relative;
  background: var(--r-bg-selected);
}

.s-onbn-summary__row.is-marked::before {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 2px;
  background: var(--r-brand);
  content: '';
}

@container s-onbn-summary (max-width: 760px) {
  .s-onbn-summary__blocks {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .s-onbn-summary__block:nth-child(3) {
    border-left: 0;
  }
  .s-onbn-summary__block:nth-child(n + 3) {
    border-top: 1px solid var(--r-border);
  }
}

@container s-onbn-summary (max-width: 440px) {
  .s-onbn-summary__blocks {
    grid-template-columns: minmax(0, 1fr);
  }
  .s-onbn-summary__block + .s-onbn-summary__block {
    border-top: 1px solid var(--r-border);
    border-left: 0;
  }
}
</style>
