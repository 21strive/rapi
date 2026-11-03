<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Menu, Search, X } from 'lucide-vue-next'
import { RIconButton, RKbd, RLogo, useEscape, useFocusTrap, useHotkey, useLayer, useScrollLock } from '@/design-system'
import DocsSidebar from './DocsSidebar.vue'
import ThemeSwitch from './ThemeSwitch.vue'
import RapiLogo from './RapiLogo.vue'
import { allLinks } from '../nav'
import { paletteOpen } from '../palette'

defineSlots<{ default?(): unknown }>()

const route = useRoute()
const drawerOpen = ref(false)

// "FOUNDATIONS / COLOUR" in the top strip, like the running header of the brand book.
const crumb = computed(() => {
  const link = allLinks.find((l) => l.path === route.path)
  if (!link) return route.meta.title ? [String(route.meta.title)] : []
  return link.group ? [link.group, link.title] : [link.title]
})
const drawer = ref<HTMLElement | null>(null)
const main = ref<HTMLElement | null>(null)

watch(
  () => route.path,
  () => (drawerOpen.value = false),
)

const layer = useLayer(drawerOpen)
useScrollLock(drawerOpen)
useFocusTrap(drawer, drawerOpen, { isTop: layer.isTop })
useEscape(drawerOpen, () => (drawerOpen.value = false), layer.isTop)

// "/" opens search, like most docs sites.
useHotkey('/', () => (paletteOpen.value = true))

function skipToContent() {
  main.value?.focus()
}
</script>

<template>
  <div class="docs">
    <a class="docs-skip" href="#main" @click.prevent="skipToContent">Skip to content</a>

    <aside class="docs-sidebar">
      <RouterLink to="/" class="docs-brand" aria-label="Rapi, introduction">
        <RapiLogo />
        <span class="docs-brand__version">0.2</span>
      </RouterLink>
      <DocsSidebar />
      <div class="docs-sidebar__foot">
        <RLogo brand="21strive" variant="mark" :size="12" label="" />
        <p>The design language of 21&nbsp;Strive. <em>Rapi</em> is Indonesian for tidy.</p>
      </div>
    </aside>

    <div class="docs-body">
      <header class="docs-topbar">
        <RIconButton class="docs-topbar__menu" label="Open navigation" variant="ghost" @click="drawerOpen = true">
          <Menu />
        </RIconButton>
        <RouterLink to="/" class="docs-brand docs-topbar__brand" aria-label="Rapi, introduction">
          <RapiLogo />
        </RouterLink>
        <p class="docs-topbar__crumb" aria-hidden="true">
          <template v-for="(c, i) in crumb" :key="i"><span v-if="i" class="docs-topbar__sep">/</span>{{ c }}</template>
        </p>
        <button type="button" class="docs-search" aria-label="Search docs" @click="paletteOpen = true">
          <Search />
          <span class="docs-search__text">Search docs</span>
          <RKbd :keys="['mod', 'K']" size="sm" class="docs-search__kbd" />
        </button>
        <div class="docs-topbar__actions">
          <ThemeSwitch />
        </div>
      </header>

      <main id="main" ref="main" class="docs-main" tabindex="-1">
        <slot />
      </main>
    </div>

    <Teleport to="body">
      <Transition name="docs-drawer">
        <div v-if="drawerOpen" class="docs-drawer" @pointerdown.self="drawerOpen = false">
          <div ref="drawer" class="docs-drawer__panel" role="dialog" aria-modal="true" aria-label="Navigation">
            <div class="docs-drawer__head">
              <RapiLogo />
              <RIconButton label="Close navigation" variant="ghost" size="sm" @click="drawerOpen = false">
                <X />
              </RIconButton>
            </div>
            <DocsSidebar />
            <div class="docs-drawer__prefs">
              <ThemeSwitch />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style>
.docs {
  display: flex;
  min-height: 100dvh;
}

.docs-skip {
  position: fixed;
  z-index: 300;
  top: 8px;
  left: 8px;
  padding: 8px 12px;
  background: var(--r-ink);
  color: var(--r-on-ink);
  font-weight: var(--r-weight-medium);
  text-decoration: none;
  transform: translateY(-160%);
  transition: transform var(--r-duration-base) var(--r-ease-out);
}
.docs-skip:focus {
  transform: none;
}

.docs-sidebar {
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  gap: 28px;
  flex-shrink: 0;
  width: 256px;
  height: 100dvh;
  padding: 0 12px 20px;
  overflow-y: auto;
  border-right: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}

.docs-sidebar > * {
  flex-shrink: 0;
}

.docs-sidebar__foot {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: auto;
  padding: 16px 8px 0;
  border-top: 1px solid var(--r-border);
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  line-height: 1.5;
}
.docs-sidebar__foot .r-logo {
  color: var(--r-text);
}

.docs-brand {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  height: 56px;
  margin: 0 -12px;
  padding: 0 20px;
  border-bottom: 1px solid var(--r-border);
  color: inherit;
  text-decoration: none;
}

.docs-brand__version {
  padding: 1px 5px;
  border: 1px solid var(--r-border-strong);
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.04em;
}

.docs-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.docs-topbar {
  position: sticky;
  z-index: var(--r-z-sticky);
  top: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  height: 56px;
  padding: 0 24px 0 40px;
  border-bottom: 1px solid var(--r-border);
  background: color-mix(in srgb, var(--r-bg-surface) 88%, transparent);
  backdrop-filter: blur(12px);
}

.docs-topbar__crumb {
  display: flex;
  gap: 8px;
  min-width: 0;
  margin-right: auto;
  overflow: hidden;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
  white-space: nowrap;
}

.docs-topbar__sep {
  color: var(--r-text-disabled);
}

.docs-topbar__menu,
.docs-topbar__brand {
  display: none;
}

.docs-search {
  display: flex;
  align-items: center;
  gap: 10px;
  width: min(320px, 100%);
  height: 32px;
  padding: 0 6px 0 10px;
  border: 1px solid var(--r-border);
  background: var(--r-bg-surface);
  color: var(--r-text-tertiary);
  font-size: var(--r-text-sm);
  cursor: pointer;
  transition: border-color var(--r-duration-fast) var(--r-ease-out);
}
.docs-search:hover {
  border-color: var(--r-border-strong);
}
.docs-search svg {
  width: 16px;
  height: 16px;
}
.docs-search__text {
  flex: 1;
  text-align: left;
}

.docs-topbar__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.docs-main {
  flex: 1;
  outline: none;
}

.docs-drawer {
  position: fixed;
  z-index: var(--r-z-modal);
  inset: 0;
  background: var(--r-bg-overlay);
}

.docs-drawer__panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: min(300px, 86vw);
  height: 100%;
  padding: 16px 14px 24px;
  overflow-y: auto;
  background: var(--r-bg-raised);
  box-shadow: var(--r-shadow-xl);
}

.docs-drawer__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: 6px;
}

.docs-drawer__prefs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: auto;
  padding: 16px 6px 0;
  border-top: 1px solid var(--r-border-subtle);
}

.docs-drawer-enter-active,
.docs-drawer-leave-active {
  transition: opacity var(--r-duration-base) var(--r-ease-out);
}
.docs-drawer-enter-active .docs-drawer__panel,
.docs-drawer-leave-active .docs-drawer__panel {
  transition: transform var(--r-duration-base) var(--r-ease-out);
}
.docs-drawer-enter-from,
.docs-drawer-leave-to {
  opacity: 0;
}
.docs-drawer-enter-from .docs-drawer__panel,
.docs-drawer-leave-to .docs-drawer__panel {
  transform: translateX(-100%);
}

@media (max-width: 1023px) {
  .docs-sidebar {
    display: none;
  }
  .docs-topbar {
    padding: 0 16px 0 10px;
  }
  .docs-topbar__menu,
  .docs-topbar__brand {
    display: inline-flex;
  }
  .docs-topbar__brand {
    align-self: center;
  }
  .docs-search {
    width: auto;
  }
  .docs-topbar__crumb {
    display: none;
  }
  .docs-topbar__brand {
    height: auto;
    margin: 0 auto 0 0;
    padding: 0;
    border: 0;
  }
}

@media (max-width: 640px) {
  .docs-topbar__actions {
    display: none;
  }
  .docs-search {
    width: 32px;
    justify-content: center;
    padding: 0;
  }
  .docs-search__text,
  .docs-search__kbd {
    display: none;
  }
}
</style>
