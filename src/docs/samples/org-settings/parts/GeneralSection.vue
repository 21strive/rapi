<script setup lang="ts">
import { computed, ref } from 'vue'
import { Copy, Upload } from 'lucide-vue-next'
import { RAvatar, RButton, RCard, RIconButton, RInput, RSelect, RTextarea, useToast } from '@/design-system'
import { locales, org, regions, timezones } from '../data'
import { sectionDomId, useSettings } from '../state'

const { form, nameError, slugError } = useSettings()
const toast = useToast()

const file = ref<HTMLInputElement | null>(null)

/** A live example of what the chosen locale does to dates and amounts on invoices. */
const localeExample = computed(() => {
  const locale = form.locale || 'en-GB'
  const date = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    Date.UTC(2026, 10, 18),
  )
  const amount = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(1284.5)
  return `Invoices read ${date} · USD ${amount}`
})

function onFile(event: Event) {
  const picked = (event.target as HTMLInputElement).files?.[0]
  if (!picked) return
  const kb = Math.max(1, Math.round(picked.size / 1024))
  toast.show({ title: 'Logo uploaded', body: `${picked.name} · ${kb} KB. It replaces the monogram once processed.`, tone: 'success' })
  ;(event.target as HTMLInputElement).value = ''
}

async function copyId() {
  try {
    await navigator.clipboard?.writeText(org.id)
  } catch {
    /* The clipboard can be blocked; the id stays selectable. */
  }
  toast.show({ title: 'Copied', body: `${org.id} is on the clipboard.` })
}
</script>

<template>
  <RCard
    :id="sectionDomId('general')"
    as="section"
    tabindex="-1"
    class="s-org-settings-section"
    index="01"
    eyebrow="General"
    title="Profile and defaults"
    title-as="h2"
    subtitle="How the organization appears in the dashboard, on invoices and in emails."
    meta="Edited 15 Nov · Raka W."
  >
    <div class="s-org-settings-logo">
      <div class="s-org-settings-logo__frame r-marks">
        <RAvatar :name="form.name.trim() || org.name" size="xl" decorative />
      </div>
      <div class="s-org-settings-logo__text">
        <p class="s-org-settings-logo__title">Logo</p>
        <p class="s-org-settings-logo__hint">
          SVG or PNG, at least 256 × 256 px. Until one is uploaded, the monogram stands in on the sidebar, invoices and emails.
        </p>
        <div class="s-org-settings-logo__actions">
          <RButton size="sm" variant="outline" @click="file?.click()">
            <template #leading><Upload /></template>
            Upload
          </RButton>
          <RButton size="sm" variant="ghost" disabled>Remove</RButton>
        </div>
        <input
          ref="file"
          type="file"
          accept=".svg,.png,image/svg+xml,image/png"
          class="r-sr-only"
          tabindex="-1"
          aria-hidden="true"
          @change="onFile"
        />
      </div>
    </div>

    <div class="s-org-settings-fields">
      <RInput v-model="form.name" label="Organization name" autocomplete="organization" :error="nameError" />
      <RInput v-model="form.slug" label="URL slug" spellcheck="false" :error="slugError" hint="Old links keep redirecting for 30 days after a change.">
        <template #leading><span class="s-org-settings-affix">simpul.app/</span></template>
      </RInput>
      <RTextarea v-model="form.description" class="s-org-settings-fields__wide" label="Description" :rows="3" :maxlength="280" />
      <RSelect v-model="form.timezone" label="Timezone" :options="timezones" hint="Schedules, digests and invoice dates use it." />
      <RSelect v-model="form.locale" label="Locale" :options="locales" :hint="localeExample" />
      <RSelect v-model="form.region" label="Default region" :options="regions" hint="New projects start here. Existing projects stay where they are." />
      <RInput :model-value="org.id" label="Organization ID" readonly hint="Quote it in API calls and support requests.">
        <template #trailing>
          <RIconButton label="Copy organization ID" size="xs" variant="ghost" @click="copyId"><Copy /></RIconButton>
        </template>
      </RInput>
    </div>
  </RCard>
</template>

<style scoped>
.s-org-settings-logo {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--r-border-subtle);
}

.s-org-settings-logo__frame {
  display: grid;
  flex: none;
  place-items: center;
  width: 88px;
  height: 88px;
  border: 1px solid var(--r-border);
  background: var(--r-bg-muted);
}

.s-org-settings-logo__text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.s-org-settings-logo__title {
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-semibold);
}

.s-org-settings-logo__hint {
  max-width: 52ch;
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
  line-height: var(--r-leading-normal);
}

.s-org-settings-logo__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.s-org-settings-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px 16px;
}

.s-org-settings-fields__wide {
  grid-column: 1 / -1;
}

.s-org-settings-affix {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  letter-spacing: 0;
}

@media (max-width: 640px) {
  .s-org-settings-fields {
    grid-template-columns: minmax(0, 1fr);
  }
  .s-org-settings-logo {
    gap: 16px;
  }
  .s-org-settings-logo__frame {
    width: 72px;
    height: 72px;
  }
}
</style>
