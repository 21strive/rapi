<script setup lang="ts">
import { Check, X } from 'lucide-vue-next'

defineProps<{
  do: string
  dont: string
}>()

defineSlots<{ 'do-example'?(): unknown; 'dont-example'?(): unknown }>()
</script>

<template>
  <div class="doc-dodont">
    <div class="doc-dodont__card is-do">
      <div v-if="$slots['do-example']" class="doc-dodont__example"><slot name="do-example" /></div>
      <p class="doc-dodont__text">
        <span class="doc-dodont__label"><Check /> Do</span>
        {{ $props.do }}
      </p>
    </div>
    <div class="doc-dodont__card is-dont">
      <div v-if="$slots['dont-example']" class="doc-dodont__example"><slot name="dont-example" /></div>
      <p class="doc-dodont__text">
        <span class="doc-dodont__label"><X /> Don't</span>
        {{ dont }}
      </p>
    </div>
  </div>
</template>
