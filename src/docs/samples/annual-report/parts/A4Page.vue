<script setup lang="ts">
/**
 * One A4 page at 96 dpi (794 × 1123), scaled by the viewer. The paper is a light island in
 * both themes. Inner pages carry a running head and a folio on the outer edge.
 */
defineProps<{
  number: string
  /** Running head, right: the section this page belongs to. */
  section?: string
  scale: number
  /** Even pages sit on the left of a spread, odd pages on the right. */
  side: 'left' | 'right'
  /** The cover has no running head and no folio. */
  bare?: boolean
}>()
</script>

<template>
  <article
    class="s-ar-page"
    :style="{ width: `${794 * scale + 2}px`, height: `${1123 * scale + 2}px` }"
    :aria-label="`Page ${number}${section ? `, ${section}` : ''}`"
  >
    <div class="s-ar-page__paper" data-theme="light" :style="{ transform: `scale(${scale})` }">
      <template v-if="!bare">
        <header class="s-ar-runhead">
          <span><b>21 Strive</b> · Annual report 2025</span>
          <span>{{ section }}</span>
        </header>
        <footer class="s-ar-folio" :class="`is-${side}`">
          <span class="s-ar-folio__n">{{ number }}</span>
          <span>Specimen · all figures are illustrative</span>
        </footer>
      </template>
      <slot />
    </div>
  </article>
</template>

<style scoped>
.s-ar-page {
  position: relative;
  flex: none;
  overflow: hidden;
  border: 1px solid var(--r-border);
}

.s-ar-page__paper {
  position: absolute;
  top: 0;
  left: 0;
  width: 794px;
  height: 1123px;
  overflow: hidden;
  background: var(--r-bg-surface);
  color: var(--r-text);
  transform-origin: 0 0;
}

.s-ar-runhead {
  position: absolute;
  top: 40px;
  right: 64px;
  left: 64px;
  display: flex;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--r-border);
  font-family: var(--r-font-mono);
  font-size: 8.5px;
  font-weight: var(--r-weight-medium);
  letter-spacing: var(--r-tracking-caps);
  line-height: 1;
  text-transform: uppercase;
}
.s-ar-runhead b {
  font-weight: var(--r-weight-bold);
}

.s-ar-folio {
  position: absolute;
  right: 64px;
  bottom: 36px;
  left: 64px;
  display: flex;
  justify-content: space-between;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: 8.5px;
  letter-spacing: var(--r-tracking-caps);
  line-height: 1;
  text-transform: uppercase;
}
.s-ar-folio.is-right {
  flex-direction: row-reverse;
}
.s-ar-folio__n {
  color: var(--r-text);
  font-weight: var(--r-weight-bold);
}
</style>
