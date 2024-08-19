import {
  computed,
  onScopeDispose,
  shallowRef,
  watch,
  type ComputedRef,
  type ShallowRef
} from 'vue'
import {
  elementScroll,
  observeElementOffset,
  observeElementRect,
  type VirtualItem,
  Virtualizer
} from '@tanstack/vue-virtual'

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
  virtualList: ShallowRef<VirtualItem<Element>[]>
  /** 总高度 */
  totalHeight: ShallowRef<number>
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

  const defaultEstimateSize = () => 34

  const virtualList = shallowRef<VirtualItem<Element>[]>([])

  /** 总高度 */
  const totalHeight = shallowRef(0)

  const onChange = () => {
    if (enabled.value) {
      totalHeight.value = v.getTotalSize()
      virtualList.value = v.getVirtualItems()
    }
  }

  const virtualizerOptions = computed(() => {
    return {
      enabled: enabled.value,
      count: count.value,
      getScrollElement: () => scrollEl.value,
      estimateSize: estimateSize ?? defaultEstimateSize,
      overscan: 3,
      gap,
      observeElementRect: observeElementRect,
      observeElementOffset: observeElementOffset,
      scrollToFn: elementScroll,
      onChange
    }
  })

  const v = new Virtualizer(virtualizerOptions.value)

  const cleanup = v._didMount()

  watch(
    scrollEl,
    el => {
      el && v._willUpdate()
    },
    { immediate: true }
  )

  watch(virtualizerOptions, options => {
    v.setOptions(options)

    v._willUpdate()

    onChange()
  })

  onScopeDispose(() => {
    cleanup()
  })

  // const virtualizer = useVirtualizer(virtualizerOptions)

  // const virtualList = computed(() => {
  //   return virtualizer.value.getVirtualItems()
  // })

  function scrollTo(index: number) {
    v.scrollToIndex(index)
  }

  /** 测量元素高度 */
  function measureElement(el: Element) {
    if (!el) return

    v.measureElement(el)

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
