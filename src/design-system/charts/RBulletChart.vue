<script setup lang="ts">
// STUB — API contract for Rapi 0.2. Keep these props, emits and slots; replace the template.
import type { BulletRow } from '../types'

/** Bullet graphs: a measure bar against a target tick over grey qualitative bands, one per row. */
withDefaults(
  defineProps<{
    rows: BulletRow[]
    label: string
    /** Shared maximum; defaults to each row's last range or 110% of its largest value. */
    max?: number
    format?: (value: number) => string
    /** `brand` measure bar (default) or `ink`. */
    tone?: 'brand' | 'ink'
  }>(),
  { tone: 'brand' },
)
</script>

<template>
  <div class="r-stub" data-stub="RBulletChart">RBulletChart</div>
</template>
