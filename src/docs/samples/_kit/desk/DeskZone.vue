<script setup lang="ts">
/**
 * One zone of the desk's surfaces, named by the job it does: "State", "Needs you", "Done by
 * Simpul". A running index, a mono caps label, a quiet meta on the right, then the panels.
 */
withDefaults(
  defineProps<{
    index: string
    label: string
    meta?: string
    /** `ruled`: children butt against each other in a ruled grid of `columns`. */
    columns?: number
    ruled?: boolean
  }>(),
  { columns: 1, ruled: false },
)
</script>

<template>
  <section class="desk-zone">
    <h2 class="desk-zone__head">
      <span class="r-index">{{ index }}</span>
      <span class="desk-zone__label">{{ label }}</span>
      <span v-if="meta" class="desk-zone__meta">{{ meta }}</span>
    </h2>
    <div
      class="desk-zone__body"
      :class="{ 'r-grid-ruled': ruled }"
      :style="ruled ? { gridTemplateColumns: `repeat(auto-fit, minmax(min(${columns > 1 ? 220 : 320}px, 100%), 1fr))` } : undefined"
    >
      <slot />
    </div>
  </section>
</template>

<style>
.desk-zone__head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin: 0 0 10px;
  font-size: inherit;
  font-weight: inherit;
}

.desk-zone__label {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.desk-zone__meta {
  margin-left: auto;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.desk-zone__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.desk-zone__body.r-grid-ruled {
  display: grid;
  gap: 0;
}
</style>
