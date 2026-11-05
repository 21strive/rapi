<script setup lang="ts">
/**
 * A service that is not itself today, said once where people use it: what is affected, since
 * when, and the one thing a reader can do, which is to be told when it changes. Subscribe asks for
 * a channel only when there is more than one.
 */
import { ref } from 'vue'
import { BellPlus, Check } from 'lucide-vue-next'
import { RButton, RSegmented, RStatus } from '@/design-system'
import { useFocusKeeper } from './shared'

interface Update {
  time: string
  text: string
}

const props = withDefaults(
  defineProps<{
    /** Mono caps: "QRIS acquiring". */
    service: string
    /** The word on the lamp: "Degraded", "Partial outage", "Planned". */
    word: string
    tone: 'warning' | 'danger' | 'neutral'
    title: string
    /** "Since 13:42 WIB · updated 4 min ago". */
    since: string
    updates?: Update[]
    /** Channels to choose from; the first is the default. */
    channels?: string[]
    /** Where updates go, said after subscribing: "rina@kopralabs.id". */
    to?: string
    /** `strip` 2x1 to 4x1 · `panel` 2x2. */
    layout?: 'strip' | 'panel'
  }>(),
  { updates: () => [], channels: () => ['Email'], layout: 'strip' },
)

const channel = ref(props.channels[0])
const subscribed = ref(false)
const { bind, keep } = useFocusKeeper()
const options = props.channels.map((c) => ({ label: c, value: c }))

function subscribe() {
  keep('[data-focus="unsub"]')
  subscribed.value = true
}

function unsubscribe() {
  keep('[data-focus="sub"]')
  subscribed.value = false
}
</script>

<template>
  <div :ref="bind" class="mk sb" :class="`sb--${layout}`">
    <div class="sb__head">
      <RStatus :tone="tone" :label="word" :pulse="tone !== 'neutral'" size="sm" />
      <span class="r-label mk-truncate">{{ service }}</span>
    </div>

    <div class="sb__main">
      <div class="sb__text">
        <p class="sb__title">{{ title }}</p>
        <p class="sb__since">{{ since }}</p>
      </div>

      <div class="sb__act" aria-live="polite">
        <template v-if="!subscribed">
          <RSegmented
            v-if="channels.length > 1 && layout === 'panel'"
            v-model="channel"
            :options="options"
            size="sm"
            block
            label="Send updates by"
          />
          <RButton size="sm" variant="outline" data-focus="sub" @click="subscribe">
            <template #leading><BellPlus :size="14" aria-hidden="true" /></template>
            Subscribe
          </RButton>
        </template>
        <template v-else>
          <span class="sb__done">
            <Check :size="14" aria-hidden="true" />
            <span class="mk-truncate">Updates by {{ channel.toLowerCase() }}{{ to ? ` to ${to}` : '' }}</span>
          </span>
          <RButton size="sm" variant="ghost" data-focus="unsub" @click="unsubscribe">Unsubscribe</RButton>
        </template>
      </div>
    </div>

    <ol v-if="updates.length && layout === 'panel'" class="sb__log" aria-label="Updates">
      <li v-for="u in updates" :key="u.time">
        <span class="sb__time">{{ u.time }}</span>
        <span class="sb__line">{{ u.text }}</span>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.sb {
  container-type: inline-size;
  gap: 8px;
}

.sb__head {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.sb__main {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.sb__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.sb__title {
  display: -webkit-box;
  overflow: hidden;
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  line-height: 1.35;
  letter-spacing: var(--r-tracking-snug);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.sb__since {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.sb__act {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.sb--panel .sb__act {
  flex-direction: column;
  align-items: stretch;
}

.sb__done {
  display: inline-flex;
  flex: 1 1 auto;
  align-items: center;
  gap: 6px;
  min-width: 0;
  color: var(--r-success-text);
  font-size: var(--r-text-xs);
}

.sb__log {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  margin-top: auto;
  padding-top: 10px;
  overflow: hidden;
  border-top: 1px solid var(--r-border-subtle);
}

.sb__log li {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: 8px;
}

.sb__time {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  line-height: 1.6;
  font-variant-numeric: tabular-nums;
}

.sb__line {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

/* A wide strip puts the action on the right of the words. */
@container (min-width: 440px) {
  .sb--strip .sb__main {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }

  .sb--strip .sb__act {
    flex: none;
  }
}
</style>
