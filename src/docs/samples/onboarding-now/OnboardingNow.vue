<script setup lang="ts">
/**
 * Sample 31, now · Workspace setup. The five steps of forms are gone: Ayu describes the workspace
 * in one sentence, Simpul asks the one thing it cannot infer, and the screen keeps only what a
 * person checks and decides: the summary with Simpul's inferences marked, the one launch, and the
 * record of what was done, with a way back. Same company, people, region, integrations and plans
 * as the Then screen (../onboarding).
 */
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { RAvatar, RBadge, useToast } from '@/design-system'
import { DeskCheck, DeskComposer, DeskShell, DeskThread, DeskTrail, DeskZone, useDesk, type DeskMessage } from '../_kit/desk'
import LaunchPanel from './parts/LaunchPanel.vue'
import SummaryPanel from './parts/SummaryPanel.vue'
import {
  AGENT,
  ANSWERED,
  ASKED,
  CHECKED,
  NEEDS_ACCESS,
  NOW_COST,
  SAID,
  START,
  THEN_COST,
  TODAY,
  URL_HOST,
  ZONE,
  accessWhat,
  costText,
  owner,
  providers,
  type AccessKey,
} from './data'
import { createDraft } from './state'
import { createScript, type CardData } from './script'

const toast = useToast()

// The draft and the script read the scene's clock lazily: `desk` exists by the time anyone talks.
const draft = createDraft(() => desk.clock.now())
const script = createScript(draft, {
  now: () => desk.clock.now(),
  setChips: (chips) => {
    desk.chips.value = chips
  },
  create: () => {
    draft.create()
    desk.chips.value = script.suggest()
  },
  connect: (key) => {
    draft.connect(key)
  },
  open: openWorkspace,
})

const desk = useDesk({
  agent: AGENT,
  start: START,
  opening: [
    { who: 'You', mine: true, text: SAID },
    { who: AGENT, text: ASKED },
    { who: 'You', mine: true, text: ANSWERED },
    { who: AGENT, text: CHECKED, card: 'check', data: script.understood() },
  ],
  chips: script.suggest(),
  respond: (said) => script.respond(said),
})

const cardOf = (message: DeskMessage) => message.data as CardData

/* ── What the surfaces read ────────────────────────────────────────────────────── */

const ws = draft.ws
const live = computed(() => ws.created)
const url = computed(() => `${URL_HOST}${ws.slug}`)

const access = computed(() =>
  NEEDS_ACCESS.filter((key) => ws.on[key]).map((key) => ({
    key,
    name: providers[key],
    line: accessWhat[key].line,
    connected: ws.connected[key],
  })),
)

const stateMeta = computed(() =>
  live.value ? `Live since ${ws.createdAt} ${ZONE}` : `Draft · ${draft.tally.value.simpul} to check`,
)

const needsMeta = computed(() => {
  if (live.value) {
    const n = access.value.filter((a) => !a.connected).length
    return n ? `${n} to allow` : 'Nothing waiting'
  }
  return script.question.value ? '1 answer · 1 confirm' : '1 confirm'
})

/* ── The surfaces act, and the thread hears about it ───────────────────────────── */

const creating = ref(false)
const connecting = ref<AccessKey | null>(null)
const launchPanel = ref<InstanceType<typeof LaunchPanel> | null>(null)
const composerBox = ref<HTMLElement | null>(null)
const trailBox = ref<HTMLElement | null>(null)

let alive = true
onBeforeUnmount(() => (alive = false))
const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms))
const composerField = () => composerBox.value?.querySelector<HTMLInputElement>('input') ?? null
const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1)

/** The launch from the button: the same one "create it" makes in the thread. */
async function create() {
  if (live.value || creating.value || desk.writing.value) return
  script.pending.value = null
  desk.note('You pressed Create workspace')
  creating.value = true
  await wait(800)
  if (!alive) return
  creating.value = false
  desk.say({
    ...script.created(),
    after: () => {
      draft.create()
      desk.chips.value = script.suggest()
    },
  })
  await nextTick()
  launchPanel.value?.focusFirst()
}

/** The provider's OK, as if the person came back from GitHub or Slack having allowed it. */
async function allow(key: AccessKey) {
  if (!live.value || connecting.value || ws.connected[key]) return
  desk.note(`You allowed ${providers[key]}`)
  connecting.value = key
  await wait(600)
  if (!alive) return
  connecting.value = null
  desk.say({
    ...script.connected(key),
    after: () => {
      draft.connect(key)
      desk.chips.value = script.suggest()
    },
  })
  await nextTick()
  launchPanel.value?.focusFirst()
}

/** A quick reply pressed on the surface is said in the thread. */
let refocusLaunch = false
function answer(option: string) {
  refocusLaunch = true
  desk.send(option)
}

function openWorkspace() {
  toast.show({ title: 'Opening workspace', body: `${url.value}, signed in as owner.` })
}

/** Revert from the trail: the change goes back, the thread notes it, the line stays struck through. */
async function revert(id: string) {
  const at = draft.trail.value.findIndex((t) => t.id === id)
  const item = draft.trail.value[at]
  if (!item?.canRevert || item.revertedAt) return
  desk.note(`You reverted: ${lowerFirst(item.text)}`)
  draft.revert(id)
  desk.chips.value = script.suggest([])
  await nextTick()
  // The Revert pressed became a stamp: focus the next Revert down the list, else up, else the field.
  const buttons = [...(trailBox.value?.querySelectorAll('li') ?? [])].map((li) => li.querySelector<HTMLElement>('button'))
  const next = buttons.slice(at + 1).find(Boolean) ?? buttons.slice(0, at).reverse().find(Boolean)
  ;(next ?? composerField())?.focus()
}

// A quick reply pressed on the surface is replaced once the answer lands: focus moves to the launch.
watch(
  () => desk.writing.value,
  async (busy) => {
    if (busy || !refocusLaunch) return
    refocusLaunch = false
    await nextTick()
    launchPanel.value?.focusFirst()
  },
)
</script>

<template>
  <DeskShell
    product="Simpul"
    title="Set up your workspace"
    :agent="AGENT"
    :agent-status="live ? 'Watching the invites' : 'Drafting your workspace'"
    :thread-width="456"
  >
    <template #strip>
      <span class="s-onbn-path">/ New workspace</span>
      <RBadge class="s-onbn-badge" size="sm" :tone="live ? 'success' : 'neutral'" variant="outline">
        {{ live ? 'Live' : 'Draft' }}
      </RBadge>
    </template>
    <template #meta>
      <span class="s-onbn-cost">
        <span>Then {{ costText(THEN_COST) }}</span>
        <span aria-hidden="true">→</span>
        <span class="s-onbn-cost__now">Now {{ costText(NOW_COST) }}</span>
      </span>
      <span>{{ TODAY }}</span>
    </template>
    <template #actions>
      <RAvatar :name="owner.name" size="sm" />
    </template>

    <template #thread>
      <DeskThread :messages="desk.messages.value" :writing="desk.writing.value" :agent="AGENT">
        <template #card="{ message }">
          <DeskCheck v-if="message.card === 'check'" v-bind="cardOf(message)" />
        </template>
      </DeskThread>
    </template>
    <template #composer>
      <div ref="composerBox">
        <DeskComposer
          :label="`Message ${AGENT}`"
          placeholder="Say a change, or “create it”"
          :suggestions="desk.chips.value"
          :busy="desk.writing.value"
          @send="desk.send"
        />
      </div>
    </template>

    <div class="s-onbn">
      <DeskZone index="01" label="State" :meta="stateMeta">
        <SummaryPanel
          :name="ws.name"
          :url="url"
          :live="live"
          :blocks="draft.blocks.value"
          :groups="draft.groups.value"
          :tally="draft.tally.value"
        />
      </DeskZone>

      <div class="s-onbn__pair">
        <DeskZone index="02" label="Needs you" :meta="needsMeta">
          <LaunchPanel
            ref="launchPanel"
            :live="live"
            :name="ws.name"
            :url="url"
            :region="draft.region.value.label"
            :invites="draft.invited.value.length"
            :integrations="draft.enabled.value.length"
            :billed="draft.billedToday.value"
            :question="script.question.value"
            :creating="creating"
            :busy="desk.writing.value"
            :access="access"
            :connecting="connecting"
            @create="create"
            @answer="answer"
            @allow="allow"
            @open="openWorkspace"
          />
        </DeskZone>

        <DeskZone index="03" :label="`Done by ${AGENT}`" meta="Today">
          <div ref="trailBox">
            <DeskTrail :items="draft.trail.value" :label="`Done by ${AGENT} today`" @revert="revert" />
          </div>
        </DeskZone>
      </div>
    </div>
  </DeskShell>
</template>

<style scoped>
/* The Gallery's toolbar floats over the bottom centre; between these widths it would cover the send key. */
@media (min-width: 1024px) and (max-width: 1399px) {
  .desk :deep(.desk__composer) {
    padding-bottom: 60px;
  }
}

.s-onbn {
  container: s-onbn / inline-size;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* The decision and its record side by side under the summary; stacked when the column is narrow. */
.s-onbn__pair {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

@container s-onbn (max-width: 760px) {
  .s-onbn__pair {
    grid-template-columns: minmax(0, 1fr);
  }
}

.s-onbn-path {
  color: var(--r-text-tertiary);
}

/* The cost of the job on each screen, as a quiet line in the strip. */
.s-onbn-cost {
  display: inline-flex;
  gap: 8px;
}

.s-onbn-cost__now {
  color: var(--r-text);
}

@media (max-width: 899px) {
  .s-onbn-cost {
    display: none;
  }
}

@media (max-width: 419px) {
  .s-onbn-badge {
    display: none;
  }
}
</style>
