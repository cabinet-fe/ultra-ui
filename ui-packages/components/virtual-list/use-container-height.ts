import { type ShallowRef, watchEffect } from 'vue'
import type { VirtualListProps } from '@ui/types/components/virtual-list'
import { setStyles } from '@ui/utils'

interface Options {
  /** 容器模板引用 */
  containerRef: ShallowRef<HTMLElement | undefined>
  /** 虚拟列表组件的props */
  props: VirtualListProps
}

/**
 * 容器高度控制
 * @param options 选项
 * @returns
 */
export function useContainerHeight(options: Options) {
  const { containerRef, props } = options

  const updateHeight = (height?: number) => {
    if (!containerRef.value) return
    setStyles(containerRef.value, { height: height ? height + 'px' : '' })
  }

  let renderedHeight = 0
  const heightRenderedIndex = new Set<number>()

  function updateItemHeight(index: number, height: number) {
    if (heightRenderedIndex.has(index) || !props.data) return

    renderedHeight += height
    heightRenderedIndex.add(index)
    updateHeight(
      (props.data.length - heightRenderedIndex.size) * 32 + renderedHeight
    )
  }

  watchEffect(() => {
    const { data, itemHeight, virtualThreshold } = props
    if (!containerRef.value) return

    if ((data?.length ?? 0) < virtualThreshold!) {
      return updateHeight()
    }
    if (itemHeight) {
      return updateHeight(
        data?.length !== undefined ? data.length * itemHeight : undefined
      )
    }

    updateHeight(data!.length * 32)
  })

  return {
    updateItemHeight
  }
}
