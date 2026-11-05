<script setup lang="ts">
/**
 * One reading of the organization, read in a look: a mono label, the figure, a line of context
 * and a foot (a seat meter, a lamp with its word, or a quiet note). Read-only: changing it is a
 * sentence. A tile changed in this session says when.
 */
import { useId } from 'vue'
import { RMeter, RStatus, type StatusTone } from '@/design-system'

defineProps<{
  label: string
  value: string
  /** Quiet words after the figure: "of 11 active". */
  of?: string
  sub: string
  changedAt?: string
  status?: { tone: StatusTone; label: string }
  meter?: { value: number; max: number; label: string; text: string }
  note?: string
}>()

const id = useId()
</script>

<template>
  <div class="s-orgnow-tile" role="group" :aria-labelledby="id">
    <div class="s-orgnow-tile__head">
      <h3 :id="id" class="s-orgnow-tile__label">{{ label }}</h3>
      <span v-if="changedAt" class="s-orgnow-tile__changed">Changed {{ changedAt }}</span>
    </div>
    <p class="s-orgnow-tile__value">
      <span class="s-orgnow-tile__figure">{{ value }}</span>
      <span v-if="of" class="s-orgnow-tile__of">{{ of }}</span>
    </p>
    <p class="s-orgnow-tile__sub">{{ sub }}</p>
    <div class="s-orgnow-tile__foot">
      <template v-if="meter">
        <RMeter
          class="s-orgnow-tile__meter"
          variant="segments"
          :count="meter.max"
          :max="meter.max"
          :value="meter.value"
          :height="8"
          :label="meter.label"
        />
        <span class="s-orgnow-tile__note">{{ meter.text }}</span>
      </template>
      <RStatus v-else-if="status" :tone="status.tone" :label="status.label" size="sm" />
      <span v-else-if="note" class="s-orgnow-tile__note">{{ note }}</span>
    </div>
  </div>
</template>

<style scoped>
.s-orgnow-tile {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-height: 112px;
  padding: 10px 12px 12px;
}

.s-orgnow-tile__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.s-orgnow-tile__label {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  line-height: 1.4;
  text-transform: uppercase;
}

.s-orgnow-tile__changed {
  flex: none;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.s-orgnow-tile__value {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 2px 8px;
  margin-top: 2px;
  min-width: 0;
}

.s-orgnow-tile__figure {
  font-size: var(--r-text-2xl);
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
  letter-spacing: var(--r-tracking-tight);
  line-height: 1.15;
}

.s-orgnow-tile__of {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-sm);
}

.s-orgnow-tile__sub {
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
  line-height: 1.4;
}

.s-orgnow-tile__foot {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  margin-top: auto;
  padding-top: 6px;
}

.s-orgnow-tile__meter {
  flex: 1 1 auto;
  min-width: 64px;
  max-width: 132px;
}

.s-orgnow-tile__note {
  flex: none;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
</style>
