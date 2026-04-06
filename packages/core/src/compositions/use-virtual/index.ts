import {
  computed,
  isRef,
  onScopeDispose,
  shallowRef,
  watch,
  type ComputedRef,
  type Ref,
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
  virtualThreshold?: number | Ref<number | undefined>
  /** 数量 */
  count: Ref<number>
  /** 滚动容器 */
  scrollEl: ShallowRef<HTMLElement | null>
  /** 估算高度(宽度) */
  estimateSize?: (index: number) => number
  /** 列表项之间的间距 */
  gap?: number
}

type CustomVirtualItem = Omit<VirtualItem, 'key'> & {
  key: number | string
}

export type VirtualReturned = {
  /** 虚拟列表 */
  virtualList: ShallowRef<CustomVirtualItem[]>
  /** 总高度 */
  totalHeight: ShallowRef<number>
  /** 测量元素高度 */
  measureElement: (el: any) => void
  /** 滚动到指定索引 */
  scrollTo: (index: number) => void
  /** 是否启用虚拟列表 */
  virtualEnabled: ComputedRef<boolean>
}

export function useVirtual(options: Options): VirtualReturned {
  const { count, scrollEl, estimateSize, virtualThreshold, gap } = options

  const enabled = computed(() => {
    if (isRef(virtualThreshold)) {
      return virtualThreshold.value
        ? count.value > virtualThreshold.value
        : true
    }

    return virtualThreshold ? count.value > virtualThreshold : true
  })

  const defaultEstimateSize = () => 34

  const virtualList = shallowRef<CustomVirtualItem[]>([])

  /** 总高度 */
  const totalHeight = shallowRef(0)

  function updateVirtualList() {
    if (enabled.value) {
      totalHeight.value = v.getTotalSize()
      virtualList.value = v.getVirtualItems() as CustomVirtualItem[]
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
      onChange: updateVirtualList
    }
  })

  const v = new Virtualizer(virtualizerOptions.value)

  updateVirtualList()

  const cleanup = v._didMount()

  watch(
    scrollEl,
    el => {
      el && v._willUpdate()
    },
    { immediate: true }
  )

  watch(
    () => virtualizerOptions.value,
    options => {
      v.setOptions(options)

      v._willUpdate()

      updateVirtualList()
    }
  )

  onScopeDispose(() => {
    cleanup()
  })

  function scrollTo(index: number) {
    v.scrollToIndex(index, {
      align: 'center'
    })
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
