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
    /** sm 400px, md 520px, lg 720px. Below 520px wide the dialog becomes a bottom sheet. */
    size?: 'sm' | 'md' | 'lg'
    /** Show the close button. */
    closable?: boolean
    /** Close on Escape and on a backdrop click. Turn off for flows that must be finished or cancelled. */
    dismissible?: boolean
    /** Selector of the element to focus first. Defaults to the first field in the body. */
    initialFocus?: string
  }>(),
  { size: 'md', closable: true, dismissible: true },
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
    <Transition name="r-dialog" @after-leave="emit('closed')">
      <div v-if="open" class="r-dialog" @pointerdown="onBackdrop">
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
          <div v-if="title || description || $slots.header || closable" class="r-dialog__header">
            <div class="r-dialog__heading">
              <slot name="header">
                <h2 v-if="title" :id="titleId" class="r-dialog__title">{{ title }}</h2>
                <p v-if="description" :id="descriptionId" class="r-dialog__description">{{ description }}</p>
              </slot>
            </div>
            <RIconButton v-if="closable" label="Close" variant="soft" size="sm" shape="square" class="r-dialog__close" @click="close">
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
  backdrop-filter: blur(2px);
}

.r-dialog__panel {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 520px;
  max-height: calc(100dvh - 32px);
  border: 1px solid var(--r-border-subtle);
  border-radius: var(--r-radius-xl);
  background: var(--r-bg-raised);
  box-shadow: var(--r-shadow-xl);
  color: var(--r-text);
  outline: none;
}

[data-theme='dark'] .r-dialog__panel {
  border-color: var(--r-border);
}

.r-dialog__panel--sm {
  max-width: 400px;
}
.r-dialog__panel--lg {
  max-width: 720px;
}

.r-dialog__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 24px 0;
}

.r-dialog__heading {
  min-width: 0;
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
  margin: -2px -6px 0 0;
}

.r-dialog__body {
  flex: 1;
  min-height: 0;
  padding: 20px 24px;
  overflow-y: auto;
}

.r-dialog__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 24px 20px;
  border-top: 1px solid var(--r-border-subtle);
}

/* Small screens: a bottom sheet is easier to reach with a thumb. */
@media (max-width: 520px) {
  .r-dialog {
    align-items: end;
    padding: 0;
  }
  .r-dialog__panel,
  .r-dialog__panel--sm,
  .r-dialog__panel--lg {
    max-width: none;
    max-height: calc(100dvh - 24px);
    border-radius: var(--r-radius-xl) var(--r-radius-xl) 0 0;
    padding-bottom: env(safe-area-inset-bottom);
  }
  .r-dialog__header {
    padding: 20px 20px 0;
  }
  .r-dialog__body {
    padding: 16px 20px;
  }
  .r-dialog__footer {
    padding: 14px 20px 18px;
  }
}

.r-dialog-enter-active,
.r-dialog-leave-active {
  transition: opacity var(--r-duration-base) var(--r-ease-out);
}
.r-dialog-enter-active .r-dialog__panel,
.r-dialog-leave-active .r-dialog__panel {
  transition:
    transform var(--r-duration-base) var(--r-ease-out),
    opacity var(--r-duration-base) var(--r-ease-out);
}
.r-dialog-enter-from,
.r-dialog-leave-to {
  opacity: 0;
}
.r-dialog-enter-from .r-dialog__panel,
.r-dialog-leave-to .r-dialog__panel {
  opacity: 0;
  transform: translateY(10px) scale(0.97);
}

@media (max-width: 520px) {
  .r-dialog-enter-from .r-dialog__panel,
  .r-dialog-leave-to .r-dialog__panel {
    transform: translateY(32px);
  }
}
</style>
