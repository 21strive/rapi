<script setup lang="ts">
import { computed } from 'vue'
import { priorityLabel, type PriorityId } from '../data'

/** Priority as a mark: three rising bars lit to the level, a signal square for urgent, dashes for none. */
const props = defineProps<{ priority: PriorityId }>()
const lit = computed(() => ({ 0: 0, 1: 3, 2: 3, 3: 2, 4: 1 })[props.priority])
</script>

<template>
  <span class="s-issues-pm" role="img" :aria-label="`Priority: ${priorityLabel(priority)}`" :title="priorityLabel(priority)">
    <span v-if="priority === 1" class="s-issues-pm__urgent" aria-hidden="true">!</span>
    <span v-else-if="priority === 0" class="s-issues-pm__none" aria-hidden="true"><i /><i /><i /></span>
    <span v-else class="s-issues-pm__bars" aria-hidden="true">
      <i v-for="n in 3" :key="n" :class="{ 'is-lit': n <= lit }" :style="{ height: `${2 + n * 3}px` }" />
    </span>
  </span>
</template>

<style scoped>
.s-issues-pm {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  flex: none;
}
.s-issues-pm__urgent {
  display: grid;
  place-items: center;
  width: 14px;
  height: 14px;
  background: var(--r-signal);
  color: var(--r-on-signal);
  font-family: var(--r-font-mono);
  font-size: 10px;
  font-weight: var(--r-weight-bold);
  line-height: 1;
}
.s-issues-pm__bars {
  display: inline-flex;
  align-items: flex-end;
  gap: 2px;
  height: 12px;
}
.s-issues-pm__bars i {
  display: block;
  width: 3px;
  background: var(--r-border-strong);
}
.s-issues-pm__bars i.is-lit {
  background: var(--r-text-secondary);
}
.s-issues-pm__none {
  display: inline-flex;
  gap: 2px;
}
.s-issues-pm__none i {
  display: block;
  width: 3px;
  height: 1.5px;
  background: var(--r-text-tertiary);
}
</style>
