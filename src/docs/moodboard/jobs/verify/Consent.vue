<script setup lang="ts">
/**
 * A consent, as a record rather than a policy to remember: who may do what with your data, since
 * when and until when. Turning it off revokes it at once and adds a line to the record; turning it
 * on again is a new grant with its own time, never an edit of the old one.
 */
import { computed, ref } from 'vue'
import { RButton, RStatus, RSwitch } from '@/design-system'
import { stamp } from './shared'

interface Scope {
  label: string
  on: boolean
}

const props = withDefaults(
  defineProps<{
    /** The consent's reference, mono: "CNS-7F2A-0412". */
    reference: string
    who: string
    /** What they may do, as the end of a sentence: "read your lab results from RS Harapan". */
    what: string
    since: string
    until?: string
    scopes?: Scope[]
    /** row 2x1 · mini 1x1 · card 2x2 (with scopes). */
    layout?: 'row' | 'mini' | 'card'
  }>(),
  { scopes: () => [], layout: 'row' },
)

const granted = ref(true)
const scopes = ref(props.scopes.map((s) => ({ ...s })))
const log = ref<string[]>([])

function setGranted(on: boolean) {
  granted.value = on
  log.value = [`${on ? 'Granted again' : 'Revoked'} · ${stamp()}`, ...log.value].slice(0, 3)
}

function setScope(i: number, on: boolean) {
  scopes.value[i].on = on
  log.value = [`${scopes.value[i].label} ${on ? 'on' : 'off'} · ${stamp('WIB', false)}`, ...log.value].slice(0, 3)
}

const status = computed(() =>
  granted.value ? { tone: 'success' as const, label: 'Granted' } : { tone: 'neutral' as const, label: 'Revoked' },
)
</script>

<template>
  <div class="mk consent" :class="`consent--${layout}`">
    <div class="mk-row mk-between">
      <span class="consent__ref mk-truncate">{{ reference }}</span>
      <RStatus :tone="status.tone" :label="status.label" size="sm" />
    </div>

    <p class="consent__sentence" :class="{ 'is-off': !granted }">
      <span class="consent__who">{{ who }}</span>
      {{ granted ? 'can' : 'can no longer' }} {{ what }}
    </p>

    <ul v-if="layout === 'card' && scopes.length" class="consent__scopes">
      <li v-for="(s, i) in scopes" :key="s.label" class="consent__scope">
        <RSwitch
          :model-value="s.on && granted"
          :disabled="!granted"
          size="sm"
          :label="s.label"
          @update:model-value="setScope(i, $event)"
        />
      </li>
    </ul>

    <div class="consent__foot mk-end">
      <p class="consent__dates" aria-live="polite">
        <template v-if="log.length">{{ log[0] }}</template>
        <template v-else>Since {{ since }}<template v-if="until"> · until {{ until }}</template></template>
      </p>
      <RButton v-if="layout === 'card'" size="xs" :variant="granted ? 'outline' : 'solid'" :tone="granted ? 'danger' : 'neutral'" @click="setGranted(!granted)">
        {{ granted ? 'Revoke all' : 'Grant again' }}
      </RButton>
      <RSwitch
        v-else
        :model-value="granted"
        :size="layout === 'mini' ? 'sm' : 'md'"
        :aria-label="`${who} access`"
        @update:model-value="setGranted($event)"
      />
    </div>
    <p v-if="layout === 'card' && log.length > 1" class="consent__older">
      <span v-for="l in log.slice(1)" :key="l">{{ l }}</span>
    </p>
  </div>
</template>

<style scoped>
.consent {
  gap: 8px;
}

.consent__ref {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
}

.consent__sentence {
  display: -webkit-box;
  overflow: hidden;
  font-size: var(--r-text-md);
  line-height: var(--r-leading-snug);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.consent__sentence.is-off {
  color: var(--r-text-secondary);
}

.consent__who {
  font-weight: var(--r-weight-semibold);
}

.consent__scopes {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--r-border-subtle);
}

.consent__scope {
  display: flex;
  align-items: center;
  min-height: 30px;
  border-bottom: 1px solid var(--r-border-subtle);
}

.consent__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.consent__dates {
  min-width: 0;
  overflow: hidden;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.consent__older {
  display: flex;
  flex-direction: column;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
}

.consent--mini .consent__sentence {
  font-size: var(--r-text-sm);
  -webkit-line-clamp: 3;
}

.consent--mini .consent__dates {
  white-space: normal;
}
</style>
