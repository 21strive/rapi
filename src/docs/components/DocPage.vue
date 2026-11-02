<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { DOC_TOC } from './toc'

defineProps<{
  /** Small label above the title, e.g. "Components". */
  eyebrow?: string
  title: string
  lead?: string
}>()

defineSlots<{ default?(): unknown; lead?(): unknown; aside?(): unknown }>()

const router = useRouter()
const sections = ref<{ id: string; title: string }[]>([])
const activeId = ref<string | null>(null)
let observer: IntersectionObserver | null = null

provide(DOC_TOC, {
  register(id, title) {
    sections.value = [...sections.value, { id, title }]
    return () => {
      sections.value = sections.value.filter((s) => s.id !== id)
    }
  },
})

function observe() {
  observer?.disconnect()
  const visible = new Map<string, number>()
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.set(entry.target.id, entry.boundingClientRect.top)
        else visible.delete(entry.target.id)
      }
      const first = sections.value.find((s) => visible.has(s.id))
      if (first) activeId.value = first.id
    },
    { rootMargin: '-80px 0px -55% 0px' },
  )
  for (const s of sections.value) {
    const el = document.getElementById(s.id)
    if (el) observer.observe(el)
  }
}

// The last sections can be too short to reach the top of the screen, so at the very bottom
// of the page the outline marks the last one.
function onScroll() {
  const doc = document.scrollingElement
  if (!doc || !sections.value.length) return
  if (window.innerHeight + window.scrollY >= doc.scrollHeight - 4) {
    activeId.value = sections.value[sections.value.length - 1].id
  }
}

onMounted(() => {
  nextTick(observe)
  window.addEventListener('scroll', onScroll, { passive: true })
})
watch(() => sections.value.length, () => nextTick(observe))
onBeforeUnmount(() => {
  observer?.disconnect()
  window.removeEventListener('scroll', onScroll)
})

function go(id: string) {
  activeId.value = id
  router.push({ hash: `#${id}` })
}
</script>

<template>
  <div class="doc-page" :class="{ 'has-toc': sections.length > 1 }">
    <article class="doc-page__content">
      <header class="doc-page__header">
        <p v-if="eyebrow" class="doc-page__eyebrow">{{ eyebrow }}</p>
        <h1 class="doc-page__title">{{ title }}</h1>
        <p v-if="lead || $slots.lead" class="doc-page__lead"><slot name="lead">{{ lead }}</slot></p>
      </header>
      <slot />
    </article>
    <nav v-if="sections.length > 1" class="doc-toc" aria-label="On this page">
      <p class="doc-toc__title">On this page</p>
      <a
        v-for="s in sections"
        :key="s.id"
        :href="`#${s.id}`"
        class="doc-toc__link"
        :class="{ 'is-active': activeId === s.id }"
        :aria-current="activeId === s.id ? 'location' : undefined"
        @click.prevent="go(s.id)"
      >
        {{ s.title }}
      </a>
    </nav>
  </div>
</template>
