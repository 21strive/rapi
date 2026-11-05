<script setup lang="ts">
/**
 * Where a number comes from. The figure sits on top of its sources, each with its size and how
 * fresh it is, and the step that joins them. A source opens to say what it is; Recompute reads them
 * again and says whether they still add up to the figure on screen.
 */
import { computed, ref } from 'vue'
import { ChevronRight, RefreshCw } from 'lucide-vue-next'
import { RButton, RStatus } from '@/design-system'
import { stamp, useSequence } from './shared'

interface Source {
  id: string
  kind: 'table' | 'feed' | 'model' | 'form' | 'manual'
  /** "1,204,511 rows", "14 probes". */
  size: string
  /** "14:02 WIB". */
  fresh: string
  note: string
  state?: 'ok' | 'stale' | 'missing'
}

const props = withDefaults(
  defineProps<{
    label: string
    value: string
    unit?: string
    asOf: string
    sources: Source[]
    /** The step that joins the sources: "Sum of closing balances at 14:00 fixings". */
    transform: string
    /** What a fresh recompute finds: "0 rows differ". */
    result?: string
    /** card 2x2 · split 3x2 · narrow 1x2. */
    layout?: 'card' | 'split' | 'narrow'
  }>(),
  { result: '0 rows differ', layout: 'card' },
)

const open = ref<number | null>(null)
const checked = ref('')
const { step, running, run } = useSequence()

function recompute() {
  if (running.value) return
  open.value = null
  checked.value = ''
  run(props.sources.length + 1, 380, () => {
    checked.value = stamp()
  })
}

const stale = computed(() => props.sources.filter((s) => s.state && s.state !== 'ok').length)

function rowState(i: number) {
  if (!running.value) return ''
  return i < step.value ? 'is-read' : i === step.value ? 'is-reading' : 'is-waiting'
}

function toggle(i: number) {
  open.value = open.value === i ? null : i
}
</script>

<template>
  <div class="mk prov" :class="`prov--${layout}`">
    <div class="prov__figure-block">
      <div class="mk-row mk-between">
        <span class="r-eyebrow mk-truncate">{{ label }}</span>
        <RButton
          v-if="layout === 'card'"
          size="xs"
          variant="ghost"
          :aria-busy="running"
          class="prov__recompute"
          @click="recompute"
        >
          <template #leading><RefreshCw :size="14" aria-hidden="true" /></template>
          {{ running ? 'Reading' : 'Recompute' }}
        </RButton>
      </div>
      <p class="prov__figure">
        <span class="mk-fig">{{ value }}</span>
        <span v-if="unit" class="mk-unit">{{ unit }}</span>
      </p>
      <p class="prov__asof">
        As of {{ asOf }} · {{ sources.length }} sources<template v-if="stale"> · {{ stale }} not fresh</template>
      </p>
      <p v-if="checked || running" class="prov__check" aria-live="polite">
        <RStatus v-if="checked" tone="success" label="Matches" size="sm" />
        <span>{{ running ? `Reading ${Math.min(step + 1, sources.length)} of ${sources.length}` : `${result} · ${checked}` }}</span>
      </p>
      <RButton v-if="layout === 'split'" size="sm" variant="outline" class="prov__split-btn" :aria-busy="running" @click="recompute">
        <template #leading><RefreshCw :size="16" aria-hidden="true" /></template>
        {{ running ? 'Reading' : 'Recompute' }}
      </RButton>
    </div>

    <div class="prov__lineage mk-grow">
      <ul class="prov__sources">
        <li v-for="(s, i) in sources" :key="s.id" class="prov__source" :class="[rowState(i), `is-${s.state ?? 'ok'}`]">
          <button type="button" class="prov__row" :aria-expanded="open === i" @click="toggle(i)">
            <span class="prov__node" aria-hidden="true" />
            <span class="prov__id mk-truncate">{{ s.id }}</span>
            <span class="prov__size mk-truncate">{{ s.size }}</span>
            <span class="prov__fresh">{{ s.state === 'stale' ? 'Stale' : s.state === 'missing' ? 'Missing' : s.fresh }}</span>
            <ChevronRight :size="12" aria-hidden="true" class="prov__chev" :class="{ 'is-open': open === i }" />
          </button>
          <p v-if="open === i" class="prov__note">
            <span class="prov__kind">{{ s.kind }}</span>
            {{ s.note }}
          </p>
        </li>
      </ul>
      <p class="prov__transform" :class="{ 'is-reading': running && step === sources.length }">
        <span class="prov__eq" aria-hidden="true">=</span>
        <span class="prov__transform-text">{{ transform }}</span>
      </p>
    </div>

    <RButton v-if="layout === 'narrow'" size="xs" variant="outline" block :aria-busy="running" @click="recompute">
      {{ running ? 'Reading' : 'Recompute' }}
    </RButton>
  </div>
</template>

<style scoped>
.prov {
  gap: 10px;
  container-type: inline-size;
}

.prov__figure-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.prov__recompute {
  flex: none;
}

.prov__figure {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}

.prov__figure .mk-fig {
  overflow: hidden;
  font-size: var(--r-text-3xl);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.prov__asof {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.prov__check {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
}

.prov__lineage {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

/* The rail: sources hang off one hairline that ends in the joining step. */
.prov__sources {
  display: flex;
  flex-direction: column;
  margin-left: 4px;
  border-left: 1px solid var(--r-border-strong);
}

.prov__source {
  min-width: 0;
}

.prov__row {
  display: grid;
  grid-template-columns: 9px minmax(0, 1.3fr) minmax(0, 1fr) auto 12px;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 30px;
  margin: 0;
  padding: 0 4px 0 0;
  border: 0;
  border-bottom: 1px solid var(--r-border-subtle);
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.prov__row:hover {
  background: var(--r-bg-hover);
}

.prov__row:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: -2px;
}

.prov__node {
  width: 9px;
  height: 9px;
  margin-left: -5px;
  background: var(--r-text);
}

.prov__id {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
}

.prov__size {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.prov__fresh {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.prov__chev {
  color: var(--r-text-tertiary);
  transition: transform var(--r-duration-fast) var(--r-ease-out);
}
.prov__chev.is-open {
  transform: rotate(90deg);
}

.prov__source.is-stale .prov__node,
.prov__source.is-missing .prov__node {
  background: var(--r-status-warning);
}
.prov__source.is-stale .prov__fresh,
.prov__source.is-missing .prov__fresh {
  color: var(--r-warning-text);
  text-transform: uppercase;
}

.prov__source.is-waiting .prov__id,
.prov__source.is-waiting .prov__size {
  color: var(--r-text-disabled);
}
.prov__source.is-reading .prov__row {
  background: var(--r-bg-selected);
}
.prov__source.is-reading .prov__node {
  background: var(--r-brand);
}

.prov__note {
  padding: 6px 4px 8px 12px;
  border-bottom: 1px solid var(--r-border-subtle);
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: var(--r-leading-snug);
}

.prov__kind {
  margin-right: 6px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.prov__transform {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 6px 0 0;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: var(--r-leading-snug);
}

.prov__transform.is-reading {
  color: var(--r-text);
}

.prov__eq {
  flex: none;
  width: 9px;
  font-family: var(--r-font-mono);
  font-weight: var(--r-weight-semibold);
  text-align: center;
}

.prov__transform-text {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

/* Split: the figure on the left, its lineage on the right. */
.prov--split {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
  grid-template-rows: minmax(0, 1fr);
  gap: 16px;
}
.prov--split .prov__figure-block {
  gap: 6px;
}
.prov--split .prov__split-btn {
  align-self: flex-start;
  margin-top: auto;
}
.prov--split .prov__row {
  grid-template-columns: 9px minmax(0, 1fr) auto 12px;
  grid-template-areas:
    'node id fresh chev'
    'node size size chev';
  row-gap: 0;
  padding: 4px 4px 4px 0;
}
.prov--split .prov__node {
  grid-area: node;
  align-self: start;
  margin-top: 4px;
}
.prov--split .prov__id {
  grid-area: id;
}
.prov--split .prov__size {
  grid-area: size;
}
.prov--split .prov__fresh {
  grid-area: fresh;
}
.prov--split .prov__chev {
  grid-area: chev;
}

/* Narrow: ids only, sizes give way. */
.prov--narrow .prov__figure .mk-fig {
  font-size: var(--r-text-2xl);
}
.prov--narrow .prov__row {
  grid-template-columns: 9px minmax(0, 1fr) auto 12px;
}
.prov--narrow .prov__size {
  display: none;
}
/* On a phone the split stacks: the figure over its lineage. */
@container (max-width: 440px) {
  .prov--split {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1fr);
    gap: 10px;
  }
  .prov--split .prov__split-btn {
    margin-top: 2px;
  }
}
</style>
