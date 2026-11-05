<script setup lang="ts">
/**
 * Translation is a conversation job; the screen keeps both versions side by side so a person can
 * check the meaning before sending, plus what was kept exactly as written (amounts, dates, codes).
 * Swap turns the direction around; the tone switch matters for Indonesian.
 */
import { computed, ref, watch } from 'vue'
import { ArrowLeftRight, ChevronRight } from 'lucide-vue-next'
import { RSegmented, RTextarea } from '@/design-system'
import Writing from './Writing.vue'
import { hits, useReply } from './shared'

interface Phrase {
  /** Indonesian, formal. */
  id: string
  /** Indonesian, as you would text it. */
  idCasual?: string
  en: string
  /** Typed Indonesian that means this phrase. */
  matchId: string
  /** Typed English that means this phrase. */
  matchEn: string
  /** Kept exactly: "Rp 450.000", "6 Nov". */
  keep?: string[]
}

const props = withDefaults(
  defineProps<{
    label: string
    phrases: Phrase[]
    from?: 'id' | 'en'
    initial?: number
    /** `flip`: one phrase and a language key, for small tiles. */
    layout?: 'panes' | 'flip'
  }>(),
  { from: 'id', initial: 0, layout: 'panes' },
)

const from = ref<'id' | 'en'>(props.from)
const tone = ref<'formal' | 'casual'>('formal')
const toneOptions = [
  { label: 'Formal', value: 'formal' },
  { label: 'Casual', value: 'casual' },
]
const say = (p: Phrase, lang: 'id' | 'en') => (lang === 'en' ? p.en : tone.value === 'casual' ? (p.idCasual ?? p.id) : p.id)

const source = ref(say(props.phrases[props.initial], from.value))
const found = ref<Phrase | null>(props.phrases[props.initial])
const { busy, reply } = useReply(450)

function read(text: string) {
  return props.phrases.find((p) => hits(from.value === 'id' ? p.matchId : p.matchEn, text)) ?? null
}

watch(source, (text) => {
  if (!text.trim()) {
    found.value = null
    return
  }
  reply(() => (found.value = read(text)))
})

const to = computed(() => (from.value === 'id' ? 'en' : 'id'))
const target = computed(() => (found.value ? say(found.value, to.value) : ''))
const example = computed(() => say(props.phrases[(props.initial + 1) % props.phrases.length], from.value))

function swap() {
  const next = target.value
  from.value = to.value
  if (next) source.value = next
}

/* Flip: one phrase, the language key, and Next. */
const index = ref(props.initial)
const lang = ref<'id' | 'en'>(props.from)
const langOptions = [
  { label: 'ID', value: 'id' },
  { label: 'EN', value: 'en' },
]
</script>

<template>
  <div v-if="layout === 'flip'" class="mk tr tr--flip">
    <p class="r-label mk-truncate">{{ label }}</p>
    <p class="tr__phrase mk-grow" aria-live="polite" :lang="lang">{{ say(phrases[index], lang) }}</p>
    <div class="tr__flipbar">
      <RSegmented v-model="lang" :options="langOptions" size="sm" :label="`${label} language`" />
      <button type="button" class="tr__next mk-reset" :aria-label="`Next phrase, ${(index + 1) % phrases.length + 1} of ${phrases.length}`" @click="index = (index + 1) % phrases.length">
        {{ index + 1 }}/{{ phrases.length }}<ChevronRight :size="14" aria-hidden="true" />
      </button>
    </div>
  </div>

  <div v-else class="mk tr">
    <div class="tr__bar">
      <span class="r-label mk-truncate">{{ label }}</span>
      <button type="button" class="tr__swap mk-reset" :aria-label="`Swap: now ${from === 'id' ? 'Indonesian to English' : 'English to Indonesian'}`" @click="swap">
        {{ from.toUpperCase() }} <ArrowLeftRight :size="12" aria-hidden="true" /> {{ to.toUpperCase() }}
      </button>
    </div>
    <div class="tr__panes mk-grow">
      <RTextarea v-model="source" :rows="3" resize="none" :aria-label="from === 'id' ? 'Indonesian text' : 'English text'" :lang="from" class="tr__source" />
      <div class="tr__target" aria-live="polite">
        <Writing v-if="busy" label="Translating" />
        <p v-else-if="target" class="tr__out" :lang="to">{{ target }}</p>
        <p v-else-if="source.trim()" class="tr__miss">No confident translation for that yet. Try “{{ example }}”</p>
        <p v-else class="tr__miss">Type or paste a sentence.</p>
      </div>
    </div>
    <div class="tr__foot">
      <p class="tr__keep mk-truncate">
        <template v-if="target && found?.keep?.length">Kept as written · {{ found.keep.join(' · ') }}</template>
        <template v-else-if="target">Nothing to keep as written</template>
      </p>
      <RSegmented v-if="to === 'id'" v-model="tone" :options="toneOptions" size="sm" label="Tone" />
    </div>
  </div>
</template>

<style scoped>
.tr {
  container-type: inline-size;
  gap: 8px;
}

.tr__bar,
.tr__foot {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.tr__swap {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 6px;
  height: 24px;
  padding: 0 8px;
  border: 1px solid var(--r-border-strong);
  color: var(--r-text);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  cursor: pointer;
}

.tr__swap:hover {
  border-color: var(--r-text-tertiary);
}

.tr__panes {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
}

.tr__source :deep(textarea) {
  font-size: var(--r-text-sm);
  line-height: 1.4;
}

.tr__target {
  min-height: 0;
  padding: 8px 10px;
  overflow: hidden;
  background: color-mix(in srgb, var(--r-text) 5%, transparent);
}

.tr__out {
  font-size: var(--r-text-sm);
  line-height: 1.45;
}

.tr__miss {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

.tr__keep {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
}

@container (min-width: 460px) {
  .tr__panes {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  .tr__source :deep(textarea) {
    height: 100%;
  }
}

.tr--flip {
  gap: 6px;
}

.tr__phrase {
  overflow: hidden;
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
  line-height: 1.35;
}

.tr__flipbar {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.tr__next {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  cursor: pointer;
}

.tr__next:hover {
  color: var(--r-text);
}
</style>
