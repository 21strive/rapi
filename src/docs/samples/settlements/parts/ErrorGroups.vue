<script setup lang="ts">
/** A small error tracker: grouped errors with their last 24 hours, resolve or mute. */
import { computed, ref } from 'vue'
import { BellOff, Check, RotateCcw } from 'lucide-vue-next'
import { RBadge, RCard, REmpty, RIconButton, RSegmented, RSparkline } from '@/design-system'
import { count, type ErrorGroup, type ErrorState } from '../data'

const props = defineProps<{ groups: ErrorGroup[] }>()
const emit = defineEmits<{ change: [id: string, state: ErrorState] }>()

const show = ref<string | number>('open')
const showOptions = [
  { label: 'Open', value: 'open' },
  { label: 'All', value: 'all' },
]

const total = (g: ErrorGroup) => g.hourly.reduce((a, b) => a + b, 0)
const shown = computed(() => props.groups.filter((g) => show.value === 'all' || g.state === 'OPEN'))
const openCount = computed(() => props.groups.filter((g) => g.state === 'OPEN').length)
</script>

<template>
  <RCard
    id="s-settlements-errors"
    class="s-settlements-errors"
    index="05"
    eyebrow="Error groups"
    title="Errors"
    :meta="`${openCount} open · 24 h`"
    padding="none"
  >
    <template #actions>
      <RSegmented v-model="show" :options="showOptions" size="sm" label="Show error groups" />
    </template>
    <div class="s-settlements-errors__body">
      <div class="s-settlements-errors__head" aria-hidden="true">
        <span>Message</span>
        <span>24 h</span>
        <span>Events</span>
        <span />
      </div>
      <ul v-if="shown.length" class="s-settlements-errors__list">
        <li v-for="g in shown" :key="g.id" class="s-settlements-error" :class="{ 'is-closed': g.state !== 'OPEN' }">
          <p class="s-settlements-error__message" :title="g.message">{{ g.message }}</p>
          <p class="s-settlements-error__tags">
            <RBadge :tone="g.level === 'ERROR' ? 'danger' : 'warning'" size="sm">{{ g.level }}</RBadge>
            <RBadge v-if="g.isNew && g.state === 'OPEN'" tone="signal" size="sm">New</RBadge>
            <RBadge v-if="g.state !== 'OPEN'" size="sm">{{ g.state }}</RBadge>
            <span class="s-settlements-error__service">{{ g.service }}</span>
          </p>
          <p class="s-settlements-error__seen">First {{ g.firstSeen }} · last {{ g.lastSeen }}</p>
          <RSparkline
            class="s-settlements-error__spark"
            :values="g.hourly"
            :height="28"
            color="var(--r-chart-1)"
            :label="`${g.id}: ${count(total(g))} events in the last 24 hours, by hour`"
          />
          <span class="s-settlements-error__count">{{ count(total(g)) }}</span>
          <span class="s-settlements-error__actions">
            <template v-if="g.state === 'OPEN'">
              <RIconButton label="Resolve" size="xs" variant="ghost" @click="emit('change', g.id, 'RESOLVED')"><Check /></RIconButton>
              <RIconButton label="Mute for 24 hours" size="xs" variant="ghost" @click="emit('change', g.id, 'MUTED')"><BellOff /></RIconButton>
            </template>
            <RIconButton v-else label="Reopen" size="xs" variant="ghost" @click="emit('change', g.id, 'OPEN')"><RotateCcw /></RIconButton>
          </span>
        </li>
      </ul>
      <REmpty v-else size="sm" title="No open error groups" body="Resolved and muted groups are under All." />
    </div>
  </RCard>
</template>

<style scoped>
.s-settlements-errors {
  scroll-margin-top: 48px;
}

.s-settlements-errors__body {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* Rows share one grid with the head: message block, sparkline, count, actions. */
.s-settlements-errors__head,
.s-settlements-error {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 84px 52px 60px;
  column-gap: 12px;
  padding: 0 16px;
}

.s-settlements-errors__head {
  align-items: center;
  height: 28px;
  border-top: 1px solid var(--r-border);
  border-bottom: 1px solid var(--r-border);
  background: var(--r-bg-muted);
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-medium);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.s-settlements-errors__head > span:nth-child(3) {
  text-align: right;
}

.s-settlements-error {
  grid-template-areas:
    'msg   msg   msg   msg'
    'tags  spark count actions'
    'seen  spark count actions';
  row-gap: 4px;
  align-items: center;
  padding-top: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--r-border-subtle);
}
.s-settlements-error:last-child {
  border-bottom: 0;
}

.s-settlements-error.is-closed .s-settlements-error__message,
.s-settlements-error.is-closed .s-settlements-error__spark,
.s-settlements-error.is-closed .s-settlements-error__count {
  opacity: 0.5;
}

.s-settlements-error__message {
  grid-area: msg;
  overflow: hidden;
  color: var(--r-text);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.s-settlements-error__tags {
  display: flex;
  grid-area: tags;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.s-settlements-error__service {
  overflow: hidden;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.s-settlements-error__seen {
  grid-area: seen;
  overflow: hidden;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.s-settlements-error__spark {
  grid-area: spark;
}

.s-settlements-error__count {
  grid-area: count;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-sm);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.s-settlements-error__actions {
  display: flex;
  grid-area: actions;
  justify-content: flex-end;
  gap: 4px;
}

@media (min-width: 640px) {
  .s-settlements-errors__head,
  .s-settlements-error {
    padding-right: 20px;
    padding-left: 20px;
  }
}

/* Phones: the text gets the full width; the sparkline, count and actions share the last line. */
@media (max-width: 520px) {
  .s-settlements-errors__head {
    display: none;
  }
  .s-settlements-error {
    grid-template-columns: minmax(0, 1fr) 52px 60px;
    grid-template-areas:
      'msg   msg   msg'
      'tags  tags  tags'
      'seen  seen  seen'
      'spark count actions';
  }
  .s-settlements-error__spark {
    margin-top: 4px;
  }
}
</style>
