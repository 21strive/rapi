import type { InjectionKey } from 'vue'

export interface TocRegistry {
  register: (id: string, title: string) => () => void
}

export const DOC_TOC: InjectionKey<TocRegistry> = Symbol('doc-toc')
