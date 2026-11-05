<script setup lang="ts">
/**
 * The desk: an AI-first screen. The conversation is the spine, on the left with its own scroll;
 * around it sit only the surfaces that earn a screen (DESIGN.md, "What gets a screen"): the state
 * to glance at, the decisions waiting for a person, the proof of what was done, and a hand control
 * when one is needed. No navigation tree, no settings pages, no form longer than a field or two.
 *
 * Slots: `thread` and `composer` fill the conversation column; the default slot holds the surfaces
 * (usually DeskZone panels); `strip`/`meta` extend the mono strip; `actions` sit by the title.
 */
import { RLogo, RStatus } from '@/design-system'

withDefaults(
  defineProps<{
    /** Product or system in the strip: "TREASURY". */
    product: string
    /** The screen's title, above the surfaces. */
    title: string
    /** The agent the person talks to: "Simpul". */
    agent: string
    /** What the agent is doing, next to its name: "Watching 14 accounts". */
    agentStatus?: string
    mark?: 'rapi' | '21strive' | 'none'
    /** Width of the conversation column on wide screens. */
    threadWidth?: number
  }>(),
  { mark: '21strive', threadWidth: 440 },
)

defineSlots<{
  strip?(): unknown
  meta?(): unknown
  actions?(): unknown
  thread?(): unknown
  composer?(): unknown
  default?(): unknown
}>()
</script>

<template>
  <div class="desk" :style="{ '--desk-thread': `${threadWidth}px` }">
    <header class="desk__strip">
      <div class="desk__strip-start">
        <RLogo v-if="mark !== 'none'" :brand="mark" variant="mark" :size="11" label="" />
        <span class="desk__product">{{ product }}</span>
        <slot name="strip" />
      </div>
      <div class="desk__strip-end"><slot name="meta" /></div>
    </header>

    <div class="desk__frame">
      <section class="desk__talk" :aria-label="`Conversation with ${agent}`">
        <div class="desk__talk-head">
          <span class="r-eyebrow">{{ agent }}</span>
          <RStatus v-if="agentStatus" tone="success" :label="agentStatus" size="sm" class="desk__agent-status" />
        </div>
        <div class="desk__thread"><slot name="thread" /></div>
        <div v-if="$slots.composer" class="desk__composer"><slot name="composer" /></div>
      </section>

      <main class="desk__surfaces">
        <div class="desk__head">
          <h1 class="desk__title">{{ title }}</h1>
          <div v-if="$slots.actions" class="desk__actions"><slot name="actions" /></div>
        </div>
        <div class="desk__zones"><slot /></div>
      </main>
    </div>
  </div>
</template>

<style>
.desk {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  background: var(--r-bg-canvas);
  color: var(--r-text);
}

/* The mono strip, as on every Rapi screen. */
.desk__strip {
  position: sticky;
  top: 0;
  z-index: var(--r-z-sticky);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: 32px;
  padding: 0 16px;
  border-bottom: 1px solid var(--r-border);
  background: var(--r-bg-surface);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
  white-space: nowrap;
}

.desk__strip-start,
.desk__strip-end {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  overflow: hidden;
}

.desk__strip-start {
  flex: 1 1 auto;
}

.desk__strip-end {
  flex: 0 1 auto;
  color: var(--r-text-tertiary);
}

.desk__product {
  flex: none;
}

/* Two columns: the conversation (its own scroll) and the surfaces (their own scroll). */
/* Exactly the screen under the strip: it never grows with its content, so the composer stays in
   view and each column scrolls on its own. */
.desk__frame {
  display: grid;
  flex: none;
  grid-template-columns: var(--desk-thread) minmax(0, 1fr);
  height: calc(100dvh - 32px);
  min-height: 0;
}

.desk__talk {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  border-right: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}

.desk__talk-head {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: 44px;
  padding: 0 16px;
  border-bottom: 1px solid var(--r-border);
}

.desk__agent-status {
  min-width: 0;
}

.desk__thread {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
}

.desk__composer {
  flex: none;
  padding: 12px 16px 16px;
  border-top: 1px solid var(--r-border);
}

/* Positioned, so screen-reader-only text inside stays within this scroll area instead of the page. */
.desk__surfaces {
  position: relative;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  padding: 0 24px 96px;
}

.desk__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 24px;
  min-height: 44px;
  padding: 18px 0 16px;
}

.desk__title {
  font-size: var(--r-text-xl);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-tight);
  line-height: 1.2;
}

.desk__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.desk__zones {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* The docs' floating sample toolbar sits at the bottom centre of the window. Between 1024 and
   1440 px it would cover the composer's send key, so the composer keeps clear of it there. */
@media (min-width: 1024px) and (max-width: 1439px) {
  .desk__composer {
    padding-bottom: 64px;
  }
}

/* Narrow screens: the conversation first, at most most of a screen tall, then the surfaces. */
@media (max-width: 1023px) {
  .desk__frame {
    display: block;
    height: auto;
  }
  .desk__talk {
    height: min(78dvh, 720px);
    border-right: 0;
    border-bottom: 1px solid var(--r-border);
  }
  .desk__surfaces {
    overflow: visible;
    padding: 0 16px 96px;
  }
}
</style>
