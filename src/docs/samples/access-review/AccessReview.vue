<script setup lang="ts">
/**
 * Sample 08 · Access review. Selaras Bank's quarterly access certification as the GRC owner
 * sees it mid-review: progress through the steps, the role × permission matrix with its
 * separation-of-duties conflicts, the reviewer queue, privileged sessions and MFA coverage.
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { Download, ShieldCheck } from 'lucide-vue-next'
import { RAvatarGroup, RButton, RStatus, formatNumber, useToast } from '@/design-system'
import SampleShell from '../_kit/SampleShell.vue'
import CertificationPanel from './parts/CertificationPanel.vue'
import PermissionMatrix from './parts/PermissionMatrix.vue'
import ReviewerQueue from './parts/ReviewerQueue.vue'
import PrivilegedSessions from './parts/PrivilegedSessions.vue'
import MfaCoverage from './parts/MfaCoverage.vue'
import {
  SCENARIO_NOW,
  campaign,
  reviewQueue,
  reviewers,
  sessions as initialSessions,
  type PrivilegedSession,
  type ReviewItem,
} from './data'

const { show } = useToast()

/* ── The scenario clock: 05:30:00 UTC, ticking from the moment the screen opens ─────── */
const now = ref(SCENARIO_NOW)
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  const opened = Date.now()
  timer = setInterval(() => (now.value = SCENARIO_NOW + (Date.now() - opened)), 1000)
})
onBeforeUnmount(() => clearInterval(timer))

/* ── Certification figures, moved by the reviewer queue ─────────────────────────────── */
const approved = ref(campaign.approved)
const revoked = ref(campaign.revoked)
const queue = ref<ReviewItem[]>([...reviewQueue])

function decide(item: ReviewItem, decision: 'approve' | 'revoke') {
  const at = queue.value.findIndex((i) => i.id === item.id)
  if (at < 0) return
  queue.value.splice(at, 1)
  if (decision === 'approve') approved.value++
  else revoked.value++

  const undo = () => {
    if (queue.value.some((i) => i.id === item.id)) return
    queue.value.splice(Math.min(at, queue.value.length), 0, item)
    if (decision === 'approve') approved.value--
    else revoked.value--
  }

  show(
    decision === 'approve'
      ? {
          title: 'Access approved',
          body: `${item.user} keeps ${item.entitlement} on ${item.system}. ${formatNumber(remaining())} entitlements left to review.`,
          tone: 'success',
          action: { label: 'Undo', onClick: undo },
        }
      : {
          title: 'Access revoked',
          body: `${item.entitlement} for ${item.user} goes to remediation. The owner of ${item.system} has 10 working days.`,
          tone: 'warning',
          action: { label: 'Undo', onClick: undo },
        },
  )
}

const remaining = () => campaign.total - approved.value - revoked.value

/* ── Privileged sessions ────────────────────────────────────────────────────────────── */
const liveSessions = ref<PrivilegedSession[]>([...initialSessions])

function endSession(session: PrivilegedSession) {
  liveSessions.value = liveSessions.value.filter((s) => s.id !== session.id)
  show({
    title: 'Session ended',
    body: `${session.user} was disconnected from ${session.target}. The recording stays with ${session.ticket}.`,
    tone: 'neutral',
  })
}

function exportEvidence() {
  const decided = approved.value + revoked.value
  show({
    title: 'Evidence pack exported',
    body: `uac-2026-q4-evidence.zip · ${formatNumber(decided)} decisions with reviewer, time and reason.`,
    tone: 'neutral',
  })
}
</script>

<template>
  <SampleShell product="IAM">
    <template #strip>
      <span class="s-access-review__strip-org">Selaras Bank<span class="s-access-review__strip-long"> · Access certification</span></span>
    </template>
    <template #meta>
      <RStatus tone="brand" size="sm" label="Review open" />
      <span class="s-access-review__strip-due">Due {{ campaign.due }}</span>
      <span class="s-access-review__strip-time">Tue 03 Nov 2026 · 12:30 WIB</span>
    </template>

    <template #header>
      <div class="s-access-review__title">
        <p class="r-eyebrow s-access-review__eyebrow">Quarterly certification · Q4 2026</p>
        <h1 class="s-access-review__h1">Access review</h1>
      </div>
    </template>
    <template #actions>
      <RAvatarGroup :names="reviewers" :max="4" size="sm" :label="`${reviewers.length} reviewers`" />
      <RButton variant="outline" @click="exportEvidence">
        <template #leading><Download /></template>
        Export evidence
      </RButton>
      <RButton tone="brand" disabled title="Available after the Remediate step">
        <template #leading><ShieldCheck /></template>
        Sign off
      </RButton>
    </template>

    <div class="s-access-review">
      <CertificationPanel :approved="approved" :revoked="revoked" class="s-access-review__cert" />
      <PermissionMatrix class="s-access-review__matrix" />
      <ReviewerQueue :items="queue" class="s-access-review__queue" @decide="decide" />
      <PrivilegedSessions :sessions="liveSessions" :now="now" class="s-access-review__sessions" @end="endSession" />
      <MfaCoverage class="s-access-review__mfa" />
    </div>
  </SampleShell>
</template>

<style scoped>
.s-access-review__strip-org {
  color: var(--r-text-secondary);
}

.s-access-review__title {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.s-access-review__eyebrow {
  color: var(--r-text-secondary);
}

.s-access-review__h1 {
  font-size: var(--r-text-xl);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-tight);
  line-height: 1.2;
}

.s-access-review {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 16px;
  align-items: start;
}

.s-access-review > * {
  min-width: 0;
}

.s-access-review__cert {
  grid-column: span 12;
}

.s-access-review__matrix {
  grid-column: span 7;
  align-self: stretch;
}

/* The queue takes the matrix's height and scrolls inside it. Its floor is the height of the
   unfiltered matrix, so filtering the matrix never squeezes the queue. */
.s-access-review__queue {
  grid-column: span 5;
  align-self: stretch;
}
@media (min-width: 1101px) {
  .s-access-review__queue {
    contain: size;
    min-height: 592px;
  }
}

.s-access-review__sessions {
  grid-column: span 7;
  align-self: stretch;
}

.s-access-review__mfa {
  grid-column: span 5;
}

@media (max-width: 1100px) {
  .s-access-review__matrix,
  .s-access-review__queue,
  .s-access-review__sessions,
  .s-access-review__mfa {
    grid-column: span 12;
  }
}

@media (max-width: 860px) {
  .s-access-review__strip-time {
    display: none;
  }
}

@media (max-width: 640px) {
  .s-access-review__strip-long,
  .s-access-review__strip-due {
    display: none;
  }
}
</style>
