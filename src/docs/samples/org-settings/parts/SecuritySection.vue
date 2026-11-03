<script setup lang="ts">
import { computed } from 'vue'
import { RAlert, RButton, RCard, RRadioGroup, RReadout, RSlider, RSpecList, RSwitch, useToast } from '@/design-system'
import { identityProvider, passwordMarks, sessionOptions } from '../data'
import { sectionDomId, useSettings } from '../state'

const { form, missingTwoFactor } = useSettings()
const toast = useToast()

/** Entropy of the shortest allowed password if every character is drawn from 94 printable symbols. */
const entropy = computed(() => Math.round(form.minPassword * Math.log2(94)))

const missingNames = computed(() => {
  const names = missingTwoFactor.value.map((m) => m.name)
  if (names.length <= 1) return names.join('')
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
})

function testSignIn() {
  toast.show({
    title: 'Test sign-in passed',
    body: 'Signed assertion from idp.kopralabs.io, raka.wibisono@kopralabs.io mapped to Owner.',
    tone: 'success',
  })
}

function remind() {
  const count = missingTwoFactor.value.length
  toast.show({ title: 'Reminder sent', body: `${count} member${count === 1 ? '' : 's'} got an email with setup steps.` })
}
</script>

<template>
  <RCard
    :id="sectionDomId('security')"
    as="section"
    tabindex="-1"
    class="s-org-settings-section"
    index="03"
    eyebrow="Security"
    title="Sign-in policy"
    title-as="h2"
    subtitle="Applies to every member at their next sign-in."
    meta="Policy v12 · 12 Nov"
  >
    <div class="s-org-settings-rows">
      <div class="s-org-settings-row">
        <RSwitch
          v-model="form.sso"
          label="Require single sign-on (SAML)"
          description="Members sign in through the company directory. The owner keeps a password as a break-glass account."
        />
        <div v-if="form.sso" class="s-org-settings-row__detail">
          <RSpecList :items="identityProvider" dense />
          <div class="s-org-settings-row__actions">
            <RButton size="sm" variant="outline" @click="testSignIn">Run test sign-in</RButton>
          </div>
        </div>
      </div>

      <div class="s-org-settings-row">
        <RSwitch
          v-model="form.require2fa"
          label="Require two-factor authentication"
          description="An authenticator app or a security key. Text-message codes are not accepted."
        />
        <div v-if="form.require2fa && missingTwoFactor.length" class="s-org-settings-row__detail">
          <RAlert tone="warning" :title="`${missingTwoFactor.length} active members have not set it up`">
            {{ missingNames }} will be asked to set it up at their next sign-in.
            <template #actions>
              <RButton size="sm" variant="outline" @click="remind">Send reminder</RButton>
            </template>
          </RAlert>
        </div>
      </div>

      <div class="s-org-settings-row">
        <RRadioGroup v-model="form.session" label="Session length" :options="sessionOptions" orientation="horizontal" variant="card" />
      </div>

      <div class="s-org-settings-row s-org-settings-row--password">
        <RSlider v-model="form.minPassword" label="Minimum password length" :min="8" :max="32" :marks="passwordMarks" unit="chars" />
        <RReadout class="s-org-settings-entropy" label="Entropy at minimum" :value="entropy" unit="bits" size="sm" ghost="888" sub="94-symbol set" align="right" />
      </div>
    </div>
  </RCard>
</template>

<style scoped>
.s-org-settings-rows {
  display: flex;
  flex-direction: column;
}

.s-org-settings-row {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px 0;
  border-top: 1px solid var(--r-border-subtle);
}

.s-org-settings-row:first-child {
  padding-top: 4px;
  border-top: 0;
}

.s-org-settings-row:last-child {
  padding-bottom: 0;
}

/* Details line up with the switch label, past the 32px track and its 10px gap. */
.s-org-settings-row__detail {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-left: 42px;
}

.s-org-settings-row__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.s-org-settings-row--password {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 32px;
}

.s-org-settings-entropy {
  min-width: 132px;
  padding-left: 20px;
  border-left: 1px solid var(--r-border-subtle);
}

@media (max-width: 640px) {
  .s-org-settings-row__detail {
    padding-left: 0;
  }
  .s-org-settings-row--password {
    grid-template-columns: minmax(0, 1fr);
    gap: 20px;
  }
  .s-org-settings-entropy {
    padding-left: 0;
    border-left: 0;
  }
}
</style>
