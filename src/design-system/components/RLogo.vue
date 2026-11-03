<script setup lang="ts">
import { computed } from 'vue'
import { RAPI_LOCKUP, RAPI_MARK, STRIVE_MARK } from '../brand/marks'

const props = withDefaults(
  defineProps<{
    /** Which family member. Rapi is the design language; 21 Strive is the company. */
    brand?: 'rapi' | '21strive'
    /** `lockup` adds the word; `mark` is the logogram alone. */
    variant?: 'lockup' | 'mark'
    /** Height of the logogram in px. The word in a lockup is sized from it. */
    size?: number
    /** Accessible name. Pass an empty string when the logo sits next to the same words. */
    label?: string
  }>(),
  { brand: 'rapi', variant: 'lockup', size: 24 },
)

const name = computed(() => props.label ?? (props.brand === 'rapi' ? 'Rapi' : '21 Strive'))

const box = computed(() => {
  if (props.brand === '21strive') return { w: STRIVE_MARK.width, h: STRIVE_MARK.height }
  return props.variant === 'mark'
    ? { w: RAPI_MARK.width, h: RAPI_MARK.height }
    : { w: RAPI_LOCKUP.width, h: RAPI_LOCKUP.height }
})

const width = computed(() => (props.size * box.value.w) / box.value.h)
</script>

<template>
  <span
    class="r-logo"
    :class="[`r-logo--${brand}`, `r-logo--${variant}`]"
    :style="{ '--r-logo-size': `${size}px` }"
    :role="name ? 'img' : undefined"
    :aria-label="name || undefined"
    :aria-hidden="name ? undefined : 'true'"
  >
    <svg
      class="r-logo__svg"
      :viewBox="`0 0 ${box.w} ${box.h}`"
      :width="width"
      :height="size"
      aria-hidden="true"
      focusable="false"
    >
      <template v-if="brand === '21strive'">
        <path :d="STRIVE_MARK.two" />
        <path :d="STRIVE_MARK.one" />
      </template>
      <path v-else-if="variant === 'mark'" :d="RAPI_MARK.d" />
      <path v-else :d="RAPI_LOCKUP.d" />
    </svg>
    <!-- 21 Strive lockup: the space between mark and word is the width of "21"; the cap height
         of the word is half the mark. "21" is SemiBold, "Strive" Regular, as in the brand book. -->
    <span v-if="brand === '21strive' && variant === 'lockup'" class="r-logo__word" aria-hidden="true">
      <b>21</b> Strive
    </span>
  </span>
</template>

<style>
.r-logo {
  display: inline-flex;
  align-items: baseline;
  flex: none;
  color: inherit;
  line-height: 1;
}

.r-logo__svg {
  display: block;
  flex: none;
  overflow: visible;
  fill: currentColor;
}

.r-logo__word {
  margin-left: calc(var(--r-logo-size) * 0.59);
  font-family: var(--r-font-sans);
  font-size: calc(var(--r-logo-size) * 0.7);
  font-weight: var(--r-weight-regular);
  letter-spacing: -0.035em;
  white-space: nowrap;
}

.r-logo__word b {
  font-weight: var(--r-weight-semibold);
}
</style>
