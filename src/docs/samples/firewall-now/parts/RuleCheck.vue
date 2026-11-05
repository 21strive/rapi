<script setup lang="ts">
/**
 * The check in the thread: the rule as Simpul read it, in rows a person can read in one pass,
 * the parts it filled in marked, and one quiet line of what it would have done. The commit is not
 * here; it is the one brand button in Needs you, or a sentence.
 */
import { DeskCheck } from '../../_kit/desk'
import type { CardState, CheckCard } from '../script'

defineProps<{
  card: CheckCard
  state?: CardState
}>()
</script>

<template>
  <DeskCheck :eyebrow="card.eyebrow" :title="card.title" :rows="card.rows" :state="state">
    <p class="fw-check__sums">{{ card.sums }}</p>
  </DeskCheck>
</template>

<style scoped>
.fw-check__sums {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
}
</style>
