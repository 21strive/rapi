<script setup lang="ts">
import { computed, type Component } from 'vue'
import type { BreadcrumbItem } from '../types'

/** Path to the current page, separated by mono slashes. The last item is the current page. */
const props = withDefaults(
  defineProps<{
    items: BreadcrumbItem[]
    /** Link component for items with `to`, e.g. RouterLink. Defaults to <a>. */
    as?: Component | string
  }>(),
  {},
)

/** What to render for an item that isn't the current page: the `as` component, an <a>, or text. */
function linkOf(item: BreadcrumbItem): { is: Component | string; attrs: Record<string, unknown> } | null {
  if (item.to !== undefined && props.as && typeof props.as !== 'string') return { is: props.as, attrs: { to: item.to } }
  if (item.to !== undefined && typeof props.as === 'string' && props.as !== 'a') return { is: props.as, attrs: { to: item.to } }
  const href = item.href ?? (typeof item.to === 'string' ? item.to : undefined)
  return href !== undefined ? { is: 'a', attrs: { href } } : null
}

const entries = computed(() =>
  props.items.map((item, index) => ({
    item,
    key: `${index}-${item.label}`,
    first: index === 0,
    current: index === props.items.length - 1,
    link: linkOf(item),
  })),
)
</script>

<template>
  <nav class="r-breadcrumb" aria-label="Breadcrumb">
    <ol class="r-breadcrumb__list" role="list">
      <li v-for="entry in entries" :key="entry.key" class="r-breadcrumb__item">
        <span v-if="!entry.first" class="r-breadcrumb__separator" aria-hidden="true">/</span>
        <span v-if="entry.current" class="r-breadcrumb__current" aria-current="page">{{ entry.item.label }}</span>
        <component :is="entry.link.is" v-else-if="entry.link" class="r-breadcrumb__link" v-bind="entry.link.attrs">
          {{ entry.item.label }}
        </component>
        <span v-else class="r-breadcrumb__text">{{ entry.item.label }}</span>
      </li>
    </ol>
  </nav>
</template>

<style>
.r-breadcrumb {
  min-width: 0;
}

.r-breadcrumb__list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  row-gap: 4px;
  min-width: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: var(--r-text-sm);
  line-height: 20px;
}

.r-breadcrumb__item {
  display: inline-flex;
  align-items: center;
  min-width: 0;
}

.r-breadcrumb__separator {
  flex: none;
  margin: 0 8px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  user-select: none;
}

.r-breadcrumb__link,
.r-breadcrumb__text {
  overflow: hidden;
  color: var(--r-text-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.r-breadcrumb__link {
  text-decoration: none;
  text-underline-offset: 3px;
  transition: color var(--r-duration-fast) var(--r-ease-out);
}
.r-breadcrumb__link:hover {
  color: var(--r-text);
  text-decoration: underline;
  text-decoration-color: var(--r-border-strong);
}

.r-breadcrumb__current {
  overflow: hidden;
  color: var(--r-text);
  font-weight: var(--r-weight-medium);
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
