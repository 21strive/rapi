import { markRaw, type Component } from 'vue'
import type { Archetype, MoodEntry, Variant } from '../types'

/**
 * Declares a pattern once and stamps out its variants:
 *
 *   const fader = archetype(Fader, { name: 'Channel fader', hint: '…', why: '…', tags: ['audio'] })
 *   export const entries = [fader({ id: 'tune-fader-mix', size: '1x2', domain: 'audio', props: { … } })]
 */
export function archetype(is: Component, meta: Omit<Archetype, 'is'>) {
  const base: Archetype = { is: markRaw(is), ...meta }
  const make = (variant: Variant): MoodEntry => ({
    id: variant.id,
    is: base.is,
    props: variant.props,
    size: variant.size,
    name: variant.name ?? base.name,
    hint: variant.hint ?? base.hint,
    why: base.why,
    domain: variant.domain,
    surface: variant.surface,
    tags: [...(base.tags ?? []), ...(variant.tags ?? [])],
  })
  return Object.assign(make, { meta: base })
}
