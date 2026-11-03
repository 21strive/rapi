<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { useToast, type ToastEntry } from '../composables/toast'

/**
 * Renders the toast stack. Mount it once near the app root; show toasts with useToast().
 * Toasts are square dark islands, bottom-right, with a tone lamp and an optional action.
 */
withDefaults(defineProps<{ placement?: 'bottom-right' | 'bottom-center' | 'top-right' }>(), {
  placement: 'bottom-right',
})

// The root is a Teleport, so class and other attributes go to the stack element instead.
defineOptions({ inheritAttrs: false })

const { toasts, dismiss } = useToast()

function runAction(toast: ToastEntry) {
  toast.action?.onClick()
  dismiss(toast.id)
}
</script>

<template>
  <Teleport to="body">
    <!-- The live region is always in the page, so toasts added later are announced, and it is
         not atomic, so a new toast is read on its own instead of the whole stack again. -->
    <TransitionGroup
      tag="div"
      name="r-toast"
      class="r-toaster"
      :class="`r-toaster--${placement}`"
      role="status"
      aria-live="polite"
      aria-atomic="false"
      v-bind="$attrs"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="r-toast"
        :class="`r-tone-${toast.tone ?? 'neutral'}`"
        data-theme="dark"
      >
        <span class="r-toast__lamp" aria-hidden="true" />
        <div class="r-toast__body">
          <p class="r-toast__title">{{ toast.title }}</p>
          <p v-if="toast.body" class="r-toast__text">{{ toast.body }}</p>
        </div>
        <button v-if="toast.action" type="button" class="r-toast__action" @click="runAction(toast)">
          {{ toast.action.label }}
        </button>
        <button type="button" class="r-toast__dismiss" aria-label="Dismiss notification" @click="dismiss(toast.id)">
          <X />
        </button>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<style>
.r-toaster {
  position: fixed;
  z-index: var(--r-z-toast);
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 360px;
  max-width: calc(100vw - 32px);
  pointer-events: none;
}

.r-toaster--bottom-right {
  right: 16px;
  bottom: 16px;
}
.r-toaster--bottom-center {
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
}
/* Newest nearest the corner: at the bottom of a bottom stack, at the top of a top stack. */
.r-toaster--top-right {
  top: 16px;
  right: 16px;
  flex-direction: column-reverse;
}

/* ── One toast: a square dark island ───────────────────────────────────── */
.r-toast {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
  padding: 10px 8px 10px 14px;
  border: 1px solid var(--r-border-strong);
  border-radius: var(--r-radius-surface);
  background: var(--r-bg-raised);
  box-shadow: var(--r-shadow-md);
  color: var(--r-text);
  pointer-events: auto;
}

.r-toast__lamp {
  flex: none;
  width: 6px;
  height: 6px;
  margin-top: 9px;
  border-radius: var(--r-radius-round);
  background: var(--tone-lamp);
}

.r-toast__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  padding: 2px 0;
}

.r-toast__title {
  color: var(--r-text);
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-semibold);
  line-height: 20px;
  letter-spacing: var(--r-tracking-snug);
}

.r-toast__text {
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
  line-height: 18px;
}

.r-toast__action {
  display: inline-flex;
  flex: none;
  align-items: center;
  height: 24px;
  margin-top: 2px;
  padding: 0 8px;
  border: 1px solid var(--r-border-strong);
  border-radius: var(--r-radius-control);
  background: transparent;
  color: var(--r-text);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background-color var(--r-duration-fast) var(--r-ease-out),
    border-color var(--r-duration-fast) var(--r-ease-out);
}
.r-toast__action:hover {
  border-color: var(--r-text-tertiary);
  background: var(--r-bg-hover);
}

.r-toast__dismiss {
  display: inline-grid;
  flex: none;
  place-items: center;
  width: 24px;
  height: 24px;
  margin-top: 2px;
  padding: 0;
  border: 0;
  border-radius: var(--r-radius-control);
  background: none;
  color: var(--r-text-tertiary);
  cursor: pointer;
  transition:
    background-color var(--r-duration-fast) var(--r-ease-out),
    color var(--r-duration-fast) var(--r-ease-out);
}
.r-toast__dismiss:hover {
  background: var(--r-bg-hover);
  color: var(--r-text);
}
.r-toast__dismiss svg {
  width: 14px;
  height: 14px;
}

/* ── Enter and leave: 160ms, a short slide and a fade ──────────────────── */
.r-toast-enter-active,
.r-toast-leave-active {
  transition:
    opacity var(--r-duration-base) var(--r-ease-out),
    transform var(--r-duration-base) var(--r-ease-out);
}
.r-toast-enter-from,
.r-toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
.r-toaster--top-right .r-toast-enter-from,
.r-toaster--top-right .r-toast-leave-to {
  transform: translateY(-8px);
}
</style>
