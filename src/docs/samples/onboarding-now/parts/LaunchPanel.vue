<script setup lang="ts">
/**
 * What needs the person. Before the launch: the one question Simpul has open, if any, with its
 * quick replies, and the launch itself, which says exactly what pressing it does and carries the
 * terms. After it: the two tools that need the person's OK at the provider, and the way in.
 * Replaced controls hand focus to their replacement (`focusFirst`).
 */
import { computed, ref } from 'vue'
import { ArrowRight, GitBranch, Lock, MessageSquare } from 'lucide-vue-next'
import { RButton, RStatus } from '@/design-system'
import { DeskCheck } from '../../_kit/desk'
import type { AccessKey } from '../data'

const props = defineProps<{
  live: boolean
  name: string
  url: string
  region: string
  invites: number
  integrations: number
  billed: string
  /** The question Simpul is waiting on, with the same quick replies as the thread. */
  question: { title: string; options: string[] } | null
  creating: boolean
  /** The agent is writing: the launch waits for the reply. */
  busy: boolean
  access: { key: AccessKey; name: string; line: string; connected: boolean }[]
  connecting: AccessKey | null
}>()

const emit = defineEmits<{ create: []; answer: [option: string]; allow: [key: AccessKey]; open: [] }>()

const root = ref<HTMLElement | null>(null)
const icons = { git: GitBranch, chat: MessageSquare }

const waitingTitle = computed(() => {
  const n = props.access.filter((a) => !a.connected).length
  return n === 0 ? 'Nothing waits for you' : n === 1 ? 'One tool waits for your OK' : 'Two tools wait for your OK'
})

/** Focus the first control that is left, after the one pressed was replaced. */
function focusFirst() {
  root.value?.querySelector<HTMLElement>('button:not(:disabled)')?.focus()
}

defineExpose({ focusFirst })
</script>

<template>
  <div ref="root" class="s-onbn-launch">
    <DeskCheck v-if="question && !live" eyebrow="Simpul asked" :title="question.title">
      <template #actions>
        <RButton
          v-for="option in question.options"
          :key="option"
          size="sm"
          variant="outline"
          :disabled="busy"
          @click="emit('answer', option)"
        >
          {{ option }}
        </RButton>
      </template>
    </DeskCheck>

    <DeskCheck v-if="!live" eyebrow="One confirm" :title="`Create ${name}`">
      <p class="s-onbn-launch__what">
        Goes live at <span class="s-onbn-launch__url">{{ url }}</span> in {{ region }}, sends
        {{ invites }} {{ invites === 1 ? 'invite' : 'invites' }}, turns on {{ integrations }}
        {{ integrations === 1 ? 'integration' : 'integrations' }} and bills {{ billed }} today.
      </p>
      <p class="s-onbn-launch__fixed">
        <Lock aria-hidden="true" />
        <span>The data region can't change once the workspace exists.</span>
      </p>
      <template #actions>
        <RButton tone="brand" :loading="creating" :disabled="busy" @click="emit('create')">Create workspace</RButton>
        <span class="s-onbn-launch__say">or say “create it”</span>
        <p class="s-onbn-launch__terms">
          Creating accepts the Simpul terms of service and the data processing addendum for {{ region }}.
        </p>
      </template>
    </DeskCheck>

    <DeskCheck v-else eyebrow="Live" :title="waitingTitle">
      <ul class="s-onbn-launch__access">
        <li v-for="item in access" :key="item.key" class="s-onbn-launch__tool">
          <span class="s-onbn-launch__icon" aria-hidden="true"><component :is="icons[item.key]" /></span>
          <span class="s-onbn-launch__tool-text">
            <span class="s-onbn-launch__tool-name">{{ item.name }}</span>
            <span class="s-onbn-launch__tool-line">{{ item.line }}</span>
          </span>
          <RStatus v-if="item.connected" size="sm" tone="success" label="Connected" />
          <RButton
            v-else
            size="sm"
            variant="outline"
            :loading="connecting === item.key"
            :disabled="busy || (connecting !== null && connecting !== item.key)"
            @click="emit('allow', item.key)"
          >
            Allow {{ item.name }}
          </RButton>
        </li>
      </ul>
      <template #actions>
        <RButton tone="brand" @click="emit('open')">
          Open workspace
          <template #trailing><ArrowRight /></template>
        </RButton>
      </template>
    </DeskCheck>
  </div>
</template>

<style scoped>
.s-onbn-launch {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.s-onbn-launch__what {
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
  line-height: var(--r-leading-normal);
}

.s-onbn-launch__url {
  color: var(--r-text);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
}

.s-onbn-launch__fixed {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

.s-onbn-launch__fixed svg {
  flex: none;
  width: 14px;
  height: 14px;
  margin-top: 1px;
}

.s-onbn-launch__say {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.s-onbn-launch__terms {
  flex-basis: 100%;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

.s-onbn-launch__access {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  border-top: 1px solid var(--r-border-subtle);
  list-style: none;
}

.s-onbn-launch__tool {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  padding: 8px 0;
  border-bottom: 1px solid var(--r-border-subtle);
}

.s-onbn-launch__icon {
  display: inline-grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--r-border-strong);
  color: var(--r-text-secondary);
}

.s-onbn-launch__icon svg {
  width: 16px;
  height: 16px;
}

.s-onbn-launch__tool-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.s-onbn-launch__tool-name {
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-semibold);
}

.s-onbn-launch__tool-line {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}
</style>
