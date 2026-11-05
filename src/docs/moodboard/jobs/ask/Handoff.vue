<script setup lang="ts">
/**
 * Some cases need a person. The hand-off says what will be passed along, so nobody has to tell
 * the story twice, lets the person leave anything out, shows the place in line, and who joined.
 */
import { computed, reactive, ref, watch } from 'vue'
import { RAvatar, RButton, RCheckbox, RStatus } from '@/design-system'
import { useTick } from '../../kit'
import { useClock } from './shared'

interface Share {
  text: string
  /** Shared unless the person unticks it. */
  on?: boolean
}

const props = withDefaults(
  defineProps<{
    agent?: string
    /** Why a person is needed. */
    says: string
    /** What goes along with the case. */
    shares?: Share[]
    person: { name: string; role: string }
    /** Place in line when asked. */
    queue: number
    /** Seconds per place, scripted. */
    every?: number
    /** The person's first words. */
    first: string
    /** The button: "Hand to a person". */
    action?: string
    start?: string
    /** Small tiles: the key, the place in line, who joined. */
    compact?: boolean
  }>(),
  { agent: 'Simpul', shares: () => [], every: 3, action: 'Hand to a person', start: '14:20' },
)

const clock = useClock(props.start)
const state = ref<'idle' | 'waiting' | 'joined'>('idle')
const place = ref(props.queue)
const joinedAt = ref('')
const on = reactive(props.shares.map((s) => s.on !== false))
let waited = 0

const tick = useTick(1000)
watch(tick, () => {
  if (state.value !== 'waiting') return
  waited++
  if (waited % props.every) return
  place.value--
  if (place.value <= 0) {
    state.value = 'joined'
    joinedAt.value = clock.next(3)
  }
})

function ask() {
  place.value = props.queue
  waited = 0
  state.value = 'waiting'
}

const ordinal = (n: number) => (n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`)
const shared = computed(() => on.filter(Boolean).length)
const minutes = computed(() => Math.max(1, Math.round((place.value * 90) / 60)))
</script>

<template>
  <div class="mk handoff" :class="{ 'handoff--compact': compact }">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ state === 'joined' ? 'With a person' : `${agent} · hand-off` }}</span>
      <RStatus v-if="state === 'waiting'" tone="signal" pulse :label="`${ordinal(place)} in line`" size="sm" />
      <RStatus v-else-if="state === 'joined'" tone="success" label="Joined" size="sm" />
    </div>

    <template v-if="state !== 'joined'">
      <p class="handoff__says">{{ says }}</p>
      <fieldset v-if="!compact && shares.length" class="handoff__shares" :disabled="state === 'waiting'">
        <legend class="r-label">Goes with it</legend>
        <RCheckbox v-for="(s, i) in shares" :key="s.text" v-model="on[i]" size="sm" :label="s.text" />
      </fieldset>
      <div class="mk-grow" />
      <p v-if="state === 'waiting'" class="handoff__wait" aria-live="polite">
        About {{ minutes }} min. {{ compact ? '' : `${shared} of ${shares.length} items go along.` }}
      </p>
      <div class="handoff__foot">
        <RButton v-if="state === 'idle'" size="sm" tone="brand" @click="ask">{{ action }}</RButton>
        <RButton v-else size="sm" variant="outline" @click="state = 'idle'">Cancel</RButton>
      </div>
    </template>

    <template v-else>
      <div class="handoff__who">
        <RAvatar :name="person.name" size="sm" decorative />
        <span class="handoff__name">
          <span class="mk-truncate">{{ person.name }}</span>
          <span class="handoff__role mk-truncate">{{ person.role }} · {{ joinedAt }}</span>
        </span>
      </div>
      <p class="handoff__first mk-grow" aria-live="polite">{{ first }}</p>
      <div class="handoff__foot">
        <span v-if="!compact && shares.length" class="r-label mk-truncate">Read {{ shared }} of {{ shares.length }} items</span>
        <RButton size="xs" variant="ghost" @click="state = 'idle'">End</RButton>
      </div>
    </template>
  </div>
</template>

<style scoped>
.handoff {
  gap: 8px;
}

.handoff__says {
  font-size: var(--r-text-sm);
  line-height: 1.4;
}

.handoff--compact .handoff__says {
  display: -webkit-box;
  overflow: hidden;
  font-size: var(--r-text-xs);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.handoff__shares {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  margin: 0;
  padding: 8px 0 0;
  border: 0;
  border-top: 1px solid var(--r-border-subtle);
}

.handoff__shares legend {
  float: left;
  width: 100%;
  margin-bottom: 4px;
  padding: 0;
}

.handoff__shares :deep(.r-checkbox__label) {
  font-size: var(--r-text-xs);
}

.handoff__wait {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

.handoff__foot {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.handoff__who {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.handoff__name {
  display: flex;
  flex-direction: column;
  min-width: 0;
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
  line-height: 1.25;
}

.handoff__role {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-regular);
}

.handoff__first {
  overflow: hidden;
  padding-left: 8px;
  border-left: 2px solid var(--r-border-strong);
  font-size: var(--r-text-xs);
  line-height: 1.45;
}
</style>
