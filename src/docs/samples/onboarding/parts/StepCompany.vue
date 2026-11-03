<script setup lang="ts">
import { RInput, RRadioGroup, RSelect } from '@/design-system'
import { URL_HOST, countries, industries, regions } from '../data'
import { useSetup } from '../state'

const { form, visible, setSlug } = useSetup()
</script>

<template>
  <div class="s-onboarding-company">
    <RInput
      v-model="form.name"
      label="Workspace name"
      name="workspace-name"
      autocomplete="organization"
      hint="Shown to members, on invoices and in every email we send."
      :error="visible.company.name"
    />
    <RInput
      :model-value="form.slug"
      label="Workspace URL"
      name="workspace-url"
      class="s-onboarding-company__url"
      spellcheck="false"
      autocapitalize="off"
      autocomplete="off"
      hint="Lowercase letters, numbers and hyphens. Follows the name until you edit it."
      :error="visible.company.slug"
      @update:model-value="(value) => setSlug(String(value ?? ''))"
    >
      <template #leading>
        <span class="s-onboarding-company__host">{{ URL_HOST }}</span>
      </template>
    </RInput>
    <div class="s-onboarding-company__pair">
      <RSelect
        v-model="form.industry"
        label="Industry"
        :options="industries"
        placeholder="Choose an industry"
        :error="visible.company.industry"
      />
      <RSelect
        v-model="form.country"
        label="Country"
        :options="countries"
        placeholder="Choose a country"
        :error="visible.company.country"
      />
    </div>
    <div class="s-onboarding-company__region">
      <RRadioGroup v-model="form.region" label="Data region" :options="regions" />
      <p class="s-onboarding-company__note">
        Builds, logs and databases stay in this region. It can't be changed after the workspace is created.
      </p>
    </div>
  </div>
</template>

<style scoped>
.s-onboarding-company {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.s-onboarding-company__pair {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

/* The host and the slug read as one address: no gap between the prefix and the field. */
.s-onboarding-company__url :deep(.r-input__affix--leading + .r-input__control) {
  padding-left: 0;
}

.s-onboarding-company__host {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-md);
}

.s-onboarding-company__region {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--r-border-subtle);
}

.s-onboarding-company__note {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

@container s-onboarding-step (max-width: 420px) {
  .s-onboarding-company__pair {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
