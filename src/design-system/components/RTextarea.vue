<script setup lang="ts">
import { computed, ref, useAttrs, useId } from 'vue'
import { CircleAlert } from 'lucide-vue-next'
import { formatNumber } from '../composables/format'

defineOptions({ inheritAttrs: false })

/** Multi-line text field, same anatomy as RInput. */
const model = defineModel<string>({ default: '' })
const props = withDefaults(
  defineProps<{
    label?: string
    hint?: string
    error?: string
    placeholder?: string
    rows?: number
    /** Geist Mono: for code, JSON, keys. */
    mono?: boolean
    disabled?: boolean
    readonly?: boolean
    maxlength?: number
    resize?: 'none' | 'vertical'
  }>(),
  { rows: 4, resize: 'vertical' },
)

const attrs = useAttrs()
const autoId = useId()
const fieldId = computed(() => (typeof attrs.id === 'string' && attrs.id ? attrs.id : autoId))
const descriptionId = computed(() => `${fieldId.value}-description`)
const countId = computed(() => `${fieldId.value}-count`)
const isInvalid = computed(() => !!props.error)

// class and style dress the wrapper; everything else (name, aria-*, events) goes to <textarea>.
const rootAttrs = computed(() => ({ class: attrs.class, style: attrs.style }))
const controlAttrs = computed(() => {
  const { class: _class, style: _style, id: _id, ...rest } = attrs
  return rest
})

const length = computed(() => (model.value ?? '').length)
const nearLimit = computed(() => props.maxlength != null && length.value >= props.maxlength * 0.9)
const describedBy = computed(() => {
  const ids = [props.error || props.hint ? descriptionId.value : '', props.maxlength != null ? countId.value : '']
  return ids.filter(Boolean).join(' ') || undefined
})

const textarea = ref<HTMLTextAreaElement | null>(null)
defineExpose({ focus: () => textarea.value?.focus(), textarea })
</script>

<template>
  <div class="r-field" v-bind="rootAttrs">
    <label v-if="label" class="r-field__label" :for="fieldId">{{ label }}</label>
    <textarea
      :id="fieldId"
      ref="textarea"
      v-model="model"
      class="r-textarea"
      :class="[`r-textarea--resize-${resize}`, { 'is-mono': mono, 'is-invalid': isInvalid, 'is-disabled': disabled, 'is-readonly': readonly }]"
      :rows="rows"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :maxlength="maxlength"
      :aria-invalid="isInvalid ? 'true' : undefined"
      :aria-describedby="describedBy"
      v-bind="controlAttrs"
    />
    <div v-if="error || hint || maxlength != null" class="r-textarea__foot">
      <p v-if="error || hint" :id="descriptionId" class="r-field__hint" :class="{ 'is-error': !!error }">
        <CircleAlert v-if="error" class="r-field__icon" aria-hidden="true" />
        <span>{{ error || hint }}</span>
      </p>
      <span v-if="maxlength != null" :id="countId" class="r-textarea__count" :class="{ 'is-near': nearLimit }">
        {{ formatNumber(length) }} / {{ formatNumber(maxlength) }}
      </span>
    </div>
  </div>
</template>

<style>
/* Same rules as RInput: surface fill, a strong 1px border, a 2px cobalt ring on focus. */
.r-textarea {
  display: block;
  width: 100%;
  min-width: 0;
  min-height: var(--r-control-md);
  margin: 0;
  padding: 6px 10px;
  border: 1px solid var(--r-border-control);
  border-radius: var(--r-radius-control);
  outline: none;
  background: var(--r-bg-surface);
  color: var(--r-text);
  font-family: var(--r-font-sans);
  font-size: var(--r-text-md);
  line-height: 20px;
  transition:
    border-color var(--r-duration-fast) var(--r-ease-out),
    background-color var(--r-duration-fast) var(--r-ease-out),
    box-shadow var(--r-duration-fast) var(--r-ease-out);
}

.r-textarea--resize-vertical {
  resize: vertical;
}
.r-textarea--resize-none {
  resize: none;
}

.r-textarea:hover:not(.is-disabled, .is-readonly, :focus) {
  border-color: var(--r-text-secondary);
}

.r-textarea:focus,
.r-textarea:focus-visible {
  outline: none;
  box-shadow: var(--r-focus-ring);
}

.r-textarea::placeholder {
  color: var(--r-text-tertiary);
  opacity: 1;
}

.r-textarea.is-mono {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-sm);
  tab-size: 2;
}

.r-textarea.is-invalid,
.r-textarea.is-invalid:hover:not(:focus) {
  border-color: var(--r-danger);
}

.r-textarea.is-readonly {
  border-color: var(--r-border);
  background: var(--r-bg-muted);
}

.r-textarea.is-disabled {
  border-color: var(--r-border);
  background: var(--r-bg-muted);
  color: var(--r-text-disabled);
  cursor: not-allowed;
  resize: none;
}
.r-textarea.is-disabled::placeholder {
  color: var(--r-text-disabled);
}

.r-textarea__foot {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
}

.r-textarea__count {
  flex: none;
  margin-left: auto;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
  line-height: 1.5;
  letter-spacing: 0.02em;
  white-space: nowrap;
}
.r-textarea__count.is-near {
  color: var(--r-text);
}
</style>
