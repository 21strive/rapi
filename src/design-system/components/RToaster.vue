<script setup lang="ts">
// STUB — API contract for Rapi 0.2. Keep these props, emits and slots; replace the template.
/**
 * Renders the toast stack. Mount it once near the app root; show toasts with useToast().
 * Toasts are square dark islands, bottom-right, with a tone lamp and an optional action.
 */
withDefaults(defineProps<{ placement?: 'bottom-right' | 'bottom-center' | 'top-right' }>(), {
  placement: 'bottom-right',
})
</script>

<template>
  <div class="r-stub" data-stub="RToaster">RToaster</div>
</template>
