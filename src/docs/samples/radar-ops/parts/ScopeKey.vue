<script setup lang="ts">
/** The column beside the scope: the key with counts, what is inside the alert ring, the scope setup. */
import { computed } from 'vue'
import { RBadge, RSpecList, type SpecItem } from '@/design-system'
import KindGlyph from './KindGlyph.vue'
import { ALERT_RING_NM, KIND_LABEL, KIND_TONE, type TrackKind } from '../data'
import type { TrackView } from '../sim'

const props = defineProps<{
  /** Tracks drawn on the scope right now. */
  shown: TrackView[]
  /** Every track in the picture, also the ones outside the scope range. */
  all: TrackView[]
  ringStep: number
  selectedId: string
}>()

const emit = defineEmits<{ select: [id: string] }>()

const ORDER: TrackKind[] = ['hostile', 'unknown', 'friendly', 'neutral']

const counts = computed(() =>
  ORDER.map((kind) => ({
    kind,
    shown: props.shown.filter((t) => t.kind === kind).length,
    total: props.all.filter((t) => t.kind === kind).length,
  })),
)

const inside = computed(() =>
  props.all
    .filter((t) => t.inside && (t.kind === 'hostile' || t.kind === 'unknown'))
    .sort((a, b) => a.range - b.range),
)

const setup = computed<SpecItem[]>(() => [
  { label: 'Centre', value: 'CRC Sector 3' },
  { label: 'Rings', value: `${props.ringStep} NM` },
  { label: 'Alert ring', value: `${ALERT_RING_NM} NM` },
  { label: 'In scope', value: `${props.shown.length} of ${props.all.length}`, mono: true },
])
</script>

<template>
  <div class="key">
    <section class="key__group" aria-label="Tracks by kind">
      <p class="r-label">Picture</p>
      <ul class="key__kinds">
        <li v-for="row in counts" :key="row.kind" class="key__kind">
          <KindGlyph :kind="row.kind" />
          <span class="key__word">{{ KIND_LABEL[row.kind] }}</span>
          <span class="key__count">
            {{ row.shown }}<span v-if="row.total !== row.shown" class="key__of">/{{ row.total }}</span>
          </span>
        </li>
      </ul>
    </section>

    <section class="key__group" :aria-label="`Inside the ${ALERT_RING_NM} NM ring`">
      <p class="r-label">Inside {{ ALERT_RING_NM }} NM · range</p>
      <ul v-if="inside.length" class="key__inside">
        <li v-for="t in inside" :key="t.id">
          <button
            type="button"
            class="key__track"
            :class="{ 'is-selected': t.id === selectedId }"
            :aria-pressed="t.id === selectedId"
            @click="emit('select', t.id)"
          >
            <span class="key__id">{{ t.id }}</span>
            <RBadge :tone="KIND_TONE[t.kind]" size="sm">{{ KIND_LABEL[t.kind] }}</RBadge>
            <span class="key__where">{{ t.range.toFixed(1) }}</span>
          </button>
        </li>
      </ul>
      <p v-else class="key__none">No hostile or unknown tracks.</p>
    </section>

    <RSpecList class="key__setup" :items="setup" dense />
  </div>
</template>

<style scoped>
.key {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}

.key__group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.key__kinds,
.key__inside {
  display: flex;
  flex-direction: column;
}

.key__kind {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 28px;
  border-bottom: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-sm);
}

.key__word {
  flex: 1;
  color: var(--r-text-secondary);
}

.key__count {
  color: var(--r-text);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
}

.key__of {
  color: var(--r-text-tertiary);
}

.key__track {
  display: flex;
  align-items: center;
  gap: 8px;
  width: calc(100% + 16px);
  height: 32px;
  padding: 0 8px 0 6px;
  margin: 0 -8px;
  border: 0;
  border-left: 2px solid transparent;
  border-bottom: 1px solid var(--r-border-subtle);
  background: none;
  color: var(--r-text);
  text-align: left;
  cursor: pointer;
}
.key__track:hover {
  background: var(--r-bg-hover);
}
.key__track.is-selected {
  border-left-color: var(--r-brand);
  background: var(--r-bg-selected);
}

.key__id {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-semibold);
}

.key__where {
  margin-left: auto;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
}

.key__none {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-sm);
}
</style>
