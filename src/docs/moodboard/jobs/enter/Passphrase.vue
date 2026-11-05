<script setup lang="ts">
/**
 * A new passphrase. A secret is never said aloud: it is typed, hidden by default, and the meter
 * says in words (not only in colour) whether it holds and what would make it stronger. Suggest
 * makes one from four unrelated words.
 */
import { computed, ref, useId } from 'vue'
import { Dices, Eye, EyeOff } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    eyebrow: string
    meta?: string
    label?: string
    value?: string
    /** The account or network the passphrase belongs to, for password managers. */
    account?: string
    /** Shown in clear from the start (a guest Wi-Fi key is read out to visitors). */
    reveal?: boolean
    suggest?: boolean
    min?: number
  }>(),
  { label: 'New passphrase', value: '', min: 12 },
)

const uid = useId()
const text = ref(props.value)
const shown = ref(props.reveal)

const COMMON = ['password', 'passw0rd', '123456', 'qwerty', 'kopi123', 'bismillah', 'indonesia', 'admin', 'rahasia', 'sayang', 'iloveyou']
const WORDS = ['kopi', 'hujan', 'lereng', 'sawah', 'ombak', 'pelita', 'rantai', 'angin', 'gunung', 'jembatan', 'layang', 'sungai', 'pasar', 'bambu', 'senja', 'karang', 'kabut', 'lumbung']

const rating = computed(() => {
  const p = text.value
  const len = [...p].length
  if (!len) return { score: 0, word: 'Empty', why: `At least ${props.min} characters` }
  const low = p.toLowerCase()
  if (COMMON.some((c) => low.includes(c)) || /^(.)\1+$/.test(p)) return { score: 1, word: 'Weak', why: 'A common password, guessed in seconds' }
  if (len < props.min) return { score: 1, word: 'Too short', why: `Add ${props.min - len} more ${props.min - len === 1 ? 'character' : 'characters'}` }
  const words = p.split(/[\s\-_.]+/).filter((w) => w.length >= 3).length
  if (words >= 4 && len >= 20) return { score: 4, word: 'Strong', why: 'Four unrelated words hold up well' }
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(p)).length
  const score = Math.min(4, (len >= 20 ? 3 : len >= 16 ? 2 : 1) + (kinds >= 3 ? 1 : 0))
  const why = score >= 3 ? 'Long enough to hold' : len < 16 ? 'Longer is stronger than stranger' : 'Mix in a digit or a symbol'
  return { score, word: ['Empty', 'Weak', 'Fair', 'Good', 'Strong'][score], why }
})

const tone = computed(() => {
  const s = rating.value.score
  if (s === 0) return 'neutral'
  return s === 1 ? 'danger' : s === 2 ? 'warning' : 'success'
})

function make() {
  const pick = () => WORDS[crypto.getRandomValues(new Uint32Array(1))[0] % WORDS.length]
  const n = String(crypto.getRandomValues(new Uint32Array(1))[0] % 90 + 10)
  text.value = [pick(), pick(), pick(), pick(), n].join('-')
  shown.value = true
}
</script>

<template>
  <div class="mk en-root pass">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span v-if="meta" class="en-meta">{{ meta }}</span>
    </div>

    <form class="pass__field mk-end" novalidate @submit.prevent>
      <input class="r-sr-only" type="text" autocomplete="username" :value="account ?? eyebrow" tabindex="-1" aria-hidden="true" readonly />
      <div class="mk-row mk-between">
        <label class="pass__label" :for="`${uid}-in`">{{ label }}</label>
        <button v-if="suggest" type="button" class="en-link pass__suggest" @click="make">
          <Dices aria-hidden="true" />Suggest one
        </button>
      </div>
      <div class="pass__box en-box">
        <input
          :id="`${uid}-in`"
          v-model="text"
          class="en-control pass__input"
          :type="shown ? 'text' : 'password'"
          autocomplete="new-password"
          spellcheck="false"
          :aria-describedby="`${uid}-msg`"
        />
        <button
          type="button"
          class="pass__eye"
          :aria-label="shown ? 'Hide the passphrase' : 'Show the passphrase'"
          :aria-pressed="shown ? 'true' : 'false'"
          @click="shown = !shown"
        >
          <EyeOff v-if="shown" aria-hidden="true" />
          <Eye v-else aria-hidden="true" />
        </button>
      </div>
    </form>

    <p :id="`${uid}-msg`" class="pass__meter" :class="`r-tone-${tone}`" aria-live="polite">
      <span class="pass__bars" aria-hidden="true">
        <span v-for="i in 4" :key="i" :class="{ 'is-on': i <= rating.score }" />
      </span>
      <span class="pass__word">{{ rating.word }}</span>
      <span class="pass__why mk-truncate">{{ rating.why }}</span>
    </p>
  </div>
</template>

<style scoped>
.pass__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.pass__label {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
  line-height: 1.3;
}

.pass__suggest {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.pass__suggest svg {
  width: 14px;
  height: 14px;
}

.pass__box {
  height: var(--r-control-md);
}

.pass__input {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-sm);
  letter-spacing: 0.02em;
}

.pass__eye {
  display: grid;
  flex: none;
  place-items: center;
  width: 28px;
  height: 28px;
  margin-right: 2px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--r-text-tertiary);
  cursor: pointer;
}

.pass__eye:hover {
  background: var(--r-bg-hover);
  color: var(--r-text);
}

.pass__eye:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: -2px;
}

.pass__eye svg {
  width: 16px;
  height: 16px;
}

.pass__meter {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

.pass__bars {
  display: grid;
  flex: none;
  grid-template-columns: repeat(4, 14px);
  gap: 2px;
}

.pass__bars span {
  height: 6px;
  background: var(--r-bg-track);
}

.pass__bars span.is-on {
  background: var(--tone-lamp);
}

.pass__word {
  flex: none;
  color: var(--tone-text);
  font-weight: var(--r-weight-semibold);
}

.pass__why {
  color: var(--r-text-tertiary);
}
</style>
