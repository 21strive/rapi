<script setup lang="ts">
import { computed, ref } from 'vue'
import { useElementSize } from '@/design-system'

/**
 * A 16:9 slide drawn on a fixed 1200 × 675 canvas and scaled to the width it is given, like a
 * page in a PDF viewer. The canvas is a light island: a slide is paper in either theme.
 */
const props = defineProps<{
  index: string
  title: string
  total: number
  /** Cap the slide's height (present mode); the slide stays centred. */
  maxHeight?: number
}>()

const W = 1200
const H = 675
const measure = ref<HTMLElement | null>(null)
const { width } = useElementSize(measure)

// The frame's 1px border sits outside the scaled paper, so it stays a hairline at any scale.
const scale = computed(() => {
  const s = Math.max(0.1, ((width.value || W + 2) - 2) / W)
  return props.maxHeight ? Math.min(s, (props.maxHeight - 2) / H) : s
})
</script>

<template>
  <figure :id="`slide-${index}`" class="s-bb-slide" :aria-label="`Slide ${index} of ${total}: ${title}`">
    <div ref="measure" class="s-bb-slide__measure">
      <div class="s-bb-slide__frame" :style="{ width: `${W * scale + 2}px`, height: `${H * scale + 2}px` }">
        <div class="s-bb-slide__canvas" data-theme="light" :style="{ transform: `scale(${scale})` }">
          <div class="s-bb-runhead" aria-hidden="true">
            <span><b>21 Strive</b> logo &amp; branding</span>
            <span>November 2026</span>
          </div>
          <slot />
        </div>
      </div>
    </div>
    <figcaption class="s-bb-slide__caption">
      <span class="s-bb-slide__index">{{ index }}</span>
      <span>{{ title }}</span>
    </figcaption>
  </figure>
</template>

<style scoped>
.s-bb-slide {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  margin: 0;
  scroll-margin-top: 72px;
}

.s-bb-slide__measure {
  min-width: 0;
}

.s-bb-slide__frame {
  position: relative;
  overflow: hidden;
  margin: 0 auto;
  border: 1px solid var(--r-border);
}

.s-bb-slide__canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 1200px;
  height: 675px;
  overflow: hidden;
  background: var(--r-bg-surface);
  color: var(--r-text);
  transform-origin: 0 0;
}

.s-bb-runhead {
  position: absolute;
  z-index: 3;
  top: 26px;
  right: 32px;
  left: 32px;
  display: flex;
  justify-content: space-between;
  font-family: var(--r-font-mono);
  font-size: 10px;
  font-weight: var(--r-weight-medium);
  letter-spacing: var(--r-tracking-caps);
  line-height: 1;
  text-transform: uppercase;
  pointer-events: none;
}
.s-bb-runhead b {
  font-weight: var(--r-weight-bold);
}

.s-bb-slide__caption {
  display: flex;
  align-items: baseline;
  gap: 10px;
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
}
.s-bb-slide__index {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  letter-spacing: 0.04em;
  font-variant-numeric: tabular-nums;
}
</style>
