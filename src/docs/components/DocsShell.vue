<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Menu, Search, X } from 'lucide-vue-next'
import { RIconButton, RKbd, useEscape, useFocusTrap, useHotkey, useLayer, useScrollLock } from '@/design-system'
import DocsSidebar from './DocsSidebar.vue'
import ThemeSwitch from './ThemeSwitch.vue'
import BrandPicker from './BrandPicker.vue'
import RapiLogo from './RapiLogo.vue'
import { paletteOpen } from '../palette'

defineSlots<{ default?(): unknown }>()

const route = useRoute()
const drawerOpen = ref(false)
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
        <span class="docs-brand__version">0.1</span>
      </RouterLink>
      <DocsSidebar />
      <p class="docs-sidebar__foot">Rapi means tidy in Indonesian.</p>
    </aside>

    <div class="docs-body">
      <header class="docs-topbar">
        <RIconButton class="docs-topbar__menu" label="Open navigation" variant="ghost" @click="drawerOpen = true">
          <Menu />
        </RIconButton>
        <RouterLink to="/" class="docs-brand docs-topbar__brand" aria-label="Rapi, introduction">
          <RapiLogo />
        </RouterLink>
        <button type="button" class="docs-search" aria-label="Search docs" @click="paletteOpen = true">
          <Search />
          <span class="docs-search__text">Search docs</span>
          <RKbd :keys="['mod', 'K']" size="sm" class="docs-search__kbd" />
        </button>
        <div class="docs-topbar__actions">
          <ThemeSwitch />
          <BrandPicker />
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
              <BrandPicker />
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
  border-radius: var(--r-radius-md);
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
  gap: 24px;
  flex-shrink: 0;
  width: 264px;
  height: 100dvh;
  padding: 20px 16px 24px;
  overflow-y: auto;
  border-right: 1px solid var(--r-border-subtle);
}

.docs-sidebar__foot {
  margin-top: auto;
  padding: 0 10px;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.docs-brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  align-self: flex-start;
  padding: 4px 10px 4px 6px;
  border-radius: var(--r-radius-md);
  color: inherit;
  text-decoration: none;
}

.docs-brand__version {
  padding: 2px 6px;
  border-radius: var(--r-radius-xs);
  background: var(--r-bg-hover);
  color: var(--r-text-tertiary);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
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
  height: 64px;
  padding: 0 32px;
  border-bottom: 1px solid var(--r-border-subtle);
  background: color-mix(in srgb, var(--r-bg-canvas) 82%, transparent);
  backdrop-filter: saturate(1.4) blur(12px);
}

.docs-topbar__menu,
.docs-topbar__brand {
  display: none;
}

.docs-search {
  display: flex;
  align-items: center;
  gap: 10px;
  width: min(360px, 100%);
  height: 38px;
  padding: 0 8px 0 12px;
  border: 1px solid var(--r-border);
  border-radius: var(--r-radius-md);
  background: var(--r-bg-surface);
  box-shadow: var(--r-shadow-xs);
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
  .docs-search {
    width: auto;
    margin-left: auto;
  }
}

@media (max-width: 640px) {
  .docs-topbar__actions {
    display: none;
  }
  .docs-search {
    width: 40px;
    justify-content: center;
    padding: 0;
  }
  .docs-search__text,
  .docs-search__kbd {
    display: none;
  }
}
</style>
