<script setup lang="ts">
/**
 * The rule editor: name, expression, a live preview of what the expression would have matched
 * over the last 24 hours, the action and the scope. Used for new rules and for editing one.
 */
import { computed, nextTick, ref, watch } from 'vue'
import {
  RAlert,
  RButton,
  RDialog,
  RInput,
  RKbd,
  RRadioGroup,
  RSelect,
  RSparkline,
  RTextarea,
  formatNumber,
} from '@/design-system'
import { parseRule, type RuleAction } from '../engine'
import { ACTIONS, ACTION_OPTIONS, SCOPE_OPTIONS, previewRule, type RulePreview } from '../data'

export interface RuleDraft {
  name: string
  expression: string
  action: RuleAction
  scope: string
}

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  mode: 'new' | 'edit'
  /** Values the form starts from each time it opens. */
  initial: RuleDraft
  /** "Rule 04 · Daniel Okafor · 9 Oct 2026" in edit mode. */
  context?: string
}>()

const emit = defineEmits<{ save: [draft: RuleDraft, preview: RulePreview] }>()

const name = ref('')
const expression = ref('')
const action = ref<RuleAction>('block')
const scope = ref('all')
const nameError = ref('')
const editor = ref<InstanceType<typeof RTextarea> | null>(null)

watch(
  open,
  (isOpen) => {
    if (!isOpen) return
    name.value = props.initial.name
    expression.value = props.initial.expression
    action.value = props.initial.action
    scope.value = props.initial.scope
    nameError.value = ''
    // The dialog focuses the expression; put the caret at its end, ready to extend it.
    nextTick(() =>
      requestAnimationFrame(() => {
        const field = editor.value?.textarea
        if (!field) return
        field.focus()
        field.setSelectionRange(field.value.length, field.value.length)
      }),
    )
  },
  { immediate: true },
)

watch(name, (value) => {
  if (value.trim()) nameError.value = ''
})

const parsed = computed(() => parseRule(expression.value))
const preview = computed(() => (parsed.value.ok ? previewRule(parsed.value.ast, scope.value) : null))

const percent = (share: number) =>
  share >= 0.1 ? `${formatNumber(share, { maximumFractionDigits: 1 })}%` : share > 0 ? `${formatNumber(share, { maximumSignificantDigits: 2 })}%` : '0%'

const OUTCOME: Record<RuleAction, string> = {
  block: 'Saved as Block, these requests get a 403 at the edge.',
  challenge: 'Saved as Challenge, these requests must pass a browser check first.',
  allow: 'Saved as Allow, these requests skip every rule below this one.',
  log: 'Saved as Log, these requests are recorded and carry on.',
}

/** What the preview alert says. Wide Block or Challenge rules get a warning. */
const notice = computed(() => {
  const p = parsed.value
  if (!p.ok) {
    return p.empty
      ? { tone: 'neutral' as const, title: 'Write an expression to see what it matches', body: 'The preview runs it against the last 24 hours of traffic as you type.' }
      : { tone: 'danger' as const, title: 'The expression does not parse', body: p.message }
  }
  const r = preview.value!
  if (r.total === 0) {
    return {
      tone: 'neutral' as const,
      title: 'Matches no requests in the last 24 h',
      body: 'Nothing in the last day of traffic fits. Check the values, or keep it as a guard.',
    }
  }
  const title = `Matches ${formatNumber(r.total)} requests in the last 24 h`
  const where = [r.topHost, r.topCountry].filter(Boolean).join(', ')
  const wide = (action.value === 'block' || action.value === 'challenge') && r.share >= 1
  if (wide) {
    return {
      tone: 'warning' as const,
      title,
      body: `That is ${percent(r.share)} of all traffic, mostly ${where}. A rule this wide reaches customers; narrow it before you save.`,
    }
  }
  return { tone: 'brand' as const, title, body: `${percent(r.share)} of all traffic, mostly ${where}. ${OUTCOME[action.value]}` }
})

const ACTION_HINT: Record<RuleAction, string> = {
  block: 'Answers 403. No rule below runs.',
  challenge: 'Asks for a browser check, then carries on.',
  allow: 'Lets the request through. No rule below runs.',
  log: 'Records the request. Rules below still run.',
}

const canSave = computed(() => parsed.value.ok)

function save() {
  if (!name.value.trim()) {
    nameError.value = 'Give the rule a name.'
    return
  }
  if (!parsed.value.ok || !preview.value) return
  emit(
    'save',
    { name: name.value.trim(), expression: expression.value.trim(), action: action.value, scope: scope.value },
    preview.value,
  )
  open.value = false
}

const FIELD_HINT = 'Fields: ip.src, ip.geo.country, asn, http.host, http.path, http.method, http.user_agent'
</script>

<template>
  <RDialog
    v-model:open="open"
    size="lg"
    :eyebrow="mode === 'new' ? 'Custom rule · runs first' : 'Custom rule'"
    :title="mode === 'new' ? 'New rule' : 'Edit rule'"
    initial-focus="textarea"
  >
    <form class="s-firewall-editor" @submit.prevent="save" @keydown.meta.enter.prevent="save" @keydown.ctrl.enter.prevent="save">
      <RInput v-model="name" label="Name" placeholder="What the rule is for" :error="nameError" autocomplete="off" />
      <RTextarea
        ref="editor"
        v-model="expression"
        label="Expression"
        :rows="4"
        mono
        spellcheck="false"
        autocapitalize="off"
        :hint="FIELD_HINT"
      />
      <RAlert :tone="notice.tone" :title="notice.title" class="s-firewall-editor__preview" aria-live="polite">
        {{ notice.body }}
        <template v-if="preview && preview.total > 0" #actions>
          <span class="s-firewall-editor__spark">
            <RSparkline
              :values="preview.hourly"
              :width="120"
              :height="28"
              color="var(--r-chart-1)"
              :label="`Matches per hour over the last 24 hours, peak ${formatNumber(Math.max(...preview.hourly))}`"
            />
            <span class="r-label">24 h · per hour</span>
          </span>
        </template>
      </RAlert>
      <div class="s-firewall-editor__row">
        <RSelect v-model="action" :options="ACTION_OPTIONS" label="Action" :hint="ACTION_HINT[action]" class="s-firewall-editor__action" />
        <RRadioGroup v-model="scope" :options="SCOPE_OPTIONS" label="Scope" />
      </div>
      <!-- A real submit button, so Enter in the name field saves too. -->
      <button type="submit" hidden />
    </form>
    <template #footer="{ close }">
      <span class="s-firewall-editor__context">
        <template v-if="context">{{ context }}</template>
        <template v-else>
          <RKbd :keys="['mod', 'enter']" size="sm" />
          <span>saves</span>
        </template>
      </span>
      <RButton variant="outline" @click="close">Cancel</RButton>
      <RButton tone="brand" :disabled="!canSave" @click="save">
        {{ mode === 'new' ? `Save ${ACTIONS[action].label.toLowerCase()} rule` : 'Save changes' }}
      </RButton>
    </template>
  </RDialog>
</template>

<style scoped>
.s-firewall-editor {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.s-firewall-editor__spark {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.s-firewall-editor__row {
  display: grid;
  grid-template-columns: minmax(0, 200px) minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

.s-firewall-editor__context {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  margin-right: auto;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

@media (max-width: 560px) {
  .s-firewall-editor__row {
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }
  /* Phones get the bottom sheet and no keyboard shortcut. */
  .s-firewall-editor__context {
    display: none;
  }
}
</style>
