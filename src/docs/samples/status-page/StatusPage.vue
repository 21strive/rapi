<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { Mail } from 'lucide-vue-next'
import {
  RAlert,
  RBadge,
  RButton,
  RInput,
  RLineChart,
  RLogo,
  RRule,
  RSegmented,
  RStatus,
  RTimeline,
  RTooltip,
  formatNumber,
  useToast,
  type StatusTone,
  type TimelineItem,
} from '@/design-system'
import {
  COMPONENT_WORD,
  HOURS,
  STATE_WORD,
  groups,
  incidents,
  latency,
  uptime,
  type Component,
  type ComponentState,
  type Incident,
  type UpdateKind,
} from './data'

const { show } = useToast()

const TONE: Record<ComponentState, StatusTone> = { operational: 'success', degraded: 'warning', partial: 'signal', major: 'danger' }
const order: ComponentState[] = ['operational', 'degraded', 'partial', 'major']
const all = groups.flatMap((g) => g.components)
const componentCount = all.length
const operational = all.filter((c) => c.state === 'operational').length
const worst = (list: Component[]) => list.reduce<ComponentState>((w, c) => (order.indexOf(c.state) > order.indexOf(w) ? c.state : w), 'operational')

/* ── Uptime strips: 90 days, 30 on a phone. Arrow keys walk the days. ──── */
const narrow = ref(false)
let media: MediaQueryList | undefined
const onMedia = () => (narrow.value = !!media?.matches)
onMounted(() => {
  media = window.matchMedia('(max-width: 640px)')
  onMedia()
  media.addEventListener('change', onMedia)
})
onBeforeUnmount(() => media?.removeEventListener('change', onMedia))

const span = computed(() => (narrow.value ? 30 : 90))
const visibleDays = (c: Component) => c.days.slice(-span.value)
const active = reactive<Record<string, number>>({})
const activeOf = (c: Component) => active[c.id] ?? span.value - 1

function onStripKey(event: KeyboardEvent, c: Component) {
  const last = span.value - 1
  const now = activeOf(c)
  const next = event.key === 'ArrowLeft' ? now - 1 : event.key === 'ArrowRight' ? now + 1 : event.key === 'Home' ? 0 : event.key === 'End' ? last : null
  if (next === null) return
  event.preventDefault()
  active[c.id] = Math.min(last, Math.max(0, next))
  nextTick(() => document.getElementById(`s-status-page-${c.id}-${active[c.id]}`)?.focus())
}

const pct = (v: number) => `${formatNumber(v, { minimumFractionDigits: 2, maximumFractionDigits: 3 })}%`
const dayLabel = (d: Component['days'][number]) =>
  `${d.date}: ${STATE_WORD[d.state]}${d.minutes ? `, ${d.minutes} min` : ''}${d.note && d.state !== 'none' ? `. ${d.note}` : ''}`

/* ── Response time ───────────────────────────────────────────────────────── */
const metric = ref<'api' | 'dashboard' | 'webhooks'>('webhooks')
const metrics = [
  { label: 'API', value: 'api' },
  { label: 'Dashboard', value: 'dashboard' },
  { label: 'Webhooks', value: 'webhooks' },
]
const m = computed(() => latency[metric.value])
const current = computed(() => m.value.values[m.value.values.length - 1])

/* ── Incidents ───────────────────────────────────────────────────────────── */
const KIND_TONE: Record<UpdateKind, StatusTone> = {
  Investigating: 'danger',
  Identified: 'warning',
  Monitoring: 'brand',
  Resolved: 'success',
  Scheduled: 'neutral',
  Completed: 'success',
}
const IMPACT: Record<Incident['impact'], { tone: StatusTone; label: string }> = {
  operational: { tone: 'success', label: 'No impact' },
  degraded: { tone: 'warning', label: 'Degraded' },
  partial: { tone: 'signal', label: 'Partial outage' },
  major: { tone: 'danger', label: 'Major outage' },
  maintenance: { tone: 'neutral', label: 'Maintenance' },
}
const expanded = ref<string[]>(['inc-1103', 'inc-1028'])
const toggle = (id: string) => (expanded.value = expanded.value.includes(id) ? expanded.value.filter((x) => x !== id) : [...expanded.value, id])
const updatesOf = (inc: Incident): TimelineItem[] =>
  (expanded.value.includes(inc.id) ? inc.updates : inc.updates.slice(0, 1)).map((u, i) => ({
    id: `${inc.id}-${i}`,
    time: u.time,
    title: u.kind,
    body: u.body,
    tone: KIND_TONE[u.kind],
  }))

/* ── Subscribe ───────────────────────────────────────────────────────────── */
const email = ref('')
const emailError = ref('')
const subscribed = ref('')
function subscribe() {
  const value = email.value.trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    emailError.value = 'Enter an email address, like ops@lintang.example.'
    return
  }
  emailError.value = ''
  subscribed.value = value
  email.value = ''
  show({ title: 'Confirmation sent', body: `Check ${value} for a link. It expires in 24 hours.`, tone: 'success' })
}

function jump(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <div class="s-status-page">
    <header class="s-status-page__top">
      <div class="s-status-page__inner s-status-page__top-row">
        <h1 class="r-sr-only">21 Strive status</h1>
        <a class="s-status-page__brand" href="#/samples/status-page" aria-label="21 Strive status, home">
          <RLogo brand="21strive" variant="mark" :size="16" label="" />
          <span class="s-status-page__brand-name">21 Strive</span>
          <span class="s-status-page__brand-sep" aria-hidden="true">/</span>
          <span class="s-status-page__brand-page">Status</span>
        </a>
        <RButton variant="outline" size="sm" @click="jump('s-status-page-subscribe')">
          <template #leading><Mail /></template>
          Subscribe
        </RButton>
      </div>
    </header>

    <main class="s-status-page__inner s-status-page__main">
      <section class="s-status-page__now" aria-label="Current status">
        <RAlert tone="warning" title="Webhook deliveries are delayed">
          Some events reach merchant endpoints up to 4 minutes late. Payments, the API and the dashboard work normally.
          <template #actions>
            <RButton variant="ghost" size="sm" @click="jump('inc-1103')">Read the updates</RButton>
          </template>
        </RAlert>
        <p class="s-status-page__stamp r-label">
          Updated 04:38Z · next update by 05:10Z · {{ operational }} of {{ componentCount }} components operational
        </p>
      </section>

      <section class="s-status-page__section" aria-labelledby="s-status-page-components">
        <RRule id="s-status-page-components" as="h2" index="01" label="Components" :meta="`Uptime, last ${span} days`" />
        <ul class="s-status-page__legend" aria-label="Legend">
          <li><i class="is-ok" />Operational</li>
          <li><i class="is-maintenance r-hatch" />Maintenance</li>
          <li><i class="is-degraded" />Degraded</li>
          <li><i class="is-partial" />Partial outage</li>
          <li><i class="is-major" />Major outage</li>
          <li><i class="is-none r-hatch" />No data</li>
        </ul>

        <div v-for="g in groups" :key="g.id" class="s-status-page__group">
          <div class="s-status-page__group-head">
            <h3 class="s-status-page__group-name">{{ g.name }}</h3>
            <RStatus :tone="TONE[worst(g.components)]" :label="COMPONENT_WORD[worst(g.components)]" size="sm" />
          </div>
          <div v-for="c in g.components" :key="c.id" class="s-status-page__comp">
            <div class="s-status-page__comp-head">
              <span class="s-status-page__comp-name">
                <span>{{ c.name }}</span>
                <span class="r-caption r-text-tertiary">{{ c.description }}</span>
              </span>
              <RStatus :tone="TONE[c.state]" :label="COMPONENT_WORD[c.state]" :pulse="c.state !== 'operational'" size="sm" />
            </div>
            <div class="s-status-page__strip" role="group" :aria-label="`${c.name}, last ${span} days, ${pct(uptime(c, span))} uptime`" @keydown="onStripKey($event, c)">
              <RTooltip v-for="(d, i) in visibleDays(c)" :key="i" placement="top" :delay="80" :describe="false">
                <span
                  :id="`s-status-page-${c.id}-${i}`"
                  class="s-status-page__day"
                  :class="[`is-${d.state}`, { 'r-hatch': d.state === 'none' || d.state === 'maintenance' }]"
                  role="img"
                  :aria-label="dayLabel(d)"
                  :tabindex="i === activeOf(c) ? 0 : -1"
                  @focus="active[c.id] = i"
                />
                <template #content>
                  <span class="s-status-page__tip">
                    <span class="s-status-page__tip-date">{{ d.date }}</span>
                    <span class="s-status-page__tip-state" :class="`is-${d.state}`">
                      <i />{{ STATE_WORD[d.state] }}<template v-if="d.minutes"> · {{ d.minutes }} min</template>
                    </span>
                    <span v-if="d.note && d.state !== 'none'" class="s-status-page__tip-note">{{ d.note }}</span>
                  </span>
                </template>
              </RTooltip>
            </div>
            <div class="s-status-page__strip-foot r-label" aria-hidden="true">
              <span>{{ span }} days ago</span>
              <span class="s-status-page__strip-line" />
              <span class="s-status-page__uptime">{{ pct(uptime(c, span)) }} uptime</span>
              <span class="s-status-page__strip-line" />
              <span>Today</span>
            </div>
          </div>
        </div>
      </section>

      <section class="s-status-page__section" aria-labelledby="s-status-page-latency">
        <RRule id="s-status-page-latency" as="h2" index="02" label="Response time" meta="Last 24 hours · UTC" />
        <div class="s-status-page__latency-head">
          <RSegmented v-model="metric" :options="metrics" size="sm" label="Component" />
          <p class="s-status-page__latency-now">
            <span class="r-label">Now</span>
            <span class="s-status-page__latency-figure r-numeric">{{ formatNumber(current) }}</span>
            <span class="r-label">{{ m.unit }}</span>
            <RStatus v-if="current > m.slo" tone="warning" label="Above SLO" size="sm" />
            <RStatus v-else tone="success" label="Within SLO" size="sm" />
          </p>
        </div>
        <RLineChart
          :labels="HOURS"
          :series="[{ name: m.series, values: m.values, color: 'var(--r-chart-1)' }]"
          :now="HOURS.length - 1"
          :references="[{ value: m.slo, label: `SLO ${m.slo} ${m.unit}`, kind: 'threshold' }]"
          :y-unit="m.unit"
          :format="(v: number) => `${formatNumber(v)} ${m.unit}`"
          :height="220"
          :label="`${m.label} ${m.series} by hour over the last 24 hours, in ${m.unit === 's' ? 'seconds' : 'milliseconds'}, against the ${m.slo} ${m.unit} objective`"
        />
        <p class="r-caption r-text-tertiary">{{ m.note }}.</p>
      </section>

      <section class="s-status-page__section" aria-labelledby="s-status-page-incidents">
        <RRule id="s-status-page-incidents" as="h2" index="03" label="Incident history" meta="Last 30 days" />
        <article v-for="inc in incidents" :id="inc.id" :key="inc.id" class="s-status-page__incident">
          <header class="s-status-page__incident-head">
            <p class="r-label">{{ inc.date }}</p>
            <h3 class="s-status-page__incident-title">{{ inc.title }}</h3>
            <div class="s-status-page__incident-meta">
              <RStatus :tone="IMPACT[inc.impact].tone" :label="IMPACT[inc.impact].label" size="sm" :pulse="inc.id === 'inc-1103'" />
              <RBadge v-for="c in inc.components" :key="c" size="sm" variant="outline">{{ c }}</RBadge>
              <span class="r-caption r-text-tertiary">{{ inc.duration }}</span>
            </div>
          </header>
          <RTimeline :items="updatesOf(inc)" dense />
          <RButton v-if="inc.updates.length > 1 && inc.id !== 'inc-1103'" variant="ghost" size="xs" class="s-status-page__more" @click="toggle(inc.id)">
            {{ expanded.includes(inc.id) ? 'Show only the last update' : `Show all ${inc.updates.length} updates` }}
          </RButton>
        </article>
      </section>

      <section id="s-status-page-subscribe" class="s-status-page__section" aria-labelledby="s-status-page-sub">
        <RRule id="s-status-page-sub" as="h2" index="04" label="Subscribe" meta="Email" />
        <form class="s-status-page__subscribe" novalidate @submit.prevent="subscribe">
          <RInput v-model="email" type="email" label="Get an email when an incident opens, changes or closes" placeholder="ops@lintang.example" autocomplete="email" :error="emailError" class="s-status-page__email" />
          <RButton type="submit" tone="brand">Subscribe</RButton>
        </form>
        <RAlert v-if="subscribed" tone="success" title="Check your inbox" dismissible @dismiss="subscribed = ''">
          We sent a confirmation link to {{ subscribed }}. It expires in 24 hours.
        </RAlert>
      </section>
    </main>

    <footer class="s-status-page__foot">
      <div class="s-status-page__inner s-status-page__foot-row">
        <span>21 Strive · status.21strive.example</span>
        <span>Checked every 30 s from Jakarta, Singapore and Tokyo · times in UTC</span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.s-status-page {
  min-height: 100dvh;
  background: var(--r-bg-canvas);
  color: var(--r-text);
}
.s-status-page__inner {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 0 24px;
}

/* Header */
.s-status-page__top {
  border-bottom: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}
.s-status-page__top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: 56px;
}
.s-status-page__brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--r-text);
  text-decoration: none;
}
.s-status-page__brand-name {
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
}
.s-status-page__brand-sep {
  color: var(--r-border-strong);
}
.s-status-page__brand-page {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.s-status-page__main {
  display: flex;
  flex-direction: column;
  gap: 48px;
  padding-top: 32px;
  padding-bottom: 64px;
}
.s-status-page__now {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.s-status-page__section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  scroll-margin-top: 16px;
}

/* Legend: the status colours always beside their words */
.s-status-page__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 18px;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}
.s-status-page__legend li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.s-status-page__legend i {
  display: inline-block;
  width: 8px;
  height: 12px;
}

/* Quiet days recede: the success tint, not the lamp green, so the incidents carry the row. */
.is-ok {
  --day: var(--r-success-border);
}
.is-maintenance {
  --day: var(--r-success-border);
}
.is-degraded {
  --day: var(--r-status-warning);
}
.is-partial {
  --day: var(--r-status-serious);
}
.is-major {
  --day: var(--r-status-critical);
}
.is-none {
  --day: var(--r-bg-muted);
}
.s-status-page__legend i,
.s-status-page__day {
  background-color: var(--day);
}
.s-status-page__legend i.is-none,
.s-status-page__day.is-none {
  outline: 1px solid var(--r-border);
  outline-offset: -1px;
}

/* Groups and components */
.s-status-page__group {
  border: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}
.s-status-page__group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: 40px;
  padding: 0 16px;
  border-bottom: 1px solid var(--r-border);
  background: var(--r-bg-muted);
}
.s-status-page__group-name {
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-semibold);
}
.s-status-page__comp {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px 12px;
  border-bottom: 1px solid var(--r-border-subtle);
}
.s-status-page__comp:last-child {
  border-bottom: 0;
}
.s-status-page__comp-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.s-status-page__comp-head > :last-child,
.s-status-page__group-head > :last-child {
  flex: none;
}
.s-status-page__comp-name {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 2px 10px;
  min-width: 0;
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
}
.s-status-page__comp-name .r-caption {
  font-weight: var(--r-weight-regular);
}

.s-status-page__strip {
  display: flex;
  gap: 2px;
  height: 22px;
}
.s-status-page__strip :deep(.r-tooltip-trigger) {
  flex: 1 1 0;
  min-width: 0;
}
.s-status-page__day {
  display: block;
  width: 100%;
  height: 22px;
  outline-offset: 1px;
  cursor: default;
}
.s-status-page__day:hover {
  filter: brightness(0.86);
}
.s-status-page__strip-foot {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--r-text-tertiary);
}
.s-status-page__strip-line {
  flex: 1;
  height: 1px;
  background: var(--r-border-subtle);
}
.s-status-page__uptime {
  color: var(--r-text-secondary);
}

/* Tooltip content (rendered in the tooltip's dark island) */
.s-status-page__tip {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 2px 0;
}
.s-status-page__tip-date {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--r-text-tertiary);
}
.s-status-page__tip-state {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: var(--r-weight-medium);
}
.s-status-page__tip-state i {
  display: inline-block;
  width: 6px;
  height: 10px;
  background: var(--day);
}
.s-status-page__tip-note {
  color: var(--r-text-secondary);
}

/* Response time */
.s-status-page__latency-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.s-status-page__latency-now {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
}
.s-status-page__latency-figure {
  font-size: var(--r-text-2xl);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-tight);
  line-height: 1;
}

/* Incidents */
.s-status-page__incident {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px 0 20px;
  border-bottom: 1px solid var(--r-border);
  scroll-margin-top: 16px;
}
.s-status-page__incident:first-of-type {
  padding-top: 4px;
}
.s-status-page__incident-head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.s-status-page__incident-title {
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
}
.s-status-page__incident-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
  margin-top: 4px;
}
.s-status-page__more {
  align-self: flex-start;
}

/* Subscribe */
.s-status-page__subscribe {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 12px;
}
.s-status-page__subscribe > :last-child {
  margin-top: 22px;
}

.s-status-page__foot {
  border-top: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}
.s-status-page__foot-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px 24px;
  padding-top: 20px;
  padding-bottom: 88px;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

@media (max-width: 640px) {
  .s-status-page__inner {
    padding-right: 16px;
    padding-left: 16px;
  }
  .s-status-page__main {
    gap: 40px;
    padding-top: 20px;
  }
  .s-status-page__comp-head {
    align-items: flex-start;
  }
  .s-status-page__subscribe {
    grid-template-columns: minmax(0, 1fr);
  }
  .s-status-page__subscribe > :last-child {
    margin-top: 0;
  }
}
</style>
