<script setup lang="ts">
/**
 * One line of an audit log: who did what, when, and through which door. "Show change" turns the
 * sentence into the before and after of every field it touched, so the claim can be checked.
 */
import { ref, useId } from 'vue'
import { ArrowRight } from 'lucide-vue-next'
import { RAvatar, RStatus } from '@/design-system'
import type { Mark } from './shared'

interface Change {
  field: string
  before: string
  after: string
}

defineProps<{
  actor: string
  role?: string
  /** The sentence, without the actor: "raised the daily limit for …". */
  action: string
  time: string
  eventId: string
  changes: Change[]
  result?: Mark
  /** The door it came through: "Console", "API", "Simpul". */
  via?: string
}>()

const open = ref(false)
const bodyId = useId()
</script>

<template>
  <div class="mk audit">
    <div class="mk-row audit__head">
      <RAvatar :name="actor" size="xs" decorative />
      <p class="audit__who mk-truncate">
        <span class="audit__name">{{ actor }}</span>
        <span v-if="role" class="audit__role"> · {{ role }}</span>
      </p>
      <span class="audit__time">{{ time }}</span>
    </div>

    <div :id="bodyId" class="audit__body mk-grow">
      <p v-if="!open" class="audit__action">{{ action }}</p>
      <dl v-else class="audit__changes">
        <div v-for="c in changes" :key="c.field" class="audit__change">
          <dt class="mk-truncate">{{ c.field }}</dt>
          <dd>
            <span class="audit__before mk-truncate"><span class="r-sr-only">from </span>{{ c.before }}</span>
            <ArrowRight :size="12" aria-hidden="true" class="audit__arrow" />
            <span class="audit__after mk-truncate"><span class="r-sr-only">to </span>{{ c.after }}</span>
          </dd>
        </div>
      </dl>
    </div>

    <div class="mk-row audit__foot">
      <RStatus v-if="result" :tone="result.tone" :label="result.label" size="sm" class="audit__result" />
      <span class="audit__id mk-truncate">{{ eventId }}<span v-if="via" class="audit__via"> · {{ via }}</span></span>
      <button type="button" class="audit__toggle mk-reset" :aria-expanded="open" :aria-controls="bodyId" @click="open = !open">
        {{ open ? 'Hide change' : changes.length === 1 ? 'Show change' : `Show ${changes.length} changes` }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.audit {
  gap: 8px;
  container-type: inline-size;
}

.audit__head {
  gap: 8px;
}

.audit__who {
  flex: 1 1 auto;
  font-size: var(--r-text-sm);
}

.audit__name {
  font-weight: var(--r-weight-semibold);
}

.audit__role {
  color: var(--r-text-tertiary);
}

.audit__time,
.audit__id {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0;
  white-space: nowrap;
}

.audit__body {
  overflow: hidden;
}

.audit__action {
  display: -webkit-box;
  overflow: hidden;
  font-size: var(--r-text-md);
  line-height: var(--r-leading-snug);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.audit__changes {
  display: grid;
  border-top: 1px solid var(--r-border-subtle);
}

.audit__change {
  display: grid;
  grid-template-columns: minmax(64px, 0.7fr) minmax(0, 2fr);
  align-items: center;
  gap: 8px;
  min-height: 22px;
  border-bottom: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-xs);
}

.audit__change dt {
  color: var(--r-text-tertiary);
}

.audit__change dd {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  margin: 0;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  letter-spacing: 0;
}

.audit__before {
  color: var(--r-text-tertiary);
  text-decoration: line-through;
  text-decoration-color: var(--r-text-tertiary);
}

.audit__after {
  color: var(--r-text);
  font-weight: var(--r-weight-medium);
}

.audit__arrow {
  flex: none;
  color: var(--r-text-tertiary);
}

.audit__foot {
  gap: 10px;
}

.audit__id {
  flex: 1 1 auto;
}

.audit__result {
  flex: none;
}

/* Narrow: the id stays whole; the door and the role give way. */
@container (max-width: 420px) {
  .audit__via,
  .audit__role {
    display: none;
  }
}

.audit__toggle {
  flex: none;
  color: var(--r-brand-text);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
  cursor: pointer;
}
.audit__toggle:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

@container (min-width: 460px) {
  .audit__action {
    font-size: var(--r-text-lg);
  }
}
</style>
