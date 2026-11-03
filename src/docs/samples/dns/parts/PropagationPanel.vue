<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { RefreshCw } from 'lucide-vue-next'
import { RButton, RCard, RMeter, RReadout, RSelect, RStatus, useToast, type StatusTone } from '@/design-system'
import { ZONE, probe, type DnsRecord, type Probe, type ProbeState } from '../data'

const props = defineProps<{ records: DnsRecord[] }>()
/** Id of the record under test. */
const selected = defineModel<string>({ required: true })
const emit = defineEmits<{ settled: [id: string] }>()

const { show } = useToast()

const fqdn = (r: DnsRecord) => (r.name === ZONE.name ? ZONE.name : `${r.name}.${ZONE.name}`)
const options = computed(() =>
  props.records.filter((r) => r.type !== 'CAA').map((r) => ({ label: `${r.type.padEnd(5, ' ')} ${fqdn(r)}`, value: r.id })),
)
const record = computed(() => props.records.find((r) => r.id === selected.value) ?? props.records[0])

const STATE: Record<ProbeState, { tone: StatusTone; label: string }> = {
  match: { tone: 'success', label: 'Match' },
  stale: { tone: 'warning', label: 'Stale' },
  timeout: { tone: 'danger', label: 'Timeout' },
  checking: { tone: 'neutral', label: 'Checking' },
}

const runs = ref(0)
const probes = ref<Probe[]>(probe(record.value, 0))
const running = ref(false)
const checkedAt = ref('11:46:52 WIB')
let timers: number[] = []

const matched = computed(() => probes.value.filter((p) => p.state === 'match').length)
const total = computed(() => probes.value.length)
const expected = computed(() => probe(record.value, runs.value).find((p) => p.state === 'match')?.answer ?? record.value.content)

function clear() {
  timers.forEach((t) => clearTimeout(t))
  timers = []
}

function run(quiet = false) {
  clear()
  running.value = true
  const next = probe(record.value, runs.value, runs.value + 3)
  probes.value = next.map((p) => ({ ...p, state: 'checking', answer: '…', ms: 0 }))
  let done = 0
  next.forEach((result, i) => {
    // Answers land in the order they come back; a timeout waits out its two seconds.
    const wait = result.state === 'timeout' ? 2000 : Math.min(1500, 260 + result.ms * 3 + i * 40)
    timers.push(
      window.setTimeout(() => {
        probes.value = probes.value.map((p, k) => (k === i ? result : p))
        done += 1
        if (done === next.length) {
          running.value = false
          runs.value += 1
          const seconds = 52 + runs.value * 9
          checkedAt.value = `11:${String(46 + Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')} WIB`
          const ok = next.filter((p) => p.state === 'match').length
          if (ok === next.length) emit('settled', record.value.id)
          if (!quiet) {
            show({
              title: ok === next.length ? 'Propagated everywhere' : 'Check finished',
              body: `${ok} of ${next.length} resolvers answer ${expected.value} for ${fqdn(record.value)}.`,
              tone: ok === next.length ? 'success' : 'warning',
            })
          }
        }
      }, wait),
    )
  })
}

// A new record under test starts a fresh series of checks.
watch(selected, () => {
  runs.value = 0
  run(true)
})

onBeforeUnmount(clear)
defineExpose({ run })
</script>

<template>
  <RCard index="05" eyebrow="Propagation" title="Resolver check" :meta="`${total} resolvers`" marks class="s-dns-prop">
    <RSelect v-model="selected" :options="options" size="sm" label="Record" class="s-dns-prop__select" />

    <div class="s-dns-prop__summary">
      <RReadout label="New value" :value="`${matched}/${total}`" size="md" :tone="matched === total ? 'success' : 'warning'" />
      <div class="s-dns-prop__meter">
        <RMeter
          variant="segments"
          :count="total"
          :max="total"
          :value="matched"
          :height="14"
          :tone="matched === total ? 'success' : 'brand'"
          :label="`${matched} of ${total} resolvers answer the new value`"
        />
        <p class="s-dns-prop__expected">
          <span class="r-label">Expect</span>
          <span class="r-mono">{{ expected }}</span>
          <span v-if="record.proxied" class="r-caption r-text-tertiary">edge</span>
        </p>
      </div>
    </div>

    <ul class="s-dns-prop__list" aria-live="polite">
      <li v-for="p in probes" :key="p.resolver.id" class="s-dns-prop__row" :class="`is-${p.state}`">
        <span class="s-dns-prop__where">
          <span class="s-dns-prop__city">{{ p.resolver.city }}</span>
          <span class="r-label">{{ p.resolver.code }}</span>
        </span>
        <span class="s-dns-prop__answer r-mono" :title="p.answer">{{ p.answer }}</span>
        <span class="s-dns-prop__ms r-mono">{{ p.state === 'checking' ? '' : p.state === 'timeout' ? '—' : `${p.ms} ms` }}</span>
        <RStatus :tone="STATE[p.state].tone" :label="STATE[p.state].label" :pulse="p.state === 'checking'" size="sm" class="s-dns-prop__state" />
      </li>
    </ul>

    <template #footer>
      <div class="s-dns-prop__foot">
        <span class="r-caption r-text-tertiary">Checked {{ checkedAt }}</span>
        <RButton size="sm" variant="outline" :loading="running" @click="run()">
          <template #leading><RefreshCw /></template>
          Run check
        </RButton>
      </div>
    </template>
  </RCard>
</template>

<style scoped>
.s-dns-prop__select {
  width: 100%;
}

.s-dns-prop__summary {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: end;
  gap: 20px;
  padding: 14px 0;
  border-top: 1px solid var(--r-border-subtle);
  border-bottom: 1px solid var(--r-border-subtle);
}
.s-dns-prop__meter {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}
.s-dns-prop__expected {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
  font-size: var(--r-text-sm);
}
.s-dns-prop__expected .r-mono {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.s-dns-prop__list {
  display: flex;
  flex-direction: column;
  margin: -8px 0;
}
.s-dns-prop__row {
  display: grid;
  grid-template-columns: 116px minmax(0, 1fr) 44px 80px;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  border-bottom: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-sm);
}
.s-dns-prop__row:last-child {
  border-bottom: 0;
}
.s-dns-prop__where {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}
.s-dns-prop__city {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.s-dns-prop__answer {
  overflow: hidden;
  color: var(--r-text-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.is-stale .s-dns-prop__answer {
  color: var(--r-warning-text);
}
.is-timeout .s-dns-prop__answer {
  color: var(--r-danger-text);
}
.s-dns-prop__ms {
  color: var(--r-text-tertiary);
  text-align: right;
}
.s-dns-prop__state {
  justify-self: start;
}

.s-dns-prop__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

@media (max-width: 480px) {
  .s-dns-prop__row {
    grid-template-columns: minmax(0, 1fr) 84px;
    row-gap: 2px;
    padding: 6px 0;
  }
  .s-dns-prop__answer {
    grid-column: 1;
    grid-row: 2;
  }
  .s-dns-prop__ms {
    grid-column: 2;
    grid-row: 2;
    text-align: left;
  }
}
</style>
