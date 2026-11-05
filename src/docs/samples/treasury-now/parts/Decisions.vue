<script setup lang="ts">
/**
 * Needs you · the two smaller decisions Simpul prepared: the USD sweep that waits for a treasurer
 * and the EUR hedge. One control each; ten seconds to undo after. The hedge shows its effect on
 * the limit as a bar, because seeing 89% shrink to 67% is faster than reading it.
 */
import { computed, ref } from 'vue'
import { RButton, RStatus } from '@/design-system'
import { bn, eurAfter, eurBeforePct, eurShort, hedge, money, sweep } from '../data'
import type { TreasuryDesk } from '../script'
import { useKeepFocus } from './focus'

const props = defineProps<{ td: TreasuryDesk }>()
const s = props.td.state

const sweepLeft = computed(() => s.windows[s.sweepTrail] ?? 0)
const hedgeLeft = computed(() => s.windows[s.hedgeTrail] ?? 0)
const after = computed(() => eurAfter(s.hedgeEur))
const booked = computed(() => s.hedge !== 'proposed')

const sweepRow = ref<HTMLElement | null>(null)
const hedgeRow = ref<HTMLElement | null>(null)
useKeepFocus(sweepRow, () => [s.sweep, sweepLeft.value > 0])
useKeepFocus(hedgeRow, () => [s.hedge, hedgeLeft.value > 0])
</script>

<template>
  <ul class="tn-dec" aria-label="More decisions">
    <li ref="sweepRow" class="tn-dec__row" tabindex="-1">
      <div class="tn-dec__main">
        <RStatus v-if="s.sweep === 'approved'" tone="success" :label="`Approved ${s.sweepAt} · runs ${sweep.at}`" size="sm" />
        <p v-else class="r-eyebrow">Sweep · {{ sweep.at }} · earns 4.05%, not 3.20%</p>
        <h3 class="tn-dec__title">{{ money(sweep.amount, 'USD') }} to USD concentration</h3>
      </div>
      <div class="tn-dec__control">
        <RButton v-if="s.sweep === 'pending'" data-focus size="sm" variant="outline" @click="td.surface.approveSweep()">
          Approve sweep
        </RButton>
        <RButton
          v-else-if="sweepLeft > 0"
          data-focus
          size="sm"
          variant="ghost"
          :aria-label="`Undo the sweep approval, ${sweepLeft} seconds left`"
          @click="td.surface.revert(s.sweepTrail)"
        >
          Undo · {{ sweepLeft }} s
        </RButton>
      </div>
    </li>

    <li ref="hedgeRow" class="tn-dec__row tn-dec__row--hedge" tabindex="-1">
      <div class="tn-dec__main">
        <RStatus
          v-if="booked"
          :tone="hedgeLeft > 0 ? 'brand' : 'success'"
          :label="hedgeLeft > 0 ? `Sending to ${hedge.bank} · ${s.hedgeAt}` : `Dealt ${s.hedgeAt} · ${hedge.id}`"
          size="sm"
        />
        <p v-else class="r-eyebrow">FX hedge · {{ hedge.bank }}</p>
        <h3 class="tn-dec__title">Sell {{ eurShort(s.hedgeEur) }} forward to 4 Dec at {{ bn(hedge.rate, 0) }}</h3>
      </div>
      <div class="tn-dec__aside">
        <span
          class="tn-dec__bar"
          role="img"
          :aria-label="
            booked
              ? `EUR exposure ${after.pct}% of its limit after the forward`
              : `EUR exposure ${eurBeforePct}% of its limit, ${after.pct}% after the forward`
          "
        >
          <span class="tn-dec__seg" :style="{ width: `${after.pct}%` }" />
          <span v-if="!booked" class="tn-dec__seg is-off" :style="{ width: `${eurBeforePct - after.pct}%` }" />
        </span>
        <span class="tn-dec__pct">
          <template v-if="booked">{{ after.pct }}% of limit</template>
          <template v-else>{{ eurBeforePct }}% → {{ after.pct }}% of limit</template>
        </span>
      </div>
      <div class="tn-dec__control">
        <RButton v-if="s.hedge === 'proposed'" data-focus size="sm" variant="outline" @click="td.surface.bookHedge()">
          Book forward
        </RButton>
        <RButton
          v-else-if="hedgeLeft > 0"
          data-focus
          size="sm"
          variant="ghost"
          :aria-label="`Stop the forward before it is sent, ${hedgeLeft} seconds left`"
          @click="td.surface.revert(s.hedgeTrail)"
        >
          Undo · {{ hedgeLeft }} s
        </RButton>
      </div>
    </li>
  </ul>
</template>

<style>
.tn-dec {
  margin: 0;
  padding: 0;
  list-style: none;
  border: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}

/* One decision per line: what it is, the figure that decides it, the one control. */
.tn-dec__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 116px;
  align-items: center;
  gap: 16px;
  min-height: 56px;
  padding: 8px 14px 9px;
}

.tn-dec__row--hedge {
  grid-template-columns: minmax(0, 1fr) 132px 116px;
}

.tn-dec__row:focus {
  outline: none;
}

.tn-dec__row:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: -2px;
}

.tn-dec__row + .tn-dec__row {
  border-top: 1px solid var(--r-border-subtle);
}

.tn-dec__main {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  min-width: 0;
}

.tn-dec__main > * {
  max-width: 100%;
}

.tn-dec__main .r-eyebrow {
  overflow: hidden;
  color: var(--r-text-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tn-dec__title {
  overflow: hidden;
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tn-dec__aside {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

/* The EUR position against its limit (the full track): what stays open, and what the forward
   takes off, butted with a 2px gap like every Rapi bar. */
.tn-dec__bar {
  display: flex;
  gap: 2px;
  height: 6px;
  background: var(--r-chart-track);
}

.tn-dec__seg {
  background: var(--r-chart-1);
}

.tn-dec__seg.is-off {
  background: var(--r-chart-context);
}

.tn-dec__pct {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.tn-dec__control {
  display: flex;
  justify-content: flex-end;
}

@container tn (max-width: 620px) {
  .tn-dec__row,
  .tn-dec__row--hedge {
    grid-template-columns: minmax(0, 1fr) auto;
  }
  .tn-dec__aside {
    grid-column: 1;
  }
  .tn-dec__control {
    grid-row: 1 / span 2;
    grid-column: 2;
  }
  .tn-dec__title {
    white-space: normal;
  }
}
</style>
