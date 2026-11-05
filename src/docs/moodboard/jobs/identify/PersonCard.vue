<script setup lang="ts">
/**
 * A person at a glance: who they are, whether they can be reached now, the time where they are,
 * and the way to reach them one press from the clipboard. On your own card the lamp is yours to
 * set: press it to change it.
 */
import { computed, ref } from 'vue'
import { Check, Copy } from 'lucide-vue-next'
import { RAvatar, RIconButton, RStatus, type AvatarStatus, type StatusTone } from '@/design-system'
import { time, useNow, type Zone } from '../../kit'
import { useCopy, ZONE_OFFSET } from './shared'

const props = withDefaults(
  defineProps<{
    name: string
    role: string
    team?: string
    presence: AvatarStatus
    /** What the lamp says when it is not the plain presence: "On shift", "In the field". */
    status?: string
    zone?: Zone
    email?: string
    phone?: string
    /** Desk or ward extension. */
    ext?: string
    /** Quiet line at the foot of the card. */
    note?: string
    /** More facts on the 2x2 card: "Escalates to", "Speaks". */
    lines?: { label: string; value: string }[]
    /** Mono caps over the card. */
    eyebrow?: string
    /** `tile` 1x1 · `row` 2x1 · `card` 2x2. */
    layout?: 'tile' | 'row' | 'card'
    /** Your own card: the lamp is a button that sets your status. */
    self?: boolean
  }>(),
  { zone: 'WIB', layout: 'row' },
)

const WORDS: Record<AvatarStatus, string> = { online: 'Online', away: 'Away', busy: 'Busy', offline: 'Offline' }
const TONES: Record<AvatarStatus, StatusTone> = { online: 'success', away: 'warning', busy: 'danger', offline: 'neutral' }
const ORDER: AvatarStatus[] = ['online', 'away', 'busy', 'offline']

const presence = ref<AvatarStatus>(props.presence)
const changed = ref(false)
const word = computed(() => (!changed.value && props.status ? props.status : WORDS[presence.value]))
const tone = computed(() => TONES[presence.value])

function cycle() {
  presence.value = ORDER[(ORDER.indexOf(presence.value) + 1) % ORDER.length]
  changed.value = true
}

const now = useNow(10_000)
const local = computed(() => `${time(now.value, props.zone)} ${props.zone}`)

/* The ways to reach them, in the order a person reaches for them. */
const contacts = computed(() => {
  const out: { key: string; label: string; shown: string; value: string }[] = []
  if (props.email) out.push({ key: 'email', label: 'Email', shown: props.email, value: props.email })
  if (props.phone) out.push({ key: 'phone', label: 'Phone', shown: props.phone, value: props.phone.replace(/[^\d+]/g, '') })
  if (props.ext) out.push({ key: 'ext', label: 'Ext', shown: props.ext, value: props.ext })
  return out
})
const first = computed(() => contacts.value[0])

const { copied, blocked, copy } = useCopy()
const feedback = computed(() => {
  if (blocked.value) return 'Clipboard blocked'
  const c = contacts.value.find((x) => x.key === copied.value)
  return c ? `${c.label} copied` : null
})
</script>

<template>
  <!-- 1x1: the face, the lamp and the one contact -->
  <div v-if="layout === 'tile'" class="mk person person--tile">
    <div class="mk-row mk-between person__top">
      <RAvatar :name="name" size="lg" :status="presence" decorative />
      <RIconButton
        v-if="first && !self"
        size="xs"
        variant="ghost"
        :label="copied === first.key ? `${first.label} copied` : `Copy ${first.label.toLowerCase()} ${first.shown}`"
        @click="copy(first.value, first.key)"
      >
        <Check v-if="copied === first.key" />
        <Copy v-else />
      </RIconButton>
      <span v-else-if="self" class="r-label">You</span>
    </div>
    <div class="person__who">
      <p class="person__name mk-truncate">{{ name }}</p>
      <p class="person__role mk-truncate">{{ role }}</p>
      <p v-if="first && !self" class="person__contact mk-truncate">
        <span class="r-label">{{ first.label }}</span> <span class="r-mono">{{ first.shown }}</span>
      </p>
    </div>
    <div class="mk-row mk-between mk-end">
      <button
        v-if="self"
        type="button"
        class="mk-reset person__set"
        :aria-label="`Your status: ${word}. Press to change it`"
        @click="cycle"
      >
        <RStatus :tone="tone" :label="word" size="sm" />
      </button>
      <RStatus v-else :tone="tone" :label="word" size="sm" />
      <span class="person__time" aria-live="polite">{{ feedback ?? local }}</span>
    </div>
  </div>

  <!-- 2x1: a row in a directory -->
  <div v-else-if="layout === 'row'" class="mk person person--row">
    <RAvatar :name="name" size="xl" :status="presence" decorative />
    <div class="person__body">
      <div class="mk-row mk-between">
        <p class="person__name mk-truncate">{{ name }}</p>
        <RStatus :tone="tone" :label="word" size="sm" />
      </div>
      <p class="person__role mk-truncate">{{ role }}<template v-if="team"> · {{ team }}</template></p>
      <div v-if="first" class="person__reach mk-end">
        <span class="person__value r-mono mk-truncate">{{ first.shown }}</span>
        <RIconButton
          size="xs"
          variant="ghost"
          :label="copied === first.key ? `${first.label} copied` : `Copy ${first.label.toLowerCase()}`"
          @click="copy(first.value, first.key)"
        >
          <Check v-if="copied === first.key" />
          <Copy v-else />
        </RIconButton>
        <span class="person__time" aria-live="polite">{{ feedback ?? local }}</span>
      </div>
    </div>
  </div>

  <!-- 2x2: the contact card -->
  <div v-else class="mk person person--card">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow ?? team }}</span>
      <RStatus :tone="tone" :label="word" size="sm" />
    </div>
    <div class="person__head">
      <RAvatar :name="name" size="xl" :status="presence" decorative />
      <div class="person__who">
        <p class="person__name person__name--lg mk-truncate">{{ name }}</p>
        <p class="person__role mk-truncate">{{ role }}</p>
      </div>
    </div>
    <dl class="person__lines">
      <div v-for="c in contacts" :key="c.key" class="person__line">
        <dt class="r-label">{{ c.label }}</dt>
        <dd class="r-mono mk-truncate">{{ c.shown }}</dd>
        <RIconButton
          size="xs"
          variant="ghost"
          :label="copied === c.key ? `${c.label} copied` : `Copy ${c.label.toLowerCase()}`"
          @click="copy(c.value, c.key)"
        >
          <Check v-if="copied === c.key" />
          <Copy v-else />
        </RIconButton>
      </div>
      <div class="person__line">
        <dt class="r-label">Local</dt>
        <dd class="r-mono">{{ local }} · {{ ZONE_OFFSET[zone] }}</dd>
      </div>
      <div v-for="l in lines" :key="l.label" class="person__line">
        <dt class="r-label">{{ l.label }}</dt>
        <dd class="mk-truncate">{{ l.value }}</dd>
      </div>
    </dl>
    <p class="person__note mk-end" aria-live="polite">{{ feedback ?? note }}</p>
  </div>
</template>

<style scoped>
.person__top {
  align-items: flex-start;
}

.person__who {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.person__name {
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.25;
}

.person__name--lg {
  font-size: var(--r-text-lg);
}

.person__role {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.35;
}

.person__contact {
  margin-top: 2px;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

.person__time {
  flex: none;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.person__set {
  display: inline-flex;
  margin: -4px;
  padding: 4px;
  cursor: pointer;
}
.person__set:hover {
  background: var(--r-bg-hover);
}

/* Row */
.person--row {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  gap: 12px;
  padding-top: 8px;
}

.person__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.person__reach {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  padding-top: 6px;
  border-top: 1px solid var(--r-border-subtle);
}

.person__value {
  flex: 1 1 auto;
  min-width: 0;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

.person__reach .person__time {
  margin-left: 6px;
}

/* Card */
.person__head {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 4px 0 2px;
}

.person__lines {
  display: grid;
  border-top: 1px solid var(--r-border-subtle);
}

.person__line {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr) 24px;
  align-items: center;
  gap: 8px;
  min-height: 32px;
  border-bottom: 1px solid var(--r-border-subtle);
}

.person__line dd {
  margin: 0;
  font-size: var(--r-text-xs);
}

.person__note {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}
</style>
