/**
 * What every decision in this chapter shares: a choice that lands with a time, a short undo window
 * and then becomes final; and focus that stays inside the tile when the control a person just used
 * is swapped for its result.
 */
import { computed, nextTick, ref, watch, type Ref } from 'vue'
import { useTick } from '../../kit'

/**
 * A decision with an undo window. The countdown rides the board's shared one-second tick, so it
 * only runs while the tile is on screen and needs no timer of its own.
 */
export function useDecision<T>(undoFor = 10) {
  const choice = ref<T | null>(null) as Ref<T | null>
  const at = ref<Date | null>(null)
  const left = ref(0)
  const tick = useTick(1000)
  watch(tick, () => {
    if (left.value > 0) left.value--
  })

  function decide(value: T) {
    choice.value = value
    at.value = new Date()
    left.value = undoFor
  }

  function undo() {
    choice.value = null
    at.value = null
    left.value = 0
  }

  const decided = computed(() => choice.value !== null)
  const final = computed(() => decided.value && left.value <= 0)
  return { choice, at, left, decided, final, decide, undo }
}

/**
 * Call before a change that removes the focused control; call what it returns after the change
 * with a selector inside the tile. Focus moves there only if it was inside the tile before, so a
 * pointer reader is never yanked around and a keyboard reader never lands on the page body.
 */
export function holdFocus(root: Ref<HTMLElement | null>) {
  const inside = !!root.value && root.value.contains(document.activeElement)
  return (selector: string) =>
    nextTick(() => {
      if (inside) root.value?.querySelector<HTMLElement>(selector)?.focus()
    })
}

/** A time some minutes from now, for "until 18:02 WIB". */
export function inMinutes(minutes: number, from = new Date()): Date {
  return new Date(from.getTime() + minutes * 60_000)
}
