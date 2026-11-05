<script setup lang="ts">
/**
 * A card inside one of Simpul's messages: a check (what was understood, inferred rows marked,
 * and under it what became of the decision), or the first request for the job, as code.
 */
import { RCodeBlock } from '@/design-system'
import { DeskCheck } from '../../_kit/desk'
import type { CardData, Outcome } from '../script'

defineProps<{ data: CardData; state?: Outcome }>()
</script>

<template>
  <DeskCheck v-if="data.kind === 'check'" :eyebrow="data.eyebrow" :title="data.title" :rows="data.rows" :state="state" />
  <RCodeBlock v-else :code="data.code" :title="data.title" :language="data.language" max-height="260px" />
</template>
