<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Link2, X } from 'lucide-vue-next'
import { RAvatar, RBadge, RButton, RIconButton, RKbd, RSelect, RTextarea, RTimeline, useToast } from '@/design-system'
import PriorityMark from './PriorityMark.vue'
import StatusIcon from './StatusIcon.vue'
import { CYCLE, labelTone, people, priorities, statuses, type Issue, type PriorityId, type StatusId } from '../data'

const props = defineProps<{ issue: Issue; closable?: boolean }>()
const emit = defineEmits<{
  status: [value: StatusId]
  priority: [value: PriorityId]
  assignee: [value: string | null]
  estimate: [value: number | null]
  comment: [text: string]
  close: []
}>()

const { show } = useToast()

const statusOptions = statuses.map((s) => ({ label: s.label, value: s.id }))
const priorityOptions = priorities.map((p) => ({ label: p.label, value: p.id }))
const assigneeOptions = [{ label: 'Unassigned', value: '' }, ...people.map((p) => ({ label: p, value: p }))]
const estimateOptions = [{ label: 'No estimate', value: -1 }, ...[1, 2, 3, 5, 8].map((n) => ({ label: `${n} ${n === 1 ? 'point' : 'points'}`, value: n }))]

const status = computed({ get: () => props.issue.status, set: (v) => v && emit('status', v as StatusId) })
const priority = computed({ get: () => props.issue.priority, set: (v) => v != null && emit('priority', v as PriorityId) })
const assignee = computed({ get: () => props.issue.assignee ?? '', set: (v) => emit('assignee', v ? String(v) : null) })
const estimate = computed({ get: () => props.issue.estimate ?? -1, set: (v) => emit('estimate', v === -1 || v == null ? null : Number(v)) })

const draft = ref('')
watch(
  () => props.issue.id,
  () => (draft.value = ''),
)

function send() {
  const text = draft.value.trim()
  if (!text) return
  emit('comment', text)
  draft.value = ''
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
    event.preventDefault()
    send()
  }
}

async function copyLink() {
  const url = `https://tracker.21strive.example/platform/${props.issue.id}`
  try {
    await navigator.clipboard?.writeText(url)
  } catch {
    /* clipboard blocked */
  }
  show({ title: 'Link copied', body: url, tone: 'success', duration: 2600 })
}

const activity = computed(() => [...props.issue.activity].reverse())
</script>

<template>
  <article class="s-issues-detail" :aria-label="`${issue.id} ${issue.title}`">
    <header class="s-issues-detail__bar">
      <span class="s-issues-detail__crumbs">
        <span class="r-label">Platform</span>
        <span class="r-label" aria-hidden="true">/</span>
        <span class="r-mono s-issues-detail__id">{{ issue.id }}</span>
      </span>
      <span class="s-issues-detail__tools">
        <RIconButton label="Copy link to issue" variant="ghost" size="sm" @click="copyLink"><Link2 /></RIconButton>
        <RIconButton v-if="closable" label="Close issue, Escape" variant="ghost" size="sm" @click="emit('close')"><X /></RIconButton>
      </span>
    </header>

    <div class="s-issues-detail__scroll">
      <h2 class="s-issues-detail__title">{{ issue.title }}</h2>

      <div class="s-issues-detail__props">
        <RSelect v-model="status" :options="statusOptions" size="sm" label="Status">
          <template #leading><StatusIcon :status="issue.status" decorative /></template>
        </RSelect>
        <RSelect v-model="priority" :options="priorityOptions" size="sm" label="Priority">
          <template #leading><PriorityMark :priority="issue.priority" /></template>
        </RSelect>
        <RSelect v-model="assignee" :options="assigneeOptions" size="sm" label="Assignee">
          <template #leading><RAvatar v-if="issue.assignee" :name="issue.assignee" size="xs" decorative /></template>
        </RSelect>
        <RSelect v-model="estimate" :options="estimateOptions" size="sm" label="Estimate" />
      </div>

      <dl class="s-issues-detail__facts">
        <div>
          <dt class="r-label">Labels</dt>
          <dd class="s-issues-detail__labels">
            <RBadge v-for="l in issue.labels" :key="l" size="sm" :tone="labelTone[l] ?? 'neutral'" :dot="!!labelTone[l]">{{ l }}</RBadge>
          </dd>
        </div>
        <div>
          <dt class="r-label">Project</dt>
          <dd>{{ issue.project }}</dd>
        </div>
        <div>
          <dt class="r-label">Cycle</dt>
          <dd>{{ issue.status === 'backlog' ? 'None' : `${CYCLE.name} · ${CYCLE.range}` }}</dd>
        </div>
      </dl>

      <div class="s-issues-detail__desc">
        <p v-for="(para, i) in issue.description" :key="i">{{ para }}</p>
      </div>

      <section class="s-issues-detail__activity" aria-label="Activity">
        <p class="s-issues-detail__section r-eyebrow">Activity <span class="r-index">{{ issue.activity.length }}</span></p>
        <RTimeline :items="activity" dense time-position="top" />
      </section>

      <form class="s-issues-detail__comment" @submit.prevent="send">
        <RTextarea v-model="draft" :rows="3" label="Comment" placeholder="Leave a comment. Mention a commit or a deploy id." resize="none" @keydown="onKeydown" />
        <div class="s-issues-detail__send">
          <span class="r-caption r-text-tertiary"><RKbd :keys="['mod', 'enter']" size="sm" /> to send</span>
          <RButton type="submit" size="sm" :disabled="!draft.trim()">Comment</RButton>
        </div>
      </form>
    </div>
  </article>
</template>

<style scoped>
.s-issues-detail {
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;
  background: var(--r-bg-surface);
}
.s-issues-detail__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: 44px;
  padding: 0 12px 0 20px;
  border-bottom: 1px solid var(--r-border);
}
.s-issues-detail__crumbs {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
}
.s-issues-detail__id {
  color: var(--r-text);
  font-size: var(--r-text-sm);
}
.s-issues-detail__tools {
  display: inline-flex;
  gap: 4px;
}
.s-issues-detail__scroll {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 0;
  padding: 20px 20px 24px;
  overflow-y: auto;
}
.s-issues-detail__title {
  font-size: var(--r-text-xl);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.3;
}
.s-issues-detail__props {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.s-issues-detail__facts {
  display: flex;
  flex-direction: column;
  margin: 0;
  border-top: 1px solid var(--r-border-subtle);
}
.s-issues-detail__facts > div {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  min-height: 34px;
  border-bottom: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-sm);
}
.s-issues-detail__facts dd {
  margin: 0;
}
.s-issues-detail__labels {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.s-issues-detail__desc {
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
  line-height: var(--r-leading-relaxed);
}
.s-issues-detail__section {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 12px;
}
.s-issues-detail__comment {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.s-issues-detail__send {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.s-issues-detail__send .r-caption {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
</style>
