<script setup lang="ts">
import { computed } from 'vue'
import { CalendarClock } from 'lucide-vue-next'
import { RButton, RDialog, RLineChart, RSpecList, RStat, RStatus, type SpecItem } from '@/design-system'
import { type Obligor, el, isWatch, months, nameLimit, num, pdHistory, ratingOf, watchTrigger } from '../data'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{ obligor: Obligor | null }>()
const emit = defineEmits<{ review: [obligor: Obligor] }>()

const history = computed(() => (props.obligor ? pdHistory(props.obligor) : []))

const specs = computed<SpecItem[]>(() => {
  const o = props.obligor
  if (!o) return []
  const limit = nameLimit[o.segment].value
  return [
    { label: 'Rating', value: ratingOf(o.pd), mono: true },
    { label: 'PD, 12 months', value: `${num(o.pd)}%`, mono: true },
    { label: 'LGD', value: `${o.lgd}%`, mono: true },
    { label: 'Expected loss', value: `IDR ${num(el(o), 2)} bn`, mono: true },
    { label: 'Days past due', value: o.dpd ? `${o.dpd} days` : 'Current', tone: o.dpd > 60 ? 'danger' : o.dpd > 0 ? 'warning' : 'success' },
    {
      label: 'Single-name limit',
      value: `IDR ${num(limit, 0)} bn · ${Math.round((o.ead / limit) * 100)}% used`,
      tone: o.ead > limit ? 'danger' : undefined,
    },
    { label: 'Sector', value: o.sector },
    { label: 'On watch since', value: o.since ?? '—' },
    { label: 'Reason', value: o.reason ?? 'Not on the watchlist' },
    { label: 'Relationship owner', value: o.owner },
  ]
})
</script>

<template>
  <RDialog
    v-model:open="open"
    side="right"
    size="md"
    initial-focus=".r-dialog__close"
    :eyebrow="obligor ? `${obligor.id} · ${obligor.segment}` : undefined"
    :title="obligor?.name ?? ''"
  >
    <div v-if="obligor" class="s-risk-drawer">
      <div class="s-risk-drawer__hero">
        <RStat label="Exposure at default" :value="num(obligor.ead, obligor.ead < 100 ? 1 : 0)" unit="IDR bn" size="md" />
        <RStatus v-if="isWatch(obligor)" tone="warning" label="On watchlist" size="sm" />
        <RStatus v-else tone="success" label="Performing" size="sm" />
      </div>
      <div class="s-risk-drawer__chart">
        <p class="r-eyebrow s-risk-drawer__label">PD · last 12 month-ends · %</p>
        <RLineChart
          :labels="months"
          :series="[{ name: 'PD', values: history }]"
          :references="[{ value: watchTrigger, label: 'Watch 5%', kind: 'threshold' }]"
          :height="160"
          :min="0"
          :format="(v) => `${num(v, 2)}%`"
          :axis-format="(v) => num(v, 0)"
          :highlight="11"
          :label="`${obligor.name}, probability of default at each month-end from November 2025 to October 2026`"
        />
      </div>
      <RSpecList :items="specs" dense />
    </div>
    <template #footer="{ close }">
      <RButton variant="ghost" @click="close">Close</RButton>
      <span class="s-risk-drawer__spacer" />
      <RButton tone="brand" @click="obligor && emit('review', obligor)">
        <template #leading><CalendarClock /></template>
        Schedule review
      </RButton>
    </template>
  </RDialog>
</template>

<style scoped>
.s-risk-drawer {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.s-risk-drawer__hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--r-border);
}
.s-risk-drawer__chart {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.s-risk-drawer__label {
  color: var(--r-text-tertiary);
}
.s-risk-drawer__spacer {
  flex: 1;
}
</style>
