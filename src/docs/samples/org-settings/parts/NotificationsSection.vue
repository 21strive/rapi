<script setup lang="ts">
import { computed } from 'vue'
import { RCard, RCheckbox, RInput, RSelect, RTable, type TableColumn } from '@/design-system'
import { channels, digestOptions, notificationEvents, timezones, type Channel } from '../data'
import { sectionDomId, useSettings } from '../state'

const { form, baseline } = useSettings()

const columns: TableColumn[] = [
  { key: 'label', label: 'Event' },
  ...channels.map((c) => ({ key: c.key, label: c.label, align: 'center' as const, width: '96px' })),
]

const isLocked = (eventId: string, channel: Channel) =>
  notificationEvents.find((e) => e.id === eventId)?.locked?.includes(channel) ?? false

const zone = computed(() => timezones.find((t) => t.value === baseline.value.timezone)?.abbr ?? 'WIB')
const routed = computed(() => Object.values(form.notifications).reduce((sum, list) => sum + list.length, 0))
</script>

<template>
  <RCard
    :id="sectionDomId('notifications')"
    as="section"
    tabindex="-1"
    class="s-org-settings-section"
    padding="none"
    index="04"
    eyebrow="Notifications"
    title="Default alerts"
    title-as="h2"
    subtitle="Defaults for everyone in the organization. Members can mute a channel for themselves."
    :meta="`${routed} of ${notificationEvents.length * channels.length} routes on`"
  >
    <RTable :columns="columns" :rows="notificationEvents" row-key="id" caption="Notification channels by event">
      <template #cell-label="{ row }">
        <div class="s-org-settings-event">
          <span class="s-org-settings-event__name">{{ row.label }}</span>
          <span class="s-org-settings-event__desc">{{ row.description }}</span>
        </div>
      </template>
      <template v-for="c in channels" :key="c.key" #[`cell-${c.key}`]="{ row }">
        <RCheckbox
          v-model="form.notifications[row.id]"
          class="s-org-settings-event__check"
          :value="c.key"
          :disabled="isLocked(row.id, c.key)"
          :aria-label="`${c.label} for ${row.label}${isLocked(row.id, c.key) ? ', always on' : ''}`"
        />
      </template>
    </RTable>

    <div class="s-org-settings-delivery">
      <RSelect v-model="form.digest" label="Digest of everything else" :options="digestOptions" :hint="`Times are in ${zone}, the organization timezone.`" />
      <RInput v-model="form.webhook" label="Webhook endpoint" type="url" spellcheck="false" hint="Signed with the key in API settings. Retries for 24 hours." />
    </div>
  </RCard>
</template>

<style scoped>
.s-org-settings-event {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 184px;
  padding: 8px 0;
  white-space: normal;
}

.s-org-settings-event__name {
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
  line-height: 18px;
}

.s-org-settings-event__desc {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  line-height: 16px;
}

.s-org-settings-event__check {
  vertical-align: middle;
}

.s-org-settings-delivery {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
  gap: 16px;
  padding: 4px 20px 20px;
}

@media (max-width: 640px) {
  .s-org-settings-delivery {
    grid-template-columns: minmax(0, 1fr);
    padding: 4px 16px 16px;
  }
}
</style>
