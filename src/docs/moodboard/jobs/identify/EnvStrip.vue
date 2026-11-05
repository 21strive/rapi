<script setup lang="ts">
/**
 * Where am I: the label that says whether this screen touches the real thing. Live gets the
 * orange lamp and the orange rule, because it is live; everything else stays grey. Switch to see
 * how the mark changes.
 */
import { computed, ref } from 'vue'
import { RSegmented, RStatus, RSwitch } from '@/design-system'

interface Env {
  id: string
  label: string
  /** Mono detail beside the name: "ap-southeast-3", "sk_live_····9KD1". */
  detail: string
  /** One sentence: what acting here means. */
  note: string
  live?: boolean
}

const props = withDefaults(
  defineProps<{
    /** What this is a screen of: "Ledger · api-gateway". */
    context: string
    envs: Env[]
    current: string
    /** `strip` 4x1 · `switch` 1x1, two envs · `card` 2x2 · `banner` 3x1. */
    layout?: 'strip' | 'switch' | 'card' | 'banner'
  }>(),
  { layout: 'strip' },
)

const chosen = ref(props.current)
const env = computed(() => props.envs.find((e) => e.id === chosen.value) ?? props.envs[0])
const options = computed(() => props.envs.map((e) => ({ label: e.label, value: e.id })))
const pick = computed({
  get: () => chosen.value,
  set: (v: string | number | undefined) => (chosen.value = String(v ?? props.current)),
})

/* The switch layout: two environments, the live one is "on". */
const liveEnv = computed(() => props.envs.find((e) => e.live))
const otherEnv = computed(() => props.envs.find((e) => !e.live))
const isLive = computed({
  get: () => !!env.value.live,
  set: (on: boolean) => (chosen.value = (on ? liveEnv.value : otherEnv.value)?.id ?? chosen.value),
})
const repeated = computed(() => Array.from({ length: 3 }, () => env.value.label))
</script>

<template>
  <div class="mk env" :class="[`env--${layout}`, { 'is-live': env.live }]">
    <!-- 1x1 -->
    <template v-if="layout === 'switch'">
      <div class="mk-row mk-between">
        <span class="r-eyebrow mk-truncate">{{ context }}</span>
      </div>
      <RStatus v-if="env.live" tone="signal" :label="env.label" pulse />
      <RStatus v-else tone="neutral" :label="env.label" />
      <p class="env__detail r-mono mk-truncate">{{ env.detail }}</p>
      <p class="env__note">{{ env.note }}</p>
      <RSwitch v-model="isLive" class="mk-end" size="sm" :label="`${liveEnv?.label ?? 'Live'}`" />
    </template>

    <!-- 3x1: the exercise banner -->
    <template v-else-if="layout === 'banner'">
      <p class="env__banner" aria-live="polite">
        <span v-for="(w, i) in repeated" :key="i" :aria-hidden="i > 0 ? 'true' : undefined">{{ w }}</span>
      </p>
      <div class="mk-row mk-between env__line">
        <span class="env__note mk-truncate">{{ context }} · {{ env.note }}</span>
        <RStatus v-if="env.live" tone="signal" label="Live" pulse size="sm" />
      </div>
      <RSegmented v-model="pick" class="mk-end" :options="options" size="sm" :label="`${context}, mode`" />
    </template>

    <!-- 4x1 and 2x2 -->
    <template v-else>
      <div class="env__strip">
        <span class="env__context mk-truncate">{{ context }}</span>
        <span class="env__where">
          <span class="env__name">{{ env.label }}</span>
          <span class="env__sep" aria-hidden="true">/</span>
          <span class="env__detail-strip mk-truncate">{{ env.detail }}</span>
          <RStatus v-if="env.live" tone="signal" label="Live" pulse size="sm" />
        </span>
      </div>
      <div v-if="layout === 'card'" class="env__plate">
        <p class="env__big">{{ env.label }}</p>
        <p class="env__sub r-mono mk-truncate">{{ env.detail }}</p>
      </div>
      <p class="env__note" aria-live="polite">{{ env.note }}</p>
      <RSegmented v-model="pick" class="mk-end" :options="options" size="sm" :block="layout === 'card'" :label="`${context}, environment`" />
    </template>
  </div>
</template>

<style scoped>
.env {
  gap: 8px;
  container-type: inline-size;
}

/* The strip: the brand book's running header, with the environment at its right. */
.env__strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-width: 0;
  height: 32px;
  margin: 0 -12px;
  padding: 0 12px;
  border-top: 2px solid var(--r-border-strong);
  border-bottom: 1px solid var(--r-border);
  background: var(--r-bg-muted);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
  white-space: nowrap;
}

.is-live .env__strip {
  border-top-color: var(--r-signal);
}

.env__context {
  color: var(--r-text-tertiary);
}

.env__where {
  display: flex;
  flex: 0 1 auto;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.env__name {
  flex: none;
  color: var(--r-text);
}

.env__sep {
  color: var(--r-text-disabled);
}

.env__detail-strip {
  color: var(--r-text-secondary);
  font-weight: var(--r-weight-medium);
  letter-spacing: 0.04em;
  text-transform: none;
}

.env__note {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.45;
}

.env__detail {
  color: var(--r-text);
  font-size: var(--r-text-sm);
}

/* 2x2: a big plate under the strip */
.env__plate {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 12px;
  border: 1px solid var(--r-border);
  border-left: 2px solid var(--r-border-strong);
}

.is-live .env__plate {
  border-left-color: var(--r-signal);
}

.env__big {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xl);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.env__sub {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

/* 3x1: the word said three times, as a signal is on the net */
.env__banner {
  display: flex;
  gap: 18px;
  overflow: hidden;
  padding: 8px 0;
  border-top: 2px solid var(--r-border-strong);
  border-bottom: 1px solid var(--r-border);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xl);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
  white-space: nowrap;
}

.is-live .env__banner {
  border-top-color: var(--r-signal);
}

.env__line {
  min-height: 16px;
}

@container (max-width: 420px) {
  .env__context {
    display: none;
  }
  .env__strip {
    justify-content: flex-start;
  }
}
</style>
