<script setup lang="ts">
/**
 * Sample 29, now · Organization settings for Kopra Labs on Simpul. The four sections of forms
 * and the settings tree are gone: Raka says what should change, Simpul answers with what it
 * understood, and the change set waits in "Needs you" as a diff (current → new, who it
 * reaches, what was filled in) with one brand commit. Ownership and deletion wait for a hold or
 * a typed name. The state worth a glance sits on top; every change, who asked and who approved,
 * sits in the settings history with Revert.
 */
import { computed, nextTick, ref } from 'vue'
import { RStatus, type StatusTone } from '@/design-system'
import { DeskComposer, DeskShell, DeskThread, DeskTrail, DeskZone, count, useDesk } from '../_kit/desk'
import ChangeSetPanel from './parts/ChangeSetPanel.vue'
import DeleteDecision from './parts/DeleteDecision.vue'
import ReminderDecision from './parts/ReminderDecision.vue'
import StateTile from './parts/StateTile.vue'
import ThreadCard from './parts/ThreadCard.vue'
import TransferDecision from './parts/TransferDecision.vue'
import { cost, footprint, org as profile, regionCity, scene, shiftTime, zoneAbbr, zoneShift, type Role, type SessionLength } from './data'
import { createOrg, firstOf, nameOf } from './model'
import { createTalk } from './script'

const org = createOrg()
const talk = createTalk(org)
const desk = useDesk({
  agent: 'Simpul',
  start: scene.start,
  opening: talk.opening,
  chips: talk.openingChips,
  respond: talk.respond,
})
talk.bind(desk)

/** The scene's clock: the time of the latest line in the thread (WIB). */
const now = computed(() => desk.messages.value[desk.messages.value.length - 1]?.at ?? scene.start)
/** The strip reads it in the organization's saved timezone, as the Then screen does. */
const zone = computed(() => zoneAbbr(org.state.timezone))
const clock = computed(() => shiftTime(now.value, zoneShift(org.state.timezone)))

const costLine = (list: { value: number; unit: string }[]) => list.map((c) => `${c.value} ${c.unit}`).join(' · ')

/* ── State: the few readings worth a glance ─────────────────────────────────────────── */

const ROLE_WORDS: [Role, string, string][] = [
  ['owner', 'owner', 'owners'],
  ['admin', 'admin', 'admins'],
  ['developer', 'developer', 'developers'],
  ['billing', 'billing', 'billing'],
  ['viewer', 'viewer', 'viewers'],
]

const SESSION_SHORT: Record<SessionLength, string> = { '8h': '8-hour', '24h': '24-hour', '7d': '7-day', '30d': '30-day' }

const tiles = computed(() => {
  const s = org.facts.value
  const st = org.state
  // A non-breaking space keeps each count with its word when the line wraps.
  const roles = ROLE_WORDS.filter(([r]) => s.roles[r] > 0)
    .map(([r, one, many]) => `${s.roles[r]} ${s.roles[r] === 1 ? one : many}`)
    .join(' · ')
  const reminded = org.reminder.value
  const twofactorStatus: { tone: StatusTone; label: string } = !s.missing.length
    ? { tone: 'success', label: 'All set up' }
    : reminded
      ? { tone: 'warning', label: `${s.missing.length} reminded ${reminded.at}` }
      : { tone: 'warning', label: `${s.missing.length} not set up` }
  return [
    {
      key: 'members',
      label: 'Members',
      value: String(s.members),
      of: [s.invited ? `${s.invited} invited` : '', s.suspended ? `${s.suspended} suspended` : ''].filter(Boolean).join(' · '),
      sub: roles,
      meter: { value: s.seats, max: scene.seats, label: `${s.seats} of ${scene.seats} seats in use`, text: `${s.seats} of ${scene.seats} seats` },
      changedAt: org.marks.members,
    },
    {
      key: 'twofactor',
      label: 'Two-factor',
      value: String(s.twofactorOn),
      of: `of ${s.active} active`,
      sub: st.twofactor ? 'Required for everyone since 12 Nov' : 'Optional: a password alone signs in',
      status: twofactorStatus,
      changedAt: org.marks.twofactor,
    },
    {
      key: 'signin',
      label: 'Sign-in',
      value: st.sso ? 'Single sign-on' : 'Password',
      sub: st.sso ? `${SESSION_SHORT[st.session]} sessions · ${scene.idp}` : `${SESSION_SHORT[st.session]} sessions · two-factor`,
      status: st.sso
        ? { tone: 'success' as StatusTone, label: `SSO required · policy v${st.policy}` }
        : { tone: 'neutral' as StatusTone, label: `SSO ready · tested 17 Nov` },
      changedAt: org.marks.signin,
    },
    {
      key: 'region',
      label: 'Data region',
      value: regionCity(st.region),
      sub: `${st.region.toUpperCase()} · new projects start here`,
      note: `${footprint.projects} projects · ${footprint.storage}`,
      changedAt: org.marks.region,
    },
  ]
})

/* ── Needs you ──────────────────────────────────────────────────────────────────────── */

const seats = computed(() => (org.pending.value ? { from: org.facts.value.seats, to: org.seatsAfter.value, of: scene.seats } : null))
const policy = computed(() => (org.pending.value ? { from: org.state.policy, to: org.policyAfter.value } : null))
const reminderNames = computed(() => org.facts.value.missing.map((m) => firstOf(m.id)))
const showReminder = computed(() => talk.needsReminder())
const waitingCount = computed(
  () => (org.pending.value ? 1 : 0) + (org.transferDraft.value ? 1 : 0) + (org.deletionDraft.value ? 1 : 0) + (showReminder.value ? 1 : 0),
)

const needsEl = ref<HTMLElement | null>(null)
const historyEl = ref<HTMLElement | null>(null)

/**
 * A decision acted on leaves the screen. If focus was on it, hand focus to the next decision's
 * control, or to the "nothing needs you" line, so it is never dropped on the page.
 */
function act(run: () => void) {
  const host = needsEl.value
  const active = document.activeElement
  const had = !!host && !!active && host.contains(active)
  run()
  if (!had) return
  nextTick(() => {
    const next = host?.querySelector<HTMLElement>('[data-decision] [data-primary]') ?? host?.querySelector<HTMLElement>('[data-empty]')
    next?.focus()
  })
}

/** Revert in the history: the button becomes "Reverted 14:31"; focus stays on that line. */
function revert(id: string) {
  const host = historyEl.value
  const index = org.history.value.findIndex((h) => h.id === id)
  const active = document.activeElement
  const had = !!host && !!active && host.contains(active)
  talk.revertFromTrail(id)
  if (!had) return
  nextTick(() => {
    const row = host?.querySelectorAll<HTMLElement>('.desk-trail__row')[index]
    if (!row) return
    row.tabIndex = -1
    row.focus()
  })
}

const todayCount = computed(() => org.history.value.filter((h) => h.stamp === 1118 && h.kind !== 'event').length)
</script>

<template>
  <DeskShell
    product="Simpul"
    title="Organization settings"
    agent="Simpul"
    :agent-status="`Watching ${org.facts.value.members} members`"
  >
    <template #strip>
      <span class="s-orgnow-strip">
        <span class="s-orgnow-strip__sep" aria-hidden="true">/</span>
        <span>{{ org.state.name }}</span>
        <span class="s-orgnow-strip__sep s-orgnow-strip__wide" aria-hidden="true">·</span>
        <span class="s-orgnow-strip__quiet s-orgnow-strip__wide">{{ profile.plan }} plan</span>
        <span class="s-orgnow-strip__cost">
          <span class="s-orgnow-strip__era">Then</span>
          <span>{{ costLine(cost.then) }}</span>
          <span class="s-orgnow-strip__era">Now</span>
          <span>{{ costLine(cost.now) }}</span>
        </span>
      </span>
    </template>
    <template #meta>
      <RStatus v-if="org.deletionOpen.value" tone="danger" size="sm" :label="`Deletion ${scene.deletionOn.replace(' 2026', '')}`" />
      <span class="s-orgnow-strip__wide">Raka Wibisono · owner</span>
      <span class="s-orgnow-strip__wide">{{ profile.id }}</span>
      <span class="s-orgnow-strip__clock">{{ scene.date }} {{ clock }} {{ zone }}</span>
    </template>

    <template #thread>
      <DeskThread :messages="desk.messages.value" :writing="desk.writing.value" agent="Simpul">
        <template #card="{ message }">
          <ThreadCard :message="message" :org="org" />
        </template>
      </DeskThread>
    </template>
    <template #composer>
      <DeskComposer
        label="Message Simpul"
        placeholder="Say what should change"
        :suggestions="desk.chips.value"
        :busy="desk.writing.value"
        @send="desk.send"
      />
    </template>

    <DeskZone index="01" label="State" :meta="`As of ${clock} ${zone}`" ruled :columns="4">
      <StateTile
        v-for="tile in tiles"
        :key="tile.key"
        :label="tile.label"
        :value="tile.value"
        :of="tile.of || undefined"
        :sub="tile.sub"
        :changed-at="tile.changedAt"
        :status="tile.status"
        :meter="tile.meter"
        :note="tile.note"
      />
    </DeskZone>

    <DeskZone index="02" label="Needs you" :meta="waitingCount ? `${waitingCount} waiting` : 'Clear'">
      <div ref="needsEl" class="s-orgnow-needs">
        <ChangeSetPanel
          v-if="org.pending.value"
          :id="org.pending.value.id"
          :rows="org.diff.value"
          :asked-at="org.pending.value.askedAt"
          :seats="seats"
          :policy="policy"
          @apply="act(talk.approveFromSurface)"
          @discard="act(talk.discardFromSurface)"
        />
        <TransferDecision
          v-if="org.transferDraft.value"
          :to="nameOf(org.transferDraft.value)"
          :first="firstOf(org.transferDraft.value)"
          owner="Raka Wibisono"
          @done="act(talk.transferFromSurface)"
          @cancel="act(talk.closeTransferFromSurface)"
        />
        <DeleteDecision
          v-if="org.deletionDraft.value"
          :name="org.state.name"
          :footprint="footprint"
          :on="scene.deletionOn"
          @confirm="act(talk.deleteFromSurface)"
          @cancel="act(talk.closeDeletionFromSurface)"
        />
        <ReminderDecision v-if="showReminder" :names="reminderNames" @send="act(talk.remindFromSurface)" />
        <p v-if="!waitingCount" class="s-orgnow-empty" tabindex="-1" data-empty>
          Nothing needs you. Say what should change; it comes back here as a change set to approve.
        </p>
      </div>
    </DeskZone>

    <DeskZone index="03" label="Settings history" :meta="todayCount ? `${count(todayCount, 'change')} today` : 'Who asked, who approved'">
      <div ref="historyEl">
        <DeskTrail :items="org.history.value" label="Settings history of Kopra Labs" @revert="revert" />
      </div>
    </DeskZone>
  </DeskShell>
</template>

<style scoped>
.s-orgnow-strip {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  color: var(--r-text-secondary);
}

.s-orgnow-strip__sep {
  color: var(--r-text-disabled);
}

.s-orgnow-strip__quiet {
  color: var(--r-text-tertiary);
}

/* What the job costs, Then against Now: a quiet mono line after a rule. */
.s-orgnow-strip__cost {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-left: 8px;
  padding-left: 16px;
  border-left: 1px solid var(--r-border);
  color: var(--r-text-tertiary);
  font-weight: var(--r-weight-medium);
}

.s-orgnow-strip__era {
  color: var(--r-text-secondary);
  font-weight: var(--r-weight-semibold);
}

.s-orgnow-strip__era + span + .s-orgnow-strip__era {
  margin-left: 8px;
}

.s-orgnow-strip__clock {
  font-variant-numeric: tabular-nums;
}

.s-orgnow-needs {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.s-orgnow-empty {
  padding: 16px 14px;
  border: 1px dashed var(--r-border-strong);
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
}

.s-orgnow-empty:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: 2px;
}

@media (max-width: 1279px) {
  .s-orgnow-strip__cost {
    display: none;
  }
}

@media (max-width: 720px) {
  .s-orgnow-strip__wide {
    display: none;
  }
}
</style>
