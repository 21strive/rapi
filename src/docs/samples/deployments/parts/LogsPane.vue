<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { Search } from 'lucide-vue-next'
import { RBadge, RCard, RInput, RReadout, RSegmented, RStatus, RSwitch, RTable, type TableColumn } from '@/design-system'
import { runtimeLogs } from '../data'

type Level = 'info' | 'warn' | 'error'
interface Line {
  id: string
  time: string
  level: Level
  method: string
  path: string
  status: number
  ms: number
  region: string
}

const lines = ref<Line[]>(runtimeLogs.map((l) => ({ ...l, level: l.level as Level })))
const level = ref<'all' | 'warn' | 'error'>('all')
const query = ref('')
const follow = ref(true)

const levels = [
  { label: 'All', value: 'all' },
  { label: 'Warnings', value: 'warn' },
  { label: 'Errors', value: 'error' },
]

const visible = computed(() => {
  const q = query.value.trim().toLowerCase()
  return lines.value.filter((l) => {
    if (level.value === 'warn' && l.level === 'info') return false
    if (level.value === 'error' && l.level !== 'error') return false
    return !q || `${l.method} ${l.path} ${l.status} ${l.region}`.toLowerCase().includes(q)
  })
})

const columns: TableColumn[] = [
  { key: 'time', label: 'Time · UTC', width: '128px' },
  { key: 'level', label: 'Level', width: '88px' },
  { key: 'method', label: 'Method', width: '76px' },
  { key: 'path', label: 'Path' },
  { key: 'status', label: 'Status', width: '76px', numeric: true },
  { key: 'ms', label: 'Duration', width: '96px', numeric: true },
  { key: 'region', label: 'Region', width: '80px' },
]

const LEVEL_TONE: Record<Level, 'neutral' | 'warning' | 'danger'> = { info: 'neutral', warn: 'warning', error: 'danger' }

/* Following the tail: a new invocation lands every 1.8 s, newest on top. */
const pool: Omit<Line, 'id' | 'time'>[] = [
  { level: 'info', method: 'GET', path: '/api/session', status: 200, ms: 16, region: 'jkt1' },
  { level: 'info', method: 'GET', path: '/v1/fx/quotes?pair=SGDIDR', status: 200, ms: 5, region: 'jkt1' },
  { level: 'info', method: 'GET', path: '/api/settlements?status=pending', status: 200, ms: 88, region: 'jkt1' },
  { level: 'warn', method: 'POST', path: '/api/webhooks/settlement', status: 429, ms: 2, region: 'sin1' },
  { level: 'info', method: 'GET', path: '/api/merchants/MR-41870', status: 200, ms: 51, region: 'sin1' },
  { level: 'info', method: 'POST', path: '/api/payouts/preview', status: 200, ms: 133, region: 'jkt1' },
  { level: 'error', method: 'POST', path: '/api/webhooks/settlement', status: 502, ms: 10_003, region: 'jkt1' },
  { level: 'info', method: 'GET', path: '/api/session', status: 200, ms: 14, region: 'jkt1' },
]
let seq = 0
let ms = 12_408
let timer: number | undefined

function tail() {
  const base = pool[seq % pool.length]
  seq += 1
  ms += 1_800 + ((seq * 137) % 400)
  const s = Math.floor(ms / 1000)
  const time = `04:${String(47 + Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}.${String(ms % 1000).padStart(3, '0')}`
  lines.value = [{ ...base, id: `t${seq}`, time }, ...lines.value].slice(0, 40)
}

watch(
  follow,
  (on) => {
    clearInterval(timer)
    if (on) timer = window.setInterval(tail, 1800)
  },
  { immediate: true },
)
onBeforeUnmount(() => clearInterval(timer))

</script>

<template>
  <div class="s-dep-logs">
    <section class="s-dep-logs__stats r-grid-ruled" aria-label="Runtime summary">
      <div class="s-dep-logs__stat"><RReadout label="Invocations · 1 min" value="1,284" unit="req" /></div>
      <div class="s-dep-logs__stat"><RReadout label="Error rate · 15 min" value="0.42" unit="%" sub="Settlement webhook 502s" /></div>
      <div class="s-dep-logs__stat"><RReadout label="p95 duration · 15 min" value="142" unit="ms" sub="p50 18 ms" /></div>
      <div class="s-dep-logs__stat"><RReadout label="Cold starts · 1 h" value="3" unit="jkt1 · sin1" sub="Mean 212 ms" /></div>
    </section>

    <RCard index="04" eyebrow="Runtime" title="Function logs" meta="Production · app.lintang.example" padding="none" class="s-dep-logs__card">
      <div class="s-dep-logs__toolbar">
        <RSegmented v-model="level" :options="levels" size="sm" label="Level" />
        <RInput v-model="query" size="sm" placeholder="Filter by path, status or region" clearable aria-label="Filter logs" class="s-dep-logs__search">
          <template #leading><Search /></template>
        </RInput>
        <span class="s-dep-logs__follow">
          <RStatus v-if="follow" tone="signal" pulse label="Live" size="sm" />
          <RSwitch v-model="follow" size="sm">Follow</RSwitch>
        </span>
      </div>
      <RTable :columns="columns" :rows="visible" density="compact" max-height="460px" sticky-header caption="Production function logs" empty-text="No log lines match the filter.">
        <template #cell-time="{ value }"><span class="r-mono r-text-tertiary">{{ value }}</span></template>
        <template #cell-level="{ row }">
          <RBadge :tone="LEVEL_TONE[row.level as Level]" size="sm">{{ row.level }}</RBadge>
        </template>
        <template #cell-method="{ value }"><span class="r-mono">{{ value }}</span></template>
        <template #cell-path="{ value }"><span class="r-mono s-dep-logs__path">{{ value }}</span></template>
        <template #cell-status="{ value }">
          <span class="r-mono" :class="{ 's-dep-logs__bad': value >= 500, 's-dep-logs__warn': value >= 400 && value < 500 }">{{ value }}</span>
        </template>
        <template #cell-ms="{ value }"><span class="r-mono">{{ value.toLocaleString('en-US') }} ms</span></template>
        <template #cell-region="{ value }"><span class="r-mono r-text-tertiary">{{ value }}</span></template>
      </RTable>
    </RCard>
  </div>
</template>

<style scoped>
.s-dep-logs {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.s-dep-logs__stats {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.s-dep-logs__stat {
  padding: 14px 20px;
}
.s-dep-logs__card {
  gap: 0;
}
.s-dep-logs__card :deep(.r-card__header) {
  padding-bottom: 14px;
}
.s-dep-logs__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  padding: 0 20px 14px;
}
.s-dep-logs__search {
  flex: 1 1 240px;
  max-width: 360px;
}
.s-dep-logs__follow {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  margin-left: auto;
}
.s-dep-logs__follow :deep(.r-switch) {
  align-items: center;
  font-size: var(--r-text-sm);
}
.s-dep-logs__path {
  display: inline-block;
  max-width: 420px;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
}
.s-dep-logs__bad {
  color: var(--r-danger-text);
}
.s-dep-logs__warn {
  color: var(--r-warning-text);
}

@media (max-width: 899px) {
  .s-dep-logs__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 640px) {
  .s-dep-logs__toolbar {
    padding: 0 16px 12px;
  }
  .s-dep-logs__follow {
    margin-left: 0;
  }
  .s-dep-logs__stat {
    padding: 12px 14px;
  }
}
</style>
