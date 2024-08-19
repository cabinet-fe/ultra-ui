import { computed, shallowRef, watch, type ShallowRef } from 'vue'
import { useResizeObserver } from '../use-resize-observer'

interface Options {
  /** 元素数量 */
  count: ShallowRef<number>
  /** 元素大小 */
  itemSize: number
  /** 滚动元素 */
  scrollEl: ShallowRef<HTMLElement | undefined>
  /** 元素间的间距 */
  gap?: number
  /** 缓冲数量, 默认3 */
  buffer?: number
}

interface VirtualItem {
  start: number
  size: number
  end: number
  index: number
}

export function useVirtualList(options: Options) {
  const { count, itemSize, scrollEl, gap = 0, buffer = 3 } = options

  /** 推断出的总尺寸 */
  const totalSize = shallowRef(0)

  /** 渲染数量 */
  const renderCount = shallowRef(0)

  /** 渲染起始索引 */
  let startIndex = shallowRef(0)

  /** 尺寸已经获取过的元素缓存 */
  const elementsCache = new Set<string>()

  /** 虚拟列表 */
  // const virtualList = shallowRef<VirtualItem[]>([])

  function measureElement(el: HTMLElement) {
    const index = el.dataset.index

    if (!index) {
      return console.warn('元素没有设置data-index属性')
    }

    if (!elementsCache.has(index)) {
      totalSize.value = totalSize.value - itemSize + el.offsetHeight
      elementsCache.add(index)
    }
  }

  function reCalcTotalSize(count: number) {
    return Math.round(itemSize * count + (count - 1) * gap)
  }

  watch(
    count,
    count => {
      totalSize.value = reCalcTotalSize(count)
      elementsCache.clear()
    },
    { immediate: true }
  )

  useResizeObserver({
    targets: scrollEl,
    onResize([entry]) {
      const target = entry!.target as HTMLElement
      renderCount.value = Math.ceil(target.offsetHeight / itemSize)
    }
  })

  const virtualList = computed<VirtualItem[]>(() => {
    let trueStart = startIndex.value - buffer
    let _renderCount = renderCount.value + buffer * 2

    if (trueStart < 0) {
      _renderCount += trueStart
      trueStart = 0
    }

    if (_renderCount + trueStart > count.value) {
      _renderCount -= _renderCount + trueStart - count.value
    }

    return Array.from({ length: _renderCount }).map((_, i) => {
      const index = trueStart + i
      const start = index * itemSize
      return {
        index,
        start,
        size: itemSize,
        end: start + itemSize
      }
    })
  })

  function scrollHandler(e: Event) {
    const target = e.target as HTMLElement
    const { scrollTop, scrollHeight } = target
    startIndex.value = Math.floor((scrollTop / scrollHeight) * count.value)
    // virtualList.value = Array.from({ length: renderCount }).map((_, index) => {
    //   return {
    //     index: start + index
    //   }
    // })
  }

  watch(scrollEl, (el, oldEl) => {
    if (oldEl) oldEl.removeEventListener('scroll', scrollHandler)

    el?.addEventListener('scroll', scrollHandler, { passive: true })
  })

  return {
    measureElement,
    totalSize,
    virtualList
  }
}
