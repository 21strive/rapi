<script setup lang="ts">
/**
 * The zone at a glance: the same figures the Then screen opens with (records, queries, DNSSEC,
 * nameservers), plus whatever is booked for later tonight. Read, not edited.
 */
import { RCard, RSparkline, RStat, RStatus } from '@/design-system'
import { NAMESERVERS, ZONE, type Change } from '../data'

defineProps<{
  records: number
  proxied: number
  now: string
  scheduled: Change[]
}>()

const servers = NAMESERVERS.split('\n')
</script>

<template>
  <RCard eyebrow="Zone" :title="ZONE.name" title-as="h3" :meta="`${ZONE.plan} plan`" class="dn-zone">
    <template #actions>
      <RStatus tone="success" label="Active" size="sm" />
    </template>

    <div class="dn-zone__figs">
      <RStat label="Records" :value="records" size="md">
        <template #footer>
          <span class="dn-zone__muted">{{ proxied }} proxied</span>
        </template>
      </RStat>
      <div class="dn-zone__queries">
        <RStat label="Queries · 24 h" :value="ZONE.queries24h / 1e6" :decimals="2" suffix="M" :trend="ZONE.queriesTrend" size="md" />
        <RSparkline :values="ZONE.queriesSpark" color="var(--r-chart-1)" :height="30" area label="DNS queries per hour, last 24 hours" />
      </div>
    </div>

    <dl class="dn-zone__spec">
      <div>
        <dt class="r-label">DNSSEC</dt>
        <dd>
          <RStatus tone="success" size="sm" label="Active" />
          <span class="r-mono dn-zone__muted">DS 2371 13 2</span>
        </dd>
      </div>
      <div>
        <dt class="r-label">Nameservers</dt>
        <dd>
          <span v-for="s in servers" :key="s" class="r-mono">{{ s }}</span>
          <span class="dn-zone__muted">Verified {{ now }} WIB</span>
        </dd>
      </div>
    </dl>

    <template v-if="scheduled.length" #footer>
      <ul class="dn-zone__next" aria-label="Scheduled changes">
        <li v-for="c in scheduled" :key="c.id">
          <RStatus tone="neutral" size="sm" :label="`${c.when} WIB`" />
          <span class="dn-zone__next-title">{{ c.title }}</span>
          <span class="r-mono dn-zone__muted">{{ c.id }}</span>
        </li>
      </ul>
    </template>
  </RCard>
</template>

<style scoped>
.dn-zone__figs {
  display: grid;
  grid-template-columns: minmax(0, 0.7fr) minmax(0, 1.3fr);
  border-top: 1px solid var(--r-border-subtle);
  border-bottom: 1px solid var(--r-border-subtle);
}

.dn-zone__figs > * {
  padding: 12px 0;
}

.dn-zone__queries {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: end;
  gap: 12px;
  padding-left: 16px;
  border-left: 1px solid var(--r-border-subtle);
}

.dn-zone__muted {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.dn-zone__spec {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
}

.dn-zone__spec > div {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  align-items: baseline;
  gap: 8px;
}

.dn-zone__spec dd {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 2px 10px;
  min-width: 0;
  margin: 0;
  font-size: var(--r-text-sm);
}

.dn-zone__next {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
}

.dn-zone__next li {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: baseline;
  gap: 10px;
  padding: 8px 0 0;
  border-top: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-sm);
}

.dn-zone__next-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
