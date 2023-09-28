import { type ShallowRef, watch } from 'vue'
import type { VirtualListProps } from '@ui/types/components/virtual-list'

interface Options {
  /** 容器模板引用 */
  containerRef: ShallowRef<HTMLElement | undefined>
  /** 虚拟列表组件的props */
  props: VirtualListProps
}

export function useContainerHeight(options: Options) {
  const { containerRef, props } = options

  const updateHeight = (height: number) => {
    if (!containerRef.value) return
    containerRef.value.style.height = `${height}px`
  }

  let renderedHeight = 0
  const heightRenderedIndex = new Set<number>()

  function updateItemHeight(index: number, height: number) {
    if (heightRenderedIndex.has(index)) return

    renderedHeight += height
    heightRenderedIndex.add(index)
    updateHeight(
      (props.data.length - heightRenderedIndex.size) * 32 + renderedHeight
    )
  }

  watch([() => props.data, () => props.itemSize, () => containerRef.value], ([data, itemSize, container]) => {
    if (!data.length || !container) return


    if (itemSize) {
      updateHeight(data.length * itemSize)
    } else {

      // 给个推算的高度, 当
      updateHeight(data.length * 32)
    }
  }, {
    immediate: true
  })

  return updateItemHeight
}
