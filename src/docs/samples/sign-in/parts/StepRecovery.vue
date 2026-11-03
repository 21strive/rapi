<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { CircleCheck, Download, Printer, RefreshCw } from 'lucide-vue-next'
import { RButton, RCard, RCheckbox, RCodeBlock, RIconButton, RStatus, RTooltip, useToast } from '@/design-system'
import { account, codeFile, codeSheet, type Copy } from '../data'

const props = defineProps<{ t: Copy; codes: string[]; used: string[] }>()
const emit = defineEmits<{ regenerate: [] }>()

const { show } = useToast()

const saved = ref(false)
const busy = ref(false)
const done = ref(false)

const sheet = computed(() => codeSheet(props.codes, props.used))
const unused = computed(() => props.codes.filter((c) => !props.used.includes(c)).length)

// New codes mean the old acknowledgement no longer holds.
watch(
  () => props.codes,
  () => {
    saved.value = false
    done.value = false
  },
)

const card = ref<{ $el: HTMLElement } | null>(null)

function download() {
  const blob = new Blob([codeFile(props.codes, props.used)], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'recovery-codes.txt'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  show({ title: props.t.toast.downloaded.title, body: props.t.toast.downloaded.body })
}

const print = () => show({ title: props.t.toast.printed.title, body: props.t.toast.printed.body })

function regenerate() {
  emit('regenerate')
  show({ title: props.t.toast.regenerated.title, body: props.t.toast.regenerated.body, tone: 'warning' })
}

function finish() {
  if (!saved.value || done.value) return
  busy.value = true
  window.setTimeout(() => {
    busy.value = false
    done.value = true
    show({ title: props.t.toast.finished.title, body: props.t.toast.finished.body(account.name), tone: 'success' })
  }, 700)
}

/** Step 02 hands over here: bring the acknowledgement into view and focus it. */
function focusAck() {
  card.value?.$el.querySelector<HTMLInputElement>('input[type="checkbox"]')?.focus()
}

defineExpose({ focusAck })
</script>

<template>
  <RCard
    ref="card"
    class="s-sign-in-step"
    :eyebrow="`${t.step} 03`"
    :title="t.recovery.title"
    :subtitle="t.recovery.sub(account.org)"
  >
    <template #actions>
      <span class="s-sign-in-status">
        <RStatus :tone="done ? 'success' : 'neutral'" :label="done ? t.recovery.statusSaved : t.recovery.statusPending" />
      </span>
    </template>

    <div class="s-sign-in-codes">
      <RCodeBlock :code="sheet" title="recovery-codes.txt" />
      <div class="s-sign-in-row">
        <RButton variant="outline" size="sm" @click="download">
          <template #leading><Download /></template>
          {{ t.recovery.download }}
        </RButton>
        <RButton variant="outline" size="sm" @click="print">
          <template #leading><Printer /></template>
          {{ t.recovery.print }}
        </RButton>
        <span class="s-sign-in-regen">
          <RTooltip :content="t.recovery.regenerate" :describe="false">
            <RIconButton :label="t.recovery.regenerate" variant="ghost" size="sm" @click="regenerate">
              <RefreshCw />
            </RIconButton>
          </RTooltip>
        </span>
      </div>
    </div>

    <div class="s-sign-in-form">
      <RCheckbox v-model="saved" :label="t.recovery.ack" :disabled="done" />
      <RButton size="lg" block :loading="busy" :disabled="!saved || done" @click="finish">
        <template v-if="done" #leading><CircleCheck /></template>
        {{ done ? t.recovery.finished : t.recovery.finish }}
      </RButton>
      <p v-if="done" class="s-sign-in-message" role="status">
        <CircleCheck aria-hidden="true" />
        <span>{{ t.recovery.doneLine(account.email) }}</span>
      </p>
    </div>

    <template #footer>
      <p class="s-sign-in-meta">
        <span>{{ t.recovery.generated(account.generated) }}</span>
        <span>{{ t.recovery.unused(unused) }}</span>
      </p>
    </template>
  </RCard>
</template>

<style scoped>
/* The status sits on the eyebrow's line: the card lifts its actions by 4px, this puts it back. */
.s-sign-in-status {
  display: inline-flex;
  padding-top: 4px;
}

.s-sign-in-codes,
.s-sign-in-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.s-sign-in-form {
  gap: 16px;
}

.s-sign-in-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.s-sign-in-regen {
  display: inline-flex;
  margin-left: auto;
}

.s-sign-in-message {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  color: var(--r-success-text);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}
.s-sign-in-message svg {
  flex: none;
  width: 14px;
  height: 14px;
  margin-top: 1px;
}

.s-sign-in-meta {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 4px 12px;
  padding-top: 12px;
  border-top: 1px solid var(--r-border-subtle);
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-medium);
  letter-spacing: 0.06em;
  line-height: 1.5;
  text-transform: uppercase;
  font-variant-numeric: tabular-nums;
}
</style>
