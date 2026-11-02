<script setup lang="ts">
import { computed, ref } from 'vue'
import { Check, Copy } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    code: string
    lang?: 'vue' | 'ts' | 'css' | 'bash'
    /** File name or label shown in the header. */
    title?: string
  }>(),
  { lang: 'vue' },
)

const copied = ref(false)
let timer = 0

async function copy() {
  try {
    await navigator.clipboard.writeText(props.code.trim())
    copied.value = true
    clearTimeout(timer)
    timer = window.setTimeout(() => (copied.value = false), 1600)
  } catch {
    /* clipboard can be blocked; the code is still selectable */
  }
}

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const span = (cls: string, text: string) => `<span class="tok-${cls}">${escape(text)}</span>`

/* A deliberately small highlighter: enough colour to scan a snippet, nothing more. */
function highlightScript(source: string): string {
  const pattern =
    /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`)|\b(import|from|export|default|const|let|var|function|return|if|else|new|type|interface|as|async|await|true|false|null|undefined)\b|\b(\d+(?:\.\d+)?)\b|([A-Za-z_$][\w$]*)(?=\s*\()/g
  let out = ''
  let last = 0
  for (const m of source.matchAll(pattern)) {
    out += escape(source.slice(last, m.index))
    if (m[1]) out += span('com', m[1])
    else if (m[2]) out += span('str', m[2])
    else if (m[3]) out += span('key', m[3])
    else if (m[4]) out += span('num', m[4])
    else if (m[5]) out += span('fn', m[5])
    last = (m.index ?? 0) + m[0].length
  }
  return out + escape(source.slice(last))
}

function highlightCss(source: string): string {
  const pattern = /(\/\*[\s\S]*?\*\/)|(--[\w-]+)|([\w-]+)(?=\s*:)|('(?:[^'])*'|"(?:[^"])*")|(#[0-9a-fA-F]{3,8}\b|\b\d+(?:\.\d+)?(?:px|rem|em|ms|%)?)/g
  let out = ''
  let last = 0
  for (const m of source.matchAll(pattern)) {
    out += escape(source.slice(last, m.index))
    if (m[1]) out += span('com', m[1])
    else if (m[2]) out += span('attr', m[2])
    else if (m[3]) out += span('key', m[3])
    else if (m[4]) out += span('str', m[4])
    else if (m[5]) out += span('num', m[5])
    last = (m.index ?? 0) + m[0].length
  }
  return out + escape(source.slice(last))
}

function highlightTag(tag: string): string {
  const open = tag.match(/^<\/?[\w.-]+/)?.[0] ?? ''
  let out = span('tag', open)
  const rest = tag.slice(open.length)
  const attr = /([:@#]?[\w.:-]+(?:\.[\w-]+)*)(=)("[^"]*"|'[^']*')|([:@#]?[\w.:-]+)|(\/?>)|(\s+)/g
  for (const m of rest.matchAll(attr)) {
    if (m[1]) out += span('attr', m[1]) + escape(m[2]) + span('str', m[3])
    else if (m[4]) out += span('attr', m[4])
    else if (m[5]) out += span('tag', m[5])
    else out += escape(m[0])
  }
  return out
}

function highlightVue(source: string): string {
  // Quoted attribute values may contain > (arrow functions, comparisons), so a tag ends at the first > outside quotes.
  const pattern =
    /(<!--[\s\S]*?-->)|(<script[^>]*>)([\s\S]*?)(<\/script>)|(<\/?[\w.-]+(?:\s(?:"[^"]*"|'[^']*'|[^<>"'])*?)?\/?>)|(\{\{[\s\S]*?\}\})/g
  let out = ''
  let last = 0
  for (const m of source.matchAll(pattern)) {
    out += escape(source.slice(last, m.index))
    if (m[1]) out += span('com', m[1])
    else if (m[2]) out += highlightTag(m[2]) + highlightScript(m[3]) + highlightTag(m[4])
    else if (m[5]) out += highlightTag(m[5])
    else if (m[6]) out += span('fn', m[6])
    last = (m.index ?? 0) + m[0].length
  }
  return out + escape(source.slice(last))
}

const html = computed(() => {
  const source = props.code.replace(/^\n+|\s+$/g, '')
  if (props.lang === 'ts') return highlightScript(source)
  if (props.lang === 'css') return highlightCss(source)
  if (props.lang === 'bash') return escape(source).replace(/^(\$ )/gm, '<span class="tok-com">$1</span>')
  return highlightVue(source)
})
</script>

<template>
  <div class="doc-code">
    <div class="doc-code__head">
      <span class="doc-code__title">{{ title ?? lang.toUpperCase() }}</span>
      <button type="button" class="doc-code__copy" :aria-label="copied ? 'Copied' : 'Copy code'" @click="copy">
        <Check v-if="copied" />
        <Copy v-else />
        <span>{{ copied ? 'Copied' : 'Copy' }}</span>
      </button>
    </div>
    <!-- eslint-disable-next-line vue/no-v-html -->
    <pre class="doc-code__pre" tabindex="0"><code v-html="html" /></pre>
  </div>
</template>
