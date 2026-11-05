<script setup lang="ts">
/**
 * API keys, now. The create-key dialog is gone: Dimas asks for a key by what it is for, and
 * Simpul answers with the key as a check, the least scopes the job needs, each one resting on
 * what the job really did. The screen keeps what earns it: the keys in use (State), the commit,
 * the secret shown once and the hold to revoke (Needs you), and the record with Revert (Done by
 * Simpul). Same account, keys and numbers as the Then screen.
 */
import { computed, nextTick, ref } from 'vue'
import { DeskComposer, DeskShell, DeskThread, DeskTrail, DeskZone, type DeskMessage } from '../_kit/desk'
import CreateNeed from './parts/CreateNeed.vue'
import KeyState from './parts/KeyState.vue'
import RevokeNeed from './parts/RevokeNeed.vue'
import RotateNeed from './parts/RotateNeed.vue'
import SecretNeed from './parts/SecretNeed.vue'
import ThreadCard from './parts/ThreadCard.vue'
import { AGENT, COST, SCENE } from './data'
import { useKeysDesk, type CardData } from './script'

const s = useKeysDesk()
const { desk } = s

const card = (m: DeskMessage) => m.data as CardData
/** A check's decision, so its line can say what became of it. */
function cardState(m: DeskMessage) {
  const d = card(m)
  return d.kind === 'check' ? s.cardState(d.ref) : undefined
}

/** The scene's clock: the time of the latest line in the thread. */
const nowText = computed(() => desk.messages.value[desk.messages.value.length - 1]?.at ?? SCENE.start)
const inUse = computed(() => s.keys.value.filter((k) => k.state !== 'revoked').length)
const costNow = COST.now.map((c) => `${c.value} ${c.unit}`).join(' · ')
const costThen = COST.then.map((c) => `${c.value} ${c.unit}`).join(' · ')

const rotateKey = computed(() => s.keyById(s.rotation.value?.keyId))
const revokeKey = computed(() => s.keyById(s.revocation.value?.keyId))

/* Focus: a press that replaces its own control hands the focus to what replaced it. */
const needsEl = ref<HTMLElement | null>(null)
const trailEl = ref<HTMLElement | null>(null)
const holds = (el: HTMLElement | null) => !!el && el.contains(document.activeElement)

function handOff(selector: string) {
  nextTick(() => {
    const root = needsEl.value
    const next =
      root?.querySelector<HTMLElement>(`${selector} button:not([disabled])`) ??
      root?.querySelector<HTMLElement>('[data-need] button:not([disabled])') ??
      root
    next?.focus()
  })
}

function onCreate() {
  const had = holds(needsEl.value)
  s.pressCreate()
  if (had) handOff('[data-need^="secret"]')
}

function onStored(id: string) {
  const had = holds(needsEl.value)
  s.pressStored(id)
  if (had) handOff('[data-need]')
}

function onRotate() {
  const had = holds(needsEl.value)
  s.pressRotate()
  if (had) handOff('[data-need^="secret"]')
}

function onRevoked() {
  const had = holds(needsEl.value)
  s.heldRevoke()
  if (had) handOff('[data-need]')
}

function onRevert(id: string) {
  const had = holds(trailEl.value)
  s.pressRevert(id)
  if (had) nextTick(() => trailEl.value?.focus())
}
</script>

<template>
  <DeskShell product="Developers" title="API keys" :agent="AGENT" :agent-status="`Watching ${inUse} keys`">
    <template #strip>
      <span class="s-akn__path">/ Lintang / API keys</span>
    </template>
    <template #meta>
      <span class="s-akn__cost" :aria-label="`Creating a key took ${costThen}; now it takes ${costNow}`">
        <span class="s-akn__was">Then {{ costThen }} →</span> Now {{ costNow }}
      </span>
      <span class="s-akn__api">API {{ SCENE.api }}</span>
      <span>{{ nowText }} WIB</span>
    </template>

    <template #thread>
      <DeskThread :messages="desk.messages.value" :writing="desk.writing.value" :agent="AGENT">
        <template #card="{ message }">
          <ThreadCard :data="card(message)" :state="cardState(message)" />
        </template>
      </DeskThread>
    </template>
    <template #composer>
      <DeskComposer
        :label="`Message ${AGENT}`"
        placeholder="Ask for a key by what it is for"
        :suggestions="desk.chips.value"
        :busy="desk.writing.value"
        @send="desk.send"
      />
    </template>

    <div class="s-akn__wrap">
      <div class="s-akn__cols">
        <DeskZone index="01" label="State" :meta="`${nowText} WIB`">
          <KeyState :keys="s.keys.value" :focus-id="s.focusId.value" />
        </DeskZone>

        <DeskZone index="02" label="Needs you" :meta="s.waiting.value ? `${s.waiting.value} waiting` : 'Nothing waiting'">
          <div ref="needsEl" class="s-akn__needs" tabindex="-1">
            <SecretNeed
              v-for="x in s.secrets.value"
              :key="x.id"
              :data-need="`secret:${x.id}`"
              :secret="x"
              :primary="s.primary.value === `secret:${x.id}`"
              @stored="onStored(x.id)"
            />
            <CreateNeed
              v-if="s.draft.value"
              data-need="create"
              :draft="s.draft.value"
              :asked="s.asked.value"
              :primary="s.primary.value === 'create'"
              @create="onCreate"
            />
            <RotateNeed
              v-if="s.rotation.value && rotateKey"
              data-need="rotate"
              :key-row="rotateKey"
              :until="s.graceText(s.rotation.value)"
              :inferred="s.rotation.value.grace === '24h'"
              :primary="s.primary.value === 'rotate'"
              @rotate="onRotate"
            />
            <RevokeNeed
              v-if="s.revocation.value && revokeKey"
              data-need="revoke"
              :key-row="revokeKey"
              :stops="s.stopsFor(revokeKey)"
              :called="s.revocation.value.called"
              @revoke="onRevoked"
            />
            <p v-if="!s.waiting.value" class="s-akn__empty">
              Nothing needs you. Ask for a key by what it is for: “a key for the payment webhooks, office only”.
            </p>
          </div>
        </DeskZone>
      </div>

      <DeskZone index="03" :label="`Done by ${AGENT}`" meta="Today">
        <div ref="trailEl" class="s-akn__trail" tabindex="-1">
          <DeskTrail :items="s.trail.value" :label="`Done by ${AGENT} today`" @revert="onRevert" />
        </div>
      </DeskZone>
    </div>
  </DeskShell>
</template>

<style>
.s-akn__path {
  color: var(--r-text-tertiary);
}

.s-akn__cost {
  color: var(--r-text-secondary);
}

.s-akn__was {
  color: var(--r-text-tertiary);
}

/* The surfaces: State beside Needs you when there is room, the record full width below. */
.s-akn__wrap {
  display: flex;
  flex-direction: column;
  gap: 24px;
  container-type: inline-size;
}

.s-akn__cols {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

@container (min-width: 880px) {
  .s-akn__cols {
    grid-template-columns: minmax(0, 1fr) minmax(340px, 384px);
  }
}

.s-akn__needs {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.s-akn__needs:focus,
.s-akn__trail:focus {
  outline: none;
}

.s-akn__needs:focus-visible,
.s-akn__trail:focus-visible {
  box-shadow: var(--r-focus-ring);
}

.s-akn__empty {
  padding: 14px;
  border: 1px dashed var(--r-border-strong);
  color: var(--r-text-tertiary);
  font-size: var(--r-text-sm);
  line-height: 1.45;
}

@media (max-width: 1279px) {
  .s-akn__api,
  .s-akn__was {
    display: none;
  }
}

@media (max-width: 760px) {
  .s-akn__path,
  .s-akn__cost {
    display: none;
  }
}
</style>
