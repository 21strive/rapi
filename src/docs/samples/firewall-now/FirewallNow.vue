<script setup lang="ts">
/**
 * Sample 12, now · Edge firewall. The same zone, rules, traffic and people as the Then screen,
 * without the rule editor. Rizky says the rule in a sentence; Simpul writes it in the firewall's
 * language, reads it back as a check with the parts it filled in marked, and runs it against the
 * last 24 hours of real traffic before anything goes live: how many requests it would have
 * stopped, who, and which of them look legitimate (customers abroad, the Jakarta office VPN that
 * exits in Singapore), so the person can say "except …" first. Turning it on is one brand press;
 * it starts in log-only, and the record keeps every change with a way back.
 */
import { computed, nextTick, ref } from 'vue'
import { RStatus } from '@/design-system'
import { DeskComposer, DeskShell, DeskThread, DeskTrail, DeskZone } from '../_kit/desk'
import { AGENT, COST, DATE } from './data'
import { NOUN, useFirewallDesk, type CheckCard } from './script'
import { PAST_TOTALS } from './whatif'
import RuleCheck from './parts/RuleCheck.vue'
import RuleList from './parts/RuleList.vue'
import RulePreview from './parts/RulePreview.vue'
import TrafficChart from './parts/TrafficChart.vue'

const fw = useFirewallDesk()
const { desk } = fw

const pad = (v: number) => String(v).padStart(2, '0')

/** The rule waiting for the person: a draft to turn on, or a rule in log-only to watch. */
const pending = computed(() => {
  const d = fw.draft.value
  if (d) {
    return {
      mode: 'draft' as const,
      no: pad(d.at + 1),
      name: d.name,
      action: d.spec.action,
      effect: d.effect,
      expression: d.written.expression,
      noun: NOUN[d.spec.target],
      since: undefined,
      until: undefined,
    }
  }
  const w = fw.watching.value
  if (!w) return null
  return {
    mode: 'log' as const,
    no: fw.numberOf(w.id),
    name: w.name,
    action: w.spec.action,
    effect: w.effect,
    expression: w.written.expression,
    noun: NOUN[w.spec.target],
    since: w.since,
    until: w.until,
  }
})

/** While a blocking rule waits or logs, the chart shows blocking with it in place. */
const overlay = computed(() => {
  const p = pending.value
  if (!p || p.action !== 'block' || !p.effect.matched) return null
  return { no: p.no, blocked: p.effect.blocked, added: p.effect.totals.blocked - PAST_TOTALS.blocked, verb: 'block' }
})

const needsMeta = computed(() => (pending.value ? (pending.value.mode === 'draft' ? '1 rule to check' : '1 rule logging') : 'Nothing waiting'))

const lastOn = computed(() => [...fw.live.value].reverse().find((r) => r.mode === 'enforce') ?? null)
const PAST_VERB = { block: 'blocked', challenge: 'challenged', log: 'logged', allow: 'allowed' } as const

const costText = (list: { value: number; unit: string }[]) => list.map((c) => `${c.value} ${c.unit}`).join(' · ')

/*
 * Focus follows the control that replaces the one pressed: Turn on gives way to the rule's own
 * button; when the panel goes, the zone's message takes it; a revert hands it to the record.
 */
const quiet = ref<HTMLElement | null>(null)
const needsBox = ref<HTMLElement | null>(null)
const trailBox = ref<HTMLElement | null>(null)

async function settle() {
  await nextTick()
  const next = needsBox.value?.querySelector<HTMLElement>('.fw-preview__actions button')
  ;(next ?? quiet.value)?.focus()
}

function turnOn() {
  fw.turnOn()
  settle()
}

function enforce() {
  fw.enforce()
  settle()
}

function discard() {
  fw.discard()
  settle()
}

async function revert(id: string) {
  fw.revert(id)
  await nextTick()
  trailBox.value?.focus()
}
</script>

<template>
  <DeskShell product="Edge" title="Firewall rules" :agent="AGENT" agent-status="Watching selaras.id">
    <template #strip>
      <span class="fw-strip"><span class="fw-strip__org">Selaras Bank · </span>Zone selaras.id</span>
    </template>
    <template #meta>
      <span class="fw-cost">
        <span class="fw-cost__era">Then</span> {{ costText(COST.then) }}
        <span class="fw-cost__era">Now</span> {{ costText(COST.now) }}
      </span>
      <RStatus tone="success" size="sm" label="Enforcing" />
      <span class="fw-strip__time">WAF · {{ DATE }} · {{ fw.now.value }} UTC</span>
    </template>

    <template #thread>
      <DeskThread :messages="desk.messages.value" :writing="desk.writing.value" :agent="AGENT">
        <template #card="{ message }">
          <RuleCheck
            v-if="message.card === 'rule'"
            :card="message.data as CheckCard"
            :state="fw.cards[(message.data as CheckCard).version]"
          />
        </template>
      </DeskThread>
    </template>
    <template #composer>
      <DeskComposer
        :label="`Message ${AGENT}`"
        placeholder="Say a rule, or what to change"
        :suggestions="desk.chips.value"
        :busy="desk.writing.value"
        @send="desk.send"
      />
    </template>

    <!--
      The decision sits next to the check in the thread; the record under it; the state of the
      zone (traffic, then the rules in order) is the column of instruments on the right.
    -->
    <div class="fw-surfaces">
    <div class="fw-now">
      <div ref="needsBox" class="fw-needs">
        <DeskZone index="01" label="Needs you" :meta="needsMeta">
          <RulePreview
            v-if="pending"
            :key="`${pending.mode}-${pending.no}-${pending.name}`"
            :mode="pending.mode"
            :no="pending.no"
            :name="pending.name"
            :action="pending.action"
            :effect="pending.effect"
            :expression="pending.expression"
            :noun="pending.noun"
            :since="pending.since"
            :until="pending.until"
            :logged="fw.logged.value"
            :rule-label="fw.numberOf"
            @turn-on="turnOn"
            @enforce="enforce"
            @discard="discard"
          />
          <p v-else ref="quiet" class="fw-quiet" tabindex="-1">
            <template v-if="lastOn">
              Nothing needs you. Rule {{ fw.numberOf(lastOn.id) }}, {{ lastOn.name }}, has {{ PAST_VERB[lastOn.spec.action] }}
              since {{ lastOn.acting ?? lastOn.until }}.
            </template>
            <template v-else>Nothing needs you. Say a rule and it is checked against the last 24 hours first.</template>
          </p>
        </DeskZone>

      </div>

      <div class="fw-state">
        <DeskZone index="02" label="State" meta="Last 24 h · UTC">
          <div class="fw-state__panel">
            <TrafficChart :overlay="overlay" />
            <RuleList :rows="fw.list.value" />
          </div>
        </DeskZone>
      </div>

      <div class="fw-done">
        <DeskZone index="03" :label="`Done by ${AGENT}`" meta="Last 24 h">
          <div ref="trailBox" class="fw-trail" tabindex="-1" role="group" aria-label="Record of changes">
            <DeskTrail :items="fw.trail.value" :label="`Done by ${AGENT} and the team, last 24 hours`" @revert="revert" />
          </div>
        </DeskZone>
      </div>
    </div>
    </div>
  </DeskShell>
</template>

<style scoped>
.fw-strip__time {
  font-variant-numeric: tabular-nums;
}

/* Then and now, counted: a quiet line in the strip. */
.fw-cost {
  color: var(--r-text-tertiary);
}
.fw-cost__era {
  margin-left: 6px;
  color: var(--r-text);
}
.fw-cost__era:first-child {
  margin-left: 0;
}

.fw-surfaces {
  container-type: inline-size;
}

/* Needs you and the record on the left, by the thread; the instruments on the right. */
.fw-now {
  display: grid;
  grid-template-areas:
    'needs state'
    'done state';
  grid-template-columns: minmax(0, 1fr) minmax(0, 416px);
  grid-template-rows: auto 1fr;
  gap: 24px;
  align-items: start;
}
.fw-needs {
  grid-area: needs;
  min-width: 0;
}
.fw-state {
  grid-area: state;
  min-width: 0;
}
.fw-done {
  grid-area: done;
  min-width: 0;
}

/* State: the traffic over the rules, one ruled panel. */
.fw-state__panel {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}
.fw-state__panel > * + * {
  border-top: 1px solid var(--r-border);
}

.fw-quiet {
  padding: 16px;
  border: 1px dashed var(--r-border-strong);
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
}
.fw-quiet:focus-visible,
.fw-trail:focus-visible {
  outline: 2px solid var(--r-brand);
  outline-offset: 2px;
}
.fw-quiet:focus:not(:focus-visible),
.fw-trail:focus:not(:focus-visible) {
  outline: none;
}

@container (max-width: 860px) {
  .fw-now {
    grid-template-areas:
      'needs'
      'state'
      'done';
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto;
  }
}

@media (max-width: 1279px) {
  .fw-cost {
    display: none;
  }
}

@media (max-width: 640px) {
  .fw-strip__org,
  .fw-strip__time {
    display: none;
  }
}
</style>
