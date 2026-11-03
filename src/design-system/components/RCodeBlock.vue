<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { Check, Copy } from 'lucide-vue-next'

/** A code block: optional title strip, line numbers, copy button. No syntax colours, by design. */
const props = withDefaults(
  defineProps<{
    code: string
    /** Shown in the title strip, e.g. "bash" or "json". */
    language?: string
    /** File name or caption in the title strip. */
    title?: string
    lineNumbers?: boolean
    copyable?: boolean
    /** Scroll vertically past this height, e.g. "320px". */
    maxHeight?: string
    wrap?: boolean
    /** Lines (1-based) to highlight with a rule in the tone colour. */
    highlight?: number[]
    /** brand (default) for "look here", danger for the failing line of a log, warning, success. */
    highlightTone?: 'brand' | 'danger' | 'warning' | 'success' | 'signal'
  }>(),
  { copyable: true },
)

// Template literals usually start with a newline and end with indentation; neither is code.
const source = computed(() => props.code.replace(/^\n+/, '').replace(/\s+$/, ''))
const lines = computed(() => source.value.split('\n'))
const marked = computed(() => new Set(props.highlight ?? []))
const gutter = computed(() => `${String(lines.value.length).length}ch`)
const hasStrip = computed(() => !!(props.title || props.language))
const regionLabel = computed(() => props.title || (props.language ? `${props.language} code` : 'Code'))

const copied = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

function fallbackCopy(text: string) {
  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.opacity = '0'
  document.body.appendChild(area)
  area.select()
  const ok = document.execCommand('copy')
  area.remove()
  if (!ok) throw new Error('copy failed')
}

async function copy() {
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(source.value)
    else fallbackCopy(source.value)
    copied.value = true
    clearTimeout(timer)
    timer = setTimeout(() => (copied.value = false), 1600)
  } catch {
    /* The clipboard can be blocked; the code stays selectable. */
  }
}

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div
    class="r-code"
    :class="[`r-tone-${highlightTone ?? 'brand'}`, { 'is-wrap': wrap, 'has-numbers': lineNumbers, 'has-strip': hasStrip }]"
  >
    <div v-if="hasStrip" class="r-code__strip">
      <span class="r-code__heading">
        <span v-if="title" class="r-code__title">{{ title }}</span>
        <span v-if="language" class="r-code__language">{{ language }}</span>
      </span>
      <button v-if="copyable" type="button" class="r-code__copy" @click="copy">
        <Check v-if="copied" aria-hidden="true" />
        <Copy v-else aria-hidden="true" />
        <span>{{ copied ? 'Copied' : 'Copy' }}</span>
      </button>
    </div>
    <button
      v-else-if="copyable"
      type="button"
      class="r-code__copy r-code__copy--floating"
      :aria-label="copied ? 'Copied' : 'Copy code'"
      @click="copy"
    >
      <Check v-if="copied" aria-hidden="true" />
      <Copy v-else aria-hidden="true" />
    </button>
    <div
      class="r-code__scroll"
      :style="maxHeight ? { maxHeight } : undefined"
      tabindex="0"
      role="region"
      :aria-label="regionLabel"
    >
      <pre class="r-code__pre" :style="{ '--r-code-gutter': gutter }"><code class="r-code__code"><span
        v-for="(line, index) in lines"
        :key="index"
        class="r-code__line"
        :class="{ 'is-highlighted': marked.has(index + 1) }"
      ><span v-if="lineNumbers" class="r-code__number" aria-hidden="true">{{ index + 1 }}</span><span class="r-code__text">{{ line || ' ' }}</span></span></code></pre>
    </div>
    <span class="r-sr-only" role="status">{{ copied ? 'Copied to the clipboard' : '' }}</span>
  </div>
</template>

<style>
.r-code {
  position: relative;
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--r-border);
  border-radius: var(--r-radius-surface);
  background: var(--r-bg-muted);
  color: var(--r-text);
}

/* ── Title strip ───────────────────────────────────────────────────────── */
.r-code__strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: 36px;
  padding: 0 6px 0 14px;
  border-bottom: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}

.r-code__heading {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  line-height: 1;
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.r-code__title {
  overflow: hidden;
  color: var(--r-text-secondary);
  font-weight: var(--r-weight-semibold);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.r-code__language {
  flex: none;
  color: var(--r-text-tertiary);
  font-weight: var(--r-weight-medium);
}
.r-code__title + .r-code__language {
  padding-left: 12px;
  border-left: 1px solid var(--r-border);
}

.r-code__copy {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 6px;
  height: 24px;
  padding: 0 8px;
  border: 0;
  border-radius: var(--r-radius-control);
  background: none;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-medium);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition:
    background-color var(--r-duration-fast) var(--r-ease-out),
    color var(--r-duration-fast) var(--r-ease-out);
}
.r-code__copy:hover {
  background: var(--r-bg-hover);
  color: var(--r-text);
}
.r-code__copy svg {
  width: 14px;
  height: 14px;
}

.r-code__copy--floating {
  position: absolute;
  z-index: 1;
  top: 6px;
  right: 6px;
  width: 28px;
  height: 28px;
  justify-content: center;
  padding: 0;
  border: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}

/* ── Code ──────────────────────────────────────────────────────────────── */
.r-code__scroll {
  overflow: auto;
  overscroll-behavior: contain;
}
.r-code__scroll:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: -2px;
}

/* The pre is as wide as its longest line, so highlighted lines run the full scroll width. */
.r-code__pre {
  display: block;
  width: max-content;
  min-width: 100%;
  margin: 0;
  padding: 12px 0;
  font-family: var(--r-font-mono);
  font-size: 12.5px;
  font-variant-ligatures: none;
  line-height: 1.7;
  tab-size: 2;
}
.r-code.is-wrap .r-code__pre {
  width: 100%;
}

.r-code__code {
  display: block;
  font: inherit;
}

.r-code__line {
  display: flex;
  padding: 0 16px;
}
.r-code.has-numbers .r-code__line {
  padding-left: 0;
}
.r-code:not(.has-strip) .r-code__line:first-child {
  padding-right: 44px;
}

.r-code__line.is-highlighted {
  background: var(--tone-soft, var(--r-brand-soft));
  box-shadow: inset 2px 0 0 var(--tone-lamp, var(--r-brand));
}

.r-code__number {
  flex: none;
  box-sizing: content-box;
  width: var(--r-code-gutter);
  padding: 0 16px 0 14px;
  color: var(--r-text-tertiary);
  text-align: right;
  user-select: none;
}
.r-code__line.is-highlighted .r-code__number {
  color: var(--tone-text, var(--r-brand-text));
}

.r-code__text {
  flex: 1 0 auto;
  white-space: pre;
}
.r-code.is-wrap .r-code__text {
  flex: 1 1 auto;
  min-width: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
