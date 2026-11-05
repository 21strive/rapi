<script setup lang="ts">
import { computed } from 'vue'
import { jobs, tests, type Job } from '../board'

const props = defineProps<{
  job: Job
  /** Tiles of this job on the board right now (after the filter). */
  count: number
  total: number
  /** Distinct patterns among the chapter's tiles. */
  patterns: number
  state: 'loading' | 'ok' | 'error'
  message?: string
}>()

const test = computed(() => tests.find((t) => t.id === props.job.test)!)
</script>

<template>
  <header :id="`job-${job.id}`" class="mood-band" :data-job="job.id">
    <p class="mood-band__number" aria-hidden="true">{{ job.index }}</p>
    <div class="mood-band__head">
      <p class="mood-band__kicker">
        <span class="r-index">{{ job.index }} / {{ String(jobs.length).padStart(2, '0') }}</span>
        <span class="r-eyebrow">{{ job.name }}</span>
      </p>
      <h2 :id="`job-${job.id}-title`" class="mood-band__title">{{ job.title }}</h2>
    </div>
    <p class="mood-band__body">{{ job.body }}</p>
    <dl class="mood-band__meta">
      <div>
        <dt class="r-label">Test</dt>
        <dd>{{ test.index }} · {{ test.title }}</dd>
      </div>
      <div>
        <dt class="r-label">On the board</dt>
        <dd>
          <template v-if="state === 'loading'">Loading</template>
          <template v-else-if="state === 'error'">Did not load</template>
          <template v-else>
            <span class="mood-band__count">{{ count }}</span>
            <span v-if="count !== total" class="mood-band__of"> of {{ total }}</span>
            <span v-else class="mood-band__of"> · {{ patterns }} {{ patterns === 1 ? 'pattern' : 'patterns' }}</span>
          </template>
        </dd>
      </div>
    </dl>
    <p v-if="state === 'error'" class="mood-band__error">{{ message }}</p>
  </header>
</template>

<style>
.mood-band {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  border-top: 1px solid var(--r-border);
  border-left: 1px solid var(--r-border);
  background: var(--r-bg-surface);
  scroll-margin-top: 88px;
}

.mood-band > * {
  min-width: 0;
  margin: 0;
  padding: 16px;
  border-right: 1px solid var(--r-border);
  border-bottom: 1px solid var(--r-border);
}

.mood-band__number {
  display: none;
  color: var(--r-text);
  font-size: var(--r-text-6xl);
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
  line-height: 0.9;
  letter-spacing: var(--r-tracking-display);
}

.mood-band__kicker {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin: 0 0 8px;
}

.mood-band__title {
  font-size: var(--r-text-3xl);
  font-weight: var(--r-weight-semibold);
  line-height: 1.05;
  letter-spacing: var(--r-tracking-tighter);
  text-wrap: balance;
}

.mood-band__body {
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
  line-height: var(--r-leading-normal);
  text-wrap: pretty;
}

.mood-band__meta {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mood-band__meta dd {
  margin: 2px 0 0;
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
}

.mood-band__count {
  font-size: var(--r-text-2xl);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-tight);
  font-variant-numeric: tabular-nums;
}

.mood-band__of {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
}

.mood-band__error {
  grid-column: 1 / -1;
  color: var(--r-danger-text);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  overflow-wrap: anywhere;
}

/* Two columns on tablets: the claim and its numbers side by side, the body under them. */
@media (min-width: 560px) {
  .mood-band {
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  }
  .mood-band__body {
    grid-column: 1 / -1;
    grid-row: 2;
  }
}

@media (min-width: 900px) {
  .mood-band {
    grid-template-columns: minmax(120px, 1fr) minmax(0, 2.4fr) minmax(0, 2.4fr) minmax(160px, 1.2fr);
  }
  .mood-band > * {
    padding: 20px;
  }
  .mood-band__number {
    display: block;
  }
  .mood-band__body {
    grid-column: auto;
    grid-row: auto;
    align-self: stretch;
    padding-top: 44px;
  }
  .mood-band__meta {
    justify-content: space-between;
  }
}
</style>
