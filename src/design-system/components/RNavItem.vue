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
    /** `soft`: grey highlight. `solid`: filled with the brand colour. */
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
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 38px;
  padding: 0 10px;
  border: 0;
  border-radius: var(--r-radius-md);
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
  background: color-mix(in srgb, var(--r-bg-hover) 70%, transparent);
  color: var(--r-text);
}

.r-nav-item__icon {
  width: 18px;
  height: 18px;
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

.r-nav-item__badge {
  display: inline-grid;
  place-items: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: var(--r-radius-full);
  background: var(--tone-soft);
  color: var(--tone-text);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
}
.r-nav-item__badge:not(.r-tone-neutral) {
  background: var(--tone-solid);
  color: var(--tone-on-solid);
}

.r-nav-item.is-collapsed {
  justify-content: center;
  width: 40px;
  padding: 0;
}

.r-nav-item--soft.is-active {
  background: var(--r-bg-hover);
  color: var(--r-text);
}
.r-nav-item--soft.is-active .r-nav-item__icon {
  color: var(--r-text);
}

.r-nav-item--solid.is-active {
  background: var(--r-brand);
  box-shadow: var(--r-shadow-highlight), 0 6px 16px -8px color-mix(in srgb, var(--r-brand) 70%, transparent);
  color: var(--r-on-brand);
}
.r-nav-item--solid.is-active .r-nav-item__icon {
  color: inherit;
}
.r-nav-item--solid.is-active .r-nav-item__badge {
  background: rgb(255 255 255 / 0.22);
  color: inherit;
}
</style>
