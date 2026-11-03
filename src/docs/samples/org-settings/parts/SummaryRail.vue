<script setup lang="ts">
import { computed } from 'vue'
import { ScrollText } from 'lucide-vue-next'
import { RButton, RCard, RMeter, RSpecList, RTimeline, type SpecItem } from '@/design-system'
import { org, regions } from '../data'
import { useSettings } from '../state'

defineEmits<{ audit: [] }>()

const { baseline, audit, seatsUsed } = useSettings()

const summary = computed<SpecItem[]>(() => [
  { label: 'Plan', value: org.plan, hint: `${org.planPrice} · renews ${org.renews}` },
  { label: 'Seats', value: `${seatsUsed.value} of ${org.seats}` },
  { label: 'Region', value: regions.find((r) => r.value === baseline.value.region)?.label ?? '—' },
  { label: 'Created', value: org.created },
  { label: 'Owner', value: org.owner },
])

const recent = computed(() => audit.value.slice(0, 6))
</script>

<template>
  <div class="s-org-settings-rail">
    <RCard eyebrow="Organization" :title="baseline.name" :meta="org.id" padding="sm">
      <RSpecList :items="summary" dense>
        <template #value="{ item }">
          <span v-if="item.label === 'Seats'" class="s-org-settings-seats">
            <RMeter
              variant="segments"
              :count="org.seats"
              :max="org.seats"
              :value="seatsUsed"
              :height="10"
              class="s-org-settings-seats__meter"
              :label="`${seatsUsed} of ${org.seats} seats in use`"
            />
            <span>{{ item.value }}</span>
          </span>
          <template v-else>{{ item.value }}</template>
        </template>
      </RSpecList>
    </RCard>

    <RCard eyebrow="Audit log" title="Recent changes" padding="sm">
      <template #actions>
        <RButton size="xs" variant="ghost" @click="$emit('audit')">
          <template #leading><ScrollText /></template>
          All
        </RButton>
      </template>
      <RTimeline :items="recent" dense time-position="top" />
    </RCard>
  </div>
</template>

<style scoped>
.s-org-settings-rail {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.s-org-settings-seats {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.s-org-settings-seats__meter {
  width: 112px;
}
</style>
