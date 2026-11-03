<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Bell, ScrollText, Settings2, ShieldCheck, TriangleAlert, Users } from 'lucide-vue-next'
import {
  RAvatar,
  RBreadcrumb,
  RButton,
  RKbd,
  RNavItem,
  RStatus,
  prefersReducedMotion,
  useHotkey,
  useToast,
} from '@/design-system'
import SampleShell from '../_kit/SampleShell.vue'
import GeneralSection from './parts/GeneralSection.vue'
import MembersSection from './parts/MembersSection.vue'
import SecuritySection from './parts/SecuritySection.vue'
import NotificationsSection from './parts/NotificationsSection.vue'
import DangerSection from './parts/DangerSection.vue'
import SummaryRail from './parts/SummaryRail.vue'
import { org, type SectionId } from './data'
import { provideSettings, sectionDomId } from './state'

const store = provideSettings()
const { members, changes, errors } = store
const toast = useToast()

/* ── Clock in the strip: the saved timezone, ticking by the minute ───────── */
const tick = ref(0)
let clockTimer = 0
const clock = computed(() => store.clock(tick.value))

/* ── Sections and the scroll-spy ─────────────────────────────────────────── */
const sections: { id: SectionId; label: string; icon: typeof Settings2 }[] = [
  { id: 'general', label: 'General', icon: Settings2 },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'security', label: 'Security', icon: ShieldCheck },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'danger', label: 'Danger zone', icon: TriangleAlert },
]

const SECTION_OF: Record<string, SectionId> = {
  name: 'general',
  slug: 'general',
  description: 'general',
  timezone: 'general',
  locale: 'general',
  region: 'general',
  sso: 'security',
  require2fa: 'security',
  session: 'security',
  minPassword: 'security',
  digest: 'notifications',
  webhook: 'notifications',
}

const sectionOf = (key: string): SectionId =>
  key.startsWith('role:') ? 'members' : key.startsWith('notify:') ? 'notifications' : SECTION_OF[key] ?? 'general'

const unsavedIn = computed(() => {
  const set = new Set<SectionId>()
  for (const c of changes.value) set.add(sectionOf(c.key))
  return set
})

const dirty = computed(() => changes.value.length > 0)
/** Space taken at the top of the viewport: the 32px strip, plus the save bar while it shows. */
const offset = computed(() => (dirty.value ? 32 + 48 + 20 : 32 + 20))

const active = ref<SectionId>('general')
let observer: IntersectionObserver | null = null
let locked = false
let unlockTimer = 0
const visible = new Map<string, boolean>()

/** The section under the top band wins; at the very end of the page the last one does. */
function updateActive() {
  if (locked) return
  const doc = document.scrollingElement ?? document.documentElement
  if (window.scrollY > 0 && window.scrollY + window.innerHeight >= doc.scrollHeight - 4) {
    active.value = sections[sections.length - 1].id
    return
  }
  const first = sections.find((s) => visible.get(sectionDomId(s.id)))
  if (first) active.value = first.id
}

function observe() {
  observer?.disconnect()
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) visible.set(entry.target.id, entry.isIntersecting)
      updateActive()
    },
    { rootMargin: `-${offset.value + 24}px 0px -55% 0px`, threshold: 0 },
  )
  for (const s of sections) {
    const el = document.getElementById(sectionDomId(s.id))
    if (el) observer.observe(el)
  }
}

function onScroll() {
  updateActive()
}

function unlock() {
  locked = false
  window.clearTimeout(unlockTimer)
}

function go(id: SectionId) {
  const el = document.getElementById(sectionDomId(id))
  if (!el) return
  active.value = id
  locked = true
  window.clearTimeout(unlockTimer)
  unlockTimer = window.setTimeout(unlock, 900)
  window.addEventListener('scrollend', unlock, { once: true })
  el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
  el.focus({ preventScroll: true })
}

onMounted(() => {
  observe()
  window.addEventListener('scroll', onScroll, { passive: true })
  clockTimer = window.setInterval(() => (tick.value += 1), 30000)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('scrollend', unlock)
  window.clearInterval(clockTimer)
  window.clearTimeout(unlockTimer)
})

watch(offset, () => nextTick(observe))

/* ── Save bar ──────────────────────────────────────────────────────────────── */
const changeSummary = computed(() => {
  const labels = changes.value.map((c) => c.label)
  return labels.length > 3 ? `${labels.slice(0, 3).join(' · ')} · ${labels.length - 3} more` : labels.join(' · ')
})

function save() {
  if (!dirty.value) return
  if (errors.value.length) {
    toast.show({ title: 'Nothing saved yet', body: errors.value.join(' '), tone: 'danger' })
    go('general')
    return
  }
  const done = store.save()
  toast.show({
    title: 'Settings saved',
    body: `${done.length} change${done.length === 1 ? ' is' : 's are'} live for ${store.baseline.value.name}. The audit log has the details.`,
    tone: 'success',
  })
}

function discard() {
  const count = changes.value.length
  store.discard()
  toast.show({ title: 'Changes discarded', body: `${count} change${count === 1 ? '' : 's'} reverted to the saved settings.` })
}

useHotkey('mod+s', save, { enabled: dirty })

function openAudit() {
  toast.show({ title: 'Audit log', body: '2,148 events in the last 90 days, filtered to organization settings.' })
}
</script>

<template>
  <SampleShell product="Simpul">
    <template #strip>
      <span class="s-org-settings-strip">
        <span class="s-org-settings-strip__sep" aria-hidden="true">/</span>
        <span>{{ store.baseline.value.name }}</span>
        <span class="s-org-settings-strip__sep s-org-settings-strip__wide" aria-hidden="true">·</span>
        <span class="s-org-settings-strip__plan s-org-settings-strip__wide">Scale plan</span>
      </span>
    </template>
    <template #meta>
      <span class="s-org-settings-strip__wide">{{ org.id }}</span>
      <span class="s-org-settings-strip__clock">
        <span class="s-org-settings-strip__wide">{{ clock.date }}</span>
        {{ clock.time }} {{ clock.abbr }}
      </span>
    </template>
    <template #header>
      <div class="s-org-settings-head">
        <RBreadcrumb :items="[{ label: store.baseline.value.name }, { label: 'Settings' }]" />
        <h1 class="s-org-settings-title">Organization settings</h1>
      </div>
    </template>
    <template #actions>
      <RButton variant="ghost" size="sm" @click="openAudit">
        <template #leading><ScrollText /></template>
        Audit log
      </RButton>
    </template>

    <div class="s-org-settings" :class="{ 'is-dirty': dirty }" :style="{ '--s-org-settings-offset': `${offset}px` }">
      <Transition name="s-org-settings-bar">
        <div v-if="dirty" class="s-org-settings-savebar" data-theme="dark" role="region" aria-label="Unsaved changes">
          <div class="s-org-settings-savebar__state">
            <RStatus tone="signal" :label="`${changes.length} unsaved change${changes.length === 1 ? '' : 's'}`" />
            <p class="s-org-settings-savebar__list">
              <template v-if="errors.length">{{ errors.length === 1 ? 'One field needs attention' : `${errors.length} fields need attention` }}</template>
              <template v-else>{{ changeSummary }}</template>
            </p>
          </div>
          <div class="s-org-settings-savebar__actions">
            <RKbd :keys="['mod', 'S']" size="sm" class="s-org-settings-savebar__kbd" />
            <RButton variant="ghost" size="sm" @click="discard">Discard</RButton>
            <RButton tone="brand" size="sm" :disabled="errors.length > 0" @click="save">Save changes</RButton>
          </div>
        </div>
      </Transition>

      <div class="s-org-settings-layout">
        <nav class="s-org-settings-nav" aria-label="Settings sections">
          <p class="s-org-settings-nav__title">Settings</p>
          <div class="s-org-settings-nav__items">
            <RNavItem
              v-for="(s, i) in sections"
              :key="s.id"
              as="button"
              type="button"
              class="s-org-settings-nav__item"
              :label="s.label"
              :icon="s.icon"
              :badge="s.id === 'members' ? members.length : undefined"
              :active="active === s.id"
              @click="go(s.id)"
            >
              <template #trailing>
                <span v-if="unsavedIn.has(s.id)" class="s-org-settings-nav__unsaved" aria-label="Unsaved changes" />
                <span class="s-org-settings-nav__index" aria-hidden="true">{{ String(i + 1).padStart(2, '0') }}</span>
              </template>
            </RNavItem>
          </div>
          <div class="s-org-settings-nav__foot">
            <RAvatar :name="org.owner" size="sm" decorative />
            <div class="s-org-settings-nav__who">
              <span class="s-org-settings-nav__name">{{ org.owner }}</span>
              <span class="s-org-settings-nav__role">Owner · signed in</span>
            </div>
          </div>
        </nav>

        <div class="s-org-settings-sections">
          <GeneralSection />
          <MembersSection />
          <SecuritySection />
          <NotificationsSection />
          <DangerSection />
        </div>

        <SummaryRail class="s-org-settings-aside" @audit="openAudit" />
      </div>
    </div>
  </SampleShell>
</template>

<style scoped>
.s-org-settings-strip {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--r-text-secondary);
}

.s-org-settings-strip__sep {
  color: var(--r-text-disabled);
}

.s-org-settings-strip__plan {
  color: var(--r-text-tertiary);
}

.s-org-settings-head {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.s-org-settings-title {
  font-size: var(--r-text-xl);
  font-weight: var(--r-weight-semibold);
  line-height: 1.2;
  letter-spacing: var(--r-tracking-tight);
}

/* ── Save bar: a dark island under the strip while the form is dirty ────────── */
.s-org-settings-savebar {
  position: sticky;
  z-index: var(--r-z-sticky);
  top: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px 24px;
  min-height: 48px;
  margin: -24px -24px 20px;
  padding: 8px 24px;
  border-bottom: 1px solid var(--r-border-strong);
  background: var(--r-bg-raised);
}

.s-org-settings-savebar__state {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}

.s-org-settings-savebar__list {
  overflow: hidden;
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.s-org-settings-savebar__actions {
  display: flex;
  flex: none;
  align-items: center;
  gap: 8px;
}

.s-org-settings-savebar__kbd {
  margin-right: 4px;
}

.s-org-settings-bar-enter-active,
.s-org-settings-bar-leave-active {
  transition:
    opacity var(--r-duration-fast) var(--r-ease-out),
    transform var(--r-duration-fast) var(--r-ease-out);
}

.s-org-settings-bar-enter-from,
.s-org-settings-bar-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* ── Layout: section nav · form · rail ──────────────────────────────────────── */
.s-org-settings {
  padding-bottom: 56px;
}

.s-org-settings-layout {
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr) 300px;
  align-items: start;
  gap: 24px;
}

.s-org-settings-nav {
  position: sticky;
  top: var(--s-org-settings-offset);
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  transition: top var(--r-duration-base) var(--r-ease-out);
}

.s-org-settings-nav__title {
  padding: 0 10px 4px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.s-org-settings-nav__items {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.s-org-settings-nav__index {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
}

.s-org-settings-nav__unsaved {
  flex: none;
  width: 6px;
  height: 6px;
  border-radius: var(--r-radius-round);
  background: var(--r-signal);
}

.s-org-settings-nav__foot {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 16px;
  padding: 12px 10px 0;
  border-top: 1px solid var(--r-border);
}

.s-org-settings-nav__who {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.s-org-settings-nav__name {
  overflow: hidden;
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.s-org-settings-nav__role {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
  line-height: 14px;
  text-transform: uppercase;
}

.s-org-settings-sections {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.s-org-settings-sections > :deep(.s-org-settings-section) {
  scroll-margin-top: var(--s-org-settings-offset);
}

.s-org-settings-sections > :deep(.s-org-settings-section:focus) {
  outline: none;
}

.s-org-settings-sections > :deep(.s-org-settings-section:focus-visible) {
  outline: 2px solid var(--r-focus);
  outline-offset: 2px;
}

@media (min-height: 760px) {
  .s-org-settings-aside {
    position: sticky;
    top: var(--s-org-settings-offset);
    transition: top var(--r-duration-base) var(--r-ease-out);
  }
}

@media (max-width: 1279px) {
  .s-org-settings-layout {
    grid-template-columns: 200px minmax(0, 1fr);
  }
  .s-org-settings-aside {
    position: static;
    grid-column: 2;
  }
}

@media (max-width: 899px) {
  .s-org-settings-layout {
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }
  .s-org-settings-aside {
    grid-column: auto;
  }
  .s-org-settings-nav {
    position: static;
  }
  .s-org-settings-nav__title,
  .s-org-settings-nav__foot {
    display: none;
  }
  .s-org-settings-nav__items {
    flex-direction: row;
    gap: 4px;
    margin: 0 -16px;
    padding: 0 16px 4px;
    overflow-x: auto;
    border-bottom: 1px solid var(--r-border);
  }
  .s-org-settings-nav__item {
    flex: none;
  }
}

@media (max-width: 640px) {
  .s-org-settings-strip__wide {
    display: none;
  }
  .s-org-settings-savebar {
    margin: -16px -16px 16px;
    padding: 8px 16px;
  }
  .s-org-settings-savebar__list,
  .s-org-settings-savebar__kbd {
    display: none;
  }
}
</style>
