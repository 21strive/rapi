<script setup lang="ts">
import { computed } from 'vue'
import { Power } from 'lucide-vue-next'
import { RAvatar, RBadge, RButton, RCard, REmpty, RStatus, RTable, type TableColumn } from '@/design-system'
import { sessionsToday, type PrivilegedSession, type SessionAccess } from '../data'

const props = defineProps<{ sessions: PrivilegedSession[]; now: number }>()
const emit = defineEmits<{ end: [session: PrivilegedSession] }>()

const columns: TableColumn[] = [
  { key: 'live', label: 'State', width: '84px' },
  { key: 'user', label: 'User' },
  { key: 'target', label: 'Target system' },
  { key: 'access', label: 'Access' },
  { key: 'ticket', label: 'Ticket' },
  { key: 'duration', label: 'Duration', numeric: true },
  { key: 'action', label: 'Action', align: 'right', width: '72px' },
]

const two = (n: number) => String(n).padStart(2, '0')
function elapsed(started: number) {
  const s = Math.max(0, Math.floor((props.now - started) / 1000))
  return `${two(Math.floor(s / 3600))}:${two(Math.floor((s % 3600) / 60))}:${two(s % 60)}`
}

const ACCESS: Record<SessionAccess, { label: string; tone: 'neutral' | 'warning' | 'brand'; variant: 'soft' | 'outline' }> = {
  'read-only': { label: 'Read only', tone: 'neutral', variant: 'outline' },
  'read-write': { label: 'Read-write', tone: 'neutral', variant: 'soft' },
  admin: { label: 'Admin', tone: 'brand', variant: 'soft' },
  'break-glass': { label: 'Break-glass', tone: 'warning', variant: 'soft' },
}

const rows = computed(() => props.sessions.map((s) => ({ ...s, duration: elapsed(s.started) })))
const longest = computed(() => (rows.value.length ? rows.value[0].duration : '00:00:00'))
const breakGlass = computed(() => props.sessions.filter((s) => s.access === 'break-glass').length)
</script>

<template>
  <RCard
    index="04"
    eyebrow="Recorded through jump-01"
    title="Privileged sessions now"
    padding="none"
    class="s-access-review-sessions"
  >
    <template #actions>
      <RStatus tone="signal" pulse size="sm" :label="`${sessions.length} live`" />
    </template>

    <div class="s-access-review-sessions__body">
      <dl class="s-access-review-sessions__figures">
        <div>
          <dt>Live now</dt>
          <dd>{{ sessions.length }}</dd>
        </div>
        <div>
          <dt>Break-glass</dt>
          <dd :class="{ 'is-warning': breakGlass > 0 }">{{ breakGlass }}</dd>
        </div>
        <div>
          <dt>Longest open</dt>
          <dd>{{ longest }}</dd>
        </div>
        <div>
          <dt>Opened today</dt>
          <dd>{{ sessionsToday }}</dd>
        </div>
      </dl>
      <RTable
        v-if="sessions.length"
        :columns="columns"
        :rows="rows"
        density="compact"
        caption="Privileged sessions open right now"
      >
        <template #cell-live>
          <RStatus tone="signal" pulse size="sm" label="Live" />
        </template>
        <template #cell-user="{ row }">
          <span class="s-access-review-sessions__user">
            <RAvatar :name="row.user" size="xs" decorative />
            <span>{{ row.user }}</span>
          </span>
        </template>
        <template #cell-target="{ row }">
          <span class="s-access-review-sessions__target">{{ row.target }}</span>
          <span class="s-access-review-sessions__tool">{{ row.tool }}</span>
        </template>
        <template #cell-access="{ row }">
          <RBadge
            :tone="ACCESS[row.access as SessionAccess].tone"
            :variant="ACCESS[row.access as SessionAccess].variant"
            size="sm"
            :dot="row.access === 'break-glass'"
          >
            {{ ACCESS[row.access as SessionAccess].label }}
          </RBadge>
        </template>
        <template #cell-ticket="{ row }">
          <span class="s-access-review-sessions__ticket">{{ row.ticket }}</span>
        </template>
        <template #cell-action="{ row }">
          <RButton
            size="xs"
            variant="ghost"
            tone="danger"
            :aria-label="`End the session of ${row.user} on ${row.target}`"
            @click="emit('end', row as PrivilegedSession)"
          >
            <template #leading><Power /></template>
            End
          </RButton>
        </template>
      </RTable>
      <div v-else class="s-access-review-sessions__empty">
        <REmpty size="sm" title="No privileged sessions" body="Sessions appear here the moment someone opens one through jump-01." />
      </div>
      <p class="s-access-review-sessions__foot">
        <span>Every keystroke recorded</span>
        <span>Break-glass pages the CISO on call</span>
        <span>Recordings kept 400 days</span>
      </p>
    </div>
  </RCard>
</template>

<style scoped>
.s-access-review-sessions__body {
  display: flex;
  flex-direction: column;
  min-width: 0;
  border-top: 1px solid var(--r-border);
}

.s-access-review-sessions__figures {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border-bottom: 1px solid var(--r-border);
}
.s-access-review-sessions__figures > div {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding: 10px 16px;
}
.s-access-review-sessions__figures > div + div {
  border-left: 1px solid var(--r-border-subtle);
}
.s-access-review-sessions__figures dt {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-medium);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
}
.s-access-review-sessions__figures dd {
  margin: 0;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xl);
  font-weight: var(--r-weight-medium);
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
  letter-spacing: -0.02em;
}
.s-access-review-sessions__figures dd.is-warning {
  color: var(--r-warning-text);
}

.s-access-review-sessions__user {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.s-access-review-sessions__target {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
}

.s-access-review-sessions__tool {
  margin-left: 8px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.s-access-review-sessions__ticket {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
}

.s-access-review-sessions__empty {
  padding: 8px 16px;
}

.s-access-review-sessions__foot {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 20px;
  padding: 10px 16px;
  border-top: 1px solid var(--r-border);
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
@media (max-width: 560px) {
  .s-access-review-sessions__figures {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .s-access-review-sessions__figures > div:nth-child(3) {
    border-left: 0;
  }
  .s-access-review-sessions__figures > div:nth-child(n + 3) {
    border-top: 1px solid var(--r-border-subtle);
  }
}
</style>
