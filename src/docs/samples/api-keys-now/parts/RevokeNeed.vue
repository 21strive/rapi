<script setup lang="ts">
/**
 * A revoke waiting for a hand: the key's last 30 days, when and where it was last used, and what
 * stops the moment it is revoked. Destructive, so the commit is a hold, or the key's name typed
 * in the thread.
 */
import { computed, useId } from 'vue'
import { RSparkline, formatNumber } from '@/design-system'
import { lastAt, scopeBadges, type DeskKey } from '../data'
import HoldButton from './HoldButton.vue'
import NeedFrame from './NeedFrame.vue'

const props = defineProps<{ keyRow: DeskKey; stops: string; called: boolean }>()
const emit = defineEmits<{ revoke: [] }>()

const hintId = useId()
const total = computed(() => props.keyRow.daily.reduce((a, b) => a + b, 0))
const today = computed(() => props.keyRow.daily[props.keyRow.daily.length - 1] ?? 0)
const last = computed(() => (props.keyRow.lastUsed === 'Never' ? 'Never' : `${lastAt[props.keyRow.id] ?? props.keyRow.lastUsed} WIB`))
</script>

<template>
  <NeedFrame
    :eyebrow="`Revoke · cannot be undone`"
    :title="keyRow.name"
    :sub="`${keyRow.prefix}… · ${scopeBadges(keyRow.scopes).join(', ')} · ${keyRow.team} team`"
    :called="called"
    danger
  >
    <div class="s-akn-revoke__use">
      <div class="s-akn-revoke__chart">
        <span class="r-label">Requests a day · 30 days</span>
        <RSparkline :values="keyRow.daily" :height="36" color="var(--r-chart-1)" area :label="`${keyRow.name}, requests a day for 30 days, ${formatNumber(total)} in all`" />
      </div>
      <dl class="s-akn-revoke__figures">
        <div>
          <dt class="r-label">Today</dt>
          <dd>{{ formatNumber(today) }}</dd>
        </div>
        <div>
          <dt class="r-label">30 days</dt>
          <dd>{{ formatNumber(total) }}</dd>
        </div>
        <div>
          <dt class="r-label">Last used</dt>
          <dd>{{ last }}</dd>
        </div>
      </dl>
    </div>
    <p class="s-akn-revoke__stops">
      <span class="r-label">Stops</span>
      <span>{{ stops }}</span>
    </p>
    <template #foot>
      <HoldButton label="Hold to revoke" :target="keyRow.name" :aria-describedby="hintId" @done="emit('revoke')" />
      <span :id="hintId" class="s-akn-create__or">or type “revoke {{ keyRow.name }}”</span>
    </template>
  </NeedFrame>
</template>

<style>
.s-akn-revoke__use {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
}

.s-akn-revoke__chart {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.s-akn-revoke__figures {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 0;
  border-top: 1px solid var(--r-border-subtle);
}

.s-akn-revoke__figures > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 8px 0 0;
}

.s-akn-revoke__figures dd {
  margin: 0;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-sm);
  font-variant-numeric: tabular-nums;
}

.s-akn-revoke__stops {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 10px;
  border-left: 2px solid var(--r-danger);
  background: var(--r-bg-muted);
  font-size: var(--r-text-sm);
  line-height: 1.45;
}
</style>
