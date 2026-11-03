<script setup lang="ts">
/** The radar net: one row per sensor with its state, an LED bar of signal quality and its numbers. */
import { computed } from 'vue'
import { RMeter, RReadout, RStatus, RTable, formatNumber, type TableColumn } from '@/design-system'
import { SENSOR_STATUS, zuluShort, type SensorSite } from '../data'

const props = defineProps<{
  sites: SensorSite[]
  /** Seconds since the page opened; the live values wander a little with it. */
  elapsed: number
  /** Epoch ms when the page opened, for "back at" times. */
  opened: number
}>()

const columns: TableColumn[] = [
  { key: 'site', label: 'Site' },
  { key: 'status', label: 'Status' },
  { key: 'quality', label: 'Signal quality' },
  { key: 'rotation', label: 'Rotation', numeric: true },
  { key: 'pd', label: 'PD', numeric: true },
  { key: 'plots', label: 'Plots / min', numeric: true },
]

const HOUR = 3600_000

const rows = computed(() =>
  props.sites.map((s, i) => {
    const live = s.status !== 'offline'
    // A slow, bounded wander so the numbers read as live without jumping.
    const wobble = live ? Math.round(2 * Math.sin(props.elapsed / 6 + i * 1.7)) : 0
    const quality = Math.max(0, Math.min(100, s.quality + wobble))
    const plots = live ? s.plots + Math.round(5 * Math.sin(props.elapsed / 4 + i)) : 0
    const back = s.backInHours ? zuluShort(Math.ceil((props.opened + s.backInHours * HOUR) / HOUR) * HOUR) : null
    return {
      id: s.code,
      code: s.code,
      name: s.name,
      line: back ? `Back at ${back} · ${s.note}` : s.note ? `${s.role} · ${s.note}` : s.role,
      warn: s.status !== 'nominal',
      state: SENSOR_STATUS[s.status],
      quality,
      rotation: s.rotation == null ? '—' : `${s.rotation} s`,
      pd: s.pd == null ? '—' : s.pd.toFixed(2),
      plots: formatNumber(plots),
      plotsRaw: plots,
    }
  }),
)

const totalPlots = computed(() => rows.value.reduce((sum, r) => sum + r.plotsRaw, 0))
const offline = computed(() => props.sites.filter((s) => s.status === 'offline').map((s) => s.code))
</script>

<template>
  <div class="sensors">
    <RTable :columns="columns" :rows="rows" caption="Sensor health of radar net 3">
      <template #cell-site="{ row }">
        <div class="site">
          <span class="site__name">
            <span class="site__code">{{ row.code }}</span>
            {{ row.name }}
          </span>
          <span class="site__line" :class="{ 'is-warn': row.warn }">{{ row.line }}</span>
        </div>
      </template>
      <template #cell-status="{ row }">
        <RStatus :tone="row.state.tone" :label="row.state.word" size="sm" />
      </template>
      <template #cell-quality="{ row }">
        <div class="quality">
          <RMeter
            class="quality__meter"
            variant="segments"
            :value="row.quality"
            :max="100"
            :count="20"
            :height="10"
            :tone="row.state.tone"
            :label="`${row.code} signal quality ${row.quality}%`"
          />
          <span class="quality__value">{{ row.quality }}%</span>
        </div>
      </template>
    </RTable>
    <div class="coverage">
      <RReadout label="Coverage FL100+" :value="96" unit="%" size="sm" />
      <RReadout
        label="Coverage <FL050"
        :value="71"
        unit="%"
        size="sm"
        tone="warning"
        :sub="offline.length ? `${offline.join(', ')} offline` : undefined"
      />
      <RReadout label="Plots per minute" :value="totalPlots" size="sm" />
      <RReadout label="Link 3 units" :value="14" size="sm" sub="12 air · 2 ground" />
    </div>
  </div>
</template>

<style scoped>
.sensors {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.coverage {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-top: auto;
  border-top: 1px solid var(--r-border);
}

.coverage > * {
  padding: 12px 16px;
  border-left: 1px solid var(--r-border-subtle);
}

.coverage > :first-child {
  border-left: 0;
}

@media (max-width: 640px) {
  .coverage {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .coverage > :nth-child(3) {
    border-left: 0;
  }
  .coverage > :nth-child(n + 3) {
    border-top: 1px solid var(--r-border-subtle);
  }
}

.site {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 6px 0;
  line-height: 1.3;
}

.site__name {
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
}

.site__code {
  margin-right: 6px;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
}

.site__line {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.site__line.is-warn {
  color: var(--r-text-secondary);
}

.quality {
  display: flex;
  align-items: center;
  gap: 10px;
}

.quality__meter {
  width: 128px;
}

.quality__value {
  min-width: 4ch;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
  text-align: right;
}
</style>
