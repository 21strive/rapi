<script setup lang="ts">
/**
 * Sample 30 · Sign in & two-factor. The 21 Strive account flow as three screens side by side
 * (sign in, one-time code, recovery codes) beside the cobalt brand panel. Each step works on
 * its own; signing in sends a fresh code to step 02, and step 02 accepts step 03's codes.
 */
import { computed, ref } from 'vue'
import { LifeBuoy } from 'lucide-vue-next'
import { RButton, RCard, RLogo, RRule, RSegmented, RStatus, useToast } from '@/design-system'
import StepSignIn from './parts/StepSignIn.vue'
import StepCode from './parts/StepCode.vue'
import StepRecovery from './parts/StepRecovery.vue'
import { copy, freshCodes, initialCodes, languages, type Locale } from './data'

const locale = ref<Locale>('en')
const t = computed(() => copy[locale.value])

const codes = ref<string[]>([...initialCodes])
const used = ref<string[]>([])

const codeStep = ref<InstanceType<typeof StepCode> | null>(null)
const recoveryStep = ref<InstanceType<typeof StepRecovery> | null>(null)

const { show } = useToast()

function setLocale(value: string | number | undefined) {
  if (value === 'en' || value === 'id') locale.value = value
}

const onSignedIn = () => codeStep.value?.restart()
const onNext = () => recoveryStep.value?.focusAck()
const onRecoveryUsed = (code: string) => (used.value = [...used.value, code])

function regenerate() {
  codes.value = freshCodes()
  used.value = []
}

const help = () => show({ title: t.value.toast.help.title, body: t.value.toast.help.body })
</script>

<template>
  <main class="s-sign-in" :lang="locale">
    <h1 class="r-sr-only">{{ t.pageTitle }}</h1>

    <RCard variant="brand" padding="lg" class="s-sign-in-brand">
      <RLogo brand="21strive" variant="lockup" :size="28" label="21 Strive" />
      <p class="s-sign-in-tagline">{{ t.tagline }}</p>
    </RCard>

    <div class="s-sign-in-main">
      <header class="s-sign-in-bar">
        <p class="s-sign-in-product">{{ t.account }}</p>
        <div class="s-sign-in-bar-end">
          <RSegmented :model-value="locale" :options="languages" size="sm" :label="t.language" @update:model-value="setLocale" />
          <RButton variant="ghost" size="sm" @click="help">
            <template #leading><LifeBuoy /></template>
            {{ t.help }}
          </RButton>
        </div>
      </header>

      <div class="s-sign-in-flow">
        <RRule as="h2" :label="t.flow" :meta="t.flowMeta" class="s-sign-in-caption" />
        <div class="s-sign-in-steps">
          <StepSignIn :t="t" @signed-in="onSignedIn" />
          <StepCode ref="codeStep" :t="t" :codes="codes" :used="used" @next="onNext" @recovery-used="onRecoveryUsed" />
          <StepRecovery ref="recoveryStep" :t="t" :codes="codes" :used="used" @regenerate="regenerate" />
        </div>
      </div>

      <footer class="s-sign-in-foot">
        <RStatus tone="success" :label="t.footer.status" size="sm" />
        <p class="s-sign-in-legal">
          <span>{{ t.footer.rights }}</span>
          <span aria-hidden="true">·</span>
          <span>{{ t.footer.privacy }}</span>
          <span aria-hidden="true">·</span>
          <span>{{ t.footer.terms }}</span>
        </p>
      </footer>
    </div>
  </main>
</template>

<style scoped>
.s-sign-in {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  min-height: 100dvh;
  background: var(--r-bg-canvas);
  color: var(--r-text);
}

/* ── Brand panel: flat cobalt, the lockup, one line ─────────────────────────── */
.s-sign-in-brand {
  min-height: 168px;
  border-width: 0;
}

.s-sign-in-tagline {
  max-width: 22ch;
  margin-top: auto;
  font-size: var(--r-text-2xl);
  font-weight: var(--r-weight-semibold);
  line-height: 1.15;
  letter-spacing: var(--r-tracking-tight);
  text-wrap: balance;
}

/* ── Main column ────────────────────────────────────────────────────────────── */
.s-sign-in-main {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  max-width: 560px;
  margin: 0 auto;
  padding: 0 16px;
}

.s-sign-in-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
  min-height: 56px;
  padding: 10px 0;
  border-bottom: 1px solid var(--r-border);
}

.s-sign-in-product {
  color: var(--r-text);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  line-height: 1.4;
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.s-sign-in-bar-end {
  display: flex;
  align-items: center;
  gap: 8px;
}

.s-sign-in-flow {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  gap: 16px;
  padding: 24px 0;
}

/* RRule keeps its meta on one line; on a phone the meta drops below the label instead. */
.s-sign-in-caption {
  flex-wrap: wrap;
  row-gap: 4px;
}

/* The three screens on one ruled sheet: panels butt against each other on shared rules. */
.s-sign-in-steps {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  width: 100%;
}
.s-sign-in-steps > :deep(.s-sign-in-step + .s-sign-in-step) {
  margin-top: -1px;
}

.s-sign-in-foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 24px;
  min-height: 56px;
  /* Room for the docs toolbar that floats over the bottom of every sample. */
  padding: 12px 0 72px;
  border-top: 1px solid var(--r-border);
}

.s-sign-in-legal {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-medium);
  line-height: 14px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

@media (min-width: 640px) {
  .s-sign-in-main {
    padding: 0 24px;
  }
}

/* Tablet and small laptop: the brand band on top, the three screens in a row. */
@media (min-width: 1024px) {
  .s-sign-in-main {
    max-width: none;
  }
  .s-sign-in-steps {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .s-sign-in-steps > :deep(.s-sign-in-step + .s-sign-in-step) {
    margin-top: 0;
    margin-left: -1px;
  }
}

/* Desktop: the cobalt panel takes the left edge, full height. */
@media (min-width: 1280px) {
  .s-sign-in {
    grid-template-columns: clamp(300px, 25vw, 400px) minmax(0, 1fr);
  }
  .s-sign-in-brand {
    position: sticky;
    top: 0;
    height: 100dvh;
  }
  .s-sign-in-tagline {
    font-size: var(--r-text-3xl);
    letter-spacing: var(--r-tracking-tighter);
  }
  .s-sign-in-main {
    min-height: 100dvh;
    padding: 0 32px;
  }
  .s-sign-in-bar {
    min-height: 64px;
  }
  /* The docs toolbar sits at the centre of the viewport; the footer keeps to the right. */
  .s-sign-in-foot {
    justify-content: flex-end;
    padding-bottom: 12px;
  }
}
</style>
