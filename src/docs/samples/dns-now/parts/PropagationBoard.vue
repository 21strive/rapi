<script setup lang="ts">
/**
 * Propagation, live: ten resolvers from Jakarta outward, each with a lamp and a word for what it
 * answers right now. The newest change is on the board; anything else still settling is listed
 * under it. Nothing to press: Simpul keeps checking until every resolver has the new answer.
 */
import { computed } from 'vue'
import { RCard, RMeter, RReadout, RStatus, type StatusTone } from '@/design-system'
import type { ProbeState, Watch } from '../data'

const props = defineProps<{
  watch?: Watch
  /** Other changes still settling. */
  others: Watch[]
}>()

const STATE: Record<ProbeState, { tone: StatusTone; label: string }> = {
  match: { tone: 'success', label: 'Match' },
  stale: { tone: 'warning', label: 'Stale' },
  timeout: { tone: 'danger', label: 'Timeout' },
  checking: { tone: 'neutral', label: 'Checking' },
}

const matchedOf = (w: Watch) => w.probes.filter((p) => p.state === 'match').length
const total = computed(() => props.watch?.probes.length ?? 0)
const matched = computed(() => (props.watch ? matchedOf(props.watch) : 0))
const live = computed(() => !!props.watch && !props.watch.settledAt)
const done = computed(() => total.value > 0 && matched.value === total.value)
const summary = computed(() => (props.watch ? `${matched.value} of ${total.value} resolvers answer ${props.watch.expect} for ${props.watch.host}` : ''))
</script>

<template>
  <RCard v-if="watch" eyebrow="Propagation" :meta="`${watch.type} · TTL ${watch.ttl}`" :title="watch.host" title-as="h3" marks class="dn-board">
    <template #actions>
      <RStatus v-if="live" tone="signal" pulse label="Live" size="sm" />
      <RStatus v-else tone="success" label="Settled" size="sm" />
    </template>

    <div class="dn-board__sum">
      <RReadout label="New value" :value="`${matched}/${total}`" size="md" :tone="done ? 'success' : 'warning'" />
      <div class="dn-board__meter">
        <RMeter variant="segments" :count="total" :max="total" :value="matched" :height="12" :tone="done ? 'success' : 'brand'" :label="summary" />
        <dl class="dn-board__vals">
          <dt class="r-label">New</dt>
          <dd class="r-mono" :title="watch.expect">{{ watch.expect }}</dd>
          <dt class="r-label">Old</dt>
          <dd class="r-mono" :title="watch.old">{{ watch.old }}</dd>
        </dl>
      </div>
    </div>

    <ul class="dn-board__list" :aria-label="`Resolvers checking ${watch.host}`">
      <li v-for="p in watch.probes" :key="p.code" class="dn-board__row" :class="`is-${p.state}`">
        <span class="dn-board__where">
          <span class="dn-board__city">{{ p.city }}</span>
          <span class="r-label">{{ p.code }}</span>
        </span>
        <span class="dn-board__answer r-mono" :title="p.answer">{{ p.state === 'checking' ? '' : p.answer }}</span>
        <span class="dn-board__ms r-mono">{{ p.state === 'checking' ? '' : p.state === 'timeout' ? '—' : `${p.ms} ms` }}</span>
        <RStatus :tone="STATE[p.state].tone" :label="STATE[p.state].label" :pulse="p.state === 'checking'" size="sm" />
      </li>
    </ul>

    <p class="r-sr-only" role="status">{{ summary }}</p>

    <template #footer>
      <div class="dn-board__foot">
        <p class="dn-board__when">
          Changed {{ watch.startedAt }} by {{ watch.who }} ·
          <span v-if="watch.settledAt">settled {{ watch.settledAt }}</span>
          <span v-else>settles by {{ watch.settleBy }}</span>
        </p>
        <p v-if="watch.note" class="dn-board__note">{{ watch.note }}</p>
        <ul v-if="others.length" class="dn-board__others" aria-label="Also settling">
          <li v-for="o in others" :key="o.key + o.startedAt">
            <span class="r-label">Also settling</span>
            <span class="r-mono dn-board__other-host">{{ o.host }} {{ o.type }}</span>
            <span class="r-mono">{{ matchedOf(o) }}/{{ o.probes.length }}</span>
          </li>
        </ul>
      </div>
    </template>
  </RCard>
</template>

<style scoped>
.dn-board :deep(.r-card__title) {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-medium);
  letter-spacing: 0;
  overflow-wrap: anywhere;
}

.dn-board__sum {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: end;
  gap: 18px;
  padding: 12px 0;
  border-top: 1px solid var(--r-border-subtle);
  border-bottom: 1px solid var(--r-border-subtle);
}

.dn-board__meter {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.dn-board__vals {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: baseline;
  gap: 2px 8px;
  margin: 0;
  font-size: var(--r-text-sm);
}

.dn-board__vals dd {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dn-board__vals dd:last-of-type {
  color: var(--r-text-tertiary);
}

.dn-board__list {
  display: flex;
  flex-direction: column;
  margin: -6px 0;
  padding: 0;
  list-style: none;
}

.dn-board__row {
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr) 44px 74px;
  align-items: center;
  gap: 8px;
  min-height: 30px;
  border-bottom: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-sm);
}

.dn-board__row:last-child {
  border-bottom: 0;
}

.dn-board__where {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}

.dn-board__city {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dn-board__answer {
  overflow: hidden;
  color: var(--r-text-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.is-stale .dn-board__answer {
  color: var(--r-warning-text);
}

.is-timeout .dn-board__answer {
  color: var(--r-danger-text);
}

.dn-board__ms {
  color: var(--r-text-tertiary);
  text-align: right;
}

.dn-board__foot {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dn-board__when {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
}

.dn-board__note {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.45;
}

.dn-board__others {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0;
  padding: 6px 0 0;
  border-top: 1px solid var(--r-border-subtle);
  list-style: none;
}

.dn-board__others li {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: var(--r-text-xs);
}

.dn-board__other-host {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@container (max-width: 380px) {
  .dn-board__row {
    grid-template-columns: minmax(0, 1fr) 82px;
    row-gap: 0;
    padding: 4px 0;
  }
  .dn-board__answer {
    grid-column: 1;
    grid-row: 2;
  }
  .dn-board__ms {
    grid-column: 2;
    grid-row: 2;
    text-align: left;
  }
}
</style>
