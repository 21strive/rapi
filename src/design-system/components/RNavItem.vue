<script setup lang="ts">
import type { Component } from 'vue'
import type { Tone } from '../types'

withDefaults(
  defineProps<{
    label: string
    icon?: Component
    badge?: string | number
    badgeTone?: Tone
    active?: boolean
    /** `soft`: a grey row with a 2px ink rule on its leading edge. `solid`: filled with ink. */
    variant?: 'soft' | 'solid'
    /**
     * What to render: 'a', 'button', or a component such as RouterLink.
     * Extra attributes (to, href, …) pass straight through.
     */
    as?: string | Component
    /** Icon only; the label becomes the accessible name. */
    collapsed?: boolean
  }>(),
  { variant: 'soft', badgeTone: 'neutral', as: 'a' },
)

defineSlots<{ trailing?(): unknown }>()
</script>

<template>
  <component
    :is="as"
    class="r-nav-item"
    :class="[`r-nav-item--${variant}`, { 'is-active': active, 'is-collapsed': collapsed }]"
    :aria-current="active ? 'page' : undefined"
    :aria-label="collapsed ? label : undefined"
    :title="collapsed ? label : undefined"
  >
    <component :is="icon" v-if="icon" class="r-nav-item__icon" />
    <span v-if="!collapsed" class="r-nav-item__label">{{ label }}</span>
    <span v-if="badge != null && !collapsed" class="r-nav-item__badge" :class="`r-tone-${badgeTone}`">{{ badge }}</span>
    <slot name="trailing" />
  </component>
</template>

<style>
.r-nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: var(--r-control-md);
  padding: 0 10px;
  border: 0;
  border-radius: var(--r-radius-control);
  background: none;
  color: var(--r-text-secondary);
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-medium);
  text-align: left;
  text-decoration: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition:
    background-color var(--r-duration-fast) var(--r-ease-out),
    color var(--r-duration-fast) var(--r-ease-out);
}

.r-nav-item:hover {
  background: var(--r-bg-hover);
  color: var(--r-text);
}

.r-nav-item:focus-visible {
  outline-offset: -2px;
}

.r-nav-item__icon {
  width: 16px;
  height: 16px;
  color: var(--r-text-tertiary);
  transition: color var(--r-duration-fast) var(--r-ease-out);
}
.r-nav-item:hover .r-nav-item__icon {
  color: var(--r-text-secondary);
}

.r-nav-item__label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Counts are mono tags. Neutral is quiet; any other tone is filled. */
.r-nav-item__badge {
  display: inline-grid;
  place-items: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: var(--r-radius-mark);
  background: var(--tone-soft);
  color: var(--tone-text);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-medium);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.r-nav-item__badge.r-tone-neutral {
  background: var(--r-bg-pressed);
  color: var(--r-text-secondary);
}
.r-nav-item__badge:not(.r-tone-neutral) {
  background: var(--tone-solid);
  color: var(--tone-on-solid);
}

.r-nav-item.is-collapsed {
  justify-content: center;
  width: var(--r-control-md);
  padding: 0;
}

/* Soft: the current page is a grey row with an ink rule on its leading edge. */
.r-nav-item--soft.is-active {
  background: var(--r-bg-hover);
  box-shadow: inset 2px 0 0 var(--r-ink);
  color: var(--r-text);
}
.r-nav-item--soft.is-active .r-nav-item__icon {
  color: var(--r-text);
}

/* Solid: the current page is filled with ink. */
.r-nav-item--solid.is-active {
  background: var(--r-ink);
  color: var(--r-on-ink);
}
.r-nav-item--solid.is-active .r-nav-item__icon {
  color: inherit;
}
.r-nav-item--solid.is-active .r-nav-item__badge {
  background: color-mix(in srgb, var(--r-on-ink) 20%, transparent);
  color: inherit;
}
</style>
