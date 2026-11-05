<script setup lang="ts">
/**
 * State: the keys in use, read in a look. Three figures on a ruled row (the one pixel readout is
 * the live rate), then every key with its prefix and scopes, when it was last used and from
 * where, and 30 days of requests. The key the conversation is about carries the selection rule.
 */
import { computed } from 'vue'
import { RBadge, RMeter, RReadout, RSparkline, RStat, RStatus, RTable, RTrend, formatCompact, type TableColumn } from '@/design-system'
import { RATE_LIMIT, type DeskKey } from '../data'
import { scopeLine } from '../script'

const props = defineProps<{ keys: DeskKey[]; focusId: string | null }>()

const total = (k: DeskKey) => k.daily.reduce((a, b) => a + b, 0)
const compact = (v: number) => formatCompact(v, { maximumFractionDigits: 1 })

const inUse = computed(() => props.keys.filter((k) => k.state !== 'revoked'))
const live = computed(() => inUse.value.filter((k) => k.env === 'live').length)
const liveTotal = computed(() => props.keys.filter((k) => k.env === 'live').reduce((s, k) => s + total(k), 0))
const selected = computed(() => (props.focusId ? [props.focusId] : []))

const columns: TableColumn[] = [
  { key: 'name', label: 'Key' },
  { key: 'lastUsed', label: 'Last used', width: '118px' },
  { key: 'usage', label: '30 days', width: '124px', align: 'right' },
]

const row = (r: Record<string, unknown>) => r as unknown as DeskKey
</script>

<template>
  <div class="s-akn-state">
    <div class="s-akn-state__figures r-grid-ruled">
      <div class="s-akn-state__cell">
        <RStat label="Keys in use" :value="inUse.length" size="md">
          <template #footer>
            <span class="r-caption r-text-tertiary">{{ live }} live · {{ inUse.length - live }} test</span>
          </template>
        </RStat>
      </div>
      <div class="s-akn-state__cell">
        <RStat label="Live requests" :value="liveTotal / 1e6" :decimals="2" suffix="M" size="md">
          <template #footer>
            <RTrend :value="6.2" size="sm" />
            <span class="r-caption r-text-tertiary">30 days, vs the 30 before</span>
          </template>
        </RStat>
      </div>
      <div class="s-akn-state__cell">
        <RReadout label="Live rate · now" :value="RATE_LIMIT.used" unit="req/s" font="pixel" size="md" />
        <RMeter
          variant="segments"
          :value="RATE_LIMIT.used"
          :max="RATE_LIMIT.limit"
          :count="20"
          :height="8"
          tone="brand"
          :label="`${RATE_LIMIT.used} of ${RATE_LIMIT.limit.toLocaleString('en-US')} requests a second used`"
        />
        <span class="r-caption r-text-tertiary">of {{ RATE_LIMIT.limit.toLocaleString('en-US') }} req/s</span>
      </div>
    </div>

    <div class="s-akn-state__keys">
      <RTable :columns="columns" :rows="keys" :selected="selected" density="compact" caption="Keys in use, with when each was last used and its requests in 30 days">
        <template #cell-name="{ row: r }">
          <span class="s-akn-state__key" :class="{ 'is-revoked': row(r).state === 'revoked' }">
            <span class="s-akn-state__line">
              <span class="s-akn-state__name">{{ row(r).name }}</span>
              <RBadge v-if="row(r).env === 'test'" size="sm" variant="outline">test</RBadge>
              <RStatus v-if="row(r).flag" :tone="row(r).flag!.tone" :label="row(r).flag!.label" size="sm" />
            </span>
            <span class="s-akn-state__sub">{{ row(r).prefix }}… · {{ scopeLine(row(r).scopes) }}</span>
          </span>
        </template>
        <template #cell-lastUsed="{ row: r }">
          <span class="s-akn-state__used">
            <span>{{ row(r).state === 'revoked' ? '—' : row(r).lastUsed }}</span>
            <span class="s-akn-state__sub">{{ row(r).allow ? `only ${row(r).allow!.join(', ')}` : row(r).lastIp }}</span>
          </span>
        </template>
        <template #cell-usage="{ row: r }">
          <span class="s-akn-state__usage">
            <RSparkline
              :values="row(r).daily"
              :width="52"
              :height="20"
              :color="row(r).id === focusId ? 'var(--r-chart-1)' : 'var(--r-chart-context)'"
              :end-dot="row(r).id === focusId"
              :label="`${row(r).name}, requests a day for 30 days`"
            />
            <span class="s-akn-state__total">{{ compact(total(row(r))) }}</span>
          </span>
        </template>
      </RTable>
    </div>
  </div>
</template>

<style>
.s-akn-state {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.s-akn-state__figures {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.s-akn-state__cell {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
  padding: 12px 14px;
}

.s-akn-state__keys {
  border: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}

.s-akn-state__key {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 5px 0;
  line-height: 1.25;
  white-space: normal;
}

.s-akn-state__line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px 8px;
}

.s-akn-state__name {
  font-weight: var(--r-weight-medium);
}

.s-akn-state__key.is-revoked .s-akn-state__name {
  color: var(--r-text-tertiary);
  font-weight: var(--r-weight-regular);
  text-decoration: line-through;
}

.s-akn-state__sub {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0;
}

.s-akn-state__used {
  display: inline-flex;
  flex-direction: column;
  line-height: 1.25;
}

.s-akn-state__usage {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.s-akn-state__total {
  min-width: 40px;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

@container (max-width: 520px) {
  .s-akn-state__figures {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
