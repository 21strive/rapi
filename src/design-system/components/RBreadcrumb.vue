<script setup lang="ts">
// STUB — API contract for Rapi 0.2. Keep these props, emits and slots; replace the template.
import type { Component } from 'vue'
import type { BreadcrumbItem } from '../types'

/** Path to the current page, separated by mono slashes. The last item is the current page. */
withDefaults(
  defineProps<{
    items: BreadcrumbItem[]
    /** Link component for items with `to`, e.g. RouterLink. Defaults to <a>. */
    as?: Component | string
  }>(),
  {},
)
</script>

<template>
  <div class="r-stub" data-stub="RBreadcrumb">RBreadcrumb</div>
</template>
