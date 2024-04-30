import {
  shallowRef,
  watch,
  type ShallowRef,
  computed,
  type ComputedRef
} from 'vue'
import type { VirtualScrollProps } from '@ui/types/components/virtual-scroll'
import type { ScrollPosition } from '@ui/types/components/scroll'
import { setStyles } from '@ui/utils'
interface Options {
  /** 内容元素 */
  contentRef:
    | ShallowRef<HTMLElement | undefined>
    | ComputedRef<HTMLElement | undefined>
  /** 滚动容器元素 */
  scrollContainer:
    | ShallowRef<HTMLElement | undefined>
    | ComputedRef<HTMLElement | undefined>
  /** 虚拟列表组件的props */
  props: VirtualScrollProps
  /** 是否虚拟化 */
  virtualization: ComputedRef<boolean>
}

export function useVisibleItems(options: Options) {
  const { props, virtualization, scrollContainer, contentRef } = options

  /** 可显示的数量 */
  const visibleAmount = computed(() => {
    if (!scrollContainer.value || !virtualization.value) return 0

    const rect = scrollContainer.value.getBoundingClientRect()
    return (
      Math.ceil(rect.height / (props.itemSize ?? 32)) + props.bufferSize! * 2
    )
  })

  /** 虚拟渲染列表 */
  const visibleItems = shallowRef<any[]>()

  watch([() => props.data, scrollContainer], ([data]) => {
    if (!data) return
    if (!virtualization.value) {
      visibleItems.value = data
      return
    }

    getVisibleItems(0)
  })

  /**
   * 获取可见项
   * @param offset 滚动偏移量
   * @returns
   */
  const getVisibleItems = (offset: number) => {
    const { itemSize, data } = props

    if (!virtualization.value) {
      visibleItems.value = data
      return
    }

    if (!data) return

    // 数据起始索引
    let start = Math.floor(offset / (itemSize ?? 32))
    if (data.length - start < visibleAmount.value) {
      start = data.length - visibleAmount.value
    }

    let end = start + visibleAmount.value
    // 要保证每次渲染的数量一致

    visibleItems.value = data.slice(start, end)
  }

  const handleScroll = (position: Required<ScrollPosition>) => {
    if (!virtualization.value) return

    contentRef.value &&
      setStyles(contentRef.value, {
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`
      })
    getVisibleItems(props.direction === 'vertical' ? position.y : position.x)
  }

  return {
    visibleItems,
    handleScroll
  }
}
