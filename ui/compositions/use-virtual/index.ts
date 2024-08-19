import { computed, type ComputedRef, type ShallowRef } from 'vue'
import { useVirtualizer, type VirtualItem } from '@tanstack/vue-virtual'

interface Options {
  /** 指定启用虚拟列表的阈值 */
  virtualThreshold?: number
  /** 数量 */
  count: ShallowRef<number>
  /** 滚动容器 */
  scrollEl: ShallowRef<HTMLElement | null>
  /** 估算高度(宽度) */
  estimateSize?: (index: number) => number
  /** 列表项之间的间距 */
  gap?: number
}

export type VirtualReturned = {
  /** 虚拟列表 */
  virtualList: ComputedRef<VirtualItem<Element>[]>
  /** 总高度 */
  totalHeight: ComputedRef<number | undefined>
  /** 测量元素高度 */
  measureElement: (el: Element) => void
  /** 滚动到指定索引 */
  scrollTo: (index: number) => void
  /** 是否启用虚拟列表 */
  virtualEnabled: ComputedRef<boolean>
}

export function useVirtual(options: Options): VirtualReturned {
  const { count, scrollEl, estimateSize, virtualThreshold, gap } = options

  const enabled = computed(() => {
    return virtualThreshold ? count.value > virtualThreshold : true
  })

  const virtualizerOptions = computed(() => {
    return {
      enabled: enabled.value,
      count: count.value,
      getScrollElement: () => scrollEl.value,
      estimateSize: estimateSize ?? (() => 34),
      overscan: 3,
      gap
    }
  })

  const virtualizer = useVirtualizer(virtualizerOptions)

  const virtualList = computed(() => {
    return virtualizer.value.getVirtualItems()
  })

  /** 总高度 */
  const totalHeight = computed(() => {
    return enabled.value ? virtualizer.value.getTotalSize() : undefined
  })

  function scrollTo(index: number) {
    virtualizer.value.scrollToIndex(index)
  }

  /** 测量元素高度 */
  function measureElement(el: Element) {
    if (!el) return

    virtualizer.value.measureElement(el)

    return undefined
  }

  return {
    virtualEnabled: enabled,
    virtualList,
    totalHeight,
    measureElement,
    scrollTo
  }
}
