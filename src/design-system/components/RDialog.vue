<script setup lang="ts">
import { ref, useId } from 'vue'
import { X } from 'lucide-vue-next'
import RIconButton from './RIconButton.vue'
import { getFocusable, useEscape, useFocusTrap, useLayer, useScrollLock } from '../composables/dom'

defineOptions({ inheritAttrs: false })

const open = defineModel<boolean>('open', { default: false })

const props = withDefaults(
  defineProps<{
    title?: string
    description?: string
    /** Mono caps above the title, e.g. "STEP 2 OF 3" or "PAYMENT RUN". */
    eyebrow?: string
    /**
     * Width: sm 400px, md 520px, lg 720px. Below 520px of screen a centred dialog becomes a
     * bottom sheet and a drawer takes the full width.
     */
    size?: 'sm' | 'md' | 'lg'
    /** `center`: a modal in the middle of the screen. `right`: a full-height drawer docked to the right edge. */
    side?: 'center' | 'right'
    /** Show the close button. */
    closable?: boolean
    /** Close on Escape and on a backdrop click. Turn off for flows that must be finished or cancelled. */
    dismissible?: boolean
    /** Selector of the element to focus first. Defaults to the first field in the body. */
    initialFocus?: string
  }>(),
  { size: 'md', side: 'center', closable: true, dismissible: true },
)

const emit = defineEmits<{ closed: [] }>()

defineSlots<{
  default?(props: { close: () => void }): unknown
  header?(): unknown
  footer?(props: { close: () => void }): unknown
}>()

const panel = ref<HTMLElement | null>(null)
const body = ref<HTMLElement | null>(null)
const titleId = useId()
const descriptionId = useId()

const layer = useLayer(open)
useScrollLock(open)

function close() {
  open.value = false
}

useFocusTrap(panel, open, {
  isTop: layer.isTop,
  initialFocus: () =>
    (props.initialFocus ? panel.value?.querySelector<HTMLElement>(props.initialFocus) : null) ??
    (body.value ? getFocusable(body.value)[0] : null) ??
    panel.value,
})

useEscape(
  open,
  () => {
    if (props.dismissible) close()
  },
  layer.isTop,
)

function onBackdrop(event: PointerEvent) {
  if (event.target === event.currentTarget && props.dismissible) close()
}
</script>

<template>
  <Teleport to="body">
    <Transition :name="side === 'right' ? 'r-drawer' : 'r-dialog'" @after-leave="emit('closed')">
      <div v-if="open" class="r-dialog" :class="`r-dialog--${side}`" @pointerdown="onBackdrop">
        <div
          ref="panel"
          class="r-dialog__panel"
          :class="`r-dialog__panel--${size}`"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="title ? titleId : undefined"
          :aria-describedby="description ? descriptionId : undefined"
          tabindex="-1"
          v-bind="$attrs"
        >
          <div v-if="title || description || eyebrow || $slots.header || closable" class="r-dialog__header">
            <div class="r-dialog__heading">
              <slot name="header">
                <p v-if="eyebrow" class="r-dialog__eyebrow">{{ eyebrow }}</p>
                <h2 v-if="title" :id="titleId" class="r-dialog__title">{{ title }}</h2>
                <p v-if="description" :id="descriptionId" class="r-dialog__description">{{ description }}</p>
              </slot>
            </div>
            <RIconButton v-if="closable" label="Close" variant="ghost" size="sm" class="r-dialog__close" @click="close">
              <X />
            </RIconButton>
          </div>
          <div ref="body" class="r-dialog__body"><slot :close="close" /></div>
          <div v-if="$slots.footer" class="r-dialog__footer"><slot name="footer" :close="close" /></div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
.r-dialog {
  position: fixed;
  z-index: var(--r-z-modal);
  inset: 0;
  display: grid;
  place-items: center;
  padding: 16px;
  overflow-y: auto;
  background: var(--r-bg-overlay);
}

/* A floating panel: square, a strong 1px rule and a short shadow. */
.r-dialog__panel {
  --r-dialog-w: 520px;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: var(--r-dialog-w);
  max-height: calc(100dvh - 32px);
  border: 1px solid var(--r-border-strong);
  border-radius: var(--r-radius-surface);
  background: var(--r-bg-raised);
  box-shadow: var(--r-shadow-lg);
  color: var(--r-text);
  outline: none;
}

.r-dialog__panel--sm {
  --r-dialog-w: 400px;
}
.r-dialog__panel--lg {
  --r-dialog-w: 720px;
}

.r-dialog__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 20px 0;
}

.r-dialog__heading {
  min-width: 0;
}

.r-dialog__eyebrow {
  margin-bottom: 6px;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  line-height: 1.4;
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.r-dialog__title {
  font-size: var(--r-text-xl);
  font-weight: var(--r-weight-semibold);
  line-height: 1.3;
  letter-spacing: var(--r-tracking-snug);
}

.r-dialog__description {
  margin-top: 4px;
  color: var(--r-text-secondary);
  font-size: var(--r-text-md);
  line-height: 1.5;
}

.r-dialog__close {
  margin: -4px -8px 0 0;
}

.r-dialog__body {
  flex: 1;
  min-height: 0;
  padding: 16px 20px 20px;
  overflow-y: auto;
}

.r-dialog__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid var(--r-border);
}

/* Right: a full-height drawer docked to the right edge. Header and footer stay put; the body scrolls. */
.r-dialog--right {
  display: flex;
  align-items: stretch;
  justify-content: flex-end;
  padding: 0;
  overflow: hidden;
}

.r-dialog--right .r-dialog__panel {
  width: min(var(--r-dialog-w), 100vw);
  max-width: none;
  height: 100%;
  max-height: none;
  border-width: 0 0 0 1px;
}

.r-dialog--right .r-dialog__header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--r-border);
}

.r-dialog--right .r-dialog__close {
  margin: -2px -8px 0 0;
}

.r-dialog--right .r-dialog__body {
  padding: 20px;
}

/* Small screens: a centred dialog becomes a bottom sheet, easier to reach with a thumb. */
@media (max-width: 520px) {
  .r-dialog--center {
    align-items: end;
    padding: 0;
  }
  .r-dialog--center .r-dialog__panel {
    max-width: none;
    max-height: calc(100dvh - 24px);
    border-width: 1px 0 0;
    padding-bottom: env(safe-area-inset-bottom);
  }
  .r-dialog--center .r-dialog__header {
    padding: 16px 16px 0;
  }
  .r-dialog--center .r-dialog__body {
    padding: 16px;
  }
  .r-dialog--center .r-dialog__footer {
    padding: 12px 16px;
  }
}

/* Centred: the backdrop and panel fade, the panel rises 8px. Nothing scales. */
.r-dialog-enter-active,
.r-dialog-leave-active {
  transition: opacity var(--r-duration-base) var(--r-ease-out);
}
.r-dialog-enter-active .r-dialog__panel,
.r-dialog-leave-active .r-dialog__panel {
  transition: transform var(--r-duration-base) var(--r-ease-out);
}
.r-dialog-enter-from,
.r-dialog-leave-to {
  opacity: 0;
}
.r-dialog-enter-from .r-dialog__panel,
.r-dialog-leave-to .r-dialog__panel {
  transform: translateY(8px);
}

@media (max-width: 520px) {
  .r-dialog-enter-from .r-dialog__panel,
  .r-dialog-leave-to .r-dialog__panel {
    transform: translateY(32px);
  }
}

/* Drawer: the backdrop fades while the panel slides in from the right edge, fully opaque. */
.r-drawer-enter-active,
.r-drawer-leave-active {
  transition: background-color var(--r-duration-base) var(--r-ease-out);
}
.r-drawer-enter-active .r-dialog__panel,
.r-drawer-leave-active .r-dialog__panel {
  transition: transform var(--r-duration-base) var(--r-ease-out);
}
.r-drawer-enter-from,
.r-drawer-leave-to {
  background-color: transparent;
}
.r-drawer-enter-from .r-dialog__panel,
.r-drawer-leave-to .r-dialog__panel {
  transform: translateX(100%);
}
</style>
