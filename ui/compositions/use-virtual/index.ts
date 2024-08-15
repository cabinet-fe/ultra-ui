import { computed, type ShallowRef } from 'vue'
import { useVirtualizer } from '@tanstack/vue-virtual'

interface Options {
  /** 数量 */
  count: ShallowRef<number>
  /** 滚动容器 */
  scrollEl: ShallowRef<HTMLElement | null>
}
export function useVirtual(options: Options) {
  const { count, scrollEl } = options

  const virtualizerOptions = computed(() => {
    return {
      count: count.value,
      getScrollElement: () => scrollEl.value,
      estimateSize: () => 34,
      overscan: 5
    }
  })

  const virtualizer = useVirtualizer(virtualizerOptions)

  const virtualList = computed(() => virtualizer.value.getVirtualItems())

  /** 总高度 */
  const totalHeight = computed(() => virtualizer.value.getTotalSize())

  function scrollTo(index: number) {
    virtualizer.value.scrollToIndex(index)
  }

  return {
    virtualList,
    totalHeight,
    scrollTo
  }
}
