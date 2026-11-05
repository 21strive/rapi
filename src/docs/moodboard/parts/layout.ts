import { computed, onBeforeUnmount, onMounted, ref, type Ref } from 'vue'
import type { TileSize } from '../types'

/** The board's module: columns are about this wide, rows are as tall as a column is wide. */
export const MODULE = 172

/**
 * Columns for a board of the given width: as many whole modules as fit, at least two. The module
 * then stretches so the columns fill the width exactly (so a cell is never under 172px except on a
 * phone), and rows match it, so every cell is square. The board's left rule takes one pixel.
 */
export function useBoardColumns(el: Ref<HTMLElement | null>) {
  const width = ref(MODULE * 8)
  let ro: ResizeObserver | null = null

  onMounted(() => {
    if (!el.value) return
    width.value = el.value.clientWidth
    ro = new ResizeObserver((records) => {
      const next = records[0]?.contentRect.width
      if (next) width.value = next
    })
    ro.observe(el.value)
  })
  onBeforeUnmount(() => ro?.disconnect())

  const cols = computed(() => Math.max(2, Math.min(16, Math.floor((width.value - 1) / MODULE))))
  const cell = computed(() => (width.value - 1) / cols.value)
  const style = computed(() => ({
    gridTemplateColumns: `repeat(${cols.value}, minmax(0, 1fr))`,
    gridAutoRows: `${cell.value}px`,
  }))

  return { cols, cell, style }
}

export function spanOf(size: TileSize): { c: number; r: number } {
  const [c, r] = size.split('x').map(Number)
  return { c, r }
}
