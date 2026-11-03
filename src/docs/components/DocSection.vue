<script setup lang="ts">
import { inject, onBeforeUnmount, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { DOC_TOC } from './toc'

const props = withDefaults(
  defineProps<{
    id: string
    title: string
    description?: string
    /** 3 for a sub-section; sub-sections stay out of the page outline. */
    level?: 2 | 3
  }>(),
  { level: 2 },
)

defineSlots<{ default?(): unknown; description?(): unknown }>()

const router = useRouter()
const toc = inject(DOC_TOC, null)
let release: (() => void) | undefined

onMounted(() => {
  if (props.level === 2) release = toc?.register(props.id, props.title)
})
onBeforeUnmount(() => release?.())

function go() {
  router.push({ hash: `#${props.id}` })
}
</script>

<template>
  <section :id="id" class="doc-section" :class="`doc-section--${level}`" :aria-labelledby="`${id}-title`">
    <!-- The running number comes from a CSS counter, so it always matches the order on the page. -->
    <span v-if="level === 2" class="doc-section__index" aria-hidden="true" />
    <component :is="level === 3 ? 'h3' : 'h2'" :id="`${id}-title`" class="doc-section__title">
      <a :href="`#${id}`" class="doc-section__anchor" @click.prevent="go">{{ title }}</a>
    </component>
    <p v-if="description || $slots.description" class="doc-section__description">
      <slot name="description">{{ description }}</slot>
    </p>
    <slot />
  </section>
</template>
