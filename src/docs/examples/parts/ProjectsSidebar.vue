<script setup lang="ts">
import { ref } from 'vue'
import {
  Banknote,
  BookOpen,
  Building2,
  ChevronDown,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Settings,
  Store,
  Truck,
  UserRound,
  Users,
  Wallet,
} from 'lucide-vue-next'
import { RNavItem } from '@/design-system'
import AppMark from './AppMark.vue'

const projectOpen = ref(true)

const main = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Company', icon: Building2 },
  { label: 'Client', icon: UserRound },
  { label: 'Vendor', icon: Store },
]
const financial = [
  { label: 'Asset', icon: Wallet },
  { label: 'Journal', icon: BookOpen },
  { label: 'Supply', icon: Truck },
  { label: 'Payroll', icon: Banknote },
]
</script>

<template>
  <div class="ps">
    <div class="ps__logo">
      <AppMark glyph="neraca" tone="brand" />
      <span>Neraca</span>
    </div>

    <nav class="ps__nav" aria-label="Main menu">
      <p class="ps__title"><span class="r-index" aria-hidden="true">01</span> Main menu</p>
      <RNavItem v-for="item in main" :key="item.label" as="button" type="button" :icon="item.icon" :label="item.label" />
      <RNavItem
        as="button"
        type="button"
        :icon="FolderKanban"
        label="Project"
        :aria-expanded="projectOpen"
        aria-controls="ps-project-links"
        @click="projectOpen = !projectOpen"
      >
        <template #trailing>
          <ChevronDown class="ps__chevron" :class="{ 'is-open': projectOpen }" />
        </template>
      </RNavItem>
      <div v-show="projectOpen" id="ps-project-links" class="ps__sub">
        <RNavItem as="a" href="#/examples/projects" label="Project list" variant="solid" active />
        <RNavItem as="button" type="button" label="Project level" />
        <RNavItem as="button" type="button" label="Project category" />
      </div>
      <RNavItem as="button" type="button" :icon="Users" label="Employee" />
    </nav>

    <nav class="ps__nav" aria-label="Financial">
      <p class="ps__title"><span class="r-index" aria-hidden="true">02</span> Financial</p>
      <RNavItem v-for="item in financial" :key="item.label" as="button" type="button" :icon="item.icon" :label="item.label" />
    </nav>

    <div class="ps__foot">
      <RNavItem as="button" type="button" :icon="Settings" label="Settings" />
      <RNavItem as="button" type="button" :icon="LogOut" label="Log out" />
    </div>
  </div>
</template>

<style>
.ps {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-height: 100%;
}

.ps__logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 8px;
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-tight);
}

.ps__nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ps__title {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 0 8px 8px;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.ps__chevron {
  width: 16px;
  height: 16px;
  margin-left: auto;
  color: var(--r-text-tertiary);
  transition: transform var(--r-duration-base) var(--r-ease-out);
}
.ps__chevron.is-open {
  transform: rotate(180deg);
}

.ps__sub {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 2px 0 4px 17px;
  padding-left: 10px;
  border-left: 1px solid var(--r-border);
}

.ps__sub .r-nav-item {
  font-size: var(--r-text-sm);
}

.ps__foot {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--r-border);
}
</style>
