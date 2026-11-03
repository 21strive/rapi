<script setup lang="ts">
/**
 * The frame most sample screens share: a mono top strip (the 21 Strive deck header), a header
 * bar with the page title and actions, an optional sidebar, and the content area. Layout only;
 * everything inside is Rapi components. Screens that are not apps (phones, print, slides) skip it.
 */
import { RLogo } from '@/design-system'

withDefaults(
  defineProps<{
    /** Product or system name, shown in the strip: "TREASURY". */
    product: string
    /** Page title in the header bar. */
    title?: string
    /** Mark at the start of the strip. */
    mark?: 'rapi' | '21strive' | 'none'
    /** Width of the sidebar when the `sidebar` slot is used. */
    sidebarWidth?: number
    /** Content padding. `none` for edge-to-edge consoles. */
    padding?: 'none' | 'sm' | 'md'
  }>(),
  { mark: '21strive', sidebarWidth: 232, padding: 'md' },
)

defineSlots<{
  default?(): unknown
  /** Left of the strip, after the product name, e.g. an environment. */
  strip?(): unknown
  /** Right end of the strip: clock, status, user. */
  meta?(): unknown
  /** Header bar, left: breadcrumb or title block. Defaults to `title`. */
  header?(): unknown
  /** Header bar, right: filters, buttons. */
  actions?(): unknown
  sidebar?(): unknown
}>()
</script>

<template>
  <div class="sample-shell" :style="{ '--shell-sidebar': `${sidebarWidth}px` }">
    <!-- Landmarks: the strip is the banner, the sidebar is complementary, the header bar and the
         content share <main>, so everything on the screen sits inside a landmark. -->
    <header class="sample-shell__strip">
      <div class="sample-shell__strip-start">
        <RLogo v-if="mark !== 'none'" :brand="mark" variant="mark" :size="11" label="" />
        <span class="sample-shell__product">{{ product }}</span>
        <slot name="strip" />
      </div>
      <div class="sample-shell__strip-end"><slot name="meta" /></div>
    </header>
    <div class="sample-shell__frame" :class="{ 'has-sidebar': !!$slots.sidebar }">
      <aside v-if="$slots.sidebar" class="sample-shell__sidebar"><slot name="sidebar" /></aside>
      <main class="sample-shell__main">
        <div v-if="title || $slots.header || $slots.actions" class="sample-shell__header">
          <div class="sample-shell__header-start">
            <slot name="header"><h1 class="sample-shell__title">{{ title }}</h1></slot>
          </div>
          <div class="sample-shell__header-end"><slot name="actions" /></div>
        </div>
        <div class="sample-shell__content" :class="`sample-shell__content--${padding}`">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

<style>
.sample-shell {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  background: var(--r-bg-canvas);
  color: var(--r-text);
}

.sample-shell__strip {
  position: sticky;
  top: 0;
  z-index: var(--r-z-sticky);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: 32px;
  padding: 0 16px;
  border-bottom: 1px solid var(--r-border);
  background: var(--r-bg-surface);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
  white-space: nowrap;
}

.sample-shell__strip-start,
.sample-shell__strip-end {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  overflow: hidden;
}

/* On narrow screens the strip clips its tail instead of widening the page. */
.sample-shell__strip-start {
  flex: 1 1 auto;
}

.sample-shell__strip-end {
  flex: 0 1 auto;
  color: var(--r-text-tertiary);
}

.sample-shell__product {
  flex: none;
}

.sample-shell__frame {
  display: grid;
  flex: 1;
  grid-template-columns: minmax(0, 1fr);
  min-height: 0;
}

.sample-shell__frame.has-sidebar {
  grid-template-columns: var(--shell-sidebar) minmax(0, 1fr);
}

.sample-shell__sidebar {
  position: sticky;
  top: 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: calc(100dvh - 32px);
  padding: 16px 12px;
  overflow-y: auto;
  border-right: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}

.sample-shell__main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.sample-shell__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 24px;
  min-height: 56px;
  padding: 10px 24px;
  border-bottom: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}

.sample-shell__header-start,
.sample-shell__header-end {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  min-width: 0;
}

.sample-shell__title {
  font-size: var(--r-text-xl);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-tight);
  line-height: 1.2;
}

.sample-shell__content {
  flex: 1;
  min-width: 0;
}
.sample-shell__content--sm {
  padding: 16px;
}
.sample-shell__content--md {
  padding: 24px;
}

@media (max-width: 1023px) {
  .sample-shell__frame.has-sidebar {
    grid-template-columns: minmax(0, 1fr);
  }
  .sample-shell__sidebar {
    display: none;
  }
}

@media (max-width: 640px) {
  .sample-shell__content--md {
    padding: 16px;
  }
  .sample-shell__header {
    padding: 10px 16px;
  }
}
</style>
