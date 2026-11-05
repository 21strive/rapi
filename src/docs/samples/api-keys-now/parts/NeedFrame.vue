<script setup lang="ts">
/**
 * One decision in the Needs you zone: an eyebrow and a quiet meta, the title, one mono line of
 * terms, the body, and the one control in the foot. `danger` names a destructive decision in its
 * eyebrow; `called` marks the one the person asked for by word, so the hand finds it.
 */
withDefaults(
  defineProps<{
    eyebrow: string
    title: string
    sub?: string
    meta?: string
    danger?: boolean
    called?: boolean
  }>(),
  { danger: false, called: false },
)

defineSlots<{ default?(): unknown; foot?(): unknown }>()
</script>

<template>
  <section class="s-akn-need" :class="{ 'is-danger': danger, 'is-called': called }" :aria-label="`${eyebrow}: ${title}`">
    <header class="s-akn-need__head">
      <p class="s-akn-need__eyebrow">{{ eyebrow }}</p>
      <p v-if="called" class="s-akn-need__called">Needs your hand</p>
      <p v-else-if="meta" class="s-akn-need__meta">{{ meta }}</p>
    </header>
    <h3 class="s-akn-need__title">{{ title }}</h3>
    <p v-if="sub" class="s-akn-need__sub">{{ sub }}</p>
    <div class="s-akn-need__body"><slot /></div>
    <div v-if="$slots.foot" class="s-akn-need__foot"><slot name="foot" /></div>
  </section>
</template>

<style>
/* Positioned, so the screen-reader text inside stays inside the surfaces' scroll. */
.s-akn-need {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  border: 1px solid var(--r-border-strong);
  background: var(--r-bg-surface);
}

/* Asked for by word: the signal rule says "this one, now". */
.s-akn-need.is-called {
  box-shadow: inset 3px 0 0 var(--r-signal);
}

.s-akn-need__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px 0;
}

.s-akn-need__eyebrow,
.s-akn-need__meta,
.s-akn-need__called {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  line-height: 16px;
  text-transform: uppercase;
}

.s-akn-need__eyebrow {
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
}

.s-akn-need.is-danger .s-akn-need__eyebrow {
  color: var(--r-danger-text);
}

.s-akn-need__meta {
  color: var(--r-text-tertiary);
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.s-akn-need__called {
  color: var(--r-signal-text);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.06em;
  white-space: nowrap;
}

.s-akn-need__title {
  padding: 2px 14px 0;
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.3;
}

.s-akn-need__sub {
  padding: 2px 14px 0;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.s-akn-need__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px 0;
}

.s-akn-need__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  padding: 12px 14px 14px;
}
</style>
