<script setup lang="ts">
/** One phone viewport, 390 × 844, in a 1px frame with a mono index above it. No device chrome. */
defineProps<{ index: string; title: string }>()
defineSlots<{ default?(): unknown; footer?(): unknown }>()
</script>

<template>
  <figure class="s-mb-phone">
    <figcaption class="s-mb-phone__label">
      <span><span class="s-mb-phone__index">{{ index }}</span> {{ title }}</span>
      <span class="s-mb-phone__size">390 × 844</span>
    </figcaption>
    <div class="s-mb-phone__frame">
      <div class="s-mb-phone__scroll"><slot /></div>
      <div v-if="$slots.footer" class="s-mb-phone__footer"><slot name="footer" /></div>
    </div>
  </figure>
</template>

<style scoped>
.s-mb-phone {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 390px;
  max-width: 100%;
  margin: 0;
}

.s-mb-phone__label {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}
.s-mb-phone__index {
  margin-right: 6px;
  color: var(--r-text-tertiary);
  font-weight: var(--r-weight-medium);
}
.s-mb-phone__size {
  color: var(--r-text-tertiary);
  font-weight: var(--r-weight-medium);
  letter-spacing: 0.04em;
}

.s-mb-phone__frame {
  display: flex;
  flex-direction: column;
  height: 844px;
  overflow: hidden;
  border: 1px solid var(--r-border-strong);
  background: var(--r-bg-surface);
}

.s-mb-phone__scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: none;
}
.s-mb-phone__scroll::-webkit-scrollbar {
  display: none;
}

.s-mb-phone__footer {
  flex: none;
  /* The bottom safe area of a 390 × 844 phone: the home indicator sits here, nothing else. */
  padding-bottom: 34px;
  border-top: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}
</style>
