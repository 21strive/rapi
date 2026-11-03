<script setup lang="ts">
import { computed, nextTick, ref, useId } from 'vue'
import { Plus, X } from 'lucide-vue-next'
import { RButton, RIconButton, RInput, RRadioGroup, RSelect } from '@/design-system'
import { inviteRoles, owner, ownRoles, teamSizes } from '../data'
import { useSetup } from '../state'

const { form, visible, addInvite, removeInvite, validInvites } = useSetup()

const MAX_INVITES = 10
const id = useId()
const rows = ref<HTMLElement | null>(null)
const full = computed(() => form.invites.length >= MAX_INVITES)

async function add() {
  if (full.value) return
  addInvite()
  await nextTick()
  rows.value?.querySelector<HTMLInputElement>('.s-onboarding-team__row:last-child input')?.focus()
}

async function remove(rowId: number, index: number) {
  removeInvite(rowId)
  await nextTick()
  // Keep focus in the list: the row that took this one's place, or the add button.
  const inputs = rows.value?.querySelectorAll<HTMLInputElement>('.s-onboarding-team__row input')
  const next = inputs?.[Math.min(index, (inputs?.length ?? 1) - 1)]
  if (next) next.focus()
  else rows.value?.parentElement?.querySelector<HTMLButtonElement>('.s-onboarding-team__add')?.focus()
}
</script>

<template>
  <div class="s-onboarding-team">
    <RRadioGroup
      v-model="form.teamSize"
      class="s-onboarding-team__size"
      label="Team size"
      :options="teamSizes"
      variant="card"
      orientation="horizontal"
    />

    <RSelect
      v-model="form.role"
      class="s-onboarding-team__role"
      label="Your role"
      :options="ownRoles"
      placeholder="Choose your role"
      hint="Helps us pick the defaults for your first project."
      :error="visible.team.role"
    />

    <section class="s-onboarding-team__invites" :aria-labelledby="`${id}-title`">
      <div class="s-onboarding-team__head">
        <div>
          <h3 :id="`${id}-title`" class="s-onboarding-team__title">Invite teammates</h3>
          <p class="s-onboarding-team__lead">Optional. Invites go out when the workspace is created; you join as the owner.</p>
        </div>
        <span class="r-label s-onboarding-team__count">{{ validInvites.length }} of {{ MAX_INVITES }}</span>
      </div>

      <div class="s-onboarding-team__columns" aria-hidden="true">
        <span class="r-label">Email</span>
        <span class="r-label">Role</span>
      </div>

      <ol ref="rows" class="s-onboarding-team__rows">
        <li v-for="(row, index) in form.invites" :key="row.id" class="s-onboarding-team__row">
          <span class="s-onboarding-team__index" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
          <RInput
            v-model="row.email"
            class="s-onboarding-team__email"
            type="email"
            inputmode="email"
            autocomplete="off"
            spellcheck="false"
            :placeholder="`name@${owner.domain}`"
            :aria-label="`Teammate ${index + 1}, email`"
            :error="visible.team.invites[row.id]"
          />
          <RSelect
            v-model="row.role"
            class="s-onboarding-team__invite-role"
            :options="inviteRoles"
            :aria-label="`Teammate ${index + 1}, role`"
          />
          <RIconButton
            class="s-onboarding-team__remove"
            variant="ghost"
            :label="`Remove teammate ${index + 1}`"
            @click="remove(row.id, index)"
          >
            <X />
          </RIconButton>
        </li>
      </ol>

      <div class="s-onboarding-team__foot">
        <RButton class="s-onboarding-team__add" variant="outline" size="sm" :disabled="full" @click="add">
          <template #leading><Plus /></template>
          Add another
        </RButton>
        <span v-if="full" class="s-onboarding-team__limit">Ten at a time. Invite more after setup.</span>
      </div>
    </section>
  </div>
</template>

<style scoped>
.s-onboarding-team {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Four sizes on one row while the form is wide enough, two by two when it is not. */
.s-onboarding-team__size :deep(.r-radio-group__options) {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

@container s-onboarding-step (max-width: 520px) {
  .s-onboarding-team__size :deep(.r-radio-group__options) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.s-onboarding-team__role {
  max-width: 320px;
}

.s-onboarding-team__count {
  white-space: nowrap;
}

.s-onboarding-team__invites {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid var(--r-border-subtle);
}

.s-onboarding-team__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 4px;
}

.s-onboarding-team__title {
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.4;
}

.s-onboarding-team__lead {
  margin-top: 2px;
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
  line-height: 1.45;
}

/* Index · email · role · remove. The heads sit on the same columns as the fields. */
.s-onboarding-team__columns,
.s-onboarding-team__row {
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr) 148px 32px;
  gap: 8px;
}

.s-onboarding-team__columns span:first-child {
  grid-column: 2;
}

.s-onboarding-team__rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.s-onboarding-team__row {
  align-items: start;
}

.s-onboarding-team__index {
  padding-top: 9px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
}

.s-onboarding-team__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  margin-top: 4px;
  padding-left: 28px;
}

.s-onboarding-team__limit {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

@container s-onboarding-step (max-width: 460px) {
  .s-onboarding-team__role {
    max-width: none;
  }
  .s-onboarding-team__columns {
    display: none;
  }
  /* Phones: the address gets the full line, the role sits under it. */
  .s-onboarding-team__rows {
    gap: 0;
  }
  .s-onboarding-team__row {
    grid-template-columns: minmax(0, 1fr) 32px;
    padding: 10px 0;
    border-top: 1px solid var(--r-border-subtle);
  }
  .s-onboarding-team__row:first-child {
    padding-top: 0;
    border-top: 0;
  }
  .s-onboarding-team__email {
    grid-column: 1;
    grid-row: 1;
  }
  .s-onboarding-team__remove {
    grid-column: 2;
    grid-row: 1;
  }
  .s-onboarding-team__invite-role {
    grid-column: 1;
    grid-row: 2;
  }
  .s-onboarding-team__index {
    display: none;
  }
  .s-onboarding-team__foot {
    padding-left: 0;
  }
}
</style>
