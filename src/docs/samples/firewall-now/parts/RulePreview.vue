<script setup lang="ts">
/**
 * The decision. What the rule would have done to the last 24 hours of real traffic: how much it
 * would have stopped, how much of that looks like attacks and how much looks legitimate, and who,
 * group by group, with what happens to them today and with the rule. Legitimate traffic is
 * flagged, so the person can say "except …" before anything goes live. One brand button turns it
 * on, in log-only first; once on, it shows what it has recorded and when it starts to act.
 */
import { computed, useId } from 'vue'
import { RButton, RStatus, formatNumber } from '@/design-system'
import { ACTIONS } from '../../firewall/data'
import type { RuleAction } from '../../firewall/engine'
import { GROUPS, type Effect, type GroupKind, type Outcome } from '../whatif'

const props = defineProps<{
  mode: 'draft' | 'log'
  no: string
  name: string
  action: RuleAction
  effect: Effect
  expression: string
  /** What it counts: "sign-ins". */
  noun: string
  since?: string
  until?: string
  logged?: number
  /** "02 Block credential-stuffing networks", by rule id. */
  ruleLabel: (id: string) => string
}>()

const emit = defineEmits<{ 'turn-on': []; enforce: []; discard: [] }>()

const uid = useId()
const titleId = `${uid}-title`

const PAST: Record<RuleAction, string> = { block: 'blocked', challenge: 'challenged', log: 'logged', allow: 'allowed' }
const DOES: Record<RuleAction, string> = { block: 'blocks', challenge: 'challenges', log: 'logs', allow: 'allows' }
const WOULD: Record<RuleAction, string> = { block: 'Would block', challenge: 'Would challenge', log: 'Would log', allow: 'Would allow' }
const OUTCOME: Record<Outcome, string> = { block: 'Block', challenge: 'Challenge', allow: 'Allow', pass: 'Pass' }
const KIND: Record<GroupKind, { label: string; tone: 'warning' | 'neutral' | 'success' }> = {
  attack: { label: 'Attack', tone: 'neutral' },
  customers: { label: 'Customers', tone: 'warning' },
  yours: { label: 'Yours', tone: 'warning' },
  partner: { label: 'Partner', tone: 'warning' },
  monitor: { label: 'Monitor', tone: 'warning' },
}

const n = (v: number) => formatNumber(Math.round(v))
const share = computed(() => {
  const s = props.effect.share
  return s === 0 ? '0%' : s < 0.1 ? '<0.1%' : `${formatNumber(s, { maximumFractionDigits: 1 })}%`
})

const legit = computed(() => props.effect.customers + props.effect.yours + props.effect.partners)

const attackNote = computed(() => {
  const rows = props.effect.rows.filter((r) => r.kind === 'attack')
  if (!rows.length) return 'None'
  return rows.length === 1 ? GROUPS[rows[0].id].short : `${rows.length} kinds of attack`
})

const legitNote = computed(() => {
  const kinds = props.effect.rows.filter((r) => r.kind !== 'attack').map((r) => GROUPS[r.id].short)
  const parts = [...new Set(kinds)]
  if (!parts.length) return 'Nothing legitimate in it'
  const text = parts.join(', ')
  return text.charAt(0).toUpperCase() + text.slice(1)
})

/** What needs eyes first: the bank's own traffic, then customers and partners, then attacks. */
const EYES: Record<GroupKind, number> = { yours: 0, customers: 1, partner: 2, monitor: 3, attack: 4 }

/** Rows: who it would stop, then who an exception spares; with nothing caught, who it leaves alone. */
const rows = computed(() => {
  const e = props.effect
  const caught = [...e.rows].sort((a, b) => EYES[a.kind] - EYES[b.kind] || b.matched - a.matched).map((r) => ({
    key: r.id,
    label: r.label,
    detail: r.detail,
    kind: KIND[r.kind],
    from: OUTCOME[r.before],
    to: OUTCOME[r.after],
    by: r.beforeRule ? `today: rule ${props.ruleLabel(r.beforeRule)}` : r.before === 'pass' ? 'today: passes' : '',
    value: r.matched,
    spared: false,
  }))
  const spared = e.spared.map((r) => ({
    key: r.id,
    label: r.label,
    detail: r.detail,
    kind: { label: 'Spared', tone: 'success' as const },
    from: 'Pass',
    to: 'Pass',
    by: 'an exception',
    value: r.spared,
    spared: true,
  }))
  const alone = e.rows.length
    ? []
    : e.untouched.map((u) => ({
        key: u.id,
        label: u.label,
        detail: 'Same hostname and path, not matched',
        kind: { label: 'Untouched', tone: 'success' as const },
        from: 'Pass',
        to: 'Pass',
        by: '',
        value: u.requests,
        spared: true,
      }))
  return [...caught, ...spared, ...alone]
})

const shadow = computed(() => {
  const s = props.effect.shadowed
  return s ? `Rule ${props.ruleLabel(s.rule)} ends ${n(s.value)} from hosting networks before they reach it.` : ''
})

</script>

<template>
  <article class="fw-preview" :class="`is-${mode}`" :aria-labelledby="titleId">
    <header class="fw-preview__head">
      <div class="fw-preview__heading">
        <p class="fw-preview__eyebrow">
          Rule {{ no }} · <template v-if="mode === 'draft'">draft · not live</template><template v-else>on · log only</template>
        </p>
        <h3 :id="titleId" class="fw-preview__title">{{ name }}</h3>
      </div>
      <div class="fw-preview__actions">
        <RButton v-if="mode === 'draft'" tone="brand" @click="emit('turn-on')">Turn on in log-only</RButton>
        <RButton v-else variant="outline" @click="emit('enforce')">
          {{ ACTIONS[action].label }} now
        </RButton>
      </div>
    </header>

    <p v-if="mode === 'log'" class="fw-preview__live">
      <RStatus tone="signal" size="sm" pulse label="Logging" />
      <span>
        {{ n(logged ?? 0) }} {{ noun }} it would have {{ PAST[action] }} since {{ since }} · {{ DOES[action] }} from
        {{ until }} UTC
      </span>
    </p>

    <dl class="fw-preview__figures">
      <div class="fw-preview__figure">
        <dt>{{ WOULD[action] }}</dt>
        <dd class="fw-preview__value">{{ n(effect.matched) }}</dd>
        <dd class="fw-preview__sub">{{ share }} of {{ noun }}, 24 h</dd>
      </div>
      <div class="fw-preview__figure">
        <dt>Look like attacks</dt>
        <dd class="fw-preview__value">{{ n(effect.attack) }}</dd>
        <dd class="fw-preview__sub">{{ attackNote }}</dd>
      </div>
      <div class="fw-preview__figure" :class="{ 'is-flagged': legit > 0 }">
        <dt><RStatus :tone="legit > 0 ? 'warning' : 'success'" size="sm" label="Look legitimate" /></dt>
        <dd class="fw-preview__value">{{ n(legit) }}</dd>
        <dd class="fw-preview__sub">{{ legitNote }}</dd>
      </div>
    </dl>

    <table class="fw-preview__sources">
      <caption class="r-sr-only">
        Who the rule would have stopped in the last 24 hours, what happens to them today and with the rule
      </caption>
      <thead>
        <tr>
          <th scope="col">{{ effect.rows.length ? 'Who it would stop' : 'Who it looks at' }}</th>
          <th scope="col">Today → with it</th>
          <th scope="col" class="is-num">24 h</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.key" :class="{ 'is-spared': row.spared }">
          <th scope="row">
            <span class="fw-preview__who">
              <span class="fw-preview__source">{{ row.label }}</span>
              <RStatus :tone="row.kind.tone" size="sm" :label="row.kind.label" />
            </span>
            <span class="fw-preview__detail">{{ row.detail }}</span>
          </th>
          <td>
            <span class="fw-preview__change">
              {{ row.from }}<template v-if="row.from !== row.to"> → {{ row.to }}</template>
            </span>
            <span v-if="row.by" class="fw-preview__by">{{ row.by }}</span>
          </td>
          <td class="is-num">{{ n(row.value) }}</td>
        </tr>
      </tbody>
    </table>

    <footer class="fw-preview__foot">
      <div class="fw-preview__foot-text">
        <p v-if="shadow" class="fw-preview__note">{{ shadow }}</p>
        <p class="fw-preview__expr">
          <span class="fw-preview__expr-label">Stored as</span>
          <code>{{ expression }}</code>
        </p>
      </div>
      <RButton v-if="mode === 'draft'" size="xs" variant="ghost" @click="emit('discard')">Discard</RButton>
    </footer>
  </article>
</template>

<style scoped>
.fw-preview {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  border: 1px solid var(--r-border-strong);
  background: var(--r-bg-surface);
}

.fw-preview__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px 16px;
  padding: 12px 16px;
}

.fw-preview__heading {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.fw-preview__eyebrow {
  color: var(--r-brand-text);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.fw-preview__title {
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.3;
}

.fw-preview__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.fw-preview__live {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 10px;
  margin: 0 16px 12px;
  padding: 8px 10px;
  border: 1px solid var(--r-signal-border);
  background: var(--r-signal-soft);
  color: var(--r-text);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
}

/* Three figures in ruled cells. */
.fw-preview__figures {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 0;
  border-top: 1px solid var(--r-border);
  border-bottom: 1px solid var(--r-border);
}

.fw-preview__figure {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  padding: 10px 16px;
}

.fw-preview__figure + .fw-preview__figure {
  border-left: 1px solid var(--r-border-subtle);
}

.fw-preview__figure dt {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.fw-preview__figure dd {
  margin: 0;
}

.fw-preview__value {
  font-size: var(--r-text-xl);
  font-variant-numeric: tabular-nums;
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-tight);
  line-height: 1.25;
}

.fw-preview__sub {
  overflow: hidden;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fw-preview__figure.is-flagged .fw-preview__value {
  color: var(--r-warning-text);
}

/* Who it would stop. */
.fw-preview__sources {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--r-text-xs);
}

.fw-preview__sources th,
.fw-preview__sources td {
  padding: 4px 8px 5px;
  border-bottom: 1px solid var(--r-border-subtle);
  text-align: left;
  vertical-align: top;
}

.fw-preview__sources th:first-child,
.fw-preview__sources td:first-child {
  padding-left: 16px;
}

.fw-preview__sources th:last-child,
.fw-preview__sources td:last-child {
  padding-right: 16px;
}

.fw-preview__sources thead th {
  padding-top: 8px;
  padding-bottom: 6px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
  white-space: nowrap;
}

.fw-preview__sources tbody th {
  font-weight: var(--r-weight-regular);
}

.fw-preview__sources .is-num {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
  text-align: right;
  white-space: nowrap;
}

.fw-preview__sources tbody td.is-num {
  padding-top: 7px;
  font-size: var(--r-text-xs);
}

.fw-preview__detail,
.fw-preview__change,
.fw-preview__by {
  display: block;
}

.fw-preview__who {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px 8px;
}

.fw-preview__source {
  font-weight: var(--r-weight-medium);
}

.fw-preview__detail,
.fw-preview__by {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.02em;
}

.fw-preview__change {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
  white-space: nowrap;
}

.fw-preview__sources tr.is-spared .fw-preview__source,
.fw-preview__sources tr.is-spared .is-num {
  color: var(--r-text-secondary);
}

.fw-preview__foot {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px 10px 16px;
}

.fw-preview__foot-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.fw-preview__note {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

.fw-preview__expr {
  display: flex;
  gap: 8px;
  min-width: 0;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-3xs);
}

.fw-preview__expr-label {
  flex: none;
  font-family: var(--r-font-mono);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.fw-preview__expr code {
  min-width: 0;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  line-height: 1.5;
  overflow-wrap: anywhere;
}
</style>
