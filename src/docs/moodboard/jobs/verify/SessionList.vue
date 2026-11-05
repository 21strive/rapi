<script setup lang="ts">
/**
 * Every device or key that can act as you, with where and when it was last seen. Spotting the one
 * you don't recognise takes a look; signing it out takes one press, and the latest one can be
 * undone for a few seconds before it is final.
 */
import { computed, ref, type Component } from 'vue'
import { Globe, KeyRound, Laptop, Smartphone, Tablet, UserRound } from 'lucide-vue-next'
import { RBadge, RButton, RStatus } from '@/design-system'
import { focusAfter, stamp, useCountdown } from './shared'

interface Device {
  id: string
  kind: 'phone' | 'laptop' | 'tablet' | 'key' | 'browser' | 'person'
  name: string
  place: string
  seen: string
  ip?: string
  current?: boolean
  /** A quiet hint on why it may be worth a look: "Not used in 30 days". */
  note?: string
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    devices: Device[]
    /** "Sign out", "Revoke", "Remove". */
    action?: string
    /** Past tense for the record: "Signed out", "Revoked", "Removed". */
    actioned?: string
    /** "Sign out all others". */
    allAction?: string
    /** list 2x2/2x1 · table 3x2. */
    layout?: 'list' | 'table'
  }>(),
  { action: 'Sign out', actioned: 'Signed out', layout: 'list' },
)

const icons: Record<Device['kind'], Component> = {
  phone: Smartphone,
  laptop: Laptop,
  tablet: Tablet,
  key: KeyRound,
  browser: Globe,
  person: UserRound,
}

const gone = ref<Record<string, string>>({})
const last = ref<string[]>([])
const root = ref<HTMLElement | null>(null)

const { left, start, stop } = useCountdown(8, () => {
  last.value = []
})

function revoke(ids: string[]) {
  const at = stamp('WIB', false)
  const next = { ...gone.value }
  for (const id of ids) next[id] = at
  gone.value = next
  last.value = ids
  start()
  if (ids.length === 1) focusAfter(root.value, `[data-row="${ids[0]}"] .sessions__undo`)
}

function undo() {
  const ids = last.value
  const next = { ...gone.value }
  for (const id of ids) delete next[id]
  gone.value = next
  last.value = []
  stop()
  if (ids.length === 1) focusAfter(root.value, `[data-row="${ids[0]}"] .r-button`)
}

/* The footer button signs out all others, then offers to take that back while it can. */
function allOrUndo() {
  if (last.value.length > 1) undo()
  else revoke(others.value)
}

const others = computed(() => props.devices.filter((d) => !d.current && !gone.value[d.id]).map((d) => d.id))
const active = computed(() => props.devices.filter((d) => !gone.value[d.id]).length)
</script>

<template>
  <div ref="root" class="mk sessions" :class="`sessions--${layout}`">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span class="sessions__count">{{ active }} active</span>
    </div>

    <ul class="sessions__list mk-grow">
      <li v-if="layout === 'table'" class="sessions__row sessions__headrow" aria-hidden="true">
        <span />
        <span>Device</span>
        <span>Where</span>
        <span>Address</span>
        <span>Last seen</span>
        <span />
      </li>
      <li v-for="d in devices" :key="d.id" class="sessions__row" :data-row="d.id" :class="{ 'is-gone': gone[d.id] }">
        <component :is="icons[d.kind]" :size="16" aria-hidden="true" class="sessions__icon" />
        <span class="sessions__name">
          <span class="sessions__device mk-truncate">{{ d.name }}</span>
          <RBadge v-if="d.current" size="sm" tone="brand">This device</RBadge>
        </span>
        <span class="sessions__meta mk-truncate">
          {{ d.place }} · {{ d.seen }}<template v-if="d.note"> · {{ d.note }}</template>
        </span>
        <template v-if="layout === 'table'">
          <span class="sessions__cell mk-truncate">{{ d.place }}</span>
          <span class="sessions__cell sessions__ip mk-truncate">{{ d.ip ?? '—' }}</span>
          <span class="sessions__cell sessions__ip mk-truncate">{{ d.seen }}</span>
        </template>
        <span class="sessions__act">
          <template v-if="gone[d.id]">
            <RStatus tone="neutral" :label="`${actioned} ${gone[d.id]}`" size="sm" />
            <button
              v-if="last.length === 1 && last.includes(d.id)"
              type="button"
              class="sessions__undo mk-reset"
              :aria-label="`Undo: ${d.name}`"
              @click="undo"
            >
              Undo · {{ left }} s
            </button>
          </template>
          <RButton v-else-if="!d.current" size="xs" variant="ghost" @click="revoke([d.id])">{{ action }}</RButton>
        </span>
      </li>
    </ul>

    <div v-if="allAction" class="sessions__foot" aria-live="polite">
      <span class="sessions__note">{{ last.length > 1 ? `${actioned} ${last.length} devices` : 'Signing out ends the session at once.' }}</span>
      <RButton
        size="xs"
        variant="outline"
        :tone="last.length > 1 ? 'neutral' : 'danger'"
        :disabled="last.length <= 1 && !others.length"
        @click="allOrUndo"
      >
        {{ last.length > 1 ? `Undo · ${left} s` : allAction }}
      </RButton>
    </div>
  </div>
</template>

<style scoped>
.sessions {
  gap: 8px;
  container-type: inline-size;
}

.sessions__count {
  flex: none;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
}

.sessions__list {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-top: 1px solid var(--r-border-subtle);
}

.sessions__row {
  display: grid;
  grid-template-columns: 16px minmax(0, 1fr) auto;
  grid-template-areas:
    'icon name act'
    'icon meta act';
  align-items: center;
  column-gap: 10px;
  row-gap: 1px;
  padding: 7px 0;
  border-bottom: 1px solid var(--r-border-subtle);
}

.sessions__icon {
  grid-area: icon;
  align-self: start;
  margin-top: 2px;
  color: var(--r-text-secondary);
}

.sessions__name {
  display: flex;
  grid-area: name;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.sessions__device {
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
}

.sessions__meta {
  grid-area: meta;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.sessions__act {
  display: flex;
  flex-direction: column;
  grid-area: act;
  align-items: flex-end;
  justify-content: center;
  gap: 2px;
  min-width: 0;
}

.sessions__undo {
  color: var(--r-brand-text);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
  cursor: pointer;
}
.sessions__undo:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.sessions__row.is-gone .sessions__device {
  color: var(--r-text-tertiary);
  text-decoration: line-through;
}

.sessions__row.is-gone .sessions__icon {
  color: var(--r-text-disabled);
}

.sessions__foot {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.sessions__note {
  min-width: 0;
  overflow: hidden;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Table: one line per device, mono addresses and times. Under 460px it folds back to the list. */
.sessions__headrow,
.sessions__cell {
  display: none;
}
@container (min-width: 460px) {
  .sessions--table .sessions__row {
    grid-template-columns: 16px minmax(0, 1.5fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 0.8fr) auto;
    grid-template-areas: none;
    padding: 6px 0;
  }
  .sessions--table .sessions__row > * {
    grid-area: auto;
  }
  .sessions--table .sessions__icon {
    align-self: center;
    margin-top: 0;
  }
  .sessions--table .sessions__meta {
    display: none;
  }
  .sessions--table .sessions__headrow {
    display: grid;
  }
  .sessions--table .sessions__cell {
    display: block;
  }
}
.sessions__headrow {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.sessions__cell {
  font-size: var(--r-text-xs);
}
.sessions__ip {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
}
</style>
