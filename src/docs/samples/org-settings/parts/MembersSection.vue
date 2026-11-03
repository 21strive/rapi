<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Search, UserPlus } from 'lucide-vue-next'
import {
  RAvatar,
  RBadge,
  RButton,
  RCard,
  RDialog,
  RInput,
  RSelect,
  RStatus,
  RTable,
  RTextarea,
  useToast,
  type TableColumn,
} from '@/design-system'
import { org, ownerRoleOptions, roleLabel, roleOptions, type Member, type MemberStatus, type Role } from '../data'
import { sectionDomId, useSettings } from '../state'

const { members, form, baseline, seatsUsed, invite } = useSettings()
const toast = useToast()

const query = ref('')

const ROLE_ORDER: Record<Role, number> = { owner: 0, admin: 1, developer: 2, billing: 3, viewer: 4 }
const STATUS_TONE: Record<MemberStatus, 'success' | 'brand' | 'danger'> = { active: 'success', invited: 'brand', suspended: 'danger' }

const columns: TableColumn[] = [
  { key: 'name', label: 'Member', sortable: true },
  { key: 'role', label: 'Role', width: '176px', sortable: true, sortValue: (row) => ROLE_ORDER[(form.roles[row.id] ?? row.role) as Role] },
  { key: 'status', label: 'Status', width: '124px', sortable: true },
  { key: 'twoFactor', label: '2FA', width: '76px' },
  { key: 'lastActive', label: 'Last active', width: '176px' },
]

const rows = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return members
  return members.filter((m) =>
    [m.name, m.email, roleLabel[form.roles[m.id] ?? m.role], m.status].some((field) => field.toLowerCase().includes(q)),
  )
})

const invitedCount = computed(() => members.filter((m) => m.status === 'invited').length)
const edited = (id: string) => form.roles[id] !== baseline.value.roles[id]

/* ── Invite ─────────────────────────────────────────────────────────────── */
const inviteOpen = ref(false)
const inviteEmails = ref('')
const inviteRole = ref<string | number | null>('developer')
const inviteNote = ref('')
const inviteTried = ref(false)

const EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i
const parsed = computed(() =>
  Array.from(
    new Set(
      inviteEmails.value
        .split(/[\s,;]+/)
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
    ),
  ),
)
const seatsLeft = computed(() => org.seats - seatsUsed.value)

const inviteError = computed(() => {
  if (!inviteTried.value) return ''
  const list = parsed.value
  if (!list.length) return 'Add at least one email address.'
  const invalid = list.filter((e) => !EMAIL.test(e))
  if (invalid.length) return `${invalid.length === 1 ? 'This address is' : 'These addresses are'} not valid: ${invalid.join(', ')}`
  const known = list.filter((e) => members.some((m) => m.email === e))
  if (known.length) return `Already in Kopra Labs: ${known.join(', ')}`
  if (list.length > seatsLeft.value) return `Only ${seatsLeft.value} seats are free on the Scale plan.`
  return ''
})

watch(inviteOpen, (open) => {
  if (open) return
  inviteEmails.value = ''
  inviteNote.value = ''
  inviteRole.value = 'developer'
  inviteTried.value = false
})

function sendInvites() {
  inviteTried.value = true
  if (inviteError.value) return
  const added = invite(parsed.value, (inviteRole.value as Role) ?? 'developer')
  inviteOpen.value = false
  toast.show({
    title: added.length === 1 ? 'Invitation sent' : `${added.length} invitations sent`,
    body: `${added.length === 1 ? added[0].email : 'They'} can join until 25 Nov 2026.`,
    tone: 'success',
  })
}

function resend(member: Member) {
  toast.show({ title: 'Invitation sent again', body: `${member.email} has a fresh link until 25 Nov 2026.` })
}
</script>

<template>
  <RCard
    :id="sectionDomId('members')"
    as="section"
    tabindex="-1"
    class="s-org-settings-section"
    padding="none"
    index="02"
    eyebrow="Members"
    title="People and roles"
    title-as="h2"
    :subtitle="`${seatsUsed} of ${org.seats} seats in use on the Scale plan. Suspended members do not take a seat.`"
  >
    <template #actions>
      <div class="s-org-settings-members__tools">
        <RInput v-model="query" size="sm" type="search" placeholder="Search members" aria-label="Search members" class="s-org-settings-members__search" clearable>
          <template #leading><Search /></template>
        </RInput>
        <RButton size="sm" @click="inviteOpen = true">
          <template #leading><UserPlus /></template>
          Invite members
        </RButton>
      </div>
    </template>

    <RTable :columns="columns" :rows="rows" row-key="id" caption="Members of Kopra Labs">
      <template #cell-name="{ row }">
        <div class="s-org-settings-member">
          <RAvatar :name="row.name" size="sm" decorative />
          <div class="s-org-settings-member__text">
            <span class="s-org-settings-member__name">
              {{ row.name }}
              <span v-if="row.role === 'owner'" class="s-org-settings-member__you">You</span>
            </span>
            <span class="s-org-settings-member__email">{{ row.email }}</span>
          </div>
        </div>
      </template>
      <template #cell-role="{ row }">
        <div class="s-org-settings-member__role">
          <RSelect
            v-if="row.role === 'owner'"
            model-value="owner"
            :options="ownerRoleOptions"
            size="sm"
            disabled
            :aria-label="`Role of ${row.name}`"
            title="Transfer ownership in the danger zone"
          />
          <RSelect
            v-else
            v-model="form.roles[row.id]"
            :options="roleOptions"
            size="sm"
            :disabled="row.status === 'suspended'"
            :aria-label="`Role of ${row.name}`"
          />
          <span v-if="edited(row.id)" class="s-org-settings-member__edited" title="Unsaved change" aria-label="Unsaved change" />
        </div>
      </template>
      <template #cell-status="{ row }">
        <RBadge :tone="STATUS_TONE[row.status as MemberStatus]" size="sm" dot>{{ row.status }}</RBadge>
      </template>
      <template #cell-twoFactor="{ row }">
        <RStatus
          v-if="row.twoFactor !== null"
          size="sm"
          :tone="row.twoFactor ? 'success' : form.require2fa && row.status === 'active' ? 'warning' : 'neutral'"
          :label="row.twoFactor ? 'On' : 'Off'"
        />
        <span v-else class="s-org-settings-member__none" aria-label="Not set up yet">—</span>
      </template>
      <template #cell-lastActive="{ row }">
        <div class="s-org-settings-member__last">
          <span>{{ row.lastActive }}</span>
          <RButton v-if="row.status === 'invited'" size="xs" variant="ghost" @click="resend(row as Member)">Resend</RButton>
        </div>
      </template>
      <template #empty>
        <div class="s-org-settings-members__empty">No member matches “{{ query }}”.</div>
      </template>
    </RTable>

    <RDialog
      v-model:open="inviteOpen"
      eyebrow="Kopra Labs · Members"
      title="Invite members"
      :description="`Each accepted invitation takes a seat. ${seatsLeft} of ${org.seats} seats are free.`"
    >
      <form class="s-org-settings-invite" novalidate @submit.prevent="sendInvites">
        <RTextarea
          v-model="inviteEmails"
          label="Email addresses"
          placeholder="ayu.pratiwi@kopralabs.io, one per line or separated by commas"
          :rows="4"
          mono
          :error="inviteError"
          :hint="parsed.length ? `${parsed.length} address${parsed.length === 1 ? '' : 'es'}` : undefined"
        />
        <RSelect v-model="inviteRole" label="Role" :options="roleOptions" hint="Change it any time in the members table." />
        <RTextarea v-model="inviteNote" label="Note (optional)" placeholder="Shown at the top of the invitation email" :rows="2" :maxlength="200" />
      </form>
      <template #footer="{ close }">
        <RButton variant="ghost" @click="close">Cancel</RButton>
        <RButton tone="brand" @click="sendInvites">
          {{ parsed.length > 1 ? `Send ${parsed.length} invitations` : 'Send invitation' }}
        </RButton>
      </template>
    </RDialog>

    <template #footer>
      <p class="s-org-settings-members__foot">
        <span>{{ members.length }} members</span>
        <span>{{ seatsUsed }} seats in use</span>
        <span>{{ invitedCount }} invites pending</span>
      </p>
    </template>
  </RCard>
</template>

<style scoped>
.s-org-settings-members__tools {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.s-org-settings-members__search {
  width: 220px;
}

.s-org-settings-member {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.s-org-settings-member__text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.s-org-settings-member__name {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
  line-height: 16px;
}

.s-org-settings-member__you {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-medium);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.s-org-settings-member__email {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  line-height: 16px;
}

.s-org-settings-member__role {
  display: flex;
  align-items: center;
  gap: 8px;
}

.s-org-settings-member__role > :first-child {
  flex: 1;
  min-width: 0;
}

/* An unsaved role: the signal lamp, the same one the save bar uses. */
.s-org-settings-member__edited {
  flex: none;
  width: 6px;
  height: 6px;
  border-radius: var(--r-radius-round);
  background: var(--r-signal);
}

.s-org-settings-member__none {
  color: var(--r-text-disabled);
  font-family: var(--r-font-mono);
}

.s-org-settings-member__last {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
}

.s-org-settings-members__empty {
  padding: 32px 16px;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-sm);
  text-align: center;
}

.s-org-settings-members__foot {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 20px;
  width: 100%;
  padding-top: 12px;
  border-top: 1px solid var(--r-border-subtle);
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.s-org-settings-invite {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (max-width: 640px) {
  .s-org-settings-members__tools,
  .s-org-settings-members__search {
    width: 100%;
  }
  .s-org-settings-members__search {
    flex: 1 1 100%;
  }
}
</style>
