<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ArrowRightLeft, Trash2 } from 'lucide-vue-next'
import { RAlert, RButton, RCard, RDialog, RInput, RRadioGroup, RSpecList, formatNumber, useToast, type SpecItem } from '@/design-system'
import { footprint, org } from '../data'
import { sectionDomId, useSettings } from '../state'

const { members, baseline } = useSettings()
const toast = useToast()

/** The saved name is what has to be typed: an unsaved rename does not count yet. */
const orgName = computed(() => baseline.value.name)

const removed = computed<SpecItem[]>(() => [
  { label: 'Projects', value: footprint.projects, mono: true },
  { label: 'Deployments', value: formatNumber(footprint.deployments), mono: true },
  { label: 'Custom domains', value: footprint.domains, mono: true },
  { label: 'API keys', value: footprint.apiKeys, mono: true, hint: 'Revoked at once' },
  { label: 'Stored data', value: footprint.storage, mono: true },
  { label: 'Members', value: members.length, mono: true, hint: 'Accounts are kept' },
])

/* ── Transfer ownership ─────────────────────────────────────────────────── */
const transferOpen = ref(false)
const admins = computed(() =>
  members
    .filter((m) => m.status === 'active' && m.role === 'admin')
    .map((m) => ({ label: m.name, value: m.id, description: m.email })),
)
const transferTo = ref<string | number>('m02')

function transfer() {
  const to = members.find((m) => m.id === transferTo.value)
  transferOpen.value = false
  if (!to) return
  toast.show({ title: 'Transfer request sent', body: `Ownership moves to ${to.name} when they accept, within 72 hours.` })
}

/* ── Delete ─────────────────────────────────────────────────────────────── */
const deleteOpen = ref(false)
const typed = ref('')
const matches = computed(() => typed.value === orgName.value)
watch(deleteOpen, (open) => {
  if (!open) typed.value = ''
})

function scheduleDeletion() {
  if (!matches.value) return
  deleteOpen.value = false
  toast.show({
    title: `${orgName.value} is scheduled for deletion`,
    body: 'Deletion runs on 25 Nov 2026 at 14:20 WIB. Until then everything keeps working.',
    tone: 'danger',
    duration: 8000,
    action: {
      label: 'Undo',
      onClick: () => toast.show({ title: 'Deletion cancelled', body: `${orgName.value} stays as it is.`, tone: 'success' }),
    },
  })
}
</script>

<template>
  <RCard
    :id="sectionDomId('danger')"
    as="section"
    tabindex="-1"
    class="s-org-settings-section"
    index="05"
    eyebrow="Danger zone"
    title="Ownership and deletion"
    title-as="h2"
    meta="Owner only"
  >
    <RAlert tone="danger" :title="`Deleting ${orgName} cannot be undone after 7 days`">
      It removes {{ footprint.projects }} projects, {{ formatNumber(footprint.deployments) }} deployments,
      {{ footprint.domains }} custom domains, {{ footprint.apiKeys }} API keys and {{ footprint.storage }} of stored data.
      Invoices stay available to the billing contact.
    </RAlert>

    <div class="s-org-settings-danger">
      <div class="s-org-settings-danger__row">
        <div class="s-org-settings-danger__text">
          <p class="s-org-settings-danger__title">Transfer ownership</p>
          <p class="s-org-settings-danger__desc">
            {{ org.owner }} is the owner. The new owner must be an admin and accept within 72 hours; you stay on as an admin.
          </p>
        </div>
        <RButton variant="outline" @click="transferOpen = true">
          <template #leading><ArrowRightLeft /></template>
          Transfer ownership
        </RButton>
      </div>
      <div class="s-org-settings-danger__row">
        <div class="s-org-settings-danger__text">
          <p class="s-org-settings-danger__title">Delete organization</p>
          <p class="s-org-settings-danger__desc">Schedules deletion for 25 Nov 2026. Any admin can cancel it until then.</p>
        </div>
        <RButton tone="danger" @click="deleteOpen = true">
          <template #leading><Trash2 /></template>
          Delete organization
        </RButton>
      </div>
    </div>

    <RDialog
      v-model:open="transferOpen"
      size="sm"
      eyebrow="Danger zone"
      title="Transfer ownership"
      description="Pick the admin who becomes owner. They get an email and 72 hours to accept."
    >
      <RRadioGroup v-model="transferTo" label="New owner" :options="admins" variant="card" />
      <template #footer="{ close }">
        <RButton variant="ghost" @click="close">Cancel</RButton>
        <RButton @click="transfer">Send request</RButton>
      </template>
    </RDialog>

    <RDialog
      v-model:open="deleteOpen"
      eyebrow="Danger zone"
      :title="`Delete ${orgName}?`"
      description="Deletion is scheduled for 25 Nov 2026 at 14:20 WIB. After that nothing can be recovered."
      initial-focus="input"
    >
      <div class="s-org-settings-delete">
        <RSpecList :items="removed" :columns="2" dense />
        <RInput
          v-model="typed"
          :label="`Type ${orgName} to confirm`"
          :placeholder="orgName"
          autocomplete="off"
          spellcheck="false"
          @keydown.enter="scheduleDeletion"
        />
      </div>
      <template #footer="{ close }">
        <RButton variant="ghost" @click="close">Cancel</RButton>
        <RButton tone="danger" :disabled="!matches" @click="scheduleDeletion">Delete organization</RButton>
      </template>
    </RDialog>
  </RCard>
</template>

<style scoped>
.s-org-settings-danger {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--r-border-subtle);
}

.s-org-settings-danger__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 24px;
  padding: 16px 0;
  border-bottom: 1px solid var(--r-border-subtle);
}

.s-org-settings-danger__row:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.s-org-settings-danger__text {
  flex: 1 1 320px;
  min-width: 0;
}

.s-org-settings-danger__title {
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
}

.s-org-settings-danger__desc {
  margin-top: 2px;
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
}

.s-org-settings-delete {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
