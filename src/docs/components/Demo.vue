<script setup lang="ts">
withDefaults(
  defineProps<{
    /** Caption above the stage, e.g. "Variants". */
    title?: string
    /** One short sentence under the caption. */
    note?: string
    padding?: 'none' | 'md' | 'lg'
    /** Lay children out in a column instead of a wrapping row. */
    stack?: boolean
    center?: boolean
    /** `plain` drops the dotted backdrop (for full cards and charts). */
    surface?: 'dots' | 'plain'
  }>(),
  { padding: 'md', surface: 'dots' },
)

defineSlots<{ default?(): unknown }>()
</script>

<template>
  <figure class="doc-demo">
    <figcaption v-if="title || note" class="doc-demo__caption">
      <span v-if="title" class="doc-demo__title">{{ title }}</span>
      <span v-if="note" class="doc-demo__note">{{ note }}</span>
    </figcaption>
    <div
      class="doc-demo__stage"
      :class="[`doc-demo__stage--${padding}`, `doc-demo__stage--${surface}`, { 'is-stack': stack, 'is-center': center }]"
    >
      <slot />
    </div>
  </figure>
</template>
